import stringify from 'fast-json-stable-stringify'
import * as crypto from '@shardus/crypto-utils'
import {Account, Address, BN, bufferToHex, isValidAddress, toBuffer} from 'ethereumjs-util'
import {AccessListEIP2930Transaction, Transaction} from '@ethereumjs/tx'
import Common, {Chain} from '@ethereumjs/common';
import VM from '@ethereumjs/vm'
import {parse as parseUrl} from 'url'
import got from 'got'
import 'dotenv/config'
import {ShardeumState, TransactionState} from './state'
import {__ShardFunctions, ShardusTypes} from '@shardus/core'
import {ContractByteWrite} from './state/transactionState'
import {version} from '../package.json'
import {
  AccountType,
  BlockMap,
  DebugTx,
  DebugTXType,
  EVMAccountInfo,
  InternalTx,
  InternalTXType,
  NetworkAccount,
  NetworkParameters,
  NodeAccount,
  OurAppDefinedData,
  ReadableReceipt,
  WrappedAccount,
  WrappedEVMAccount,
  WrappedStates,
} from './shardeum/shardeumTypes'
import {getAccountShardusAddress, toShardusAddress, toShardusAddressWithKey} from './shardeum/evmAddress'
import * as ShardeumFlags from './shardeum/shardeumFlags'
import * as WrappedEVMAccountFunctions from './shardeum/wrappedEVMAccountFunctions'
import {
  fixDeserializedWrappedEVMAccount,
  predictContractAddressDirect,
  updateEthAccountHash
} from './shardeum/wrappedEVMAccountFunctions'
import {isEqualOrNewerVersion, replacer, sleep, zeroAddressStr} from './utils'
import config from './config'
import {RunTxResult} from '@ethereumjs/vm/dist/runTx'
import {RunState} from '@ethereumjs/vm/dist/evm/interpreter'
import Wallet from 'ethereumjs-wallet'
import genesis from './config/genesis.json'
import {loadAccountDataFromDB} from './shardeum/debugRestoreAccounts'
import {Block} from '@ethereumjs/block'
import {ShardeumBlock} from './block/blockchain'

import * as AccountsStorage from './storage/accountStorage'
import {StateManager} from '@ethereumjs/vm/dist/state';


const env = process.env

let { shardusFactory } = require('@shardus/core')

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

export const networkAccount = '0'.repeat(64)

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

// INITIAL NETWORK PARAMETERS FOR Shardeum
export const INITIAL_PARAMETERS: NetworkParameters = {
  title: 'Initial parameters',
  description: 'These are the initial network parameters Shardeum started with',
  nodeRewardInterval: ONE_MINUTE * 5, // 10 minutes for testing
  nodeRewardAmount: 1, // 1 ETH
  nodePenalty: 10,
  stakeRequired: 5,
  maintenanceInterval: ONE_DAY,
  maintenanceFee: 0
}

export let genesisAccounts = []

const ERC20_BALANCEOF_CODE =  '0x70a08231';

const shardus = shardusFactory(config)

// const pay_address = '0x50F6D9E5771361Ec8b95D6cfb8aC186342B70120' // testing account for node_reward
const random_wallet = Wallet.generate()
const pay_address = random_wallet.getAddressString()

console.log('Pay Address', pay_address, isValidAddress(pay_address))

//console.log('Pk',random_wallet.getPublicKey())
//console.log('pk',random_wallet.getPrivateKey())

let nodeRewardCount = 0

function isDebugMode(){
  //@ts-ignore
  return config.server.mode === "debug"
}

function isVerboseEnabled() {
  let logVerbose = shardus.getLogFlags().verbose
  return logVerbose
}

function verify(obj, expectedPk?) {
  if (expectedPk) {
    if (obj.sign.owner !== expectedPk) return false
  }
  return crypto.verifyObj(obj)
}

// grab this
const pointsAverageInterval = 2 // seconds

let servicePointSpendHistory:{points:number, ts:number}[] = []

/**
 * Allows us to attempt to spend points.  We have ShardeumFlags.ServicePointsPerSecond
 * that can be spent as a total bucket
 * @param points
 * @returns
 */
function trySpendServicePoints(points:number) : boolean {
  let nowTs = Date.now()
  let maxAge = 1000 * pointsAverageInterval
  let maxAllowedPoints = ShardeumFlags.ServicePointsPerSecond * pointsAverageInterval
  let totalPoints = 0
  //remove old entries, count points
  for(let i=servicePointSpendHistory.length-1; i>=0; i-- ){
    let entry = servicePointSpendHistory[i]
    let age = nowTs - entry.ts
    //if the element is too old remove it
    if(age > maxAge){
      servicePointSpendHistory.pop()
    } else {
      totalPoints += entry.points
    }
  }

  //is the new operation too expensive?
  if(totalPoints + points > maxAllowedPoints){
    return false
  }

  //Add new entry to array
  let newEntry = {points, ts:nowTs}
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
          if(ShardeumFlags.VerboseLogs) console.log('Lengths of blocks after pruning', Object.keys(blocksByHash).length, Object.keys(readableBlocks).length)
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
  if(previousBlock) defaultBlock.parentHash = previousBlock.hash
  return defaultBlock
}

