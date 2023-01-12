import stringify from 'fast-json-stable-stringify'
import { Account, Address, BN, bufferToHex, isValidAddress, toAscii, toBuffer } from 'ethereumjs-util'
import { AccessListEIP2930Transaction, Transaction } from '@ethereumjs/tx'
import Common, { Chain } from '@ethereumjs/common'
import VM from '@ethereumjs/vm'
import ShardeumVM from './vm'
import { parse as parseUrl } from 'url'
import got from 'got'
import 'dotenv/config'
import { ShardeumState, TransactionState } from './state'
import { __ShardFunctions, nestedCountersInstance, ShardusTypes } from '@shardus/core'
import { ContractByteWrite } from './state/transactionState'
import { version } from '../package.json'
import {
  AccountType,
  BlockMap,
  ClaimRewardTX,
  DebugTx,
  DebugTXType,
  DevAccount,
  EVMAccountInfo,
  InitRewardTimes,
  InternalTx,
  InternalTXType,
  NetworkAccount,
  NetworkParameters,
  NodeAccount,
  NodeAccount2,
  OperatorAccountInfo,
  OurAppDefinedData,
  ReadableReceipt,
  SetCertTime,
  StakeCoinsTX,
  UnstakeCoinsTX,
  WrappedAccount,
  WrappedEVMAccount,
  WrappedStates,
} from './shardeum/shardeumTypes'
import { getAccountShardusAddress, toShardusAddress, toShardusAddressWithKey } from './shardeum/evmAddress'
import { ShardeumFlags, updateServicePoints, updateShardeumFlag } from './shardeum/shardeumFlags'
import * as WrappedEVMAccountFunctions from './shardeum/wrappedEVMAccountFunctions'
import {
  fixDeserializedWrappedEVMAccount,
  predictContractAddressDirect,
  updateEthAccountHash,
} from './shardeum/wrappedEVMAccountFunctions'
import {
  emptyCodeHash,
  isEqualOrNewerVersion,
  replacer,
  SerializeToJsonString,
  sleep,
  zeroAddressStr,
  _base16BNParser,
  _readableSHM,
} from './utils'
import config from './config'
import { RunTxResult } from '@ethereumjs/vm/dist/runTx'
import { RunState } from '@ethereumjs/vm/dist/evm/interpreter'
import Wallet from 'ethereumjs-wallet'
import { Block } from '@ethereumjs/block'
import { ShardeumBlock } from './block/blockchain'

import * as AccountsStorage from './storage/accountStorage'
import { StateManager } from '@ethereumjs/vm/dist/state'
import { sync, validateTransaction } from './setup'
import {
  applySetCertTimeTx,
  injectSetCertTimeTx,
  isSetCertTimeTx,
  validateSetCertTimeTx,
} from './tx/setCertTime'
import { applyClaimRewardTx, injectClaimRewardTx, validateClaimRewardTx } from './tx/claimReward'
import { Request, Response } from 'express'
import {
  CertSignaturesResult,
  queryCertificate,
  queryCertificateHandler,
  StakeCert,
  ValidatorError,
} from './handlers/queryCertificate'
import * as InitRewardTimesTx from './tx/initRewardTimes'
import _ from 'lodash'
import { isDebugTx, isInternalTx, isInternalTXGlobal, verify, crypto } from './setup/helpers'

const env = process.env

let { shardusFactory } = require('@shardus/core')

export const networkAccount = '0'.repeat(64) //address

// HELPFUL TIME CONSTANTS IN MILLISECONDS
export const ONE_SECOND = 1000
export const ONE_MINUTE = 60 * ONE_SECOND
export const ONE_HOUR = 60 * ONE_MINUTE
export const ONE_DAY = 24 * ONE_HOUR
// export const ONE_WEEK = 7 * ONE_DAY
// export const ONE_YEAR = 365 * ONE_DAY

let latestBlock = 0
export let blocks: BlockMap = {}
export let blocksByHash = {}
export let readableBlocks = {}

const oneEth = new BN(10).pow(new BN(18))

// INITIAL NETWORK PARAMETERS FOR Shardeum
export const INITIAL_PARAMETERS: NetworkParameters = {
  title: 'Initial parameters',
  description: 'These are the initial network parameters Shardeum started with',
  nodeRewardInterval: ONE_MINUTE * 10, // 10 minutes for testing
  nodeRewardAmount: oneEth, // 1 SHM
  nodePenalty: oneEth.mul(new BN(10)), // 10 SHM
  stakeRequired: oneEth.mul(new BN(10)), // 10 SHM
  maintenanceInterval: ONE_DAY,
  maintenanceFee: 0,
}

export let genesisAccounts = []

const ERC20_BALANCEOF_CODE = '0x70a08231'

const shardus = shardusFactory(config, {
  customStringifier: SerializeToJsonString,
})
const profilerInstance = shardus.getShardusProfiler()

// const pay_address = '0x50F6D9E5771361Ec8b95D6cfb8aC186342B70120' // testing account for node_reward
const random_wallet = Wallet.generate()
const pay_address = random_wallet.getAddressString()
//TODO need to put a task in to remove the old node rewards
console.log('old Pay Address (not for new staking/rewards) ', pay_address, isValidAddress(pay_address))

//console.log('Pk',random_wallet.getPublicKey())
//console.log('pk',random_wallet.getPrivateKey())

let nodeRewardCount = 0

let lastCertTimeTxTimestamp: number = 0
let lastCertTimeTxCycle: number | null = null

export const certExpireSoonCycles = 3

export let stakeCert: StakeCert = null

function isDebugMode() {
  //@ts-ignore
  return config.server.mode === 'debug'
}

// grab this
const pointsAverageInterval = 2 // seconds

let servicePointSpendHistory: { points: number; ts: number }[] = []
let debugLastTotalServicePoints = 0

/**
 * Allows us to attempt to spend points.  We have ShardeumFlags.ServicePointsPerSecond
 * that can be spent as a total bucket
 * @param points
 * @returns
 */
function trySpendServicePoints(points: number): boolean {
  let nowTs = Date.now()
  let maxAge = 1000 * pointsAverageInterval
  let maxAllowedPoints = ShardeumFlags.ServicePointsPerSecond * pointsAverageInterval
  let totalPoints = 0
  //remove old entries, count points
  for (let i = servicePointSpendHistory.length - 1; i >= 0; i--) {
    let entry = servicePointSpendHistory[i]
    let age = nowTs - entry.ts
    //if the element is too old remove it
    if (age > maxAge) {
      servicePointSpendHistory.pop()
    } else {
      totalPoints += entry.points
    }
  }

  debugLastTotalServicePoints = totalPoints
  //is the new operation too expensive?
  if (totalPoints + points > maxAllowedPoints) {
    return false
  }

  //Add new entry to array
  let newEntry = { points, ts: nowTs }
  servicePointSpendHistory.unshift(newEntry)

  return true
}

function pruneOldBlocks() {
  let maxOldBlocksCount = ShardeumFlags.maxNumberOfOldBlocks || 256
  if (latestBlock > maxOldBlocksCount) {
    for (let i = 10; i > 0; i--) {
      let block = latestBlock - maxOldBlocksCount - i
      if (blocks[block]) {
        try {
          let blockHash = readableBlocks[block].hash
          delete blocks[block]
          delete blocksByHash[blockHash]
          delete readableBlocks[block]
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Lengths of blocks after pruning', Object.keys(blocksByHash).length, Object.keys(readableBlocks).length)
        } catch (e) {
          console.log('Error: pruneOldBlocks', e)
        }
      }
    }
  }
}

function convertToReadableBlock(block: Block) {
  let defaultBlock = {
    difficulty: '0x4ea3f27bc',
    extraData: '0x476574682f4c5649562f76312e302e302f6c696e75782f676f312e342e32',
    gasLimit: '0x4a817c800', // 20000000000   "0x1388",
    gasUsed: '0x0',
    hash: '0xdc0818cf78f21a8e70579cb46a43643f78291264dda342ae31049421c82d21ae',
    logsBloom:
      '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    miner: '0xbb7b8287f3f0a933474a79eae42cbca977791171',
    mixHash: '0x4fffe9ae21f1c9e15207b1f472d5bbdd68c9595d461666602f2be20daf5e7843',
    nonce: '0x689056015818adbe',
    number: '0',
    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    receiptsRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
    sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
    size: '0x220',
    stateRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: '0x55ba467c',
    totalDifficulty: '0x78ed983323d',
    transactions: [],
    transactionsRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
    uncles: [],
  }
  defaultBlock.number = '0x' + block.header.number.toString('hex')
  defaultBlock.timestamp = '0x' + block.header.timestamp.toString('hex')
  defaultBlock.hash = '0x' + block.header.hash().toString('hex')
  let previousBlockNumber = String(block.header.number.toNumber() - 1)
  let previousBlock = readableBlocks[previousBlockNumber]
  if (previousBlock) defaultBlock.parentHash = previousBlock.hash
  return defaultBlock
}

function createNewBlock(blockNumber, timestamp): Block {
  if (blocks[blockNumber]) return blocks[blockNumber]
  if (!blocks[blockNumber]) {
    let timestampInSecond = timestamp ? Math.round(timestamp / 1000) : Math.round(Date.now() / 1000)
    const blockData = {
      header: { number: blockNumber, timestamp: new BN(timestampInSecond) },
      transactions: [],
      uncleHeaders: [],
    }
    const block = Block.fromBlockData(blockData)
    const readableBlock = convertToReadableBlock(block)
    blocks[blockNumber] = block
    readableBlocks[blockNumber] = readableBlock
    blocksByHash[readableBlock.hash] = blockNumber
    latestBlock = blockNumber
    return block
  }
}

export function setGenesisAccounts(accounts = []) {
  genesisAccounts = accounts
}

/***
 *    ######## ##     ## ##     ##    #### ##    ## #### ########
 *    ##       ##     ## ###   ###     ##  ###   ##  ##     ##
 *    ##       ##     ## #### ####     ##  ####  ##  ##     ##
 *    ######   ##     ## ## ### ##     ##  ## ## ##  ##     ##
 *    ##        ##   ##  ##     ##     ##  ##  ####  ##     ##
 *    ##         ## ##   ##     ##     ##  ##   ###  ##     ##
 *    ########    ###    ##     ##    #### ##    ## ####    ##
 */

if (ShardeumFlags.UseDBForAccounts === true) {
  AccountsStorage.init(config.server.baseDir, 'db/shardeum.sqlite')
}

//let accounts: WrappedEVMAccountMap = {} //relocated

//may need these later.  if so, move to DB
let appliedTxs = {} //this appears to be unused. will it still be unused if we use receipts as app data
let shardusTxIdToEthTxId = {} //this appears to only support appliedTxs

let EVMReceiptsToKeep = 1000

//In debug mode the default value is 100 SHM.  This is needed for certain load test operations
const defaultBalance = isDebugMode() ? oneEth.mul(new BN(100)) : new BN(0)

// TODO move this to a db table
let transactionFailHashMap: any = {}

let ERC20TokenBalanceMap: any = []
let ERC20TokenCacheSize = 1000

interface RunStateWithLogs extends RunState {
  logs?: []
}

let EVM: VM
let preRunEVM: VM
let shardeumBlock: ShardeumBlock
//let transactionStateMap:Map<string, TransactionState>

//Per TX or Eth call shardeum State.  Note the key is the shardus transaction id
let shardeumStateTXMap: Map<string, ShardeumState>
//let shardeumStateCallMap:Map<string, ShardeumState>
//let shardeumStatePool:ShardeumState[]
let debugShardeumState: ShardeumState = null

let shardusAddressToEVMAccountInfo: Map<string, EVMAccountInfo>
let evmCommon

let debugAppdata: Map<string, any>

//todo refactor some object init into here
function initEVMSingletons() {
  let chainIDBN = new BN(ShardeumFlags.ChainID)

  evmCommon = new Common({ chain: Chain.Mainnet })

  //hack override this function.  perhaps a nice thing would be to use forCustomChain to create a custom common object
  evmCommon.chainIdBN = () => {
    return chainIDBN
  }

  //let shardeumStateManager = new ShardeumState({ common }) //as StateManager
  //shardeumStateManager.temporaryParallelOldMode = ShardeumFlags.temporaryParallelOldMode //could probably refactor to use ShardeumFlags in the state manager

  shardeumBlock = new ShardeumBlock({ common: evmCommon })

  //let EVM = new VM({ common, stateManager: shardeumStateManager, blockchain: shardeumBlock })

  if (ShardeumFlags.useShardeumVM) {
    EVM = new ShardeumVM({ common: evmCommon, stateManager: undefined, blockchain: shardeumBlock })
  } else {
    EVM = new VM({ common: evmCommon, stateManager: undefined, blockchain: shardeumBlock })
  }
  preRunEVM = new ShardeumVM({ common: evmCommon, stateManager: undefined, blockchain: shardeumBlock })

  //todo need to evict old data
  ////transactionStateMap = new Map<string, TransactionState>()

  // a map of txID or ethcallID to shardeumState, todo need to evict old data
  shardeumStateTXMap = new Map<string, ShardeumState>()
  // a map of txID or ethcallID to shardeumState, todo need to evict old data
  //shardeumStateCallMap = new Map<string, ShardeumState>()

  //shardeumStatePool = []

  //todo need to evict old data
  shardusAddressToEVMAccountInfo = new Map<string, EVMAccountInfo>()

  debugAppdata = new Map<string, any>()
}

initEVMSingletons()

/***
 *     ######     ###    ##       ##       ########     ###     ######  ##    ##  ######
 *    ##    ##   ## ##   ##       ##       ##     ##   ## ##   ##    ## ##   ##  ##    ##
 *    ##        ##   ##  ##       ##       ##     ##  ##   ##  ##       ##  ##   ##
 *    ##       ##     ## ##       ##       ########  ##     ## ##       #####     ######
 *    ##       ######### ##       ##       ##     ## ######### ##       ##  ##         ##
 *    ##    ## ##     ## ##       ##       ##     ## ##     ## ##    ## ##   ##  ##    ##
 *     ######  ##     ## ######## ######## ########  ##     ##  ######  ##    ##  ######
 */

/**
 * This callback is called when the EVM tries to get an account it does not exist in trie storage or TransactionState
 * We need to build a blob of first read accounts and call SGS so that it can jump the EVM execution to the correct shard
 * @param linkedTX
 * @param address
 */
async function accountMiss(transactionState: TransactionState, address: string): Promise<boolean> {
  //Get the first read version of data that we have collected so far

  // TODO implment this in shardus global server.  It will send the read accounts and TX info to
  // to a remote shard so that we can restart the EVM
  //shardus.jumpToAccount(txID, address, transferBlob )

  //throw new Error('this should only happen in a multi sharded environment')

  let isRemoteShard = false
  return isRemoteShard
}

/**
 * This callback is called when the EVM tries to get an CA KVP it does not exist in trie storage or TransactionState
 * We need to build a blob of first read accounts and call SGS so that it can jump the EVM execution to the correct shard
 * @param linkedTX
 * @param address
 * @param key
 */
async function contractStorageMiss(transactionState: TransactionState): Promise<boolean> {
  //Get the first read version of data that we have collected so far

  //NOTE  We do not need this for the january milestone!

  //let isRemote = shardus.isRemoteShard(address)
  // if(isRemote === false){
  //   return false
  // }

  // TODO implment this in shardus global server.  It will send the read accounts and TX info to
  // to a remote shard so that we can restart the EVM
  //shardus.jumpToAccount(txID, address, transferBlob )

  // depending on how thing work out we may also want to jump to
  //shardus.jumpToContractStorage(txID, address, transferBlob )

  //throw new Error('this should only happen in a multi sharded environment')

  let isRemoteShard = false
  return isRemoteShard
}

/**
 * This callback is called so that we can notify shardus global server that the TX needs to access
 * an account.  If the shardus queueEntry has not involved the account yet there is a chance the call
 * will fail in a way that we need to bubble an Error to halt the evm and fail the TX
 * @param linkedTX
 * @param address
 * @param isRead
 * @returns
 */
function accountInvolved(transactionState: TransactionState, address: string, isRead: boolean): boolean {
  //TODO: this will call into shardus global and make sure this TX can continue execution given
  // that we may need to invove an additional account

  let txID = transactionState.linkedTX

  //Need to translate address to a shardus-global-server space address!
  // let shardusAddress = toShardusAddress(address, AccountType.Account)

  //TODO implement this shardus function.
  // shardus.accountInvolved will look at the TXID to find the correct queue entry
  //  then it will see if the queueEntry already knows of this account
  //    if it has not seen this account it will test if we can add this account to the queue entry
  //      The test for this is to see if the involved account has a newer cache timestamp than this TXid
  //        If it fails the test we need to return a faliure code or assert
  //See documentation for details
  if (shardus.tryInvolveAccount != null) {
    let shardusAddress = toShardusAddress(address, AccountType.Account)

    let success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
    if (success === false) {
      // transactionState will throw an error and halt the evm
      return false
    }
  }

  return true
}

/**
 * This callback is called so that we can notify shardus global server that the TX needs to access
 * an account.  If the shardus queueEntry has not involved the account yet there is a chance the call
 * will fail in a way that we need to bubble an Error to halt the evm and fail the TX
 * @param linkedTX
 * @param address
 * @param key
 * @param isRead
 * @returns
 */
function contractStorageInvolved(
  transactionState: TransactionState,
  address: string,
  key: string,
  isRead: boolean
): boolean {
  //TODO: this will call into shardus global and make sure this TX can continue execution given
  // that we may need to invove an additional key

  let txID = transactionState.linkedTX

  //Need to translate key (or a combination of hashing address+key) to a shardus-global-server space address!

  //TODO implement this shardus function.
  //See documentation for details
  //Note we will have 3-4 different account types where accountInvolved gets called (depending on how we handle Receipts),
  // but they will all call the same shardus.accountInvolved() and shardus will not know of the different account types
  if (shardus.tryInvolveAccount != null) {
    //let shardusAddress = toShardusAddress(key, AccountType.ContractStorage)
    let shardusAddress = toShardusAddressWithKey(address, key, AccountType.ContractStorage)

    let success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
    if (success === false) {
      // transactionState will throw an error and halt the evm
      return false
    }
  }

  return true
}

/**
 * fake callbacks so that the debug transactionState object can work with creating test accounts
 * Probably not a good thing to have long term.
 */
async function accountMissNoOp(transactionState: TransactionState, address: string): Promise<boolean> {
  let isRemoteShard = false
  return isRemoteShard
}

async function contractStorageMissNoOp(
  transactionState: TransactionState,
  address: string,
  key: string
): Promise<boolean> {
  let isRemoteShard = false
  return isRemoteShard
}

function accountInvolvedNoOp(transactionState: TransactionState, address: string, isRead: boolean): boolean {
  return true
}

function contractStorageInvolvedNoOp(
  transactionState: TransactionState,
  address: string,
  key: string,
  isRead: boolean
): boolean {
  return true
}

function tryGetRemoteAccountCBNoOp(
  transactionState: TransactionState,
  type: AccountType,
  address: string,
  key: string
): Promise<WrappedEVMAccount> {
  if (ShardeumFlags.VerboseLogs) {
    if (type === AccountType.Account) {
      console.log(`account miss: ${address} tx:${this.linkedTX}`)
      transactionState.tryRemoteHistory.account.push(address)
    } else if (type === AccountType.ContractCode) {
      console.log(`account bytes miss: ${address} key: ${key} tx:${this.linkedTX}`)
      transactionState.tryRemoteHistory.codeBytes.push(`${address}_${key}`)
    } else if (type === AccountType.ContractStorage) {
      console.log(`account storage miss: ${address} key: ${key} tx:${this.linkedTX}`)
      transactionState.tryRemoteHistory.storage.push(`${address}_${key}`)
    }
    logAccessList('tryGetRemoteAccountCBNoOp access list:', transactionState.appData)
  }

  return undefined
}

function monitorEventCBNoOp(category: string, name: string, count: number, message: string) {}

