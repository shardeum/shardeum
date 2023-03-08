import { exec } from 'child_process'
import { arch, cpus, freemem, totalmem, platform } from 'os'
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
  AppJoinData,
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
  //NodeAccount,
  NodeAccount2,
  NodeInfoAppData,
  OperatorAccountInfo,
  OurAppDefinedData,
  ReadableReceipt,
  SetCertTime,
  ShardeumBlockOverride,
  StakeCoinsTX,
  TransactionKeys,
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
  scaleByStabilityFactor,
} from './utils'
import config from './config'
import { RunTxResult } from '@ethereumjs/vm/dist/runTx'
import { RunState } from '@ethereumjs/vm/dist/evm/interpreter'
import Wallet from 'ethereumjs-wallet'
import { Block } from '@ethereumjs/block'
import { ShardeumBlock } from './block/blockchain'
import * as AccountsStorage from './storage/accountStorage'
import { StateManager } from '@ethereumjs/vm/dist/state'
import { sync, validateTransaction, validateTxnFields } from './setup'
import { applySetCertTimeTx, injectSetCertTimeTx, isSetCertTimeTx } from './tx/setCertTime'
import { applyClaimRewardTx, injectClaimRewardTxWithRetry } from './tx/claimReward'
import { Request, Response } from 'express'
import {
  CertSignaturesResult,
  queryCertificate,
  queryCertificateHandler,
  StakeCert,
  ValidatorError,
} from './handlers/queryCertificate'
import * as InitRewardTimesTx from './tx/initRewardTimes'
import {
  isDebugTx,
  isInternalTx,
  crypto,
  getInjectedOrGeneratedTimestamp,
  hashSignedObj,
} from './setup/helpers'
import { onActiveVersionChange } from './versioning'
import { shardusFactory } from '@shardus/core'
import { QueueCountsResult } from '@shardus/core/dist/state-manager/state-manager-types'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export const networkAccount = '0'.repeat(64) //address

// HELPFUL TIME CONSTANTS IN MILLISECONDS
export const ONE_SECOND = 1000
export const ONE_MINUTE = 60 * ONE_SECOND
export const ONE_HOUR = 60 * ONE_MINUTE
export const ONE_DAY = 24 * ONE_HOUR
// export const ONE_WEEK = 7 * ONE_DAY
// export const ONE_YEAR = 365 * ONE_DAY

let latestBlock = 0
export const blocks: BlockMap = {}
export const blocksByHash: { [hash: string]: number } = {}
export const readableBlocks: { [blockNumber: number | string]: ShardeumBlockOverride } = {}

const oneSHM = new BN(10).pow(new BN(18))

// INITIAL NETWORK PARAMETERS FOR Shardeum
export const INITIAL_PARAMETERS: NetworkParameters = {
  title: 'Initial parameters',
  description: 'These are the initial network parameters Shardeum started with',
  nodeRewardInterval: ONE_HOUR, // 1 hour reward interval
  nodeRewardAmountUsd: oneSHM.mul(new BN(1)), // $1 x 10 ^ 18
  nodePenaltyUsd: oneSHM.mul(new BN(10)), // $10 x 10 ^ 18
  stakeRequiredUsd: oneSHM.mul(new BN(10)), // $10 x 10 ^ 18
  maintenanceInterval: ONE_DAY,
  maintenanceFee: 0,
  minVersion: '1.1.0',
  activeVersion: '1.1.0',
  stabilityScaleMul: 1000,
  stabilityScaleDiv: 1000,
}

export let genesisAccounts: string[] = []

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

let lastCertTimeTxTimestamp = 0
let lastCertTimeTxCycle: number | null = null

export const certExpireSoonCycles = 3

export let stakeCert: StakeCert = null

function isDebugMode() {
  return config.server.mode === 'debug'
}

// grab this
const pointsAverageInterval = 2 // seconds

const servicePointSpendHistory: { points: number; ts: number }[] = []
let debugLastTotalServicePoints = 0

/**
 * Allows us to attempt to spend points.  We have ShardeumFlags.ServicePointsPerSecond
 * that can be spent as a total bucket
 * @param points
 * @returns
 */
function trySpendServicePoints(points: number): boolean {
  const nowTs = Date.now()
  const maxAge = 1000 * pointsAverageInterval
  const maxAllowedPoints = ShardeumFlags.ServicePointsPerSecond * pointsAverageInterval
  let totalPoints = 0
  //remove old entries, count points
  for (let i = servicePointSpendHistory.length - 1; i >= 0; i--) {
    const entry = servicePointSpendHistory[i] // eslint-disable-line security/detect-object-injection
    const age = nowTs - entry.ts
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
    nestedCountersInstance.countEvent('shardeum-service-points', 'fail: not enough points available to spend')
    return false
  }

  //Add new entry to array
  const newEntry = { points, ts: nowTs }
  servicePointSpendHistory.unshift(newEntry)

  nestedCountersInstance.countEvent('shardeum-service-points', 'pass: points available to spend')
  return true
}