function createNewBlock(blockNumber, timestamp): Block {
  if (blocks[blockNumber]) return blocks[blockNumber]
  if (!blocks[blockNumber]) {
    let timestampInSecond = timestamp ? Math.round(timestamp / 1000) : Math.round(Date.now() / 1000)
    const blockData = {
      header: {number: blockNumber, timestamp: new BN(timestampInSecond)},
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

if(ShardeumFlags.UseDBForAccounts === true){
  AccountsStorage.init(config.server.baseDir, 'db/shardeum.sqlite')
}

//let accounts: WrappedEVMAccountMap = {} //relocated

//may need these later.  if so, move to DB
let appliedTxs = {} //this appears to be unused. will it still be unused if we use receipts as app data
let shardusTxIdToEthTxId = {} //this appears to only support appliedTxs
const oneEth = new BN(10).pow(new BN(18))

let appliedEVMReceipts = [] // To use with EVMReceiptsAsAccounts false
let EVMReceiptsToKeep = 1000

//In debug mode the default value is 100 SHM.  This is needed for certain load test operations
const defaultBalance = isDebugMode() ? oneEth.mul(new BN(100)) : new BN(0)

const supportedHardforks = [
  'chainstart',
  'homestead',
  'tangerineWhistle',
  'spuriousDragon',
  'byzantium',
  'constantinople',
  'petersburg',
  'istanbul',
  'berlin',
]

// TODO move this to a db table
let transactionFailHashMap: any = {}

let ERC20TokenBalanceMap: any = []
let ERC20TokenCacheSize = 1000


interface RunStateWithLogs extends RunState {
  logs?: []
}

let EVM:VM
let shardeumBlock:ShardeumBlock
//let transactionStateMap:Map<string, TransactionState>

//Per TX or Eth call shardeum State
let shardeumStateTXMap:Map<string, ShardeumState>
//let shardeumStateCallMap:Map<string, ShardeumState>
//let shardeumStatePool:ShardeumState[]
let debugShardeumState:ShardeumState = null

let shardusAddressToEVMAccountInfo:Map<string, EVMAccountInfo>
let evmCommon

//todo refactor some object init into here
function initEVMSingletons(){
  let chainIDBN = new BN(ShardeumFlags.ChainID)

  //let common = new Common({ chain: ShardeumFlags.ChainID, supportedHardforks })
  evmCommon = new Common({ chain: Chain.Mainnet, supportedHardforks })

  //hack override this function.  perhaps a nice thing would be to use forCustomChain to create a custom common object
  evmCommon.chainIdBN = () => {
    return chainIDBN
  }

  //let shardeumStateManager = new ShardeumState({ common }) //as StateManager
  //shardeumStateManager.temporaryParallelOldMode = ShardeumFlags.temporaryParallelOldMode //could probably refactor to use ShardeumFlags in the state manager

  shardeumBlock = new ShardeumBlock({ common:evmCommon })

  //let EVM = new VM({ common, stateManager: shardeumStateManager, blockchain: shardeumBlock })

  EVM = new VM({ common:evmCommon, stateManager: undefined, blockchain: shardeumBlock })

  //todo need to evict old data
  ////transactionStateMap = new Map<string, TransactionState>()

  // a map of txID or ethcallID to shardeumState, todo need to evict old data
  shardeumStateTXMap = new Map<string, ShardeumState>()
  // a map of txID or ethcallID to shardeumState, todo need to evict old data
  //shardeumStateCallMap = new Map<string, ShardeumState>()

  //shardeumStatePool = []


  //todo need to evict old data
  shardusAddressToEVMAccountInfo = new Map<string, EVMAccountInfo>()

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
  let transferBlob = transactionState.getTransferBlob()
  let txID = transactionState.linkedTX

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
async function contractStorageMiss(transactionState: TransactionState, address: string, key: string): Promise<boolean> {
  //Get the first read version of data that we have collected so far
  let transferBlob = transactionState.getTransferBlob()
  let txID = transactionState.linkedTX

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
function contractStorageInvolved(transactionState: TransactionState, address: string, key: string, isRead: boolean): boolean {
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

async function contractStorageMissNoOp(transactionState: TransactionState, address: string, key: string): Promise<boolean> {
  let isRemoteShard = false
  return isRemoteShard
}

function accountInvolvedNoOp(transactionState: TransactionState, address: string, isRead: boolean): boolean {
  return true
}

function contractStorageInvolvedNoOp(transactionState: TransactionState, address: string, key: string, isRead: boolean): boolean {
  return true
}


function tryGetRemoteAccountCBNoOp(transactionState: TransactionState, type:AccountType, address: string, key: string) : Promise<WrappedEVMAccount> {
  return undefined
}

async function tryGetRemoteAccountCB(transactionState: TransactionState, type:AccountType, address: string, key: string) : Promise<WrappedEVMAccount> {
  let shardusAddress = toShardusAddressWithKey(address, key, type)
  if (ShardeumFlags.VerboseLogs) console.log(`Trying to get remote account for address: ${address}, type: ${type}, key: ${key}`)
  let remoteShardusAccount = await shardus.getLocalOrRemoteAccount(shardusAddress)
  if (remoteShardusAccount == undefined) {
    if (ShardeumFlags.VerboseLogs) console.log(`Found no remote account for address: ${address}, type: ${type}, key: ${key}`)
    return
  }
  let fixedEVMAccount = remoteShardusAccount.data
  fixDeserializedWrappedEVMAccount(fixedEVMAccount)
  if (ShardeumFlags.VerboseLogs) console.log(`Successfully found remote account for address: ${address}, type: ${type}, key: ${key}`, fixedEVMAccount)
  return fixedEVMAccount
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

async function createAccount(addressStr:string, stateManager: StateManager, balance: BN = defaultBalance): Promise<WrappedEVMAccount> {
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

function isInternalTx(tx: any): boolean {
  if (tx.isInternalTx) {
    return true
  }
  return false
}

function isDebugTx(tx: any): boolean {
  return tx.isDebugTx != null
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

function getReadableTransaction(tx) {
  const transaction = getTransactionObj(tx)
  if (!transaction) return { error: 'not found' }
  return {
    from: transaction.getSenderAddress().toString(),
    to: transaction.to ? transaction.to.toString() : '',
    value: transaction.value.toString(),
    data: bufferToHex(transaction.data),
  }
}

async function getReadableAccountInfo(account) {
  try {
    //todo this code needs additional support for account type contract storage or contract code
    return {
      nonce: account.account.nonce.toString(),
      balance: account.account.balance.toString(),
      stateRoot: bufferToHex(account.account.stateRoot),
      codeHash: bufferToHex(account.account.codeHash),
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
    shardeumState = new ShardeumState({ common:evmCommon })
    let transactionState = new TransactionState()
    transactionState.initData(
      shardeumState,
      {
        //dont define callbacks for db TX state!
        storageMiss: accountMissNoOp,
        contractStorageMiss: contractStorageMissNoOp,
        accountInvolved: accountInvolvedNoOp,
        contractStorageInvolved: contractStorageInvolvedNoOp,
        tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp
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

  let shardeumState = new ShardeumState({ common:evmCommon })
  let transactionState = new TransactionState()
  transactionState.initData(
    shardeumState,
    {
      storageMiss: accountMissNoOp,
      contractStorageMiss: contractStorageMissNoOp,
      accountInvolved: accountInvolvedNoOp,
      contractStorageInvolved: contractStorageInvolvedNoOp,
      tryGetRemoteAccountCB: tryGetRemoteAccountCB
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

    let shardeumState = new ShardeumState({ common:evmCommon })
    let transactionState = new TransactionState()
    transactionState.initData(
        shardeumState,
        {
            storageMiss: accountMissNoOp,
            contractStorageMiss: contractStorageMissNoOp,
            accountInvolved: accountInvolvedNoOp,
            contractStorageInvolved: contractStorageInvolvedNoOp,
            tryGetRemoteAccountCB: tryGetRemoteAccountCB
        },
        txId,
        undefined,
        undefined
    )
    shardeumState.setTransactionState(transactionState)
    return shardeumState
}

function getApplyTXState(txId:string): ShardeumState{

  let shardeumState = shardeumStateTXMap.get(txId)
  if (shardeumState == null) {

    shardeumState = new ShardeumState({ common:evmCommon })
    let transactionState = new TransactionState()
    transactionState.initData(
      shardeumState,
      {
        storageMiss: accountMiss,
        contractStorageMiss,
        accountInvolved,
        contractStorageInvolved,
        tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp
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

/**
 * This creates an account outside of any EVM transaction
 * @param ethAccountID
 * @param balance
 */
async function manuallyCreateAccount(ethAccountID: string, balance = defaultBalance) {
  //await sleep(4 * 60 * 1000) // wait 4 minutes to init account

  let shardusAccountID = toShardusAddress(ethAccountID, AccountType.Account)

  let debugTXState = getDebugTXState() //this isn't so great..
  debugTXState.checkpoint()
  let newAccount = await createAccount(ethAccountID, debugTXState, balance)
  debugTXState.commit()

  //if (ShardeumFlags.temporaryParallelOldMode === false) {
    let { accounts: accountWrites, contractStorages: contractStorageWrites, contractBytes: contractBytesWrites } = debugTXState._transactionState.getWrittenAccounts()

    //need to commit the account now... this is such a hack!!
    for (let account of accountWrites.entries()) {
      //1. wrap and save/update this to shardeum accounts[] map
      let addressStr = account[0]
      let accountObj = Account.fromRlpSerializedAccount(account[1])

      let ethAccount = accountObj
      debugTXState._transactionState.commitAccount(addressStr, ethAccount) //yikes this wants an await.
    }
  //}

  if (ShardeumFlags.VerboseLogs) console.log('Tester account created', newAccount)
  const address = Address.fromString(ethAccountID)
  let account = await debugTXState.getAccount(address)

  let cycleStart = 0
  let latestCycles = shardus.getLatestCycles()
  if (latestCycles != null && latestCycles.length > 0) {
    cycleStart = latestCycles[0].start * 1000
    console.log('Tester account created time: ', cycleStart)
  }

  let wrappedEVMAccount = {
    timestamp: cycleStart,
    account,
    ethAddress: ethAccountID,
    hash: '',
    accountType: AccountType.Account,
  }
  WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
  return {accountId: shardusAccountID, wrappedEVMAccount, cycle: latestCycles[0]}
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

async function _internalHackGet(url: string) {
  let normalized = _normalizeUrl(url)
  let host = parseUrl(normalized, true)
  try {
    await got.get(host, {
      timeout: 1000,
      retry: 0,
      throwHttpErrors: false,
      //parseJson: (text:string)=>{},
      //json: false, // the whole reason for _internalHackGet was because we dont want the text response to mess things up
      //  and as a debug non shipping endpoint did not want to add optional parameters to http module
    })
  } catch (e) { }
}

async function _internalHackGetWithResp(url: string) {
  let normalized = _normalizeUrl(url)
  let host = parseUrl(normalized, true)
  try {
    const res = await got.get(host, {
      timeout: 1000,
      retry: 0,
      throwHttpErrors: false,
      //parseJson: (text:string)=>{},
      //json: false, // the whole reason for _internalHackGet was because we dont want the text response to mess things up
      //  and as a debug non shipping endpoint did not want to add optional parameters to http module
    })
    return res
  } catch (e) { }
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
  if(trySpendServicePoints(points) === false){
    return res.json({error:'node busy' , points,  servicePointSpendHistory})
  }

  return res.json(`spent points: ${points}  ${JSON.stringify(servicePointSpendHistory)} `)
})

shardus.registerExternalPost('inject', async (req, res) => {
  let tx = req.body
  if (ShardeumFlags.VerboseLogs) console.log('Transaction injected:', new Date(), tx)
  try {
    if (tx.isInternalTx && tx.internalTXType === InternalTXType.ChangeConfig) {
      const response = await shardus.put(tx, false, true)
      return res.json(response)
    }
    const response = await shardus.put(tx)
    res.json(response)
  } catch (err) {
    if (ShardeumFlags.VerboseLogs) console.log('Failed to inject tx: ', err)
  }
})

shardus.registerExternalGet('eth_blockNumber', async (req, res) => {
    if (ShardeumFlags.VerboseLogs) console.log('Req: eth_blockNumber')
    return res.json({blockNumber: latestBlock ? '0x' + latestBlock.toString(16) : '0x0'})
})

shardus.registerExternalGet('eth_getBlockByNumber', async (req, res) => {
  let blockNumber = req.query.blockNumber
  if (blockNumber === 'latest') blockNumber = latestBlock
  if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByNumber', blockNumber)
  if (blockNumber == null) {
    return res.json({error: 'Invalid block number'})
  }
  return res.json({block: readableBlocks[blockNumber]})
})

shardus.registerExternalGet('eth_getBlockByHash', async (req, res) => {
  let blockHash = req.query.blockHash
  if (blockHash === 'latest') blockHash = readableBlocks[latestBlock].hash
  if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByHash', blockHash)
  let blockNumber = blocksByHash[blockHash]
  return res.json({block: readableBlocks[blockNumber]})
})


shardus.registerExternalGet('dumpStorage',debugMiddleware, async (req, res) => {
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

// //this is not used by the web faucet.  probably could remove it
// shardus.registerExternalPost('faucet', async (req, res) => {
//   if(isDebugMode()){
//     return res.json(`endpoint not available`)
//   }

//   let tx = req.body
//   let id = tx.address as string
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

shardus.registerExternalGet('account/:address', async (req, res) => {
  if(trySpendServicePoints(ShardeumFlags.ServicePoints['account/:address']) === false){
    return res.json({error:'node busy'})
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
      //let account = accounts[shardusAddress]
      let account = await AccountsStorage.getAccount(shardusAddress)
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
  if(trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].endpoint) === false){
    return res.json({result: null, error:'node busy'})
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

    let caShardusAddress;
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
            if (ShardeumFlags.VerboseLogs) console.log('Found in the ERC20TokenBalanceMap; index:', index, callObj.to)
            ERC20TokenBalanceMap.splice(index, 1)
            if (tokenBalanceResult.timestamp === caAccount.timestamp) { // The contract account is not updated yet.
              ERC20TokenBalanceMap.push(tokenBalanceResult)
              if (ShardeumFlags.VerboseLogs) console.log(`eth call for ERC20TokenBalanceMap`, callObj.to, callObj.data)
              return res.json({ result: tokenBalanceResult.result })
            }
          }
        }
      }
    }

    if (opt['to']) {
      console.log('Calling to ', callObj.to, caShardusAddress)
      //let callerShardusAddress = toShardusAddress(callObj.caller, AccountType.Account)

      //Overly techincal, should be ported back into SGS as a utility
      let address = caShardusAddress
      let accountIsRemote = shardus.isAccountRemote(address)

      if (accountIsRemote) {
        let consensusNode = shardus.getRandomConsensusNodeForAccount(address)
        if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
        if (consensusNode != null) {
          if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)

          let postResp = await _internalHackPostWithResp(`${consensusNode.externalIp}:${consensusNode.externalPort}/contract/call`, callObj)
          if (postResp.body != null && postResp.body != '') {
            //getResp.body

            if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:${JSON.stringify(postResp.body)}`)
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
    if(trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].direct) === false){
      return res.json({ result: null, error:'node busy'})
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
    if (ShardeumFlags.VerboseLogs) console.log('Call Result', callResult.execResult.returnValue.toString('hex'))

    if (methodCode === ERC20_BALANCEOF_CODE) {
      //TODO would be way faster to have timestamp in db as field
      //let caAccount = await AccountsStorage.getAccount(caShardusAddress)

      ERC20TokenBalanceMap.push({
        'to': callObj.to,
        'data': callObj.data,
        'timestamp': caAccount && caAccount.timestamp, //this will invalidate for any user..
        'result': callResult.execResult.exceptionError ? null : callResult.execResult.returnValue.toString('hex')
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
    if(trySpendServicePoints(ShardeumFlags.ServicePoints['contract/accesslist'].endpoint) === false){
        return res.json({result: null, error:'node busy'})
    }

    try {
        const callObj = req.body
        if (ShardeumFlags.VerboseLogs) console.log('callObj', callObj)
        let opt = {
            to: Address.fromString(callObj.to),
            caller: Address.fromString(callObj.from),
            origin: Address.fromString(callObj.from), // The tx.origin is also the caller here
            data: toBuffer(callObj.data),
            value: callObj.value && callObj.value.hex ? new BN(String(parseInt(callObj.value.hex))) : new BN('0')
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

        let caShardusAddress;
        const methodCode = callObj.data.substr(0, 10)
        let caAccount

        if (opt['to']) {
            caShardusAddress = toShardusAddress(callObj.to, AccountType.Account)
        }

        if (opt['to']) {
            console.log('Calling to ', callObj.to, caShardusAddress)

            let address = caShardusAddress
            let accountIsRemote = shardus.isAccountRemote(address)

            if (accountIsRemote) {
                let consensusNode = shardus.getRandomConsensusNodeForAccount(address)
                if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
                if (consensusNode != null) {
                    if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)

                    let postResp = await _internalHackPostWithResp(`${consensusNode.externalIp}:${consensusNode.externalPort}/contract/prerun`, callObj)
                    if (postResp.body != null && postResp.body != '') {
                        //getResp.body

                        if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:${JSON.stringify(postResp.body)}`)
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
        if(trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].direct) === false){
            return res.json({ result: null, error:'node busy'})
        }

        let txId = crypto.hashObj(callObj)
        let preRunTxState = getPreRunTXState(txId)

        let callerAddress = toShardusAddress(callObj.from, AccountType.Account)
        let callerAccount = await AccountsStorage.getAccount(callerAddress)
        if (callerAccount) {
            if (ShardeumFlags.VerboseLogs) console.log('callerAddress', callerAccount)
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
        console.log('runCall callOption', opt)
        const callResult = await EVM.runCall(opt)
        let readAccounts = preRunTxState._transactionState.getReadAccounts()
        let writtenAccounts = preRunTxState._transactionState.getWrittenAccounts()
        let allInvolvedContracts = []
        let accessList = []
        for (let [key, storageMap] of writtenAccounts.contractStorages) {
            if(!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)
        }
        for (let [key, storageMap] of readAccounts.contractStorages) {
            if(!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)
        }
        for (let [codeHash, contractByteWrite] of readAccounts.contractBytes) {
            let contractAddress = contractByteWrite.contractAddress.toString()
            if(!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)
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
            let accessListItem = [address, Array.from(allKeys).map(key => '0x' + key)]
            accessList.push(accessListItem)
        }

        if (ShardeumFlags.VerboseLogs) console.log('Predicted accessList', accessList)

        if (callResult.execResult.exceptionError) {
            if (ShardeumFlags.VerboseLogs) console.log('Execution Error:', callResult.execResult.exceptionError)
            return res.json({ result: null })
        }

        res.json({ result: callResult.execResult.returnValue.toString('hex'), accessList })
    } catch (e) {
        if (ShardeumFlags.VerboseLogs) console.log('Error predict accessList', e)
        return res.json({ result: null })
    }
})

shardus.registerExternalGet('tx/:hash', async (req, res) => {
  if(trySpendServicePoints(ShardeumFlags.ServicePoints['tx/:hash']) === false){
    return res.json({error:'node busy'})
  }

  const txHash = req.params['hash']
  if (!ShardeumFlags.EVMReceiptsAsAccounts) {
    let evmReceipt = appliedEVMReceipts.find(receipt => receipt.txId === txHash)
    if (!evmReceipt) return res.json({ tx: 'Not found' })
    let data = evmReceipt.receipt.data
    fixDeserializedWrappedEVMAccount(data)
    return res.json({ account: data })
  }
  try {
    //const shardusAddress = toShardusAddressWithKey(txHash.slice(0, 42), txHash, AccountType.Receipt)
    const shardusAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
    const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
    if (!account || !account.data) {
      if (transactionFailHashMap[txHash]) {
        console.log(`Tx Hash ${txHash} is found in the failed transactions list`, transactionFailHashMap[txHash])
        return res.json({ account: transactionFailHashMap[txHash] })
      }
      console.log(`No tx found for ${shardusAddress}`)//, accounts[shardusAddress])
      return res.json({ account: null })
    }
    let data = account.data
    fixDeserializedWrappedEVMAccount(data)
    res.json({ account: data })
  } catch (error) {
    console.log(error)
    res.json({ error })
  }
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
  let sorted = JSON.parse(stringify(accounts))

  res.json({ accounts: sorted })
})

shardus.registerExternalGet('nodeRewardValidate', debugMiddleware, async (req, res) => {
  // if(isDebugMode()){
  //   return res.json(`endpoint not available`)
  // }

  const expectedBalance = nodeRewardCount * parseInt(oneEth.mul(new BN(INITIAL_PARAMETERS.nodeRewardAmount)).toString()) + parseInt(defaultBalance.toString())
  const shardusAddress = toShardusAddress(pay_address, AccountType.Account)
  //const account = accounts[shardusAddress]
  const account = await AccountsStorage.getAccount(shardusAddress)

  // const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
  if (!account || !account.account) {
    console.log(`Pay address ${pay_address} is not found!`)
    return res.json({ success: false, data: `Pay address ${pay_address} is not found!` })
  }
  // let data = account.account
  fixDeserializedWrappedEVMAccount(account)
  let readableAccount = await getReadableAccountInfo(account)
  console.log(expectedBalance, readableAccount.balance)
  if (expectedBalance === parseInt(readableAccount.balance)) {
    return res.json({ success: true, data: 'Node reward is adding successfully!' })
  }
  return res.json({ success: false, data: `Pay address ${pay_address} balance and Node reward amount does not match!` })
})

shardus.registerExternalGet('genesis_accounts', async (req, res) => {
  const { start } = req.query;
  if (!start) {
    return res.json({ success: false, reason: 'start value is not defined!' })
  }
  const skip = parseInt(start)
  const limit = skip + 1000;
  let accounts = []
  if (genesisAccounts.length > 0) {
    accounts = genesisAccounts.slice(skip, limit)
  }
  res.json({ success: true, accounts })
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

function isInternalTXGlobal(internalTx: InternalTx){
  return internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes
      || internalTx.internalTXType === InternalTXType.ApplyChangeConfig
      || internalTx.internalTXType === InternalTXType.InitNetwork
}

async function applyInternalTx(internalTx: InternalTx, wrappedStates: WrappedStates, txTimestamp: number): Promise<ShardusTypes.ApplyResponse> {
  if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
    const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[internalTx.from].data
    //just update the timestamp?
    wrappedEVMAccount.timestamp = txTimestamp
    //I think this will naturally accomplish the goal of the global update.

    //need to run this to fix buffer types after serialization
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
  }

  let txId = crypto.hashObj(internalTx)
  const applyResponse: ShardusTypes.ApplyResponse = shardus.createApplyResponse(txId, txTimestamp)
  if (internalTx.internalTXType === InternalTXType.InitNetwork) {
    const network: NetworkAccount = wrappedStates[networkAccount].data
    if (ShardeumFlags.useAccountWrites) {
      let writtenAccount = JSON.parse(JSON.stringify(wrappedStates[networkAccount]))
      writtenAccount.data.timestamp = txTimestamp
      shardus.applyResponseAddChangedAccount(applyResponse, networkAccount, writtenAccount, txId, txTimestamp)
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
          let { homePartition } = __ShardFunctions.addressToPartition(shardus.stateManager.currentCycleShardData.shardGlobals, shardusAddress)
          let accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false

          console.log('DBG', 'tx insert data', txId, `accountIsRemote: ${accountIsRemote} acc:${address} key:${wrappedEVMAccount.key} type:${wrappedEVMAccount.accountType}`)
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
    if(ShardeumFlags.EVMReceiptsAsAccounts){
      nodeRewardReceipt = wrappedStates[txId].data // Current node reward receipt hash is set with txId
    }
    from.balance += network.current.nodeRewardAmount // This is not needed and will have to delete `balance` field eventually
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
      shardus.applyResponseAddChangedAccount(applyResponse, toAccountShardusAddress, wrappedStates[toAccountShardusAddress], txId, txTimestamp)
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
      contractAddress: null,
      from: from.id,
      to: to.ethAddress,
      value: oneEth.toString('hex'),
      data: '0x',
      status: 1
    }

    if(ShardeumFlags.EVMReceiptsAsAccounts){
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
      shardus.applyResponseAddReceiptData(applyResponse,shardusWrappedAccount, crypto.hashObj(shardusWrappedAccount))
    }
    // console.log('nodeRewardReceipt', nodeRewardReceipt)
    // shardus.log('Applied node_reward tx', from, to)
    console.log('Applied node_reward tx', txId, txTimestamp)
    //shardeumStateManager.unsetTransactionState(txId)
  }
  if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
    // const from: NodeAccount = wrappedStates[internalTx.from].data // This will be user/node account. needs review!
    const network: NetworkAccount = wrappedStates[networkAccount].data
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
      network: networkAccount,
      change: { cycle: changeOnCycle, change: JSON.parse(internalTx.config) },
    }

    //value = shardus.signAsNode(value)

    let ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
    // network will consens that this is the correct value
    ourAppDefinedData.globalMsg = { address: networkAccount, value, when, source: networkAccount }

    if (ShardeumFlags.useAccountWrites) shardus.applyResponseAddChangedAccount(applyResponse, networkAccount, wrappedStates[networkAccount], txId, txTimestamp)

    // from.timestamp = txTimestamp
    console.log('Applied change_config tx')
    shardus.log('Applied change_config tx')
  }
  if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
    const network: NetworkAccount = wrappedStates[networkAccount].data
    network.timestamp = txTimestamp
    network.listOfChanges.push(internalTx.change)
    if (ShardeumFlags.useAccountWrites) shardus.applyResponseAddChangedAccount(applyResponse, networkAccount, wrappedStates[networkAccount], txId, txTimestamp)
    console.log(`Applied CHANGE_CONFIG GLOBAL transaction: ${stringify(network)}`)
    shardus.log('Applied CHANGE_CONFIG GLOBAL transaction', stringify(network))
  }
  return applyResponse
}

async function applyDebugTx(debugTx: DebugTx, wrappedStates: WrappedStates, txTimestamp: number): Promise<ShardusTypes.ApplyResponse> {
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

function setGlobalCodeByteUpdate(txTimestamp: number, wrappedEVMAccount: WrappedEVMAccount, applyResponse: ShardusTypes.ApplyResponse) {
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

async function _transactionReceiptPass(tx: any, txId: string, wrappedStates: WrappedStates, applyResponse: ShardusTypes.ApplyResponse) {
  if (applyResponse == null) {
    return
  }
  let ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
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

  if (tx.timestamp) {
    txnTimestamp = tx.timestamp
    if (ShardeumFlags.VerboseLogs) {
      console.log(`Timestamp ${txnTimestamp} is extracted from the injected tx.`)
    }
  } else if (timestampReceipt && timestampReceipt.timestamp) {
    txnTimestamp = timestampReceipt.timestamp
    if (ShardeumFlags.VerboseLogs) {
      console.log(`Timestamp ${txnTimestamp} is generated by the network nodes.`)
    }
  }
  return txnTimestamp
}

const createNetworkAccount = (accountId: string, timestamp: number) => {
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
            }
          },
        },
      },
    ],
    current: INITIAL_PARAMETERS,
    next: {},
    hash: '',
    timestamp: 0,
  }
  account.hash = crypto.hashObj(account)
  console.log('INITIAL_HASH: ', account.hash)
  return account
}

const createNodeAccount = (accountId: string) => {
  const account: NodeAccount = {
    id: accountId,
    accountType: AccountType.NodeAccount,
    balance: 0,
    nodeRewardTime: 0,
    hash: '',
    timestamp: 0,
  }
  account.hash = crypto.hashObj(account)
  return account
}

const getTxBlock = (timestamp: string) => {
  for (let i = Object.values(blocks).length - 1; i >= 0; i--) {
    if (Number(timestamp) >= blocks[i].header.timestamp.toNumber())
      return blocks[latestBlock]
  }
}

const getOrCreateBlockFromTimestamp = (timestamp: number, scheduleNextBlock = false): Block => {
  if (ShardeumFlags.VerboseLogs) console.log('Getting block from timestamp', timestamp)
  if (ShardeumFlags.VerboseLogs && blocks[latestBlock]) {
    console.log('Latest block timestamp', blocks[latestBlock].header.timestamp, blocks[latestBlock].header.timestamp.toNumber() + 6000)
    console.log('Latest block number', blocks[latestBlock].header.number.toNumber())
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
  let newBlockTimestampInSecond = cycle.start + cycle.duration + (blockNumber - (cycle.counter * 10)) * ShardeumFlags.blockProductionRate
  let newBlockTimestamp = newBlockTimestampInSecond * 1000
  if(ShardeumFlags.VerboseLogs) {
    console.log('Cycle counter vs derived blockNumber', cycle.counter, blockNumber)
  }
  let block = createNewBlock(blockNumber, newBlockTimestamp)
  if (scheduleNextBlock) {
    let nextBlockTimestamp = newBlockTimestamp + ShardeumFlags.blockProductionRate * 1000
    let waitTime = nextBlockTimestamp - Date.now()
    if(ShardeumFlags.VerboseLogs) console.log('Scheduling next block created which will happen in', waitTime)
    setTimeout(() => {
      getOrCreateBlockFromTimestamp(nextBlockTimestamp, true)
    }, waitTime)
  }
  pruneOldBlocks()
  return block
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
  async sync(): Promise<void> {
    if (ShardeumFlags.useAccountWrites) shardus.useAccountWrites()
    if (ShardeumFlags.GlobalNetworkAccount) {
      if (shardus.p2p.isFirstSeed) {
        await sleep(ONE_SECOND * 5)

        const nodeId = shardus.getNodeId()
        const nodeInfo = shardus.getNode(nodeId)
        // const when = Date.now() + configs.ONE_SECOND * 10

        //await sleep(ONE_SECOND * 20)
        if(ShardeumFlags.DebugRestoreFile != null && ShardeumFlags.DebugRestoreFile != ''){
          let loadOptions = {
            file:ShardeumFlags.DebugRestoreFile
          }
          let report = await loadAccountDataFromDB(shardus, loadOptions)
          //shardus.log('loadAccountDataFromDB:' + JSON.stringify(report))
          console.log('loadAccountDataFromDB:' + JSON.stringify(report))
        }

        //create genesis accounts before network account since nodes will wait for the network account
        shardus.log(`node ${nodeId} GENERATED_A_NEW_NETWORK_ACCOUNT: `)
        if(ShardeumFlags.SetupGenesisAccount) {
          let accountCopies = []
          for (let address in genesis) {
            let amount = new BN(genesis[address].wei)
            let {wrappedEVMAccount, accountId, cycle} = await manuallyCreateAccount(address, amount)
            let accountCopy: ShardusTypes.AccountsCopy = {
              cycleNumber: cycle.counter,
              accountId,
              data: wrappedEVMAccount,
              hash: wrappedEVMAccount.hash,
              isGlobal: false,
              timestamp: wrappedEVMAccount.timestamp
            }
            accountCopies.push(accountCopy)
            shardus.log(`node ${nodeId} SETUP GENESIS ACCOUNT: ${address}  amt: ${amount}`)
          }
          await shardus.debugCommitAccountCopies(accountCopies)
        }
        await sleep(ONE_SECOND * 10)

        const when = Date.now()
        const existingNetworkAccount = await shardus.getLocalOrRemoteAccount(networkAccount)
        if (existingNetworkAccount) {
          shardus.log('NETWORK_ACCOUNT ALREADY EXISTED: ', existingNetworkAccount)
          await sleep(ONE_SECOND * 5)
        } else {
          let value = {
              isInternalTx: true,
              internalTXType: InternalTXType.InitNetwork,
              timestamp: when,
              network: networkAccount,
          }
          //value = shardus.signAsNode(value)
          shardus.setGlobal(
            networkAccount,
            value,
            when,
            networkAccount,
          )

          // shardus.log(`node ${nodeId} GENERATED_A_NEW_NETWORK_ACCOUNT: `)
          // if(ShardeumFlags.SetupGenesisAccount) {
          //   for (let address in genesis) {
          //     let amount = new BN(genesis[address].wei)
          //     await manuallyCreateAccount(address, amount)
          //     shardus.log(`node ${nodeId} SETUP GENESIS ACCOUNT: ${address}  amt: ${amount}`)
          //   }
          // }
          // await sleep(ONE_SECOND * 10)
        }
      } else {
        while (!(await shardus.getLocalOrRemoteAccount(networkAccount))) {
          console.log('waiting..')
          await sleep(1000)
        }
      }
    }
  },
  validateTransaction(tx) {
    if (isInternalTx(tx)) {
      let internalTX = tx as InternalTx
      if(isInternalTXGlobal(internalTX) === true){
        return { result: 'pass', reason: 'valid' }
      } else if (tx.internalTXType === InternalTXType.ChangeConfig) {
        const devPublicKey = shardus.getDevPublicKey()
        if (devPublicKey) {
          let isValid = verify(tx, devPublicKey)
          console.log('isValid', isValid)
          if (isValid) return { result: 'pass', reason: 'valid' }
          else return { result: 'fail', reason: 'Invalid signature' }
        } else {
          return { result: 'fail', reason: 'Dev key is not defined on the server!' }
        }
      } else {
        //todo validate internal TX
        let isValid = crypto.verifyObj(internalTX)
        if(isValid) return { result: 'pass', reason: 'valid' }
        else return { result: 'fail', reason: 'Invalid signature' }
      }
    }

    if (isDebugTx(tx)) {
      let debugTx = tx as DebugTx
      //todo validate debug TX
      return { result: 'pass', reason: 'all_allowed' }
    }
    let txObj = getTransactionObj(tx)
    const response = {
      result: 'fail',
      reason: 'Transaction is not valid. Cannot get txObj.',
    }
    if (!txObj) return response

    if (!txObj.isSigned() || !txObj.validate()) {
      response.reason = 'Transaction is not signed or signature is not valid.'
      return response
    }

    try {
      let senderAddress = txObj.getSenderAddress()
      if (!senderAddress) {
        return {
          result: 'fail',
          reason: 'Cannot derive sender address from tx',
        }
      }
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Validation error', e)
      response.result = 'fail'
      response.reason = e
      return response
    }
    // TODO: more validation here

    response.result = 'pass'
    response.reason = 'all_allowed'

    return response
  },
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
    if (isInternalTx(tx)) {
      let internalTX = tx as InternalTx
      let success = false
      let reason = ''

      // validate internal TX
      if(isInternalTXGlobal(internalTX) === true){
        return {
          success: true,
          reason: '',
          txnTimestamp,
        }
      } else if (tx.internalTXType === InternalTXType.ChangeConfig) {
        try {
          const devPublicKey = shardus.getDevPublicKey()
          if (devPublicKey) {
            success = verify(tx, devPublicKey)
            if (!success)
              reason = 'Dev key does not match!'
          } else {
            success = false
            reason = 'Dev key is not defined on the server!'
          }
        } catch (e) {
          reason = 'Invalid signature for internal tx'
        }
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

      if (isSigned && isSignatureValid) {
        success = true
        reason = ''
      } else {
        reason = 'Transaction is not signed or signature is not valid'
      }

      if (ShardeumFlags.txNoncePreCheck && appData != null){
        if (txObj.nonce.toNumber() < appData.nonce) {
          success = false
          reason = 'Transaction has lower nonce than the account nonce in the network'
        }        
      }

    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('validate error', e)
      success = false
      reason = e.message
    }

    return {
      success,
      reason, txnTimestamp,
    }
  },
  async apply(timestampedTx, wrappedStates) {
    let { tx, timestampReceipt } = timestampedTx
    const txTimestamp = getInjectedOrGeneratedTimestamp(timestampedTx)
    // Validate the tx
    const { result, reason } = this.validateTransaction(tx)
    if (result !== 'pass') {
      throw new Error(`invalid transaction, reason: ${reason}. tx: ${JSON.stringify(tx)}`)
    }

    if (isInternalTx(tx)) {
      let internalTx = tx as InternalTx
      //todo validate internal TX

      return applyInternalTx(internalTx, wrappedStates, txTimestamp)
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
    if (ShardeumFlags.VerboseLogs) console.log('DBG', new Date(), 'attempting to apply tx', txId, ethTxId, tx)
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
      if (wrappedEVMAccount.accountType === AccountType.ContractCode) address = Address.fromString(wrappedEVMAccount.contractAddress)
      else address = Address.fromString(wrappedEVMAccount.ethAddress)

      if (ShardeumFlags.VerboseLogs) {
        let ourNodeShardData = shardus.stateManager.currentCycleShardData.nodeShardData
        let minP = ourNodeShardData.consensusStartPartition
        let maxP = ourNodeShardData.consensusEndPartition
        let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
        let { homePartition } = __ShardFunctions.addressToPartition(shardus.stateManager.currentCycleShardData.shardGlobals, shardusAddress)
        let accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false

        console.log('DBG', 'tx insert data', txId, `accountIsRemote: ${accountIsRemote} acc:${address} key:${wrappedEVMAccount.key} type:${wrappedEVMAccount.accountType}`)
      }

      if (wrappedEVMAccount.accountType === AccountType.Account) {
        shardeumState._transactionState.insertFirstAccountReads(address, wrappedEVMAccount.account)
      } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
        shardeumState._transactionState.insertFirstContractBytesReads(address, wrappedEVMAccount.codeByte)
      } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
        shardeumState._transactionState.insertFirstContractStorageReads(address, wrappedEVMAccount.key, wrappedEVMAccount.value)
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
      if(ShardeumFlags.VerboseLogs) console.log(`Block for tx ${ethTxId}`, blockForTx.header.number.toNumber())
      let runTxResult: RunTxResult
      let wrappedReceiptAccount : WrappedEVMAccount
      try {
        // if checkNonce is true, we're not gonna skip the nonce
        //@ts-ignore
        EVM.stateManager = null
        //@ts-ignore
        EVM.stateManager = shardeumState
        runTxResult = await EVM.runTx({ block: blockForTx, tx: transaction, skipNonce: !ShardeumFlags.CheckNonce })
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

            if (ShardeumFlags.VerboseLogs) console.log('Predicting contract account address:', caAddr, shardusAddr)

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
            gasUsed: '0x',
            contractAddress: caAddr,
            from: transaction.getSenderAddress().toString(),
            to: transaction.to ? transaction.to.toString() : null,
            value: transaction.value.toString('hex'),
            data: '0x',
            reason: e.toString()
          }
          wrappedReceiptAccount= {
            timestamp: txTimestamp,
            ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
            hash: '',
            // receipt: runTxResult.receipt,
            readableReceipt,
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

      if(ShardeumFlags.AppliedTxsMaps) {
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
      let { accounts: accountWrites, contractStorages: contractStorageWrites, contractBytes: contractBytesWrites } = shardeumState._transactionState.getWrittenAccounts()

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
            shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
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
            shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
          }
        }
      }

      if (ShardeumFlags.VerboseLogs) console.log('DBG: all account writes', shardeumState._transactionState.logAccountWrites(accountWrites))

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
          shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
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
        status: runTxResult.receipt["status"],
        transactionHash: ethTxId,
        transactionIndex: '0x1',
        blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
        nonce: transaction.nonce.toString('hex'),
        blockHash: readableBlocks[latestBlock].hash,
        cumulativeGasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
        gasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
        logs: logs,
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
        txId,
        accountType: AccountType.Receipt,
        txFrom: txSenderEvmAddr,
      }
      if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)
    }


      if(ShardeumFlags.EVMReceiptsAsAccounts){
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
        if (shardus.applyResponseAddChangedAccount != null) {
          shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
        }
      } else {
        const shardusWrappedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
        //put this in the apply response
        shardus.applyResponseAddReceiptData(applyResponse,shardusWrappedAccount, crypto.hashObj(shardusWrappedAccount))
        // this is to expose tx data for json rpc server
        appliedEVMReceipts.push({
          txId: ethTxId,
          injected: tx,
          receipt: shardusWrappedAccount,
        })
        if (appliedEVMReceipts.length > EVMReceiptsToKeep + 10) {
          let extra = appliedEVMReceipts.length - EVMReceiptsToKeep
          appliedEVMReceipts.splice(0, extra)
          if (ShardeumFlags.VerboseLogs) console.log('EVMReceipts Kept', appliedEVMReceipts.length)
        }
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
  getTimestampFromTransaction(tx) {
    return tx.timestamp ? tx.timestamp : 0
  },
  async txPreCrackData(timestampedTx, appData){
    if (ShardeumFlags.VerboseLogs) console.log('Running txPreCrackData')
    if(ShardeumFlags.UseTXPreCrack === false){
      return
    }
    let { tx, timestampReceipt } = timestampedTx
    if (isInternalTx(tx) === false && isDebugTx(tx) === false){
      const transaction = getTransactionObj(tx)
      if (transaction instanceof AccessListEIP2930Transaction && transaction.AccessListJSON){
        //do nothing if eip2930
      } else {
        //if the TX is a contract deploy, predict the new contract address correctly
        if (ShardeumFlags.txNoncePreCheck ||transaction.to == null){
          let foundNonce = false
          let foundSender = false
          let nonce = new BN(0)
          let txSenderEvmAddr = transaction.getSenderAddress().toString()
          let transformedSourceKey = toShardusAddress(txSenderEvmAddr, AccountType.Account)
          let remoteShardusAccount = await shardus.getLocalOrRemoteAccount(transformedSourceKey)
          if (remoteShardusAccount == undefined) {
            if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData: found no remote account for address: ${txSenderEvmAddr}, key: ${transformedSourceKey}. using nonce=0`)
          } else {
            foundSender = true
            let wrappedEVMAccount = remoteShardusAccount.data as WrappedEVMAccount
            if(wrappedEVMAccount && wrappedEVMAccount.account){
              fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
              nonce = wrappedEVMAccount.account.nonce
              foundNonce = true
            }
          }
          if (transaction.to == null) {
            let caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, nonce)
            let caAddr = '0x' + caAddrBuf.toString('hex')
            appData.newCAAddr = caAddr
            if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData found nonce:${foundNonce} found sender:${foundSender} for ${txSenderEvmAddr} nonce:${nonce.toString()} ca:${caAddr}`)
          }
          if (ShardeumFlags.txNoncePreCheck) {
            appData.nonce = parseInt(nonce.toString())
            if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData found nonce:${foundNonce} found sender:${foundSender} for ${txSenderEvmAddr} nonce:${nonce.toString()}`)
          }
        }
      }
    }
  },

  crack(timestampedTx, appData) {
    if (ShardeumFlags.VerboseLogs) console.log('Running getKeyFromTransaction', timestampedTx)
    let { tx, timestampReceipt } = timestampedTx

    if (ShardeumFlags.VerboseLogs) console.log('Running getKeyFromTransaction tx', tx)
    let timestamp: number = getInjectedOrGeneratedTimestamp(timestampedTx)
    if (ShardeumFlags.VerboseLogs) console.log('Running getKeyFromTransaction timestamp', timestamp)

    if (isInternalTx(tx)) {
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
        // keys.sourceKeys = [tx.from]
        keys.targetKeys = [networkAccount]
      } else if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
        keys.targetKeys = [networkAccount]
      }
      keys.allKeys = keys.allKeys.concat(keys.sourceKeys, keys.targetKeys, keys.storageKeys)
      // temporary hack for creating a receipt of node reward tx
      if (internalTx.internalTXType === InternalTXType.NodeReward) {
        if(ShardeumFlags.EVMReceiptsAsAccounts){
          const txId = crypto.hashObj(tx)
          keys.allKeys = keys.allKeys.concat([txId]) // For Node Reward Receipt
        }
      }
      if (ShardeumFlags.VerboseLogs) console.log('crack', { timestamp, keys, id: crypto.hashObj(tx) })
      return {
        timestamp,
        keys,
        id: crypto.hashObj(tx)
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
        id: crypto.hashObj(tx)
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
      if (transaction.to) {
        result.targetKeys.push(transformedTargetKey)
        shardusAddressToEVMAccountInfo.set(transformedTargetKey, {
          evmAddress: txToEvmAddr,
          type: AccountType.Account,
        })
      } else {

        if(ShardeumFlags.UseTXPreCrack === false){
          //This is a contract create!!
          //only will work with first deploy, since we do not have a way to get nonce that works with sharding
          let hack0Nonce = new BN(0)
          let caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, hack0Nonce)
          let caAddr = '0x' + caAddrBuf.toString('hex')
          let shardusAddr = toShardusAddress(caAddr, AccountType.Account)
          otherAccountKeys.push(shardusAddr)
          shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })
          if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Predicting new contract account address:', caAddr, shardusAddr)
        } else {
          //use app data!
          if(appData && appData.newCAAddr){
            let caAddr = appData.newCAAddr
            let shardusAddr = toShardusAddress(caAddr, AccountType.Account)
            otherAccountKeys.push(shardusAddr)
            shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })
            if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Appdata provided new contract account address:', caAddr, shardusAddr)
          }
        }
      }

      if (transaction instanceof AccessListEIP2930Transaction && transaction.AccessListJSON) {
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
      }

      // make sure the receipt address is in the get keys from transaction..
      // This will technically cause an empty account to get created but this will get overriden with the
      // correct values as a result of apply().  There are several ways we could optimize this in the future
      // If a transactions knows a key is for an account that will be created than it does not need to attempt to aquire and share the data
      let additionalAccounts = []
      if(ShardeumFlags.EVMReceiptsAsAccounts){
        const txHash = bufferToHex(transaction.hash())
        const shardusReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
        if (ShardeumFlags.VerboseLogs) console.log(`getKeyFromTransaction: adding tx receipt key: ${shardusReceiptAddress} ts:${tx.timestamp}`)
        additionalAccounts.push(shardusReceiptAddress)
      }

      // insert target keys first. first key in allkeys list will define the execution shard
      // for smart contract calls the contract will be the target.  For simple coin transfers it wont matter
      // insert otherAccountKeys second, because we need the CA addres at the front of the list for contract deploy
      // There wont be a target key in when we deploy a contract
      result.allKeys = result.allKeys.concat(result.targetKeys, otherAccountKeys, result.sourceKeys, result.storageKeys, additionalAccounts)
      if (ShardeumFlags.VerboseLogs) console.log('running getKeyFromTransaction', result)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Unable to get keys from tx', e)
    }
    return {
      keys: result,
      timestamp,
      id: crypto.hashObj(tx)
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
    // update our in memory accounts map
    for (const account of accountRecords) {
      let wrappedEVMAccount = account as WrappedEVMAccount

      let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)

      if (wrappedEVMAccount.accountType !== AccountType.NetworkAccount && wrappedEVMAccount.accountType !== AccountType.NodeAccount && wrappedEVMAccount.accountType !== AccountType.NodeRewardReceipt)
        WrappedEVMAccountFunctions.fixDeserializedWrappedEVMAccount(wrappedEVMAccount)

      //accounts[shardusAddress] = wrappedEVMAccount
      await AccountsStorage.setAccount(shardusAddress, wrappedEVMAccount)
    }

    //Is this ok
    let shardeumState = getCallTXState('setAccountData', 'setAccountData' )

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
          if (ShardeumFlags.VerboseLogs) console.log(`contractAccount not found for ${wrappedEVMAccount.ethAddress} / ${shardusAddress} `)
          //continue
        }
        if (contractAccount && contractAccount.account == null) {
          //todo queue this somehow
          //throw Error(`contractAccount.account not found for ${wrappedEVMAccount.ethAddress} / ${shardusAddress} ${JSON.stringify(contractAccount)} `)
          if (ShardeumFlags.VerboseLogs)
            console.log(`contractAccount.account not found for ${wrappedEVMAccount.ethAddress} / ${shardusAddress} ${JSON.stringify(contractAccount)} `)
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
  async getRelevantData(accountId, timestampedTx) {
    if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', accountId, timestampedTx)
    let { tx, timestampReceipt } = timestampedTx
    if (isInternalTx(tx)) {
      let internalTx = tx as InternalTx

      let accountCreated = false
      //let wrappedEVMAccount = accounts[accountId]
      let wrappedEVMAccount = await AccountsStorage.getAccount(accountId)

      if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
        if (wrappedEVMAccount === null) {
          accountCreated = true
        }
        if (internalTx.accountData) {
          wrappedEVMAccount = internalTx.accountData
        }
      }
      if (internalTx.internalTXType === InternalTXType.InitNetwork) {
        if (!wrappedEVMAccount) {
          if (accountId === networkAccount) {
            wrappedEVMAccount = createNetworkAccount(accountId, tx.timestamp) as any
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
          } else if (accountId === crypto.hashObj(tx)) { // For Node Reward Receipt; This needs to evaluate whether it's good or can have issue
            wrappedEVMAccount = {
              timestamp: 0,
              ethAddress: accountId,
              hash: '',
              accountType: AccountType.NodeRewardReceipt
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
      if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
        // Not sure if this is even relevant.  I think the from account should be one of our dev accounts and
        // and should already exist (hit the faucet)
        // probably an array of dev public keys

        if (!wrappedEVMAccount) {
          //if the network account does not exist then throw an error
          // This is the 0000x00000 account
          if (accountId === networkAccount){
            throw Error(`Network Account is not found ${accountId}`)
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
      if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
        if (!wrappedEVMAccount) {
          throw Error(`Network Account is not found ${accountId}`)
        }
      }
      if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', wrappedEVMAccount)
      return shardus.createWrappedResponse(accountId, accountCreated, wrappedEVMAccount.hash, wrappedEVMAccount.timestamp, wrappedEVMAccount)
    }
    if (isDebugTx(tx)) {
      let debugTx = tx as DebugTx
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

      return shardus.createWrappedResponse(accountId, accountCreated, wrappedEVMAccount.hash, wrappedEVMAccount.timestamp, wrappedEVMAccount)
    }

    if (!tx.raw) throw new Error('getRelevantData: No raw tx')

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
    if (typeof wrappedEVMAccount === 'undefined' || wrappedEVMAccount === null) {
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
      } else if (accountType === AccountType.ContractStorage) {
        wrappedEVMAccount = {
          timestamp: 0,
          key: evmAccountID,
          value: Buffer.from([]),
          ethAddress: evmAccountInfo.contractAddress, // storage key
          hash: '',
          accountType: AccountType.ContractStorage,
        }
        if (ShardeumFlags.VerboseLogs) console.log(`Creating new contract storage account key:${evmAccountID} in contract address ${wrappedEVMAccount.ethAddress}`)
      } else {
        throw new Error(`getRelevantData: invalid accoun type ${accountType}`)
      }
      WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
      // accounts[accountId] = wrappedEVMAccount //getRelevantData must never modify accounts[]
      accountCreated = true
    }
    if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', wrappedEVMAccount)
    // Wrap it for Shardus
    return shardus.createWrappedResponse(accountId, accountCreated, wrappedEVMAccount.hash, wrappedEVMAccount.timestamp, wrappedEVMAccount) //readableAccount)
  },
  async getAccountData(accountStart, accountEnd, maxRecords): Promise<ShardusTypes.WrappedData[]> {
    const results = []
    const start = parseInt(accountStart, 16)
    const end = parseInt(accountEnd, 16)

    if(ShardeumFlags.UseDBForAccounts === true){
      //direct DB query
      let wrappedResults = []
      let dbResults = await AccountsStorage.queryAccountsEntryByRanges(accountStart, accountEnd, maxRecords)

      for(let wrappedEVMAccount of dbResults){
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

    if (updatedEVMAccount.accountType === AccountType.Debug) {
      // Update hash
      updateEthAccountHash(updatedEVMAccount)
      const hashBefore = updatedEVMAccount.hash
      //accounts[accountId] = updatedEVMAccount
      await AccountsStorage.setAccount(accountId, updatedEVMAccount)
      shardus.applyResponseAddState(
        applyResponse,
        updatedEVMAccount,
        updatedEVMAccount,
        accountId,
        applyResponse.txId,
        applyResponse.txTimestamp,
        hashBefore,
        updatedEVMAccount.hash,
        accountCreated
      )
      return
    }
    if (
      updatedEVMAccount.accountType === AccountType.NetworkAccount ||
      updatedEVMAccount.accountType === AccountType.NodeAccount ||
      updatedEVMAccount.accountType === AccountType.NodeRewardReceipt
    ) {
      // Update hash
      const hashBefore = updatedEVMAccount.hash
      updateEthAccountHash(updatedEVMAccount) // This will get the hash of its relevant account type
      const hashAfter = updatedEVMAccount.hash
      //accounts[accountId] = updatedEVMAccount
      await AccountsStorage.setAccount(accountId, updatedEVMAccount)
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
      if (ShardeumFlags.VerboseLogs) console.log('updatedEVMAccount after hashUpdate', updatedEVMAccount)
      return
    }

    //fix any issues from seralization
    fixDeserializedWrappedEVMAccount(updatedEVMAccount)

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

    let shardeumState = getApplyTXState(txId)

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
      let addressStr = updatedEVMAccount.ethAddress
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

    // Save updatedAccount to db / persistent storage
    //accounts[accountId] = updatedEVMAccount
    await AccountsStorage.setAccount(accountId, updatedEVMAccount)

    if(ShardeumFlags.AppliedTxsMaps) {
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
  async getAccountDataByRange(accountStart, accountEnd, tsStart, tsEnd, maxRecords, offset=0, accountOffset=""): Promise<ShardusTypes.WrappedData[]> {
    const results:WrappedEVMAccount[] = []
    const start = parseInt(accountStart, 16)
    const end = parseInt(accountEnd, 16)

    const finalResults:ShardusTypes.WrappedData[] = []

    if(ShardeumFlags.UseDBForAccounts === true){
      //direct DB query
      let dbResults = await AccountsStorage.queryAccountsEntryByRanges2(accountStart, accountEnd, tsStart, tsEnd, maxRecords, offset, accountOffset)

      for(let wrappedEVMAccount of dbResults){
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

    if(results.length > 0) {
      lastTS = results[0].timestamp
      //start at offset!
      for(let i=offset; i<results.length; i++ ){
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
        if(count > maxRecords){
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


    shardus.log(`getAccountDataByRange: extra:${extra} ${JSON.stringify({accountStart, accountEnd, tsStart, tsEnd, maxRecords, offset})}`);

    for(let wrappedEVMAccount of cappedResults){
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
  async deleteAccountData(addressList) {

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
        hash: account.stateId
      }
    }
    return {
      timestamp: 0,
      hash: 'invalid account data',
    }
  },
  transactionReceiptPass(tx: any, wrappedStates: { [id: string]: WrappedAccount }, applyResponse: ShardusTypes.ApplyResponse) {
    let txId: string
    if (!tx.sign) {
      txId = crypto.hashObj(tx)
    } else {
      txId = crypto.hashObj(tx, true) // compute from tx
    }
    _transactionReceiptPass(tx, txId, wrappedStates, applyResponse)

    //clear this out of the shardeum state map
    if(shardeumStateTXMap.has(txId)){
      shardeumStateTXMap.delete(txId)
    }

  },
  getJoinData() {
    const joinData = {
      version
    }
    return joinData
  },
  validateJoinRequest(data: any) {
    if (!data.appJoinData) {
      return { success: false, reason: `Join request node doesn't provide the app join data.` }
    }
    if (!isEqualOrNewerVersion(version, data.appJoinData.version)) {
      return { success: false, reason: `version number is old. Our app version is ${version}. Join request node app version is ${data.appJoinData.version}` }
    }
    return {
      success: true
    }
  }
})

shardus.registerExceptionHandler()


function periodicMemoryCleanup(){
  let keys = shardeumStateTXMap.keys()
  //todo any provisions needed for TXs that can hop and extend the timer
  let maxAge = Date.now() - 60000
  for(let key of keys){
    let shardeumState = shardeumStateTXMap.get(key)
    if(shardeumState._transactionState.createdTimestamp < maxAge){
      shardeumStateTXMap.delete(key)
    }
  }
  setTimeout(periodicMemoryCleanup, 60000)
}

setTimeout(periodicMemoryCleanup, 60000)

if (ShardeumFlags.GlobalNetworkAccount) {
  // CODE THAT GETS EXECUTED WHEN NODES START
  ; (async (): Promise<void> => {
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
        if (latestCycles != null && latestCycles.length > 0 && latestCycles[0].counter < ShardeumFlags.FirstNodeRewardCycle) {
          shardus.log(`Too early for node reward: ${latestCycles[0].counter}.  first reward:${ShardeumFlags.FirstNodeRewardCycle}`)
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
          const nextUpdateTimestamp = currentCycleStart + (nextUpdateQuarter * blockProductionRateInSeconds)
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

        return setTimeout(networkMaintenance, cycleInterval)
      },
    )
  })()
} else {
  shardus.start()
}