async function tryGetRemoteAccountCB(
  transactionState: TransactionState,
  type: AccountType,
  address: string,
  key: string
): Promise<WrappedEVMAccount> {
  let shardusAddress = toShardusAddressWithKey(address, key, type)
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Trying to get remote account for address: ${address}, type: ${type}, key: ${key}`)
  let remoteShardusAccount = await shardus.getLocalOrRemoteAccount(shardusAddress)
  if (remoteShardusAccount == undefined) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Found no remote account for address: ${address}, type: ${type}, key: ${key}`)
    return
  }
  let fixedEVMAccount = remoteShardusAccount.data
  fixDeserializedWrappedEVMAccount(fixedEVMAccount)
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Successfully found remote account for address: ${address}, type: ${type}, key: ${key}`, fixedEVMAccount)
  return fixedEVMAccount
}

function isStakingEVMTx(transaction: Transaction | AccessListEIP2930Transaction) {
  return transaction.to && transaction.to.toString() === ShardeumFlags.stakeTargetAddress
}

function getStakeTxBlobFromEVMTx(transaction: Transaction | AccessListEIP2930Transaction) {
  let stakeTxString = toAscii(transaction.data.toString('hex'))
  return JSON.parse(stakeTxString)
}

/***
 *       ###     ######   ######   #######  ##     ## ##    ## ########       ###     ######   ######  ########  ######
 *      ## ##   ##    ## ##    ## ##     ## ##     ## ###   ##    ##         ## ##   ##    ## ##    ## ##       ##    ##
 *     ##   ##  ##       ##       ##     ## ##     ## ####  ##    ##        ##   ##  ##       ##       ##       ##
 *    ##     ## ##       ##       ##     ## ##     ## ## ## ##    ##       ##     ## ##       ##       ######    ######
 *    ######### ##       ##       ##     ## ##     ## ##  ####    ##       ######### ##       ##       ##             ##
 *    ##     ## ##    ## ##    ## ##     ## ##     ## ##   ###    ##       ##     ## ##    ## ##    ## ##       ##    ##
 *    ##     ##  ######   ######   #######   #######  ##    ##    ##       ##     ##  ######   ######  ########  ######
 */

async function createAccount(
  addressStr: string,
  stateManager: StateManager,
  balance: BN = defaultBalance
): Promise<WrappedEVMAccount> {
  if (ShardeumFlags.VerboseLogs) console.log('Creating new account', addressStr)
  const accountAddress = Address.fromString(addressStr)

  const acctData = {
    nonce: 0,
    balance: balance, // 100 eth in debug mode.  0 ETH in release mode
  }

  //I think this will have to change in the future!
  // shardeumStateManager.setTransactionState(transactionState)

  const account = Account.fromAccountData(acctData)
  await stateManager.putAccount(accountAddress, account)
  const updatedAccount = await stateManager.getAccount(accountAddress)

  let wrappedEVMAccount = {
    timestamp: 0,
    account: updatedAccount,
    ethAddress: addressStr,
    hash: '',
    accountType: AccountType.Account,
  }
  WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
  return wrappedEVMAccount
}

function getTransactionObj(tx: any): Transaction | AccessListEIP2930Transaction {
  if (!tx.raw) throw Error('fail')
  let transactionObj
  const serializedInput = toBuffer(tx.raw)
  try {
    transactionObj = Transaction.fromRlpSerializedTx(serializedInput)
  } catch (e) {
    // if (ShardeumFlags.VerboseLogs) console.log('Unable to get legacy transaction obj', e)
  }
  if (!transactionObj) {
    try {
      transactionObj = AccessListEIP2930Transaction.fromRlpSerializedTx(serializedInput)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Unable to get transaction obj', e)
    }
  }

  if (transactionObj) {
    return transactionObj
  } else throw Error('tx obj fail')
}

async function getReadableAccountInfo(account) {
  try {
    //todo this code needs additional support for account type contract storage or contract code
    return {
      nonce: account.account.nonce.toString(),
      balance: account.account.balance.toString(),
      stateRoot: bufferToHex(account.account.stateRoot),
      codeHash: bufferToHex(account.account.codeHash),
      operatorAccountInfo: account.operatorAccountInfo ? account.operatorAccountInfo : null,
    }
  } catch (e) {
    if (ShardeumFlags.VerboseLogs) console.log('Unable to get readable account', e)
  }
  return null
}

/**
 * Cant be used in parallel
 * @returns
 */
function getDebugTXState(): ShardeumState {
  let txId = '7'.repeat(64)
  if (ShardeumFlags.VerboseLogs) console.log('Creating a debug tx ShardeumState for ')

  let shardeumState = debugShardeumState
  if (shardeumState == null) {
    shardeumState = new ShardeumState({ common: evmCommon })
    let transactionState = new TransactionState()
    transactionState.initData(
      shardeumState,
      {
        //dont define callbacks for db TX state!
        storageMiss: accountMissNoOp,
        contractStorageMiss: contractStorageMissNoOp,
        accountInvolved: accountInvolvedNoOp,
        contractStorageInvolved: contractStorageInvolvedNoOp,
        tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp,
        monitorEventCB: monitorEventCBNoOp,
      },
      txId,
      undefined,
      undefined
    )
    shardeumState.setTransactionState(transactionState)
    //transactionStateMap.set(txId, transactionState)
    //debugTransactionState = transactionState
  } else {
    //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
    //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
    if (ShardeumFlags.VerboseLogs) console.log('Resetting debug transaction state for txId', txId)
    shardeumState.resetState()
  }

  return shardeumState
}

/**
 * only use for the duration of a call and then give up on it
 * ?? will this work
 * @param from
 * @param to
 * @returns
 */
function getCallTXState(from: string, to: string): ShardeumState {
  let txId = '9'.repeat(64) // use different txId than debug txs
  if (ShardeumFlags.VerboseLogs) console.log('Creating a call tx ShardeumState for ', txId)

  let shardeumState = new ShardeumState({ common: evmCommon })
  let transactionState = new TransactionState()
  transactionState.initData(
    shardeumState,
    {
      storageMiss: accountMissNoOp,
      contractStorageMiss: contractStorageMissNoOp,
      accountInvolved: accountInvolvedNoOp,
      contractStorageInvolved: contractStorageInvolvedNoOp,
      tryGetRemoteAccountCB: tryGetRemoteAccountCB,
      monitorEventCB: monitorEventCBNoOp,
    },
    txId,
    undefined,
    undefined
  )
  shardeumState.setTransactionState(transactionState)
  return shardeumState
}

function getPreRunTXState(txId: string): ShardeumState {
  if (ShardeumFlags.VerboseLogs) console.log('Creating a call tx ShardeumState for ', txId)

  let shardeumState = new ShardeumState({ common: evmCommon })
  let transactionState = new TransactionState()
  transactionState.initData(
    shardeumState,
    {
      storageMiss: accountMissNoOp,
      contractStorageMiss: contractStorageMissNoOp,
      accountInvolved: accountInvolvedNoOp,
      contractStorageInvolved: contractStorageInvolvedNoOp,
      tryGetRemoteAccountCB: tryGetRemoteAccountCB,
      monitorEventCB: monitorEventCBNoOp,
    },
    txId,
    undefined,
    undefined
  )
  shardeumState.setTransactionState(transactionState)
  return shardeumState
}

function getApplyTXState(txId: string): ShardeumState {
  let shardeumState = shardeumStateTXMap.get(txId)
  if (shardeumState == null) {
    shardeumState = new ShardeumState({ common: evmCommon })
    let transactionState = new TransactionState()
    transactionState.initData(
      shardeumState,
      {
        storageMiss: accountMiss,
        contractStorageMiss,
        accountInvolved,
        contractStorageInvolved,
        tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp,
        monitorEventCB: shardus.monitorEvent.bind(shardus),
      },
      txId,
      undefined,
      undefined
    )
    shardeumState.setTransactionState(transactionState)
    shardeumStateTXMap.set(txId, shardeumState)
  }
  return shardeumState
}

function _containsProtocol(url: string) {
  if (!url.match('https?://*')) return false
  return true
}

function _normalizeUrl(url: string) {
  let normalized = url
  if (!_containsProtocol(url)) normalized = 'http://' + url
  return normalized
}

async function _internalHackPostWithResp(url: string, body: any) {
  let normalized = _normalizeUrl(url)
  let host = parseUrl(normalized, true)
  try {
    const res = await got.post(host, {
      timeout: 7000,
      retry: 0,
      throwHttpErrors: false,
      body,
      json: true,
      //parseJson: (text:string)=>{},
      //json: false, // the whole reason for _internalHackGet was because we dont want the text response to mess things up
      //  and as a debug non shipping endpoint did not want to add optional parameters to http module
    })
    return res
  } catch (e) {
    return null
  }
}

function logAccessList(message: string, appData: any) {
  if (appData != null && appData.accessList != null) {
    if (ShardeumFlags.VerboseLogs)
      console.log(`access list for ${message} ${JSON.stringify(appData.accessList)}`)
  }
}

/***
 *    ######## ##    ## ########  ########   #######  #### ##    ## ########  ######
 *    ##       ###   ## ##     ## ##     ## ##     ##  ##  ###   ##    ##    ##    ##
 *    ##       ####  ## ##     ## ##     ## ##     ##  ##  ####  ##    ##    ##
 *    ######   ## ## ## ##     ## ########  ##     ##  ##  ## ## ##    ##     ######
 *    ##       ##  #### ##     ## ##        ##     ##  ##  ##  ####    ##          ##
 *    ##       ##   ### ##     ## ##        ##     ##  ##  ##   ###    ##    ##    ##
 *    ######## ##    ## ########  ##         #######  #### ##    ##    ##     ######
 */

let debugMiddleware = shardus.getDebugModeMiddleware()

//TODO request needs a signature and a timestamp.  or make it a real TX from a faucet account..
//?id=<accountID>
// shardus.registerExternalGet('faucet-all', debugMiddleware, async (req, res) => {
//   let id = req.query.id as string
//   if (!id) return res.json({ success: false, result: 'id is not defined!' })
//   if (!isValidAddress(id)) return res.json({ success: false, result: 'Address format is wrong!' })
//   setupTester(id)
//   try {
//     let activeNodes = shardus.p2p.state.getNodes()
//     if (activeNodes) {
//       for (let node of activeNodes.values()) {
//         _internalHackGet(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}`)
//         res.write(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}\n`)
//       }
//     }
//     res.write(`sending faucet request to all nodes\n`)
//   } catch (e) {
//     res.write(`${e}\n`)
//   }
//   res.end()
// })
//
// //TODO request needs a signature and a timestamp
// shardus.registerExternalGet('faucet-one', debugMiddleware, async (req, res) => {
//   let id = req.query.id as string
//   if (!id) return res.json({ success: false, result: 'id is not defined!' })
//   if (!isValidAddress(id)) return res.json({ success: false, result: 'Address format is wrong!' })
//   setupTester(id)
//   return res.json({ success: true })
// })

shardus.registerExternalGet('motd', async (req, res) => {
  return res.json(`fix-block-timestamp 20220527`)
})

shardus.registerExternalGet('debug-points', debugMiddleware, async (req, res) => {
  // if(isDebugMode()){
  //   return res.json(`endpoint not available`)
  // }

  let points = Number(req.query.points ?? ShardeumFlags.ServicePoints['debug-points'])
  if (trySpendServicePoints(points) === false) {
    return res.json({ error: 'node busy', points, servicePointSpendHistory, debugLastTotalServicePoints })
  }

  return res.json(
    `spent points: ${points} total:${debugLastTotalServicePoints}  ${JSON.stringify(
      servicePointSpendHistory
    )} `
  )
})

shardus.registerExternalPost('inject', async (req, res) => {
  let tx = req.body
  if (ShardeumFlags.VerboseLogs) console.log('Transaction injected:', new Date(), tx)
  try {
    const response = await shardus.put(tx)
    res.json(response)
  } catch (err) {
    if (ShardeumFlags.VerboseLogs) console.log('Failed to inject tx: ', err)
  }
})

shardus.registerExternalGet('eth_blockNumber', async (req, res) => {
  if (ShardeumFlags.VerboseLogs) console.log('Req: eth_blockNumber')
  return res.json({ blockNumber: latestBlock ? '0x' + latestBlock.toString(16) : '0x0' })
})

shardus.registerExternalGet('eth_getBlockByNumber', async (req, res) => {
  let blockNumber = req.query.blockNumber
  if (blockNumber === 'latest') blockNumber = latestBlock
  if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByNumber', blockNumber)
  if (blockNumber == null) {
    return res.json({ error: 'Invalid block number' })
  }
  return res.json({ block: readableBlocks[blockNumber] })
})

shardus.registerExternalGet('eth_getBlockByHash', async (req, res) => {
  let blockHash = req.query.blockHash
  if (blockHash === 'latest') blockHash = readableBlocks[latestBlock].hash
  if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByHash', blockHash)
  let blockNumber = blocksByHash[blockHash]
  return res.json({ block: readableBlocks[blockNumber] })
})

shardus.registerExternalGet('dumpStorage', debugMiddleware, async (req, res) => {
  // if(isDebugMode()){
  //   return res.json(`endpoint not available`)
  // }

  let id
  try {
    id = req.query.id as string
    const addr = Address.fromString(id)
    if (addr == null) {
      return res.json(`dumpStorage: ${id} addr == null`)
    }

    //no longer storing tries in shardeumState, and there is more than one shardeum state now

    let storage = {} //await shardeumStateManager.dumpStorage(addr)
    return res.json(storage)
  } catch (err) {
    //if(ShardeumFlags.VerboseLogs) console.log( `dumpStorage: ${id} `, err)

    return res.json(`dumpStorage: ${id} ${err}`)
  }
})

shardus.registerExternalGet('dumpAddressMap', debugMiddleware, async (req, res) => {
  // if(isDebugMode()){
  //   return res.json(`endpoint not available`)
  // }

  let id
  try {
    //use a replacer so we get the map:
    let output = JSON.stringify(shardusAddressToEVMAccountInfo, replacer, 4)
    res.write(output)
    res.end()
    return
    //return res.json(transactionStateMap)
  } catch (err) {
    return res.json(`dumpAddressMap: ${id} ${err}`)
  }
})

shardus.registerExternalGet('dumpShardeumStateMap', debugMiddleware, async (req, res) => {
  // if(isDebugMode()){
  //   return res.json(`endpoint not available`)
  // }
  try {
    //use a replacer so we get the map:
    //let output = JSON.stringify(shardeumStateTXMap, replacer, 4)
    let output = `tx shardeumState count:${shardeumStateTXMap.size}`
    res.write(output)
    res.end()
    return
    //return res.json(transactionStateMap)
  } catch (err) {
    return res.json(`dumpShardeumStateMap: ${err}`)
  }
})

shardus.registerExternalGet('debug-shardeum-flags', debugMiddleware, async (req, res) => {
  try {
    return res.json({ ShardeumFlags })
  } catch (e) {
    console.log(e)
    return { error: e.message }
  }
})

shardus.registerExternalGet('debug-set-shardeum-flag', debugMiddleware, async (req, res) => {
  let value
  let key
  try {
    key = req.query.key as string
    value = req.query.value as string
    if (value == null) {
      return res.json(`debug-set-shardeum-flag: ${value} == null`)
    }

    let typedValue: boolean | number | string

    if (value === 'true') typedValue = true
    else if (value === 'false') typedValue = false
    else if (!Number.isNaN(Number(value))) typedValue = Number(value)

    // hack to make txFee works with bn.js
    if (key === 'constantTxFee') value = String(value)

    updateShardeumFlag(key, typedValue)

    return res.json({ [key]: ShardeumFlags[key] })
  } catch (err) {
    return res.json(`debug-set-shardeum-flag: ${key} ${err.message} `)
  }
})
shardus.registerExternalGet('debug-set-service-point', debugMiddleware, async (req, res) => {
  let value
  let key1
  let key2
  try {
    key1 = req.query.key1 as string
    key2 = req.query.key2 as string
    value = req.query.value as string
    if (value == null) {
      return res.json(`debug-set-service-point: ${value} == null`)
    }
    if (Number.isNaN(Number(value))) {
      console.log(`Invalid service point`, value)
      return res.json({ error: `Invalid service point` })
    }

    let typedValue: number = Number(value)

    updateServicePoints(key1, key2, typedValue)

    return res.json({ ServicePoints: ShardeumFlags['ServicePoints'] })
  } catch (err) {
    return res.json(`debug-set-service-point: ${value} ${err}`)
  }
})

shardus.registerExternalGet('account/:address', async (req, res) => {
  if (trySpendServicePoints(ShardeumFlags.ServicePoints['account/:address']) === false) {
    return res.json({ error: 'node busy' })
  }

  try {
    if (!req.query.type) {
      const id = req.params['address']
      const shardusAddress = toShardusAddress(id, AccountType.Account)
      const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
      if (!account) {
        return res.json({ account: null })
      }
      let data = account.data
      fixDeserializedWrappedEVMAccount(data)
      let readableAccount = await getReadableAccountInfo(data)
      if (readableAccount) return res.json({ account: readableAccount })
      else res.json({ account: data })
    } else {
      let accountType = parseInt(req.query.type)
      let id = req.params['address']
      const shardusAddress = toShardusAddressWithKey(id, '', accountType)
      const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
      return res.json({ account })
    }
  } catch (error) {
    console.log(error)
    res.json({ error })
  }
})
// shardus.registerExternalPost('eth_estimateGas', async (req, res) => {
//   try {
//     const transaction = req.body
//     let address = toShardusAddress(transaction.to, AccountType.Account)
//     let ourNodeShardData = shardus.stateManager.currentCycleShardData.nodeShardData
//     let minP = ourNodeShardData.consensusStartPartition
//     let maxP = ourNodeShardData.consensusEndPartition
//     let { homePartition } = __ShardFunctions.addressToPartition(shardus.stateManager.currentCycleShardData.shardGlobals, address)
//     let accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false
//     if (accountIsRemote) {
//       let homeNode = __ShardFunctions.findHomeNode(
//         shardus.stateManager.currentCycleShardData.shardGlobals,
//         address,
//         shardus.stateManager.currentCycleShardData.parititionShardDataMap
//       )
//       if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${homeNode?.node.externalIp}:${homeNode?.node.externalPort}`)
//       if (homeNode != null && homeNode.node != null) {
//         if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)
//         let node = homeNode.node
//
//         let postResp = await _internalHackPostWithResp(`${node.externalIp}:${node.externalPort}/eth_estimateGas`, transaction)
//         if (postResp.body != null && postResp.body != '') {
//           if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:${JSON.stringify(postResp.body)}`)
//           return res.json({ result: postResp.body.result })
//         }
//       } else {
//         if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: homenode = null`)
//         return res.json({ result: null })
//       }
//     } else {
//       if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: false`)
//     }
//     let debugTXState = getDebugTXState()
//     let debugEVM = EVM.copy()
//     let debugStateManager = debugEVM.stateManager as ShardeumState
//
//     await debugStateManager.checkpoint()
//     debugStateManager.setTransactionState(debugTXState)
//     const txData = { ...transaction, gasLimit: 3000000 }
//     const tx = Transaction.fromTxData(txData, { common: debugEVM._common, freeze: false })
//
//     // set from address
//     const from = transaction.from ? Address.fromString(transaction.from) : Address.zero()
//     tx.getSenderAddress = () => {
//       return from
//     }
//
//     const runResult: RunTxResult = await debugEVM.runTx({
//       tx,
//       skipNonce: !ShardeumFlags.CheckNonceGreaterThan,
//       skipBalance: true,
//       skipBlockGasLimitValidation: true,
//     })
//
//     await debugStateManager.revert()
//
//     let gasUsed = runResult.gasUsed.toString('hex')
//     if (ShardeumFlags.VerboseLogs) console.log('Gas estimated:', gasUsed)
//
//     if (runResult.execResult.exceptionError) {
//       if (ShardeumFlags.VerboseLogs) console.log('Gas Estimation Error:', runResult.execResult.exceptionError)
//       return res.json({ result: '2DC6C0' })
//     }
//     return res.json({ result: gasUsed })
//   } catch (e) {
//     if (ShardeumFlags.VerboseLogs) console.log('Error', e)
//     return res.json({ result: null })
//   }
// })

shardus.registerExternalPost('contract/call', async (req, res) => {
  // if(isDebugMode()){
  //   return res.json(`endpoint not available`)
  // }
  if (trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].endpoint) === false) {
    return res.json({ result: null, error: 'node busy' })
  }

  try {
    const callObj = req.body
    if (ShardeumFlags.VerboseLogs) console.log('callObj', callObj)
    let opt = {
      to: Address.fromString(callObj.to),
      caller: Address.fromString(callObj.from),
      origin: Address.fromString(callObj.from), // The tx.origin is also the caller here
      data: toBuffer(callObj.data),
    }
    if (callObj.to) {
      opt['to'] = Address.fromString(callObj.to)
    }

    if (callObj.gas) {
      opt['gasLimit'] = new BN(Number(callObj.gas))
    }

    if (callObj.gasPrice) {
      opt['gasPrice'] = callObj.gasPrice
    }

    let caShardusAddress
    const methodCode = callObj.data.substr(0, 10)
    let caAccount
    if (opt['to']) {
      caShardusAddress = toShardusAddress(callObj.to, AccountType.Account)
      if (methodCode === ERC20_BALANCEOF_CODE) {
        // ERC20 Token balance query
        let caShardusAddress = toShardusAddress(callObj.to, AccountType.Account)
        //to do convert to timestamp query getAccountTimestamp!!
        caAccount = await AccountsStorage.getAccount(caShardusAddress)
        if (caAccount) {
          const index = ERC20TokenBalanceMap.findIndex(x => x.to === callObj.to && x.data === callObj.data)
          if (index > -1) {
            const tokenBalanceResult = ERC20TokenBalanceMap[index]
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Found in the ERC20TokenBalanceMap; index:', index, callObj.to)
            ERC20TokenBalanceMap.splice(index, 1)
            if (tokenBalanceResult.timestamp === caAccount.timestamp) {
              // The contract account is not updated yet.
              ERC20TokenBalanceMap.push(tokenBalanceResult)
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`eth call for ERC20TokenBalanceMap`, callObj.to, callObj.data)
              return res.json({ result: tokenBalanceResult.result })
            }
          }
        }
      }
    }

    if (opt['to']) {
      if (ShardeumFlags.VerboseLogs) console.log('Calling to ', callObj.to, caShardusAddress)
      //let callerShardusAddress = toShardusAddress(callObj.caller, AccountType.Account)

      //Overly techincal, should be ported back into SGS as a utility
      let address = caShardusAddress
      let accountIsRemote = shardus.isAccountRemote(address)

      if (accountIsRemote) {
        let consensusNode = shardus.getRandomConsensusNodeForAccount(address)
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
        if (consensusNode != null) {
          if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)

          let postResp = await _internalHackPostWithResp(
            `${consensusNode.externalIp}:${consensusNode.externalPort}/contract/call`,
            callObj
          )
          if (postResp.body != null && postResp.body != '') {
            //getResp.body

            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:${JSON.stringify(postResp.body)}`)
            //res.json({ result: callResult.execResult.returnValue.toString('hex') })
            //return res.json({ result: '0x' + postResp.body })   //I think the 0x is worse?
            return res.json({ result: postResp.body.result })
          }
        } else {
          if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: consensusNode = null`)
          return res.json({ result: null })
        }
      } else {
        if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: false`)
      }
    }

    // if we are going to handle the call directly charge 20 points
    if (trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].direct) === false) {
      return res.json({ result: null, error: 'node busy' })
    }

    let callTxState = getCallTXState(callObj.from, callObj.to) //this isn't so great..

    let callerAddress = toShardusAddress(callObj.from, AccountType.Account)
    let callerAccount = await AccountsStorage.getAccount(callerAddress)
    if (callerAccount) {
      if (ShardeumFlags.VerboseLogs) console.log('callerAddress', callerAccount)
      callTxState._transactionState.insertFirstAccountReads(opt.caller, callerAccount.account)
      //shardeumStateManager.setTransactionState(callTxState)
    } else {
      const acctData = {
        nonce: 0,
        balance: oneEth.mul(new BN(100)), // 100 eth.  This is a temporary account that will never exist.
      }
      const fakeAccount = Account.fromAccountData(acctData)
      callTxState._transactionState.insertFirstAccountReads(opt.caller, fakeAccount)

      //shardeumStateManager.setTransactionState(callTxState)
    }

    opt['block'] = blocks[latestBlock]

    //@ts-ignore
    EVM.stateManager = null
    //@ts-ignore
    EVM.stateManager = callTxState
    const callResult = await EVM.runCall(opt)
    //shardeumStateManager.unsetTransactionState(callTxState.linkedTX)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Call Result', callResult.execResult.returnValue.toString('hex'))

    if (methodCode === ERC20_BALANCEOF_CODE) {
      //TODO would be way faster to have timestamp in db as field
      //let caAccount = await AccountsStorage.getAccount(caShardusAddress)

      ERC20TokenBalanceMap.push({
        to: callObj.to,
        data: callObj.data,
        timestamp: caAccount && caAccount.timestamp, //this will invalidate for any user..
        result: callResult.execResult.exceptionError
          ? null
          : callResult.execResult.returnValue.toString('hex'),
      })
      if (ERC20TokenBalanceMap.length > ERC20TokenCacheSize + 10) {
        let extra = ERC20TokenBalanceMap.length - ERC20TokenCacheSize
        ERC20TokenBalanceMap.splice(0, extra)
      }
    }

    if (callResult.execResult.exceptionError) {
      if (ShardeumFlags.VerboseLogs) console.log('Execution Error:', callResult.execResult.exceptionError)
      return res.json({ result: null })
    }

    res.json({ result: callResult.execResult.returnValue.toString('hex') })
  } catch (e) {
    if (ShardeumFlags.VerboseLogs) console.log('Error eth_call', e)
    return res.json({ result: null })
  }
})

shardus.registerExternalPost('contract/accesslist', async (req, res) => {
  if (trySpendServicePoints(ShardeumFlags.ServicePoints['contract/accesslist'].endpoint) === false) {
    return res.json({ result: null, error: 'node busy' })
  }

  try {
    const callObj = req.body
    if (ShardeumFlags.VerboseLogs) console.log('AccessList endpoint callObj', callObj)

    let { accessList, shardusMemoryPatterns } = await generateAccessList(callObj)

    res.json(accessList)
  } catch (e) {
    if (ShardeumFlags.VerboseLogs) console.log('Error predict accessList', e)
    return res.json([])
  }
})

shardus.registerExternalGet('tx/:hash', async (req, res) => {
  if (trySpendServicePoints(ShardeumFlags.ServicePoints['tx/:hash']) === false) {
    return res.json({ error: 'node busy' })
  }

  const txHash = req.params['hash']
  if (!ShardeumFlags.EVMReceiptsAsAccounts) {
    try {
      const dataId = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
      let cachedAppData = await shardus.getLocalOrRemoteCachedAppData('receipt', dataId)
      if (ShardeumFlags.VerboseLogs) console.log(`cachedAppData for tx hash ${txHash}`, cachedAppData)
      if (cachedAppData && cachedAppData.appData) cachedAppData = cachedAppData.appData
      return res.json({ account: cachedAppData?.data ? cachedAppData.data : cachedAppData })
    } catch (e) {
      console.log('Unable to get tx receipt', e)
      return res.json({ account: null })
    }
  } else {
    try {
      //const shardusAddress = toShardusAddressWithKey(txHash.slice(0, 42), txHash, AccountType.Receipt)
      const shardusAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
      const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
      if (!account || !account.data) {
        if (transactionFailHashMap[txHash]) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Tx Hash ${txHash} is found in the failed transactions list`, transactionFailHashMap[txHash])
          return res.json({ account: transactionFailHashMap[txHash] })
        }
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`No tx found for ${shardusAddress}`) //, accounts[shardusAddress])
        return res.json({ account: null })
      }
      let data = account.data
      fixDeserializedWrappedEVMAccount(data)
      res.json({ account: data })
    } catch (error) {
      console.log(error)
      res.json({ error })
    }
  }
})