function pruneOldBlocks() {
  /* eslint-disable security/detect-object-injection */
  const maxOldBlocksCount = ShardeumFlags.maxNumberOfOldBlocks || 256
  if (latestBlock > maxOldBlocksCount) {
    for (let i = 10; i > 0; i--) {
      const block = latestBlock - maxOldBlocksCount - i
      if (blocks[block]) {
        try {
          const blockHash = readableBlocks[block].hash
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
  /* eslint-enable security/detect-object-injection */
}

function convertToReadableBlock(block: Block): ShardeumBlockOverride {
  const defaultBlock = {
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
  const previousBlockNumber = String(block.header.number.toNumber() - 1)
  const previousBlock = readableBlocks[previousBlockNumber] // eslint-disable-line security/detect-object-injection
  if (previousBlock) defaultBlock.parentHash = previousBlock.hash
  // Todo: The Block type is being effectively overriddden here. Ideally this should be a type of it's own in the
  //  future.
  return defaultBlock as unknown as ShardeumBlockOverride
}

function createNewBlock(blockNumber: number, timestamp: number): Block {
  /* eslint-disable security/detect-object-injection */
  if (blocks[blockNumber]) return blocks[blockNumber]
  if (!blocks[blockNumber]) {
    const timestampInSecond = timestamp ? Math.round(timestamp / 1000) : Math.round(Date.now() / 1000)
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
  /* eslint-enable security/detect-object-injection */
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
const appliedTxs = {} //this appears to be unused. will it still be unused if we use receipts as app data
const shardusTxIdToEthTxId = {} //this appears to only support appliedTxs

//In debug mode the default value is 100 SHM.  This is needed for certain load test operations
const defaultBalance = isDebugMode() ? oneSHM.mul(new BN(100)) : new BN(0)

// TODO move this to a db table
// const transactionFailHashMap: any = {}

const ERC20TokenBalanceMap: {
  to: string
  data: unknown
  timestamp: number
  result: unknown
}[] = []
const ERC20TokenCacheSize = 1000

interface RunStateWithLogs extends RunState {
  logs?: []
}

let EVM: { -readonly [P in keyof VM] }
let shardeumBlock: ShardeumBlock
//let transactionStateMap:Map<string, TransactionState>

//Per TX or Eth call shardeum State.  Note the key is the shardus transaction id
let shardeumStateTXMap: Map<string, ShardeumState>
//let shardeumStateCallMap:Map<string, ShardeumState>
//let shardeumStatePool:ShardeumState[]
// const debugShardeumState: ShardeumState = null

let shardusAddressToEVMAccountInfo: Map<string, EVMAccountInfo>
let evmCommon

let debugAppdata: Map<string, unknown>

//todo refactor some object init into here
function initEVMSingletons() {
  const chainIDBN = new BN(ShardeumFlags.ChainID)

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
    EVM = new ShardeumVM({
      common: evmCommon,
      stateManager: undefined,
      blockchain: shardeumBlock,
    }) as ShardeumVM
  } else {
    EVM = new VM({ common: evmCommon, stateManager: undefined, blockchain: shardeumBlock }) as VM
  }

  //todo need to evict old data
  ////transactionStateMap = new Map<string, TransactionState>()

  // a map of txID or ethcallID to shardeumState, todo need to evict old data
  shardeumStateTXMap = new Map<string, ShardeumState>()
  // a map of txID or ethcallID to shardeumState, todo need to evict old data
  //shardeumStateCallMap = new Map<string, ShardeumState>()

  //shardeumStatePool = []

  //todo need to evict old data
  shardusAddressToEVMAccountInfo = new Map<string, EVMAccountInfo>()

  debugAppdata = new Map<string, unknown>()
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
 */
async function accountMiss(): Promise<boolean> {
  //Get the first read version of data that we have collected so far

  // TODO implment this in shardus global server.  It will send the read accounts and TX info to
  // to a remote shard so that we can restart the EVM
  //shardus.jumpToAccount(txID, address, transferBlob )

  //throw new Error('this should only happen in a multi sharded environment')

  const isRemoteShard = false
  return isRemoteShard
}

/**
 * This callback is called when the EVM tries to get an CA KVP it does not exist in trie storage or TransactionState
 * We need to build a blob of first read accounts and call SGS so that it can jump the EVM execution to the correct shard
 * @param linkedTX
 * @param address
 * @param key
 */
async function contractStorageMiss(): Promise<boolean> {
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

  const isRemoteShard = false
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

  const txID = transactionState.linkedTX

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
    const shardusAddress = toShardusAddress(address, AccountType.Account)

    const success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
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

  const txID = transactionState.linkedTX

  //Need to translate key (or a combination of hashing address+key) to a shardus-global-server space address!

  //TODO implement this shardus function.
  //See documentation for details
  //Note we will have 3-4 different account types where accountInvolved gets called (depending on how we handle Receipts),
  // but they will all call the same shardus.accountInvolved() and shardus will not know of the different account types
  if (shardus.tryInvolveAccount != null) {
    //let shardusAddress = toShardusAddress(key, AccountType.ContractStorage)
    const shardusAddress = toShardusAddressWithKey(address, key, AccountType.ContractStorage)

    const success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
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
async function accountMissNoOp(): Promise<boolean> {
  const isRemoteShard = false
  return isRemoteShard
}

async function contractStorageMissNoOp(): Promise<boolean> {
  const isRemoteShard = false
  return isRemoteShard
}

function accountInvolvedNoOp(): boolean {
  return true
}

function contractStorageInvolvedNoOp(): boolean {
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

function monitorEventCBNoOp() {
  // no op
}

async function tryGetRemoteAccountCB(
  transactionState: TransactionState,
  type: AccountType,
  address: string,
  key: string
): Promise<WrappedEVMAccount> {
  const shardusAddress = toShardusAddressWithKey(address, key, type)
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Trying to get remote account for address: ${address}, type: ${type}, key: ${key}`)
  const remoteShardusAccount = await shardus.getLocalOrRemoteAccount(shardusAddress)
  if (remoteShardusAccount == undefined) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Found no remote account for address: ${address}, type: ${type}, key: ${key}`)
    return
  }
  const fixedEVMAccount = remoteShardusAccount.data as WrappedEVMAccount
  fixDeserializedWrappedEVMAccount(fixedEVMAccount)
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Successfully found remote account for address: ${address}, type: ${type}, key: ${key}`, fixedEVMAccount)
  return fixedEVMAccount
}

function isStakingEVMTx(transaction: Transaction | AccessListEIP2930Transaction) {
  return transaction.to && transaction.to.toString() === ShardeumFlags.stakeTargetAddress
}

function getStakeTxBlobFromEVMTx(transaction: Transaction | AccessListEIP2930Transaction) {
  const stakeTxString = toAscii(transaction.data.toString('hex'))
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
    balance: balance, // 100 SHM in debug mode.  0 SHM in release mode
  }

  //I think this will have to change in the future!
  // shardeumStateManager.setTransactionState(transactionState)

  const account = Account.fromAccountData(acctData)
  await stateManager.putAccount(accountAddress, account)
  const updatedAccount = await stateManager.getAccount(accountAddress)

  const wrappedEVMAccount = {
    timestamp: 0,
    account: updatedAccount,
    ethAddress: addressStr,
    hash: '',
    accountType: AccountType.Account,
  }
  WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
  return wrappedEVMAccount
}

function getTransactionObj(tx): Transaction | AccessListEIP2930Transaction {
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
// function getDebugTXState(): ShardeumState {
//   const txId = '7'.repeat(64)
//   if (ShardeumFlags.VerboseLogs) console.log('Creating a debug tx ShardeumState for ')
//
//   let shardeumState = debugShardeumState
//   if (shardeumState == null) {
//     shardeumState = new ShardeumState({ common: evmCommon })
//     const transactionState = new TransactionState()
//     transactionState.initData(
//       shardeumState,
//       {
//         //dont define callbacks for db TX state!
//         storageMiss: accountMissNoOp,
//         contractStorageMiss: contractStorageMissNoOp,
//         accountInvolved: accountInvolvedNoOp,
//         contractStorageInvolved: contractStorageInvolvedNoOp,
//         tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp,
//         monitorEventCB: monitorEventCBNoOp,
//       },
//       txId,
//       undefined,
//       undefined
//     )
//     shardeumState.setTransactionState(transactionState)
//     //transactionStateMap.set(txId, transactionState)
//     //debugTransactionState = transactionState
//   } else {
//     //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
//     //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
//     if (ShardeumFlags.VerboseLogs) console.log('Resetting debug transaction state for txId', txId)
//     shardeumState.resetState()
//   }
//
//   return shardeumState
// }

/**
 * only use for the duration of a call and then give up on it
 * ?? will this work
 * @returns
 */
function getCallTXState(): ShardeumState {
  const txId = '9'.repeat(64) // use different txId than debug txs
  if (ShardeumFlags.VerboseLogs) console.log('Creating a call tx ShardeumState for ', txId)

  const shardeumState = new ShardeumState({ common: evmCommon })
  const transactionState = new TransactionState()
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

  const shardeumState = new ShardeumState({ common: evmCommon })
  const transactionState = new TransactionState()
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

export function getApplyTXState(txId: string): ShardeumState {
  let shardeumState = shardeumStateTXMap.get(txId)
  if (shardeumState == null) {
    shardeumState = new ShardeumState({ common: evmCommon })
    const transactionState = new TransactionState()
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

async function _internalHackPostWithResp(url: string, body) {
  const normalized = _normalizeUrl(url)
  const host = parseUrl(normalized, true)
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

function logAccessList(message: string, appData) {
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

const debugMiddleware = shardus.getDebugModeMiddleware()

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

  const points = Number(req.query.points ?? ShardeumFlags.ServicePoints['debug-points'])
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
  const tx = req.body
  if (ShardeumFlags.VerboseLogs) console.log('Transaction injected:', new Date(), tx)
  let numActiveNodes = 0
  try {
    numActiveNodes = shardus.getNumActiveNodes()
    const belowEVMtxMinNodes = numActiveNodes < ShardeumFlags.minNodesEVMtx
    let txRequiresMinNodes = false

    //only run these checks if we are below the limit
    if (belowEVMtxMinNodes) {
      const isInternal = isInternalTx(tx)
      let isStaking = false
      let isAllowedInternal = false
      if (isInternal) {
        //todo possibly later limit what internal TXs are allowed
        isAllowedInternal = true
      } else {
        const txObj: Transaction | AccessListEIP2930Transaction = getTransactionObj(tx)
        if (txObj != null) {
          isStaking = isStakingEVMTx(txObj)
        }
      }
      txRequiresMinNodes = (isStaking || isAllowedInternal) === false
    }

    if (belowEVMtxMinNodes && txRequiresMinNodes) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Transaction reject due to min active requirement does not meet , numActiveNodes ${numActiveNodes} < ${ShardeumFlags.minNodesEVMtx} `)
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum', `txRejectedDueToMinActiveNodes :${numActiveNodes}`)
      res.json({
        success: false,
        reason: `Network will not accept EVM tx until it has at least ${ShardeumFlags.minNodesEVMtx} active node in the network. numActiveNodes: ${numActiveNodes}`,
        status: 500,
      })
    } else {
      //normal case, we will put this transaction into the shardus queue
      const response = await shardus.put(tx)
      res.json(response)
    }
  } catch (err) {
    if (ShardeumFlags.VerboseLogs) console.log('Failed to inject tx: ', err)
    try {
      res.json({
        success: false,
        reason: `Failed to inject tx:  ${JSON.stringify(err)}`,
        status: 500,
      })
    } catch (e) {
      console.log('Failed to respond to inject tx: ', e)
    }
  }
})

shardus.registerExternalGet('eth_blockNumber', async (req, res) => {
  if (ShardeumFlags.VerboseLogs) console.log('Req: eth_blockNumber')
  return res.json({ blockNumber: latestBlock ? '0x' + latestBlock.toString(16) : '0x0' })
})

shardus.registerExternalGet('eth_getBlockByNumber', async (req, res) => {
  let blockNumber: number | string
  if (typeof req.query.blockNumber === 'string' || typeof req.query.blockNumber === 'number') {
    blockNumber = req.query.blockNumber
  }
  if (blockNumber === 'latest') blockNumber = latestBlock
  if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByNumber', blockNumber)
  if (blockNumber == null) {
    return res.json({ error: 'Invalid block number' })
  }
  return res.json({ block: readableBlocks[blockNumber] }) // eslint-disable-line security/detect-object-injection
})

shardus.registerExternalGet('eth_getBlockByHash', async (req, res) => {
  /* eslint-disable security/detect-object-injection */
  let blockHash = req.query.blockHash
  if (blockHash === 'latest') blockHash = readableBlocks[latestBlock].hash
  if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByHash', blockHash)
  let blockNumber: number
  if (typeof blockHash === 'string') blockNumber = blocksByHash[blockHash]
  return res.json({ block: readableBlocks[blockNumber] })
  /* eslint-enable security/detect-object-injection */
})

shardus.registerExternalGet('stake', async (req, res) => {
  try {
    const stakeRequiredUsd = AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
    const stakeRequired = scaleByStabilityFactor(stakeRequiredUsd, AccountsStorage.cachedNetworkAccount)
    if (ShardeumFlags.VerboseLogs) console.log('Req: stake requirement', _readableSHM(stakeRequired))
    return res.json({ stakeRequired, stakeRequiredUsd })
  } catch (e) {
    if (ShardeumFlags.VerboseLogs) console.log(`Error /stake`, e)
    return res.status(500).send(e.message)
  }
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

    const storage = {} //await shardeumStateManager.dumpStorage(addr)
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
    const output = JSON.stringify(shardusAddressToEVMAccountInfo, replacer, 4)
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
    const output = `tx shardeumState count:${shardeumStateTXMap.size}`
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

    return res.json({ [key]: ShardeumFlags[key] }) // eslint-disable-line security/detect-object-injection
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

    const typedValue = Number(value)

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
      const data = account.data
      fixDeserializedWrappedEVMAccount(data as WrappedEVMAccount)
      const readableAccount = await getReadableAccountInfo(data)
      if (readableAccount) return res.json({ account: readableAccount })
      else res.json({ account: data })
    } else {
      let accountType: number
      if (typeof req.query.type === 'string') accountType = parseInt(req.query.type)
      const id = req.params['address']
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
    const opt = {
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
        const caShardusAddress = toShardusAddress(callObj.to, AccountType.Account)
        //to do convert to timestamp query getAccountTimestamp!!
        caAccount = await AccountsStorage.getAccount(caShardusAddress)
        if (caAccount) {
          const index = ERC20TokenBalanceMap.findIndex((x) => x.to === callObj.to && x.data === callObj.data)
          if (index > -1) {
            const tokenBalanceResult = ERC20TokenBalanceMap[index] // eslint-disable-line security/detect-object-injection
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
      const address = caShardusAddress
      const accountIsRemote = shardus.isAccountRemote(address)

      if (accountIsRemote) {
        const consensusNode = shardus.getRandomConsensusNodeForAccount(address)
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
        if (consensusNode != null) {
          if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)

          const postResp = await _internalHackPostWithResp(
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

    const callTxState = getCallTXState() //this isn't so great..

    const callerAddress = toShardusAddress(callObj.from, AccountType.Account)
    const callerAccount = await AccountsStorage.getAccount(callerAddress)
    if (callerAccount) {
      if (ShardeumFlags.VerboseLogs) console.log('callerAddress', callerAccount)
      callTxState._transactionState.insertFirstAccountReads(opt.caller, callerAccount.account)
      //shardeumStateManager.setTransactionState(callTxState)
    } else {
      const acctData = {
        nonce: 0,
        balance: oneSHM.mul(new BN(100)), // 100 SHM.  This is a temporary account that will never exist.
      }
      const fakeAccount = Account.fromAccountData(acctData)
      callTxState._transactionState.insertFirstAccountReads(opt.caller, fakeAccount)

      //shardeumStateManager.setTransactionState(callTxState)
    }

    opt['block'] = blocks[latestBlock] // eslint-disable-line security/detect-object-injection

    EVM.stateManager = null
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
        const extra = ERC20TokenBalanceMap.length - ERC20TokenCacheSize
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

    const { accessList } = await generateAccessList(callObj)

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
      return res.json({ account: cachedAppData })
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
        // if (transactionFailHashMap[txHash]) {
        //   /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Tx Hash ${txHash} is found in the failed transactions list`, transactionFailHashMap[txHash])
        //   return res.json({ account: transactionFailHashMap[txHash] })
        // }
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`No tx found for ${shardusAddress}`) //, accounts[shardusAddress])
        return res.json({ account: null })
      }
      const data = account.data
      fixDeserializedWrappedEVMAccount(data as WrappedEVMAccount)
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

  const appData = debugAppdata.get(txHash)

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
  const accounts = await AccountsStorage.debugGetAllAccounts()
  const sorted = JSON.parse(SerializeToJsonString(accounts))

  res.json({ accounts: sorted })
})

shardus.registerExternalGet('genesis_accounts', async (req, res) => {
  const { start } = req.query
  if (!start) {
    return res.json({ success: false, reason: 'start value is not defined!' })
  }
  let skip: number
  if (typeof start === 'string') {
    skip = parseInt(start)
  }
  const limit = skip + 1000
  let accounts = []
  if (genesisAccounts.length > 0) {
    accounts = genesisAccounts.slice(skip, limit)
  }
  res.json({ success: true, accounts })
})

// Returns the hardware-spec of the server running the validator
shardus.registerExternalGet('system-info', async (req, res) => {
  let result = {
    platform: platform(),
    arch: arch(),
    cpu: {
      total_cores: cpus().length,
      cores: cpus(),
    },
    free_memory: `${freemem() / Math.pow(1024, 3)} GB`,
    total_memory: `${totalmem() / Math.pow(1024, 3)} GB`,
    disk: null,
  }
  exec('df -h --total|grep ^total', (err, diskData) => {
    if (!err) {
      const [, total, used, available, percent_used] = diskData.split(' ').filter((s) => s)
      result = { ...result, disk: { total, used, available, percent_used } }
    }
    res.json(result)
  })
})

shardus.registerExternalPut('query-certificate', async (req: Request, res: Response) => {
  nestedCountersInstance.countEvent('shardeum-staking', 'called query-certificate')

  const queryCertRes = await queryCertificateHandler(req, shardus)
  console.log('queryCertRes', queryCertRes)
  if (queryCertRes.success) {
    const successRes = queryCertRes as CertSignaturesResult
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
  tx,
  wrappedStates: WrappedStates,
  txTimestamp: number
): Promise<ShardusTypes.ApplyResponse> {
  const txId = hashSignedObj(tx)
  const applyResponse: ShardusTypes.ApplyResponse = shardus.createApplyResponse(txId, txTimestamp)
  if (isSetCertTimeTx(tx)) {
    const setCertTimeTx = tx as SetCertTime
    applySetCertTimeTx(shardus, setCertTimeTx, wrappedStates, txTimestamp, applyResponse)
  }
  const internalTx = tx as InternalTx
  if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
    // eslint-disable-next-line security/detect-object-injection
    const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[internalTx.from].data
    //just update the timestamp?
    wrappedEVMAccount.timestamp = txTimestamp
    //I think this will naturally accomplish the goal of the global update.

    //need to run this to fix buffer types after serialization
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
  }

  if (internalTx.internalTXType === InternalTXType.InitNetwork) {
    // eslint-disable-next-line security/detect-object-injection
    const network: NetworkAccount = wrappedStates[networkAccount].data
    if (ShardeumFlags.useAccountWrites) {
      // eslint-disable-next-line security/detect-object-injection
      const writtenAccount = wrappedStates[networkAccount]
      writtenAccount.data.timestamp = txTimestamp
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(writtenAccount.data)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        wrappedChangedAccount as WrappedResponse,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
    }
    console.log(`init_network NETWORK_ACCOUNT: ${stringify(network)}`)
    shardus.log('Applied init_network transaction', network)
  }
  if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
    /* eslint-disable security/detect-object-injection */
    const network: NetworkAccount = wrappedStates[networkAccount].data
    const devAccount: DevAccount = wrappedStates[internalTx.from].data
    /* eslint-enable security/detect-object-injection */

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
    const value = {
      isInternalTx: true,
      internalTXType: InternalTXType.ApplyChangeConfig,
      timestamp: when,
      from: internalTx.from,
      network: networkAccount,
      change: { cycle: changeOnCycle, change: JSON.parse(internalTx.config) },
    }

    //value = shardus.signAsNode(value)

    const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
    // network will consens that this is the correct value
    ourAppDefinedData.globalMsg = { address: networkAccount, value, when, source: value.from }

    if (ShardeumFlags.useAccountWrites) {
      /* eslint-disable security/detect-object-injection */
      const networkAccountCopy = wrappedStates[networkAccount]
      const devAccountCopy = wrappedStates[internalTx.from]
      /* eslint-enable security/detect-object-injection */
      networkAccountCopy.data.timestamp = txTimestamp
      devAccountCopy.data.timestamp = txTimestamp
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy as WrappedResponse,
        txId,
        txTimestamp
      )
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        internalTx.from,
        devAccountCopy as WrappedResponse,
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
    // eslint-disable-next-line security/detect-object-injection
    const network: NetworkAccount = wrappedStates[networkAccount].data

    if (ShardeumFlags.useAccountWrites) {
      // eslint-disable-next-line security/detect-object-injection
      const networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = txTimestamp
      networkAccountCopy.data.listOfChanges.push(internalTx.change)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy as WrappedResponse,
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
    /* eslint-disable security/detect-object-injection */
    const network: NetworkAccount = wrappedStates[networkAccount].data
    const devAccount: DevAccount = wrappedStates[internalTx.from].data
    /* eslint-enable security/detect-object-injection */

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
    const value = {
      isInternalTx: true,
      internalTXType: InternalTXType.ApplyNetworkParam,
      timestamp: when,
      from: internalTx.from,
      network: networkAccount,
      change: { cycle: changeOnCycle, change: {}, appData: JSON.parse(internalTx.config) },
    }

    const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
    // network will consens that this is the correct value
    ourAppDefinedData.globalMsg = { address: networkAccount, value, when, source: value.from }

    if (ShardeumFlags.useAccountWrites) {
      /* eslint-disable security/detect-object-injection */
      const networkAccountCopy = wrappedStates[networkAccount]
      const devAccountCopy = wrappedStates[internalTx.from]
      /* eslint-enable security/detect-object-injection */
      networkAccountCopy.data.timestamp = txTimestamp
      devAccountCopy.data.timestamp = txTimestamp
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy as WrappedResponse,
        txId,
        txTimestamp
      )
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        internalTx.from,
        devAccountCopy as WrappedResponse,
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
    // eslint-disable-next-line security/detect-object-injection
    const network: NetworkAccount = wrappedStates[networkAccount].data

    if (ShardeumFlags.useAccountWrites) {
      // eslint-disable-next-line security/detect-object-injection
      const networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = txTimestamp
      networkAccountCopy.data.listOfChanges.push(internalTx.change)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy as WrappedResponse,
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
    const rewardTimesTx = internalTx as InitRewardTimes
    InitRewardTimesTx.apply(shardus, rewardTimesTx, txId, txTimestamp, wrappedStates, applyResponse)
  }
  if (internalTx.internalTXType === InternalTXType.ClaimReward) {
    const claimRewardTx = internalTx as ClaimRewardTX
    applyClaimRewardTx(shardus, claimRewardTx, wrappedStates, txTimestamp, applyResponse)
  }
  return applyResponse
}

async function applyDebugTx(
  debugTx: DebugTx,
  wrappedStates: WrappedStates,
  txTimestamp: number
): Promise<ShardusTypes.ApplyResponse> {
  /* eslint-disable security/detect-object-injection */
  if (ShardeumFlags.VerboseLogs) console.log('Applying debug transaction', debugTx)
  if (debugTx.debugTXType === DebugTXType.Create) {
    const fromShardusAddress = toShardusAddress(debugTx.from, AccountType.Debug)
    const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[fromShardusAddress].data
    wrappedEVMAccount.timestamp = txTimestamp
    wrappedEVMAccount.balance += 1
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
  } else if (debugTx.debugTXType === DebugTXType.Transfer) {
    const fromAddress = toShardusAddress(debugTx.from, AccountType.Debug)
    const toAddress = toShardusAddress(debugTx.to, AccountType.Debug)
    const fromAccount: WrappedEVMAccount = wrappedStates[fromAddress].data
    const toAccount: WrappedEVMAccount = wrappedStates[toAddress].data
    fromAccount.timestamp = txTimestamp
    fromAccount.balance -= 1
    toAccount.balance += 1
    fixDeserializedWrappedEVMAccount(fromAccount)
    fixDeserializedWrappedEVMAccount(toAccount)
  }

  const txId = crypto.hashObj(debugTx)
  return shardus.createApplyResponse(txId, txTimestamp)
  /* eslint-enable security/detect-object-injection */
}

function setGlobalCodeByteUpdate(
  txTimestamp: number,
  wrappedEVMAccount: WrappedEVMAccount,
  applyResponse: ShardusTypes.ApplyResponse
) {
  const globalAddress = getAccountShardusAddress(wrappedEVMAccount)
  const when = txTimestamp + 1000 * 10
  const value = {
    isInternalTx: true,
    internalTXType: InternalTXType.SetGlobalCodeBytes,
    // type: 'apply_code_bytes', //extra, for debug
    timestamp: when,
    accountData: wrappedEVMAccount,
    from: globalAddress,
  }

  //value = shardus.signAsNode(value)

  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = { address: globalAddress, value, when, source: globalAddress }
}

async function _transactionReceiptPass(
  tx,
  txId: string,
  wrappedStates: WrappedStates,
  applyResponse: ShardusTypes.ApplyResponse
) {
  if (applyResponse == null) {
    return
  }
  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  const appReceiptData = applyResponse.appReceiptData

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
    const { address, value, when, source } = ourAppDefinedData.globalMsg
    //delete value.sign
    shardus.setGlobal(address, value, when, source)
    if (ShardeumFlags.VerboseLogs) {
      const tx = { address, value, when, source }
      const txHash = hashSignedObj(tx)
      console.log(`transactionReceiptPass setglobal: ${txHash} ${JSON.stringify(tx)}  `)
    }
  }
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

const getOrCreateBlockFromTimestamp = (timestamp: number, scheduleNextBlock = false): Block => {
  /* eslint-disable security/detect-object-injection */
  if (ShardeumFlags.VerboseLogs) console.log('Getting block from timestamp', timestamp)
  if (ShardeumFlags.VerboseLogs && blocks[latestBlock]) {
    /* prettier-ignore */ console.log('Latest block timestamp', blocks[latestBlock].header.timestamp, blocks[latestBlock].header.timestamp.toNumber() + 6000)
    /* prettier-ignore */ console.log('Latest block number', blocks[latestBlock].header.number.toNumber())
  }
  if (blocks[latestBlock] && blocks[latestBlock].header.timestamp.toNumber() >= timestamp) {
    return blocks[latestBlock]
  }
  /* eslint-enable security/detect-object-injection */

  const latestCycles = shardus.getLatestCycles()
  if (latestCycles == null || latestCycles.length === 0) return
  const cycle = latestCycles[0]

  if (ShardeumFlags.extraTxTime) timestamp = timestamp + ShardeumFlags.extraTxTime * 1000

  const cycleStart = (cycle.start + cycle.duration) * 1000
  const timeElapsed = timestamp - cycleStart
  const decimal = timeElapsed / (cycle.duration * 1000)
  const numBlocksPerCycle = cycle.duration / ShardeumFlags.blockProductionRate
  const blockNumber = Math.floor((cycle.counter + 1 + decimal) * numBlocksPerCycle)
  const newBlockTimestampInSecond =
    cycle.start +
    cycle.duration +
    (blockNumber - (cycle.counter + 1) * 10) * ShardeumFlags.blockProductionRate
  const newBlockTimestamp = newBlockTimestampInSecond * 1000
  if (ShardeumFlags.VerboseLogs) {
    console.log('Cycle counter vs derived blockNumber', cycle.counter, blockNumber)
  }
  const block = createNewBlock(blockNumber, newBlockTimestamp)
  if (scheduleNextBlock) {
    const nextBlockTimestamp = newBlockTimestamp + ShardeumFlags.blockProductionRate * 1000
    const waitTime = nextBlockTimestamp - Date.now()
    if (ShardeumFlags.VerboseLogs) console.log('Scheduling next block created which will happen in', waitTime)
    setTimeout(() => {
      getOrCreateBlockFromTimestamp(nextBlockTimestamp, true)
    }, waitTime)
  }
  pruneOldBlocks()
  return block
}

async function generateAccessList(
  callObj
): Promise<{ accessList: unknown[]; shardusMemoryPatterns: unknown }> {
  try {
    let valueInHexString: string
    if (!callObj.value) {
      valueInHexString = '0'
    } else if (callObj.value.indexOf('0x') >= 0) {
      valueInHexString = callObj.value.slice(2)
    } else {
      valueInHexString = callObj.value
    }

    const opt = {
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

      const address = caShardusAddress
      const accountIsRemote = shardus.isAccountRemote(address)

      if (accountIsRemote) {
        const consensusNode = shardus.getRandomConsensusNodeForAccount(address)
        /* prettier-ignore */
        if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
        if (consensusNode != null) {
          if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)

          const postResp = await _internalHackPostWithResp(
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

    const txId = crypto.hashObj(opt)
    const preRunTxState = getPreRunTXState(txId)

    const callerAddress = toShardusAddress(callObj.from, AccountType.Account)
    const callerAccount = await AccountsStorage.getAccount(callerAddress)
    if (callerAccount) {
      preRunTxState._transactionState.insertFirstAccountReads(opt.caller, callerAccount.account)
    } else {
      const acctData = {
        nonce: 0,
        balance: oneSHM.mul(new BN(100)), // 100 SHM.  This is a temporary account that will never exist.
      }
      const fakeAccount = Account.fromAccountData(acctData)
      preRunTxState._transactionState.insertFirstAccountReads(opt.caller, fakeAccount)
    }

    opt['block'] = blocks[latestBlock] // eslint-disable-line security/detect-object-injection

    EVM.stateManager = null
    EVM.stateManager = preRunTxState
    const callResult = await EVM.runCall(opt)

    // const callResult = = await EVM.runTx({
    //   block: blocks[latestBlock],
    //   tx: transaction,
    //   skipNonce: !ShardeumFlags.CheckNonce,
    // })

    const readAccounts = preRunTxState._transactionState.getReadAccounts()
    const writtenAccounts = preRunTxState._transactionState.getWrittenAccounts()
    const allInvolvedContracts = []
    const accessList = []

    //get a full picture of the read/write 'bits'
    const readSet = new Set()
    const writeSet = new Set()
    //let readOnlySet = new Set()
    const writeOnceSet = new Set()

    //always make the sender rw.  This is because the sender will always spend gas and increment nonce
    if (callObj.from != null && callObj.from.length > 0) {
      const shardusKey = toShardusAddress(callObj.from, AccountType.Account)
      writeSet.add(shardusKey)
      readSet.add(shardusKey)
    }

    for (const [key, storageMap] of writtenAccounts.contractStorages) {
      if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)

      let shardusKey = toShardusAddress(key, AccountType.Account)
      //writeSet.add(shardusKey) //don't assume we write to this account!
      //let written accounts handle that!
      for (const storageAddress of storageMap.keys()) {
        shardusKey = toShardusAddressWithKey(key, storageAddress, AccountType.ContractStorage)
        writeSet.add(shardusKey)
      }
    }
    for (const [key, storageMap] of readAccounts.contractStorages) {
      if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)

      let shardusKey = toShardusAddress(key, AccountType.Account)
      readSet.add(shardusKey) //putting this is just to be "nice"
      //later we can remove the assumption that a CA is always read
      for (const storageAddress of storageMap.keys()) {
        shardusKey = toShardusAddressWithKey(key, storageAddress, AccountType.ContractStorage)
        readSet.add(shardusKey)
      }
    }

    for (const [codeHash, contractByteWrite] of readAccounts.contractBytes) {
      const contractAddress = contractByteWrite.contractAddress.toString()
      if (!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)

      const shardusKey = toShardusAddressWithKey(contractAddress, codeHash, AccountType.ContractCode)
      readSet.add(shardusKey)
    }

    for (const [codeHash, contractByteWrite] of writtenAccounts.contractBytes) {
      const contractAddress = contractByteWrite.contractAddress.toString()
      if (!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)
      const shardusKey = toShardusAddressWithKey(contractAddress, codeHash, AccountType.ContractCode)
      writeSet.add(shardusKey)
      //special case shardeum behavoir.  contract bytes can only be written once
      writeOnceSet.add(shardusKey)
    }
    for (const [key] of writtenAccounts.accounts) {
      if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)
      const shardusKey = toShardusAddress(key, AccountType.Account)
      writeSet.add(shardusKey)
    }
    for (const [key] of readAccounts.accounts) {
      if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)
      const shardusKey = toShardusAddress(key, AccountType.Account)
      readSet.add(shardusKey)
    }

    //process our keys into one of four sets (writeOnceSet defined above)
    const readOnlySet = new Set()
    const writeOnlySet = new Set()
    const readWriteSet = new Set()
    for (const key of writeSet.values()) {
      if (readSet.has(key)) {
        readWriteSet.add(key)
      } else {
        writeOnlySet.add(key)
      }
    }
    for (const key of readSet.values()) {
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

    for (const address of allInvolvedContracts) {
      const allKeys = new Set()
      const readKeysMap = readAccounts.contractStorages.get(address)
      const writeKeyMap = writtenAccounts.contractStorages.get(address)
      if (readKeysMap) {
        for (const [key] of readKeysMap) {
          if (!allKeys.has(key)) allKeys.add(key)
        }
      }

      if (writeKeyMap) {
        for (const [key] of writeKeyMap) {
          if (!allKeys.has(key)) allKeys.add(key)
        }
      }

      for (const [codeHash, byteReads] of readAccounts.contractBytes) {
        const contractAddress = byteReads.contractAddress.toString()
        if (contractAddress !== address) continue
        if (!allKeys.has(codeHash)) allKeys.add(codeHash)
      }
      for (const [codeHash, byteReads] of writtenAccounts.contractBytes) {
        const contractAddress = byteReads.contractAddress.toString()
        if (contractAddress !== address) continue
        if (!allKeys.has(codeHash)) allKeys.add(codeHash)
      }
      const accessListItem = [address, Array.from(allKeys).map((key) => '0x' + key)]
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
  validateTxnFields: validateTxnFields(shardus, debugAppdata),
  async apply(timestampedTx, wrappedStates, appData) {
    const tx = timestampedTx
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
      const debugTx = tx as DebugTx
      return applyDebugTx(debugTx, wrappedStates, txTimestamp)
    }

    const transaction: Transaction | AccessListEIP2930Transaction = getTransactionObj(tx)
    const ethTxId = bufferToHex(transaction.hash())
    const shardusReceiptAddress = toShardusAddressWithKey(ethTxId, '', AccountType.Receipt)
    const txId = hashSignedObj(tx)
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

    const shardeumState = getApplyTXState(txId)
    shardeumState._transactionState.appData = appData

    if (appData.internalTx && appData.internalTXType === InternalTXType.Stake) {
      if (ShardeumFlags.VerboseLogs) console.log('applying stake tx', wrappedStates, appData)

      // get stake tx from appData.internalTx
      const stakeCoinsTx: StakeCoinsTX = appData.internalTx
      const operatorShardusAddress = toShardusAddress(stakeCoinsTx.nominator, AccountType.Account)
      // eslint-disable-next-line security/detect-object-injection
      const operatorEVMAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress]
        .data as WrappedEVMAccount

      // validate tx timestamp, compare timestamp against account's timestamp
      if (stakeCoinsTx.timestamp < operatorEVMAccount.timestamp) {
        throw new Error('Stake transaction timestamp is too old')
      }

      // // Validate tx timestamp against certExp (I thin)
      // if (operatorEVMAccount.operatorAccountInfo && operatorEVMAccount.operatorAccountInfo.certExp > 0) {
      //   if (stakeCoinsTx.timestamp > operatorEVMAccount.operatorAccountInfo.certExp) {
      //     throw new Error('Operator certExp is already set and expired compared to stake transaction')
      //   }
      // }

      // set stake value, nominee, cert in OperatorAcc (if not set yet)
      const nomineeNodeAccount2Address = stakeCoinsTx.nominee
      operatorEVMAccount.timestamp = txTimestamp

      // todo: operatorAccountInfo field may not exist in the operatorEVMAccount yet
      if (operatorEVMAccount.operatorAccountInfo == null) {
        operatorEVMAccount.operatorAccountInfo = {
          stake: new BN(0),
          nominee: '',
          certExp: null,
          operatorStats: {
            totalNodeReward: new BN(0),
            totalNodePenalty: new BN(0),
            totalNodeTime: 0,
            history: [],
            totalUnstakeReward: new BN(0),
            unstakeCount: 0,
            isShardeumRun: false,
            lastStakedNodeKey: '',
          },
        }
      } else {
        if (typeof operatorEVMAccount.operatorAccountInfo.stake === 'string')
          operatorEVMAccount.operatorAccountInfo.stake = new BN(
            operatorEVMAccount.operatorAccountInfo.stake,
            16
          )
      }
      operatorEVMAccount.operatorAccountInfo.stake.iadd(stakeCoinsTx.stake)
      operatorEVMAccount.operatorAccountInfo.nominee = stakeCoinsTx.nominee
      if (operatorEVMAccount.operatorAccountInfo.certExp == null)
        operatorEVMAccount.operatorAccountInfo.certExp = 0
      fixDeserializedWrappedEVMAccount(operatorEVMAccount)

      const txFeeUsd = new BN(ShardeumFlags.constantTxFeeUsd, 10)
      const txFee = scaleByStabilityFactor(txFeeUsd, AccountsStorage.cachedNetworkAccount)
      const totalAmountToDeduct = stakeCoinsTx.stake.add(txFee)
      operatorEVMAccount.account.balance = operatorEVMAccount.account.balance.sub(totalAmountToDeduct)
      operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce.add(new BN('1'))

      const operatorEVMAddress: Address = Address.fromString(stakeCoinsTx.nominator)
      await shardeumState.checkpoint()
      await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
      await shardeumState.commit()

      // eslint-disable-next-line security/detect-object-injection
      const nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2
      if (typeof nodeAccount2.stakeLock === 'string') {
        nodeAccount2.stakeLock = new BN(nodeAccount2.stakeLock, 16)
      }
      nodeAccount2.nominator = stakeCoinsTx.nominator
      nodeAccount2.stakeLock.iadd(stakeCoinsTx.stake)
      nodeAccount2.timestamp = txTimestamp

      if (ShardeumFlags.useAccountWrites) {
        // for operator evm account
        const { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
        console.log('\nAccount Writes: ', accountWrites)
        for (const account of accountWrites.entries()) {
          const addressStr = account[0]
          if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
            continue
          }
          const accountObj = Account.fromRlpSerializedAccount(account[1])
          console.log('\nWritten Account Object: ', accountObj)

          console.log('written account Obj', accountObj)

          const wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }

          updateEthAccountHash(wrappedEVMAccount)
          const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount as WrappedResponse,
            txId,
            wrappedChangedAccount.timestamp
          )
        }

        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
          wrappedStates[nomineeNodeAccount2Address].data as WrappedEVMAccount // eslint-disable-line security/detect-object-injection
        )
        // for nominee node account
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          nomineeNodeAccount2Address,
          wrappedChangedAccount as WrappedResponse,
          txId,
          txTimestamp
        )
      }

      // generate a proper receipt for stake tx
      const readableReceipt: ReadableReceipt = {
        status: 1,
        transactionHash: ethTxId,
        transactionIndex: '0x1',
        // eslint-disable-next-line security/detect-object-injection
        blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
        nonce: transaction.nonce.toString('hex'),
        blockHash: readableBlocks[latestBlock].hash, // eslint-disable-line security/detect-object-injection
        cumulativeGasUsed:
          '0x' +
          scaleByStabilityFactor(
            new BN(ShardeumFlags.constantTxFeeUsd),
            AccountsStorage.cachedNetworkAccount
          ).toString('hex'),
        gasUsed:
          '0x' +
          scaleByStabilityFactor(
            new BN(ShardeumFlags.constantTxFeeUsd),
            AccountsStorage.cachedNetworkAccount
          ).toString('hex'),
        logs: [],
        logsBloom: '',
        contractAddress: null,
        from: transaction.getSenderAddress().toString(),
        to: transaction.to ? transaction.to.toString() : null,
        stakeInfo: {
          nominee: nomineeNodeAccount2Address,
          stakeAmount: stakeCoinsTx.stake.toString(),
          totalStakeAmount: operatorEVMAccount.operatorAccountInfo.stake.toString(),
        },
        value: transaction.value.toString('hex'),
        data: '0x' + transaction.data.toString('hex'),
      }

      const wrappedReceiptAccount: WrappedEVMAccount = {
        timestamp: txTimestamp,
        ethAddress: ethTxId,
        hash: '',
        readableReceipt,
        amountSpent: txFee.toString(),
        txId,
        accountType: AccountType.StakeReceipt,
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
            wrappedChangedAccount as WrappedResponse,
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
      const unstakeCoinsTX: UnstakeCoinsTX = appData.internalTx

      // todo: validate tx timestamp, compare timestamp against account's timestamp

      // set stake value, nominee, cert in OperatorAcc (if not set yet)
      const operatorShardusAddress = toShardusAddress(unstakeCoinsTX.nominator, AccountType.Account)
      const nomineeNodeAccount2Address = unstakeCoinsTX.nominee
      // eslint-disable-next-line security/detect-object-injection
      const operatorEVMAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress]
        .data as WrappedEVMAccount
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

      if (operatorEVMAccount.operatorAccountInfo.certExp > txTimestamp) {
        throw new Error(
          `Unable to apply Unstake tx because stake cert has not yet expired. Expiry timestamp ${operatorEVMAccount.operatorAccountInfo.certExp}`
        )
      }

      // eslint-disable-next-line security/detect-object-injection
      const nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2

      const currentBalance = operatorEVMAccount.account.balance
      const stake = new BN(operatorEVMAccount.operatorAccountInfo.stake, 16)
      const reward = new BN(nodeAccount2.reward, 16)
      const penalty = new BN(nodeAccount2.penalty, 16)
      const txFeeUsd = new BN(ShardeumFlags.constantTxFeeUsd, 10)
      const txFee = scaleByStabilityFactor(txFeeUsd, AccountsStorage.cachedNetworkAccount)
      if (ShardeumFlags.VerboseLogs)
        console.log('calculating new balance after unstake', currentBalance, stake, reward, penalty, txFee)
      const newBalance = currentBalance.add(stake).add(reward).sub(penalty).sub(txFee)
      operatorEVMAccount.account.balance = newBalance
      operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce.add(new BN('1'))

      operatorEVMAccount.operatorAccountInfo.stake = new BN(0)
      operatorEVMAccount.operatorAccountInfo.nominee = null
      operatorEVMAccount.operatorAccountInfo.certExp = null

      // update the operator historical stats
      operatorEVMAccount.operatorAccountInfo.operatorStats.totalUnstakeReward = _base16BNParser(
        operatorEVMAccount.operatorAccountInfo.operatorStats.totalUnstakeReward
      ).add(reward)
      operatorEVMAccount.operatorAccountInfo.operatorStats.unstakeCount += 1
      operatorEVMAccount.operatorAccountInfo.operatorStats.lastStakedNodeKey = nomineeNodeAccount2Address

      const operatorEVMAddress: Address = Address.fromString(unstakeCoinsTX.nominator)
      await shardeumState.checkpoint()
      await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
      await shardeumState.commit()

      const stakeInfo = {
        nominee: nomineeNodeAccount2Address,
        rewardStartTime: nodeAccount2.rewardStartTime,
        rewardEndTime: nodeAccount2.rewardEndTime,
        reward,
        penalty,
      }

      nodeAccount2.nominator = null
      nodeAccount2.stakeLock = new BN(0)
      nodeAccount2.timestamp = txTimestamp
      nodeAccount2.penalty = new BN(0)
      nodeAccount2.reward = new BN(0)
      nodeAccount2.rewardStartTime = 0
      nodeAccount2.rewardEndTime = 0
      nodeAccount2.rewarded = false

      if (ShardeumFlags.useAccountWrites) {
        // for operator evm account
        const { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
        console.log('\nAccount Writes: ', accountWrites)
        for (const account of accountWrites.entries()) {
          const addressStr = account[0]
          if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
            continue
          }
          const accountObj = Account.fromRlpSerializedAccount(account[1])
          console.log('\nWritten Account Object: ', accountObj)

          console.log('written account Obj', accountObj)

          const wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }
          updateEthAccountHash(wrappedEVMAccount)
          const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount as WrappedResponse,
            txId,
            wrappedChangedAccount.timestamp
          )
        }

        // for nominee node account
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          nomineeNodeAccount2Address,
          // eslint-disable-next-line security/detect-object-injection
          wrappedStates[nomineeNodeAccount2Address] as WrappedResponse,
          txId,
          txTimestamp
        )
      }

      // generate a proper receipt for unstake tx
      const readableReceipt: ReadableReceipt = {
        status: 1,
        transactionHash: ethTxId,
        transactionIndex: '0x1',
        // eslint-disable-next-line security/detect-object-injection
        blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
        nonce: transaction.nonce.toString('hex'),
        // eslint-disable-next-line security/detect-object-injection
        blockHash: readableBlocks[latestBlock].hash,
        cumulativeGasUsed:
          '0x' +
          scaleByStabilityFactor(
            new BN(ShardeumFlags.constantTxFeeUsd),
            AccountsStorage.cachedNetworkAccount
          ).toString('hex'),
        gasUsed:
          '0x' +
          scaleByStabilityFactor(
            new BN(ShardeumFlags.constantTxFeeUsd),
            AccountsStorage.cachedNetworkAccount
          ).toString('hex'),
        logs: [],
        logsBloom: '',
        contractAddress: null,
        from: transaction.getSenderAddress().toString(),
        to: transaction.to ? transaction.to.toString() : null,
        stakeInfo,
        value: transaction.value.toString('hex'),
        data: '0x' + transaction.data.toString('hex'),
      }

      const wrappedReceiptAccount = {
        timestamp: txTimestamp,
        ethAddress: ethTxId,
        hash: '',
        readableReceipt,
        amountSpent: txFee.toString(),
        txId,
        accountType: AccountType.UnstakeReceipt,
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
            wrappedChangedAccount as WrappedResponse,
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

    const validatorStakedAccounts: Map<string, OperatorAccountInfo> = new Map()

    //ah shoot this binding will not be "thread safe" may need to make it part of the EEI for this tx? idk.
    //shardeumStateManager.setTransactionState(transactionState)

    // loop through the wrappedStates an insert them into the transactionState as first*Reads
    for (const accountId in wrappedStates) {
      if (shardusReceiptAddress === accountId) {
        //have to skip the created receipt account
        continue
      }

      // eslint-disable-next-line security/detect-object-injection
      const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[accountId].data as WrappedEVMAccount
      fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
      let address
      if (wrappedEVMAccount.accountType === AccountType.ContractCode)
        address = Address.fromString(wrappedEVMAccount.contractAddress)
      else address = Address.fromString(wrappedEVMAccount.ethAddress)

      if (ShardeumFlags.VerboseLogs) {
        const ourNodeShardData = shardus.stateManager.currentCycleShardData.nodeShardData
        const minP = ourNodeShardData.consensusStartPartition
        const maxP = ourNodeShardData.consensusEndPartition
        const shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
        const { homePartition } = __ShardFunctions.addressToPartition(
          shardus.stateManager.currentCycleShardData.shardGlobals,
          shardusAddress
        )
        const accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false

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
    const blockForTx = getOrCreateBlockFromTimestamp(txTimestamp)
    if (ShardeumFlags.VerboseLogs) console.log(`Block for tx ${ethTxId}`, blockForTx.header.number.toNumber())
    let runTxResult: RunTxResult
    let wrappedReceiptAccount: WrappedEVMAccount
    const wrappedNetworkAccount: ShardusTypes.WrappedData = await shardus.getLocalOrRemoteAccount(
      networkAccount
    )
    try {
      // if checkNonce is true, we're not gonna skip the nonce
      EVM.stateManager = null
      EVM.stateManager = shardeumState
      runTxResult = await EVM.runTx({
        block: blockForTx,
        tx: transaction,
        skipNonce: !ShardeumFlags.CheckNonce,
        networkAccount: wrappedNetworkAccount.data,
      })
      if (ShardeumFlags.VerboseLogs) console.log('runTxResult', txId, runTxResult)
    } catch (e) {
      // if (!transactionFailHashMap[ethTxId]) {
      let caAddr = null
      if (!transaction.to) {
        const txSenderEvmAddr = transaction.getSenderAddress().toString()

        const hack0Nonce = new BN(0)
        const caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, hack0Nonce)

        caAddr = '0x' + caAddrBuf.toString('hex')

        const shardusAddr = toShardusAddress(caAddr, AccountType.Account)
        // otherAccountKeys.push(shardusAddr)
        // shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })

        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Predicting contract account address:', caAddr, shardusAddr)
      }
      const readableReceipt: ReadableReceipt = {
        status: 0,
        transactionHash: ethTxId,
        transactionIndex: '0x1',
        blockNumber: readableBlocks[blockForTx.header.number.toNumber()].number,
        nonce: transaction.nonce.toString('hex'),
        blockHash: readableBlocks[blockForTx.header.number.toNumber()].hash,
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
      // eslint-disable-next-line security/detect-object-injection
      shardusTxIdToEthTxId[txId] = ethTxId // todo: fix that this is getting set too early, should wait untill after TX consensus

      // this is to expose tx data for json rpc server
      // eslint-disable-next-line security/detect-object-injection
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
    const {
      accounts: accountWrites,
      contractStorages: contractStorageWrites,
      contractBytes: contractBytesWrites,
    } = shardeumState._transactionState.getWrittenAccounts()

    if (ShardeumFlags.VerboseLogs) console.log(`DBG: all contractStorages writes`, contractStorageWrites)

    for (const contractStorageEntry of contractStorageWrites.entries()) {
      //1. wrap and save/update this to shardeum accounts[] map
      const addressStr = contractStorageEntry[0]
      const contractStorageWrites = contractStorageEntry[1]
      for (const [key, value] of contractStorageWrites) {
        // do we need .entries()?
        const wrappedEVMAccount: WrappedEVMAccount = {
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
            wrappedChangedAccount as WrappedResponse,
            txId,
            wrappedChangedAccount.timestamp
          )
        }
      }
    }

    //Keep a map of CA addresses to codeHash
    //use this later in the loop of account updates to set the correct account code hash values
    const accountToCodeHash: Map<string, Buffer> = new Map()

    for (const contractBytesEntry of contractBytesWrites.entries()) {
      //1. wrap and save/update this to shardeum accounts[] map
      const addressStr = '0x' + contractBytesEntry[0]
      const contractByteWrite: ContractByteWrite = contractBytesEntry[1]

      const wrappedEVMAccount: WrappedEVMAccount = {
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
            wrappedChangedAccount as WrappedResponse,
            txId,
            wrappedChangedAccount.timestamp
          )
        }
      }
    }

    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('DBG: all account writes', shardeumState._transactionState.logAccountWrites(accountWrites))

    // Handle Account type last, because CAs may depend on CA:Storage or CA:Bytecode updates
    //wrap these accounts and keys up and add them to the applyResponse as additional involved accounts
    for (const account of accountWrites.entries()) {
      //1. wrap and save/update this to shardeum accounts[] map
      const addressStr = account[0]
      if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
        //do not inform shardus about the 0 address account
        continue
      }
      const accountObj = Account.fromRlpSerializedAccount(account[1])

      const wrappedEVMAccount: WrappedEVMAccount = {
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
          wrappedChangedAccount as WrappedResponse,
          txId,
          wrappedChangedAccount.timestamp
        )
      }
    }

    const txSenderEvmAddr = transaction.getSenderAddress().toString()
    //TODO also create an account for the receipt (nested in the returned runTxResult should be a receipt with a list of logs)
    // We are ready to loop over the receipts and add them
    if (runTxResult) {
      const runState: RunStateWithLogs = runTxResult.execResult.runState
      let logs = []
      if (runState == null) {
        if (ShardeumFlags.VerboseLogs) console.log(`No runState found in the receipt for ${txId}`)
      } else {
        logs = runState.logs.map((l: [Buffer, Buffer[], Buffer]) => {
          return {
            logIndex: '0x1',
            blockNumber: readableBlocks[blockForTx.header.number.toNumber()].number,
            blockHash: readableBlocks[blockForTx.header.number.toNumber()].hash,
            transactionHash: ethTxId,
            transactionIndex: '0x1',
            address: bufferToHex(l[0]),
            topics: l[1].map((i) => bufferToHex(i)),
            data: bufferToHex(l[2]),
          }
        })
      }

      const readableReceipt: ReadableReceipt = {
        status: runTxResult.receipt['status'],
        transactionHash: ethTxId,
        transactionIndex: '0x1',
        blockNumber: readableBlocks[blockForTx.header.number.toNumber()].number,
        nonce: transaction.nonce.toString('hex'),
        blockHash: readableBlocks[blockForTx.header.number.toNumber()].hash,
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
          wrappedChangedAccount as WrappedResponse,
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
  getTimestampFromTransaction(tx, appData) {
    if (ShardeumFlags.VerboseLogs) console.log('Running getTimestampFromTransaction', tx, appData)
    if (ShardeumFlags.autoGenerateAccessList && appData && (appData as any).requestNewTimestamp) {
      if (ShardeumFlags.VerboseLogs) console.log('Requesting new timestamp', appData)
      return -1
    } else return Object.prototype.hasOwnProperty.call(tx, 'timestamp') ? (tx as any).timestamp : 0
  },
  async txPreCrackData(tx, appData) {
    if (ShardeumFlags.VerboseLogs) console.log('Running txPreCrackData', tx, appData)
    if (ShardeumFlags.UseTXPreCrack === false) {
      return
    }

    if (isInternalTx(tx) === false && isDebugTx(tx) === false) {
      const transaction = getTransactionObj(tx)
      const shardusTxId = hashSignedObj(tx)
      const ethTxId = bufferToHex(transaction.hash())
      if (ShardeumFlags.VerboseLogs) {
        console.log(`EVM tx ${ethTxId} is mapped to shardus tx ${shardusTxId}`)
        console.log(`Shardus tx ${shardusTxId} is mapped to EVM tx ${ethTxId}`)
      }

      const isStakeRelatedTx: boolean = isStakingEVMTx(transaction)

      const isEIP2930 =
        transaction instanceof AccessListEIP2930Transaction && transaction.AccessListJSON != null
      let isSimpleTransfer = false

      let remoteShardusAccount

      //if the TX is a contract deploy, predict the new contract address correctly (needs sender's nonce)
      //remote fetch of sender EOA also allows fast balance and nonce checking (assuming we get some queue hints as well from shardus core)
      if (
        ShardeumFlags.txNoncePreCheck ||
        ShardeumFlags.txBalancePreCheck ||
        (transaction.to == null && isEIP2930 === false)
      ) {
        let foundNonce = false
        let foundSender = false
        let nonce = new BN(0)
        let balance = new BN(0).toString()
        const txSenderEvmAddr = transaction.getSenderAddress().toString()
        const transformedSourceKey = toShardusAddress(txSenderEvmAddr, AccountType.Account)

        let queueCountResult = { count: 0, committingAppData: [] }
        let countPromise: Promise<QueueCountsResult> = undefined
        if (ShardeumFlags.txNoncePreCheck) {
          //parallel fetch
          countPromise = shardus.getLocalOrRemoteAccountQueueCount(transformedSourceKey)
        }
        remoteShardusAccount = await shardus.getLocalOrRemoteAccount(transformedSourceKey)

        let remoteTargetAccount = null
        if (transaction.to) {
          const txTargetEvmAddr = transaction.to.toString()
          const transformedTargetKey = toShardusAddress(txTargetEvmAddr, AccountType.Account)
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
          const wrappedEVMAccount = remoteShardusAccount.data as WrappedEVMAccount
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
          const wrappedEVMAccount = remoteTargetAccount.data as WrappedEVMAccount
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
          const caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, nonce)
          const caAddr = '0x' + caAddrBuf.toString('hex')
          appData.newCAAddr = caAddr
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData found nonce:${foundNonce} found sender:${foundSender} for ${txSenderEvmAddr} nonce:${nonce.toString()} ca:${caAddr}`)
        }

        // Attach nonce, queueCount and txNonce to appData
        if (ShardeumFlags.txNoncePreCheck) {
          if (queueCountResult == null) {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData uanble to get queueCountResult for ${txSenderEvmAddr} queueCountResult:${queueCountResult}`)
            throw new Error(
              `txPreCrackData uanble to get queueCountResult for ${txSenderEvmAddr} queueCountResult:${queueCountResult}`
            )
          } else {
            appData.queueCount = queueCountResult.count
            appData.nonce = parseInt(nonce.toString())
            if (queueCountResult.committingAppData.length > 0) {
              const highestCommittingNonce = queueCountResult.committingAppData
                .map((appData) => appData.txNonce)
                .sort()[0]
              const expectedAccountNonce = highestCommittingNonce + 1
              if (appData.nonce < expectedAccountNonce) appData.nonce = expectedAccountNonce
            }
            appData.txNonce = transaction.nonce.toNumber()
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData found nonce:${foundNonce} found sender:${foundSender} for ${txSenderEvmAddr} nonce:${nonce.toString()} queueCount:${queueCountResult.count.toString()}`)
          }
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
        //early pass on balance check to avoid expensive access list generation.
        if (ShardeumFlags.txBalancePreCheck && appData != null) {
          const minBalanceUsd = ShardeumFlags.constantTxFeeUsd
            ? new BN(ShardeumFlags.constantTxFeeUsd)
            : new BN(1)
          let minBalance = scaleByStabilityFactor(minBalanceUsd, AccountsStorage.cachedNetworkAccount)
          //check with value added in
          minBalance = minBalance.add(transaction.value)
          const accountBalance = new BN(appData.balance)
          if (accountBalance.lt(minBalance)) {
            success = false
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack balance fail: sender ${transaction.getSenderAddress()} does not have enough balance. Min balance: ${minBalance.toString()}, Account balance: ${accountBalance.toString()}`)
            nestedCountersInstance.countEvent('shardeum', 'precrack - insufficient balance')
          } else {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack balance pass: sender ${transaction.getSenderAddress()} has balance of ${accountBalance.toString()}`)
          }
        }

        if (ShardeumFlags.txNoncePreCheck && appData != null) {
          const txNonce = transaction.nonce.toNumber()
          const perfectCount = appData.nonce + appData.queueCount
          if (txNonce != perfectCount) {
            success = false
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce fail: perfectCount:${perfectCount} != ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${transaction.hash().toString('hex')} `)
            nestedCountersInstance.countEvent('shardeum', 'precrack - nonce fail')
          } else {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce pass: perfectCount:${perfectCount} == ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount}  txHash: ${transaction.hash().toString('hex')}`)
          }
        }

        if (success === true) {
          // generate access list for non EIP 2930 txs
          const callObj = {
            from: await transaction.getSenderAddress().toString(),
            to: transaction.to ? transaction.to.toString() : null,
            value: '0x' + transaction.value.toString('hex'),
            data: '0x' + transaction.data.toString('hex'),
            gasLimit: '0x' + transaction.gasLimit.toString('hex'),
            newContractAddress: appData.newCAAddr,
          }

          profilerInstance.scopedProfileSectionStart('accesslist-generate')
          const { accessList: generatedAccessList, shardusMemoryPatterns } = await generateAccessList(callObj)
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
          const networkAccountData: WrappedAccount = await shardus.getLocalOrRemoteAccount(networkAccount)
          appData.internalTx = getStakeTxBlobFromEVMTx(transaction)
          appData.internalTXType = appData.internalTx.internalTXType
          appData.networkAccount = networkAccountData.data
          if (appData.internalTx.stake) appData.internalTx.stake = new BN(appData.internalTx.stake)
          const nominee = appData.internalTx.nominee
          const nodeAccount: WrappedAccount = await shardus.getLocalOrRemoteAccount(nominee)
          if (nodeAccount) appData.nomineeAccount = nodeAccount.data
          appData.nominatorAccount = remoteShardusAccount ? remoteShardusAccount.data : null
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
    const tx = timestampedTx

    const timestamp: number = getInjectedOrGeneratedTimestamp(timestampedTx)

    let shardusMemoryPatterns = {}
    if (isInternalTx(tx)) {
      const customTXhash = null
      const internalTx = tx as InternalTx
      const keys: TransactionKeys = {
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

        // let tempTimestamp = tx.timestamp
        // delete tx.timestamp
        // customTXhash = crypto.hashObj(tx, true)
        // tx.timestamp = tempTimestamp

        //this was the best one so far
        // let now = Date.now()
        // //calculate a time closes to now but rounded to 3 seconds
        // let roundedNow = Math.round(now / 3000) * 3000
        // tx.timestamp = roundedNow
        // customTXhash = hashSignedObj(tx)
      } else if (internalTx.internalTXType === InternalTXType.ClaimReward) {
        keys.sourceKeys = [tx.nominee]
        keys.targetKeys = [toShardusAddress(tx.nominator, AccountType.Account), networkAccount]

        // //force all TXs for the same reward to have the same hash
        // let tempTimestamp = tx.timestamp
        // tx.timestamp = tx.nodeActivatedTime
        // customTXhash = crypto.hashObj(tx, true)
        // //restore timestamp?
        // tx.timestamp = tempTimestamp

        // let tempTimestamp = tx.timestamp
        // delete tx.timestamp
        // customTXhash = crypto.hashObj(tx, true)
        // tx.timestamp = tempTimestamp

        //walk the timestamp close to our window for injecting??

        //this was the best one so far
        // let now = Date.now()
        // //calculate a time closes to now but rounded to 3 seconds
        // let roundedNow = Math.round(now / 3000) * 3000
        // tx.timestamp = roundedNow
        // customTXhash = crypto.hashObj(tx, true)
      }
      keys.allKeys = keys.allKeys.concat(keys.sourceKeys, keys.targetKeys, keys.storageKeys)
      // temporary hack for creating a receipt of node reward tx
      // if (internalTx.internalTXType === InternalTXType.NodeReward) {
      //   if (ShardeumFlags.EVMReceiptsAsAccounts) {
      //     const txId = crypto.hashObj(tx)
      //     keys.allKeys = keys.allKeys.concat([txId]) // For Node Reward Receipt
      //   }
      // }

      const txid = hashSignedObj(tx)
      if (ShardeumFlags.VerboseLogs) console.log('crack', { timestamp, keys, id: txid })
      return {
        timestamp,
        keys,
        id: customTXhash ?? txid,
        shardusMemoryPatterns: null,
      }
    }
    if (isDebugTx(tx)) {
      const debugTx = tx as DebugTx
      const txid = hashSignedObj(tx)
      const keys = {
        sourceKeys: [],
        targetKeys: [],
        storageKeys: [],
        allKeys: [],
        timestamp: timestamp,
      }

      const transformedSourceKey = toShardusAddress(debugTx.from, AccountType.Debug)
      const transformedTargetKey = debugTx.to ? toShardusAddress(debugTx.to, AccountType.Debug) : ''
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
        id: txid,
        shardusMemoryPatterns: null,
      }
    }

    const transaction = getTransactionObj(tx)
    const result: TransactionKeys = {
      sourceKeys: [],
      targetKeys: [],
      storageKeys: [],
      allKeys: [],
      timestamp: timestamp,
    }
    const txId = hashSignedObj(tx)
    try {
      const otherAccountKeys = []
      const txSenderEvmAddr = transaction.getSenderAddress().toString()
      const txToEvmAddr = transaction.to ? transaction.to.toString() : undefined
      const transformedSourceKey = toShardusAddress(txSenderEvmAddr, AccountType.Account)
      const transformedTargetKey = transaction.to ? toShardusAddress(txToEvmAddr, AccountType.Account) : ''

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
        const transformedTargetKey = appData.internalTx.nominee // no need to convert to shardus address
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
          const hack0Nonce = new BN(0)
          const caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, hack0Nonce)
          const caAddr = '0x' + caAddrBuf.toString('hex')
          const shardusAddr = toShardusAddress(caAddr, AccountType.Account)
          otherAccountKeys.push(shardusAddr)
          shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Predicting new contract account address:', caAddr, shardusAddr)
        } else {
          //use app data!
          if (appData && appData.newCAAddr) {
            const caAddr = appData.newCAAddr
            const shardusAddr = toShardusAddress(caAddr, AccountType.Account)
            otherAccountKeys.push(shardusAddr)
            shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Appdata provided new contract account address:', caAddr, shardusAddr)
          }
        }
      }

      if (transaction instanceof AccessListEIP2930Transaction && transaction.AccessListJSON != null) {
        for (const accessList of transaction.AccessListJSON) {
          const address = accessList.address
          if (address) {
            const shardusAddr = toShardusAddress(address, AccountType.Account)
            shardusAddressToEVMAccountInfo.set(shardusAddr, {
              evmAddress: address,
              type: AccountType.Account,
            })
            otherAccountKeys.push(shardusAddr)
          }
          //let storageKeys = accessList.storageKeys.map(key => toShardusAddress(key, AccountType.ContractStorage))
          const storageKeys = []
          for (const storageKey of accessList.storageKeys) {
            //let shardusAddr = toShardusAddress(storageKey, AccountType.ContractStorage)
            const shardusAddr = toShardusAddressWithKey(address, storageKey, AccountType.ContractStorage)

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
          for (const accessListItem of appData.accessList) {
            const address = accessListItem[0]
            if (address) {
              const shardusAddr = toShardusAddress(address, AccountType.Account)
              shardusAddressToEVMAccountInfo.set(shardusAddr, {
                evmAddress: address,
                type: AccountType.Account,
              })
              otherAccountKeys.push(shardusAddr)
            }
            //let storageKeys = accessListItem.storageKeys.map(key => toShardusAddress(key, AccountType.ContractStorage))
            const storageKeys = []
            for (const storageKey of accessListItem[1]) {
              //let shardusAddr = toShardusAddress(storageKey, AccountType.ContractStorage)
              const shardusAddr = toShardusAddressWithKey(address, storageKey, AccountType.ContractStorage)

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
      const additionalAccounts = []
      if (ShardeumFlags.EVMReceiptsAsAccounts) {
        const txHash = bufferToHex(transaction.hash())
        const shardusReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`getKeyFromTransaction: adding tx receipt key: ${shardusReceiptAddress} ts:${(tx as any).timestamp}`)
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
  async getStateId(accountAddress) {
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
      const wrappedEVMAccount = account as WrappedEVMAccount

      const shardusAddress = getAccountShardusAddress(wrappedEVMAccount)

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
  },
  async getRelevantData(accountId, timestampedTx, appData) {
    if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', accountId, timestampedTx, appData)
    const tx = timestampedTx

    if (isInternalTx(tx)) {
      const internalTx = tx as InternalTx

      let accountCreated = false
      //let wrappedEVMAccount = accounts[accountId]
      let wrappedEVMAccount: NetworkAccount | WrappedEVMAccount = await AccountsStorage.getAccount(accountId)

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
            wrappedEVMAccount = createNetworkAccount(accountId)
          } else {
            //wrappedEVMAccount = createNodeAccount(accountId) as any
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
        const evmAccountInfo = shardusAddressToEVMAccountInfo.get(accountId)
        let evmAccountID = null
        if (evmAccountInfo != null) {
          evmAccountID = evmAccountInfo.evmAddress
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

    if (!Object.prototype.hasOwnProperty.call(tx, 'raw')) throw new Error('getRelevantData: No raw tx')

    // todo: create new accounts for staking

    // check if it a stake tx
    const transactionObj = getTransactionObj(tx)
    const isStakeRelatedTx: boolean = isStakingEVMTx(transactionObj)

    if (isStakeRelatedTx) {
      nestedCountersInstance.countEvent('shardeum-staking', 'getRelevantData: isStakeRelatedTx === true')
      const stakeTxBlob: StakeCoinsTX = appData.internalTx
      const txHash = bufferToHex(transactionObj.hash())

      let accountCreated = false
      const wrappedEVMAccount = await AccountsStorage.getAccount(accountId)

      if (appData.internalTXType === InternalTXType.Stake) {
        nestedCountersInstance.countEvent('shardeum-staking', 'internalTXType === Stake')
        if (!wrappedEVMAccount) {
          const stakeReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.StakeReceipt)

          // if it is nominee and a stake tx, create 'NodeAccount' if it doesn't exist
          if (accountId === stakeTxBlob.nominee) {
            const nodeAccount = {
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
              nodeAccountStats: {
                totalReward: new BN(0),
                totalPenalty: new BN(0),
                history: [],
                isShardeumRun: false,
              },
            }
            accountCreated = true
            WrappedEVMAccountFunctions.updateEthAccountHash(nodeAccount)
            nestedCountersInstance.countEvent('shardeum-staking', 'created new node account')
            if (ShardeumFlags.VerboseLogs) console.log('Created new node account', nodeAccount)
            if (ShardeumFlags.VerboseLogs)
              console.log('Running getRelevantData for stake/unstake tx', nodeAccount)
            return shardus.createWrappedResponse(
              accountId,
              accountCreated,
              nodeAccount.hash,
              nodeAccount.timestamp,
              nodeAccount
            )
          } else if (stakeReceiptAddress === accountId) {
            const stakeReceipt = {
              timestamp: 0,
              ethAddress: stakeReceiptAddress,
              hash: '',
              accountType: AccountType.StakeReceipt,
            }
            accountCreated = true
            WrappedEVMAccountFunctions.updateEthAccountHash(stakeReceipt)
            if (ShardeumFlags.VerboseLogs)
              console.log('Running getRelevantData for stake/unstake tx', stakeReceipt)
            return shardus.createWrappedResponse(
              accountId,
              accountCreated,
              stakeReceipt.hash,
              stakeReceipt.timestamp,
              stakeReceipt
            )
          }
        }
      } else if (appData.internalTXType === InternalTXType.Unstake) {
        if (!wrappedEVMAccount) {
          const unStakeReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.UnstakeReceipt)
          if (accountId === stakeTxBlob.nominee) {
            nestedCountersInstance.countEvent('shardeum-staking', 'node account nominee not found')
            throw new Error(`Node Account <nominee> is not found ${accountId}`)
          } else if (unStakeReceiptAddress === accountId) {
            const unstakeReceipt = {
              timestamp: 0,
              ethAddress: unStakeReceiptAddress,
              hash: '',
              accountType: AccountType.UnstakeReceipt,
            }
            accountCreated = true
            WrappedEVMAccountFunctions.updateEthAccountHash(unstakeReceipt)
            if (ShardeumFlags.VerboseLogs)
              console.log('Running getRelevantData for stake/unstake tx', unstakeReceipt)
            return shardus.createWrappedResponse(
              accountId,
              accountCreated,
              unstakeReceipt.hash,
              unstakeReceipt.timestamp,
              unstakeReceipt
            )
          }
        }
      }
    }

    //let wrappedEVMAccount = accounts[accountId]
    let wrappedEVMAccount = await AccountsStorage.getAccount(accountId)
    let accountCreated = false

    const txId = crypto.hashObj(tx)
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

    const shardeumState = getApplyTXState(txId)

    // Create the account if it doesn't exist
    if (typeof wrappedEVMAccount === 'undefined' || wrappedEVMAccount == null) {
      // oops! this is a problem..  maybe we should not have a fromShardusAddress
      // when we support sharding I dont think we can assume this is an AccountType.Account
      // the TX is specified at least so it might require digging into that to check if something matches the from/to field,
      // or perhaps a storage key in an access list..
      //let evmAccountID = fromShardusAddress(accountId, AccountType.Account) // accountId is a shardus address

      //need a recent map shardus ID to account type and eth address
      //EIP 2930 needs to write to this map as hints

      const evmAccountInfo = shardusAddressToEVMAccountInfo.get(accountId)
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
        const account = await shardeumState.getAccount(address)
        wrappedEVMAccount = {
          timestamp: 0,
          account,
          ethAddress: evmAccountID,
          hash: '',
          accountType: AccountType.Account, //see above, it may be wrong to assume this type in the future
        }

        // attach OperatorAccountInfo if it is a staking tx
        if (isStakeRelatedTx) {
          const stakeCoinsTx: StakeCoinsTX = appData.internalTx
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
              operatorStats: {
                totalNodeReward: new BN(0),
                totalNodePenalty: new BN(0),
                totalNodeTime: 0,
                history: [],
                totalUnstakeReward: new BN(0),
                unstakeCount: 0,
                isShardeumRun: false,
                lastStakedNodeKey: '',
              },
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
      const wrappedResults = []
      const dbResults = await AccountsStorage.queryAccountsEntryByRanges(accountStart, accountEnd, maxRecords)

      for (const wrappedEVMAccount of dbResults) {
        const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        wrappedResults.push(wrapped)
      }
      return wrappedResults
    }

    const accounts = AccountsStorage.accounts

    // Loop all accounts
    for (const addressStr in accounts) {
      const wrappedEVMAccount = accounts[addressStr] // eslint-disable-line security/detect-object-injection
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
    const updatedEVMAccount: WrappedEVMAccount = wrappedData.data as WrappedEVMAccount
    const prevStateId = wrappedData.prevStateId

    if (ShardeumFlags.VerboseLogs) console.log('updatedEVMAccount before hashUpdate', updatedEVMAccount)

    // oof, we dont have the TXID!!!
    const txId = applyResponse?.txId
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
      const addressStr = updatedEVMAccount.ethAddress
      const ethAccount = updatedEVMAccount.account
      await shardeumState._transactionState.commitAccount(addressStr, ethAccount) //yikes this wants an await.
    } else if (updatedEVMAccount.accountType === AccountType.ContractStorage) {
      //if ContractAccount?
      const addressStr = updatedEVMAccount.ethAddress
      const key = updatedEVMAccount.key
      const bufferValue = updatedEVMAccount.value
      await shardeumState._transactionState.commitContractStorage(addressStr, key, bufferValue)
    } else if (updatedEVMAccount.accountType === AccountType.ContractCode) {
      const contractAddress = updatedEVMAccount.contractAddress
      const codeHash = updatedEVMAccount.codeHash
      const codeByte = updatedEVMAccount.codeByte
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

    const hashBefore = prevStateId
    WrappedEVMAccountFunctions.updateEthAccountHash(updatedEVMAccount)
    const hashAfter = updatedEVMAccount.hash

    if (ShardeumFlags.VerboseLogs) console.log('updatedEVMAccount after hashUpdate', updatedEVMAccount)

    // Save updatedAccount to db / persistent storage
    //accounts[accountId] = updatedEVMAccount
    await AccountsStorage.setAccount(accountId, updatedEVMAccount)

    if (ShardeumFlags.AppliedTxsMaps) {
      /* eslint-disable security/detect-object-injection */
      const ethTxId = shardusTxIdToEthTxId[txId]

      //we will only have an ethTxId if this was an EVM tx.  internalTX will not have one
      if (ethTxId != null) {
        const appliedTx = appliedTxs[ethTxId]
        appliedTx.status = 1
      }
      /* eslint-enable security/detect-object-injection */
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
      const dbResults = await AccountsStorage.queryAccountsEntryByRanges2(
        accountStart,
        accountEnd,
        tsStart,
        tsEnd,
        maxRecords,
        offset,
        accountOffset
      )

      for (const wrappedEVMAccount of dbResults) {
        // Process and add to finalResults
        const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        finalResults.push(wrapped)
      }
      return finalResults
    }

    const accounts = AccountsStorage.accounts
    // Loop all accounts
    for (const addressStr in accounts) {
      const wrappedEVMAccount = accounts[addressStr] // eslint-disable-line security/detect-object-injection
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

    const cappedResults = []
    let count = 0
    const extra = 0
    // let startTS = results[0].timestamp
    // let sameTS = true

    if (results.length > 0) {
      //start at offset!
      for (let i = offset; i < results.length; i++) {
        const wrappedEVMAccount = results[i] // eslint-disable-line security/detect-object-injection
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

    for (const wrappedEVMAccount of cappedResults) {
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
      const wrappedEVMAccount = await AccountsStorage.getAccount(address)
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
    appData
  ): Promise<ShardusTypes.SignAppDataResult> {
    nestedCountersInstance.countEvent('shardeum-staking', 'calling signAppData')
    const fail: ShardusTypes.SignAppDataResult = { success: false, signature: null }
    try {
      console.log('Running signAppData', type, hash, nodesToSign, appData)

      if (type === 'sign-stake-cert') {
        if (nodesToSign != 5) return fail
        const stakeCert = appData as StakeCert
        if (!stakeCert.nominator || !stakeCert.nominee || !stakeCert.stake || !stakeCert.certExp) {
          nestedCountersInstance.countEvent('shardeum-staking', 'signAppData format failed')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData format failed ${type} ${JSON.stringify(stakeCert)} `)
          return fail
        }
        const currentTimestamp = Date.now()
        if (stakeCert.certExp < currentTimestamp) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData cert expired')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData cert expired ${type} ${JSON.stringify(stakeCert)} `)
          return fail
        }
        let minStakeRequiredUsd: BN
        let minStakeRequired: BN
        let stakeAmount: BN
        try {
          minStakeRequiredUsd = _base16BNParser(AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd)
        } catch (e) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData' +
              ' stakeRequiredUsd parse error')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequiredUsd parse error ${type} ${JSON.stringify(stakeCert)}, cachedNetworkAccount: ${JSON.stringify(AccountsStorage.cachedNetworkAccount)} `)
          return fail
        }
        try {
          minStakeRequired = scaleByStabilityFactor(minStakeRequiredUsd, AccountsStorage.cachedNetworkAccount)
        } catch (e) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData' +
              ' minStakeRequired parse error')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequired parse error ${type} ${JSON.stringify(stakeCert)}, cachedNetworkAccount: ${JSON.stringify(AccountsStorage.cachedNetworkAccount)} `)
          return fail
        }
        try {
          stakeAmount = _base16BNParser(stakeCert.stake)
        } catch (e) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData' +
              ' stakeAmount parse error')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData stakeAmount parse error ${type} ${JSON.stringify(stakeCert)}`)
          return fail
        }
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
          const nominatorEVMAccount = nominatorAccount.data as WrappedEVMAccount
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
    } catch (e) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData failed: ${type} ${JSON.stringify(stakeCert)}, error: ${JSON.stringify(e)}`)
      nestedCountersInstance.countEvent('shardeum-staking', 'sign-stake-cert - fail uncaught')
    }
    return fail
  },
  getAccountDebugValue(wrappedAccount) {
    return `${stringify(wrappedAccount)}`
  },
  getSimpleTxDebugValue(timestampedTx) {
    //console.log(`getSimpleTxDebugValue: ${JSON.stringify(tx)}`)

    try {
      const tx = timestampedTx
      if (isInternalTx(tx)) {
        const internalTx = tx as InternalTx
        return `internalTX: ${InternalTXType[internalTx.internalTXType]} `
      }
      if (isDebugTx(tx)) {
        const debugTx = tx as DebugTx
        return `debugTX: ${DebugTXType[debugTx.debugTXType]}`
      }
      const txObj: Transaction | AccessListEIP2930Transaction = getTransactionObj(tx)
      if (txObj && isStakingEVMTx(txObj)) {
        return `stakingEVMtx`
      }
      if (txObj) {
        return `EVMtx`
      }
    } catch (e) {
      const tx = timestampedTx
      console.log(`getSimpleTxDebugValue failed: ${JSON.stringify(e)}  tx:${JSON.stringify(tx)}`)
    }
  },
  close() {
    if (ShardeumFlags.VerboseLogs) console.log('Shutting down...')
  },
  getTimestampAndHashFromAccount(account) {
    if (account != null && account.hash) {
      const wrappedEVMAccount = account as WrappedEVMAccount
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
    tx,
    wrappedStates: { [id: string]: WrappedAccount },
    applyResponse: ShardusTypes.ApplyResponse
  ) {
    const txId = hashSignedObj(tx)

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
    const joinData: AppJoinData = {
      version,
      stakeCert,
    }
    return joinData
  },
  validateJoinRequest(data) {
    try {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest ${JSON.stringify(data)}`)
      if (!data.appJoinData) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: !data.appJoinData`)
        return {
          success: false,
          reason: `Join request node doesn't provide the app join data.`,
          fatal: true,
        }
      }

      const appJoinData = data.appJoinData as AppJoinData

      const minVersion = AccountsStorage.cachedNetworkAccount.current.minVersion
      if (!isEqualOrNewerVersion(minVersion, appJoinData.version)) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: old version`)
        return {
          success: false,
          reason: `version number is old. Our app version is ${version}. Join request node app version is ${appJoinData.version}`,
          fatal: true,
        }
      }

      const activeNodes = shardus.stateManager.currentCycleShardData.activeNodes

      // Staking is only enabled when flag is on and
      const stakingEnabled =
        ShardeumFlags.StakingEnabled && activeNodes.length >= ShardeumFlags.minActiveNodesForStaking

      if (stakingEnabled) {
        nestedCountersInstance.countEvent('shardeum-staking', 'validating join request with staking enabled')

        const nodeAcc = data.sign.owner
        const stake_cert: StakeCert = appJoinData.stakeCert
        if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest ${JSON.stringify(stake_cert)}`)

        const tx_time = data.joinRequestTimestamp as number

        if (stake_cert == null) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: stake_cert == null')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: stake_cert == null`)
          return {
            success: false,
            reason: `Join request node doesn't provide the stake certificate.`,
            fatal: true,
          }
        }

        if (nodeAcc !== stake_cert.nominee) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: nodeAcc !== stake_cert.nominee')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: nodeAcc !== stake_cert.nominee`)
          return {
            success: false,
            reason: `Nominated address and tx signature owner doesn't match, nominee: ${stake_cert.nominee}, sign owner: ${nodeAcc}`,
            fatal: true,
          }
        }

        if (tx_time > stake_cert.certExp) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: tx_time > stake_cert.certExp')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: tx_time > stake_cert.certExp ${tx_time} > ${stake_cert.certExp}`  )
          return {
            success: false,
            reason: `Certificate has expired at ${stake_cert.certExp}`,
            fatal: false,
          }
        }

        const serverConfig = config.server
        const two_cycle_ms = serverConfig.p2p.cycleDuration * 2 * 1000

        // stake certification should not expired for at least 2 cycle.
        if (Date.now() + two_cycle_ms > stake_cert.certExp) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: cert expires soon')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: cert expires soon ${Date.now() + two_cycle_ms} > ${stake_cert.certExp}`  )
          return {
            success: false,
            reason: `Certificate will be expired really soon.`,
            fatal: false,
          }
        }

        const minStakeRequiredUsd = _base16BNParser(
          AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
        )
        const minStakeRequired = scaleByStabilityFactor(
          minStakeRequiredUsd,
          AccountsStorage.cachedNetworkAccount
        )

        const stakedAmount = _base16BNParser(stake_cert.stake)

        if (stakedAmount.lt(minStakeRequired)) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: stake_cert.stake < minStakeRequired')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: stake_cert.stake < minStakeRequired ${_readableSHM(stakedAmount)} < ${_readableSHM(minStakeRequired)}`)
          return {
            success: false,
            reason: `Minimum stake amount requirement does not meet.`,
            fatal: false,
          }
        }

        const requiredSig = getNodeCountForCertSignatures()
        const { success, reason } = shardus.validateActiveNodeSignatures(
          stake_cert,
          stake_cert.signs,
          requiredSig
        )
        if (!success) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: invalid signature')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: invalid signature`, reason)
          return { success, reason, fatal: false }
        }
      }

      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest success!!!`)
      return {
        success: true,
        reason: 'Join Request validated',
        fatal: false,
      }
    } catch (e) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest exception: ${e}`)
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateJoinRequest fail: exception: ${e} `)
      return {
        success: false,
        reason: `validateJoinRequest fail: exception: ${e}`,
        fatal: true,
      }
    }
  },
  // Update the activeNodes type here; We can import from P2P.P2PTypes.Node from '@shardus/type' lib but seems it's not installed yet
  async isReadyToJoin(latestCycle: ShardusTypes.Cycle, publicKey: string, activeNodes: []) {
    if (ShardeumFlags.StakingEnabled === false) return true
    if (activeNodes.length + latestCycle.syncing < ShardeumFlags.minActiveNodesForStaking) return true

    if (ShardeumFlags.VerboseLogs) {
      console.log(`Running isReadyToJoin cycle:${latestCycle.counter} publicKey: ${publicKey}`)
    }

    if (lastCertTimeTxTimestamp === 0) {
      // inject setCertTimeTx for the first time
      nestedCountersInstance.countEvent('shardeum-staking', 'lastCertTimeTxTimestamp === 0')

      const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
      if (response == null) {
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 1 reason: response is null`)
        return false
      }
      if (!response.success) {
        /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum-staking', `failed call to injectSetCertTimeTx 1 reason: ${(response as ValidatorError).reason}` )
        return false
      }

      // set lastCertTimeTxTimestamp and cycle
      lastCertTimeTxTimestamp = Date.now()
      lastCertTimeTxCycle = latestCycle.counter

      // return false and query/check again in next cycle
      return false
    }

    //if our last set cert time was more than certCycleDuration cycles ago then we need to ask again
    const isCertTimeExpired =
      lastCertTimeTxCycle > 0 && latestCycle.counter - lastCertTimeTxCycle > ShardeumFlags.certCycleDuration
    if (isCertTimeExpired) {
      nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert expired and need to be renewed')
    }

    //if we have stakeCert, check its time
    if (stakeCert != null) {
      nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert != null')

      const remainingValidTime = stakeCert.certExp - Date.now()
      const certStartTimestamp =
        stakeCert.certExp - ShardeumFlags.certCycleDuration * ONE_SECOND * latestCycle.duration
      const certEndTimestamp = stakeCert.certExp
      const expiredPercentage = (Date.now() - certStartTimestamp) / (certEndTimestamp - certStartTimestamp)
      const isExpiringSoon = expiredPercentage >= 0.9
      if (ShardeumFlags.VerboseLogs) {
        /* prettier-ignore */ console.log('stakeCert != null. remainingValidTime / minimum time ', remainingValidTime, certExpireSoonCycles * ONE_SECOND * latestCycle.duration, `expiredPercentage: ${expiredPercentage}, isExpiringSoon: ${isExpiringSoon}`)
      }
      if (isExpiringSoon || isCertTimeExpired) {
        nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert is expired or expiring soon')

        stakeCert = null //clear stake cert, so we will know to query for it again
        const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
        if (response == null) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: response is null`)
          return false
        }
        if (!response.success) {
          /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: ${(response as ValidatorError).reason}` )
          return false
        }
        lastCertTimeTxTimestamp = Date.now()
        lastCertTimeTxCycle = latestCycle.counter
        // return false and check again in next cycle
        return false
      } else {
        const isValid = true
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
      const res = await queryCertificate(shardus, publicKey, activeNodes)
      if (ShardeumFlags.VerboseLogs) console.log('queryCertificate', res)
      if (!res.success) {
        if ((res as ValidatorError).reason === 'Operator certificate has expired') {
          //force a set cert time next cycle, this should not be needed
          lastCertTimeTxTimestamp = 0
        }

        nestedCountersInstance.countEvent(
          'shardeum-staking',
          `call to queryCertificate failed with reason: ${(res as ValidatorError).reason}`
        )
        return false
      }
      const signedStakeCert = (res as CertSignaturesResult).signedStakeCert
      if (signedStakeCert == null) {
        nestedCountersInstance.countEvent('shardeum-staking', `signedStakeCert is null`)
        return false
      }
      const remainingValidTime = signedStakeCert.certExp - Date.now()

      const certStartTimestamp =
        signedStakeCert.certExp - ShardeumFlags.certCycleDuration * ONE_SECOND * latestCycle.duration
      const certEndTimestamp = signedStakeCert.certExp
      const expiredPercentage = (Date.now() - certStartTimestamp) / (certEndTimestamp - certStartTimestamp)
      const isExpiringSoon = expiredPercentage >= 0.9
      /* prettier-ignore */ console.log('stakeCert received. remainingValidTime / minimum time ', remainingValidTime, certExpireSoonCycles * ONE_SECOND * latestCycle.duration, `expiredPercent: ${expiredPercentage}, isExpiringSoon: ${isExpiringSoon}`)

      // if queried cert is going to expire soon, inject a new setCertTimeTx
      if (isExpiringSoon) {
        nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert is expiring soon')

        stakeCert = null //clear stake cert, so we will know to query for it again
        const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
        if (response == null) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 3 reason: response is null`)
          return false
        }
        if (!response.success) {
          /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum-staking', `failed call to injectSetCertTimeTx 3 reason: ${(response as ValidatorError).reason}` )
          return false
        }

        lastCertTimeTxTimestamp = Date.now()
        lastCertTimeTxCycle = latestCycle.counter
        // return false and check again in next cycle
        return false
      } else {
        const isValid = true
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
  },
  getNodeInfoAppData() {
    let minVersion = ''
    let activeVersion = ''
    const cachedNetworkAccount = AccountsStorage.cachedNetworkAccount
    if (cachedNetworkAccount) {
      minVersion = cachedNetworkAccount.current.minVersion
      activeVersion = cachedNetworkAccount.current.minVersion
    }
    const shardeumNodeInfo: NodeInfoAppData = {
      shardeumVersion: version,
      minVersion,
      activeVersion,
    }
    return shardeumNodeInfo
  },
  async eventNotify(data: ShardusTypes.ShardusEvent) {
    if (ShardeumFlags.StakingEnabled === false) return
    if (ShardeumFlags.VerboseLogs) console.log(`Running eventNotify`, data)

    const nodeId = shardus.getNodeId()
    const node = shardus.getNode(nodeId)

    // skip for own node
    if (data.nodeId === nodeId) {
      return
    }

    if (node == null) {
      if (ShardeumFlags.VerboseLogs) console.log(`node is null`, nodeId)
      return
    }

    // We can skip staking related txs for the first node
    if (shardus.p2p.isFirstSeed) {
      //only skip events for our node, test redundant now
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
    const latestCycles: ShardusTypes.Cycle[] = shardus.getLatestCycles()
    const currentCycle = latestCycles[0]
    if (!currentCycle) {
      console.log('No cycle records found', latestCycles)
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
        const activeNodesCount = currentCycle.active
        const stakingEnabled = activeNodesCount >= ShardeumFlags.minActiveNodesForStaking
        // Skip initRewardTimes if activeNodesCount is less than minActiveNodesForStaking
        if (!stakingEnabled) {
          return
        }
        nestedCountersInstance.countEvent('shardeum-staking', `node-activated: injectInitRewardTimesTx`)
        //TODO need retry on this also
        const result = await InitRewardTimesTx.injectInitRewardTimesTx(shardus, data)
        console.log('INJECTED_INIT_REWARD_TIMES_TX', result)
      } else if (eventType === 'node-deactivated') {
        nestedCountersInstance.countEvent('shardeum-staking', `node-deactivated: injectClaimRewardTx`)
        const result = await injectClaimRewardTxWithRetry(shardus, data)
        console.log('INJECTED_CLAIM_REWARD_TX', result)
      }
    }
  },
  async updateNetworkChangeQueue(account: WrappedAccount, appData) {
    if (account.accountId === networkAccount) {
      /* eslint-disable security/detect-object-injection */
      const networkAccount: NetworkAccount = account.data
      for (const key in appData) {
        if (key === 'activeVersion') {
          await onActiveVersionChange(appData[key])
        }

        networkAccount.current[key] = appData[key]
      }
      account.timestamp = Date.now()
      networkAccount.hash = WrappedEVMAccountFunctions._calculateAccountHash(networkAccount)
      account.stateId = networkAccount.hash
      return [account]
      /* eslint-enable security/detect-object-injection */
    }
  },
})

shardus.registerExceptionHandler()

function periodicMemoryCleanup() {
  const keys = shardeumStateTXMap.keys()
  //todo any provisions needed for TXs that can hop and extend the timer
  const maxAge = Date.now() - 60000
  for (const key of keys) {
    const shardeumState = shardeumStateTXMap.get(key)
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
    const serverConfig = config.server
    const cycleInterval = serverConfig.p2p.cycleDuration * ONE_SECOND

    let node
    let nodeId: string
    let nodeAddress: string
    let expected = Date.now() + cycleInterval
    let drift: number
    await shardus.start()

    // THIS CODE IS CALLED ON EVERY NODE ON EVERY CYCLE
    async function networkMaintenance(): Promise<NodeJS.Timeout> {
      shardus.log('New maintainence cycle has started')
      drift = Date.now() - expected

      try {
        nodeId = shardus.getNodeId()
        node = shardus.getNode(nodeId)
        nodeAddress = node.address

        // wait for rewards
        const latestCycles = shardus.getLatestCycles()
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

      shardus.log('Maintainence cycle has ended')
      expected += cycleInterval
      return setTimeout(networkMaintenance, Math.max(100, cycleInterval - drift))
    }

    shardus.on('active', async (): Promise<NodeJS.Timeout> => {
      const latestCycles = shardus.getLatestCycles()
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

      shardus.registerCacheTopic(
        'receipt',
        ShardeumFlags.cacheMaxCycleAge,
        ShardeumFlags.cacheMaxItemPerTopic
      )

      return setTimeout(networkMaintenance, cycleInterval)
    })
  })()
} else {
  shardus.start()
}