shardus.registerExternalGet('debug-appdata/:hash', debugMiddleware, async (req, res) => {
  // if(isDebugMode()){
  //   return res.json(`endpoint not available`)
  // }
  const txHash = req.params['hash']
  // const shardusAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)

  // let shardeumState = shardeumStateTXMap.get(txHash)
  // if(shardeumState == null){
  //   return res.json(JSON.stringify({result:`shardeumState not found`}))
  // }

  // let appData = shardeumState._transactionState?.appData

  let appData = debugAppdata.get(txHash)

  if (appData == null) {
    return res.json(JSON.stringify({ result: `no appData` }))
  }

  //return res.json(`${JSON.stringify(appData)}`)

  res.write(`${JSON.stringify(appData, null, 2)}`)

  res.end()
})

// shardus.registerExternalGet('tx/:hash', async (req, res) => {
//   const txHash = req.params['hash']
//
//   if (!appliedTxs[txHash]) {
//     return res.json({ tx: 'Not found' })
//   }
//   let appliedTx = appliedTxs[txHash]
//
//   if (!appliedTx) return res.json({ tx: 'Not found' })
//   let detail = getReadableTransaction(appliedTx.injected)
//   let logs = []
//
//   let runState: RunStateWithLogs = appliedTx.receipt.execResult.runState
//   if (!runState) {
//     if (ShardeumFlags.VerboseLogs) console.log(`No runState found in the receipt for ${txHash}`)
//   }
//
//   if (runState && runState.logs)
//     logs = runState.logs.map((l: any[]) => {
//       return {
//         logIndex: '0x1', // 1
//         blockNumber: '0xb', // 436
//         blockHash: '0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b',
//         transactionHash: appliedTx.txId,
//         transactionIndex: '0x1',
//         address: bufferToHex(l[0]),
//         topics: l[1].map(i => bufferToHex(i)),
//         data: bufferToHex(l[2]),
//       }
//     })
//
//   console.log('Transformed log for tx', appliedTx.txId, logs, logs[0])
//
//   let result = {
//     transactionHash: appliedTx.txId,
//     transactionIndex: '0x1',
//     blockNumber: '0xb',
//     nonce: appliedTx.receipt.nonce,
//     blockHash: '0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b',
//     cumulativeGasUsed: bufferToHex(appliedTx.receipt.gasUsed),
//     gasUsed: bufferToHex(appliedTx.receipt.gasUsed),
//     logs: logs,
//     contractAddress: appliedTx.receipt.createdAddress ? appliedTx.receipt.createdAddress.toString() : null,
//     status: '0x1',
//     ...detail,
//   }
//   res.json({ tx: result })
// })

shardus.registerExternalGet('accounts', debugMiddleware, async (req, res) => {
  // if(isDebugMode()){
  //   return res.json(`endpoint not available`)
  // }
  if (ShardeumFlags.VerboseLogs) console.log('/accounts')
  //res.json({accounts})

  // stable sort on accounts order..  todo, may turn this off later for perf reasons.

  //let sorted = JSON.parse(stringify(accounts))
  let accounts = await AccountsStorage.debugGetAllAccounts()
  let sorted = JSON.parse(SerializeToJsonString(accounts))

  res.json({ accounts: sorted })
})

shardus.registerExternalGet('nodeRewardValidate', debugMiddleware, async (req, res) => {
  // if(isDebugMode()){
  //   return res.json(`endpoint not available`)
  // }

  if (nodeRewardCount === 0) {
    return res.json({ success: true, data: 'This node is still early for node rewards!' })
  }

  const expectedBalance =
    nodeRewardCount * parseInt(oneEth.mul(new BN(INITIAL_PARAMETERS.nodeRewardAmount)).toString()) +
    parseInt(defaultBalance.toString())
  const shardusAddress = toShardusAddress(pay_address, AccountType.Account)

  const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
  if (!account || !account.data) {
    console.log(`Pay address ${pay_address} is not found!`)
    return res.json({ success: false, data: `Pay address ${pay_address} is not found!` })
  }
  // let data = account.account
  fixDeserializedWrappedEVMAccount(account.data)
  let readableAccount = await getReadableAccountInfo(account.data)
  console.log(expectedBalance, readableAccount.balance)
  if (expectedBalance === parseInt(readableAccount.balance)) {
    return res.json({ success: true, data: 'Node reward is adding successfully!' })
  }
  return res.json({
    success: false,
    data: `Pay address ${pay_address} balance and Node reward amount does not match!`,
  })
})

shardus.registerExternalGet('genesis_accounts', async (req, res) => {
  const { start } = req.query
  if (!start) {
    return res.json({ success: false, reason: 'start value is not defined!' })
  }
  const skip = parseInt(start)
  const limit = skip + 1000
  let accounts = []
  if (genesisAccounts.length > 0) {
    accounts = genesisAccounts.slice(skip, limit)
  }
  res.json({ success: true, accounts })
})

shardus.registerExternalPut('query-certificate', async (req: Request, res: Response) => {
  nestedCountersInstance.countEvent('shardeum-staking', 'called query-certificate')

  const queryCertRes = await queryCertificateHandler(req, shardus)
  console.log('queryCertRes', queryCertRes)
  if (queryCertRes.success) {
    let successRes = queryCertRes as CertSignaturesResult
    stakeCert = successRes.signedStakeCert
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `queryCertificateHandler success`)
  } else {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `queryCertificateHandler failed with reason: ${(queryCertRes as ValidatorError).reason}`)
  }

  return res.json(queryCertRes)
})

/***
 *    #### ##    ## ######## ######## ########  ##    ##    ###    ##          ######## ##     ##
 *     ##  ###   ##    ##    ##       ##     ## ###   ##   ## ##   ##             ##     ##   ##
 *     ##  ####  ##    ##    ##       ##     ## ####  ##  ##   ##  ##             ##      ## ##
 *     ##  ## ## ##    ##    ######   ########  ## ## ## ##     ## ##             ##       ###
 *     ##  ##  ####    ##    ##       ##   ##   ##  #### ######### ##             ##      ## ##
 *     ##  ##   ###    ##    ##       ##    ##  ##   ### ##     ## ##             ##     ##   ##
 *    #### ##    ##    ##    ######## ##     ## ##    ## ##     ## ########       ##    ##     ##
 */

async function applyInternalTx(
  tx: any,
  wrappedStates: WrappedStates,
  txTimestamp: number
): Promise<ShardusTypes.ApplyResponse> {
  let txId = crypto.hashObj(tx)
  const applyResponse: ShardusTypes.ApplyResponse = shardus.createApplyResponse(txId, txTimestamp)
  if (isSetCertTimeTx(tx)) {
    let setCertTimeTx = tx as SetCertTime
    applySetCertTimeTx(shardus, setCertTimeTx, wrappedStates, txTimestamp, applyResponse)
  }
  let internalTx = tx as InternalTx
  if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
    const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[internalTx.from].data
    //just update the timestamp?
    wrappedEVMAccount.timestamp = txTimestamp
    //I think this will naturally accomplish the goal of the global update.

    //need to run this to fix buffer types after serialization
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
  }

  if (internalTx.internalTXType === InternalTXType.InitNetwork) {
    const network: NetworkAccount = wrappedStates[networkAccount].data
    if (ShardeumFlags.useAccountWrites) {
      let writtenAccount = wrappedStates[networkAccount]
      writtenAccount.data.timestamp = txTimestamp
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(writtenAccount.data)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        wrappedChangedAccount,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
    }
    console.log(`init_network NETWORK_ACCOUNT: ${stringify(network)}`)
    shardus.log('Applied init_network transaction', network)
  }
  if (internalTx.internalTXType === InternalTXType.NodeReward) {
    //let transactionState = transactionStateMap.get(txId)
    // if (transactionState == null) {
    //   transactionState = new TransactionState()
    //   transactionState.initData(
    //     shardeumStateManager,
    //     {
    //       storageMiss: accountMiss,
    //       contractStorageMiss,
    //       accountInvolved,
    //       contractStorageInvolved,
    //       tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp
    //     },
    //     txId,
    //     undefined,
    //     undefined
    //   )
    //   transactionStateMap.set(txId, transactionState)
    // } else {
    //   //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
    //   //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
    // }

    let shardeumState = getApplyTXState(txId)

    //ah shoot this binding will not be "thread safe" may need to make it part of the EEI for this tx? idk.
    //shardeumStateManager.setTransactionState(transactionState)

    // loop through the wrappedStates an insert them into the transactionState as first*Reads
    for (let accountId in wrappedStates) {
      let wrappedEVMAccount: WrappedEVMAccount = wrappedStates[accountId].data
      if (wrappedEVMAccount.accountType === AccountType.Account) {
        fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
        let address = Address.fromString(wrappedEVMAccount.ethAddress)

        if (ShardeumFlags.VerboseLogs) {
          let ourNodeShardData = shardus.stateManager.currentCycleShardData.nodeShardData
          let minP = ourNodeShardData.consensusStartPartition
          let maxP = ourNodeShardData.consensusEndPartition
          let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
          let { homePartition } = __ShardFunctions.addressToPartition(
            shardus.stateManager.currentCycleShardData.shardGlobals,
            shardusAddress
          )
          let accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false

          /* prettier-ignore */ console.log('DBG', 'tx insert data', txId, `accountIsRemote: ${accountIsRemote} acc:${address} key:${wrappedEVMAccount.key} type:${wrappedEVMAccount.accountType}`)
        }

        if (wrappedEVMAccount.accountType === AccountType.Account) {
          shardeumState._transactionState.insertFirstAccountReads(address, wrappedEVMAccount.account)
        }
      }
    }

    const network: NetworkAccount = wrappedStates[networkAccount].data
    const from: NodeAccount = wrappedStates[internalTx.from].data
    const to: WrappedEVMAccount = wrappedStates[toShardusAddress(internalTx.to, AccountType.Account)].data
    let nodeRewardReceipt: WrappedEVMAccount = null
    if (ShardeumFlags.EVMReceiptsAsAccounts) {
      nodeRewardReceipt = wrappedStates[txId].data // Current node reward receipt hash is set with txId
    }
    from.balance.add(network.current.nodeRewardAmount) // This is not needed and will have to delete `balance` field
    // eventually
    shardus.log(`Reward from ${internalTx.from} to ${internalTx.to}`)
    shardus.log('TO ACCOUNT', to)

    const accountAddress = Address.fromString(internalTx.to)
    if (ShardeumFlags.VerboseLogs) {
      console.log('node Reward', internalTx)
    }
    let account = await shardeumState.getAccount(accountAddress)
    if (ShardeumFlags.VerboseLogs) {
      console.log('nodeReward', 'accountAddress', account)
    }
    account.balance.iadd(oneEth.mul(new BN(network.current.nodeRewardAmount))) // Add 1 ETH
    await shardeumState.putAccount(accountAddress, account)
    account = await shardeumState.getAccount(accountAddress)
    if (ShardeumFlags.VerboseLogs) {
      console.log('nodeReward', 'accountAddress', account)
    }
    to.account = account
    to.timestamp = txTimestamp

    from.nodeRewardTime = txTimestamp
    from.timestamp = txTimestamp

    if (ShardeumFlags.useAccountWrites) {
      let toAccountShardusAddress = toShardusAddress(internalTx.to, AccountType.Account)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        toAccountShardusAddress,
        wrappedStates[toAccountShardusAddress],
        txId,
        txTimestamp
      )
    }

    let readableReceipt: ReadableReceipt = {
      transactionHash: txId,
      transactionIndex: '0x1',
      blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
      nonce: '0x',
      blockHash: readableBlocks[latestBlock].hash,
      cumulativeGasUsed: '0x0',
      gasUsed: '0x0',
      logs: null,
      logsBloom: null,
      contractAddress: null,
      from: from.id,
      to: to.ethAddress,
      value: oneEth.toString('hex'),
      data: '0x',
      status: 1,
    }

    if (ShardeumFlags.EVMReceiptsAsAccounts) {
      nodeRewardReceipt.timestamp = txTimestamp
      nodeRewardReceipt.readableReceipt = readableReceipt
      nodeRewardReceipt.txId = txId
      nodeRewardReceipt.txFrom = from.id
    } else {
      nodeRewardReceipt = {
        timestamp: txTimestamp,
        ethAddress: txId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
        hash: '',
        // receipt: runTxResult.receipt,
        readableReceipt,
        txId,
        accountType: AccountType.NodeRewardReceipt,
        txFrom: from.id,
      }
      const shardusWrappedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(nodeRewardReceipt)
      //put this in the apply response
      shardus.applyResponseAddReceiptData(
        applyResponse,
        shardusWrappedAccount,
        crypto.hashObj(shardusWrappedAccount)
      )
    }
    // console.log('nodeRewardReceipt', nodeRewardReceipt)
    // shardus.log('Applied node_reward tx', from, to)
    console.log('Applied node_reward tx', txId, txTimestamp)
    //shardeumStateManager.unsetTransactionState(txId)
  }
  if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
    const network: NetworkAccount = wrappedStates[networkAccount].data
    const devAccount: DevAccount = wrappedStates[internalTx.from].data

    let changeOnCycle
    let cycleData: ShardusTypes.Cycle

    //NEED to sign with dev key (probably check this in validate() )

    if (internalTx.cycle === -1) {
      ;[cycleData] = shardus.getLatestCycles()
      changeOnCycle = cycleData.counter + 3
    } else {
      changeOnCycle = internalTx.cycle
    }

    const when = txTimestamp + ONE_SECOND * 10
    // value is the TX that will apply a change to the global network account 0000x0000
    let value = {
      isInternalTx: true,
      internalTXType: InternalTXType.ApplyChangeConfig,
      timestamp: when,
      from: internalTx.from,
      network: networkAccount,
      change: { cycle: changeOnCycle, change: JSON.parse(internalTx.config) },
    }

    //value = shardus.signAsNode(value)

    let ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
    // network will consens that this is the correct value
    ourAppDefinedData.globalMsg = { address: networkAccount, value, when, source: value.from }

    if (ShardeumFlags.useAccountWrites) {
      let networkAccountCopy = wrappedStates[networkAccount]
      let devAccountCopy = wrappedStates[internalTx.from]
      networkAccountCopy.data.timestamp = txTimestamp
      devAccountCopy.data.timestamp = txTimestamp
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy,
        txId,
        txTimestamp
      )
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        internalTx.from,
        devAccountCopy,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      devAccount.timestamp = txTimestamp
    }
    console.log('Applied change_config tx')
    shardus.log('Applied change_config tx')
  }
  if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
    const network: NetworkAccount = wrappedStates[networkAccount].data

    if (ShardeumFlags.useAccountWrites) {
      let networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = txTimestamp
      networkAccountCopy.data.listOfChanges.push(internalTx.change)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      network.listOfChanges.push(internalTx.change)
    }
    console.log(`Applied CHANGE_CONFIG GLOBAL transaction: ${stringify(network)}`)
    shardus.log('Applied CHANGE_CONFIG GLOBAL transaction', stringify(network))
  }
  if (internalTx.internalTXType === InternalTXType.ChangeNetworkParam) {
    const network: NetworkAccount = wrappedStates[networkAccount].data
    const devAccount: DevAccount = wrappedStates[internalTx.from].data

    let changeOnCycle
    let cycleData: ShardusTypes.Cycle

    if (internalTx.cycle === -1) {
      ;[cycleData] = shardus.getLatestCycles()
      changeOnCycle = cycleData.counter + 1
    } else {
      changeOnCycle = internalTx.cycle
    }

    const when = txTimestamp + ONE_SECOND * 10
    // value is the TX that will apply a change to the global network account 0000x0000
    let value = {
      isInternalTx: true,
      internalTXType: InternalTXType.ApplyNetworkParam,
      timestamp: when,
      from: internalTx.from,
      network: networkAccount,
      change: { cycle: changeOnCycle, change: {}, appData: JSON.parse(internalTx.config) },
    }

    let ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
    // network will consens that this is the correct value
    ourAppDefinedData.globalMsg = { address: networkAccount, value, when, source: value.from }

    if (ShardeumFlags.useAccountWrites) {
      let networkAccountCopy = wrappedStates[networkAccount]
      let devAccountCopy = wrappedStates[internalTx.from]
      networkAccountCopy.data.timestamp = txTimestamp
      devAccountCopy.data.timestamp = txTimestamp
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy,
        txId,
        txTimestamp
      )
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        internalTx.from,
        devAccountCopy,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      devAccount.timestamp = txTimestamp
    }
    console.log('Applied change_network_param tx')
    shardus.log('Applied change_network_param tx')
  }
  if (internalTx.internalTXType === InternalTXType.ApplyNetworkParam) {
    const network: NetworkAccount = wrappedStates[networkAccount].data

    if (ShardeumFlags.useAccountWrites) {
      let networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = txTimestamp
      networkAccountCopy.data.listOfChanges.push(internalTx.change)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      network.listOfChanges.push(internalTx.change)
    }
    console.log(`Applied CHANGE_NETWORK_PARAM GLOBAL transaction: ${stringify(network)}`)
    shardus.log('Applied CHANGE_NETWORK_PARAM GLOBAL transaction', stringify(network))
  }
  if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
    let rewardTimesTx = internalTx as InitRewardTimes
    InitRewardTimesTx.apply(shardus, rewardTimesTx, txId, txTimestamp, wrappedStates, applyResponse)
  }
  if (internalTx.internalTXType === InternalTXType.ClaimReward) {
    let claimRewardTx = internalTx as ClaimRewardTX
    applyClaimRewardTx(shardus, claimRewardTx, wrappedStates, txTimestamp, applyResponse)
  }
  return applyResponse
}

async function applyDebugTx(
  debugTx: DebugTx,
  wrappedStates: WrappedStates,
  txTimestamp: number
): Promise<ShardusTypes.ApplyResponse> {
  if (ShardeumFlags.VerboseLogs) console.log('Applying debug transaction', debugTx)
  if (debugTx.debugTXType === DebugTXType.Create) {
    let fromShardusAddress = toShardusAddress(debugTx.from, AccountType.Debug)
    const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[fromShardusAddress].data
    wrappedEVMAccount.timestamp = txTimestamp
    wrappedEVMAccount.balance += 1
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
  } else if (debugTx.debugTXType === DebugTXType.Transfer) {
    let fromAddress = toShardusAddress(debugTx.from, AccountType.Debug)
    let toAddress = toShardusAddress(debugTx.to, AccountType.Debug)
    const fromAccount: WrappedEVMAccount = wrappedStates[fromAddress].data
    const toAccount: WrappedEVMAccount = wrappedStates[toAddress].data
    fromAccount.timestamp = txTimestamp
    fromAccount.balance -= 1
    toAccount.balance += 1
    fixDeserializedWrappedEVMAccount(fromAccount)
    fixDeserializedWrappedEVMAccount(toAccount)
  }

  let txId = crypto.hashObj(debugTx)
  return shardus.createApplyResponse(txId, txTimestamp)
}

function setGlobalCodeByteUpdate(
  txTimestamp: number,
  wrappedEVMAccount: WrappedEVMAccount,
  applyResponse: ShardusTypes.ApplyResponse
) {
  let globalAddress = getAccountShardusAddress(wrappedEVMAccount)
  const when = txTimestamp + 1000 * 10
  let value = {
    isInternalTx: true,
    internalTXType: InternalTXType.SetGlobalCodeBytes,
    // type: 'apply_code_bytes', //extra, for debug
    timestamp: when,
    accountData: wrappedEVMAccount,
    from: globalAddress,
  }

  //value = shardus.signAsNode(value)

  let ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = { address: globalAddress, value, when, source: globalAddress }
}

async function _transactionReceiptPass(
  tx: any,
  txId: string,
  wrappedStates: WrappedStates,
  applyResponse: ShardusTypes.ApplyResponse
) {
  if (applyResponse == null) {
    return
  }
  let ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  let appReceiptData = applyResponse.appReceiptData

  console.log('_transactionReceiptPass appReceiptData', appReceiptData)

  if (appReceiptData) {
    const dataId = toShardusAddressWithKey(
      appReceiptData.data.readableReceipt.transactionHash,
      '',
      AccountType.Receipt
    )
    await shardus.sendCorrespondingCachedAppData(
      'receipt',
      dataId,
      appReceiptData,
      shardus.stateManager.currentCycleShardData.cycleNumber,
      appReceiptData.data.txFrom,
      appReceiptData.data.txId
    )
  }

  //If this apply response has a global message defined then call setGlobal()
  if (ourAppDefinedData.globalMsg) {
    let { address, value, when, source } = ourAppDefinedData.globalMsg
    //delete value.sign
    shardus.setGlobal(address, value, when, source)
    if (ShardeumFlags.VerboseLogs) {
      const tx = { address, value, when, source }
      const txHash = crypto.hashObj(tx)
      console.log(`transactionReceiptPass setglobal: ${txHash} ${JSON.stringify(tx)}  `)
    }
  }
}

function getInjectedOrGeneratedTimestamp(timestampedTx) {
  let { tx, timestampReceipt } = timestampedTx
  let txnTimestamp: number

  if (timestampReceipt && timestampReceipt.timestamp) {
    txnTimestamp = timestampReceipt.timestamp
    if (ShardeumFlags.VerboseLogs) {
      console.log(`Timestamp ${txnTimestamp} is generated by the network nodes.`)
    }
  } else if (tx.timestamp) {
    txnTimestamp = tx.timestamp
    if (ShardeumFlags.VerboseLogs) {
      console.log(`Timestamp ${txnTimestamp} is extracted from the injected tx.`)
    }
  }
  return txnTimestamp
}

const createNetworkAccount = (accountId: string) => {
  const account: NetworkAccount = {
    id: accountId,
    accountType: AccountType.NetworkAccount,
    listOfChanges: [
      {
        cycle: 1,
        change: {
          server: {
            p2p: {
              minNodes: 15,
            },
          },
        },
      },
    ],
    current: INITIAL_PARAMETERS,
    next: {},
    hash: '',
    timestamp: 0,
  }
  account.hash = WrappedEVMAccountFunctions._calculateAccountHash(account)
  console.log('INITIAL_HASH: ', account.hash)
  return account
}

const createNodeAccount = (accountId: string) => {
  const account: NodeAccount = {
    id: accountId,
    accountType: AccountType.NodeAccount,
    balance: new BN(0),
    nodeRewardTime: 0,
    hash: '',
    timestamp: 0,
  }
  account.hash = WrappedEVMAccountFunctions._calculateAccountHash(account)
  return account
}

const getOrCreateBlockFromTimestamp = (timestamp: number, scheduleNextBlock = false): Block => {
  if (ShardeumFlags.VerboseLogs) console.log('Getting block from timestamp', timestamp)
  if (ShardeumFlags.VerboseLogs && blocks[latestBlock]) {
    /* prettier-ignore */ console.log('Latest block timestamp', blocks[latestBlock].header.timestamp, blocks[latestBlock].header.timestamp.toNumber() + 6000)
    /* prettier-ignore */ console.log('Latest block number', blocks[latestBlock].header.number.toNumber())
  }
  if (blocks[latestBlock] && blocks[latestBlock].header.timestamp.toNumber() >= timestamp) {
    return blocks[latestBlock]
  }

  let latestCycles = shardus.getLatestCycles()
  if (latestCycles == null || latestCycles.length === 0) return
  const cycle = latestCycles[0]

  let cycleStart = (cycle.start + cycle.duration) * 1000
  let timeElapsed = timestamp - cycleStart
  let decimal = timeElapsed / (cycle.duration * 1000)
  let numBlocksPerCycle = cycle.duration / ShardeumFlags.blockProductionRate
  let blockNumber = Math.floor((cycle.counter + decimal) * numBlocksPerCycle)
  let newBlockTimestampInSecond =
    cycle.start + cycle.duration + (blockNumber - cycle.counter * 10) * ShardeumFlags.blockProductionRate
  let newBlockTimestamp = newBlockTimestampInSecond * 1000
  if (ShardeumFlags.VerboseLogs) {
    console.log('Cycle counter vs derived blockNumber', cycle.counter, blockNumber)
  }
  let block = createNewBlock(blockNumber, newBlockTimestamp)
  if (scheduleNextBlock) {
    let nextBlockTimestamp = newBlockTimestamp + ShardeumFlags.blockProductionRate * 1000
    let waitTime = nextBlockTimestamp - Date.now()
    if (ShardeumFlags.VerboseLogs) console.log('Scheduling next block created which will happen in', waitTime)
    setTimeout(() => {
      getOrCreateBlockFromTimestamp(nextBlockTimestamp, true)
    }, waitTime)
  }
  pruneOldBlocks()
  return block
}

async function generateAccessList(callObj: any): Promise<{ accessList: any[]; shardusMemoryPatterns: any }> {
  try {
    let valueInHexString: string
    if (!callObj.value) {
      valueInHexString = '0'
    } else if (callObj.value.indexOf('0x') >= 0) {
      valueInHexString = callObj.value.slice(2)
    } else {
      valueInHexString = callObj.value
    }

    let opt = {
      to: callObj.to ? Address.fromString(callObj.to) : null,
      caller: Address.fromString(callObj.from),
      origin: Address.fromString(callObj.from), // The tx.origin is also the caller here
      data: toBuffer(callObj.data),
      value: new BN(valueInHexString, 16),
    }

    if (callObj.to) {
      opt['to'] = Address.fromString(callObj.to)
    }

    if (callObj.gas) {
      opt['gasLimit'] = new BN(Number(callObj.gas))
    }

    if (callObj.gasPrice) {
      opt['gasPrice'] = callObj.gasPrice
    }

    let caShardusAddress
    if (opt['to']) {
      caShardusAddress = toShardusAddress(callObj.to, AccountType.Account)
    } else if (callObj.newContractAddress != null) {
      caShardusAddress = toShardusAddress(callObj.newContractAddress, AccountType.Account)
    }

    if (caShardusAddress != null) {
      if (ShardeumFlags.VerboseLogs) console.log('Generating accessList to ', opt.to, caShardusAddress)

      let address = caShardusAddress
      let accountIsRemote = shardus.isAccountRemote(address)

      if (accountIsRemote) {
        let consensusNode = shardus.getRandomConsensusNodeForAccount(address)
        /* prettier-ignore */
        if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
        if (consensusNode != null) {
          if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)

          let postResp = await _internalHackPostWithResp(
            `${consensusNode.externalIp}:${consensusNode.externalPort}/contract/accesslist`,
            callObj
          )
          if (ShardeumFlags.VerboseLogs)
            console.log('Accesslist response from node', consensusNode.externalPort, postResp.body)
          if (postResp.body != null && postResp.body != '' && postResp.body.accessList != null) {
            /* prettier-ignore */
            if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:${JSON.stringify(postResp.body)}`)
            // if (Array.isArray(postResp.body) && postResp.body.length){
            //    return {accessList : postResp.body, postResp.body}
            // }
            if (Array.isArray(postResp.body.accessList) && postResp.body.accessList.length) {
              return {
                accessList: postResp.body.accessList,
                shardusMemoryPatterns: postResp.body.shardusMemoryPatterns,
              }
            } else {
              return { accessList: [], shardusMemoryPatterns: null }
            }
          }
        } else {
          if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: consensusNode = null`)
          return { accessList: [], shardusMemoryPatterns: null }
        }
      } else {
        if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: false`)
      }
    }

    let txId = crypto.hashObj(opt)
    let preRunTxState = getPreRunTXState(txId)

    let callerAddress = toShardusAddress(callObj.from, AccountType.Account)
    let callerAccount = await AccountsStorage.getAccount(callerAddress)
    if (callerAccount) {
      preRunTxState._transactionState.insertFirstAccountReads(opt.caller, callerAccount.account)
    } else {
      const acctData = {
        nonce: 0,
        balance: oneEth.mul(new BN(100)), // 100 eth.  This is a temporary account that will never exist.
      }
      const fakeAccount = Account.fromAccountData(acctData)
      preRunTxState._transactionState.insertFirstAccountReads(opt.caller, fakeAccount)
    }

    opt['block'] = blocks[latestBlock]

    //@ts-ignore
    EVM.stateManager = null
    //@ts-ignore
    EVM.stateManager = preRunTxState
    const callResult = await EVM.runCall(opt)

    // const callResult = = await EVM.runTx({
    //   block: blocks[latestBlock],
    //   tx: transaction,
    //   skipNonce: !ShardeumFlags.CheckNonce,
    // })

    let readAccounts = preRunTxState._transactionState.getReadAccounts()
    let writtenAccounts = preRunTxState._transactionState.getWrittenAccounts()
    let allInvolvedContracts = []
    let accessList = []

    //get a full picture of the read/write 'bits'
    let readSet = new Set()
    let writeSet = new Set()
    //let readOnlySet = new Set()
    let writeOnceSet = new Set()

    //always make the sender rw.  This is because the sender will always spend gas and increment nonce
    if (callObj.from != null && callObj.from.length > 0) {
      let shardusKey = toShardusAddress(callObj.from, AccountType.Account)
      writeSet.add(shardusKey)
      readSet.add(shardusKey)
    }

    for (let [key, storageMap] of writtenAccounts.contractStorages) {
      if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)

      let shardusKey = toShardusAddress(key, AccountType.Account)
      //writeSet.add(shardusKey) //don't assume we write to this account!
      //let written accounts handle that!
      for (let storageAddress of storageMap.keys()) {
        shardusKey = toShardusAddressWithKey(key, storageAddress, AccountType.ContractStorage)
        writeSet.add(shardusKey)
      }
    }
    for (let [key, storageMap] of readAccounts.contractStorages) {
      if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)

      let shardusKey = toShardusAddress(key, AccountType.Account)
      readSet.add(shardusKey) //putting this is just to be "nice"
      //later we can remove the assumption that a CA is always read
      for (let storageAddress of storageMap.keys()) {
        shardusKey = toShardusAddressWithKey(key, storageAddress, AccountType.ContractStorage)
        readSet.add(shardusKey)
      }
    }

    for (let [codeHash, contractByteWrite] of readAccounts.contractBytes) {
      let contractAddress = contractByteWrite.contractAddress.toString()
      if (!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)

      let shardusKey = toShardusAddressWithKey(contractAddress, codeHash, AccountType.ContractCode)
      readSet.add(shardusKey)
    }

    for (let [codeHash, contractByteWrite] of writtenAccounts.contractBytes) {
      let contractAddress = contractByteWrite.contractAddress.toString()
      if (!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)
      let shardusKey = toShardusAddressWithKey(contractAddress, codeHash, AccountType.ContractCode)
      writeSet.add(shardusKey)
      //special case shardeum behavoir.  contract bytes can only be written once
      writeOnceSet.add(shardusKey)
    }
    for (let [key, contractByteWrite] of writtenAccounts.accounts) {
      let shardusKey = toShardusAddress(key, AccountType.Account)
      writeSet.add(shardusKey)
    }
    for (let [codeHash, contractByteWrite] of readAccounts.accounts) {
      let shardusKey = toShardusAddress(codeHash, AccountType.Account)
      readSet.add(shardusKey)
    }

    //process our keys into one of four sets (writeOnceSet defined above)
    let readOnlySet = new Set()
    let writeOnlySet = new Set()
    let readWriteSet = new Set()
    for (let key of writeSet.values()) {
      if (readSet.has(key)) {
        readWriteSet.add(key)
      } else {
        writeOnlySet.add(key)
      }
    }
    for (let key of readSet.values()) {
      if (writeSet.has(key) === false) {
        readOnlySet.add(key)
      }
    }
    let shardusMemoryPatterns = null

    if (ShardeumFlags.generateMemoryPatternData) {
      shardusMemoryPatterns = {
        ro: Array.from(readOnlySet),
        rw: Array.from(readWriteSet),
        wo: Array.from(writeOnlySet),
        on: Array.from(writeOnceSet),
      }
    }

    if (ShardeumFlags.VerboseLogs) {
      console.log('allInvolvedContracts', allInvolvedContracts)
      console.log('Read accounts', readAccounts)
      console.log('Written accounts', writtenAccounts)
    }

    for (let address of allInvolvedContracts) {
      let allKeys = new Set()
      let readKeysMap = readAccounts.contractStorages.get(address)
      let writeKeyMap = writtenAccounts.contractStorages.get(address)
      if (readKeysMap) {
        for (let [key, value] of readKeysMap) {
          if (!allKeys.has(key)) allKeys.add(key)
        }
      }

      if (writeKeyMap) {
        for (let [key, value] of writeKeyMap) {
          if (!allKeys.has(key)) allKeys.add(key)
        }
      }

      for (let [codeHash, byteReads] of readAccounts.contractBytes) {
        let contractAddress = byteReads.contractAddress.toString()
        if (contractAddress !== address) continue
        if (!allKeys.has(codeHash)) allKeys.add(codeHash)
      }
      for (let [codeHash, byteReads] of writtenAccounts.contractBytes) {
        let contractAddress = byteReads.contractAddress.toString()
        if (contractAddress !== address) continue
        if (!allKeys.has(codeHash)) allKeys.add(codeHash)
      }
      let accessListItem = [address, Array.from(allKeys).map(key => '0x' + key)]
      accessList.push(accessListItem)
    }

    if (ShardeumFlags.VerboseLogs) console.log('Predicted accessList', accessList)

    if (callResult.execResult.exceptionError) {
      if (ShardeumFlags.VerboseLogs) console.log('Execution Error:', callResult.execResult.exceptionError)
      return { accessList: [], shardusMemoryPatterns: null }
    }
    return { accessList, shardusMemoryPatterns }
  } catch (e) {
    console.log(`Error: generateAccessList`, e)
    return { accessList: [], shardusMemoryPatterns: null }
  }
}

function getNodeCountForCertSignatures(): number {
  let latestCycle: ShardusTypes.Cycle
  const latestCycles: ShardusTypes.Cycle[] = shardus.getLatestCycles()
  if (latestCycles && latestCycles.length > 0) [latestCycle] = latestCycles
  const activeNodeCount = latestCycle ? latestCycle.active : 1
  if (ShardeumFlags.VerboseLogs) console.log(`Active node count computed for cert signs ${activeNodeCount}`)
  return Math.min(ShardeumFlags.MinStakeCertSig, activeNodeCount)
}

/***
 *     ######  ##     ##    ###    ########  ########  ##     ##  ######      ######  ######## ######## ##     ## ########
 *    ##    ## ##     ##   ## ##   ##     ## ##     ## ##     ## ##    ##    ##    ## ##          ##    ##     ## ##     ##
 *    ##       ##     ##  ##   ##  ##     ## ##     ## ##     ## ##          ##       ##          ##    ##     ## ##     ##
 *     ######  ######### ##     ## ########  ##     ## ##     ##  ######      ######  ######      ##    ##     ## ########
 *          ## ##     ## ######### ##   ##   ##     ## ##     ##       ##          ## ##          ##    ##     ## ##
 *    ##    ## ##     ## ##     ## ##    ##  ##     ## ##     ## ##    ##    ##    ## ##          ##    ##     ## ##
 *     ######  ##     ## ##     ## ##     ## ########   #######   ######      ######  ########    ##     #######  ##
 */

/**
 * interface tx {
 *   type: string
 *   from: string,
 *   to: string,
 *   amount: number,
 *   timestamp: number
 * }
 */
shardus.setup({
  sync: sync(shardus, evmCommon),
  //validateTransaction is not a standard sharus function.  When we cleanup index.ts we need to move it out of here
  //also appdata and wrapped accounts should be passed in?
  validateTransaction: validateTransaction(shardus),
  validateTxnFields(timestampedTx, appData: any) {
    let { tx } = timestampedTx
    let txnTimestamp: number = getInjectedOrGeneratedTimestamp(timestampedTx)

    if (!txnTimestamp) {
      return {
        success: false,
        reason: 'Invalid transaction timestamp',
        txnTimestamp,
      }
    }

    if (isSetCertTimeTx(tx)) {
      let setCertTimeTx = tx as SetCertTime
      const result = validateSetCertTimeTx(setCertTimeTx, appData)
      return {
        success: result.isValid,
        reason: result.reason,
        txnTimestamp,
      }
    }

    if (isInternalTx(tx)) {
      let internalTX = tx as InternalTx
      let success = false
      let reason = ''

      // validate internal TX
      if (isInternalTXGlobal(internalTX) === true) {
        return {
          success: true,
          reason: '',
          txnTimestamp,
        }
      } else if (tx.internalTXType === InternalTXType.ChangeConfig) {
        try {
          // const devPublicKey = shardus.getDevPublicKey() // This have to be reviewed again whether to get from shardus interface or not
          const devPublicKey = ShardeumFlags.devPublicKey
          if (devPublicKey) {
            success = verify(tx, devPublicKey)
            if (!success) reason = 'Dev key does not match!'
          } else {
            success = false
            reason = 'Dev key is not defined on the server!'
          }
        } catch (e) {
          reason = 'Invalid signature for internal tx'
        }
      } else if (tx.internalTXType === InternalTXType.InitRewardTimes) {
        let result = InitRewardTimesTx.validateFields(tx, shardus)
        success = result.success
        reason = result.reason
      } else if (tx.internalTXType === InternalTXType.ClaimReward) {
        let result = validateClaimRewardTx(tx, appData)
        success = result.isValid
        reason = result.reason
      } else {
        try {
          success = crypto.verifyObj(internalTX)
        } catch (e) {
          reason = 'Invalid signature for internal tx'
        }
      }
      if (ShardeumFlags.VerboseLogs) console.log('validateTxsField', success, reason)
      return {
        success,
        reason,
        txnTimestamp: txnTimestamp,
      }
    }

    // Validate EVM tx fields
    let success = false
    let reason = 'Invalid EVM transaction fields'

    try {
      let txObj = getTransactionObj(tx)
      let isSigned = txObj.isSigned()
      let isSignatureValid = txObj.validate()
      if (ShardeumFlags.VerboseLogs) console.log('validate evm tx', isSigned, isSignatureValid)

      //const txId = '0x' + crypto.hashObj(timestampedTx.tx)
      const txHash = bufferToHex(txObj.hash())

      //limit debug app data size.  (a queue would be nicer, but this is very simple)
      if (debugAppdata.size > 1000) {
        debugAppdata.clear()
      }
      debugAppdata.set(txHash, appData)

      if (isSigned && isSignatureValid) {
        success = true
        reason = ''
      } else {
        reason = 'Transaction is not signed or signature is not valid'
        nestedCountersInstance.countEvent('shardeum', 'validate - sign ' + isSigned ? 'failed' : 'missing')
      }

      if (ShardeumFlags.txBalancePreCheck && appData != null) {
        let minBalance = ShardeumFlags.constantTxFee ? new BN(ShardeumFlags.constantTxFee) : new BN(1)
        //check with value added in
        minBalance = minBalance.add(txObj.value)
        let accountBalance = new BN(appData.balance)
        if (accountBalance.lt(minBalance)) {
          success = false
          reason = `Sender does not have enough balance.`
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`balance fail: sender ${txObj.getSenderAddress()} does not have enough balance. Min balance: ${minBalance.toString()}, Account balance: ${accountBalance.toString()}`)
          nestedCountersInstance.countEvent('shardeum', 'validate - insufficient balance')
        } else {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`balance pass: sender ${txObj.getSenderAddress()} has balance of ${accountBalance.toString()}`)
        }
      }

      if (ShardeumFlags.txNoncePreCheck && appData != null) {
        let txNonce = txObj.nonce.toNumber()
        let perfectCount = appData.nonce + appData.queueCount
        if (txNonce != perfectCount) {
          success = false
          reason = `Transaction nonce != ${txNonce} ${perfectCount}`
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`nonce fail: perfectCount:${perfectCount} != ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${txObj.hash().toString('hex')} `)
          nestedCountersInstance.countEvent('shardeum', 'validate - nonce fail')
        } else {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`nonce pass: perfectCount:${perfectCount} == ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount}  txHash: ${txObj.hash().toString('hex')}`)
        }
      }

      if (appData && appData.internalTx && appData.internalTXType === InternalTXType.Stake) {
        if (ShardeumFlags.VerboseLogs) console.log('Validating stake coins tx fields', appData)
        let stakeCoinsTx = appData.internalTx as StakeCoinsTX
        let minStakeAmount = _base16BNParser(appData.networkAccount.current.stakeRequired)
        if (typeof stakeCoinsTx.stake === 'string') stakeCoinsTx.stake = new BN(stakeCoinsTx.stake, 16)
        if (
          stakeCoinsTx.nominator == null ||
          stakeCoinsTx.nominator.toLowerCase() !== txObj.getSenderAddress().toString()
        ) {
          if (ShardeumFlags.VerboseLogs)
            console.log(`nominator vs tx signer`, stakeCoinsTx.nominator, txObj.getSenderAddress().toString())
          success = false
          reason = `Invalid nominator address in stake coins tx`
        } else if (stakeCoinsTx.nominee == null) {
          success = false
          reason = `Invalid nominee address in stake coins tx`
        } else if (!/^[A-Fa-f0-9]{64}$/.test(stakeCoinsTx.nominee)) {
          //TODO: NEED to potentially write a custom faster test that avoids regex so we can avoid a regex-dos attack
          success = false
          reason = 'Invalid nominee address in stake coins tx'
        } else if (!stakeCoinsTx.stake.eq(txObj.value)) {
          if (ShardeumFlags.VerboseLogs)
            console.log(
              `Tx value and stake amount are different`,
              stakeCoinsTx.stake.toString(),
              txObj.value.toString()
            )
          success = false
          reason = `Tx value and stake amount are different`
        } else if (stakeCoinsTx.stake.lt(minStakeAmount)) {
          success = false
          reason = `Stake amount is less than minimum required stake amount`
        }
      }

      if (appData && appData.internalTx && appData.internalTXType === InternalTXType.Unstake) {
        nestedCountersInstance.countEvent('shardeum-unstaking', 'validating unstake coins tx fields')
        if (ShardeumFlags.VerboseLogs) console.log('Validating unstake coins tx fields', appData.internalTx)
        let unstakeCoinsTX = appData.internalTx as UnstakeCoinsTX
        if (
          unstakeCoinsTX.nominator == null ||
          unstakeCoinsTX.nominator.toLowerCase() !== txObj.getSenderAddress().toString()
        ) {
          nestedCountersInstance.countEvent(
            'shardeum-unstaking',
            'invalid nominator address in stake coins tx'
          )
          if (ShardeumFlags.VerboseLogs)
            console.log(
              `nominator vs tx signer`,
              unstakeCoinsTX.nominator,
              txObj.getSenderAddress().toString()
            )
          success = false
          reason = `Invalid nominator address in stake coins tx`
        } else if (unstakeCoinsTX.nominee == null) {
          nestedCountersInstance.countEvent('shardeum-unstaking', 'invalid nominee address in stake coins tx')
          success = false
          reason = `Invalid nominee address in stake coins tx`
        }
        // todo: check the nominator account timestamp against ? may be no needed cos it evm tx has a nonce check too
      }
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('validate error', e)
      nestedCountersInstance.countEvent('shardeum-unstaking', 'validate - exception')
      success = false
      reason = e.message
    }

    nestedCountersInstance.countEvent('shardeum-unstaking', 'tx validation successful')
    return {
      success,
      reason,
      txnTimestamp,
    }
  },
  async apply(timestampedTx, wrappedStates, appData) {
    let { tx } = timestampedTx
    const txTimestamp = getInjectedOrGeneratedTimestamp(timestampedTx)
    // Validate the tx
    const { result, reason } = this.validateTransaction(tx)
    if (result !== 'pass') {
      throw new Error(`invalid transaction, reason: ${reason}. tx: ${JSON.stringify(tx)}`)
    }

    if (isInternalTx(tx)) {
      return applyInternalTx(tx, wrappedStates, txTimestamp)
    }

    if (isDebugTx(tx)) {
      let debugTx = tx as DebugTx
      return applyDebugTx(debugTx, wrappedStates, txTimestamp)
    }

    const transaction: Transaction | AccessListEIP2930Transaction = getTransactionObj(tx)
    const ethTxId = bufferToHex(transaction.hash())
    const shardusReceiptAddress = toShardusAddressWithKey(ethTxId, '', AccountType.Receipt)
    let txId = crypto.hashObj(tx)
    // Create an applyResponse which will be used to tell Shardus that the tx has been applied
    if (ShardeumFlags.VerboseLogs)
      console.log('DBG', new Date(), 'attempting to apply tx', txId, ethTxId, tx, wrappedStates, appData)
    const applyResponse = shardus.createApplyResponse(txId, txTimestamp)

    //Now we need to get a transaction state object.  For single sharded networks this will be a new object.
    //When we have multiple shards we could have some blob data that wrapped up read accounts.  We will read these accounts
    //Into the the transaction state init at some point (possibly not here).  This will allow the EVM to run and not have
    //A storage miss for accounts that were read on previous shard attempts to exectute this TX
    // let transactionState = transactionStateMap.get(txId)
    // if (transactionState == null) {
    //   transactionState = new TransactionState()
    //   transactionState.initData(
    //     shardeumStateManager,
    //     {
    //       storageMiss: accountMiss,
    //       contractStorageMiss,
    //       accountInvolved,
    //       contractStorageInvolved,
    //       tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp
    //     },
    //     txId,
    //     undefined,
    //     undefined
    //   )
    //   transactionStateMap.set(txId, transactionState)
    // } else {
    //   //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
    //   //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
    // }

    let shardeumState = getApplyTXState(txId)
    shardeumState._transactionState.appData = appData

    if (appData.internalTx && appData.internalTXType === InternalTXType.Stake) {
      if (ShardeumFlags.VerboseLogs) console.log('applying stake tx', wrappedStates, appData)

      // get stake tx from appData.internalTx
      let stakeCoinsTx: StakeCoinsTX = appData.internalTx
      let operatorShardusAddress = toShardusAddress(stakeCoinsTx.nominator, AccountType.Account)
      const operatorEVMAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress].data

      // validate tx timestamp, compare timestamp against account's timestamp
      if (stakeCoinsTx.timestamp < operatorEVMAccount.timestamp) {
        throw new Error('Stake transaction timestamp is too old')
      }

      // Validate tx timestamp against certExp
      if (operatorEVMAccount.operatorAccountInfo && operatorEVMAccount.operatorAccountInfo.certExp > 0) {
        if (stakeCoinsTx.timestamp > operatorEVMAccount.operatorAccountInfo.certExp) {
          throw new Error('Operator certExp is already set and expired compared to stake transaction')
        }
      }

      // set stake value, nominee, cert in OperatorAcc (if not set yet)
      let nomineeNodeAccount2Address = stakeCoinsTx.nominee
      operatorEVMAccount.timestamp = txTimestamp

      // todo: operatorAccountInfo field may not exist in the operatorEVMAccount yet
      if (operatorEVMAccount.operatorAccountInfo == null) {
        operatorEVMAccount.operatorAccountInfo = { stake: new BN(0), nominee: '', certExp: null }
      }
      operatorEVMAccount.operatorAccountInfo.stake = stakeCoinsTx.stake
      operatorEVMAccount.operatorAccountInfo.nominee = stakeCoinsTx.nominee
      operatorEVMAccount.operatorAccountInfo.certExp = 0
      fixDeserializedWrappedEVMAccount(operatorEVMAccount)

      let totalAmountToDeduct = stakeCoinsTx.stake.add(new BN(ShardeumFlags.constantTxFee))
      operatorEVMAccount.account.balance = operatorEVMAccount.account.balance.sub(totalAmountToDeduct)
      operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce.add(new BN('1'))

      let operatorEVMAddress: Address = Address.fromString(stakeCoinsTx.nominator)
      await shardeumState.checkpoint()
      await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
      await shardeumState.commit()

      let updatedOperatorEVMAccount = await shardeumState.getAccount(operatorEVMAddress)

      const nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data
      nodeAccount2.nominator = stakeCoinsTx.nominator
      nodeAccount2.stakeLock = stakeCoinsTx.stake
      nodeAccount2.timestamp = txTimestamp

      if (ShardeumFlags.useAccountWrites) {
        // for operator evm account
        let { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
        console.log('\nAccount Writes: ', accountWrites)
        for (let account of accountWrites.entries()) {
          let addressStr = account[0]
          if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
            continue
          }
          let accountObj = Account.fromRlpSerializedAccount(account[1])
          console.log('\nWritten Account Object: ', accountObj)

          console.log('written account Obj', accountObj)

          let wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }

          updateEthAccountHash(wrappedEVMAccount)
          const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount,
            txId,
            wrappedChangedAccount.timestamp
          )
        }

        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
          wrappedStates[nomineeNodeAccount2Address].data
        )
        // for nominee node account
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          nomineeNodeAccount2Address,
          wrappedChangedAccount,
          txId,
          txTimestamp
        )
      }

      // generate a proper receipt for stake tx
      let readableReceipt: ReadableReceipt = {
        status: 1,
        transactionHash: ethTxId,
        transactionIndex: '0x1',
        blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
        nonce: transaction.nonce.toString('hex'),
        blockHash: readableBlocks[latestBlock].hash,
        cumulativeGasUsed: '0x' + new BN(ShardeumFlags.constantTxFee).toString('hex'),
        gasUsed: '0x' + new BN(ShardeumFlags.constantTxFee).toString('hex'),
        logs: [],
        logsBloom: '',
        contractAddress: null,
        from: transaction.getSenderAddress().toString(),
        to: transaction.to ? transaction.to.toString() : null,
        value: transaction.value.toString('hex'),
        data: '0x' + transaction.data.toString('hex'),
      }

      let evmReceipt: any = {} // hack cos we don't run this tx with evm
      let wrappedReceiptAccount = {
        timestamp: txTimestamp,
        ethAddress: ethTxId,
        hash: '',
        receipt: evmReceipt,
        readableReceipt,
        amountSpent: totalAmountToDeduct.toString(),
        txId,
        accountType: AccountType.Receipt,
        txFrom: stakeCoinsTx.nominator,
      }
      /* prettier-ignore */
      if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)

      if (ShardeumFlags.EVMReceiptsAsAccounts) {
        if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx ${txId}`)
        if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx eth ${ethTxId}`)
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
        if (shardus.applyResponseAddChangedAccount != null) {
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount,
            txId,
            wrappedChangedAccount.timestamp
          )
        }
      } else {
        const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
        shardus.applyResponseAddReceiptData(
          applyResponse,
          receiptShardusAccount,
          crypto.hashObj(receiptShardusAccount)
        )
      }
      return applyResponse
    }

    if (appData.internalTx && appData.internalTXType === InternalTXType.Unstake) {
      nestedCountersInstance.countEvent('shardeum-unstaking', 'applying unstake transaction')
      if (ShardeumFlags.VerboseLogs) console.log('applying unstake tx', wrappedStates, appData)

      // get unstake tx from appData.internalTx
      let unstakeCoinsTX: UnstakeCoinsTX = appData.internalTx

      // todo: validate tx timestamp, compare timestamp against account's timestamp

      // todo: validate cert exp

      // set stake value, nominee, cert in OperatorAcc (if not set yet)
      let operatorShardusAddress = toShardusAddress(unstakeCoinsTX.nominator, AccountType.Account)
      let nomineeNodeAccount2Address = unstakeCoinsTX.nominee
      const operatorEVMAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress].data
      operatorEVMAccount.timestamp = txTimestamp

      if (operatorEVMAccount.operatorAccountInfo == null) {
        nestedCountersInstance.countEvent(
          'shardeum-unstaking',
          'unable to apply unstake tx, operator account info does not exist'
        )
        throw new Error(
          `Unable to apply Unstake tx because operator account info does not exist for ${unstakeCoinsTX.nominator}`
        )
      }
      fixDeserializedWrappedEVMAccount(operatorEVMAccount)

      let nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data

      let currentBalance = operatorEVMAccount.account.balance
      let stake = new BN(operatorEVMAccount.operatorAccountInfo.stake, 16)
      let reward = new BN(nodeAccount2.reward, 16)
      let penalty = new BN(nodeAccount2.penalty, 16)
      let txFee = new BN(ShardeumFlags.constantTxFee, 10)
      if (ShardeumFlags.VerboseLogs)
        console.log('calculating new balance after unstake', currentBalance, stake, reward, penalty, txFee)
      let newBalance = currentBalance
        .add(stake)
        .add(reward)
        .sub(penalty)
        .sub(txFee)
      operatorEVMAccount.account.balance = newBalance
      operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce.add(new BN('1'))

      operatorEVMAccount.operatorAccountInfo.stake = new BN(0)
      operatorEVMAccount.operatorAccountInfo.nominee = null
      operatorEVMAccount.operatorAccountInfo.certExp = null

      let operatorEVMAddress: Address = Address.fromString(unstakeCoinsTX.nominator)
      await shardeumState.checkpoint()
      await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
      await shardeumState.commit()

      nodeAccount2.nominator = null
      nodeAccount2.stakeLock = new BN(0)
      nodeAccount2.timestamp = txTimestamp
      nodeAccount2.penalty = new BN(0)
      nodeAccount2.reward = new BN(0)
      nodeAccount2.rewardStartTime = 0
      nodeAccount2.rewardEndTime = 0

      if (ShardeumFlags.useAccountWrites) {
        // for operator evm account
        let { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
        console.log('\nAccount Writes: ', accountWrites)
        for (let account of accountWrites.entries()) {
          let addressStr = account[0]
          if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
            continue
          }
          let accountObj = Account.fromRlpSerializedAccount(account[1])
          console.log('\nWritten Account Object: ', accountObj)

          console.log('written account Obj', accountObj)

          let wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }
          updateEthAccountHash(wrappedEVMAccount)
          const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount,
            txId,
            wrappedChangedAccount.timestamp
          )
        }

        // for nominee node account
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          nomineeNodeAccount2Address,
          wrappedStates[nomineeNodeAccount2Address],
          txId,
          txTimestamp
        )
      }

      // generate a proper receipt for stake tx
      let readableReceipt: ReadableReceipt = {
        status: 1,
        transactionHash: ethTxId,
        transactionIndex: '0x1',
        blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
        nonce: transaction.nonce.toString('hex'),
        blockHash: readableBlocks[latestBlock].hash,
        cumulativeGasUsed: '0x' + new BN(ShardeumFlags.constantTxFee).toString('hex'),
        gasUsed: '0x' + new BN(ShardeumFlags.constantTxFee).toString('hex'),
        logs: [],
        logsBloom: '',
        contractAddress: null,
        from: transaction.getSenderAddress().toString(),
        to: transaction.to ? transaction.to.toString() : null,
        value: transaction.value.toString('hex'),
        data: '0x' + transaction.data.toString('hex'),
      }

      let evmReceipt: any = {} // hack cos we don't run this tx with evm
      let wrappedReceiptAccount = {
        timestamp: txTimestamp,
        ethAddress: ethTxId,
        hash: '',
        receipt: evmReceipt,
        readableReceipt,
        amountSpent: newBalance.toString(),
        txId,
        accountType: AccountType.Receipt,
        txFrom: unstakeCoinsTX.nominator,
      }
      /* prettier-ignore */
      if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)

      if (ShardeumFlags.EVMReceiptsAsAccounts) {
        if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx ${txId}`)
        if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx eth ${ethTxId}`)
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
        if (shardus.applyResponseAddChangedAccount != null) {
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount,
            txId,
            wrappedChangedAccount.timestamp
          )
        }
      } else {
        const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
        shardus.applyResponseAddReceiptData(
          applyResponse,
          receiptShardusAccount,
          crypto.hashObj(receiptShardusAccount)
        )
      }
      return applyResponse
    }

    let validatorStakedAccounts: Map<string, OperatorAccountInfo> = new Map()

    //ah shoot this binding will not be "thread safe" may need to make it part of the EEI for this tx? idk.
    //shardeumStateManager.setTransactionState(transactionState)

    // loop through the wrappedStates an insert them into the transactionState as first*Reads
    for (let accountId in wrappedStates) {
      if (shardusReceiptAddress === accountId) {
        //have to skip the created receipt account
        continue
      }

      let wrappedEVMAccount: WrappedEVMAccount = wrappedStates[accountId].data
      fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
      let address
      if (wrappedEVMAccount.accountType === AccountType.ContractCode)
        address = Address.fromString(wrappedEVMAccount.contractAddress)
      else address = Address.fromString(wrappedEVMAccount.ethAddress)

      if (ShardeumFlags.VerboseLogs) {
        let ourNodeShardData = shardus.stateManager.currentCycleShardData.nodeShardData
        let minP = ourNodeShardData.consensusStartPartition
        let maxP = ourNodeShardData.consensusEndPartition
        let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
        let { homePartition } = __ShardFunctions.addressToPartition(
          shardus.stateManager.currentCycleShardData.shardGlobals,
          shardusAddress
        )
        let accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false

        /* prettier-ignore */ console.log('DBG', 'tx insert data', txId, `accountIsRemote: ${accountIsRemote} acc:${address} key:${wrappedEVMAccount.key} type:${wrappedEVMAccount.accountType}`)
      }

      if (wrappedEVMAccount.accountType === AccountType.Account) {
        shardeumState._transactionState.insertFirstAccountReads(address, wrappedEVMAccount.account)
        if (wrappedEVMAccount.operatorAccountInfo) {
          validatorStakedAccounts.set(wrappedEVMAccount.ethAddress, wrappedEVMAccount.operatorAccountInfo)
        }
      } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
        shardeumState._transactionState.insertFirstContractBytesReads(address, wrappedEVMAccount.codeByte)
      } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
        shardeumState._transactionState.insertFirstContractStorageReads(
          address,
          wrappedEVMAccount.key,
          wrappedEVMAccount.value
        )
      }
    }

    // this code's got bug
    // if(ShardeumFlags.CheckNonce === true){
    //   let senderEVMAddrStr = transaction.getSenderAddress().toString()
    //   let shardusAddress = toShardusAddress(senderEVMAddrStr,  AccountType.Account)
    //   let senderAccount:WrappedEVMAccount = wrappedStates[shardusAddress]
    //  bug here seem like nonce is undefined even though type def indicate, it does.
    //   if(senderAccount.account.nonce >= transaction.nonce ){
    //     throw new Error(`invalid transaction, reason: nonce fail. tx: ${JSON.stringify(tx)}`)
    //   }
    // }

    // Apply the tx
    // const runTxResult = await EVM.runTx({tx: transaction, skipNonce: !ShardeumFlags.CheckNonce, skipBlockGasLimitValidation: true})
    let blockForTx = getOrCreateBlockFromTimestamp(txTimestamp)
    if (ShardeumFlags.VerboseLogs) console.log(`Block for tx ${ethTxId}`, blockForTx.header.number.toNumber())
    let runTxResult: RunTxResult
    let wrappedReceiptAccount: WrappedEVMAccount
    try {
      // if checkNonce is true, we're not gonna skip the nonce
      //@ts-ignore
      EVM.stateManager = null
      //@ts-ignore
      EVM.stateManager = shardeumState
      runTxResult = await EVM.runTx({
        block: blockForTx,
        tx: transaction,
        skipNonce: !ShardeumFlags.CheckNonce,
      })
      if (ShardeumFlags.VerboseLogs) console.log('runTxResult', txId, runTxResult)
    } catch (e) {
      // if (!transactionFailHashMap[ethTxId]) {
      let caAddr = null
      if (!transaction.to) {
        let txSenderEvmAddr = transaction.getSenderAddress().toString()

        let hack0Nonce = new BN(0)
        let caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, hack0Nonce)

        caAddr = '0x' + caAddrBuf.toString('hex')

        let shardusAddr = toShardusAddress(caAddr, AccountType.Account)
        // otherAccountKeys.push(shardusAddr)
        // shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })

        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Predicting contract account address:', caAddr, shardusAddr)
      }
      let readableReceipt: ReadableReceipt = {
        status: 0,
        transactionHash: ethTxId,
        transactionIndex: '0x1',
        blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
        nonce: transaction.nonce.toString('hex'),
        blockHash: readableBlocks[latestBlock].hash,
        cumulativeGasUsed: '0x',
        logs: null,
        logsBloom: null,
        gasUsed: '0x',
        contractAddress: caAddr,
        from: transaction.getSenderAddress().toString(),
        to: transaction.to ? transaction.to.toString() : null,
        value: transaction.value.toString('hex'),
        data: '0x',
        reason: e.toString(),
      }
      wrappedReceiptAccount = {
        timestamp: txTimestamp,
        ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
        hash: '',
        // receipt: runTxResult.receipt,
        readableReceipt,
        amountSpent: '0',
        txId,
        accountType: AccountType.Receipt,
        txFrom: transaction.getSenderAddress().toString(),
      }
      // if (ShardeumFlags.EVMReceiptsAsAccounts) {
      //   transactionFailHashMap[ethTxId] = wrappedFailReceiptAccount
      //   // const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedFailReceiptAccount)
      //   // if (shardus.applyResponseAddChangedAccount != null) {
      //   //   shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
      //   // }
      // } else {

      //   const shardusWrappedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedFailReceiptAccount)
      //   //communicate this in the message back to sharuds so we can attach it to the fail receipt
      //   shardus.applyResponseAddReceiptData(applyResponse, shardusWrappedAccount, crypto.hashObj(shardusWrappedAccount))
      //   shardus.applyResponseSetFailed(applyResponse, reason)
      //   return applyResponse //return rather than throw exception
      // }
      // }
      shardus.log('Unable to apply transaction', e)
      if (ShardeumFlags.VerboseLogs) console.log('Unable to apply transaction', txId, e)
      // throw new Error(e)
    }
    // Still keeping this here to check later if it may need later
    // if (runTxResult.execResult.exceptionError) {
    //   let readableReceipt: ReadableReceipt = {
    //     status: 0,
    //     transactionHash: ethTxId,
    //     transactionIndex: '0x1',
    //     blockNumber: readableBlocks[latestBlock].number,
    //     nonce: transaction.nonce.toString('hex'),
    //     blockHash: readableBlocks[latestBlock].hash,
    //     cumulativeGasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
    //     gasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
    //     logs: null,
    //     contractAddress: runTxResult.createdAddress ? runTxResult.createdAddress.toString() : null,
    //     from: transaction.getSenderAddress().toString(),
    //     to: transaction.to ? transaction.to.toString() : null,
    //     value: transaction.value.toString('hex'),
    //     data: '0x' + transaction.data.toString('hex'),
    //   }
    //   let wrappedFailReceiptAccount: WrappedEVMAccount = {
    //     timestamp: txTimestamp,
    //     ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
    //     hash: '',
    //     receipt: runTxResult.receipt,
    //     readableReceipt,
    //     txId,
    //     accountType: AccountType.Receipt,
    //     txFrom: transaction.getSenderAddress().toString(),
    //   }
    //   if(ShardeumFlags.EVMReceiptsAsAccounts){
    //     // transactionFailHashMap[ethTxId] = wrappedFailReceiptAccount
    //     const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedFailReceiptAccount)
    //     if (shardus.applyResponseAddChangedAccount != null) {
    //       shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
    //     }
    //     shardeumStateManager.unsetTransactionState()
    //     return applyResponse //return rather than throw exception
    //   } else {
    //     //keep this for now but maybe remove it soon
    //     // transactionFailHashMap[ethTxId] = wrappedFailReceiptAccount

    //     //put this on the fail receipt. we need a way to pass it in the exception!
    //     const shardusWrappedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedFailReceiptAccount)
    //     shardus.applyResponseAddReceiptData(applyResponse,shardusWrappedAccount, crypto.hashObj(shardusWrappedAccount))
    //     shardus.applyResponseSetFailed(applyResponse, reason)
    //     return applyResponse //return rather than throw exception
    //   }
    //   // throw new Error(`invalid transaction, reason: ${JSON.stringify(runTxResult.execResult.exceptionError)}. tx: ${JSON.stringify(tx)}`)
    // }
    if (ShardeumFlags.VerboseLogs) console.log('DBG', 'applied tx', txId, runTxResult)
    if (ShardeumFlags.VerboseLogs) console.log('DBG', 'applied tx eth', ethTxId, runTxResult)

    if (ShardeumFlags.AppliedTxsMaps) {
      shardusTxIdToEthTxId[txId] = ethTxId // todo: fix that this is getting set too early, should wait untill after TX consensus

      // this is to expose tx data for json rpc server
      appliedTxs[ethTxId] = {
        txId: ethTxId,
        injected: tx,
        receipt: { ...runTxResult, nonce: transaction.nonce.toString('hex'), status: 1 },
      }
    }

    // if (ShardeumFlags.temporaryParallelOldMode === true) {
    //   //This is also temporary.  It will move to the UpdateAccountFull code once we wrap the receipt a an account type
    //   // shardus-global-server wont be calling all of the UpdateAccountFull calls just yet though so we need this here
    //   // but it is ok to start adding the code that handles receipts in UpdateAccountFull and understand it will get called
    //   // soon

    //   // TEMPORARY HACK
    //   // store contract account, when shardus-global-server has more progress we can disable this
    //   if (runTxResult.createdAddress) {
    //     let ethAccountID = runTxResult.createdAddress.toString()
    //     let shardusAddress = toShardusAddress(ethAccountID, AccountType.Account)
    //     let contractAccount = await EVM.stateManager.getAccount(runTxResult.createdAddress)
    //     let wrappedEVMAccount = {
    //       timestamp: 0,
    //       account: contractAccount,
    //       ethAddress: ethAccountID,
    //       hash: '',
    //       accountType: AccountType.Account,
    //     }

    //     WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)

    //     //accounts[shardusAddress] = wrappedEVMAccount
    //     await AccountsStorage.setAccount(shardusAddress, wrappedEVMAccount)

    //     if (ShardeumFlags.VerboseLogs) console.log('Contract account stored', wrappedEVMAccount)
    //   }
    // }

    //get a list of accounts or CA keys that have been written to
    //This is important because the EVM could change many accounts or keys that we are not aware of
    //the transactionState is what accumulates the writes that we need
    let {
      accounts: accountWrites,
      contractStorages: contractStorageWrites,
      contractBytes: contractBytesWrites,
    } = shardeumState._transactionState.getWrittenAccounts()

    if (ShardeumFlags.VerboseLogs) console.log(`DBG: all contractStorages writes`, contractStorageWrites)

    for (let contractStorageEntry of contractStorageWrites.entries()) {
      //1. wrap and save/update this to shardeum accounts[] map
      let addressStr = contractStorageEntry[0]
      let contractStorageWrites = contractStorageEntry[1]
      for (let [key, value] of contractStorageWrites) {
        // do we need .entries()?
        let wrappedEVMAccount: WrappedEVMAccount = {
          timestamp: txTimestamp,
          key,
          value,
          ethAddress: addressStr, //this is confusing but I think we may want to use key here
          hash: '',
          accountType: AccountType.ContractStorage,
        }
        //for now the CA shardus address will be based off of key rather than the CA address
        //eventually we may use both with most significant hex of the CA address prepended
        //to the CA storage key (or a hash of the key)

        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        //attach to applyResponse
        if (shardus.applyResponseAddChangedAccount != null) {
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount,
            txId,
            wrappedChangedAccount.timestamp
          )
        }
      }
    }

    //Keep a map of CA addresses to codeHash
    //use this later in the loop of account updates to set the correct account code hash values
    let accountToCodeHash: Map<string, Buffer> = new Map()

    for (let contractBytesEntry of contractBytesWrites.entries()) {
      //1. wrap and save/update this to shardeum accounts[] map
      let addressStr = '0x' + contractBytesEntry[0]
      let contractByteWrite: ContractByteWrite = contractBytesEntry[1]

      let wrappedEVMAccount: WrappedEVMAccount = {
        timestamp: txTimestamp,
        codeHash: contractByteWrite.codeHash,
        codeByte: contractByteWrite.contractByte,
        ethAddress: addressStr,
        contractAddress: contractByteWrite.contractAddress.toString(),
        hash: '',
        accountType: AccountType.ContractCode,
      }

      //add our codehash to the map entry for the CA address
      accountToCodeHash.set(contractByteWrite.contractAddress.toString(), contractByteWrite.codeHash)

      if (ShardeumFlags.globalCodeBytes === true) {
        //set this globally instead!
        setGlobalCodeByteUpdate(txTimestamp, wrappedEVMAccount, applyResponse)
      } else {
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        //attach to applyResponse
        if (shardus.applyResponseAddChangedAccount != null) {
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount,
            txId,
            wrappedChangedAccount.timestamp
          )
        }
      }
    }

    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('DBG: all account writes', shardeumState._transactionState.logAccountWrites(accountWrites))

    // Handle Account type last, because CAs may depend on CA:Storage or CA:Bytecode updates
    //wrap these accounts and keys up and add them to the applyResponse as additional involved accounts
    for (let account of accountWrites.entries()) {
      //1. wrap and save/update this to shardeum accounts[] map
      let addressStr = account[0]
      if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
        //do not inform shardus about the 0 address account
        continue
      }
      let accountObj = Account.fromRlpSerializedAccount(account[1])

      let wrappedEVMAccount: WrappedEVMAccount = {
        timestamp: txTimestamp,
        account: accountObj,
        ethAddress: addressStr,
        hash: '',
        accountType: AccountType.Account,
      }
      if (validatorStakedAccounts.has(addressStr))
        wrappedEVMAccount.operatorAccountInfo = validatorStakedAccounts.get(addressStr)
      //If this account has an entry in the map use it to set the codeHash.
      // the ContractCode "account" will get pushed later as a global TX
      if (accountToCodeHash.has(addressStr)) {
        accountObj.codeHash = accountToCodeHash.get(addressStr)
      }

      updateEthAccountHash(wrappedEVMAccount)

      // I think data is unwrapped too much and we should be using wrappedEVMAccount directly as data
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)

      // and the added it to the apply response (not implemented yet)
      //Attach the written account data to the apply response.  This will allow it to be shared with other shards if needed.
      if (shardus.applyResponseAddChangedAccount != null) {
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          wrappedChangedAccount.accountId,
          wrappedChangedAccount,
          txId,
          wrappedChangedAccount.timestamp
        )
      }
    }

    let txSenderEvmAddr = transaction.getSenderAddress().toString()
    //TODO also create an account for the receipt (nested in the returned runTxResult should be a receipt with a list of logs)
    // We are ready to loop over the receipts and add them
    if (runTxResult) {
      let runState: RunStateWithLogs = runTxResult.execResult.runState
      let logs = []
      if (runState == null) {
        if (ShardeumFlags.VerboseLogs) console.log(`No runState found in the receipt for ${txId}`)
      } else {
        logs = runState.logs.map((l: any[]) => {
          return {
            logIndex: '0x1',
            blockNumber: readableBlocks[latestBlock].number,
            blockHash: readableBlocks[latestBlock].hash,
            transactionHash: ethTxId,
            transactionIndex: '0x1',
            address: bufferToHex(l[0]),
            topics: l[1].map(i => bufferToHex(i)),
            data: bufferToHex(l[2]),
          }
        })
      }

      let readableReceipt: ReadableReceipt = {
        status: runTxResult.receipt['status'],
        transactionHash: ethTxId,
        transactionIndex: '0x1',
        blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
        nonce: transaction.nonce.toString('hex'),
        blockHash: readableBlocks[latestBlock].hash,
        cumulativeGasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
        gasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
        logs: logs,
        logsBloom: bufferToHex(runTxResult.receipt.bitvector),
        contractAddress: runTxResult.createdAddress ? runTxResult.createdAddress.toString() : null,
        from: transaction.getSenderAddress().toString(),
        to: transaction.to ? transaction.to.toString() : null,
        value: transaction.value.toString('hex'),
        data: '0x' + transaction.data.toString('hex'),
      }
      if (runTxResult.execResult.exceptionError) {
        readableReceipt.reason = runTxResult.execResult.exceptionError.error
      }
      wrappedReceiptAccount = {
        timestamp: txTimestamp,
        ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
        hash: '',
        receipt: runTxResult.receipt,
        readableReceipt,
        amountSpent: runTxResult.amountSpent.toString(),
        txId,
        accountType: AccountType.Receipt,
        txFrom: txSenderEvmAddr,
      }
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)
    }

    if (ShardeumFlags.EVMReceiptsAsAccounts) {
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
      if (shardus.applyResponseAddChangedAccount != null) {
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          wrappedChangedAccount.accountId,
          wrappedChangedAccount,
          txId,
          wrappedChangedAccount.timestamp
        )
      }
    } else {
      const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
      //put this in the apply response
      shardus.applyResponseAddReceiptData(
        applyResponse,
        receiptShardusAccount,
        crypto.hashObj(receiptShardusAccount)
      )
    }
    if (ShardeumFlags.VerboseLogs) console.log('Applied txId', txId, txTimestamp)

    // not sure what to do here.
    // shardus.applyResponseAddReceiptData(applyResponse, readableReceipt, crypto.hashObj(readableReceipt))
    // shardus.applyResponseSetFailed(applyResponse, reason)
    // return applyResponse //return rather than throw exception

    //TODO need to detect if an execption here is a result of jumping the TX to another thread!
    // shardus must be made to handle that

    // todo can set a jummped value that we return!

    //shardeumStateManager.unsetTransactionState(txId)

    return applyResponse
  },
  getTimestampFromTransaction(tx, appData: any) {
    if (ShardeumFlags.VerboseLogs) console.log('Running getTimestampFromTransaction', tx, appData)
    if (ShardeumFlags.autoGenerateAccessList && appData && appData.requestNewTimestamp) {
      if (ShardeumFlags.VerboseLogs) console.log('Requesting new timestamp', appData)
      return -1
    } else return tx.timestamp ? tx.timestamp : 0
  },
  async txPreCrackData(tx, appData) {
    if (ShardeumFlags.VerboseLogs) console.log('Running txPreCrackData', tx, appData)
    if (ShardeumFlags.UseTXPreCrack === false) {
      return
    }

    if (isInternalTx(tx) === false && isDebugTx(tx) === false) {
      const transaction = getTransactionObj(tx)
      const shardusTxId = crypto.hashObj(tx)
      const ethTxId = bufferToHex(transaction.hash())
      if (ShardeumFlags.VerboseLogs) {
        console.log(`EVM tx ${ethTxId} is mapped to shardus tx ${shardusTxId}`)
        console.log(`Shardus tx ${shardusTxId} is mapped to EVM tx ${ethTxId}`)
      }

      let isStakeRelatedTx: boolean = isStakingEVMTx(transaction)

      let isEIP2930 =
        transaction instanceof AccessListEIP2930Transaction && transaction.AccessListJSON != null
      let isSimpleTransfer = false

      //if the TX is a contract deploy, predict the new contract address correctly (needs sender's nonce)
      //remote fetch of sender EOA also allows fast balance and nonce checking (assuming we get some queue hints as well from shardus core)
      if (
        ShardeumFlags.txNoncePreCheck ||
        ShardeumFlags.txBalancePreCheck ||
        (transaction.to == null && isEIP2930 === false)
      ) {
        let foundNonce = false
        let foundSender = false
        let foundTarget = false
        let nonce = new BN(0)
        let balance = new BN(0).toString()
        let txSenderEvmAddr = transaction.getSenderAddress().toString()
        let transformedSourceKey = toShardusAddress(txSenderEvmAddr, AccountType.Account)

        let queueCountResult = { count: 0, committingAppData: [] }
        let countPromise: Promise<any> = undefined
        if (ShardeumFlags.txNoncePreCheck) {
          //parallel fetch
          countPromise = shardus.getLocalOrRemoteAccountQueueCount(transformedSourceKey)
        }
        let remoteShardusAccount = await shardus.getLocalOrRemoteAccount(transformedSourceKey)

        let remoteTargetAccount = null
        if (transaction.to) {
          let txTargetEvmAddr = transaction.to.toString()
          let transformedTargetKey = toShardusAddress(txTargetEvmAddr, AccountType.Account)
          remoteTargetAccount = await shardus.getLocalOrRemoteAccount(transformedTargetKey)
        }
        if (ShardeumFlags.txNoncePreCheck) {
          //parallel fetch
          queueCountResult = await countPromise
          // queueCountResult = await shardus.getLocalOrRemoteAccountQueueCount(transformedSourceKey)
          if (ShardeumFlags.VerboseLogs) console.log('queueCountResult:', queueCountResult)
        }

        if (remoteShardusAccount == undefined) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData: found no local or remote account for address: ${txSenderEvmAddr}, key: ${transformedSourceKey}. using nonce=0`)
        } else {
          foundSender = true
          let wrappedEVMAccount = remoteShardusAccount.data as WrappedEVMAccount
          if (wrappedEVMAccount && wrappedEVMAccount.account) {
            fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
            nonce = wrappedEVMAccount.account.nonce
            balance = wrappedEVMAccount.account.balance.toString()
            foundNonce = true
          }
        }

        if (remoteTargetAccount == undefined) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData: found no local or remote account for target address`)
        } else {
          foundTarget = true
          let wrappedEVMAccount = remoteTargetAccount.data as WrappedEVMAccount
          if (wrappedEVMAccount && wrappedEVMAccount.account) {
            fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
            const codeHashString = wrappedEVMAccount.account.codeHash.toString('hex')
            if (codeHashString && codeHashString === emptyCodeHash) {
              isSimpleTransfer = true
            }
          }
        }

        //Predict the new CA address if not eip2930.  is this correct though?
        if (transaction.to == null && isEIP2930 === false) {
          let caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, nonce)
          let caAddr = '0x' + caAddrBuf.toString('hex')
          appData.newCAAddr = caAddr
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData found nonce:${foundNonce} found sender:${foundSender} for ${txSenderEvmAddr} nonce:${nonce.toString()} ca:${caAddr}`)
        }

        // Attach nonce, queueCount and txNonce to appData
        if (ShardeumFlags.txNoncePreCheck) {
          appData.queueCount = queueCountResult.count
          appData.nonce = parseInt(nonce.toString())
          if (queueCountResult.committingAppData.length > 0) {
            let highestCommittingNonce = queueCountResult.committingAppData
              .map(appData => appData.txNonce)
              .sort()[0]
            let expectedAccountNonce = highestCommittingNonce + 1
            if (appData.nonce < expectedAccountNonce) appData.nonce = expectedAccountNonce
          }
          appData.txNonce = transaction.nonce.toNumber()
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData found nonce:${foundNonce} found sender:${foundSender} for ${txSenderEvmAddr} nonce:${nonce.toString()} queueCount:${queueCountResult.count.toString()}`)
        }

        // Attach balance to appData
        if (ShardeumFlags.txBalancePreCheck) {
          appData.balance = balance
        }
      }

      //also run access list generation if needed
      if (
        !isSimpleTransfer &&
        ShardeumFlags.autoGenerateAccessList &&
        isEIP2930 === false &&
        !isStakeRelatedTx
      ) {
        let success = true
        let reason = ''
        //early pass on balance check to avoid expensive access list generation.
        if (ShardeumFlags.txBalancePreCheck && appData != null) {
          let minBalance = ShardeumFlags.constantTxFee ? new BN(ShardeumFlags.constantTxFee) : new BN(1)
          //check with value added in
          minBalance = minBalance.add(transaction.value)
          let accountBalance = new BN(appData.balance)
          if (accountBalance.lt(minBalance)) {
            success = false
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack balance fail: sender ${transaction.getSenderAddress()} does not have enough balance. Min balance: ${minBalance.toString()}, Account balance: ${accountBalance.toString()}`)
            nestedCountersInstance.countEvent('shardeum', 'precrack - insufficient balance')
          } else {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack balance pass: sender ${transaction.getSenderAddress()} has balance of ${accountBalance.toString()}`)
          }
        }

        if (ShardeumFlags.txNoncePreCheck && appData != null) {
          let txNonce = transaction.nonce.toNumber()
          let perfectCount = appData.nonce + appData.queueCount
          if (txNonce != perfectCount) {
            success = false
            reason = `Transaction nonce != ${txNonce} ${perfectCount}`
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce fail: perfectCount:${perfectCount} != ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${transaction.hash().toString('hex')} `)
            nestedCountersInstance.countEvent('shardeum', 'precrack - nonce fail')
          } else {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce pass: perfectCount:${perfectCount} == ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount}  txHash: ${transaction.hash().toString('hex')}`)
          }
        }

        if (success === true) {
          // generate access list for non EIP 2930 txs
          let callObj = {
            from: await transaction.getSenderAddress().toString(),
            to: transaction.to ? transaction.to.toString() : null,
            value: '0x' + transaction.value.toString('hex'),
            data: '0x' + transaction.data.toString('hex'),
            gasLimit: '0x' + transaction.gasLimit.toString('hex'),
            newContractAddress: appData.newCAAddr,
          }

          profilerInstance.scopedProfileSectionStart('accesslist-generate')
          let { accessList: generatedAccessList, shardusMemoryPatterns } = await generateAccessList(callObj)
          profilerInstance.scopedProfileSectionEnd('accesslist-generate')

          appData.accessList = generatedAccessList ? generatedAccessList : null
          appData.requestNewTimestamp = true
          appData.shardusMemoryPatterns = shardusMemoryPatterns
          nestedCountersInstance.countEvent('shardeum', 'precrack - generateAccessList')
        }
      }

      // crack stake related info and attach to appData
      if (isStakeRelatedTx === true) {
        try {
          let networkAccountData: WrappedAccount = await shardus.getLocalOrRemoteAccount(networkAccount)
          appData.internalTx = getStakeTxBlobFromEVMTx(transaction)
          appData.internalTXType = appData.internalTx.internalTXType
          appData.networkAccount = networkAccountData.data
          if (appData.internalTx.stake) appData.internalTx.stake = new BN(appData.internalTx.stake)
        } catch (e) {
          console.log('Error: while doing preCrack for stake related tx', e)
        }
      }
      if (ShardeumFlags.VerboseLogs)
        console.log(
          `txPreCrackData final result: txNonce: ${appData.txNonce}, currentNonce: ${
            appData.nonce
          }, queueCount: ${appData.queueCount}, appData ${JSON.stringify(appData)}`
        )
    }
  },

  crack(timestampedTx, appData) {
    if (ShardeumFlags.VerboseLogs) console.log('Running getKeyFromTransaction', timestampedTx)
    let { tx, timestampReceipt } = timestampedTx

    let timestamp: number = getInjectedOrGeneratedTimestamp(timestampedTx)

    let shardusMemoryPatterns = {}
    if (isInternalTx(tx)) {
      let customTXhash = null
      let internalTx = tx as InternalTx
      const keys = {
        sourceKeys: [],
        targetKeys: [],
        storageKeys: [],
        allKeys: [],
        timestamp: timestamp,
      }
      if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
        keys.sourceKeys = [internalTx.from]
      } else if (internalTx.internalTXType === InternalTXType.InitNetwork) {
        keys.targetKeys = [networkAccount]
      } else if (internalTx.internalTXType === InternalTXType.NodeReward) {
        keys.sourceKeys = [internalTx.from]
        keys.targetKeys = [toShardusAddress(internalTx.to, AccountType.Account), networkAccount]
      } else if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
        keys.sourceKeys = [tx.from]
        keys.targetKeys = [networkAccount]
      } else if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
        keys.targetKeys = [networkAccount]
      } else if (internalTx.internalTXType === InternalTXType.ChangeNetworkParam) {
        keys.sourceKeys = [tx.from]
        keys.targetKeys = [networkAccount]
      } else if (internalTx.internalTXType === InternalTXType.ApplyNetworkParam) {
        keys.targetKeys = [networkAccount]
      } else if (internalTx.internalTXType === InternalTXType.SetCertTime) {
        keys.sourceKeys = [tx.nominee]
        keys.targetKeys = [toShardusAddress(tx.nominator, AccountType.Account), networkAccount]
      } else if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
        keys.sourceKeys = [tx.nominee]

        // //force all TXs for the same reward to have the same hash
        // let tempTimestamp = tx.timestamp
        // tx.timestamp = tx.nodeActivatedTime
        // customTXhash = crypto.hashObj(tx, true)
        // //restore timestamp?
        // tx.timestamp = tempTimestamp
      } else if (internalTx.internalTXType === InternalTXType.ClaimReward) {
        keys.sourceKeys = [tx.nominee]
        keys.targetKeys = [networkAccount]

        // //force all TXs for the same reward to have the same hash
        // let tempTimestamp = tx.timestamp
        // tx.timestamp = tx.nodeActivatedTime
        // customTXhash = crypto.hashObj(tx, true)
        // //restore timestamp?
        // tx.timestamp = tempTimestamp
      }
      keys.allKeys = keys.allKeys.concat(keys.sourceKeys, keys.targetKeys, keys.storageKeys)
      // temporary hack for creating a receipt of node reward tx
      if (internalTx.internalTXType === InternalTXType.NodeReward) {
        if (ShardeumFlags.EVMReceiptsAsAccounts) {
          const txId = crypto.hashObj(tx)
          keys.allKeys = keys.allKeys.concat([txId]) // For Node Reward Receipt
        }
      }
      if (ShardeumFlags.VerboseLogs) console.log('crack', { timestamp, keys, id: crypto.hashObj(tx) })
      return {
        timestamp,
        keys,
        id: customTXhash ?? crypto.hashObj(tx),
      }
    }
    if (isDebugTx(tx)) {
      let debugTx = tx as DebugTx
      const keys = {
        sourceKeys: [],
        targetKeys: [],
        storageKeys: [],
        allKeys: [],
        timestamp: timestamp,
      }

      let transformedSourceKey = toShardusAddress(debugTx.from, AccountType.Debug)
      let transformedTargetKey = debugTx.to ? toShardusAddress(debugTx.to, AccountType.Debug) : ''
      keys.sourceKeys.push(transformedSourceKey)
      shardusAddressToEVMAccountInfo.set(transformedSourceKey, {
        evmAddress: debugTx.from,
        type: AccountType.Debug,
      })
      if (debugTx.to) {
        keys.targetKeys.push(transformedTargetKey)
        shardusAddressToEVMAccountInfo.set(transformedTargetKey, {
          evmAddress: debugTx.to,
          type: AccountType.Debug,
        })
      }

      keys.allKeys = keys.allKeys.concat(keys.sourceKeys, keys.targetKeys, keys.storageKeys)
      return {
        timestamp,
        keys,
        id: crypto.hashObj(tx),
      }
    }

    const transaction = getTransactionObj(tx)
    const result = {
      sourceKeys: [],
      targetKeys: [],
      storageKeys: [],
      allKeys: [],
      timestamp: timestamp,
    }
    const txId = crypto.hashObj(tx)
    try {
      let otherAccountKeys = []
      let txSenderEvmAddr = transaction.getSenderAddress().toString()
      let txToEvmAddr = transaction.to ? transaction.to.toString() : undefined
      let transformedSourceKey = toShardusAddress(txSenderEvmAddr, AccountType.Account)
      let transformedTargetKey = transaction.to ? toShardusAddress(txToEvmAddr, AccountType.Account) : ''

      result.sourceKeys.push(transformedSourceKey)
      shardusAddressToEVMAccountInfo.set(transformedSourceKey, {
        evmAddress: txSenderEvmAddr,
        type: AccountType.Account,
      })

      // add nominee (NodeAcc) to targetKeys
      if (
        appData.internalTx &&
        (appData.internalTXType === InternalTXType.Stake || appData.internalTXType === InternalTXType.Unstake)
      ) {
        let transformedTargetKey = appData.internalTx.nominee // no need to convert to shardus address
        result.targetKeys.push(transformedTargetKey)
      }

      if (transaction.to && transaction.to.toString() !== ShardeumFlags.stakeTargetAddress) {
        result.targetKeys.push(transformedTargetKey)
        shardusAddressToEVMAccountInfo.set(transformedTargetKey, {
          evmAddress: txToEvmAddr,
          type: AccountType.Account,
        })
      } else {
        if (ShardeumFlags.UseTXPreCrack === false) {
          //This is a contract create!!
          //only will work with first deploy, since we do not have a way to get nonce that works with sharding
          let hack0Nonce = new BN(0)
          let caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, hack0Nonce)
          let caAddr = '0x' + caAddrBuf.toString('hex')
          let shardusAddr = toShardusAddress(caAddr, AccountType.Account)
          otherAccountKeys.push(shardusAddr)
          shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Predicting new contract account address:', caAddr, shardusAddr)
        } else {
          //use app data!
          if (appData && appData.newCAAddr) {
            let caAddr = appData.newCAAddr
            let shardusAddr = toShardusAddress(caAddr, AccountType.Account)
            otherAccountKeys.push(shardusAddr)
            shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Appdata provided new contract account address:', caAddr, shardusAddr)
          }
        }
      }

      if (transaction instanceof AccessListEIP2930Transaction && transaction.AccessListJSON != null) {
        for (let accessList of transaction.AccessListJSON) {
          let address = accessList.address
          if (address) {
            let shardusAddr = toShardusAddress(address, AccountType.Account)
            shardusAddressToEVMAccountInfo.set(shardusAddr, {
              evmAddress: address,
              type: AccountType.Account,
            })
            otherAccountKeys.push(shardusAddr)
          }
          //let storageKeys = accessList.storageKeys.map(key => toShardusAddress(key, AccountType.ContractStorage))
          let storageKeys = []
          for (let storageKey of accessList.storageKeys) {
            //let shardusAddr = toShardusAddress(storageKey, AccountType.ContractStorage)
            let shardusAddr = toShardusAddressWithKey(address, storageKey, AccountType.ContractStorage)

            shardusAddressToEVMAccountInfo.set(shardusAddr, {
              evmAddress: shardusAddr,
              contractAddress: address,
              type: AccountType.ContractStorage,
            })
            storageKeys.push(shardusAddr)
          }
          result.storageKeys = result.storageKeys.concat(storageKeys)
        }
      } else {
        if (ShardeumFlags.autoGenerateAccessList && appData.accessList) {
          shardusMemoryPatterns = appData.shardusMemoryPatterns
          // we have pre-generated accessList
          for (let accessListItem of appData.accessList) {
            let address = accessListItem[0]
            if (address) {
              let shardusAddr = toShardusAddress(address, AccountType.Account)
              shardusAddressToEVMAccountInfo.set(shardusAddr, {
                evmAddress: address,
                type: AccountType.Account,
              })
              otherAccountKeys.push(shardusAddr)
            }
            //let storageKeys = accessListItem.storageKeys.map(key => toShardusAddress(key, AccountType.ContractStorage))
            let storageKeys = []
            for (let storageKey of accessListItem[1]) {
              //let shardusAddr = toShardusAddress(storageKey, AccountType.ContractStorage)
              let shardusAddr = toShardusAddressWithKey(address, storageKey, AccountType.ContractStorage)

              shardusAddressToEVMAccountInfo.set(shardusAddr, {
                evmAddress: shardusAddr,
                contractAddress: address,
                type: AccountType.ContractStorage,
              })
              storageKeys.push(shardusAddr)
            }
            result.storageKeys = result.storageKeys.concat(storageKeys)
          }
        }
      }

      // make sure the receipt address is in the get keys from transaction..
      // This will technically cause an empty account to get created but this will get overriden with the
      // correct values as a result of apply().  There are several ways we could optimize this in the future
      // If a transactions knows a key is for an account that will be created than it does not need to attempt to aquire and share the data
      let additionalAccounts = []
      if (ShardeumFlags.EVMReceiptsAsAccounts) {
        const txHash = bufferToHex(transaction.hash())
        const shardusReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`getKeyFromTransaction: adding tx receipt key: ${shardusReceiptAddress} ts:${tx.timestamp}`)
        additionalAccounts.push(shardusReceiptAddress)
      }

      // insert target keys first. first key in allkeys list will define the execution shard
      // for smart contract calls the contract will be the target.  For simple coin transfers it wont matter
      // insert otherAccountKeys second, because we need the CA addres at the front of the list for contract deploy
      // There wont be a target key in when we deploy a contract
      result.allKeys = result.allKeys.concat(
        result.targetKeys,
        otherAccountKeys,
        result.sourceKeys,
        result.storageKeys,
        additionalAccounts
      )
      if (ShardeumFlags.VerboseLogs) console.log('running getKeyFromTransaction', result)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Unable to get keys from tx', e)
    }
    return {
      keys: result,
      timestamp,
      id: txId,
      shardusMemoryPatterns,
    }
  },

  //TODO: looks like this is never used in shardus now!, consider if we can axe it
  async getStateId(accountAddress, mustExist = true) {
    // let wrappedEVMAccount = accounts[accountAddress]
    // return WrappedEVMAccountFunctions._calculateAccountHash(wrappedEVMAccount)

    //TODO consider if this can be table lookup rather than a recalculation
    const wrappedEVMAccount = await AccountsStorage.getAccount(accountAddress)

    //looks like this wont change much as this is an unused function
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)

    return WrappedEVMAccountFunctions._calculateAccountHash(wrappedEVMAccount)
  },

  async deleteLocalAccountData() {
    //accounts = {}
    await AccountsStorage.clearAccounts()
  },

  async setAccountData(accountRecords) {
    console.log(`Running setAccountData`, accountRecords)
    // update our in memory accounts map
    for (const account of accountRecords) {
      let wrappedEVMAccount = account as WrappedEVMAccount

      let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)

      if (
        wrappedEVMAccount.accountType !== AccountType.NetworkAccount &&
        wrappedEVMAccount.accountType !== AccountType.NodeAccount &&
        wrappedEVMAccount.accountType !== AccountType.NodeAccount2 &&
        wrappedEVMAccount.accountType !== AccountType.NodeRewardReceipt &&
        wrappedEVMAccount.accountType !== AccountType.DevAccount
      )
        WrappedEVMAccountFunctions.fixDeserializedWrappedEVMAccount(wrappedEVMAccount)

      //accounts[shardusAddress] = wrappedEVMAccount
      await AccountsStorage.setAccount(shardusAddress, wrappedEVMAccount)
    }

    //Is this ok
    let shardeumState = getCallTXState('setAccountData', 'setAccountData')

    // update shardeum state. put this in a separate loop, but maybe that is overkill
    // I was thinking we could checkpoint and commit the changes on the outer loop,
    // but now I am not so sure that is safe, and best case may need a mutex
    // I am not even 100% that we can go without a mutex even one account at time, here or in other spots
    // where we commit data to tries.  I wouldn't want the awaited code to interleave in a bad way
    for (const account of accountRecords) {
      let wrappedEVMAccount = account as WrappedEVMAccount

      // hmm this is not awaited yet! needs changes to shardus global server.
      if (wrappedEVMAccount.accountType === AccountType.Account) {
        let addressString = wrappedEVMAccount.ethAddress
        let evmAccount = wrappedEVMAccount.account

        await shardeumState.setAccountExternal(addressString, evmAccount)
      } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
        let addressString = wrappedEVMAccount.ethAddress
        let key = Buffer.from(wrappedEVMAccount.key, 'hex')
        let value = wrappedEVMAccount.value //.toString('hex')

        //get the contract account so we can pass in the state root
        let shardusAddress = toShardusAddress(wrappedEVMAccount.ethAddress, AccountType.Account)
        //let contractAccount = accounts[shardusAddress]
        const contractAccount = await AccountsStorage.getAccount(shardusAddress)

        if (contractAccount == null) {
          //todo queue this somehow
          // repairing also breaks from this.. hmm
          //throw Error(`contractAccount not found for ${wrappedEVMAccount.ethAddress} / ${shardusAddress} `)
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`contractAccount not found for ${wrappedEVMAccount.ethAddress} / ${shardusAddress} `)
          //continue
        }
        if (contractAccount && contractAccount.account == null) {
          //todo queue this somehow
          //throw Error(`contractAccount.account not found for ${wrappedEVMAccount.ethAddress} / ${shardusAddress} ${JSON.stringify(contractAccount)} `)
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`contractAccount.account not found for ${wrappedEVMAccount.ethAddress} / ${shardusAddress} ${JSON.stringify(contractAccount)} `)
          //continue
        }

        let stateRoot = null
        if (contractAccount && contractAccount.account) {
          stateRoot = contractAccount.account.stateRoot
        }
        //looks like we dont even need state root here
        await shardeumState.setContractAccountKeyValueExternal(stateRoot, addressString, key, value)
      } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
        let keyString = wrappedEVMAccount.codeHash
        let bufferStr = wrappedEVMAccount.codeByte

        shardeumState.setContractBytesExternal(keyString, bufferStr)
      } else if (wrappedEVMAccount.accountType === AccountType.Receipt) {
        // looks like we dont need to inject anything into evm stae
      }
    }
  },
  async getRelevantData(accountId, timestampedTx, appData: any) {
    if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', accountId, timestampedTx, appData)
    let { tx } = timestampedTx

    if (isInternalTx(tx)) {
      let internalTx = tx as InternalTx

      let accountCreated = false
      //let wrappedEVMAccount = accounts[accountId]
      let wrappedEVMAccount = await AccountsStorage.getAccount(accountId)

      if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
        if (wrappedEVMAccount == null) {
          accountCreated = true
        }
        if (internalTx.accountData) {
          wrappedEVMAccount = internalTx.accountData
        }
      }
      if (internalTx.internalTXType === InternalTXType.InitNetwork) {
        if (!wrappedEVMAccount) {
          if (accountId === networkAccount) {
            wrappedEVMAccount = createNetworkAccount(accountId) as any
          } else {
            wrappedEVMAccount = createNodeAccount(accountId) as any
          }
          accountCreated = true
        }
      }
      if (internalTx.internalTXType === InternalTXType.NodeReward) {
        if (!wrappedEVMAccount) {
          if (accountId === internalTx.from) {
            wrappedEVMAccount = createNodeAccount(accountId) as any
          } else if (accountId === crypto.hashObj(tx)) {
            // For Node Reward Receipt; This needs to evaluate whether it's good or can have issue
            wrappedEVMAccount = {
              timestamp: 0,
              ethAddress: accountId,
              hash: '',
              accountType: AccountType.NodeRewardReceipt,
            }
            WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
            // console.log('Created node reward receipt account', wrappedEVMAccount)
          } else {
            // for eth payment account
            let evmAccountID = internalTx.to
            //some of this feels a bit redundant, will need to think more on the cleanup
            // TODO replace with getting actuall TX state?
            let debugTXState = getDebugTXState() //this isn't so great.. just for testing purpose
            wrappedEVMAccount = await createAccount(evmAccountID, debugTXState)
            WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
            // accounts[accountId] = wrappedEVMAccount
            console.log('Created new eth payment account', wrappedEVMAccount)
          }
          accountCreated = true
        }
      }
      if (
        internalTx.internalTXType === InternalTXType.ChangeConfig ||
        internalTx.internalTXType === InternalTXType.ChangeNetworkParam
      ) {
        // Not sure if this is even relevant.  I think the from account should be one of our dev accounts and
        // and should already exist (hit the faucet)
        // probably an array of dev public keys

        if (!wrappedEVMAccount) {
          //if the network account does not exist then throw an error
          // This is the 0000x00000 account
          if (accountId === networkAccount) {
            throw Error(`Network Account is not found ${accountId}`)
          } else if (accountId === ShardeumFlags.devPublicKey) {
            throw Error(`Dev Account is not found ${accountId}`)
          }
          // I think we don't need it now, the dev Key is checked on the validateTxnFields
          // else {
          //   //If the id is not the network account then it must be our dev user account.
          //   // we shouldn't try to create that either.
          //   // Dev account is a developers public key on a test account they control
          //   throw Error(`Dev Account is not found ${accountId}`)
          //   // wrappedEVMAccount = createNodeAccount(accountId) as any
          //   // accountCreated = true
          // }
        }
      }
      if (
        internalTx.internalTXType === InternalTXType.ApplyChangeConfig ||
        internalTx.internalTXType === InternalTXType.ApplyNetworkParam
      ) {
        if (!wrappedEVMAccount) {
          throw Error(`Network Account is not found ${accountId}`)
        }
      }
      if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
        if (!wrappedEVMAccount) {
          // Node Account has to be already created at this point.
          if (accountId === internalTx.nominee) {
            throw Error(`Node Account <nominee> is not found ${accountId}`)
          }
        }
      }
      if (internalTx.internalTXType === InternalTXType.ClaimReward) {
        if (!wrappedEVMAccount) {
          // Node Account has to be already created at this point.
          if (accountId === internalTx.nominee) {
            throw Error(`Node Account <nominee> is not found ${accountId}`)
          }
        }
      }
      if (internalTx.internalTXType === InternalTXType.SetCertTime) {
        if (!wrappedEVMAccount) {
          // Node Account or EVM Account(Nominator) has to be already created at this point.
          if (accountId === internalTx.nominee) {
            throw Error(`Node Account <nominee> is not found ${accountId}`)
          } else if (accountId === internalTx.nominator) {
            throw Error(`EVM Account <nominator> is not found ${accountId}`)
          }
        }
      }
      if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', wrappedEVMAccount)
      return shardus.createWrappedResponse(
        accountId,
        accountCreated,
        wrappedEVMAccount.hash,
        wrappedEVMAccount.timestamp,
        wrappedEVMAccount
      )
    }
    if (isDebugTx(tx)) {
      let accountCreated = false
      //let wrappedEVMAccount = accounts[accountId]
      let wrappedEVMAccount = await AccountsStorage.getAccount(accountId)
      if (wrappedEVMAccount == null) {
        let evmAccountInfo = shardusAddressToEVMAccountInfo.get(accountId)
        let evmAccountID = null
        let accountType = AccountType.Debug //assume account ok?
        if (evmAccountInfo != null) {
          evmAccountID = evmAccountInfo.evmAddress
          accountType = evmAccountInfo.type
        }

        wrappedEVMAccount = {
          timestamp: 0,
          balance: 100,
          ethAddress: evmAccountID,
          hash: '',
          accountType: AccountType.Debug, //see above, it may be wrong to assume this type in the future
        } as WrappedEVMAccount
        WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
        //accounts[accountId] = wrappedEVMAccount  //getRelevantData must never modify accounts[]
        console.log('Created new debug account', wrappedEVMAccount)
        accountCreated = true
      }

      return shardus.createWrappedResponse(
        accountId,
        accountCreated,
        wrappedEVMAccount.hash,
        wrappedEVMAccount.timestamp,
        wrappedEVMAccount
      )
    }

    if (!tx.raw) throw new Error('getRelevantData: No raw tx')

    // todo: create new accounts for staking

    // check if it a stake tx
    let transactionObj = getTransactionObj(tx)
    let isStakeRelatedTx: boolean = isStakingEVMTx(transactionObj)

    if (isStakeRelatedTx) {
      nestedCountersInstance.countEvent('shardeum-staking', 'getRelevantData: isStakeRelatedTx === true')
      let stakeTxBlob: StakeCoinsTX = appData.internalTx

      // if it is nominee and a stake tx, create 'NodeAccount' if it doesn't exist
      if (accountId === stakeTxBlob.nominee) {
        let accountCreated = false
        let nodeAccount2: any = await AccountsStorage.getAccount(accountId)

        if (appData.internalTXType === InternalTXType.Stake) {
          nestedCountersInstance.countEvent('shardeum-staking', 'internalTXType === Stake')

          if (nodeAccount2 == null) {
            accountCreated = true
            nodeAccount2 = {
              id: accountId,
              hash: '',
              timestamp: 0,
              nominator: '',
              stakeLock: new BN(0),
              reward: new BN(0),
              rewardStartTime: 0,
              rewardEndTime: 0,
              penalty: new BN(0),
              accountType: AccountType.NodeAccount2,
            }
            WrappedEVMAccountFunctions.updateEthAccountHash(nodeAccount2)

            nestedCountersInstance.countEvent('shardeum-staking', 'created new node account')
            if (ShardeumFlags.VerboseLogs) console.log('Created new node account', nodeAccount2)
          }
        } else if (appData.internalTXType === InternalTXType.Unstake) {
          nestedCountersInstance.countEvent('shardeum-staking', 'node account nominee not found')
          if (nodeAccount2 == null) throw new Error(`Node Account <nominee> is not found ${accountId}`)
        }
        if (ShardeumFlags.VerboseLogs) console.log('getRelevantData result for nodeAccount', nodeAccount2)
        return shardus.createWrappedResponse(
          accountId,
          accountCreated,
          nodeAccount2.hash,
          nodeAccount2.timestamp,
          nodeAccount2
        )
      }
    }

    //let wrappedEVMAccount = accounts[accountId]
    let wrappedEVMAccount = await AccountsStorage.getAccount(accountId)
    let accountCreated = false

    let txId = crypto.hashObj(tx)
    // let transactionState = transactionStateMap.get(txId)
    // if (transactionState == null) {
    //   transactionState = new TransactionState()
    //   transactionState.initData(
    //     shardeumStateManager,
    //     {
    //       storageMiss: accountMiss,
    //       contractStorageMiss,
    //       accountInvolved,
    //       contractStorageInvolved,
    //       tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp
    //     },
    //     txId,
    //     undefined,
    //     undefined
    //   )
    //   transactionStateMap.set(txId, transactionState)
    // } else {
    //   //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
    //   //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
    // }

    let shardeumState = getApplyTXState(txId)

    // Create the account if it doesn't exist
    if (typeof wrappedEVMAccount === 'undefined' || wrappedEVMAccount == null) {
      // oops! this is a problem..  maybe we should not have a fromShardusAddress
      // when we support sharding I dont think we can assume this is an AccountType.Account
      // the TX is specified at least so it might require digging into that to check if something matches the from/to field,
      // or perhaps a storage key in an access list..
      //let evmAccountID = fromShardusAddress(accountId, AccountType.Account) // accountId is a shardus address

      //need a recent map shardus ID to account type and eth address
      //EIP 2930 needs to write to this map as hints

      let evmAccountInfo = shardusAddressToEVMAccountInfo.get(accountId)
      let evmAccountID = null
      let accountType = AccountType.Account //assume account ok?
      if (evmAccountInfo != null) {
        evmAccountID = evmAccountInfo.evmAddress
        accountType = evmAccountInfo.type
      }

      const transaction = getTransactionObj(tx)
      const txHash = bufferToHex(transaction.hash())
      const shardusReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
      if (shardusReceiptAddress === accountId) {
        wrappedEVMAccount = {
          timestamp: 0,
          ethAddress: shardusReceiptAddress,
          hash: '',
          accountType: AccountType.Receipt,
        }
        //this is needed, but also kind of a waste.  Would be nice if shardus could be told to ignore creating certain accounts
      } else if (accountType === AccountType.Account) {
        //some of this feels a bit redundant, will need to think more on the cleanup
        await createAccount(evmAccountID, shardeumState)
        const address = Address.fromString(evmAccountID)
        let account = await shardeumState.getAccount(address)
        wrappedEVMAccount = {
          timestamp: 0,
          account,
          ethAddress: evmAccountID,
          hash: '',
          accountType: AccountType.Account, //see above, it may be wrong to assume this type in the future
        }

        // attach OperatorAccountInfo if it is a staking tx
        if (isStakeRelatedTx) {
          let stakeCoinsTx: StakeCoinsTX = appData.internalTx
          if (ShardeumFlags.VerboseLogs)
            console.log(
              'Adding operator account info to wrappedEVMAccount',
              evmAccountID,
              stakeCoinsTx.nominator
            )
          if (evmAccountID === stakeCoinsTx.nominator) {
            wrappedEVMAccount.operatorAccountInfo = {
              stake: new BN(0),
              nominee: '',
              certExp: 0,
            }
          }
        }
      } else if (accountType === AccountType.ContractStorage) {
        wrappedEVMAccount = {
          timestamp: 0,
          key: evmAccountID,
          value: Buffer.from([]),
          ethAddress: evmAccountInfo.contractAddress, // storage key
          hash: '',
          accountType: AccountType.ContractStorage,
        }
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Creating new contract storage account key:${evmAccountID} in contract address ${wrappedEVMAccount.ethAddress}`)
      } else {
        throw new Error(`getRelevantData: invalid accoun type ${accountType}`)
      }
      WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
      // accounts[accountId] = wrappedEVMAccount //getRelevantData must never modify accounts[]
      accountCreated = true
    }
    if (ShardeumFlags.VerboseLogs)
      console.log('Running getRelevantData final result for EOA', wrappedEVMAccount)
    // Wrap it for Shardus
    return shardus.createWrappedResponse(
      accountId,
      accountCreated,
      wrappedEVMAccount.hash,
      wrappedEVMAccount.timestamp,
      wrappedEVMAccount
    ) //readableAccount)
  },
  async getAccountData(accountStart, accountEnd, maxRecords): Promise<ShardusTypes.WrappedData[]> {
    const results = []
    const start = parseInt(accountStart, 16)
    const end = parseInt(accountEnd, 16)

    if (ShardeumFlags.UseDBForAccounts === true) {
      //direct DB query
      let wrappedResults = []
      let dbResults = await AccountsStorage.queryAccountsEntryByRanges(accountStart, accountEnd, maxRecords)

      for (let wrappedEVMAccount of dbResults) {
        const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        wrappedResults.push(wrapped)
      }
      return wrappedResults
    }

    let accounts = AccountsStorage.accounts

    // Loop all accounts
    for (let addressStr in accounts) {
      let wrappedEVMAccount = accounts[addressStr]
      // Skip if not in account id range
      const id = parseInt(addressStr, 16)
      if (id < start || id > end) continue

      // Add to results (wrapping is redundant?)
      const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
      results.push(wrapped)

      // Return results early if maxRecords reached
      if (results.length >= maxRecords) return results
    }
    return results
  },
  async updateAccountFull(wrappedData, localCache, applyResponse: ShardusTypes.ApplyResponse) {
    const accountId = wrappedData.accountId
    const accountCreated = wrappedData.accountCreated
    const updatedEVMAccount: WrappedEVMAccount = wrappedData.data
    const prevStateId = wrappedData.prevStateId

    if (ShardeumFlags.VerboseLogs) console.log('updatedEVMAccount before hashUpdate', updatedEVMAccount)

    // oof, we dont have the TXID!!!
    let txId = applyResponse?.txId
    // let transactionState = transactionStateMap.get(txId)
    // if (transactionState == null) {
    //   transactionState = new TransactionState()
    //   transactionState.initData(
    //     shardeumStateManager,
    //     {
    //       storageMiss: accountMiss,
    //       contractStorageMiss,
    //       accountInvolved,
    //       contractStorageInvolved,
    //       tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp
    //     },
    //     txId,
    //     undefined,
    //     undefined
    //   )
    //   transactionStateMap.set(txId, transactionState)
    // } else {
    //   //TODO possibly need a blob to re-init with?
    // }

    let shardeumState
    if (
      updatedEVMAccount.accountType !== AccountType.Debug &&
      updatedEVMAccount.accountType !== AccountType.NetworkAccount &&
      updatedEVMAccount.accountType !== AccountType.NodeAccount &&
      updatedEVMAccount.accountType !== AccountType.NodeAccount2 &&
      updatedEVMAccount.accountType !== AccountType.NodeRewardReceipt &&
      updatedEVMAccount.accountType !== AccountType.DevAccount
    ) {
      //fix any issues from seralization
      fixDeserializedWrappedEVMAccount(updatedEVMAccount)
      shardeumState = getApplyTXState(txId)
    }

    if (updatedEVMAccount.accountType === AccountType.Account) {
      //if account?
      let addressStr = updatedEVMAccount.ethAddress
      let ethAccount = updatedEVMAccount.account
      await shardeumState._transactionState.commitAccount(addressStr, ethAccount) //yikes this wants an await.
    } else if (updatedEVMAccount.accountType === AccountType.ContractStorage) {
      //if ContractAccount?
      let addressStr = updatedEVMAccount.ethAddress
      let key = updatedEVMAccount.key
      let bufferValue = updatedEVMAccount.value
      await shardeumState._transactionState.commitContractStorage(addressStr, key, bufferValue)
    } else if (updatedEVMAccount.accountType === AccountType.ContractCode) {
      let contractAddress = updatedEVMAccount.contractAddress
      let codeHash = updatedEVMAccount.codeHash
      let codeByte = updatedEVMAccount.codeByte
      await shardeumState._transactionState.commitContractBytes(contractAddress, codeHash, codeByte)
    } else if (updatedEVMAccount.accountType === AccountType.Receipt) {
      //TODO we can add the code that processes a receipt now.
      //  This will not call back into transactionState
      //  it will get added to the accounts[] map below just like all types,
      //  but I think we may look the data here an basically call
      //   appliedTxs[txId] = ...  the data we get...  in a way that matches the temp solution in apply()
      //   but note we will keep the temp solution in apply() for now
      //   may have to store txId on the WrappedEVMAccount variant type.
      //
      // appliedTxs[txId] = {
      //   txId: updatedEVMAccount.txId,
      //   receipt: updatedEVMAccount.receipt
      // }
    }

    let hashBefore = prevStateId
    WrappedEVMAccountFunctions.updateEthAccountHash(updatedEVMAccount)
    let hashAfter = updatedEVMAccount.hash

    if (ShardeumFlags.VerboseLogs) console.log('updatedEVMAccount after hashUpdate', updatedEVMAccount)

    // Save updatedAccount to db / persistent storage
    //accounts[accountId] = updatedEVMAccount
    await AccountsStorage.setAccount(accountId, updatedEVMAccount)

    if (ShardeumFlags.AppliedTxsMaps) {
      let ethTxId = shardusTxIdToEthTxId[txId]

      //we will only have an ethTxId if this was an EVM tx.  internalTX will not have one
      if (ethTxId != null) {
        let appliedTx = appliedTxs[ethTxId]
        appliedTx.status = 1
      }
    }
    // TODO: the account we passed to shardus is not the final committed data for contract code and contract storage
    //  accounts

    // Add data to our required response object
    shardus.applyResponseAddState(
      applyResponse,
      updatedEVMAccount,
      updatedEVMAccount,
      accountId,
      applyResponse.txId,
      applyResponse.txTimestamp,
      hashBefore,
      hashAfter,
      accountCreated
    )
  },
  updateAccountPartial(wrappedData, localCache, applyResponse) {
    //I think we may need to utilize this so that shardus is not oblicated to make temporary copies of large CAs
    //
    this.updateAccountFull(wrappedData, localCache, applyResponse)
  },
  async getAccountDataByRange(
    accountStart,
    accountEnd,
    tsStart,
    tsEnd,
    maxRecords,
    offset = 0,
    accountOffset = ''
  ): Promise<ShardusTypes.WrappedData[]> {
    const results: WrappedEVMAccount[] = []
    const start = parseInt(accountStart, 16)
    const end = parseInt(accountEnd, 16)

    const finalResults: ShardusTypes.WrappedData[] = []

    if (ShardeumFlags.UseDBForAccounts === true) {
      //direct DB query
      let dbResults = await AccountsStorage.queryAccountsEntryByRanges2(
        accountStart,
        accountEnd,
        tsStart,
        tsEnd,
        maxRecords,
        offset,
        accountOffset
      )

      for (let wrappedEVMAccount of dbResults) {
        // Process and add to finalResults
        const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        finalResults.push(wrapped)
      }
      return finalResults
    }

    let accounts = AccountsStorage.accounts
    // Loop all accounts
    for (let addressStr in accounts) {
      let wrappedEVMAccount = accounts[addressStr]
      // Skip if not in account id range
      const id = parseInt(addressStr, 16)
      if (id < start || id > end) continue
      // Skip if not in timestamp range
      const timestamp = wrappedEVMAccount.timestamp
      if (timestamp < tsStart || timestamp > tsEnd) continue

      // // Add to results
      // const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
      // results.push(wrapped)
      // Add to results
      results.push(wrappedEVMAccount)
      // we can't exit early. this is hard on perf
      // This data needs to eventually live in a DB and then the sort and max records will be natural.

      // Return results early if maxRecords reached
      // if (results.length >= maxRecords) return results
    }
    //critical to sort by timestamp before we cull max records
    results.sort((a, b) => a.timestamp - b.timestamp)

    // let sortByTsThenAddress = function (a,b){
    //   if(a.timestamp === b.timestamp){
    //     if(a.ethAddress > b.ethAddress){
    //       return 1
    //     }if(a.ethAddress < b.ethAddress){
    //       return -1
    //     } else {
    //       return 0
    //     }
    //   }
    //   if(a.timestamp > b.timestamp){
    //     return 1
    //   }
    //   return -1
    // }
    // results.sort(sortByTsThenAddress)

    //let cappedResults = results.slice(0, maxRecords)

    let cappedResults = []
    let count = 0
    let extra = 0
    let lastTS = tsEnd
    // let startTS = results[0].timestamp
    // let sameTS = true

    if (results.length > 0) {
      lastTS = results[0].timestamp
      //start at offset!
      for (let i = offset; i < results.length; i++) {
        let wrappedEVMAccount = results[i]
        // if(startTS === wrappedEVMAccount.timestamp){
        //   sameTS = true
        // }
        // if(sameTS){
        //   if(startTS != wrappedEVMAccount.timestamp){
        //     sameTS = false
        //   }
        // } else {
        //   if(count > maxRecords){
        //     break
        //   }
        // }
        if (count > maxRecords) {
          // if(lastTS != wrappedEVMAccount.timestamp){
          //   break
          // } else {
          //   extra++
          // }

          break //no extras allowed
        }
        lastTS = wrappedEVMAccount.timestamp
        count++
        cappedResults.push(wrappedEVMAccount)
      }
    }

    shardus.log(
      `getAccountDataByRange: extra:${extra} ${JSON.stringify({
        accountStart,
        accountEnd,
        tsStart,
        tsEnd,
        maxRecords,
        offset,
      })}`
    )

    for (let wrappedEVMAccount of cappedResults) {
      // Process and add to finalResults
      const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
      finalResults.push(wrapped)
    }

    return finalResults
  },
  calculateAccountHash(wrappedEVMAccount: WrappedEVMAccount) {
    //this could be slow, would be nice to have a smart version
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
    return WrappedEVMAccountFunctions._calculateAccountHash(wrappedEVMAccount)
  },
  // should rely on set account data
  // resetAccountData(accountBackupCopies) {
  //   for (let recordData of accountBackupCopies) {
  //     let wrappedEVMAccount = recordData.data as WrappedEVMAccount
  //     let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
  //     accounts[shardusAddress] = wrappedEVMAccount

  //     //TODO need to also update shardeumState! probably can do that in a batch outside of this loop
  //     // a wrappedEVMAccount could be an EVM Account or a CA key value pair
  //     // maybe could just refactor the loop in setAccountData??
  //   }
  // },

  //TODO this seems to be unused, can we ditch it?
  async deleteAccountData() {
    // UNUSED!! ??
    // for (const address of addressList) {
    //   delete accounts[address]
    // }
  },
  async getAccountDataByList(addressList) {
    const results = []
    for (const address of addressList) {
      //const wrappedEVMAccount = accounts[address]
      // TODO perf: could replace with a single query
      let wrappedEVMAccount = await AccountsStorage.getAccount(address)
      if (wrappedEVMAccount) {
        const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        results.push(wrapped)
      }
    }
    return results
  },
  async signAppData(
    type: string,
    hash: string,
    nodesToSign: number,
    appData: any
  ): Promise<ShardusTypes.SignAppDataResult> {
    nestedCountersInstance.countEvent('shardeum-staking', 'calling signAppData')
    let fail: ShardusTypes.SignAppDataResult = { success: false, signature: null }
    console.log('Running signAppData', type, hash, nodesToSign, appData)

    switch (type) {
      case 'sign-stake-cert':
        if (nodesToSign != 5) return fail
        const stakeCert = appData as StakeCert
        if (!stakeCert.nominator || !stakeCert.nominee || !stakeCert.stake || !stakeCert.certExp) {
          nestedCountersInstance.countEvent('shardeum-staking', 'signAppData format failed')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData format failed ${type} ${JSON.stringify(stakeCert)} `)
          return fail
        }

        //validate that the cert has not expired
        const serverConfig: any = config.server
        const currentTimestamp = Date.now()
        // const expirationTimeLimit = serverConfig.p2p.cycleDuration * 1000 * certExpireSoonCycles

        // Changing it to certExp > currentTimestamp for now; need to review it again
        // TODO: I think we need to add more certExp validation steps
        // if (stakeCert.certExp > currentTimestamp - expirationTimeLimit) {
        if (stakeCert.certExp < currentTimestamp) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData cert expired')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData cert expired ${type} ${JSON.stringify(stakeCert)} `)
          return fail
        }

        const minStakeRequired = _base16BNParser(AccountsStorage.cachedNetworkAccount.current.stakeRequired)
        let stakeAmount = _base16BNParser(stakeCert.stake)

        if (stakeAmount.lt(minStakeRequired)) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData stake amount lower than required')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData stake amount lower than required ${type} ${JSON.stringify(stakeCert)} `)
          return fail
        }

        if (ShardeumFlags.FullCertChecksEnabled) {
          const nominatorAddress = toShardusAddress(stakeCert.nominator, AccountType.Account)
          const nominatorAccount = await shardus.getLocalOrRemoteAccount(nominatorAddress)
          if (!nominatorAccount) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'could not find nominator account')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`could not find nominator account ${type} ${JSON.stringify(stakeCert)} `)
            return fail
          }
          let nominatorEVMAccount = nominatorAccount.data as WrappedEVMAccount
          fixDeserializedWrappedEVMAccount(nominatorEVMAccount)
          if (!nominatorEVMAccount.operatorAccountInfo) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'operatorAccountInfo missing from nominator')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`operatorAccountInfo missing from nominator ${type} ${JSON.stringify(stakeCert)} `)
            return fail
          }
          if (stakeCert.stake != nominatorEVMAccount.operatorAccountInfo.stake) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'operatorAccountInfo missing from nominator')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`stake amount in cert and operator account does not match ${type} ${JSON.stringify(stakeCert)} ${JSON.stringify(nominatorEVMAccount)} `)
            return fail
          }
          if (stakeCert.nominee != nominatorEVMAccount.operatorAccountInfo.nominee) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'nominee in cert and operator account does not match')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`nominee in cert and operator account does not match ${type} ${JSON.stringify(stakeCert)} ${JSON.stringify(nominatorEVMAccount)} `)
            return fail
          }
        }
        delete stakeCert.sign
        delete stakeCert.signs
        const signedCert: StakeCert = shardus.signAsNode(stakeCert)
        const result: ShardusTypes.SignAppDataResult = { success: true, signature: signedCert.sign }
        if (ShardeumFlags.VerboseLogs) console.log(`signAppData passed ${type} ${JSON.stringify(stakeCert)}`)
        nestedCountersInstance.countEvent('shardeum-staking', 'sign-stake-cert - passed')
        return result
    }
    return fail
  },
  getAccountDebugValue(wrappedAccount) {
    return `${stringify(wrappedAccount)}`
  },
  close() {
    if (ShardeumFlags.VerboseLogs) console.log('Shutting down...')
  },
  getTimestampAndHashFromAccount(account) {
    if (account != null && account.hash) {
      let wrappedEVMAccount = account as WrappedEVMAccount
      return {
        timestamp: wrappedEVMAccount.timestamp,
        hash: wrappedEVMAccount.hash,
      }
    } else if (account !== null && account.stateId) {
      return {
        timestamp: account.timestamp,
        hash: account.stateId,
      }
    }
    return {
      timestamp: 0,
      hash: 'invalid account data',
    }
  },
  transactionReceiptPass(
    tx: any,
    wrappedStates: { [id: string]: WrappedAccount },
    applyResponse: ShardusTypes.ApplyResponse
  ) {
    let txId: string
    if (!tx.sign) {
      txId = crypto.hashObj(tx)
    } else {
      txId = crypto.hashObj(tx, true) // compute from tx
    }
    //This next log is usefull but very heavy on the output lines:
    //Updating to be on only with verbose logs
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('running transactionReceiptPass', txId, tx, wrappedStates, applyResponse)
    _transactionReceiptPass(tx, txId, wrappedStates, applyResponse)

    //clear this out of the shardeum state map
    if (shardeumStateTXMap.has(txId)) {
      shardeumStateTXMap.delete(txId)
    }
  },
  getJoinData() {
    nestedCountersInstance.countEvent('shardeum-staking', 'calling getJoinData')
    const joinData = {
      version,
      stakeCert,
    }
    return joinData
  },
  validateJoinRequest(data: any) {
    try {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest ${JSON.stringify(data)}`)
      if (!data.appJoinData) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: !data.appJoinData`)
        return { success: false, reason: `Join request node doesn't provide the app join data.` }
      }
      if (!isEqualOrNewerVersion(version, data.appJoinData.version)) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: old version`)
        return {
          success: false,
          reason: `version number is old. Our app version is ${version}. Join request node app version is ${data.appJoinData.version}`,
        }
      }

      if (ShardeumFlags.StakingEnabled) {
        nestedCountersInstance.countEvent('shardeum-staking', 'validating join request with staking enabled')

        const nodeAcc = data.sign.owner
        const stake_cert: StakeCert = data.appJoinData.stakeCert
        if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest ${JSON.stringify(stake_cert)}`)

        const tx_time = data.joinRequestTimestamp as number

        if (nodeAcc !== stake_cert.nominee) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: nodeAcc !== stake_cert.nominee')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: nodeAcc !== stake_cert.nominee`)
          return {
            success: false,
            reason: `Nominated address and tx signature owner doesn't match, nominee: ${stake_cert.nominee}, sign owner: ${nodeAcc}`,
          }
        }

        if (tx_time > stake_cert.certExp) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: tx_time > stake_cert.certExp')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: tx_time > stake_cert.certExp ${tx_time} > ${stake_cert.certExp}`  )
          return {
            success: false,
            reason: `Certificate has expired at ${stake_cert.certExp}`,
          }
        }

        const serverConfig: any = config.server
        const two_cycle_ms = serverConfig.p2p.cycleDuration * 2 * 1000

        // stake certification should not expired for at least 2 cycle.
        if (Date.now() + two_cycle_ms > stake_cert.certExp) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: cert expires soon')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: cert expires soon ${Date.now() + two_cycle_ms} > ${stake_cert.certExp}`  )
          return {
            success: false,
            reason: `Certificate will be expired really soon.`,
          }
        }

        const minStakeRequired = _base16BNParser(AccountsStorage.cachedNetworkAccount.current.stakeRequired)

        const stakedAmount = _base16BNParser(stake_cert.stake)

        if (stakedAmount.lt(minStakeRequired)) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: stake_cert.stake < minStakeRequired')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: stake_cert.stake < minStakeRequired ${_readableSHM(stakedAmount)} < ${_readableSHM(minStakeRequired)}`)
          return {
            success: false,
            reason: `Minimum stake amount requirement does not meet.`,
          }
        }

        const pickedNode: ShardusTypes.Sign[] = []
        const requiredSig = getNodeCountForCertSignatures()
        const { success, reason } = shardus.validateActiveNodeSignatures(
          stake_cert,
          stake_cert.signs,
          requiredSig
        )
        if (!success) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: invalid signature')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: invalid signature`, reason)
          return { success, reason }
        }
      }

      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest success!!!`)
      return {
        success: true,
      }
    } catch (e) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest exception: ${e}`)
    }
  },
  // Update the activeNodes type here; We can import from P2P.P2PTypes.Node from '@shardus/type' lib but seems it's not installed yet
  async isReadyToJoin(latestCycle: ShardusTypes.Cycle, publicKey: string, activeNodes: any[]) {
    if (ShardeumFlags.StakingEnabled === false) return true
    if (ShardeumFlags.VerboseLogs) {
      console.log(`Running isReadyToJoin cycle:${latestCycle.counter} publicKey: ${publicKey}`)
    }

    if (lastCertTimeTxTimestamp === 0) {
      // inject setCertTimeTx for the first time
      nestedCountersInstance.countEvent('shardeum-staking', 'lastCertTimeTxTimestamp === 0')

      const res = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
      if (!res.success) {
        nestedCountersInstance.countEvent(
          'shardeum-staking',
          `failed call to injectSetCertTimeTx 1 reason: ${(res as ValidatorError).reason}`
        )
        return false
      }

      // set lastCertTimeTxTimestamp and cycle
      lastCertTimeTxTimestamp = Date.now()
      lastCertTimeTxCycle = latestCycle.counter

      // return false and query/check again in next cycle
      return false
    }

    //if stake cert is not null check its time
    if (stakeCert != null) {
      nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert != null')

      let remainingValidTime = stakeCert.certExp - Date.now()
      if (ShardeumFlags.VerboseLogs) {
        /* prettier-ignore */ console.log('stakeCert != null. remainingValidTime / minimum time ', remainingValidTime, certExpireSoonCycles * ONE_SECOND * latestCycle.duration)
      }
      // let isExpiringSoon = remainingValidTime <= latestCycle.start + 3 * ONE_SECOND * latestCycle.duration
      let isExpiringSoon = remainingValidTime <= certExpireSoonCycles * ONE_SECOND * latestCycle.duration
      if (isExpiringSoon) {
        nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert is expiring soon')

        stakeCert = null //clear stake cert, so we will know to query for it again
        const res = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
        if (!res.success) {
          nestedCountersInstance.countEvent(
            'shardeum-staking',
            `failed call to injectSetCertTimeTx 2 reason: ${(res as ValidatorError).reason}`
          )
          return false
        }
        lastCertTimeTxTimestamp = Date.now()
        lastCertTimeTxCycle = latestCycle.counter
        // return false and check again in next cycle
        return false
      } else {
        let isValid = true
        // todo: validate the cert here
        if (!isValid) {
          nestedCountersInstance.countEvent('shardeum-staking', 'invalid cert, isReadyToJoin = false')
          return false
        }

        nestedCountersInstance.countEvent('shardeum-staking', 'valid cert, isReadyToJoin = true')
        if (ShardeumFlags.VerboseLogs) {
          console.log('valid cert, isReadyToJoin = true ', stakeCert)
        }

        return true
      }
    }
    //if stake cert is null and we have set cert time before then query for the cert
    if (lastCertTimeTxTimestamp > 0 && stakeCert == null) {
      // we have already submitted setCertTime
      // query the certificate from the network
      let res = await queryCertificate(shardus, publicKey, activeNodes)
      if (ShardeumFlags.VerboseLogs) console.log('queryCertificate', res)
      if (!res.success) {
        nestedCountersInstance.countEvent(
          'shardeum-staking',
          `call to queryCertificate failed with reason: ${(res as ValidatorError).reason}`
        )
        return false
      }
      const signedStakeCert = (res as CertSignaturesResult).signedStakeCert
      let remainingValidTime = signedStakeCert.certExp - Date.now()
      /* prettier-ignore */ console.log('stakeCert received. remainingValidTime / minimum time ', remainingValidTime, certExpireSoonCycles * ONE_SECOND * latestCycle.duration)
      // let isExpiringSoon = remainingValidTime <= latestCycle.start + 3 * ONE_SECOND * latestCycle.duration
      let isExpiringSoon = remainingValidTime <= certExpireSoonCycles * ONE_SECOND * latestCycle.duration
      // if cert is going to expire soon, inject a new setCertTimeTx
      if (isExpiringSoon) {
        nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert is expiring soon')

        stakeCert = null //clear stake cert, so we will know to query for it again
        const res = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
        if (!res.success) {
          nestedCountersInstance.countEvent(
            'shardeum-staking',
            `failed call to injectSetCertTimeTx 3 reason: ${(res as ValidatorError).reason}`
          )
          return false
        }

        lastCertTimeTxTimestamp = Date.now()
        lastCertTimeTxCycle = latestCycle.counter
        // return false and check again in next cycle
        return false
      } else {
        let isValid = true
        // todo: validate the cert here
        if (!isValid) {
          nestedCountersInstance.countEvent('shardeum-staking', 'invalid cert, isReadyToJoin = false')
          return false
        }
        // cert if valid and not expiring soon
        stakeCert = signedStakeCert

        nestedCountersInstance.countEvent('shardeum-staking', 'valid cert, isReadyToJoin = true')
        if (ShardeumFlags.VerboseLogs) {
          console.log('valid cert, isReadyToJoin = true ', stakeCert)
        }
        return true
      }
    }
    // // every 3 cycle, inject a new setCertTime tx
    // if (lastCertTimeTxTimestamp > 0 && latestCycle.counter >= lastCertTimeTxCycle + 3) {
    //   const res = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
    //   if(!res.success) return false

    //   lastCertTimeTxTimestamp = Date.now()
    //   lastCertTimeTxCycle = latestCycle.counter

    //   // return false and check again in next cycle
    //   return false
    // }
  },
  async eventNotify(data: ShardusTypes.ShardusEvent) {
    if (ShardeumFlags.StakingEnabled === false) return
    if (ShardeumFlags.VerboseLogs) console.log(`Running eventNotify`, data)

    const nodeId = shardus.getNodeId()
    const node = shardus.getNode(nodeId)

    // We can skip staking related txs for the first node
    if (shardus.p2p.isFirstSeed) {
      //only skip events for our node
      if (data.nodeId === nodeId) {
        return
      }
    }

    if (node.status !== 'active') {
      console.log('This node is not active yet')
      return
    }

    const eventType = data.type

    // Waiting a bit here to make sure that shardus.getLatestCycles gives the latest cycle
    await sleep(1000)
    let latestCycles: ShardusTypes.Cycle[] = shardus.getLatestCycles()
    let currentCycle = latestCycles[0]
    if (!currentCycle) {
      console.log('No cycle records found', latestCycles)
      return
    }

    // skip for own node
    if (data.nodeId === nodeId) {
      return
    }

    // TODO: see if it's fine; what if getClosestNodes gives only recently activatd nodes
    // skip if this node is also activated in the same cycle
    const currentlyActivatedNode = currentCycle.activated.includes(nodeId)
    if (currentlyActivatedNode) return
    // Address as the hash of node public Key and current cycle
    const address = crypto.hashObj({
      nodePublicKey: data.publicKey,
      counter: currentCycle.counter,
    })
    const nodes = shardus.getClosestNodes(address, 5)
    if (ShardeumFlags.VerboseLogs) console.log('closest nodes', nodes)

    if (nodes.includes(nodeId)) {
      if (eventType === 'node-activated') {
        nestedCountersInstance.countEvent('shardeum-staking', `node-activated: injectInitRewardTimesTx`)
        const result = await InitRewardTimesTx.injectInitRewardTimesTx(shardus, data)
        console.log('INJECTED_INIT_REWARD_TIMES_TX', result)
      } else if (eventType === 'node-deactivated') {
        nestedCountersInstance.countEvent('shardeum-staking', `node-deactivated: injectClaimRewardTx`)
        const result = await injectClaimRewardTx(shardus, data)
        console.log('INJECTED_CLAIM_REWARD_TX', result)
      }
    }
  },
  async updateNetworkChangeQueue(account: WrappedAccount, appData: any) {
    if (account.accountId === networkAccount) {
      let networkParam: NetworkAccount = account.data
      for (let key in appData) {
        networkParam.current[key] = appData[key]
      }
      account.timestamp = Date.now()
      networkParam.hash = WrappedEVMAccountFunctions._calculateAccountHash(networkParam)
      account.stateId = networkParam.hash
      return [account]
    }
  },
})

shardus.registerExceptionHandler()

function periodicMemoryCleanup() {
  let keys = shardeumStateTXMap.keys()
  //todo any provisions needed for TXs that can hop and extend the timer
  let maxAge = Date.now() - 60000
  for (let key of keys) {
    let shardeumState = shardeumStateTXMap.get(key)
    if (shardeumState._transactionState.createdTimestamp < maxAge) {
      shardeumStateTXMap.delete(key)
    }
  }
  setTimeout(periodicMemoryCleanup, 60000)
}

setTimeout(periodicMemoryCleanup, 60000)

if (ShardeumFlags.GlobalNetworkAccount) {
  // CODE THAT GETS EXECUTED WHEN NODES START
  ;(async (): Promise<void> => {
    const serverConfig: any = config.server
    const cycleInterval = serverConfig.p2p.cycleDuration * ONE_SECOND

    let network: NetworkAccount

    let node: any
    let nodeId: string
    let nodeAddress: string
    let lastReward: number
    let currentTime: number
    let expected = Date.now() + cycleInterval
    let drift: number
    await shardus.start()

    // THIS CODE IS CALLED ON EVERY NODE ON EVERY CYCLE
    async function networkMaintenance(): Promise<NodeJS.Timeout> {
      shardus.log('New maintainence cycle has started')
      drift = Date.now() - expected
      currentTime = Date.now()

      try {
        const account = await shardus.getLocalOrRemoteAccount(networkAccount)
        network = account.data as NetworkAccount
        nodeId = shardus.getNodeId()
        node = shardus.getNode(nodeId)
        nodeAddress = node.address

        // wait for rewards
        let latestCycles = shardus.getLatestCycles()
        if (
          latestCycles != null &&
          latestCycles.length > 0 &&
          latestCycles[0].counter < ShardeumFlags.FirstNodeRewardCycle
        ) {
          shardus.log(
            `Too early for node reward: ${latestCycles[0].counter}.  first reward:${ShardeumFlags.FirstNodeRewardCycle}`
          )
          shardus.log('Maintenance cycle has ended')
          expected += cycleInterval
          return setTimeout(networkMaintenance, Math.max(100, cycleInterval - drift))
        }
      } catch (err) {
        shardus.log('ERR: ', err)
        console.log('ERR: ', err)
        return setTimeout(networkMaintenance, 5000) // wait 5s before trying again
      }

      shardus.log('nodeId: ', nodeId)
      shardus.log('nodeAddress: ', nodeAddress)

      // THIS IS FOR NODE_REWARD
      if (ShardeumFlags.NodeReward) {
        if (currentTime - lastReward > network.current.nodeRewardInterval) {
          nodeRewardCount++
          let tx = {
            isInternalTx: true,
            internalTXType: InternalTXType.NodeReward,
            nodeId: nodeId,
            from: nodeAddress,
            to: env.PAY_ADDRESS || pay_address,
            timestamp: Date.now(),
          }
          tx = shardus.signAsNode(tx)
          shardus.put(tx)
          shardus.log('GENERATED_NODE_REWARD: ', nodeId, tx.to)
          lastReward = currentTime
        }
      }
      shardus.log('Maintainence cycle has ended')
      expected += cycleInterval
      return setTimeout(networkMaintenance, Math.max(100, cycleInterval - drift))
    }

    shardus.on(
      'active',
      async (): Promise<NodeJS.Timeout> => {
        let latestCycles = shardus.getLatestCycles()
        if (latestCycles != null && latestCycles.length > 0) {
          const latestCycle = latestCycles[0]
          const now = Date.now()
          const currentCycleStart = (latestCycle.start + latestCycle.duration) * 1000
          const timeElapsed = now - currentCycleStart
          const blockProductionRateInSeconds = ShardeumFlags.blockProductionRate * 1000
          const nextUpdateQuarter = Math.floor(timeElapsed / blockProductionRateInSeconds) + 1
          const nextUpdateTimestamp = currentCycleStart + nextUpdateQuarter * blockProductionRateInSeconds
          const waitTime = nextUpdateTimestamp - now

          if (ShardeumFlags.VerboseLogs) {
            console.log('Active timestamp', now)
            console.log('timeElapsed from cycle start', timeElapsed)
            console.log('nextUpdateQuarter', nextUpdateQuarter)
            console.log('nextUpdateTimestamp', nextUpdateTimestamp)
            console.log('waitTime', waitTime)
          }

          setTimeout(() => {
            getOrCreateBlockFromTimestamp(nextUpdateTimestamp, true)
          }, waitTime)
        }

        if (shardus.p2p.isFirstSeed) {
          await sleep(cycleInterval * 2)
        }
        lastReward = Date.now()

        shardus.registerCacheTopic(
          'receipt',
          ShardeumFlags.cacheMaxCycleAge,
          ShardeumFlags.cacheMaxItemPerTopic
        )

        return setTimeout(networkMaintenance, cycleInterval)
      }
    )
  })()
} else {
  shardus.start()
}
