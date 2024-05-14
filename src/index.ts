/* eslint-disable @typescript-eslint/ban-ts-comment */
import { exec } from 'child_process'
import { arch, cpus, freemem, totalmem, platform } from 'os'
import { cryptoStringify, stringify } from './utils/stringify'
import {
  Account,
  Address,
  bytesToHex,
  bigIntToHex,
  isHexPrefixed,
  //fromAscii,
  isValidAddress,
  toAscii,
  toBytes,
  hexToBytes,
  isHexString,
} from '@ethereumjs/util'
import {
  AccessListEIP2930Transaction,
  LegacyTransaction,
  LegacyTxData,
  Transaction,
  TransactionFactory,
  TransactionType,
} from '@ethereumjs/tx'
import { Common, Hardfork } from '@ethereumjs/common'
import { RunTxResult } from './vm_v7'
// import { EVM as EthereumVirtualMachine, getActivePrecompiles } from '@ethereumjs/evm'
import { EVM as EthereumVirtualMachine } from './evm_v2'
import { EVMResult } from './evm_v2/types'
import got, { Response as GotResponse } from 'got'
import 'dotenv/config'
import { ShardeumState, TransactionState } from './state'
import {
  __ShardFunctions,
  nestedCountersInstance,
  ShardusTypes,
  DebugComplete,
  Shardus,
  DevSecurityLevel,
} from '@shardus/core'
import { ContractByteWrite, WarmupStats } from './state/transactionState'
import { version, devDependencies } from '../package.json'
import {
  AccountType,
  AppJoinData,
  BlockMap,
  ClaimRewardTX,
  DebugTx,
  DebugTXType,
  //DevSecurityLevel,
  //DevAccount,
  EVMAccountInfo,
  InitRewardTimes,
  InternalTx,
  InternalTXType,
  isNodeAccount2,
  LeftNetworkEarlyViolationData,
  NetworkAccount,
  NodeAccount2,
  NodeInfoAppData,
  NodeRefutedViolationData,
  OperatorAccountInfo,
  OurAppDefinedData,
  PenaltyTX,
  ReadableReceipt,
  SetCertTime,
  ShardeumBlockOverride,
  StakeCoinsTX,
  StakeInfo,
  SyncingTimeoutViolationData,
  UnstakeCoinsTX,
  WrappedAccount,
  WrappedEVMAccount,
  WrappedStates,
} from './shardeum/shardeumTypes'
import { getAccountShardusAddress, toShardusAddress, toShardusAddressWithKey } from './shardeum/evmAddress'
import { FilePaths, ShardeumFlags, updateServicePoints, updateShardeumFlag } from './shardeum/shardeumFlags'
import * as WrappedEVMAccountFunctions from './shardeum/wrappedEVMAccountFunctions'
import {
  fixDeserializedWrappedEVMAccount,
  predictContractAddressDirect,
} from './shardeum/wrappedEVMAccountFunctions'
import {
  emptyCodeHash,
  isEqualOrNewerVersion,
  replacer,
  SerializeToJsonString,
  fixBigIntLiteralsToBigInt,
  sleep,
  zeroAddressStr,
  _base16BNParser,
  _readableSHM,
  scaleByStabilityFactor,
  isEqualOrOlderVersion,
  debug_map_replacer,
  operatorCLIVersion,
  operatorGUIVersion,
  readOperatorVersions,
  formatErrorMessage,
  calculateGasPrice,
  getRandom,
  findMajorityResult,
  generateTxId,
  isWithinRange,
  isValidVersion,
  getTxSenderAddress,
  isInSenderCache,
  removeTxFromSenderCache,
  DeSerializeFromJsonString, isStakingEVMTx,
} from './utils'
import config, { Config } from './config'
import Wallet from 'ethereumjs-wallet'
import { Block } from '@ethereumjs/block'
import { ShardeumBlock } from './block/blockchain'
import * as AccountsStorage from './storage/accountStorage'
import { sync, validateTransaction, validateTxnFields } from './setup'
import { applySetCertTimeTx, injectSetCertTimeTx, getCertCycleDuration } from './tx/setCertTime'
import { applyClaimRewardTx, injectClaimRewardTxWithRetry } from './tx/claimReward'
import { Request, Response } from 'express'
import {
  CertSignaturesResult,
  InjectTxToConsensor,
  queryCertificate,
  queryCertificateHandler,
  RemoveNodeCert,
  StakeCert,
  ValidatorError,
} from './handlers/queryCertificate'
import * as InitRewardTimesTx from './tx/initRewardTimes'
import * as PenaltyTx from './tx/penalty/transaction'
import { isDebugTx, isInternalTx, crypto, getInjectedOrGeneratedTimestamp } from './setup/helpers'
import { onActiveVersionChange } from './versioning'
import { shardusFactory } from '@shardus/core'
import { unsafeGetClientIp } from './utils/requests'
import { initialNetworkParamters } from './shardeum/initialNetworkParameters'
import { oneSHM, networkAccount, ONE_SECOND } from './shardeum/shardeumConstants'
import { applyPenaltyTX, clearOldPenaltyTxs } from './tx/penalty/transaction'
import { getFinalArchiverList, setupArchiverDiscovery } from '@shardus/archiver-discovery'
import { Archiver } from '@shardus/archiver-discovery/dist/src/types'
import axios from 'axios'
//import blockedAt from 'blocked-at'
//import { v4 as uuidv4 } from 'uuid'
import { RunState } from './evm_v2/interpreter'
import { VM } from './vm_v7/vm'
import rfdc = require('rfdc')
import { AdminCert, PutAdminCertResult, putAdminCertificateHandler } from './handlers/adminCertificate'
import { P2P } from '@shardus/types'
import { getExternalApiMiddleware } from './middleware/externalApiMiddleware'
import { AccountsEntry } from './storage/storage'
import { getCachedRIAccount, setCachedRIAccount } from './storage/riAccountsCache'
import { isLowStake } from './tx/penalty/penaltyFunctions'
import { accountDeserializer, accountSerializer } from './types/Helpers'
import { runWithContextAsync } from './utils/RequestContext'

let latestBlock = 0
export const blocks: BlockMap = {}
export const blocksByHash: { [hash: string]: number } = {}
export const readableBlocks: { [blockNumber: number | string]: ShardeumBlockOverride } = {}

//Cache network account
let cachedNetworkAccount = null
let cacheExpirationTimestamp = 0

export let genesisAccounts: string[] = []

// Two global variables: at the top of utils/versions.ts
// Where to call this function: After shradus factory line 146 console.logs ke pehle
// Add a console log to log out to fetched versions
// “getNodeInfoAppData()”

const ERC20_BALANCEOF_CODE = '0x70a08231'

let shardus: Shardus
let profilerInstance

//   next shardus core will export the correct type
export let logFlags = {
  verbose: false,
  dapp_verbose: false,
  error: true,
  fatal: true,
  important_as_error: true,
  important_as_fatal: true,
  shardedCache: false,
  aalg: false,
}

// Read the CLI and GUI versions and save them in memory
readOperatorVersions()

console.log('Shardeum validator started')
console.log('Shardeum Flags:')
console.log(JSON.stringify(ShardeumFlags, null, 2))
console.log(`Operator CLI version: ${operatorCLIVersion}`)
console.log(`Operator GUI version: ${operatorGUIVersion}`)

// const pay_address = '0x50F6D9E5771361Ec8b95D6cfb8aC186342B70120' // testing account for node_reward
const random_wallet = Wallet.generate()
const pay_address = random_wallet.getAddressString()
//TODO need to put a task in to remove the old node rewards
console.log('old Pay Address (not for new staking/rewards) ', pay_address, isValidAddress(pay_address))

//console.log('Pk',random_wallet.getPublicKey())
//console.log('pk',random_wallet.getPrivateKey())

let lastCertTimeTxTimestamp = 0
let lastCertTimeTxCycle: number | null = null

export let stakeCert: StakeCert = null

export let adminCert: AdminCert = null

const uuidCounter = 1

function isDebugMode(): boolean {
  return config.server.mode === 'debug'
}

export function isServiceMode(): boolean {
  return ShardeumFlags.startInServiceMode === true
}

export function isArchiverMode(): boolean {
  return ShardeumFlags.startInArchiveMode === true && isServiceMode()
}

export function shouldLoadNetworkConfigToNetworkAccount(isFirstSeed: boolean): boolean {
  return ShardeumFlags.loadGenesisNodeNetworkConfigToNetworkAccount === true && isFirstSeed === true
}

// grab this
const pointsAverageInterval = 2 // seconds

const servicePointSpendHistory: { points: number; ts: number }[] = []
let debugLastTotalServicePoints = 0

//debug map of map. The outer key is the service point type, the inner key is the request ip, the value is the number of points spent
const debugServicePointSpendersByType: Map<string, Map<string, number>> = new Map()
//debug map of service point types and the number of points spent
const debugServicePointsByType: Map<string, number> = new Map()
//total number of service points spent, since we last cleared or started the capturing data
let debugTotalServicePointRequests = 0

//latest value from isReadyToJoin function call
let isReadyToJoinLatestValue = false
//used only for when the nework is...
let mustUseAdminCert = false

/**
 * Allows us to attempt to spend points.  We have ShardeumFlags.ServicePointsPerSecond
 * that can be spent as a total bucket
 * @param points
 * @returns
 */
function trySpendServicePoints(points: number, req, key: string): boolean {
  if (isServiceMode()) return true
  const nowTs = shardeumGetTime()
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

  if (ShardeumFlags.logServicePointSenders) {
    let requestIP = 'null-req'
    if (req != null) {
      requestIP = unsafeGetClientIp(req) || 'cant-get-ip'
    }

    let serviePointSpenders: Map<string, number> = debugServicePointSpendersByType.get(key)
    if (!serviePointSpenders) {
      serviePointSpenders = new Map()
      debugServicePointSpendersByType.set(key, serviePointSpenders)
    }
    if (serviePointSpenders.has(requestIP) === false) {
      serviePointSpenders.set(requestIP, points)
    } else {
      const currentPoints = serviePointSpenders.get(requestIP)
      serviePointSpenders.set(requestIP, currentPoints + points)
    }
    debugTotalServicePointRequests += points

    //upate debugServiePointByType
    if (debugServicePointsByType.has(key) === false) {
      debugServicePointsByType.set(key, points)
    } else {
      const currentPoints = debugServicePointsByType.get(key)
      debugServicePointsByType.set(key, currentPoints + points)
    }
  }

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

function pruneOldBlocks(): void {
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
          /* prettier-ignore */ if (logFlags.error) console.log('Error: pruneOldBlocks', e)
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
  defaultBlock.number = bigIntToHex(block.header.number)
  defaultBlock.timestamp = bigIntToHex(block.header.timestamp)
  defaultBlock.hash = bytesToHex(block.header.hash())
  const previousBlockNumber = String(block.header.number - BigInt(1))
  const previousBlock = readableBlocks[previousBlockNumber] // eslint-disable-line security/detect-object-injection
  if (previousBlock) defaultBlock.parentHash = previousBlock.hash
  // Todo: The Block type is being effectively overridden here. Ideally this should be a type of it's own in the
  //  future.
  return defaultBlock as unknown as ShardeumBlockOverride
}

function createAndRecordBlock(blockNumber: number, timestamp: number): Block {
  /* eslint-disable security/detect-object-injection */
  if (blocks[blockNumber]) return blocks[blockNumber]
  if (!blocks[blockNumber]) {
    const block = createBlock(timestamp, blockNumber)
    const readableBlock = convertToReadableBlock(block)
    blocks[blockNumber] = block
    readableBlocks[blockNumber] = readableBlock
    blocksByHash[readableBlock.hash] = blockNumber
    latestBlock = blockNumber
    return block
  }
  /* eslint-enable security/detect-object-injection */
}

function createBlock(timestamp: number, blockNumber: number): Block {
  const timestampInSecond = timestamp ? Math.round(timestamp / 1000) : Math.round(shardeumGetTime() / 1000)
  const blockData = {
    header: { number: blockNumber, timestamp: timestampInSecond },
    transactions: [],
    uncleHeaders: [],
  }
  const block = Block.fromBlockData(blockData, { common: evmCommon })
  return block
}

export function setGenesisAccounts(accounts = []): void {
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
  AccountsStorage.init(config.server.baseDir, `${FilePaths.SHARDEUM_DB}`)
  if (isServiceMode()) AccountsStorage.lazyInit()
}

//let accounts: WrappedEVMAccountMap = {} //relocated

//may need these later.  if so, move to DB
const appliedTxs = {} //this appears to be unused. will it still be unused if we use receipts as app data
const shardusTxIdToEthTxId = {} //this appears to only support appliedTxs

//In debug mode the default value is 100 SHM.  This is needed for certain load test operations
const defaultBalance = isDebugMode() ? oneSHM * BigInt(100) : BigInt(0)

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

/** This map is bad and needs to be phased out in favor of data we use in app data */
let shardusAddressToEVMAccountInfo: Map<string, EVMAccountInfo>
export let evmCommon

let debugAppdata: Map<string, unknown>

//todo refactor some object init into here
async function initEVMSingletons(): Promise<void> {
  const chainIDBN = BigInt(ShardeumFlags.ChainID)

  // setting up only to 'istanbul' hardfork for now
  // https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/common/src/chains/mainnet.json
  evmCommon = new Common({ chain: 'mainnet', hardfork: Hardfork.Istanbul, eips: [3855] })

  //hack override this function.  perhaps a nice thing would be to use forCustomChain to create a custom common object
  evmCommon.chainId = (): bigint => {
    return BigInt(chainIDBN.toString(10))
  }

  //let shardeumStateManager = new ShardeumState({ common }) //as StateManager

  shardeumBlock = new ShardeumBlock({ common: evmCommon })

  //let EVM = new VM({ common, stateManager: shardeumStateManager, blockchain: shardeumBlock })

  if (ShardeumFlags.useShardeumVM) {
    const customEVM = new EthereumVirtualMachine({
      common: evmCommon,
      stateManager: undefined,
    })
    EVM = await VM.create({
      common: evmCommon,
      stateManager: undefined,
      evm: customEVM,
      // blockchain: shardeumBlock,
    })
  } else {
    // EVM = VM.create({ common: evmCommon, stateManager: undefined, blockchain: shardeumBlock })
  }

  // console.log('EVM_common', stringify(EVM.common, null, 4))

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
 * Ensures that a specific account is marked as involved in the current transaction within the shardus.
 * The function checks if the account is already considered by the transaction's queue entry.
 * If not, it attempts to mark the account as involved. If the account has a newer cache timestamp than the transaction,
 * indicating state changes after the transaction was initiated, the function will halt execution by returning false,
 * signaling that the transaction must fail. See `shardus.checkAccountTimestamps`
 * @param transactionState The state object of the current transaction.
 * @param address The blockchain address of the account.
 * @param isRead A flag indicating if the operation is a read operation.
 * @returns A boolean indicating if the account could be successfully involved without causing a transaction failure.
 */
function accountInvolved(transactionState: TransactionState, address: string, isRead: boolean): boolean {
  // TODO: Shard Hopping for transaction continuity
  //  Before inserting this transaction (tx) into the queue of a consensus group for an additional key,
  //  verify no conflicting transactions exist for that key. We use `tryInvolveAccount` to check the target shard's
  //  queue for any related transactions. Proceed with insertion only if no conflicts are detected.
  const txID = transactionState.linkedTX

  if (shardus.tryInvolveAccount != null) {
    const shardusAddress = toShardusAddress(address, AccountType.Account)

    const success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
    if (success === false) {
      // Indicates the transaction must fail due to state inconsistencies.
      return false
    }
  }
  return true
}

/**
 * Similar to `accountInvolved`, but specifically for contract storage keys. This function ensures
 * a storage key within a contract is marked as involved in the current transaction.
 * The function attempts to involve a contract storage key in the transaction's queue entry. If the storage
 * key has a newer cache timestamp than the transaction, indicating state changes after the transaction's initiation,
 * the function will halt execution by returning false, signaling that the transaction must fail. See `shardus.checkAccountTimestamps`
 * @param transactionState The state object of the current transaction.
 * @param address The blockchain address of the contract.
 * @param key The specific key within the contract's storage to check.
 * @param isRead A flag indicating if the operation is a read operation.
 * @returns A boolean indicating if the contract storage key could be successfully involved without causing a transaction failure.
 */
function contractStorageInvolved(
  transactionState: TransactionState,
  address: string,
  key: string,
  isRead: boolean
): boolean {
  // TODO: Shard Hopping for transaction continuity
  //  Before inserting this transaction (tx) into the queue of a consensus group for an additional key,
  //  verify no conflicting transactions exist for that key. We use `tryInvolveAccount` to check the target shard's
  //  queue for any related transactions. Proceed with insertion only if no conflicts are detected.
  const txID = transactionState.linkedTX

  if (shardus.tryInvolveAccount != null) {
    const shardusAddress = toShardusAddressWithKey(address, key, AccountType.ContractStorage)

    const success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
    if (success === false) {
      // Indicates the transaction must fail due to state inconsistencies
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

function monitorEventCBNoOp(): void {
  // no op
}

/**
 * tryGetRemoteAccountCB
 * used by ethCall
 * also used by AALG process
 *    AALG with warmup tech can use the warmupCache for faster results
 * @param transactionState
 * @param type
 * @param address
 * @param key
 * @returns
 */
async function tryGetRemoteAccountCB(
  transactionState: TransactionState,
  type: AccountType,
  address: string,
  key: string
): Promise<WrappedEVMAccount> {
  let retry = 0
  let maxRetry = 1 // default for contract storage accounts
  if (type === AccountType.Account) maxRetry = 2 // for CA accounts
  else if (type === AccountType.ContractCode && key != emptyCodeHash) maxRetry = 3 // for codebytes

  const shardusAddress = toShardusAddressWithKey(address, key, type)
  let remoteShardusAccount

  const txid = transactionState.linkedTX
  //utilize warm up cache that lives on a TransactionState object
  if (transactionState?.warmupCache != null) {
    if (transactionState.warmupCache.has(shardusAddress)) {
      const fixedEVMAccount = transactionState.warmupCache.get(shardusAddress)
      if (fixedEVMAccount != null) {
        fixDeserializedWrappedEVMAccount(fixedEVMAccount)
        nestedCountersInstance.countEvent('aalg-warmup', 'cache hit')
        /* prettier-ignore */ if(logFlags.aalg) console.log('aalg: aalg-hit', txid, shardusAddress, address, key, type)
        transactionState.warmupStats.cacheHit++
        return fixedEVMAccount
      }
      if (fixedEVMAccount === null) {
        nestedCountersInstance.countEvent('aalg-warmup', 'cache slot empty')
        transactionState.warmupStats.cacheEmpty++
        /* prettier-ignore */ if(logFlags.aalg) console.log('aalg: aalg-empty', txid, shardusAddress, address, key, type)
      }
      if (fixedEVMAccount === undefined) {
        nestedCountersInstance.countEvent('aalg-warmup', 'cache slot empty-reqmiss')
        transactionState.warmupStats.cacheEmptyReqMiss++
        /* prettier-ignore */ if(logFlags.aalg) console.log('aalg: aalg-empty-reqmiss', txid, shardusAddress, address, key, type)
      }
    } else {
      nestedCountersInstance.countEvent('aalg-warmup', 'cache miss')
      transactionState.warmupStats.cacheMiss++
      /* prettier-ignore */ if(logFlags.aalg) console.log('aalg: aalg-miss', txid, shardusAddress, address, key, type)
    }
  }

  while (retry < maxRetry && remoteShardusAccount == null) {
    //getLocalOrRemoteAccount can throw if the remote node gives us issues
    //we want to catch these and retry
    try {
      /* prettier-ignore */ if(logFlags.aalg || ShardeumFlags.VerboseLogs) console.log(`${Date.now()} Trying to get remote account for address: ${address}, type: ${type}, key: ${key} retry: ${retry}`)
      retry++
      remoteShardusAccount = await shardus.getLocalOrRemoteAccount(shardusAddress, {
        useRICache: true,
        canThrowException: true,
      })
    } catch (ex) {
      continue
    }
    //if this is true we will trust a null response and let it be the value of the account
    //with this flag true it means we will trust that we see a null account an not an error
    if (ShardeumFlags.tryGetRemoteAccountCB_OnlyErrorsLoop && remoteShardusAccount == null) {
      //lets accept the null, because it may be an actually empty account that is not created yet.
      break
    }
  }

  if (remoteShardusAccount == undefined) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs || logFlags.aalg) console.log(`${Date.now()} Found no remote account for address: ${address}, type: ${type}, key: ${key}, retry: ${retry}`)
    if (type === AccountType.Account || type === AccountType.ContractCode) {
      /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum', `tryRemoteAccountCB: fail. type: ${type}, address: ${address}, key: ${key}` )
    }
    //this could be new account
    return undefined
  }
  const fixedEVMAccount = remoteShardusAccount.data as WrappedEVMAccount
  fixDeserializedWrappedEVMAccount(fixedEVMAccount)
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs || logFlags.aalg) console.log(`${Date.now()} Successfully found remote account for address: ${address}, type: ${type}, key: ${key}, retry: ${retry}`, fixedEVMAccount)
  return fixedEVMAccount
}

function getStakeTxBlobFromEVMTx(
  transaction: Transaction[TransactionType.Legacy] | Transaction[TransactionType.AccessListEIP2930]
): unknown {
  const stakeTxString = toAscii(bytesToHex(transaction.data))
  /* prettier-ignore */ if (logFlags.verbose) console.log(`stakeTxString`, stakeTxString)
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
  stateManager: ShardeumState,
  balance: bigint = defaultBalance
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

function getTransactionObj(
  tx
): Transaction[TransactionType.Legacy] | Transaction[TransactionType.AccessListEIP2930] {
  if (!tx.raw) throw Error('fail')
  let transactionObj
  const serializedInput = toBytes(tx.raw)
  try {
    transactionObj = TransactionFactory.fromSerializedData<TransactionType.Legacy>(serializedInput)
  } catch (e) {
    // if (ShardeumFlags.VerboseLogs) console.log('Unable to get legacy transaction obj', e)
  }
  if (!transactionObj) {
    try {
      transactionObj =
        TransactionFactory.fromSerializedData<TransactionType.AccessListEIP2930>(serializedInput)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Unable to get transaction obj', e)
    }
  }

  if (transactionObj) {
    return transactionObj
  } else throw Error('tx obj fail')
}

async function getReadableAccountInfo(account: WrappedEVMAccount): Promise<{
  nonce: string
  balance: string
  storageRoot: string
  codeHash: string
  operatorAccountInfo: unknown
}> {
  try {
    //todo this code needs additional support for account type contract storage or contract code
    return {
      nonce: account.account.nonce.toString(),
      balance: account.account.balance.toString(),
      storageRoot: bytesToHex(account.account.storageRoot),
      codeHash: bytesToHex(account.account.codeHash),
      operatorAccountInfo: account.operatorAccountInfo
        ? JSON.parse(stringify(account.operatorAccountInfo))
        : null,
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
    if (ShardeumFlags.VerboseLogs) console.log('Creating a new apply tx ShardeumState for ', txId)
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
  } else {
    if (ShardeumFlags.VerboseLogs) console.log(`Reusing apply tx ShardeumState for txId: ${txId}`)
  }
  return shardeumState
}

function _containsProtocol(url: string): boolean {
  if (!url.match('https?://*')) return false
  return true
}

function _normalizeUrl(url: string): string {
  let normalized = url
  if (!_containsProtocol(url)) normalized = 'http://' + url
  return normalized
}

async function _internalHackPostWithResp(url: string, body): Promise<GotResponse<any>> {
  const normalized = _normalizeUrl(url)

  try {
    const res = await got.post(normalized, {
      timeout: {
        request: ShardeumFlags.shardeumTimeout,
      },
      retry: 0,
      throwHttpErrors: false,
      responseType: 'json',
      json: body,
    })

    return res
  } catch (e) {
    return null
  }
}

function logAccessList(message: string, appData): void {
  if (appData != null && appData.accessList != null) {
    if (ShardeumFlags.VerboseLogs) console.log(`access list for ${message} ${stringify(appData.accessList)}`)
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
const configShardusEndpoints = (): void => {
  const debugMiddleware = shardus.getDebugModeMiddleware()
  const debugMiddlewareLow = shardus.getDebugModeMiddlewareLow()
  const debugMiddlewareMedium = shardus.getDebugModeMiddlewareMedium()
  //const debugMiddlewareHigh = shardus.getDebugModeMiddlewareHigh()
  const externalApiMiddleware = getExternalApiMiddleware()

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

  shardus.registerExternalGet('debug-points', debugMiddleware, async (req, res) => {
    // if(isDebugMode()){
    //   return res.json(`endpoint not available`)
    // }

    const points = Number(req.query.points ?? ShardeumFlags.ServicePoints['debug-points'])
    if (trySpendServicePoints(points, null, 'debug-points') === false) {
      return res.json({ error: 'node busy', points, servicePointSpendHistory, debugLastTotalServicePoints })
    }

    return res.json(
      `spent points: ${points} total:${debugLastTotalServicePoints}  ${stringify(servicePointSpendHistory)} `
    )
  })

  shardus.registerExternalGet('debug-point-spenders', debugMiddleware, async (req, res) => {
    const debugObj = {
      debugTotalPointRequests: debugTotalServicePointRequests,
      debugServiePointByType: debugServicePointsByType,
      debugServiePointSpendersByType: debugServicePointSpendersByType,
    }
    res.write(JSON.stringify(debugObj, debug_map_replacer, 2))
    res.end()
    return
  })

  shardus.registerExternalGet('debug-point-spenders-clear', debugMiddleware, async (req, res) => {
    const totalSpends = debugTotalServicePointRequests
    debugTotalServicePointRequests = 0
    debugServicePointSpendersByType.clear()
    debugServicePointsByType.clear()
    return res.json(`point spenders cleared. totalSpendActions: ${totalSpends} `)
  })

  shardus.registerExternalPost('inject', externalApiMiddleware, async (req, res) => {
    const tx = req.body
    const appData = null
    const id = shardus.getNodeId()
    const isInRotationBonds = shardus.isNodeInRotationBounds(id)
    if (isInRotationBonds) {
      return res.json({
        success: false,
        reason: `Node is too close to rotation edges. Inject to another node`,
        status: 500,
      })
    }
    await handleInject(tx, appData, res)
  })

  async function handleInject(tx, appData, res): Promise<void> {
    if (ShardeumFlags.VerboseLogs) console.log('Transaction injected:', new Date(), tx)

    const nodeId = shardus.getNodeId()
    const node = shardus.getNode(nodeId)

    if (!node) {
      nestedCountersInstance.countEvent('shardeum', `txRejectedDueToNodeNotFound`)
      res.json({
        success: false,
        reason: `Node not found. Rejecting inject`,
        status: 500,
      })
      return
    }
    if (node.status !== P2P.P2PTypes.NodeStatus.ACTIVE) {
      res.json({
        success: false,
        reason: `Node not active. Rejecting inject.`,
        status: 500,
      })
      return
    }

    let numActiveNodes = 0
    try {
      // Reject transaction if network is paused
      const networkAccount = AccountsStorage.cachedNetworkAccount
      if (networkAccount == null || networkAccount.current == null) {
        res.json({
          success: false,
          reason: `Node not ready for inject, waiting for network account data.`,
          status: 500,
        })
        return
      }

      if (networkAccount.current.txPause && !isInternalTx(tx)) {
        res.json({
          success: false,
          reason: `Network will not accept EVM tx until it has at least ${ShardeumFlags.minNodesEVMtx} active node in the network. numActiveNodes: ${numActiveNodes}`,
          status: 500,
        })
        return
      }

      numActiveNodes = shardus.getNumActiveNodes()
      let belowEVMtxMinNodes = numActiveNodes < ShardeumFlags.minNodesEVMtx
      let txRequiresMinNodes = false

      if (ShardeumFlags.checkNodesEVMtx === false) {
        //if this feature is not enabled, then we will short circuit the below checks
        belowEVMtxMinNodes = false
      }

      //only run these checks if we are below the limit
      if (belowEVMtxMinNodes) {
        const isInternal = isInternalTx(tx)
        let isStaking = false
        let isAllowedInternal = false
        if (isInternal) {
          //todo possibly later limit what internal TXs are allowed
          isAllowedInternal = true
        } else {
          const transaction = getTransactionObj(tx)
          if (transaction != null) {
            isStaking = isStakingEVMTx(transaction)
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
        const response = await shardus.put(tx, false, false, appData)
        res.json(response)
      }
    } catch (err) {
      if (ShardeumFlags.VerboseLogs) console.log('Failed to inject tx: ', err)
      try {
        res.json({
          success: false,
          reason: `Failed to inject tx:  ${formatErrorMessage(err)}`,
          status: 500,
        })
      } catch (e) {
        /* prettier-ignore */ if (logFlags.error) console.log('Failed to respond to inject tx: ', e)
      }
    }
  }

  shardus.registerExternalPost('inject-with-warmup', externalApiMiddleware, async (req, res) => {
    const id = shardus.getNodeId()
    const isInRotationBonds = shardus.isNodeInRotationBounds(id)
    if (isInRotationBonds) {
      return res.json({
        success: false,
        reason: `Node is too close to rotation edges. Inject to another node`,
        status: 500,
      })
    }
    const { tx, warmupList } = req.body
    let appData = null
    if (warmupList != null) {
      appData = { warmupList }
    }
    await handleInject(tx, appData, res)
  })

  shardus.registerExternalGet('eth_blockNumber', externalApiMiddleware, async (req, res) => {
    if (ShardeumFlags.VerboseLogs) console.log('Req: eth_blockNumber')
    return res.json({ blockNumber: latestBlock ? '0x' + latestBlock.toString(16) : '0x0' })
  })

  shardus.registerExternalGet('eth_getBlockHashes', externalApiMiddleware, async (req, res) => {
    let fromBlock: any = req.query.fromBlock
    let toBlock: any = req.query.toBlock

    if (fromBlock == null) return res.json({ error: 'Missing fromBlock' })
    if (typeof fromBlock === 'string') fromBlock = parseInt(fromBlock)
    if (fromBlock < latestBlock - ShardeumFlags.maxNumberOfOldBlocks) {
      // return max 100 blocks
      fromBlock = latestBlock - ShardeumFlags.maxNumberOfOldBlocks + 1 // 1 is added for safety
    }
    if (toBlock == null) toBlock = latestBlock
    if (typeof toBlock === 'string') fromBlock = parseInt(toBlock)
    if (toBlock > latestBlock) toBlock = latestBlock

    const blockHashes = []
    for (let i = fromBlock; i <= toBlock; i++) {
      const block = readableBlocks[i]
      if (block) blockHashes.push(block.hash)
    }
    return res.json({ blockHashes, fromBlock, toBlock })
  })

  shardus.registerExternalGet('eth_getBlockByNumber', externalApiMiddleware, async (req, res) => {
    const blockNumberParam = req.query.blockNumber as string
    let blockNumber: number | string

    const id = shardus.getNodeId()
    const isInRotationBonds = shardus.isNodeInRotationBounds(id)
    if (isInRotationBonds) {
      return res.json({ error: 'node close to rotation edges' })
    }
    if (blockNumberParam === 'latest' || blockNumberParam === 'earliest') {
      blockNumber = blockNumberParam
    } else {
      blockNumber = parseInt(blockNumberParam)
      if (Number.isNaN(blockNumber) || blockNumber < 0) {
        return res.json({ error: 'Invalid block number' })
      }
    }
    if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByNumber', blockNumber, latestBlock)
    if (blockNumber === 'latest') blockNumber = latestBlock
    if (blockNumber === 'earliest') {
      return res.json({ block: readableBlocks[Object.keys(readableBlocks)[0]] }) // eslint-disable-line security/detect-object-injection
    }
    return res.json({ block: readableBlocks[blockNumber] }) // eslint-disable-line security/detect-object-injection
  })

  shardus.registerExternalGet('eth_getBlockByHash', externalApiMiddleware, async (req, res) => {
    /* eslint-disable security/detect-object-injection */
    let blockHash = req.query.blockHash as string
    if (blockHash === 'latest') blockHash = readableBlocks[latestBlock].hash
    else if (blockHash.length !== 66 || !isHexString(blockHash)) return res.json({ error: 'Invalid block hash' })
    if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByHash', blockHash)
    const blockNumber = blocksByHash[blockHash]
    return res.json({ block: readableBlocks[blockNumber] })
    /* eslint-enable security/detect-object-injection */
  })

  shardus.registerExternalGet('stake', async (req, res) => {
    try {
      const stakeRequiredUsd = AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
      const stakeRequired = scaleByStabilityFactor(stakeRequiredUsd, AccountsStorage.cachedNetworkAccount)
      if (ShardeumFlags.VerboseLogs) console.log('Req: stake requirement', _readableSHM(stakeRequired))
      return res.json(JSON.parse(stringify({ stakeRequired, stakeRequiredUsd })))
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
      //let output = stringify(shardeumStateTXMap, replacer, 4)
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
      /* prettier-ignore */ if (logFlags.error) console.log(e)
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
        /* prettier-ignore */ if (logFlags.error) console.log(`Invalid service point`, value)
        return res.json({ error: `Invalid service point` })
      }

      const typedValue = Number(value)

      updateServicePoints(key1, key2, typedValue)

      return res.json({ ServicePoints: ShardeumFlags['ServicePoints'] })
    } catch (err) {
      return res.json(`debug-set-service-point: ${value} ${err}`)
    }
  })

  shardus.registerExternalGet('account/:address', externalApiMiddleware, async (req, res) => {
    if (trySpendServicePoints(ShardeumFlags.ServicePoints['account/:address'], req, 'account') === false) {
      return res.json({ error: 'node busy' })
    }

    const address = req.params['address']
    if (address.length !== 42 && address.length !== 64) {
      return res.json({ error: 'Invalid address' })
    }

    const id = shardus.getNodeId()
    const isInRotationBonds = shardus.isNodeInRotationBounds(id)
    if (isInRotationBonds) {
      return res.json({ error: 'node close to rotation edges' })
    }

    try {
      if (!req.query.type) {
        let shardusAddress = address.toLowerCase()
        if (address.length === 42) {
          shardusAddress = toShardusAddress(address, AccountType.Account)
        }
        const hexBlockNumber = req.query.blockNumber as string
        const hexBlockNumberStr = isHexString(hexBlockNumber) ? hexBlockNumber : null

        let data: WrappedEVMAccount
        if (isArchiverMode() && hexBlockNumberStr) {
          data = await AccountsStorage.fetchAccountDataFromCollector(shardusAddress, hexBlockNumberStr)
          if (!data) {
            return res.json({ account: null })
          }
        } else {
          const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
          if (!account) {
            return res.json({ account: null })
          }
          data = account.data as WrappedEVMAccount
        }
        fixDeserializedWrappedEVMAccount(data)
        const readableAccount = await getReadableAccountInfo(data)
        if (readableAccount) return res.json({ account: readableAccount })
        else res.json({ account: data })
      } else {
        let accountType: number
        if (typeof req.query.type === 'string') accountType = parseInt(req.query.type)
        if (AccountType[accountType] == null) {
          return res.json({ error: 'Invalid account type' })
        }
        const secondaryAddressStr: string = (req.query.secondaryAddress as string) || ''
        if (secondaryAddressStr !== '' && secondaryAddressStr.length !== 66) {
          return res.json({ error: 'Invalid secondary address' })
        }
        const shardusAddress = toShardusAddressWithKey(address, secondaryAddressStr, accountType)
        const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
        const readableAccount = JSON.parse(stringify(account))
        return res.json({ account: readableAccount })
      }
    } catch (error) {
      res.json({ error })
    }
  })

  shardus.registerExternalGet('eth_getCode', externalApiMiddleware, async (req, res) => {
    if (trySpendServicePoints(ShardeumFlags.ServicePoints['eth_getCode'], req, 'account') === false) {
      return res.json({ error: 'node busy' })
    }

    try {
      const address = req.query.address as string
      const shardusAddress = toShardusAddress(address, AccountType.Account)

      const hexBlockNumber = req.query.blockNumber as string
      const hexBlockNumberStr = isHexString(hexBlockNumber) ? hexBlockNumber : null

      let wrappedEVMAccount: WrappedEVMAccount
      if (isArchiverMode() && hexBlockNumberStr) {
        wrappedEVMAccount = await AccountsStorage.fetchAccountDataFromCollector(
          shardusAddress,
          hexBlockNumberStr
        )
        if (!wrappedEVMAccount) {
          return res.json({ contractCode: '0x' })
        }
      } else {
        const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
        if (!account || !account.data) {
          return res.json({ contractCode: '0x' })
        }
        wrappedEVMAccount = account.data as WrappedEVMAccount
      }

      fixDeserializedWrappedEVMAccount(wrappedEVMAccount)

      const codeHashHex = bytesToHex(wrappedEVMAccount.account.codeHash)
      const codeAddress = toShardusAddressWithKey(address, codeHashHex, AccountType.ContractCode)
      const codeAccount = await shardus.getLocalOrRemoteAccount(codeAddress, {
        useRICache: true,
      })
      if (!codeAccount || !codeAccount.data) {
        return res.json({ contractCode: '0x' })
      }

      const wrappedCodeAccount = codeAccount.data as WrappedEVMAccount
      fixDeserializedWrappedEVMAccount(wrappedCodeAccount)
      const contractCode = wrappedCodeAccount.codeByte ? bytesToHex(wrappedCodeAccount.codeByte) : '0x'
      return res.json({ contractCode })
    } catch (error) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('eth_getCode: ' + formatErrorMessage(error))
      res.json({ error })
    }
  })

  shardus.registerExternalGet('eth_gasPrice', externalApiMiddleware, async (req, res) => {
    if (trySpendServicePoints(ShardeumFlags.ServicePoints['eth_gasPrice'], req, 'account') === false) {
      return res.json({ error: 'node busy' })
    }

    try {
      const result = calculateGasPrice(
        ShardeumFlags.baselineTxFee,
        ShardeumFlags.baselineTxGasUsage,
        await AccountsStorage.getCachedNetworkAccount()
      )
      return res.json({ result: `0x${result.toString(16)}` })
    } catch (error) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('eth_gasPrice: ' + formatErrorMessage(error))
      res.json({ error })
    }
  })

  shardus.registerExternalPost('contract/call', externalApiMiddleware, async (req, res) => {
    // if(isDebugMode()){
    //   return res.json(`endpoint not available`)
    // }
    if (
      trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].endpoint, req, 'call-endpoint') ===
      false
    ) {
      return res.json({ result: null, error: 'node busy' })
    }

    try {
      const callObj = req.body
      if (ShardeumFlags.VerboseLogs) console.log('callObj', callObj)
      const opt = {
        to: Address.fromString(callObj.to),
        caller: Address.fromString(callObj.from),
        origin: Address.fromString(callObj.from), // The tx.origin is also the caller here
        data: toBytes(callObj.data),
      }

      if (callObj.gas) {
        opt['gasLimit'] = BigInt(Number(callObj.gas))
      }

      if (callObj.gasPrice && isHexString(callObj.gasPrice)) {
        opt['gasPrice'] = callObj.gasPrice
      }

      let caShardusAddress
      const methodCode = callObj.data.substr(0, 10)
      let caAccount
      if (opt['to']) {
        caShardusAddress = toShardusAddress(callObj.to, AccountType.Account)
        if (!ShardeumFlags.removeTokenBalanceCache && methodCode === ERC20_BALANCEOF_CODE) {
          // ERC20 Token balance query
          //to do convert to timestamp query getAccountTimestamp!!
          caAccount = await AccountsStorage.getAccount(caShardusAddress)
          if (caAccount) {
            const index = ERC20TokenBalanceMap.findIndex(
              (x) => x.to === callObj.to && x.data === callObj.data
            )
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
        const accountIsRemote = isServiceMode() ? false : shardus.isAccountRemote(address)

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

              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:${stringify(postResp.body)}`)
              //res.json({ result: callResult.execResult.returnValue.toString() })
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

      // if we are going to handle the call directly charge 20 points.
      if (
        trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].direct, req, 'call-direct') ===
        false
      ) {
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
          balance: oneSHM * BigInt(100), // 100 SHM.  This is a temporary account that will never exist.
        }
        const fakeAccount = Account.fromAccountData(acctData)
        callTxState._transactionState.insertFirstAccountReads(opt.caller, fakeAccount)

        //shardeumStateManager.setTransactionState(callTxState)
      }

      let useLatestState = true
      if (callObj.block && callObj.block.number && callObj.block.timestamp) {
        const block = {
          number: parseInt(callObj.block.number, 16),
          timestamp: parseInt(callObj.block.timestamp, 16),
        }
        if (callObj.block.useLatestState === false) useLatestState = false
        opt['block'] = createBlock(block.timestamp, block.number)
        if (ShardeumFlags.VerboseLogs) console.log(`Got block context from callObj`, block)
      } else {
        opt['block'] = blocks[latestBlock] // eslint-disable-line security/detect-object-injection
      }

      const customEVM = new EthereumVirtualMachine({
        common: evmCommon,
        stateManager: callTxState,
      })

      const requestContext = {
        block: opt['block'],
      }

      let callResult: EVMResult
      if (isArchiverMode() && useLatestState === false) {
        await runWithContextAsync(async () => {
          callResult = await customEVM.runCall(opt)
        }, requestContext)
      } else {
        callResult = await customEVM.runCall(opt)
      }
      let returnedValue = bytesToHex(callResult.execResult.returnValue)
      if (returnedValue && returnedValue.indexOf('0x') === 0) {
        returnedValue = returnedValue.slice(2)
      }

      //shardeumStateManager.unsetTransactionState(callTxState.linkedTX)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Call Result', returnedValue)

      if (!ShardeumFlags.removeTokenBalanceCache && methodCode === ERC20_BALANCEOF_CODE) {
        //TODO would be way faster to have timestamp in db as field
        //let caAccount = await AccountsStorage.getAccount(caShardusAddress)

        ERC20TokenBalanceMap.push({
          to: callObj.to,
          data: callObj.data,
          timestamp: caAccount && caAccount.timestamp, //this will invalidate for any user..
          result: callResult.execResult.exceptionError ? null : returnedValue,
        })
        if (ERC20TokenBalanceMap.length > ERC20TokenCacheSize + 10) {
          const extra = ERC20TokenBalanceMap.length - ERC20TokenCacheSize
          ERC20TokenBalanceMap.splice(0, extra)
        }
      }

      if (callResult.execResult.exceptionError) {
        if (ShardeumFlags.VerboseLogs) console.log('Execution Error:', callResult.execResult.exceptionError)
        return res.json({
          result: {
            error: {
              code: -32000,
              message:
                `execution reverted: ${callResult.execResult.exceptionError.errorType} ` +
                `${callResult.execResult.exceptionError.error}`,
              data: bytesToHex(callResult.execResult.returnValue),
            },
          },
        })
      }

      res.json({ result: returnedValue })
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Error eth_call', e)
      return res.json({ result: null })
    }
  })

  shardus.registerExternalPost('contract/accesslist', externalApiMiddleware, async (req, res) => {
    if (
      trySpendServicePoints(
        ShardeumFlags.ServicePoints['contract/accesslist'].endpoint,
        req,
        'accesslist'
      ) === false
    ) {
      return res.json({ result: null, error: 'node busy' })
    }

    try {
      const injectedTx = req.body
      if (ShardeumFlags.VerboseLogs) console.log('AccessList endpoint injectedTx', injectedTx)

      const result = await generateAccessList(injectedTx, { accessList: [], codeHashes: [] }, '/accesslist')

      res.json(result)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Error predict accessList', e)
      return res.json([])
    }
  })

  shardus.registerExternalPost('contract/accesslist-warmup', externalApiMiddleware, async (req, res) => {
    if (
      trySpendServicePoints(
        ShardeumFlags.ServicePoints['contract/accesslist'].endpoint,
        req,
        'accesslist'
      ) === false
    ) {
      return res.json({ result: null, error: 'node busy' })
    }

    try {
      const { injectedTx, warmupList } = req.body
      if (ShardeumFlags.VerboseLogs) console.log('accesslist-warmup endpoint injectedTx', injectedTx)

      const result = await generateAccessList(injectedTx, warmupList, '/accesslist-warmup')

      res.json(result)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Error predict accessList warmup', e)
      return res.json([])
    }
  })

  shardus.registerExternalPost('contract/estimateGas', externalApiMiddleware, async (req, res) => {
    if (
      trySpendServicePoints(
        ShardeumFlags.ServicePoints['contract/estimateGas'].endpoint,
        req,
        'estimateGas'
      ) === false
    ) {
      return res.json({ result: null, error: 'node busy' })
    }

    if (ShardeumFlags.supportEstimateGas === false) {
      return res.json({ result: null, error: 'estimateGas not supported' })
    }

    try {
      const injectedTx = req.body
      if (ShardeumFlags.VerboseLogs) console.log('EstimateGas endpoint injectedTx', injectedTx)

      const result = await estimateGas(injectedTx)

      res.json(result)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Error estimate gas', e)
      return res.json({
        result: {
          error: {
            code: -32000,
            message: 'gas required exceeds allowance or always failing transaction',
          },
        },
      })
    }
  })

  shardus.registerExternalGet('tx/:hash', externalApiMiddleware, async (req, res) => {
    if (trySpendServicePoints(ShardeumFlags.ServicePoints['tx/:hash'], req, 'tx') === false) {
      return res.json({ error: 'node busy' })
    }

    const txHash = req.params['hash']
    if (!ShardeumFlags.EVMReceiptsAsAccounts) {
      try {
        const dataId = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
        const cachedAppData = await shardus.getLocalOrRemoteCachedAppData('receipt', dataId)
        if (ShardeumFlags.VerboseLogs) console.log(`cachedAppData for tx hash ${txHash}`, cachedAppData)
        if (cachedAppData && cachedAppData.appData) {
          /* prettier-ignore */ if(logFlags.shardedCache) console.log(`cachedAppData: Found tx receipt for ${txHash} ${Date.now()}`)
          const receipt = cachedAppData.appData as ShardusTypes.WrappedData
          return res.json({ account: JSON.parse(stringify(receipt.data)) })
        } else {
          // tools will ask for a tx receipt before it exists!
          // we could register a "waiting" placeholer cache item
          /* prettier-ignore */ if(logFlags.shardedCache) console.log(`cachedAppData: Unable to find tx receipt for ${txHash} ${Date.now()}`)
        }
        return res.json({ account: null })
      } catch (error) {
        /* prettier-ignore */ if(logFlags.shardedCache) console.log('cachedAppData: Unable to get tx receipt: ' + formatErrorMessage(error))
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
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('tx/:hash: ' + formatErrorMessage(error))
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
    //   return res.json(stringify({result:`shardeumState not found`}))
    // }

    // let appData = shardeumState._transactionState?.appData

    const appData = debugAppdata.get(txHash)

    if (appData == null) {
      return res.json(stringify({ result: `no appData` }))
    }

    //return res.json(`${stringify(appData)}`)

    res.write(`${stringify(appData, null)}`)

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

  shardus.registerExternalGet('accounts', debugMiddlewareMedium, async (req, res) => {
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

  shardus.registerExternalGet('genesis_accounts', externalApiMiddleware, async (req, res) => {
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
  shardus.registerExternalGet('system-info', debugMiddlewareLow, async (req, res) => {
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

  shardus.registerExternalPut(
    'query-certificate',
    externalApiMiddleware,
    async (req: Request, res: Response) => {
      nestedCountersInstance.countEvent('shardeum-penalty', 'called query-certificate')

      const queryCertRes = await queryCertificateHandler(req, shardus)
      if (ShardeumFlags.VerboseLogs) console.log('queryCertRes', queryCertRes)
      if (queryCertRes.success) {
        const successRes = queryCertRes as CertSignaturesResult
        stakeCert = successRes.signedStakeCert
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `queryCertificateHandler success`)
      } else {
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `queryCertificateHandler failed with reason: ${(queryCertRes as ValidatorError).reason}`)
      }

      return res.json(JSON.parse(stringify(queryCertRes)))
    }
  )

  // Returns the latest value from isReadyToJoin call
  // TODO verify if this is used by the node operator
  shardus.registerExternalGet('debug-is-ready-to-join', async (req, res) => {
    const publicKey = shardus.crypto.getPublicKey()

    return res.json({ isReady: isReadyToJoinLatestValue, nodePubKey: publicKey })
  })

  // Changes the threshold for the blocked-At function
  shardus.registerExternalGet('debug-set-event-block-threshold', debugMiddleware, async (req, res) => {
    try {
      const threshold = Number(req.query.threshold)

      if (isNaN(threshold) || threshold <= 0) {
        return res.json({ error: `Invalid threshold: ${req.query.threshold}` })
      }

      //startBlockedCheck(threshold)
      return res.json({ success: `Threshold set to ${threshold}ms` })
    } catch (err) {
      return res.json({ error: `Error setting threshold: ${err.toString()}` })
    }
  })

  // endpoint on joining nodes side to receive admin certificate
  shardus.registerExternalPut('admin-certificate', externalApiMiddleware, async (req, res) => {
    nestedCountersInstance.countEvent('shardeum-admin-certificate', 'called PUT admin-certificate')

    const certRes = await putAdminCertificateHandler(req, shardus)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('certRes', certRes)
    if (certRes.success) {
      const successRes = certRes as PutAdminCertResult
      adminCert = successRes.signedAdminCert
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-admin-certificate', `putAdminCertificateHandler success`)
    } else {
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-admin-certificate', `putAdminCertificateHandler failed with reason: ${(certRes as ValidatorError).reason}`)
    }

    return res.json(certRes)
  })
}

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
  tx: InternalTx,
  wrappedStates: WrappedStates,
  txTimestamp: number
): Promise<ShardusTypes.ApplyResponse> {
  const txId = generateTxId(tx)
  const applyResponse: ShardusTypes.ApplyResponse = shardus.createApplyResponse(txId, txTimestamp)
  const internalTx = tx as InternalTx
  if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
    // eslint-disable-next-line security/detect-object-injection
    const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[internalTx.from].data
    //just update the timestamp?
    wrappedEVMAccount.timestamp = txTimestamp
    //I think this will naturally accomplish the goal of the global update.

    //need to run this to fix buffer types after serialization
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
    if (ShardeumFlags.supportInternalTxReceipt) {
      createInternalTxReceipt(
        shardus,
        applyResponse,
        internalTx,
        networkAccount,
        networkAccount,
        txTimestamp,
        txId
      )
    }
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
        wrappedChangedAccount as ShardusTypes.WrappedResponse,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
    }
    if (ShardeumFlags.supportInternalTxReceipt) {
      createInternalTxReceipt(
        shardus,
        applyResponse,
        internalTx,
        networkAccount,
        networkAccount,
        txTimestamp,
        txId
      )
    }
    /* prettier-ignore */ if (logFlags.important_as_error) console.log(`init_network NETWORK_ACCOUNT: ${stringify(network)}`)
    /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied init_network transaction', network)
  }
  if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
    /* eslint-disable security/detect-object-injection */
    // const network: NetworkAccount = wrappedStates[networkAccount].data
    // const devAccount: DevAccount = wrappedStates[internalTx.from].data
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

    // if (ShardeumFlags.useAccountWrites) {
    //   /* eslint-disable security/detect-object-injection */
    //   const networkAccountCopy = wrappedStates[networkAccount]
    //   const devAccountCopy = wrappedStates[internalTx.from]
    //   /* eslint-enable security/detect-object-injection */
    //   networkAccountCopy.data.timestamp = txTimestamp
    //   devAccountCopy.data.timestamp = txTimestamp
    //   shardus.applyResponseAddChangedAccount(
    //     applyResponse,
    //     networkAccount,
    //     networkAccountCopy as ShardusTypes.WrappedResponse,
    //     txId,
    //     txTimestamp
    //   )
    //   shardus.applyResponseAddChangedAccount(
    //     applyResponse,
    //     internalTx.from,
    //     devAccountCopy as ShardusTypes.WrappedResponse,
    //     txId,
    //     txTimestamp
    //   )
    // } else {
    //   network.timestamp = txTimestamp
    //   devAccount.timestamp = txTimestamp
    // }
    if (ShardeumFlags.supportInternalTxReceipt) {
      createInternalTxReceipt(
        shardus,
        applyResponse,
        internalTx,
        internalTx.from,
        networkAccount,
        txTimestamp,
        txId
      )
    }
    /* prettier-ignore */ if (logFlags.important_as_error) console.log('Applied change_config tx')
    /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied change_config tx')
  }
  if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
    // eslint-disable-next-line security/detect-object-injection
    const network: NetworkAccount = wrappedStates[networkAccount].data

    if (ShardeumFlags.useAccountWrites) {
      // eslint-disable-next-line security/detect-object-injection
      const networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = txTimestamp
      networkAccountCopy.data.listOfChanges.push(internalTx.change)
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(networkAccountCopy.data)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        wrappedChangedAccount as ShardusTypes.WrappedResponse,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      network.listOfChanges.push(internalTx.change)
    }
    /* prettier-ignore */ if (logFlags.important_as_error) console.log(`Applied CHANGE_CONFIG GLOBAL transaction: ${stringify(network)}`)
    /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied CHANGE_CONFIG GLOBAL transaction', stringify(network))
    if (ShardeumFlags.supportInternalTxReceipt) {
      createInternalTxReceipt(
        shardus,
        applyResponse,
        internalTx,
        internalTx.from,
        networkAccount,
        txTimestamp,
        txId
      )
    }
  }
  if (internalTx.internalTXType === InternalTXType.ChangeNetworkParam) {
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

    if (ShardeumFlags.supportInternalTxReceipt) {
      createInternalTxReceipt(
        shardus,
        applyResponse,
        internalTx,
        internalTx.from,
        networkAccount,
        txTimestamp,
        txId
      )
    }
    /* prettier-ignore */ if (logFlags.important_as_error) console.log('Applied change_network_param tx')
    /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied change_network_param tx')
  }
  if (internalTx.internalTXType === InternalTXType.ApplyNetworkParam) {
    // eslint-disable-next-line security/detect-object-injection
    const network: NetworkAccount = wrappedStates[networkAccount].data

    if (ShardeumFlags.useAccountWrites) {
      // eslint-disable-next-line security/detect-object-injection
      const networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = txTimestamp
      networkAccountCopy.data.listOfChanges.push(internalTx.change)
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(networkAccountCopy.data)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        wrappedChangedAccount as ShardusTypes.WrappedResponse,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      network.listOfChanges.push(internalTx.change)
    }
    if (ShardeumFlags.supportInternalTxReceipt) {
      createInternalTxReceipt(
        shardus,
        applyResponse,
        internalTx,
        internalTx.from,
        networkAccount,
        txTimestamp,
        txId
      )
    }
    /* prettier-ignore */ if (logFlags.important_as_error) console.log(`Applied CHANGE_NETWORK_PARAM GLOBAL transaction: ${stringify(network)}`)
    /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied CHANGE_NETWORK_PARAM GLOBAL transaction', stringify(network))
  }
  if (internalTx.internalTXType === InternalTXType.SetCertTime) {
    const setCertTimeTx = internalTx as SetCertTime
    applySetCertTimeTx(shardus, setCertTimeTx, wrappedStates, txId, txTimestamp, applyResponse)
  }
  if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
    const rewardTimesTx = internalTx as InitRewardTimes
    InitRewardTimesTx.apply(shardus, rewardTimesTx, txId, txTimestamp, wrappedStates, applyResponse)
  }
  if (internalTx.internalTXType === InternalTXType.ClaimReward) {
    const claimRewardTx = internalTx as ClaimRewardTX
    applyClaimRewardTx(
      shardus,
      claimRewardTx,
      wrappedStates,
      txId,
      txTimestamp,
      applyResponse,
      mustUseAdminCert
    )
  }
  if (internalTx.internalTXType === InternalTXType.Penalty) {
    const penaltyTx = internalTx as PenaltyTX
    applyPenaltyTX(shardus, penaltyTx, wrappedStates, txId, txTimestamp, applyResponse)
  }
  return applyResponse
}

export const createInternalTxReceipt = (
  shardus,
  applyResponse: ShardusTypes.ApplyResponse,
  internalTx: InternalTx,
  from: string,
  to: string,
  txTimestamp: number,
  txId: string,
  amountSpent = bigIntToHex(BigInt(0))
): void => {
  const blockForReceipt = getOrCreateBlockFromTimestamp(txTimestamp)
  const blockNumberForTx = blockForReceipt.header.number.toString()
  const readableReceipt: ReadableReceipt = {
    status: 1,
    transactionHash: '0x' + txId,
    transactionIndex: '0x1',
    // eslint-disable-next-line security/detect-object-injection
    blockNumber: readableBlocks[blockNumberForTx]?.number,
    nonce: '0x0',
    blockHash: readableBlocks[blockNumberForTx]?.hash, // eslint-disable-line security/detect-object-injection
    cumulativeGasUsed: '0x0',
    gasUsed: '0x0',
    gasRefund: '0x0',
    logs: [],
    logsBloom: '',
    contractAddress: null,
    from,
    to,
    value: '0x0',
    data: '0x0',
    isInternalTx: true,
    internalTx: { ...internalTx, sign: null },
  }
  const wrappedReceiptAccount = {
    timestamp: txTimestamp,
    ethAddress: '0x' + txId,
    hash: '',
    receipt: null,
    readableReceipt,
    amountSpent,
    txId: txId,
    accountType: ShardeumFlags.addInternalTxReceiptAccount
      ? AccountType.InternalTxReceipt
      : AccountType.Receipt,
    txFrom: readableReceipt.from,
  }
  const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
  shardus.applyResponseAddReceiptData(
    applyResponse,
    receiptShardusAccount,
    crypto.hashObj(receiptShardusAccount)
  )
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
    toAccount.timestamp = txTimestamp
    fromAccount.balance -= 1
    toAccount.balance += 1
    fixDeserializedWrappedEVMAccount(fromAccount)
    fixDeserializedWrappedEVMAccount(toAccount)
  }

  const txId = generateTxId(debugTx)
  return shardus.createApplyResponse(txId, txTimestamp)
  /* eslint-enable security/detect-object-injection */
}

function setGlobalCodeByteUpdate(
  txTimestamp: number,
  wrappedEVMAccount: WrappedEVMAccount,
  applyResponse: ShardusTypes.ApplyResponse
): void {
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
): Promise<void> {
  if (applyResponse == null) {
    return
  }
  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  const appReceiptData = applyResponse.appReceiptData

  if (ShardeumFlags.VerboseLogs) {
    console.log('_transactionReceiptPass appReceiptData for tx', txId, appReceiptData)
    console.log('_transactionReceiptPass appReceiptDataHash for tx', txId, crypto.hashObj(appReceiptData))
  }

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
      const txHash = generateTxId(tx)
      console.log(`transactionReceiptPass setglobal: ${txHash} ${JSON.stringify(tx)}  `)
    }
  }
  if (tx.internalTXType === InternalTXType.Penalty) {
    let nodeAccount: NodeAccount2
    if (isNodeAccount2(wrappedStates[tx.reportedNodePublickKey].data))
      nodeAccount = wrappedStates[tx.reportedNodePublickKey].data as NodeAccount2

    if (isLowStake(nodeAccount)) {
      if (ShardeumFlags.VerboseLogs)
        console.log(`isLowStake for nodeAccount ${nodeAccount.id}: true`, nodeAccount)
      const latestCycles = shardus.getLatestCycles()
      const currentCycle = latestCycles[0]
      if (!currentCycle) {
        /* prettier-ignore */ if (logFlags.error) console.log('No cycle records found', latestCycles)
        return
      }
      const certData: RemoveNodeCert = {
        nodePublicKey: tx.reportedNodePublickKey,
        cycle: currentCycle.counter,
      }
      const signedAppData = await shardus.getAppDataSignatures(
        'sign-remove-node-cert',
        crypto.hashObj(certData),
        5,
        certData,
        2
      )
      if (!signedAppData.success) {
        nestedCountersInstance.countEvent('shardeum', 'unable to get signs for remove node cert')
        if (ShardeumFlags.VerboseLogs) console.log(`Unable to get signature for remove node cert`)
        // todo: find a better way to retry this
        return
      }

      certData.signs = signedAppData.signatures
      shardus.removeNodeWithCertificiate(certData)
    }
  }
}

const getNetworkAccount = async (): Promise<ShardusTypes.WrappedData> => {
  const globalAccount = shardusConfig.globalAccount
  const wrappedEVMAccount = await AccountsStorage.getAccount(globalAccount)
  if (!wrappedEVMAccount) return null
  const account = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
  return account
}

const createNetworkAccount = async (
  accountId: string,
  config: Config,
  isFirstSeed: boolean
): Promise<NetworkAccount> => {
  let listOfChanges = []

  const networkAccount = await getNetworkAccount()
  if (networkAccount) {
    // @ts-ignore
    listOfChanges = networkAccount.data?.listOfChanges as {
      cycle: number
      change: any
      appData: any
    }[]
  }

  if (shouldLoadNetworkConfigToNetworkAccount(isFirstSeed)) {
    // This means this is the first node and we have a flag enabled
    // that indicates that the local network configs should be loaded in the network account and used from all nodes joining
    const configCopy = rfdc()(config.server)
    delete configCopy.baseDir // delete this line you want to include this in the network account
    // @ts-ignore
    delete configCopy.ip // delete this line you want to include this in the network account
    listOfChanges.push({ cycle: 1, change: configCopy })
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Initial network account listOfChanges', listOfChanges)
  }

  const account: NetworkAccount = {
    id: accountId,
    accountType: AccountType.NetworkAccount,
    listOfChanges,
    current: initialNetworkParamters,
    next: {},
    hash: '',
    timestamp: 0,
  }
  account.hash = WrappedEVMAccountFunctions._calculateAccountHash(account)
  /* prettier-ignore */ if (logFlags.important_as_error) console.log('INITIAL_HASH: ', account.hash)
  return account
}

const createNodeAccount2 = (accountId: string): NodeAccount2 => {
  const nodeAccount = {
    id: accountId,
    hash: '',
    timestamp: 0,
    nominator: '',
    stakeLock: BigInt(0),
    reward: BigInt(0),
    rewardStartTime: 0,
    rewardEndTime: 0,
    penalty: BigInt(0),
    accountType: AccountType.NodeAccount2,
    nodeAccountStats: {
      totalReward: BigInt(0),
      totalPenalty: BigInt(0),
      history: [],
      isShardeumRun: false,
    },
    // rewarded: false // To be compatible with v1.1.2 nodes, commented out for now.
  } as NodeAccount2
  if (ShardeumFlags.rewardedFalseInInitRewardTx) nodeAccount.rewarded = false
  WrappedEVMAccountFunctions.updateEthAccountHash(nodeAccount)
  return nodeAccount
}

const getOrCreateBlockFromTimestamp = (timestamp: number, scheduleNextBlock = false): Block => {
  /* eslint-disable security/detect-object-injection */
  if (ShardeumFlags.VerboseLogs) console.log('Getting block from timestamp', timestamp)
  if (ShardeumFlags.VerboseLogs && blocks[latestBlock]) {
    /* prettier-ignore */ console.log('Latest block timestamp', blocks[latestBlock].header.timestamp, parseInt(blocks[latestBlock].header.timestamp.toString(10)) + 6000)
    /* prettier-ignore */ console.log('Latest block number', blocks[latestBlock].header.number.toString(10))
  }
  if (blocks[latestBlock] && parseInt(blocks[latestBlock].header.timestamp.toString(10)) >= timestamp) {
    return blocks[latestBlock]
  }
  /* eslint-enable security/detect-object-injection */

  const latestCycles = shardus.getLatestCycles()
  if (latestCycles == null || latestCycles.length === 0) return
  const cycle = latestCycles[0]

  if (ShardeumFlags.extraTxTime && !scheduleNextBlock)
    timestamp = timestamp + ShardeumFlags.extraTxTime * 1000

  const cycleStart = (cycle.start + cycle.duration) * 1000
  const timeElapsed = timestamp - cycleStart
  const decimal = timeElapsed / (cycle.duration * 1000)
  const numBlocksPerCycle = cycle.duration / ShardeumFlags.blockProductionRate
  const blockNumber = Math.floor(
    ShardeumFlags.initialBlockNumber + (cycle.counter + 1 + decimal) * numBlocksPerCycle
  )
  const newBlockTimestampInSecond =
    cycle.start +
    cycle.duration +
    (blockNumber - ShardeumFlags.initialBlockNumber - (cycle.counter + 1) * 10) *
      ShardeumFlags.blockProductionRate
  const newBlockTimestamp = newBlockTimestampInSecond * 1000
  if (ShardeumFlags.VerboseLogs) {
    console.log('Cycle counter vs derived blockNumber', cycle.counter, blockNumber)
  }
  const block = createAndRecordBlock(blockNumber, newBlockTimestamp)
  if (scheduleNextBlock) {
    const nextBlockTimestamp = newBlockTimestamp + ShardeumFlags.blockProductionRate * 1000
    const waitTime = nextBlockTimestamp - shardeumGetTime()
    if (ShardeumFlags.VerboseLogs) console.log('Scheduling next block created which will happen in', waitTime)
    setTimeout(() => {
      getOrCreateBlockFromTimestamp(nextBlockTimestamp, true)
    }, waitTime)
  }
  pruneOldBlocks()
  return block
}

async function estimateGas(
  injectedTx: { from: string; maxFeePerGas: string; gas: number } & LegacyTxData
): Promise<{ estimateGas: string }> {
  const originalInjectedTx = { ...injectedTx }
  const maxUint256 = BigInt(2) ** BigInt(256) - BigInt(1)
  if (ShardeumFlags.VerboseLogs) console.log('injectedTx to estimateGas', injectedTx)
  const blockForTx = blocks[latestBlock]
  const MAX_GASLIMIT = BigInt(30_000_000)

  try {
    if (injectedTx.gas == null) {
      // If no gas limit is specified use the last block gas limit as an upper bound.
      // injectedTx.gas = blockForTx.header.gasLimit.div(new BN(10).pow(new BN(8))) as any
      // injectedTx.gasLimit = blockForTx.header.gasLimit.div(new BN(10).pow(new BN(8))) as any
      injectedTx.gasLimit = blockForTx.header.gasLimit
    } else {
      injectedTx.gasLimit = BigInt(injectedTx.gas)
    }
  } catch (error) {
    if (ShardeumFlags.VerboseLogs) console.log('Injected tx without gasLimit', error)
    injectedTx.gasLimit = BigInt('0x1C9C380') // 30 M Gas
  }

  // we set this max gasLimit to prevent DDOS attacks with high gasLimits
  if (injectedTx.gasLimit > MAX_GASLIMIT) {
    injectedTx.gasLimit = MAX_GASLIMIT
  }

  // we set this max gasLimit to prevent DDOS attacks with high gasLimits
  if (injectedTx.gasLimit > MAX_GASLIMIT) {
    injectedTx.gasLimit = MAX_GASLIMIT
  }

  const txData = {
    ...injectedTx,
    gasLimit: injectedTx.gasLimit ? injectedTx.gasLimit : blockForTx.header.gasLimit,
  }

  const transaction: LegacyTransaction | AccessListEIP2930Transaction =
    TransactionFactory.fromTxData<TransactionType.Legacy>(txData)
  if (ShardeumFlags.VerboseLogs) console.log(`parsed tx`, transaction)

  const from = injectedTx.from !== undefined ? Address.fromString(injectedTx.from) : Address.zero()

  const caShardusAddress = transaction.to
    ? toShardusAddress(transaction.to.toString(), AccountType.Account)
    : null

  if (caShardusAddress != null) {
    const accountIsRemote = isServiceMode() ? false : shardus.isAccountRemote(caShardusAddress)

    if (accountIsRemote) {
      const consensusNode = shardus.getRandomConsensusNodeForAccount(caShardusAddress)
      /* prettier-ignore */
      if (consensusNode != null) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting estimateGas ${consensusNode?.externalIp}:${consensusNode?.externalPort}`, injectedTx, originalInjectedTx)

        const postResp = await _internalHackPostWithResp(
          `${consensusNode.externalIp}:${consensusNode.externalPort}/contract/estimateGas`,
          originalInjectedTx
        )
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('EstimateGas response from node', consensusNode.externalPort, postResp.body)
        if (postResp.body != null && postResp.body != '' && postResp.body.estimateGas != null) {
          const estimateResultFromNode = postResp.body.estimateGas

          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:`, estimateResultFromNode)
          if (isHexPrefixed(estimateResultFromNode) && estimateResultFromNode !== '0x' && estimateResultFromNode !== '0x0') {
            return postResp.body.estimateGas;
          } else {
            return { estimateGas: bigIntToHex(maxUint256) }
          }
        }
      } else {
        return { estimateGas: bigIntToHex(maxUint256) }
      }
    } else {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: false`)
    }
  }

  const txId = crypto.hashObj(transaction)
  const { address: senderAddress, isValid } = getTxSenderAddress(transaction, txId)
  const preRunTxState = getPreRunTXState(txId)
  const callerEVMAddress = isValid ? senderAddress : getTxSenderAddress(transaction, txId, from).address
  const callerShardusAddress = toShardusAddress(callerEVMAddress.toString(), AccountType.Account)
  let callerAccount = await AccountsStorage.getAccount(callerShardusAddress)
  // callerAccount.account.balance = oneSHM.mul(new BN(100)) // 100 SHM. In case someone estimates gas with 0 balance
  if (ShardeumFlags.VerboseLogs) {
    console.log('BALANCE: ', callerAccount?.account?.balance)
    console.log('CALLER: ', stringify(callerAccount))
  }

  const fakeAccountData = {
    nonce: 0,
    balance: oneSHM * BigInt(100), // 100 SHM.  This is a temporary account that will never exist.
  }
  const fakeAccount = Account.fromAccountData(fakeAccountData)
  if (callerAccount == null) {
    const remoteCallerAccount = await shardus.getLocalOrRemoteAccount(callerShardusAddress)
    if (remoteCallerAccount) {
      callerAccount = remoteCallerAccount.data as WrappedEVMAccount
      fixDeserializedWrappedEVMAccount(callerAccount)
    }
  }
  if (callerAccount == null) {
    /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum-endpoints', `Unable to find caller account while estimating gas. Using a fake account to estimate gas` )
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log( `Unable to find caller account: ${callerShardusAddress} while estimating gas. Using a fake account to estimate gas` )
  }

  preRunTxState._transactionState.insertFirstAccountReads(
    callerEVMAddress,
    callerAccount ? callerAccount.account : fakeAccount
  )

  const customEVM = new EthereumVirtualMachine({
    common: evmCommon,
    stateManager: preRunTxState,
  })

  EVM.stateManager = null
  // EVM.evm.stateManager = null
  // EVM.evm.journal.stateManager = null

  EVM.stateManager = preRunTxState
  // EVM.evm.stateManager = preRunTxState
  // EVM.evm.journal.stateManager = preRunTxState

  if (!isInSenderCache(txId)) {
    nestedCountersInstance.countEvent(
      'shardeum-endpoints',
      `tx in senderTxCache evicted before EVM processing`
    )
  }

  const runTxResult = await EVM.runTx(
    {
      block: blocks[latestBlock],
      tx: transaction,
      skipNonce: true,
      skipBalance: true,
      networkAccount: await AccountsStorage.getCachedNetworkAccount(),
    },
    customEVM,
    txId
  )

  if (ShardeumFlags.VerboseLogs) console.log('Predicted gasUsed', runTxResult.totalGasSpent)

  if (runTxResult.execResult.exceptionError) {
    if (ShardeumFlags.VerboseLogs) console.log('Execution Error:', runTxResult.execResult.exceptionError)
    throw new Error(runTxResult.execResult.exceptionError)
  }

  if (!isValid) {
    removeTxFromSenderCache(txId)
  }
  // For the estimate, we add the gasRefund to the gasUsed because gasRefund is subtracted after execution.
  // That can lead to higher gasUsed during execution than the actual gasUsed
  const estimate = runTxResult.totalGasSpent + (runTxResult.execResult.gasRefund ?? BigInt(0))
  return { estimateGas: bigIntToHex(estimate) }
}

type CodeHashObj = { codeHash: string; contractAddress: string }

async function generateAccessList(
  injectedTx: ShardusTypes.OpaqueTransaction,
  warmupList: { accessList: any[]; codeHashes: CodeHashObj[] },
  caller: string
): Promise<{
  shardusMemoryPatterns: null
  failedAccessList?: boolean
  accessList: any[]
  codeHashes: CodeHashObj[]
}> {
  try {
    const transaction = getTransactionObj(injectedTx)
    const caShardusAddress = transaction.to
      ? toShardusAddress(transaction.to.toString(), AccountType.Account)
      : null

    if (caShardusAddress != null) {
      /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log('Generating accessList to ', transaction.to.toString(), caShardusAddress)

      const address = caShardusAddress
      const accountIsRemote = isServiceMode() ? false : shardus.isAccountRemote(address)
      //ShardeumFlags.debugLocalAALG === false means that we will skip the remote attempt and run it locally
      if (accountIsRemote && ShardeumFlags.debugLocalAALG === false) {
        const consensusNode = shardus.getRandomConsensusNodeForAccount(address)
        /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
        if (consensusNode != null) {
          /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: requesting`)

          const postResp = await _internalHackPostWithResp(
            `${consensusNode.externalIp}:${consensusNode.externalPort}/contract/accesslist-warmup`,
            { injectedTx, warmupList }
          )
          /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log('Accesslist response from node', consensusNode.externalPort, postResp.body)
          if (postResp.body != null && postResp.body != '' && postResp.body.accessList != null) {
            /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: gotResp:${stringify(postResp.body)}`)
            if (Array.isArray(postResp.body.accessList) && postResp.body.accessList.length > 0) {
              /* prettier-ignore */ nestedCountersInstance.countEvent( 'accesslist', `remote shard accessList: ${postResp.body.accessList.length} items, success: ${ postResp.body.failedAccessList != true }` )
              let failed = postResp.body.failedAccessList
              if (postResp.body.codeHashes == null || postResp.body.codeHashes.length == 0) {
                failed = true
              }
              return {
                accessList: postResp.body.accessList,
                shardusMemoryPatterns: postResp.body.shardusMemoryPatterns,
                codeHashes: postResp.body.codeHashes,
                failedAccessList: failed,
              }
            } else {
              nestedCountersInstance.countEvent('accesslist', `remote shard accessList: empty`)
              return { accessList: [], shardusMemoryPatterns: null, codeHashes: [], failedAccessList: true }
            }
          }
        } else {
          nestedCountersInstance.countEvent('accesslist', `remote shard found no consensus node`)
          /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: consensusNode = null`)
          return { accessList: [], shardusMemoryPatterns: null, codeHashes: [], failedAccessList: true }
        }
      } else {
        /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: false`)
      }
    }

    const txId = generateTxId(injectedTx)
    const senderAddress = getTxSenderAddress(transaction, txId).address
    const preRunTxState = getPreRunTXState(txId)
    const callerEVMAddress = senderAddress.toString()
    const callerShardusAddress = toShardusAddress(callerEVMAddress, AccountType.Account)
    let callerAccount = await AccountsStorage.getAccount(callerShardusAddress)
    const fakeAccountData = {
      nonce: 0,
      balance: oneSHM * BigInt(100), // 100 SHM.  This is a temporary account that will never exist.
    }
    const fakeAccount = Account.fromAccountData(fakeAccountData)
    if (callerAccount == null) {
      const remoteCallerAccount = await shardus.getLocalOrRemoteAccount(callerShardusAddress)
      if (remoteCallerAccount) {
        callerAccount = remoteCallerAccount.data as WrappedEVMAccount
        fixDeserializedWrappedEVMAccount(callerAccount)
      }
    }
    if (callerAccount == null) {
      /* prettier-ignore */ nestedCountersInstance.countEvent( 'accesslist', `Unable to find caller account while generating accessList. Using a fake account to estimate gas` )
      /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log( `Unable to find caller account: ${callerShardusAddress} while generating accessList. Using a fake account to generate accessList` )
    }
    // temporarily set caller account's nonce same as tx's nonce
    if (ShardeumFlags.accesslistNonceFix && callerAccount && callerAccount.account) {
      callerAccount.account.nonce = BigInt(transaction.nonce.toString())
    }

    preRunTxState._transactionState.insertFirstAccountReads(
      senderAddress,
      callerAccount ? callerAccount.account : fakeAccount // todo: using fake account may not work in new ethereumJS
    )

    let warmupCache = null

    const warmupStats: WarmupStats = {
      accReq: 0,
      accRcvd: 0,
      accRcvdNull: 0,
      accReqErr: 0,
      cacheHit: 0,
      cacheMiss: 0,
      cacheEmpty: 0,
      cacheEmptyReqMiss: 0,
    }
    //const promises:Promise<ShardusTypes.WrappedDataFromQueue>[] = []
    //use warmupList to fetch data in parallel.  We will feed this in as cache inputs to the transaction
    //state
    if (warmupList != null && warmupList.codeHashes?.length > 0 && warmupList.accessList?.length > 0) {
      warmupCache = new Map<string, WrappedEVMAccount>()

      const startTime = Date.now()
      for (const codeHashObj of warmupList.codeHashes) {
        const shardusAddr = toShardusAddressWithKey(
          codeHashObj.contractAddress,
          codeHashObj.codeHash,
          AccountType.ContractCode
        )
        //TODO: tie into code bytes cache! should be a pre-fetch

        //promises.push(shardus.getLocalOrRemoteAccount(shardusAddr, {useRICache:true}))
        fetchAndCacheAccountData(shardusAddr, warmupCache, warmupStats, true, txId, AccountType.ContractCode)
      }
      for (const accesListTuple of warmupList.accessList) {
        const contractAddress = accesListTuple[0]
        const storageArray = accesListTuple[1]

        const shardusContractAddr = toShardusAddress(contractAddress, AccountType.Account)
        //promises.push(shardus.getLocalOrRemoteAccount(shardusContractAddr))
        fetchAndCacheAccountData(
          shardusContractAddr,
          warmupCache,
          warmupStats,
          false,
          txId,
          AccountType.Account
        )
        for (const storageAddr of storageArray) {
          const shardusStorageAddr = toShardusAddressWithKey(
            contractAddress,
            storageAddr,
            AccountType.ContractStorage
          )
          //promises.push(shardus.getLocalOrRemoteAccount(shardusStorageAddr))
          fetchAndCacheAccountData(
            shardusStorageAddr,
            warmupCache,
            warmupStats,
            false,
            txId,
            AccountType.ContractStorage
          )
        }
      }

      /* prettier-ignore */ if(logFlags.aalg) console.log(`aalg: sending fetch: ${Date.now()-startTime} ms and wait ${ShardeumFlags.aalgWarmupSleep} tx:${txId}`)
      await sleep(ShardeumFlags.aalgWarmupSleep)
    }

    //Await all the promises.  TODO more advanced wait that is fault tolerant
    // const warmupData = await Promise.all(promises)

    // // build a warmupcache from the results we got
    // const warmupCache = new Map<string, WrappedEVMAccount>()
    // for(const warmupAcc of warmupData){
    //   warmupCache.set(warmupAcc.accountId, warmupAcc.data as WrappedEVMAccount )
    // }
    preRunTxState._transactionState.warmupCache = warmupCache
    preRunTxState._transactionState.warmupStats = warmupStats

    if (warmupList != null) {
      /* prettier-ignore */ if(logFlags.aalg) console.log(`warmup results, before:`, caller, txId, JSON.stringify(warmupStats, null, 2))
    }

    const customEVM = new EthereumVirtualMachine({
      common: evmCommon,
      stateManager: preRunTxState,
    })

    EVM.stateManager = null
    EVM.stateManager = preRunTxState

    if (transaction == null) {
      nestedCountersInstance.countEvent('accesslist', 'transaction is null')
      return { accessList: [], shardusMemoryPatterns: null, codeHashes: [] }
    }
    const txStart = Date.now()
    const runTxResult = await EVM.runTx(
      {
        block: blocks[latestBlock],
        tx: transaction,
        // skipNonce: !ShardeumFlags.CheckNonce,
        skipNonce: true,
        skipBalance: true,
        networkAccount: await AccountsStorage.getCachedNetworkAccount(),
      },
      customEVM,
      txId
    )
    const elapsed = Date.now() - txStart
    nestedCountersInstance.countEvent('accesslist-times', `elapsed ${Math.round(elapsed / 1000)} sec`)

    if (warmupList != null) {
      /* prettier-ignore */ if(logFlags.aalg) console.log(`aalg: results, after: warmed:`, caller, txId, elapsed, JSON.stringify(warmupStats, null, 2) )
      //todo compare warmupList to access list
    } else {
      /* prettier-ignore */ if(logFlags.aalg) console.log(`aalg: results, after:`, caller, txId, elapsed, JSON.stringify(warmupStats, null, 2) )
    }

    const readAccounts = preRunTxState._transactionState.getReadAccounts()
    const writtenAccounts = preRunTxState._transactionState.getWrittenAccounts()
    const allInvolvedContracts = []
    const accessList = []

    //get a full picture of the read/write 'bits'
    const readSet = new Set()
    const writeSet = new Set()
    //let readOnlySet = new Set()
    const writeOnceSet = new Set()
    const readImmutableSet = new Set()

    //always make the sender rw.  This is because the sender will always spend gas and increment nonce
    if (senderAddress != null) {
      const shardusKey = callerShardusAddress
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
      readImmutableSet.add(shardusKey)
    }

    if (ShardeumFlags.fixContractBytes) {
      for (const [contractAddress, contractByteWrite] of writtenAccounts.contractBytes) {
        // for (const [contractAddress, contractByteWrite] of writtenAccounts.contractBytes) {
        if (!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)
        const codeHash = bytesToHex(contractByteWrite.codeHash)
        const shardusKey = toShardusAddressWithKey(contractAddress, codeHash, AccountType.ContractCode)
        writeSet.add(shardusKey)
        //special case shardeum behavoir.  contract bytes can only be written once
        writeOnceSet.add(shardusKey)
      }
    } else {
      for (const [codeHash, contractByteWrite] of writtenAccounts.contractBytes) {
        const contractAddress = contractByteWrite.contractAddress.toString()
        if (!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)
        const shardusKey = toShardusAddressWithKey(contractAddress, codeHash, AccountType.ContractCode)
        writeSet.add(shardusKey)
        //special case shardeum behavoir.  contract bytes can only be written once
        writeOnceSet.add(shardusKey)
      }
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
        ri: Array.from(readImmutableSet),
      }
    }

    if (ShardeumFlags.VerboseLogs || logFlags.aalg) {
      console.log('allInvolvedContracts', allInvolvedContracts)
      console.log('Read accounts', readAccounts)
      console.log('Written accounts', writtenAccounts)
      console.log('Immutable read accounts', readImmutableSet)
    }

    const allCodeHash = new Map<string, CodeHashObj>()

    for (const address of allInvolvedContracts) {
      const allKeys = new Set<string>()
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

      //this is moved before we process contract bytes so that only storage accounts are added to the access list
      const accessListItem = [address, Array.from(allKeys)]
      accessList.push(accessListItem)

      for (const [codeHash, byteReads] of readAccounts.contractBytes) {
        const contractAddress = byteReads.contractAddress.toString()
        if (contractAddress !== address) continue
        //if (!allKeys.has(codeHash)) allKeys.add(codeHash)
        if (!allCodeHash.has(contractAddress)) allCodeHash.set(contractAddress, { codeHash, contractAddress })
      }
      for (const [, byteReads] of writtenAccounts.contractBytes) {
        const codeHash = bytesToHex(byteReads.codeHash)
        const contractAddress = byteReads.contractAddress.toString()
        if (contractAddress !== address) continue
        //if (!allKeys.has(codeHash)) allKeys.add(codeHash)
        if (!allCodeHash.has(contractAddress)) allCodeHash.set(contractAddress, { codeHash, contractAddress })
      }

      // const accessListItem = [address, Array.from(allKeys).map((key) => key)]
      // accessList.push(accessListItem)
    }

    if (ShardeumFlags.VerboseLogs || logFlags.aalg) console.log('Predicted accessList', accessList)

    if (runTxResult.execResult.exceptionError) {
      if (ShardeumFlags.VerboseLogs || logFlags.aalg)
        console.log('Execution Error:', runTxResult.execResult.exceptionError)
      /* prettier-ignore */ nestedCountersInstance.countEvent( 'accesslist', `Local Fail with evm error: CA ${ transaction.to && ShardeumFlags.VerboseLogs ? transaction.to.toString() : '' }` )
      return { accessList: [], shardusMemoryPatterns: null, codeHashes: [], failedAccessList: true }
    }
    const isEmptyCodeHash = allCodeHash.size === 0
    if (isEmptyCodeHash) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs || logFlags.aalg) console.log(`aalg: empty codehash ${txId}
      allInvolvedContracts:  ${JSON.stringify(allInvolvedContracts,null,2)}

      readAccounts.contractBytes: ${JSON.stringify(readAccounts.contractBytes,null,2)}`)
      nestedCountersInstance.countEvent('accesslist', `Local Fail: empty codeHash`)
    } else nestedCountersInstance.countEvent('accesslist', `Local Success: true`)
    return {
      accessList,
      shardusMemoryPatterns,
      codeHashes: Array.from(allCodeHash.values()),
      failedAccessList: isEmptyCodeHash,
    }
  } catch (e) {
    console.log(`Error: generateAccessList`, e)
    nestedCountersInstance.countEvent('accesslist', `Local Fail: unknown`)
    return { accessList: [], shardusMemoryPatterns: null, codeHashes: [] }
  }
}

async function fetchAndCacheAccountData(
  shardusAddress: string,
  warmupCache: Map<string, WrappedEVMAccount>,
  warmupStats: WarmupStats,
  useRICache: boolean,
  txid: string,
  type: AccountType
): Promise<void> {
  warmupStats.accReq++

  const startTime = Date.now()
  /* prettier-ignore */ if(logFlags.aalg) console.log('aalg: fetchAndCacheAccountData-enter', txid, shardusAddress, type)
  warmupCache.set(shardusAddress, undefined) //set undefined to indicate we want to fetch this

  try {
    const warmupAcc = await shardus.getLocalOrRemoteAccount(shardusAddress, {
      useRICache,
      canThrowException: true,
    })
    const elapsed = Date.now() - startTime
    if (warmupAcc == null) {
      warmupStats.accRcvdNull++
      nestedCountersInstance.countEvent('aalg-warmup', 'account warmed-empty')
      /* prettier-ignore */ if(logFlags.aalg) console.log('aalg: fetchAndCacheAccountData-null',elapsed, txid, shardusAddress, type)
      warmupCache.set(shardusAddress, null) //could we init with undefined?
    } else {
      nestedCountersInstance.countEvent('aalg-warmup', 'account warmed')
      warmupCache.set(shardusAddress, warmupAcc.data as WrappedEVMAccount)
      warmupStats.accRcvd++
      /* prettier-ignore */ if(logFlags.aalg) console.log('aalg: fetchAndCacheAccountData-got',elapsed, txid, shardusAddress, type)
    }
  } catch (er) {
    const elapsed = Date.now() - startTime
    warmupStats.accReqErr++
    nestedCountersInstance.countEvent('aalg-warmup', `account er: ${er.message}`)
    /* prettier-ignore */ if(logFlags.aalg) console.log('aalg: fetchAndCacheAccountData-error',elapsed, txid, shardusAddress, type)
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

// let blockedAtEventHook = null

// function startBlockedCheck(threshold: number): void {
//   // Stop any existing blocked-at check
//   if (blockedAtEventHook) {
//     try {
//       blockedAtEventHook.stop()
//     } catch (error) {
//       console.error('Error stopping blocked check:', error)
//     }
//   }
//   let resourcesCap = 100 // reccomended by blocked-at
//   if (ShardeumFlags.blockedAtVerbose) {
//     resourcesCap = 1000 // allow more if doing a verbose inspection
//   }
//   // Start a new blocked-at check with the given threshold
//   blockedAtEventHook = blockedAt(
//     (time, stack, { type, resource }) => {
//       //take the time variable which is in ms and make round to the nearest 100ms. This is to reduce the number of events
//       const timeBucket = Math.round(time / 100) * 100

//       nestedCountersInstance.countEvent('blocked-at', `100ms bucket: ${timeBucket}`)

//       const uuid = uuidCounter++ //uuidv4()
//       if (ShardeumFlags.blockedAtVerbose) {
//         // Log the event loop block details
//         /* prettier-ignore */ console.log(`[event_loop:blocked] request id: ${uuid} timestamp: ${shardeumGetTime()} blocked for: ${time}ms by resource type: ${type} resource:${resource}`);

//         // Extracting info from the stack
//         const appCodeLine = stack.find((line) => line.includes('\\server\\src\\'))
//         if (appCodeLine) {
//           const match = appCodeLine.match(/at\s+(.*)\s\((.*):(\d+):(\d+)\)/)

//           if (match) {
//             const functionName = match[1]
//             const filePath = match[2]
//             const line = match[3]
//             const column = match[4]

//             /* prettier-ignore */ console.log(`[event_loop:blocked] request id: ${uuid} Function: ${functionName}, File: ${filePath}, Line: ${line}, Column: ${column}`);

//             nestedCountersInstance.countEvent(
//               'blocked-at detected at',
//               `[event_loop:blocked] request id: ${uuid} Function: ${functionName}, File: ${filePath}, Line: ${line}, Column: ${column}`
//             )
//           }
//         }

//         // Log the complete stack trace
//         /* prettier-ignore */ console.log(`[event_loop:blocked] request id: ${uuid} Complete Stack: ${stringify(stack)}`);
//       }
//     },
//     { threshold: threshold, debug: false, resourcesCap }
//   )
// }

// Start with a default threshold of 1000ms
// startBlockedCheck(1000)

/***
 *     ######  ##     ##    ###    ########  ########  ##     ##  ######      ######  ######## ######## ##     ## ########
 *    ##    ## ##     ##   ## ##   ##     ## ##     ## ##     ## ##    ##    ##    ## ##          ##    ##     ## ##     ##
 *    ##       ##     ##  ##   ##  ##     ## ##     ## ##     ## ##          ##       ##          ##    ##     ## ##     ##
 *     ######  ######### ##     ## ########  ##     ## ##     ##  ######      ######  ######      ##    ##     ## ########
 *          ## ##     ## ######### ##   ##   ##     ## ##     ##       ##          ## ##          ##    ##     ## ##
 *    ##    ## ##     ## ##     ## ##    ##  ##     ## ##     ## ##    ##    ##    ## ##          ##    ##     ## ##
 *     ######  ##     ## ##     ## ##     ## ########   #######   ######      ######  ########    ##     #######  ##
 */
const shardusSetup = (): void => {
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
    isInternalTx,
    async apply(timestampedTx: ShardusTypes.OpaqueTransaction, wrappedStates, originalAppData) {
      //@ts-ignore
      const { tx } = timestampedTx
      const txTimestamp = getInjectedOrGeneratedTimestamp(timestampedTx)
      const appData = fixBigIntLiteralsToBigInt(originalAppData)
      // Validate the tx
      const { result, reason } = this.validateTransaction(tx)
      if (result !== 'pass') {
        throw new Error(`invalid transaction, reason: ${reason}. tx: ${stringify(tx)}`)
      }

      if (isInternalTx(tx)) {
        return applyInternalTx(tx, wrappedStates, txTimestamp)
      }

      if (isDebugTx(tx)) {
        const debugTx = tx as DebugTx
        return applyDebugTx(debugTx, wrappedStates, txTimestamp)
      }

      // it is an EVM tx
      const rawSerializedTx = tx.raw
      if (rawSerializedTx == null) {
        throw new Error(
          `Invalid evm transaction, reason: unable to extract raw tx from the transaction object, tx: ${JSON.stringify(
            tx
          )}`
        )
      }

      const txId = generateTxId(tx)
      const transaction = getTransactionObj(tx)
      const senderAddress = getTxSenderAddress(transaction, txId).address
      const ethTxId = bytesToHex(transaction.hash())
      const shardusReceiptAddress = toShardusAddressWithKey(ethTxId, '', AccountType.Receipt)
      // Create an applyResponse which will be used to tell Shardus that the tx has been applied
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('DBG', new Date(), 'attempting to apply tx', txId, ethTxId, tx, wrappedStates, appData)
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
            stake: BigInt(0),
            nominee: '',
            certExp: null,
            operatorStats: {
              totalNodeReward: BigInt(0),
              totalNodePenalty: BigInt(0),
              totalNodeTime: 0,
              history: [],
              totalUnstakeReward: BigInt(0),
              unstakeCount: 0,
              isShardeumRun: false,
              lastStakedNodeKey: '',
            },
          }
        } else {
          operatorEVMAccount.operatorAccountInfo = fixBigIntLiteralsToBigInt(
            operatorEVMAccount.operatorAccountInfo
          )
        }
        const txFeeUsd = BigInt(ShardeumFlags.constantTxFeeUsd)
        const txFee = scaleByStabilityFactor(txFeeUsd, AccountsStorage.cachedNetworkAccount)
        const totalAmountToDeduct = stakeCoinsTx.stake + txFee
        if (operatorEVMAccount.account.balance < totalAmountToDeduct) {
          throw new Error('Operator account does not have enough balance to stake')
        }
        operatorEVMAccount.operatorAccountInfo.stake += stakeCoinsTx.stake
        operatorEVMAccount.operatorAccountInfo.nominee = stakeCoinsTx.nominee
        if (operatorEVMAccount.operatorAccountInfo.certExp == null)
          operatorEVMAccount.operatorAccountInfo.certExp = 0
        fixDeserializedWrappedEVMAccount(operatorEVMAccount)

        operatorEVMAccount.account.balance = operatorEVMAccount.account.balance - totalAmountToDeduct
        operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce + BigInt(1)

        const operatorEVMAddress: Address = Address.fromString(stakeCoinsTx.nominator)
        shardus.setDebugSetLastAppAwait(`apply():checkpoint_putAccount_commit 1`)
        await shardeumState.checkpoint()
        await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
        await shardeumState.commit()
        shardus.setDebugSetLastAppAwait(`apply():checkpoint_putAccount_commit 1`, DebugComplete.Completed)

        // eslint-disable-next-line security/detect-object-injection
        const nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2
        if (typeof nodeAccount2.stakeLock === 'string') {
          nodeAccount2.stakeLock = BigInt('0x' + nodeAccount2.stakeLock)
        }
        nodeAccount2.nominator = stakeCoinsTx.nominator
        nodeAccount2.stakeLock += stakeCoinsTx.stake
        nodeAccount2.timestamp = txTimestamp

        if (ShardeumFlags.useAccountWrites) {
          // for operator evm account
          const { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('\nAccount Writes: ', accountWrites)
          for (const account of accountWrites.entries()) {
            const addressStr = account[0]
            if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
              continue
            }
            const accountObj = Account.fromRlpSerializedAccount(account[1])
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('\nWritten Account Object: ', accountObj)

            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('written account Obj', accountObj)

            const wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }

            const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }

          const wrappedChangedNodeAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
            wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2
          )
          // for nominee node account
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            nomineeNodeAccount2Address,
            wrappedChangedNodeAccount as ShardusTypes.WrappedResponse,
            txId,
            txTimestamp
          )
        }

        const blockForReceipt = getOrCreateBlockFromTimestamp(txTimestamp)
        let blockNumberForTx = blockForReceipt.header.number.toString()

        if (ShardeumFlags.supportInternalTxReceipt === false) {
          blockNumberForTx = `${latestBlock}`
        }

        // generate a proper receipt for stake tx
        const readableReceipt: ReadableReceipt = {
          status: 1,
          transactionHash: ethTxId,
          transactionIndex: '0x1',
          // eslint-disable-next-line security/detect-object-injection
          blockNumber: bigIntToHex(blocks[blockNumberForTx].header.number),
          nonce: bigIntToHex(transaction.nonce),
          blockHash: readableBlocks[blockNumberForTx].hash, // eslint-disable-line security/detect-object-injection
          cumulativeGasUsed: bigIntToHex(
            scaleByStabilityFactor(
              BigInt(ShardeumFlags.constantTxFeeUsd),
              AccountsStorage.cachedNetworkAccount
            )
          ),
          gasUsed: bigIntToHex(
            scaleByStabilityFactor(
              BigInt(ShardeumFlags.constantTxFeeUsd),
              AccountsStorage.cachedNetworkAccount
            )
          ),
          gasRefund: '0x0',
          gasPrice: bigIntToHex(transaction.gasPrice),
          gasLimit: bigIntToHex(transaction.gasLimit),
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          logs: [],
          logsBloom: '',
          contractAddress: null,
          from: senderAddress.toString(),
          to: transaction.to ? transaction.to.toString() : null,
          chainId: '0x' + ShardeumFlags.ChainID.toString(16),
          stakeInfo: {
            nominee: nomineeNodeAccount2Address,
            stake: stakeCoinsTx.stake,
            totalStakeAmount: operatorEVMAccount.operatorAccountInfo.stake,
          },
          value: bigIntToHex(transaction.value),
          type: '0x' + transaction.type.toString(16),
          data: bytesToHex(transaction.data),
          v: bigIntToHex(transaction.v),
          r: bigIntToHex(transaction.r),
          s: bigIntToHex(transaction.s),
        }

        const wrappedReceiptAccount: WrappedEVMAccount = {
          timestamp: txTimestamp,
          ethAddress: ethTxId,
          hash: '',
          readableReceipt,
          amountSpent: bigIntToHex(txFee),
          txId,
          accountType: AccountType.StakeReceipt,
          txFrom: stakeCoinsTx.nominator,
        }
        /* prettier-ignore */
        if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)

        if (ShardeumFlags.EVMReceiptsAsAccounts) {
          if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx ${txId}`)
          if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx eth ${ethTxId}`)
          const wrappedChangedAccount =
            WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
          if (shardus.applyResponseAddChangedAccount != null) {
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }
        } else {
          const receiptShardusAccount =
            WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
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
        } else {
          operatorEVMAccount.operatorAccountInfo = fixBigIntLiteralsToBigInt(
            operatorEVMAccount.operatorAccountInfo
          )
        }
        fixDeserializedWrappedEVMAccount(operatorEVMAccount)

        if (
          operatorEVMAccount.operatorAccountInfo.certExp > txTimestamp &&
          ShardeumFlags.unstakeCertCheckFix
        ) {
          throw new Error(
            `Unable to apply Unstake tx because stake cert has not yet expired. Expiry timestamp ${operatorEVMAccount.operatorAccountInfo.certExp}`
          )
        }

        // eslint-disable-next-line security/detect-object-injection
        const nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2

        const currentBalance = operatorEVMAccount.account.balance
        const stake = BigInt(operatorEVMAccount.operatorAccountInfo.stake)
        let reward = BigInt(nodeAccount2.reward)
        const penalty = BigInt(nodeAccount2.penalty)
        const txFeeUsd = BigInt(ShardeumFlags.constantTxFeeUsd)
        const txFee = scaleByStabilityFactor(txFeeUsd, AccountsStorage.cachedNetworkAccount)
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('calculating new balance after unstake', currentBalance, stake, reward, penalty, txFee)
        if (nodeAccount2.rewardEndTime === 0 && nodeAccount2.rewardStartTime > 0) {
          // This block will only be reached if the node is inactive and the force unstake flag has been set
          reward = BigInt(0)

          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('discarding staking rewards due to zero rewardEndTime')
        }
        const newBalance = currentBalance + stake + reward - penalty - txFee
        operatorEVMAccount.account.balance = newBalance
        operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce + BigInt(1)

        operatorEVMAccount.operatorAccountInfo.stake = BigInt(0)
        operatorEVMAccount.operatorAccountInfo.nominee = null
        operatorEVMAccount.operatorAccountInfo.certExp = null

        // update the operator historical stats
        operatorEVMAccount.operatorAccountInfo.operatorStats.totalUnstakeReward =
          _base16BNParser(operatorEVMAccount.operatorAccountInfo.operatorStats.totalUnstakeReward) + reward
        operatorEVMAccount.operatorAccountInfo.operatorStats.unstakeCount += 1
        operatorEVMAccount.operatorAccountInfo.operatorStats.lastStakedNodeKey = nomineeNodeAccount2Address

        const operatorEVMAddress: Address = Address.fromString(unstakeCoinsTX.nominator)
        shardus.setDebugSetLastAppAwait(`apply():checkpoint_putAccount_commit 2`)
        await shardeumState.checkpoint()
        await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
        await shardeumState.commit()
        shardus.setDebugSetLastAppAwait(`apply():checkpoint_putAccount_commit 2`, DebugComplete.Completed)

        let stakeInfo: StakeInfo
        if (ShardeumFlags.totalUnstakeAmount) {
          // I think rewardStartTime and rewardEndTime can be omitted now, since it's only for the last time the node was participated
          stakeInfo = {
            nominee: nomineeNodeAccount2Address,
            // rewardStartTime: nodeAccount2.rewardStartTime,
            // rewardEndTime: nodeAccount2.rewardEndTime,
            stake,
            reward,
            penalty,
            totalUnstakeAmount: stake + reward - penalty,
          }
        } else {
          stakeInfo = {
            nominee: nomineeNodeAccount2Address,
            rewardStartTime: nodeAccount2.rewardStartTime,
            rewardEndTime: nodeAccount2.rewardEndTime,
            reward,
            penalty,
          }
        }

        nodeAccount2.nominator = null
        nodeAccount2.stakeLock = BigInt(0)
        nodeAccount2.timestamp = txTimestamp
        nodeAccount2.penalty = BigInt(0)
        nodeAccount2.reward = BigInt(0)
        nodeAccount2.rewardStartTime = 0
        nodeAccount2.rewardEndTime = 0
        nodeAccount2.rewarded = false

        if (ShardeumFlags.useAccountWrites) {
          // for operator evm account
          const { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('\nAccount Writes: ', accountWrites)
          for (const account of accountWrites.entries()) {
            const addressStr = account[0]
            if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
              continue
            }
            const accountObj = Account.fromRlpSerializedAccount(account[1])
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('\nWritten Account Object: ', accountObj)

            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('written account Obj', accountObj)

            const wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }
            const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }

          const wrappedChangedNodeAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
            wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2
          )
          // for nominee node account
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            nomineeNodeAccount2Address,
            // eslint-disable-next-line security/detect-object-injection
            wrappedChangedNodeAccount as ShardusTypes.WrappedResponse,
            txId,
            txTimestamp
          )
        }

        const blockForReceipt = getOrCreateBlockFromTimestamp(txTimestamp)
        let blockNumberForTx = blockForReceipt.header.number.toString()

        if (ShardeumFlags.supportInternalTxReceipt === false) {
          blockNumberForTx = `${latestBlock}`
        }

        // generate a proper receipt for unstake tx
        const readableReceipt: ReadableReceipt = {
          status: 1,
          transactionHash: ethTxId,
          transactionIndex: '0x1',
          // eslint-disable-next-line security/detect-object-injection
          blockNumber: bigIntToHex(blocks[blockNumberForTx].header.number),
          nonce: bigIntToHex(transaction.nonce),
          // eslint-disable-next-line security/detect-object-injection
          blockHash: readableBlocks[blockNumberForTx].hash,
          cumulativeGasUsed: bigIntToHex(
            scaleByStabilityFactor(
              BigInt(ShardeumFlags.constantTxFeeUsd),
              AccountsStorage.cachedNetworkAccount
            )
          ),
          gasUsed: bigIntToHex(
            scaleByStabilityFactor(
              BigInt(ShardeumFlags.constantTxFeeUsd),
              AccountsStorage.cachedNetworkAccount
            )
          ),
          gasRefund: '0x0',
          gasPrice: bigIntToHex(transaction.gasPrice),
          gasLimit: bigIntToHex(transaction.gasLimit),
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          logs: [],
          logsBloom: '',
          contractAddress: null,
          from: senderAddress.toString(),
          to: transaction.to ? transaction.to.toString() : null,
          chainId: '0x' + ShardeumFlags.ChainID.toString(16),
          stakeInfo,
          value: bigIntToHex(transaction.value),
          type: '0x' + transaction.type.toString(16),
          data: bytesToHex(transaction.data),
          v: bigIntToHex(transaction.v),
          r: bigIntToHex(transaction.r),
          s: bigIntToHex(transaction.s),
        }

        const wrappedReceiptAccount = {
          timestamp: txTimestamp,
          ethAddress: ethTxId,
          hash: '',
          readableReceipt,
          amountSpent: bigIntToHex(txFee),
          txId,
          accountType: AccountType.UnstakeReceipt,
          txFrom: unstakeCoinsTX.nominator,
        }
        /* prettier-ignore */
        if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)

        if (ShardeumFlags.EVMReceiptsAsAccounts) {
          if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx ${txId}`)
          if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx eth ${ethTxId}`)
          const wrappedChangedAccount =
            WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
          if (shardus.applyResponseAddChangedAccount != null) {
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }
        } else {
          const receiptShardusAccount =
            WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
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
          const accountIsRemote =
            __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false

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
      //   let senderEVMAddrStr = senderAddress.toString()
      //   let shardusAddress = toShardusAddress(senderEVMAddrStr,  AccountType.Account)
      //   let senderAccount:WrappedEVMAccount = wrappedStates[shardusAddress]
      //  bug here seem like nonce is undefined even though type def indicate, it does.
      //   if(senderAccount.account.nonce >= transaction.nonce ){
      //     throw new Error(`invalid transaction, reason: nonce fail. tx: ${stringify(tx)}`)
      //   }
      // }

      // Apply the tx
      const blockForTx = getOrCreateBlockFromTimestamp(txTimestamp)
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Block for tx ${ethTxId}`, blockForTx.header.number.toString(10))
      let runTxResult: RunTxResult
      let wrappedReceiptAccount: WrappedEVMAccount
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`apply():getLocalOrRemoteAccount(${networkAccount})`)
      const wrappedNetworkAccount: ShardusTypes.WrappedData = await shardus.getLocalOrRemoteAccount(
        networkAccount
      )
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`apply():getLocalOrRemoteAccount(${networkAccount})`, DebugComplete.Completed)
      try {
        const customEVM = new EthereumVirtualMachine({
          common: evmCommon,
          stateManager: shardeumState,
        })
        // if checkNonce is true, we're not gonna skip the nonce
        EVM.stateManager = null
        EVM.stateManager = shardeumState
        shardus.setDebugSetLastAppAwait(`apply():runTx`)
        runTxResult = await EVM.runTx(
          {
            block: blockForTx,
            tx: transaction,
            skipNonce: !ShardeumFlags.CheckNonce,
            networkAccount: wrappedNetworkAccount.data,
          },
          customEVM,
          txId
        )
        shardus.setDebugSetLastAppAwait(`apply():runTx`, DebugComplete.Completed)
        if (ShardeumFlags.VerboseLogs) console.log('runTxResult', txId, runTxResult)

        if (ShardeumFlags.labTest) {
          if (shardus.testFailChance(0.01, 'labTest: loop-lock1', txId, '', true)) {
            await shardus.debugForeverLoop('labTest: loop-lock1')
          }
        }
      } catch (e) {
        // if (!transactionFailHashMap[ethTxId]) {
        let caAddr = null
        if (!transaction.to) {
          const txSenderEvmAddr = senderAddress.toString()

          const hack0Nonce = BigInt(0)
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
          blockNumber: readableBlocks[blockForTx.header.number.toString(10)].number,
          nonce: bigIntToHex(transaction.nonce),
          blockHash: readableBlocks[blockForTx.header.number.toString(10)].hash,
          cumulativeGasUsed: '0x',
          logs: null,
          logsBloom: null,
          gasUsed: '0x',
          gasRefund: '0x0',
          gasPrice: bigIntToHex(transaction.gasPrice),
          gasLimit: bigIntToHex(transaction.gasLimit),
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          contractAddress: caAddr,
          from: senderAddress.toString(),
          to: transaction.to ? transaction.to.toString() : null,
          chainId: '0x' + ShardeumFlags.ChainID.toString(16),
          value: bigIntToHex(transaction.value),
          type: '0x' + transaction.type.toString(16),
          data: '0x',
          reason: e.toString(),
          v: bigIntToHex(transaction.v),
          r: bigIntToHex(transaction.r),
          s: bigIntToHex(transaction.s),
        }
        wrappedReceiptAccount = {
          timestamp: txTimestamp,
          ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
          hash: '',
          // receipt: runTxResult.receipt,
          readableReceipt,
          amountSpent: bigIntToHex(BigInt(0)),
          txId,
          accountType: AccountType.Receipt,
          txFrom: senderAddress.toString(),
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
        /* prettier-ignore */ if (logFlags.error) shardus.log('Unable to apply transaction', e)
        //if (logFlags.dapp_verbose ) console.log('Unable to apply transaction', txId, e)
        // throw new Error(e)
      }
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
          receipt: { ...runTxResult, nonce: bigIntToHex(transaction.nonce), status: 1 },
        }
      }

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
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }
        }
      }

      //Keep a map of CA addresses to codeHash
      //use this later in the loop of account updates to set the correct account code hash values
      const accountToCodeHash: Map<string, Uint8Array> = new Map()

      if (ShardeumFlags.VerboseLogs) console.log(`DBG: all contractBytes writes`, contractBytesWrites)

      for (const contractBytesEntry of contractBytesWrites.entries()) {
        //1. wrap and save/update this to shardeum accounts[] map
        const contractByteWrite: ContractByteWrite = contractBytesEntry[1]
        const codeHashStr = bytesToHex(contractByteWrite.codeHash)
        const wrappedEVMAccount: WrappedEVMAccount = {
          timestamp: txTimestamp,
          codeHash: contractByteWrite.codeHash,
          codeByte: contractByteWrite.contractByte,
          ethAddress: codeHashStr,
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
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }
        }
      }
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('DBG: accountsToCodeHash', accountToCodeHash)
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

        // I think data is unwrapped too much and we should be using wrappedEVMAccount directly as data
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)

        // and the added it to the apply response (not implemented yet)
        //Attach the written account data to the apply response.  This will allow it to be shared with other shards if needed.
        if (shardus.applyResponseAddChangedAccount != null) {
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount as ShardusTypes.WrappedResponse,
            txId,
            wrappedChangedAccount.timestamp
          )
        }
      }

      if (accountWrites.size === 0) { // it means SHM transfer fail
        // loop through original wrappedStates and add them to the applyResponse
        for (const accountId in wrappedStates) {
          if (wrappedStates[accountId].timestamp === 0) continue
          const wrappedData: ShardusTypes.WrappedData = wrappedStates[accountId]
          if (shardus.applyResponseAddChangedAccount != null) {
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedData.accountId,
              wrappedData as ShardusTypes.WrappedResponse,
              txId,
              wrappedData.timestamp
            )
          }
        }
      }

      //TODO also create an account for the receipt (nested in the returned runTxResult should be a receipt with a list of logs)
      // We are ready to loop over the receipts and add them
      if (runTxResult) {
        const runState: any = runTxResult.execResult.runState
        let logs = []
        if (runState == null) {
          if (ShardeumFlags.VerboseLogs) console.log(`No runState found in the receipt for ${txId}`)
        } else {
          logs = runState.logs.map((l: [Buffer, Buffer[], Buffer], index) => {
            return {
              logIndex: ShardeumFlags.receiptLogIndexFix ? '0x' + index.toString(16) : '0x1',
              blockNumber: readableBlocks[blockForTx.header.number.toString(10)].number,
              blockHash: readableBlocks[blockForTx.header.number.toString(10)].hash,
              transactionHash: ethTxId,
              transactionIndex: '0x1',
              address: bytesToHex(l[0]),
              topics: l[1].map((i) => bytesToHex(i)),
              data: bytesToHex(l[2]),
            }
          })
        }
        const readableReceipt: ReadableReceipt = {
          status: runTxResult.receipt['status'],
          transactionHash: ethTxId,
          transactionIndex: '0x1',
          blockNumber: readableBlocks[blockForTx.header.number.toString()].number,
          nonce: bigIntToHex(transaction.nonce),
          blockHash: readableBlocks[blockForTx.header.number.toString()].hash,
          cumulativeGasUsed: bigIntToHex(runTxResult.totalGasSpent),
          gasUsed: bigIntToHex(runTxResult.totalGasSpent),
          gasRefund: bigIntToHex(runTxResult.execResult.gasRefund ?? BigInt(0)),
          gasPrice: bigIntToHex(transaction.gasPrice),
          gasLimit: bigIntToHex(transaction.gasLimit),
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          logs: logs,
          logsBloom: bytesToHex(runTxResult.receipt.bitvector),
          contractAddress: runTxResult.createdAddress ? runTxResult.createdAddress.toString() : null,
          from: senderAddress.toString(),
          to: transaction.to ? transaction.to.toString() : null,
          chainId: '0x' + ShardeumFlags.ChainID.toString(16),
          value: bigIntToHex(transaction.value),
          type: '0x' + transaction.type.toString(16),
          data: bytesToHex(transaction.data),
          v: bigIntToHex(transaction.v),
          r: bigIntToHex(transaction.r),
          s: bigIntToHex(transaction.s),
        }
        if (runTxResult.execResult.exceptionError) {
          readableReceipt.reason = runTxResult.execResult.exceptionError.error
        }
        wrappedReceiptAccount = {
          timestamp: txTimestamp,
          ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
          hash: '',
          receipt: runTxResult.receipt as any,
          readableReceipt,
          amountSpent: bigIntToHex(runTxResult.amountSpent),
          txId,
          accountType: AccountType.Receipt,
          txFrom: senderAddress.toString(),
        }
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)
      }

      if (ShardeumFlags.EVMReceiptsAsAccounts) {
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
        if (shardus.applyResponseAddChangedAccount != null) {
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount as ShardusTypes.WrappedResponse,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (ShardeumFlags.autoGenerateAccessList && appData && (appData as any).requestNewTimestamp) {
        if (ShardeumFlags.VerboseLogs) console.log('Requesting new timestamp', appData)
        return -1
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else return Object.prototype.hasOwnProperty.call(tx, 'timestamp') ? (tx as any).timestamp : 0
    },
    calculateTxId(tx: ShardusTypes.OpaqueTransaction) {
      return generateTxId(tx)
    },
    async txPreCrackData(tx, appData): Promise<{ status: boolean; reason: string }> {
      if (ShardeumFlags.VerboseLogs) console.log('Running txPreCrackData', tx, appData)
      if (ShardeumFlags.UseTXPreCrack === false) {
        return { status: true, reason: 'UseTXPreCrack is false' }
      }

      appData.requestNewTimestamp = true // force all txs to generate a new timestamp
      // Check if we are active

      if (isInternalTx(tx) === false && isDebugTx(tx) === false) {
        const shardusTxId = generateTxId(tx)
        const transaction = getTransactionObj(tx)
        const senderAddress = getTxSenderAddress(transaction, shardusTxId).address
        const ethTxId = bytesToHex(transaction.hash())
        if (ShardeumFlags.VerboseLogs) {
          console.log(`EVM tx ${ethTxId} is mapped to shardus tx ${shardusTxId}`)
          console.log(`Shardus tx ${shardusTxId} is mapped to EVM tx ${ethTxId}`)
        }

        const isStakeRelatedTx: boolean = isStakingEVMTx(transaction)

        const isEIP2930 =
          transaction instanceof AccessListEIP2930Transaction && transaction.AccessListJSON != null
        let isSimpleTransfer = false

        let remoteShardusAccount
        let remoteTargetAccount
        appData.requestNewTimestamp = true // force all evm txs to generate a new timestamp

        //if the TX is a contract deploy, predict the new contract address correctly (needs sender's nonce)
        //remote fetch of sender EOA also allows fast balance and nonce checking (assuming we get some queue hints as well from shardus core)
        if (
          ShardeumFlags.txNoncePreCheck ||
          ShardeumFlags.txBalancePreCheck ||
          (transaction.to == null && isEIP2930 === false)
        ) {
          let foundNonce = false
          let foundSender = false
          let nonce = BigInt(0)
          let balance = BigInt(0)
          const txSenderEvmAddr = senderAddress.toString()
          const transformedSourceKey = toShardusAddress(txSenderEvmAddr, AccountType.Account)

          let queueCountResult = undefined
          const maxRetry = 3
          let retry = 0
          if (ShardeumFlags.txNoncePreCheck) {
            while ((!queueCountResult || queueCountResult?.count === -1) && retry < maxRetry) {
              retry++
              queueCountResult = await shardus.getLocalOrRemoteAccountQueueCount(transformedSourceKey)
            }
            if (!queueCountResult || queueCountResult?.count === -1) {
              nestedCountersInstance.countEvent('shardeum', 'Fetching queue count failed')
            }
          }
          retry = 0
          while (remoteShardusAccount == null && retry < maxRetry) {
            if (ShardeumFlags.VerboseLogs)
              if (ShardeumFlags.VerboseLogs)
                console.log(`txPreCrackData: fetching remote account for ${txSenderEvmAddr}, retry: ${retry}`)
            retry++
            // remoteShardusAccount = await shardus
            //   .getLocalOrRemoteAccount(transformedSourceKey)
            //   .then((account) => account.data)
            //   .catch((e) => {
            //     console.error(`txPreCrackData: error fetching remote account for ${txSenderEvmAddr}, retry: ${retry}`, e)
            //   });

            try {
              const account = await shardus.getLocalOrRemoteAccount(transformedSourceKey)
              if (account) {
                remoteShardusAccount = account.data
              }
            } catch (e) {
              console.error(
                `txPreCrackData: error fetching remote account for ${txSenderEvmAddr}, retry: ${retry}`,
                e
              )
            }
          }
          if (remoteShardusAccount == null) {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log( `txPreCrackData: found no local or remote account for address: ${txSenderEvmAddr}, key: ${transformedSourceKey}.` )
            nestedCountersInstance.countEvent('shardeum', 'remoteShardusAccount was empty')
          }

          if (transaction.to) {
            const txTargetEvmAddr = transaction.to.toString()
            const transformedTargetKey = toShardusAddress(txTargetEvmAddr, AccountType.Account)
            remoteTargetAccount = await shardus.getLocalOrRemoteAccount(transformedTargetKey)
          }
          if (ShardeumFlags.txNoncePreCheck) {
            if (ShardeumFlags.VerboseLogs) console.log('queueCountResult:', queueCountResult)
            if (queueCountResult.account) {
              if (ShardeumFlags.VerboseLogs) console.log(queueCountResult.account)
              remoteShardusAccount = queueCountResult.account
            }
          }

          if (remoteShardusAccount == null && isDebugMode() === false) {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData: found no local or remote account for address: ${txSenderEvmAddr}, key: ${transformedSourceKey}. using nonce=0`)
            return {
              status: false,
              reason: `Couldn't find local or remote account for address: ${txSenderEvmAddr}`,
            }
          } else {
            foundSender = true
            const wrappedEVMAccount = remoteShardusAccount as WrappedEVMAccount
            if (wrappedEVMAccount && wrappedEVMAccount.account) {
              fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
              nonce = wrappedEVMAccount.account.nonce
              balance = wrappedEVMAccount.account.balance
              foundNonce = true
            } else {
              if (isDebugMode() === false)
                return { status: false, reason: `Couldn't find account data for address: ${txSenderEvmAddr}` }
            }
          }

          if (remoteTargetAccount == null) {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData: target account not found`)
          } else {
            const wrappedEVMAccount = remoteTargetAccount.data as WrappedEVMAccount
            if (wrappedEVMAccount && wrappedEVMAccount.account) {
              fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
              const codeHashString = bytesToHex(wrappedEVMAccount.account.codeHash)
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
            if (queueCountResult.count === -1) {
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData uanble to get queueCountResult for ${txSenderEvmAddr} queueCountResult:${queueCountResult}`)
              return { status: false, reason: `Unable to get queueCountResult for ${txSenderEvmAddr}` }
            } else {
              appData.queueCount = queueCountResult.count
              appData.nonce = parseInt(nonce.toString())
              if (queueCountResult.committingAppData?.length > 0) {
                const highestCommittingNonce = queueCountResult.committingAppData
                  .map((appData) => appData.txNonce)
                  .sort()[0]
                const expectedAccountNonce = highestCommittingNonce + 1
                if (appData.nonce < expectedAccountNonce) appData.nonce = expectedAccountNonce
              }
              appData.txNonce = parseInt(transaction.nonce.toString(10))
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData found nonce:${foundNonce} found sender:${foundSender} for ${txSenderEvmAddr} nonce:${nonce.toString()} queueCount:${queueCountResult.count.toString()}`)
            }
          }

          // Attach balance to appData
          if (ShardeumFlags.txBalancePreCheck) {
            appData.balance = balance
          }

          //force all EVM transactions including simple ones to generate a timestamp
        }
        let shouldGenerateAccesslist = true
        if (ShardeumFlags.autoGenerateAccessList === false) shouldGenerateAccesslist = false
        else if (isStakeRelatedTx) shouldGenerateAccesslist = false
        else if (isSimpleTransfer) shouldGenerateAccesslist = false
        //else if (remoteShardusAccount == null && appData.newCAAddr == null) shouldGenerateAccesslist = false //resolve which is correct from merge!
        else if (remoteTargetAccount == null && appData.newCAAddr == null) shouldGenerateAccesslist = false

        // dappFeature1enabled is our coin-transfer-only mode. Crack if it calls EVM
        const isCoinTransfer = isSimpleTransfer || (remoteTargetAccount == null && appData.newCAAddr == null)
        if (shardusConfig.features.dappFeature1enabled && !isStakeRelatedTx && !isCoinTransfer) {
          nestedCountersInstance.countEvent('shardeum', 'precrack - coin-transfer-only')
          return {
            status: false,
            reason: `coin-transfer-only mode enabled. Only simple transfers are allowed.`,
          }
        }

        //also run access list generation if needed
        if (shouldGenerateAccesslist) {
          let success = true
          //early pass on balance check to avoid expensive access list generation.
          if (ShardeumFlags.txBalancePreCheck && appData != null) {
            let minBalance: bigint // Calculate the minimun balance with the transaction value added in
            if (ShardeumFlags.chargeConstantTxFee) {
              const minBalanceUsd = BigInt(ShardeumFlags.constantTxFeeUsd)
              minBalance =
                scaleByStabilityFactor(minBalanceUsd, AccountsStorage.cachedNetworkAccount) +
                transaction.value
            } else minBalance = transaction.getUpfrontCost() // tx.gasLimit * tx.gasPrice + tx.value
            const accountBalance = appData.balance
            if (accountBalance < minBalance) {
              success = false
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack balance fail: sender ${senderAddress.toString()} does not have enough balance. Min balance: ${minBalance.toString()}, Account balance: ${accountBalance.toString()}`)
              nestedCountersInstance.countEvent('shardeum', 'precrack - insufficient balance')
              return {
                status: false,
                reason: `Sender Insufficient Balance. Sender: ${senderAddress.toString()}, MinBalance: ${minBalance.toString()}, Account balance: ${accountBalance.toString()}, Difference: ${(minBalance - accountBalance).toString()}`,
              }
            } else {
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack balance pass: sender ${senderAddress.toString()} has balance of ${accountBalance.toString()}`)
            }
          }

          if (ShardeumFlags.txNoncePreCheck && appData != null) {
            const txNonce = parseInt(transaction.nonce.toString(16), 16)
            const perfectCount = appData.nonce + appData.queueCount
            const exactCount = appData.nonce

            if (ShardeumFlags.looseNonceCheck) {
              if (isWithinRange(txNonce, perfectCount, ShardeumFlags.nonceCheckRange)) {
                /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce pass: txNonce:${txNonce} is within +/- ${ShardeumFlags.nonceCheckRange} of perfect nonce ${perfectCount}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${transaction.hash().toString()} `)
              } else {
                success = false
                /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce fail: txNonce:${txNonce} is not within +/- ${ShardeumFlags.nonceCheckRange} of perfect nonce ${perfectCount}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${transaction.hash().toString()} `)
                if (appData.nonce === 0)
                  nestedCountersInstance.countEvent('shardeum', 'precrack - nonce fail')
                return {
                  status: false,
                  reason: `TX Nonce ${txNonce} is not within +/- ${ShardeumFlags.nonceCheckRange} of perfect nonce ${perfectCount}`,
                }
              }
            } else {
              if (txNonce != perfectCount) {
                success = false
                /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce fail: perfectCount:${perfectCount} != ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${transaction.hash().toString()} `)
                return {
                  status: false,
                  reason: `TX Nonce ${txNonce} is not equal to perfect nonce ${perfectCount}`,
                }
              }
            }

            // Exact nonce check
            if (ShardeumFlags.exactNonceCheck) {
              if (txNonce != exactCount) {
                nestedCountersInstance.countEvent('shardeum', 'precrack - exact nonce check fail')
                success = false
                /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack exact nonce check fail: exactCount:${exactCount} != ${txNonce}. current nonce:${appData.nonce} txHash: ${transaction.hash().toString()} `)
                return {
                  status: false,
                  reason: `TX Nonce ${txNonce} is not equal to exact nonce ${exactCount}`,
                }
              }
            }
          }

          if (success === true) {
            const aalgStart = Date.now()
            profilerInstance.scopedProfileSectionStart('accesslist-generate')
            const {
              shardusMemoryPatterns,
              failedAccessList,
              accessList: generatedAccessList,
              codeHashes,
            } = await generateAccessList(tx, appData?.warmupList, 'txPrecrackData')
            profilerInstance.scopedProfileSectionEnd('accesslist-generate')

            console.log(
              `Accesslist Result for tx: ${ethTxId}`,
              generatedAccessList,
              shardusMemoryPatterns,
              codeHashes,
              failedAccessList
            )

            appData.accessList = generatedAccessList ? generatedAccessList : null
            appData.requestNewTimestamp = true
            appData.shardusMemoryPatterns = shardusMemoryPatterns
            appData.codeHashes = codeHashes
            if (failedAccessList) {
              return { status: false, reason: `Failed to generate access list ${Date.now() - aalgStart}` }
            }

            if (appData.accessList && appData.accessList.length > 0) {
              /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum', 'precrack' + ' -' + ' generateAccessList success: true' )
            } else {
              /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum', 'precrack' + ' -' + ' generateAccessList success: false' )
              return { status: false, reason: `Failed to generate access list2 ${Date.now() - aalgStart}` }
            }
          }
        }

        // crack stake related info and attach to appData
        if (isStakeRelatedTx === true) {
          try {
            const networkAccountData: WrappedAccount = await shardus.getLocalOrRemoteAccount(networkAccount)
            appData.internalTx = getStakeTxBlobFromEVMTx(transaction)
            appData.internalTXType = appData.internalTx.internalTXType
            appData.networkAccount = networkAccountData.data
            if (appData.internalTx.stake) appData.internalTx.stake = BigInt(appData.internalTx.stake)
            const nominee = appData.internalTx.nominee
            const nodeAccount: WrappedAccount = await shardus.getLocalOrRemoteAccount(nominee)
            if (nodeAccount) appData.nomineeAccount = nodeAccount.data
            appData.nominatorAccount = remoteShardusAccount
          } catch (e) {
            /* prettier-ignore */ if (logFlags.error) console.log('Error: while doing preCrack for stake related tx', e)
          }
        }
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log( `txPreCrackData final result: txNonce: ${appData.txNonce}, currentNonce: ${ appData.nonce }, queueCount: ${appData.queueCount}, appData ${stringify(appData)}` )
      }
      return { status: true, reason: 'Passed' }
    },

    //@ts-ignore
    crack(timestampedTx, appData) {
      if (ShardeumFlags.VerboseLogs) console.log('Running getKeyFromTransaction', timestampedTx)
      //@ts-ignore
      const { tx } = timestampedTx

      const timestamp: number = getInjectedOrGeneratedTimestamp(timestampedTx)

      let shardusMemoryPatterns = {}
      if (isInternalTx(tx)) {
        const customTXhash = null
        const internalTx = tx as InternalTx
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
          // let now = shardeumGetTime()
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
          // let now = shardeumGetTime()
          // //calculate a time closes to now but rounded to 3 seconds
          // let roundedNow = Math.round(now / 3000) * 3000
          // tx.timestamp = roundedNow
          // customTXhash = crypto.hashObj(tx, true)
        } else if (internalTx.internalTXType === InternalTXType.Penalty) {
          keys.sourceKeys = [tx.reportedNodePublickKey]
          keys.targetKeys = [toShardusAddress(tx.operatorEVMAddress, AccountType.Account), networkAccount]
        }
        keys.allKeys = keys.allKeys.concat(keys.sourceKeys, keys.targetKeys, keys.storageKeys)
        // temporary hack for creating a receipt of node reward tx
        // if (internalTx.internalTXType === InternalTXType.NodeReward) {
        //   if (ShardeumFlags.EVMReceiptsAsAccounts) {
        //     const txId = crypto.hashObj(tx)
        //     keys.allKeys = keys.allKeys.concat([txId]) // For Node Reward Receipt
        //   }
        // }

        const txId = generateTxId(tx)
        if (ShardeumFlags.VerboseLogs) console.log('crack', { timestamp, keys, id: txId })
        return {
          timestamp,
          keys,
          id: customTXhash ?? txId,
          shardusMemoryPatterns: null,
        }
      }
      if (isDebugTx(tx)) {
        const debugTx = tx as DebugTx
        const txId = generateTxId(tx)
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
          id: txId,
          shardusMemoryPatterns: null,
        }
      }
      // isDaoTX() { get addresses and return }

      // it is an EVM transaction
      const rawSerializedTx = tx.raw
      if (rawSerializedTx == null) {
        throw new Error(`Unable to crack EVM transaction. ${JSON.stringify(tx)}`)
      }
      const txId = generateTxId(tx)

      const transaction = getTransactionObj(tx)
      const senderAddress = getTxSenderAddress(transaction, txId).address
      const result = {
        sourceKeys: [],
        targetKeys: [],
        storageKeys: [],
        codeHashKeys: [],
        allKeys: [],
        timestamp: timestamp,
      }
      try {
        const otherAccountKeys = []
        const txSenderEvmAddr = senderAddress.toString()
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
          (appData.internalTXType === InternalTXType.Stake ||
            appData.internalTXType === InternalTXType.Unstake)
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
            const hack0Nonce = BigInt(0)
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
              shardusAddressToEVMAccountInfo.set(shardusAddr, {
                evmAddress: caAddr,
                type: AccountType.Account,
              })
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

              //TODO: we need some new logic that can check each account to try loading each CA "early"
              //and figure so we will at least know the code hash to load
              //probably should also do some work with memory access patterns too.
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
                  evmAddress: storageKey,
                  contractAddress: address,
                  type: AccountType.ContractStorage,
                })
                storageKeys.push(shardusAddr)
              }
              result.storageKeys = result.storageKeys.concat(storageKeys)
            }
          }
        }

        //set keys for code hashes if we have them on app data
        if (appData.codeHashes != null && appData.codeHashes.length > 0) {
          //setting this may be useless seems like we never needed to do anything with codebytes in
          //getRelevantData before
          for (const codeHashObj of appData.codeHashes) {
            const shardusAddr = toShardusAddressWithKey(
              codeHashObj.contractAddress,
              codeHashObj.codeHash,
              AccountType.ContractCode
            )
            result.codeHashKeys.push(shardusAddr)
            shardusAddressToEVMAccountInfo.set(shardusAddr, {
              evmAddress: codeHashObj.codeHash,
              contractAddress: codeHashObj.contractAddress,
              type: AccountType.ContractCode,
            })
          }
        }

        // make sure the receipt address is in the get keys from transaction..
        // This will technically cause an empty account to get created but this will get overriden with the
        // correct values as a result of apply().  There are several ways we could optimize this in the future
        // If a transactions knows a key is for an account that will be created than it does not need to attempt to aquire and share the data
        const additionalAccounts = []
        if (ShardeumFlags.EVMReceiptsAsAccounts) {
          const txHash = bytesToHex(transaction.hash())
          const shardusReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`getKeyFromTransaction: adding tx receipt key: ${shardusReceiptAddress} ts:${(tx as any).timestamp}`)
          additionalAccounts.push(shardusReceiptAddress)
        }

        // insert target keys first. first key in allkeys list will define the execution shard
        // for smart contract calls the contract will be the target.  For simple coin transfers it wont matter
        // insert otherAccountKeys second, because we need the CA addres at the front of the list for contract deploy
        // There wont be a target key in when we deploy a contract
        result.allKeys = result.allKeys.concat(
          result.sourceKeys,
          result.targetKeys,
          otherAccountKeys,
          result.storageKeys,
          additionalAccounts,
          result.codeHashKeys
        )
        if (ShardeumFlags.VerboseLogs) console.log('running getKeyFromTransaction', txId, result)
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
      if (!isServiceMode()) await AccountsStorage.clearAccounts()
    },

    async setAccountData(accountRecords) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Running setAccountData`, accountRecords)
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
        shardus.setDebugSetLastAppAwait(`setAccountData.setAccount(${shardusAddress})`)
        await AccountsStorage.setAccount(shardusAddress, wrappedEVMAccount)
        shardus.setDebugSetLastAppAwait(
          `setAccountData.setAccount(${shardusAddress})`,
          DebugComplete.Completed
        )
      }
    },
    async getRelevantData(accountId, timestampedTx, appData) {
      if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', accountId, timestampedTx, appData)
      //@ts-ignore
      const { tx } = timestampedTx

      if (isInternalTx(tx)) {
        const internalTx = tx as InternalTx

        let accountCreated = false
        //let wrappedEVMAccount = accounts[accountId]
        shardus.setDebugSetLastAppAwait('getRelevantData.AccountsStorage.getAccount 4')
        let wrappedEVMAccount: NetworkAccount | WrappedEVMAccount = await AccountsStorage.getAccount(
          accountId
        )
        shardus.setDebugSetLastAppAwait(
          'getRelevantData.AccountsStorage.getAccount 4',
          DebugComplete.Completed
        )
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
              wrappedEVMAccount = await createNetworkAccount(accountId, config, shardus.p2p.isFirstSeed)
            } else {
              //wrappedEVMAccount = createNodeAccount(accountId) as any
            }
            accountCreated = true
          } else {
            throw Error(`Dev Account already exists`)
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
            // This is the 0000x00000 account
            if (accountId === networkAccount) {
              throw Error(`Network Account is not allowed to sign this ${accountId}`)
            } else if (shardus.getDevPublicKey(accountId)) {
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
              throw Error(`Node Account <nominee> is not found ${accountId}, tx: ${stringify(internalTx)}`)
            } else if (accountId === internalTx.nominator) {
              throw Error(`EVM Account <nominator> is not found ${accountId}`)
            }
          }
        }
        if (!wrappedEVMAccount) {
          throw Error(`Account not found ${accountId}`)
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
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 1`)
        let wrappedEVMAccount = await AccountsStorage.getAccount(accountId)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 1`, DebugComplete.Completed)
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
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Created new debug account', wrappedEVMAccount)
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
      const transaction = getTransactionObj(tx)
      const isStakeRelatedTx: boolean = isStakingEVMTx(transaction)

      if (isStakeRelatedTx) {
        nestedCountersInstance.countEvent('shardeum-staking', 'getRelevantData: isStakeRelatedTx === true')
        const stakeTxBlob: StakeCoinsTX = appData.internalTx
        const txHash = bytesToHex(transaction.hash())

        let accountCreated = false
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 2`)
        const wrappedEVMAccount = await AccountsStorage.getAccount(accountId)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 2`, DebugComplete.Completed)
        if (appData.internalTXType === InternalTXType.Stake) {
          nestedCountersInstance.countEvent('shardeum-staking', 'internalTXType === Stake')
          if (!wrappedEVMAccount) {
            const stakeReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.StakeReceipt)

            // if it is nominee and a stake tx, create 'NodeAccount' if it doesn't exist
            if (accountId === stakeTxBlob.nominee) {
              const nodeAccount: NodeAccount2 = createNodeAccount2(accountId)
              accountCreated = true
              nestedCountersInstance.countEvent('shardeum-staking', 'created new node account')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Created new node account', nodeAccount)
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData for stake/unstake tx', nodeAccount)
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
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData for stake/unstake tx', stakeReceipt)
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
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData for stake/unstake tx', unstakeReceipt)
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
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 3`)
      let wrappedEVMAccount = await AccountsStorage.getAccount(accountId)
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 3`, DebugComplete.Completed)
      let accountCreated = false

      const txId = generateTxId(tx)
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

        //codeHashKeys

        const evmAccountInfo = shardusAddressToEVMAccountInfo.get(accountId)
        let evmAccountID = null
        let accountType = AccountType.Account //assume account ok?
        if (evmAccountInfo != null) {
          evmAccountID = evmAccountInfo.evmAddress
          accountType = evmAccountInfo.type
        }

        const transaction = getTransactionObj(tx)
        const txHash = bytesToHex(transaction.hash())
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
          /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.createAccount(${evmAccountID})`)
          await createAccount(evmAccountID, shardeumState)
          /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.createAccount(${evmAccountID})`, DebugComplete.Completed)

          const address = Address.fromString(evmAccountID)
          /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.shardeumState.getAccount(${evmAccountID})`)
          const account = await shardeumState.getAccount(address)
          /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.shardeumState.getAccount(${evmAccountID})`, DebugComplete.Completed)
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
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log( 'Adding operator account info to wrappedEVMAccount', evmAccountID, stakeCoinsTx.nominator )
            if (evmAccountID === stakeCoinsTx.nominator) {
              wrappedEVMAccount.operatorAccountInfo = {
                stake: BigInt(0),
                nominee: '',
                certExp: 0,
                operatorStats: {
                  totalNodeReward: BigInt(0),
                  totalNodePenalty: BigInt(0),
                  totalNodeTime: 0,
                  history: [],
                  totalUnstakeReward: BigInt(0),
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
        } else if (accountType === AccountType.ContractCode) {
          wrappedEVMAccount = {
            timestamp: 0,
            codeHash: hexToBytes('0x' + evmAccountInfo.evmAddress),
            codeByte: Buffer.from([]),
            ethAddress: evmAccountInfo.evmAddress, // storage key
            contractAddress: evmAccountInfo.contractAddress, // storage key
            hash: '',
            accountType: AccountType.ContractCode,
          }
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Creating new contract bytes account key:${evmAccountID} in contract address ${wrappedEVMAccount.ethAddress}`)
        } else {
          throw new Error(`getRelevantData: invalid account type ${accountType}`)
        }
        WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
        // accounts[accountId] = wrappedEVMAccount //getRelevantData must never modify accounts[]
        accountCreated = true
      }
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData final result for EOA', wrappedEVMAccount)
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
        const dbResults = await AccountsStorage.queryAccountsEntryByRanges(
          accountStart,
          accountEnd,
          maxRecords
        )

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
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitAccount(${addressStr})`)
        await shardeumState._transactionState.commitAccount(addressStr, ethAccount) //yikes this wants an await.
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitAccount(${addressStr})`, DebugComplete.Completed)
      } else if (updatedEVMAccount.accountType === AccountType.ContractStorage) {
        //if ContractAccount?
        const addressStr = updatedEVMAccount.ethAddress
        const key = updatedEVMAccount.key
        const bufferValue = updatedEVMAccount.value
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitContractStorage(${addressStr})`)
        await shardeumState._transactionState.commitContractStorage(addressStr, key, bufferValue)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitContractStorage(${addressStr})`, DebugComplete.Completed)
      } else if (updatedEVMAccount.accountType === AccountType.ContractCode) {
        const contractAddress = updatedEVMAccount.contractAddress
        const codeHash = updatedEVMAccount.codeHash
        const codeByte = updatedEVMAccount.codeByte
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitContractBytes(${contractAddress})`)
        await shardeumState._transactionState.commitContractBytes(contractAddress, codeHash, codeByte)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitContractBytes(${contractAddress})`, DebugComplete.Completed)
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
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`updateAccountFull.AccountsStorage.setAccount(${accountId})`)
      await AccountsStorage.setAccount(accountId, updatedEVMAccount)
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`updateAccountFull.AccountsStorage.setAccount(${accountId})`, DebugComplete.Completed)

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
    async updateAccountPartial(wrappedData, localCache, applyResponse) {
      //I think we may need to utilize this so that shardus is not oblicated to make temporary copies of large CAs
      //
      await this.updateAccountFull(wrappedData, localCache, applyResponse)
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

      /* prettier-ignore */ if (logFlags.dapp_verbose) shardus.log( `getAccountDataByRange: extra:${extra} ${stringify({ accountStart, accountEnd, tsStart, tsEnd, maxRecords, offset, })}` )

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
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getAccountDataByList.AccountsStorage.getAccount(${address})`)
        const wrappedEVMAccount = await AccountsStorage.getAccount(address)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getAccountDataByList.AccountsStorage.getAccount(${address})`, DebugComplete.Completed)
        if (wrappedEVMAccount) {
          const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          results.push(wrapped)
        }
      }
      return results
    },
    async getCachedRIAccountData(addressList) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('getCachedRIAccountData', addressList)
      /* prettier-ignore */ nestedCountersInstance.countEvent('cache', 'getCachedRIAccountData')

      const results = []
      for (const address of addressList) {
        const wrappedEVMAccount = await getCachedRIAccount(address)
        if (wrappedEVMAccount) {
          const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          results.push(wrapped)
          /* prettier-ignore */ nestedCountersInstance.countEvent('cache', 'getCachedRIAccountData-hit')
        }
      }
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('getCachedRIAccountData results', JSON.stringify(results))
      return results
    },
    async setCachedRIAccountData(accountRecords) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('setCachedRIAccountData', accountRecords)

      for (const account of accountRecords) {
        const decodedAccount = account as AccountsEntry
        shardus.setDebugSetLastAppAwait(`setCachedRIAccountData(${decodedAccount.accountId})`)
        setCachedRIAccount(decodedAccount)
        shardus.setDebugSetLastAppAwait(
          `setCachedRIAccountData(${decodedAccount.accountId})`,
          DebugComplete.Completed
        )
      }
    },
    getNetworkAccount,
    async signAppData(
      type: string,
      hash: string,
      nodesToSign: number,
      originalAppData: any
    ): Promise<ShardusTypes.SignAppDataResult> {
      nestedCountersInstance.countEvent('shardeum-staking', 'calling signAppData')
      const appData = fixBigIntLiteralsToBigInt(originalAppData)
      const fail: ShardusTypes.SignAppDataResult = { success: false, signature: null }
      try {
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Running signAppData', type, hash, nodesToSign, appData)

        if (type === 'sign-stake-cert') {
          if (nodesToSign != 5) return fail
          const stakeCert = appData as StakeCert
          if (!stakeCert.nominator || !stakeCert.nominee || !stakeCert.stake || !stakeCert.certExp) {
            nestedCountersInstance.countEvent('shardeum-staking', 'signAppData format failed')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData format failed ${type} ${stringify(stakeCert)} `)
            return fail
          }
          const currentTimestamp = shardeumGetTime()
          if (stakeCert.certExp < currentTimestamp) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData cert expired')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData cert expired ${type} ${stringify(stakeCert)} `)
            return fail
          }
          let minStakeRequiredUsd: bigint
          let minStakeRequired: bigint
          let stakeAmount: bigint
          try {
            minStakeRequiredUsd = _base16BNParser(
              AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
            )
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData' +
            ' stakeRequiredUsd parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequiredUsd parse error ${type} ${stringify(stakeCert)}, cachedNetworkAccount: ${stringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }
          try {
            minStakeRequired = scaleByStabilityFactor(
              minStakeRequiredUsd,
              AccountsStorage.cachedNetworkAccount
            )
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData' +
            ' minStakeRequired parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequired parse error ${type} ${stringify(stakeCert)}, cachedNetworkAccount: ${stringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }
          try {
            stakeAmount = _base16BNParser(stakeCert.stake)
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData' +
            ' stakeAmount parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData stakeAmount parse error ${type} ${stringify(stakeCert)}`)
            return fail
          }
          if (stakeAmount < minStakeRequired) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData stake amount lower than required')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData stake amount lower than required ${type} ${stringify(stakeCert)} `)
            return fail
          }
          if (ShardeumFlags.FullCertChecksEnabled) {
            const nominatorAddress = toShardusAddress(stakeCert.nominator, AccountType.Account)
            const nominatorAccount = await shardus.getLocalOrRemoteAccount(nominatorAddress)
            if (!nominatorAccount) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'could not find nominator account')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`could not find nominator account ${type} ${stringify(stakeCert)} `)
              return fail
            }
            const nominatorEVMAccount = nominatorAccount.data as WrappedEVMAccount
            fixDeserializedWrappedEVMAccount(nominatorEVMAccount)
            nominatorEVMAccount.operatorAccountInfo = fixBigIntLiteralsToBigInt(
              nominatorEVMAccount.operatorAccountInfo
            )
            if (!nominatorEVMAccount.operatorAccountInfo) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'operatorAccountInfo missing from nominator')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`operatorAccountInfo missing from nominator ${type} ${stringify(stakeCert)} `)
              return fail
            }
            if (stakeCert.stake != nominatorEVMAccount.operatorAccountInfo.stake) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'operatorAccountInfo missing from nominator')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`stake amount in cert and operator account does not match ${type} ${stringify(stakeCert)} ${stringify(nominatorEVMAccount)} `)
              return fail
            }
            if (stakeCert.nominee != nominatorEVMAccount.operatorAccountInfo.nominee) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'nominee in cert and operator account does not match')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`nominee in cert and operator account does not match ${type} ${stringify(stakeCert)} ${stringify(nominatorEVMAccount)} `)
              return fail
            }
          }
          delete stakeCert.sign
          delete stakeCert.signs
          const signedCert: StakeCert = shardus.signAsNode(stakeCert)
          const result: ShardusTypes.SignAppDataResult = { success: true, signature: signedCert.sign }
          if (ShardeumFlags.VerboseLogs) console.log(`signAppData passed ${type} ${stringify(stakeCert)}`)
          nestedCountersInstance.countEvent('shardeum-staking', 'sign-stake-cert - passed')
          return result
        } else if (type === 'sign-remove-node-cert') {
          if (nodesToSign != 5) return fail
          const removeNodeCert = appData as RemoveNodeCert
          if (!removeNodeCert.nodePublicKey || !removeNodeCert.cycle) {
            nestedCountersInstance.countEvent('shardeum-remove-node', 'signAppData format failed')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData format failed ${type} ${stringify(removeNodeCert)} `)
            return fail
          }
          const latestCycles = shardus.getLatestCycles()
          const currentCycle = latestCycles[0]
          if (!currentCycle) {
            /* prettier-ignore */ if (logFlags.error) console.log('No cycle records found', latestCycles)
            return fail
          }
          if (removeNodeCert.cycle !== currentCycle.counter) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'cycle in cert does not match current cycle')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`cycle in cert does not match current cycle ${type} ${stringify(removeNodeCert)}, current: ${currentCycle.counter}`)
            return fail
          }
          let minStakeRequiredUsd: bigint
          let minStakeRequired: bigint
          let stakeAmount: bigint
          try {
            minStakeRequiredUsd = _base16BNParser(
              AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
            )
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'signAppData' +
              ' stakeRequiredUsd parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequiredUsd parse error ${type} ${stringify(removeNodeCert)}, cachedNetworkAccount: ${stringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }
          try {
            minStakeRequired = scaleByStabilityFactor(
              minStakeRequiredUsd,
              AccountsStorage.cachedNetworkAccount
            )
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'signAppData' +
              ' minStakeRequired parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequired parse error ${type} ${stringify(removeNodeCert)}, cachedNetworkAccount: ${stringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }

          let remoteShardusAccount
          try {
            remoteShardusAccount = await shardus.getLocalOrRemoteAccount(removeNodeCert.nodePublicKey)
            if (!isNodeAccount2(remoteShardusAccount.data)) {
              /* prettier-ignore */
              nestedCountersInstance.countEvent('shardeum-remove-node', 'nodePublicKey is not a node account')
              /* prettier-ignore */
              if (ShardeumFlags.VerboseLogs) console.log(`nodePublicKey is not a node account ${type} ${stringify(removeNodeCert)}, cachedNetworkAccount: ${stringify(AccountsStorage.cachedNetworkAccount)} `)
              return fail
            }
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'signAppData' +
              ' minStakeRequired parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequired parse error ${type} ${stringify(removeNodeCert)}, cachedNetworkAccount: ${stringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }
          const nodeAccount = remoteShardusAccount.data as NodeAccount2
          if (isLowStake(nodeAccount) === false) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'node locked stake is not below minStakeRequired')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`node locked stake is not below minStakeRequired ${type} ${stringify(removeNodeCert)}, cachedNetworkAccount: ${stringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }

          const signedCert: RemoveNodeCert = shardus.signAsNode(removeNodeCert)
          const result: ShardusTypes.SignAppDataResult = { success: true, signature: signedCert.sign }
          if (ShardeumFlags.VerboseLogs)
            console.log(`signAppData passed ${type} ${stringify(removeNodeCert)}`)
          nestedCountersInstance.countEvent('shardeum-staking', 'sign-stake-cert - passed')
          return result
        }
      } catch (e) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData failed: ${type} ${stringify(stakeCert)}, error: ${stringify(e)}`)
        nestedCountersInstance.countEvent('shardeum-staking', 'sign-stake-cert - fail uncaught')
      }
      return fail
    },
    getAccountDebugValue(wrappedAccount) {
      return `${stringify(wrappedAccount)}`
    },
    getSimpleTxDebugValue(timestampedTx) {
      //console.log(`getSimpleTxDebugValue: ${stringify(tx)}`)

      try {
        //@ts-ignore
        const { tx } = timestampedTx
        if (isInternalTx(tx)) {
          const internalTx = tx as InternalTx
          return `internalTX: ${InternalTXType[internalTx.internalTXType]} `
        }
        if (isDebugTx(tx)) {
          const debugTx = tx as DebugTx
          return `debugTX: ${DebugTXType[debugTx.debugTXType]}`
        }
        const transaction = getTransactionObj(tx)
        if (transaction && isStakingEVMTx(transaction)) {
          return `stakingEVMtx`
        }
        if (transaction) {
          return `EVMtx`
        }
      } catch (e) {
        //@ts-ignore
        const { tx } = timestampedTx
        /* prettier-ignore */ if (logFlags.error) console.log(`getSimpleTxDebugValue failed: ${formatErrorMessage(e)}  tx:${stringify(tx)}`)
      }
    },
    close: async (): Promise<void> => {
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
      timestampedTx: ShardusTypes.OpaqueTransaction,
      wrappedStates: { [id: string]: WrappedAccount },
      applyResponse: ShardusTypes.ApplyResponse
    ) {
      //@ts-ignore
      const { tx } = timestampedTx
      const txId: string = generateTxId(tx)

      //This next log is usefull but very heavy on the output lines:
      //Updating to be on only with verbose logs
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('running transactionReceiptPass', txId, tx, wrappedStates, applyResponse)
      _transactionReceiptPass(tx, txId, wrappedStates, applyResponse)

      //clear this out of the shardeum state map
      if (shardeumStateTXMap.has(txId)) {
        shardeumStateTXMap.delete(txId)
      }
    },
    transactionReceiptFail(
      timestampedTx: ShardusTypes.OpaqueTransaction,
      wrappedStates: { [id: string]: WrappedAccount },
      applyResponse?: ShardusTypes.ApplyResponse
    ) {
      if (ShardeumFlags.expiredTransactionStateFix === false) return
      if (ShardeumFlags.VerboseLogs)
        console.log('running transactionReceiptFail', timestampedTx, wrappedStates, applyResponse)
      //@ts-ignore
      const { tx } = timestampedTx
      const txId: string = generateTxId(tx)

      //clear this out of the shardeum state map
      if (shardeumStateTXMap.has(txId)) {
        if (ShardeumFlags.VerboseLogs)
          console.log('transactionReceiptFail: deleting txId from shardeumStateTXMap', txId)
        shardeumStateTXMap.delete(txId)
      }
    },
    getJoinData() {
      nestedCountersInstance.countEvent('shardeum-staking', 'calling getJoinData')
      const joinData: AppJoinData = {
        version,
        stakeCert,
        adminCert,
        mustUseAdminCert,
      }
      return joinData
    },
    validateJoinRequest(
      data,
      mode: P2P.ModesTypes.Record['mode'] | null,
      latestCycle: ShardusTypes.Cycle,
      minNodes: number
    ) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest minNodes: ${minNodes}, active: ${latestCycle.active}, syncing ${latestCycle.syncing}, mode: ${mode}, flag: ${ShardeumFlags.AdminCertEnabled}`)

      try {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest ${stringify(data)}`)
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
            reason: `version number is old. minVersion is ${minVersion}. Join request node app version is ${appJoinData.version}`,
            fatal: true,
          }
        }

        const latestVersion = AccountsStorage.cachedNetworkAccount.current.latestVersion

        if (
          latestVersion &&
          appJoinData.version &&
          !isEqualOrOlderVersion(latestVersion, appJoinData.version)
        ) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: version number is newer than latest`)
          return {
            success: false,
            reason: `version number is newer than latest. The latest allowed app version is ${latestVersion}. Join request node app version is ${appJoinData.version}`,
            fatal: true,
          }
        }

        const numActiveNodes = latestCycle.active
        const numTotalNodes = latestCycle.active + latestCycle.syncing // total number of nodes in the network

        // Staking is only enabled when flag is on and
        const stakingEnabled =
          ShardeumFlags.StakingEnabled && numActiveNodes >= ShardeumFlags.minActiveNodesForStaking

        //Checks for golden ticket
        if (appJoinData.adminCert?.goldenTicket === true && appJoinData.mustUseAdminCert === true) {
          const adminCert: AdminCert = appJoinData.adminCert
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest: Golden ticket is enabled, node about to enter processing check')

          const currentTimestamp = Date.now()
          if (!adminCert || adminCert.certExp < currentTimestamp) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: !adminCert || adminCert.certExp < currentTimestamp')
            return {
              success: false,
              reason: 'No admin cert found in mode: ' + mode,
              fatal: false,
            }
          }
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest: adminCert ${JSON.stringify(adminCert)}`)

          // check for adminCert nominee
          const nodeAcc = data.sign.owner
          if (nodeAcc !== adminCert.nominee) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: nodeAcc !== adminCert.nominee')
            return {
              success: false,
              reason: 'Nominator mismatch',
              fatal: true,
            }
          }
          const pkClearance = shardus.getDevPublicKey(adminCert.sign.owner)
          // check for invalid signature for AdminCert
          if (pkClearance == null) {
            return {
              success: false,
              reason: 'Unauthorized! no getDevPublicKey defined',
              fatal: true,
            }
          }
          if (
            pkClearance &&
            (!shardus.crypto.verify(adminCert, pkClearance) ||
              shardus.ensureKeySecurity(pkClearance, DevSecurityLevel.High) === false)
          ) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: !shardus.crypto.verify(adminCert, shardus.getDevPublicKeyMaxLevel())')
            return {
              success: false,
              reason: 'Invalid signature for AdminCert',
              fatal: true,
            }
          }
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest success: adminCert')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateJoinRequest success: adminCert')
          return {
            success: true,
            reason: 'Join Request validated',
            fatal: false,
          }
        }

        // if condition true and if none of this triggers it'll go past the staking checks and return true...
        if (
          stakingEnabled &&
          ShardeumFlags.AdminCertEnabled === true &&
          mode !== 'processing' &&
          numTotalNodes < minNodes //if node is about to enter processing check for stake as expected not admin cert
        ) {
          const adminCert: AdminCert = appJoinData.adminCert
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest: mode is not processing, AdminCertEnabled enabled, node about to enter processing check')

          const currentTimestamp = shardeumGetTime()
          if (!adminCert || adminCert.certExp < currentTimestamp) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: !adminCert || adminCert.certExp < currentTimestamp')
            return {
              success: false,
              reason: 'No admin cert found in mode: ' + mode,
              fatal: false,
            }
          }
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest: adminCert ${JSON.stringify(adminCert)}`)

          // check for adminCert nominee
          const nodeAcc = data.sign.owner
          if (nodeAcc !== adminCert.nominee) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: nodeAcc !== adminCert.nominee')
            return {
              success: false,
              reason: 'Nominator mismatch',
              fatal: true,
            }
          }

          const pkClearance = shardus.getDevPublicKey(adminCert.sign.owner)
          // check for invalid signature for AdminCert
          if (pkClearance == null) {
            return {
              success: false,
              reason: 'Unauthorized! no getDevPublicKey defined',
              fatal: true,
            }
          }
          if (
            pkClearance &&
            (!shardus.crypto.verify(adminCert, pkClearance) ||
              shardus.ensureKeySecurity(pkClearance, DevSecurityLevel.High) === false)
          ) {
            // check for invalid signature for AdminCert
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: !shardus.crypto.verify(adminCert, shardus.getDevPublicKeyMaxLevel())')
            return {
              success: false,
              reason: 'Invalid signature for AdminCert',
              fatal: true,
            }
          }
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest success: adminCert')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateJoinRequest success: adminCert')
          return {
            success: true,
            reason: 'Join Request validated',
            fatal: false,
          }
        }

        if (
          (ShardeumFlags.ModeEnabled === true && mode === 'processing' && stakingEnabled) ||
          (ShardeumFlags.ModeEnabled === false && stakingEnabled)
        ) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validating join request with staking enabled')

          if (appJoinData.mustUseAdminCert) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: appJoinData.mustUseAdminCert')
            return {
              success: false,
              reason: 'Join Request wont have a stake certificate',
              fatal: false,
            }
          }

          const nodeAcc = data.sign.owner
          const stake_cert: StakeCert = appJoinData.stakeCert
          if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest ${stringify(stake_cert)}`)

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
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: tx_time > stake_cert.certExp ${tx_time} > ${stake_cert.certExp}`)
            return {
              success: false,
              reason: `Certificate has expired at ${stake_cert.certExp}`,
              fatal: false,
            }
          }

          const serverConfig = config.server
          const two_cycle_ms = serverConfig.p2p.cycleDuration * 2 * 1000

          // stake certification should not expired for at least 2 cycle.
          if (shardeumGetTime() + two_cycle_ms > stake_cert.certExp) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: cert expires soon')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: cert expires soon ${shardeumGetTime() + two_cycle_ms} > ${stake_cert.certExp}`)
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

          if (stakedAmount < minStakeRequired) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: stake_cert.stake < minStakeRequired')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: stake_cert.stake < minStakeRequired ${_readableSHM(stakedAmount)} < ${_readableSHM(minStakeRequired)}`)
            return {
              success: false,
              reason: `Minimum stake amount requirement does not meet.`,
              fatal: false,
            }
          }

          const requiredSig = getNodeCountForCertSignatures()
          const { success, reason } = shardus.validateClosestActiveNodeSignatures(
            stake_cert,
            stake_cert.signs,
            requiredSig,
            5,
            2
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
    validateArchiverJoinRequest(data) {
      try {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest ${JSON.stringify(data)}`)
        if (!data.appData) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest fail: !data.appData`)
          return {
            success: false,
            reason: `Join request Archiver doesn't provide the app data (appData).`,
            fatal: true,
          }
        }
        const { appData } = data
        const { minVersion } = AccountsStorage.cachedNetworkAccount.current.archiver
        if (!isEqualOrNewerVersion(minVersion, appData.version)) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest() fail: old version`)
          return {
            success: false,
            reason: `Archiver Version number is old. Our Archiver version is: ${devDependencies['@shardus/archiver']}. Join Archiver app version is ${appData.version}`,
            fatal: true,
          }
        }

        const { latestVersion } = AccountsStorage.cachedNetworkAccount.current.archiver
        if (latestVersion && appData.version && !isEqualOrOlderVersion(latestVersion, appData.version)) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest() fail: version number is newer than latest`)
          return {
            success: false,
            reason: `Archiver Version number is newer than latest. The latest allowed Archiver version is ${latestVersion}. Join Archiver app version is ${appData.version}`,
            fatal: true,
          }
        }
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest() Successful!`)
        return {
          success: true,
          reason: 'Archiver-Join Request Validated!',
          fatal: false,
        }
      } catch (e) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest exception: ${e}`)
        return {
          success: false,
          reason: `validateArchiverJoinRequest fail: exception: ${e}`,
          fatal: true,
        }
      }
    },
    // Update the activeNodes type here; We can import from P2P.P2PTypes.Node from '@shardus/type' lib but seems it's not installed yet
    async isReadyToJoin(
      latestCycle: ShardusTypes.Cycle,
      publicKey: string,
      activeNodes: P2P.P2PTypes.Node[],
      mode: P2P.ModesTypes.Record['mode']
    ): Promise<boolean> {
      const currentTime = Date.now()
      let networkAccount = null
      if (currentTime < cacheExpirationTimestamp && cachedNetworkAccount) {
        // Use cached result if it's still valid
        networkAccount = cachedNetworkAccount
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`isReadyToJoin using cached network account ${JSON.stringify(networkAccount)}`)
      } else {
        // Fetch new network account data
        networkAccount = await fetchNetworkAccountFromArchiver()
        // Update cache with new result
        cachedNetworkAccount = networkAccount
        cacheExpirationTimestamp = currentTime + ShardeumFlags.networkAccountCacheDuration * 1000
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`isReadyToJoin fetched new network account ${JSON.stringify(networkAccount)}`)
      }

      if (initialNetworkParamters && networkAccount) {
        if (
          !isValidVersion(
            networkAccount.data.current.minVersion,
            networkAccount.data.current.latestVersion,
            version
          )
        ) {
          const tag = 'version out-of-date; please update and restart'
          const message = 'node version is out-of-date; please update node to latest version'
          shardus.shutdownFromDapp(tag, message, false)
          return false
        }
      }

      isReadyToJoinLatestValue = false
      mustUseAdminCert = false

      //process golden ticket first
      if (adminCert && adminCert.certExp > Date.now() && adminCert?.goldenTicket === true) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Join req with admincert and golden ticket')
        isReadyToJoinLatestValue = true
        mustUseAdminCert = true
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'goldenTicket available, isReadyToJoin = true')
        return true
      }

      if (ShardeumFlags.StakingEnabled === false) {
        isReadyToJoinLatestValue = true
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'staking disabled, isReadyToJoin = true')
        return true
      }

      const numTotalNodes = latestCycle.active + latestCycle.syncing // total number of nodes in the network
      if (numTotalNodes < ShardeumFlags.minActiveNodesForStaking) {
        isReadyToJoinLatestValue = true
        /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum-staking', 'numTotalNodes < ShardeumFlags.minActiveNodesForStaking, isReadyToJoin = true' )
        return true
      }
      /* prettier-ignore */ if (logFlags.important_as_error) console.log( `active: ${latestCycle.active}, syncing: ${latestCycle.syncing}, flag: ${ShardeumFlags.AdminCertEnabled}` )
      // check for ShardeumFlags for mode + check if mode is not equal to processing and validate adminCert
      if (ShardeumFlags.AdminCertEnabled === true && mode !== 'processing') {
        /* prettier-ignore */ if (logFlags.important_as_error) console.log('entered admin cert conditon mode:' + mode)
        if (adminCert) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`checkAdminCert ${JSON.stringify(adminCert)}`)
          if (adminCert.certExp > shardeumGetTime()) {
            isReadyToJoinLatestValue = true
            mustUseAdminCert = true
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'valid admin cert, isReadyToJoin = true')
            /* prettier-ignore */ if (logFlags.important_as_error) console.log('valid admin cert, isReadyToJoin = true')
            return true
          } else {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'adminCert present but expired, this blocks joining')
            /* prettier-ignore */ if (logFlags.important_as_error) console.log('admin cert present but expired, this blocks joining')
            return false
          }
        }
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'adminCert expected not ready to join, this blocks joining')
        /* prettier-ignore */ if (logFlags.important_as_error) console.log('admin cert required but missing, this blocks joining')
        return false // this will stop us from joining the normal way
      }
      if (ShardeumFlags.AdminCertEnabled === true && mode === 'processing') {
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'AdminCertEnabled=true but mode is processing')
      }
      if (adminCert && !ShardeumFlags.AdminCertEnabled) {
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'adminCert present but AdminCertEnabled=false')
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest: AdminCert available but not utilized due to configuration`)
      }

      /* prettier-ignore */ if (logFlags.important_as_error) console.log(`Running isReadyToJoin cycle:${latestCycle.counter} publicKey: ${publicKey}`)
      // handle first time staking setup
      if (lastCertTimeTxTimestamp === 0) {
        // inject setCertTimeTx for the first time
        /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum-staking', 'lastCertTimeTxTimestamp === 0 first time or expired' )

        const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
        if (response == null) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 1 reason: response is null`)
          return false
        }
        if (!response.success) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 1 reason: ${(response as ValidatorError).reason}`)
          return false
        }

        // set lastCertTimeTxTimestamp and cycle
        lastCertTimeTxTimestamp = shardeumGetTime()
        lastCertTimeTxCycle = latestCycle.counter

        // return false and query/check again in next cycle
        return false
      }

      const isCertTimeExpired =
        lastCertTimeTxCycle > 0 && latestCycle.counter - lastCertTimeTxCycle > getCertCycleDuration()
      if (isCertTimeExpired) {
        nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert expired and need to be renewed')
        if (ShardeumFlags.fixCertExpRenew) {
          const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
          if (response == null) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: response is null`)
            return false
          }
          if (!response.success) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: ${(response as ValidatorError).reason}`)
            return false
          }
          stakeCert = null //clear stake cert, so we will know to query for it again
          // set lastCertTimeTxTimestamp and cycle
          lastCertTimeTxTimestamp = shardeumGetTime()
          lastCertTimeTxCycle = latestCycle.counter
          // return false and query/check again in next cycle
          return false
        }
      }

      //if we have stakeCert, check its time
      if (stakeCert != null) {
        nestedCountersInstance.countEvent('shardeum-staking', `stakeCert is not null`)

        const remainingValidTime = stakeCert.certExp - shardeumGetTime()
        const certStartTimestamp =
          stakeCert.certExp - getCertCycleDuration() * ONE_SECOND * latestCycle.duration
        const certEndTimestamp = stakeCert.certExp
        const expiredPercentage =
          (shardeumGetTime() - certStartTimestamp) / (certEndTimestamp - certStartTimestamp)
        const isExpiringSoon = expiredPercentage >= (ShardeumFlags.fixCertExpTiming ? 0.7 : 0.9) // only renew
        // if the cert is expired 70% or more
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`cert != null, remainingValidTime: ${remainingValidTime}, expiredPercentage: ${expiredPercentage}, isExpiringSoon: ${isExpiringSoon}`)

        if (isExpiringSoon) {
          nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert is expired or expiring soon')
          if (ShardeumFlags.fixSetCertTimeTxApply === false) {
            stakeCert = null //clear stake cert, so we will know to query for it again
          }
          const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
          if (response == null) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: response is null`)
            return false
          }
          if (!response.success) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: ${(response as ValidatorError).reason}`)
            return false
          }
          if (ShardeumFlags.fixSetCertTimeTxApply === true) {
            stakeCert = null //clear stake cert, so we will know to query for it again
          }
          lastCertTimeTxTimestamp = shardeumGetTime()
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
          /* prettier-ignore */ if (logFlags.important_as_error) { console.log('valid cert, isReadyToJoin = true ', stakeCert) }

          isReadyToJoinLatestValue = true
          return true
        }
      }
      //if stake cert is null and we have set cert time before then query for the cert
      if (lastCertTimeTxTimestamp > 0 && stakeCert == null) {
        // we have already submitted setCertTime
        // query the certificate from the network
        const res = await queryCertificate(shardus, publicKey, activeNodes)
        /* prettier-ignore */ if (logFlags.important_as_error) console.log('queryCertificate', res)
        if (!res.success) {
          if (ShardeumFlags.fixSetCertTimeTxApply === false) {
            //old logic
            if ((res as ValidatorError).reason === 'Operator certificate has expired') {
              //force a set cert time next cycle, this should not be needed
              lastCertTimeTxTimestamp = 0
              lastCertTimeTxCycle = 0
            }

            if ((res as ValidatorError).reason === 'Operator certificate time is null') {
              lastCertTimeTxTimestamp = 0
              lastCertTimeTxCycle = 0
            }
          }

          /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum-staking', `call to queryCertificate failed with reason: ${(res as ValidatorError).reason}` )

          if (ShardeumFlags.fixCertExpTiming) {
            // if we injected setCertTimeTx more than 3 cycles ago but still cannot get new cert, we need to inject it again
            if (
              latestCycle.counter - lastCertTimeTxCycle > 3 ||
              shardeumGetTime() - lastCertTimeTxTimestamp > 3 * ONE_SECOND * latestCycle.duration
            ) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `call to queryCertificate failed for 3 consecutive cycles, will inject setCertTimeTx again`)
              lastCertTimeTxTimestamp = 0
            }
          }

          return false
        }
        const signedStakeCert = (res as CertSignaturesResult).signedStakeCert
        if (signedStakeCert == null) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `signedStakeCert is null`)
          return false
        }
        const remainingValidTime = signedStakeCert.certExp - shardeumGetTime()

        const certStartTimestamp =
          signedStakeCert.certExp - getCertCycleDuration() * ONE_SECOND * latestCycle.duration
        const certEndTimestamp = signedStakeCert.certExp
        const expiredPercentage =
          (shardeumGetTime() - certStartTimestamp) / (certEndTimestamp - certStartTimestamp)
        const isNewCertExpiringSoon = expiredPercentage >= 0.7
        /* prettier-ignore */ if (logFlags.important_as_error) console.log(`stakeCert received. remainingValidTime: ${remainingValidTime} expiredPercent: ${expiredPercentage}, isNewCertExpiringSoon: ${isNewCertExpiringSoon}`)

        // if queried cert is going to expire soon, inject a new setCertTimeTx
        if (isNewCertExpiringSoon) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'new stakeCert is expiring soon. will inject' + ' setCertTimeTx again')

          stakeCert = null //clear stake cert, so we will know to query for it again
          const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
          if (response == null) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 3 reason: response is null`)
            return false
          }
          if (!response.success) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 3 reason: ${(response as ValidatorError).reason}`)
            return false
          }

          lastCertTimeTxTimestamp = shardeumGetTime()
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
          /* prettier-ignore */ if (logFlags.important_as_error) console.log('valid cert, isReadyToJoin = true ', stakeCert)

          isReadyToJoinLatestValue = true
          return true
        }
      }
    },
    getNodeInfoAppData() {
      let minVersion = ''
      let activeVersion = ''
      let latestVersion = ''
      const cachedNetworkAccount = AccountsStorage.cachedNetworkAccount
      if (cachedNetworkAccount) {
        minVersion = cachedNetworkAccount.current.minVersion
        activeVersion = cachedNetworkAccount.current.activeVersion
        latestVersion = cachedNetworkAccount.current.latestVersion
      }
      const shardeumNodeInfo: NodeInfoAppData = {
        shardeumVersion: version,
        minVersion,
        activeVersion,
        latestVersion,
        operatorCLIVersion,
        operatorGUIVersion,
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
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('This node is not active yet')
        return
      }

      const eventType = data.type
      nestedCountersInstance.countEvent('eventNotify', `eventType: ${eventType}`)

      // Waiting a bit here to make sure that shardus.getLatestCycles gives the latest cycle
      await sleep(1000)
      const latestCycles: ShardusTypes.Cycle[] = shardus.getLatestCycles(10)
      const currentCycle = latestCycles[0]
      if (!currentCycle) {
        /* prettier-ignore */ if (logFlags.error) console.log('No cycle records found', latestCycles)
        return
      }

      // TODO: see if it's fine; what if getClosestNodes gives only recently activatd nodes
      // skip if this node is also activated in the same cycle
      const currentlyActivatedNode = currentCycle.activated.includes(nodeId)
      if (currentlyActivatedNode) return

      if (eventType === 'node-activated') {
        const activeNodesCount = currentCycle.active
        const stakingEnabled = activeNodesCount >= ShardeumFlags.minActiveNodesForStaking
        // Skip initRewardTimes if activeNodesCount is less than minActiveNodesForStaking
        if (!stakingEnabled) {
          return
        }
        nestedCountersInstance.countEvent('shardeum-staking', `node-activated: injectInitRewardTimesTx`)

        //TODO need retry on this also
        // Limit the nodes that send this to the 5 closest to the node id
        const closestNodes = shardus.getClosestNodes(data.publicKey, 5)
        const ourId = shardus.getNodeId()
        for (const id of closestNodes) {
          if (id === ourId) {
            const result = await InitRewardTimesTx.injectInitRewardTimesTx(shardus, data)
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('INJECTED_INIT_REWARD_TIMES_TX', result)
          }
        }
      } else if (eventType === 'node-deactivated') {
        // todo: aamir check the timestamp and cycle the first time we see this event
        nestedCountersInstance.countEvent('shardeum-staking', `node-deactivated: injectClaimRewardTx`)

        // Limit the nodes that send this to the 5 closest to the node id
        const closestNodes = shardus.getClosestNodes(data.publicKey, 5)
        const ourId = shardus.getNodeId()
        for (const id of closestNodes) {
          if (id === ourId) {
            const result = await injectClaimRewardTxWithRetry(shardus, data)
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('INJECTED_CLAIM_REWARD_TX', result)
          }
        }
      } else if (
        eventType === 'node-left-early' &&
        ShardeumFlags.enableNodeSlashing === true &&
        ShardeumFlags.enableLeftNetworkEarlySlashing
      ) {
        let nodeLostCycle
        let nodeDroppedCycle
        for (let i = 0; i < latestCycles.length; i++) {
          const cycle = latestCycles[i]
          if (cycle == null) continue
          if (cycle.apoptosized.includes(data.nodeId)) {
            nodeDroppedCycle = cycle.counter
          } else if (cycle.lost.includes(data.nodeId)) {
            nodeLostCycle = cycle.counter
          }
        }
        if (nodeLostCycle && nodeDroppedCycle && nodeLostCycle < nodeDroppedCycle) {
          const violationData: LeftNetworkEarlyViolationData = {
            nodeLostCycle,
            nodeDroppedCycle,
            nodeDroppedTime: data.time,
          }
          nestedCountersInstance.countEvent('shardeum-staking', `node-left-early: injectPenaltyTx`)

          // Limit the nodes that send this to the 5 closest to the node id
          const closestNodes = shardus.getClosestNodes(data.nodeId, 5)
          const ourId = shardus.getNodeId()
          for (const id of closestNodes) {
            if (id === ourId) {
              const result = await PenaltyTx.injectPenaltyTX(shardus, data, violationData)
              /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('INJECTED_PENALTY_TX', result)
            }
          }
        } else {
          nestedCountersInstance.countEvent('shardeum-staking', `node-left-early: event skipped`)
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Shardeum node-left-early event skipped`, data, nodeLostCycle, nodeDroppedCycle)
        }
      } else if (
        eventType === 'node-sync-timeout' &&
        ShardeumFlags.enableNodeSlashing === true &&
        ShardeumFlags.enableSyncTimeoutSlashing
      ) {
        const violationData: SyncingTimeoutViolationData = {
          nodeLostCycle: data.cycleNumber,
          nodeDroppedTime: data.time,
        }
        nestedCountersInstance.countEvent('shardeum-staking', `node-sync-timeout: injectPenaltyTx`)

        // Limit the nodes that send this to the 5 closest to the node id
        const closestNodes = shardus.getClosestNodes(data.nodeId, 5)
        const ourId = shardus.getNodeId()
        for (const id of closestNodes) {
          if (id === ourId) {
            const result = await PenaltyTx.injectPenaltyTX(shardus, data, violationData)
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('INJECTED_PENALTY_TX', result)
          }
        }
      } else if (
        eventType === 'node-refuted' &&
        ShardeumFlags.enableNodeSlashing === true &&
        ShardeumFlags.enableNodeRefutedSlashing
      ) {
        let nodeRefutedCycle
        for (let i = 0; i < latestCycles.length; i++) {
          const cycle = latestCycles[i]
          if (cycle == null) continue
          if (cycle.refuted.includes(data.nodeId)) {
            nodeRefutedCycle = cycle.counter
          }
        }
        if (nodeRefutedCycle === data.cycleNumber) {
          const violationData: NodeRefutedViolationData = {
            nodeRefutedCycle: nodeRefutedCycle,
            nodeRefutedTime: data.time,
          }
          nestedCountersInstance.countEvent('shardeum-staking', `node-refuted: injectPenaltyTx`)

          // Limit the nodes that send this to the 5 closest to the node id
          const closestNodes = shardus.getClosestNodes(data.nodeId, 5)
          const ourId = shardus.getNodeId()
          for (const id of closestNodes) {
            if (id === ourId) {
              const result = await PenaltyTx.injectPenaltyTX(shardus, data, violationData)
              /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('INJECTED_PENALTY_TX', result)
            }
          }
        } else {
          nestedCountersInstance.countEvent('shardeum-staking', `node-refuted: event skipped`)
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Shardeum node-refuted event skipped`, data, nodeRefutedCycle)
        }
      }
    },
    async updateNetworkChangeQueue(account: WrappedAccount, appData: any) {
      /* eslint-disable security/detect-object-injection */
      if (account.accountId === networkAccount) {
        const networkAccount: NetworkAccount = account.data
        await this.patchAndUpdate(networkAccount.current, appData)
        //Never ok to use Date.now() or any non consensed time for an account timestamp this needs to be deterministic
        account.timestamp = Date.now()
        networkAccount.hash = WrappedEVMAccountFunctions._calculateAccountHash(networkAccount)
        account.stateId = networkAccount.hash
        return [account]
      }
      /* eslint-enable security/detect-object-injection */
    },
    async patchAndUpdate(existingObject: any, changeObj: any, parentPath: '') {
      /* eslint-disable security/detect-object-injection */
      for (const [key, value] of Object.entries(changeObj)) {
        if (existingObject[key] != null) {
          if (typeof value === 'object') {
            await this.patchAndUpdate(
              existingObject[key],
              value,
              (parentPath === '' ? '' : parentPath + '.') + key
            )
          } else {
            if (key === 'activeVersion') {
              await onActiveVersionChange(value as string)
            }
            existingObject[key] = value
          }
        }
      }
      /* eslint-enable security/detect-object-injection */
    },
    async pruneNetworkChangeQueue(account: WrappedAccount, currentCycle: number) {
      if (account.accountId === networkAccount) {
        /* eslint-disable security/detect-object-injection */
        const networkAccount: NetworkAccount = account.data
        const listOfChanges = account.data.listOfChanges

        const configsMap = new Map()
        const keepAliveCount = shardusConfig.stateManager.configChangeMaxChangesToKeep
        for (let i = listOfChanges.length - 1; i >= 0; i--) {
          const thisChange = listOfChanges[i]
          let keepAlive = false

          let shardeumConfigs = []
          if (thisChange.appData) {
            shardeumConfigs = this.generatePathKeys(thisChange.appData, 'appdata.')
          }
          const shardusConfigs: string[] = this.generatePathKeys(thisChange.change)

          const allConfigs = shardeumConfigs.concat(shardusConfigs)

          for (const config of allConfigs) {
            if (!configsMap.has(config)) {
              configsMap.set(config, 1)
              keepAlive = true
            } else if (configsMap.get(config) < keepAliveCount) {
              configsMap.set(config, configsMap.get(config) + 1)
              keepAlive = true
            }
          }

          if (currentCycle - thisChange.cycle <= shardusConfig.stateManager.configChangeMaxCyclesToKeep) {
            keepAlive = true
          }

          if (keepAlive == false) {
            listOfChanges.splice(i, 1)
          }
        }
        //Never ok to use Date.now() or any non consensed time for an account timestamp this needs to be deterministic
        account.timestamp = Date.now()
        networkAccount.hash = WrappedEVMAccountFunctions._calculateAccountHash(networkAccount)
        account.stateId = networkAccount.hash
        return [account]
        /* eslint-enable security/detect-object-injection */
      }
    },
    generatePathKeys(obj: any, prefix = ''): string[] {
      /* eslint-disable security/detect-object-injection */
      let paths: string[] = []

      // Loop over each key in the object
      for (const key of Object.keys(obj)) {
        // If the value corresponding to this key is an object (and not an array or null),
        // then recurse into it.
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          paths = paths.concat(this.generatePathKeys(obj[key], prefix + key + '.'))
        } else {
          // Otherwise, just append this key to the path.
          paths.push(prefix + key)
        }
      }

      return paths
      /* eslint-enable security/detect-object-injection */
    },
    beforeStateAccountFilter(account: WrappedAccount) {
      if (account.data.accountType === 1) {
        return (account.data as WrappedEVMAccount).value?.length === 0 ? false : true
      } else {
        return false
      }
    },

    //@ts-ignore
    canStayOnStandby(joinInfo: any): { canStay: boolean; reason: string } {
      if (joinInfo) {
        const appJoinData = joinInfo?.appJoinData

        if (AccountsStorage.cachedNetworkAccount == null) {
          //We need to enhance the early config getting to also get other values of the global account
          //so we know what versions the network is.  this is a stopgap!
          return { canStay: true, reason: 'dont have network account yet. cant boot anything!' }
        }

        const minVersion = AccountsStorage.cachedNetworkAccount.current.minVersion
        if (!isEqualOrNewerVersion(minVersion, appJoinData.version)) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: old version`)
          return {
            canStay: false,
            reason: `canStayOnStandby: standby node version: ${appJoinData.version} < minVersion ${minVersion}`,
          }
        }

        const latestVersion = AccountsStorage.cachedNetworkAccount.current.latestVersion

        if (
          latestVersion &&
          appJoinData.version &&
          !isEqualOrOlderVersion(latestVersion, appJoinData.version)
        ) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: version number is newer than latest`)
          return {
            canStay: false,
            reason: `version number is newer than latest. The latest allowed app version is ${latestVersion}. Join request node app version is ${appJoinData.version}`,
            //fatal: true,
          }
        }
      }

      return { canStay: true, reason: '' }
    },
    binarySerializeObject(identifier: string, obj): Buffer {
      nestedCountersInstance.countEvent('binarySerializeObject', identifier)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('binarySerializeObject:', identifier, obj)
      try {
        switch (identifier) {
          case 'AppData':
            return accountSerializer(obj).getBuffer()
          default:
            return Buffer.from(SerializeToJsonString(obj), 'utf8')
        }
      } catch (e) {
        /* prettier-ignore */ if (logFlags.error) console.log('binarySerializeObject error:', e)
        nestedCountersInstance.countEvent('binarySerializeObject', 'error')
        return Buffer.from(SerializeToJsonString(obj), 'utf8')
      }
    },
    binaryDeserializeObject(identifier: string, buffer: Buffer) {
      nestedCountersInstance.countEvent('binaryDeserializeObject', identifier)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('binaryDeserializeObject:', identifier, buffer)
      try {
        switch (identifier) {
          case 'AppData':
            return accountDeserializer(buffer)
          default:
            return DeSerializeFromJsonString(buffer.toString('utf8'))
        }
      } catch (e) {
        /* prettier-ignore */ if (logFlags.error) console.log('binaryDeserializeObject error:', e)
        nestedCountersInstance.countEvent('binaryDeserializeObject', 'error')
        return DeSerializeFromJsonString(buffer.toString('utf8'))
      }
    },

    getTxSenderAddress(tx) {
      if (isInternalTx(tx) || isDebugTx(tx)) {
        const internalTx = tx as InternalTx
        if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
          return internalTx.from
        } else if (internalTx.internalTXType === InternalTXType.InitNetwork) {
          return internalTx.network
        } else if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
          return internalTx.from
        } else if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
          return internalTx.network
        } else if (internalTx.internalTXType === InternalTXType.ChangeNetworkParam) {
          return internalTx.from
        } else if (internalTx.internalTXType === InternalTXType.ApplyNetworkParam) {
          return internalTx.network
        } else if (internalTx.internalTXType === InternalTXType.SetCertTime) {
          return internalTx.nominee
        } else if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
          return internalTx.nominee
        } else if (internalTx.internalTXType === InternalTXType.ClaimReward) {
          return internalTx.nominee
        } else if (internalTx.internalTXType === InternalTXType.Penalty) {
          const penaltyTx: any = internalTx
          return penaltyTx.reportedNodePublickKey
        }
        return internalTx.from
      }
      const shardusTxId = generateTxId(tx)
      const transaction = getTransactionObj(tx)
      const senderAddress = getTxSenderAddress(transaction, shardusTxId).address
      const callerEVMAddress = senderAddress.toString()
      const callerShardusAddress = toShardusAddress(callerEVMAddress, AccountType.Account)
      return callerShardusAddress
    },
    injectTxToConsensor(validatorDetails: any[], tx) {
      return InjectTxToConsensor(validatorDetails, tx)
    },
    getNonceFromTx(tx: ShardusTypes.OpaqueTransaction): bigint {
      if (isInternalTx(tx) || isDebugTx(tx)) {
        return BigInt(0)
      }
      const transaction = getTransactionObj(tx)
      if (transaction && transaction.nonce) {
        return transaction.nonce
      }
    },
    async getAccountNonce(accountId: string, wrappedData: ShardusTypes.WrappedData): Promise<bigint> {
      if (wrappedData != null) {
        const wrappedEVMAccount = wrappedData.data as WrappedEVMAccount
        return wrappedEVMAccount.account.nonce
      }
      const account: ShardusTypes.WrappedDataFromQueue = await shardus.getLocalOrRemoteAccount(accountId)
      if (account != null) {
        const wrappedEVMAccount = account.data as WrappedEVMAccount
        return wrappedEVMAccount.account.nonce
      }
    }
  })

  shardus.registerExceptionHandler()
}

function periodicMemoryCleanup(): void {
  const keys = shardeumStateTXMap.keys()
  //todo any provisions needed for TXs that can hop and extend the timer
  const maxAge = shardeumGetTime() - 60000
  for (const key of keys) {
    const shardeumState = shardeumStateTXMap.get(key)
    if (shardeumState._transactionState.createdTimestamp < maxAge) {
      shardeumStateTXMap.delete(key)
    }
  }
  // setTimeout(periodicMemoryCleanup, 60000)
}

async function fetchNetworkAccountFromArchiver(): Promise<WrappedAccount> {
  //make a trustless query which will check 3 random archivers and call the endpoint with hash=true
  let archiverList = getFinalArchiverList()
  archiverList = getRandom(archiverList, archiverList.length >= 3 ? 3 : archiverList.length)
  const values: {
    hash: string
    archiver: Archiver
  }[] = []
  for (const archiver of archiverList) {
    try {
      const res = await axios.get<{ networkAccountHash: string }>(
        `http://${archiver.ip}:${archiver.port}/get-network-account?hash=true`
      )
      if (!res.data) {
        /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'failure: did not get network account from archiver private key. Use default configs.')
        throw new Error(`fetchNetworkAccountFromArchiver() from pk:${archiver.publicKey} returned null`)
      }

      values.push({
        hash: res.data.networkAccountHash as string,
        archiver,
      })
    } catch (ex) {
      //dont let one bad archiver crash us !
      /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', `error: ${ex?.message}`)
    }
  }

  //make sure there was a majority winner for the hash
  const majorityValue = findMajorityResult(values, (v) => v.hash)
  if (!majorityValue) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'failure: no majority found for archivers get-network-account result. Use default configs.')
    throw new Error(`no majority found for archivers get-network-account result `)
  }

  const res = await axios.get<{ networkAccount: WrappedAccount }>(
    `http://${majorityValue.archiver.ip}:${majorityValue.archiver.port}/get-network-account?hash=false`
  )
  if (!res.data) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'failure: did not get network account from archiver private key, returned null. Use default configs.')
    throw new Error(`get-network-account from archiver pk:${majorityValue.archiver.publicKey} returned null`)
  }

  return res.data.networkAccount as WrappedAccount
}

async function updateConfigFromNetworkAccount(inputConfig: Config, account: WrappedAccount): Promise<Config> {
  // Clone config with rfdc
  const config = rfdc()(inputConfig)

  // Extract changes from the account
  const changes = account.data.listOfChanges

  // Validate changes
  if (!changes || !Array.isArray(changes)) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('updateConfigFromNetworkAccount(): No changes to apply to the config.')
    /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'success: no changes because no changes to apply to the config.')
    return config
  }

  // Iterate through changes and apply them
  for (const change of changes) {
    // Apply changes using patchObject function
    patchObject(config, change.change)
  }

  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('updateConfigFromNetworkAccount(): Successfully applied changes to the config.')
  /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'success: applied changes to config')

  // Return the patched config
  return config
}

function patchObject(existingObject: Config, changeObj: Partial<WrappedAccount>): void {
  //remove after testing
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`TESTING existingObject: ${JSON.stringify(existingObject, null, 2)}`)
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`TESTING changeObj: ${JSON.stringify(changeObj, null, 2)}`)
  for (const changeKey in changeObj) {
    if (changeObj[changeKey] && existingObject.server[changeKey]) {
      const targetObject = existingObject.server[changeKey]
      const changeProperties = changeObj[changeKey]

      for (const propKey in changeProperties) {
        if (changeProperties[propKey] && targetObject[propKey]) {
          targetObject[propKey] = changeProperties[propKey]
        }
      }
    }
  }
}

export let shardusConfig: ShardusTypes.ServerConfiguration

export function shardeumGetTime(): number {
  if (shardus != null) {
    return shardus.shardusGetTime()
  }
  return Date.now()
}

/**
 * Shardus start
 * Ok to log things without a verbose check here as this is a startup function
 */
;(async (): Promise<void> => {
  setTimeout(periodicMemoryCleanup, 60000)

  await setupArchiverDiscovery({
    customArchiverList: config.server.p2p?.existingArchivers,
  })

  config.server.p2p.existingArchivers = getFinalArchiverList()

  /** Standby nodes will sync network config very early here */

  //this networkAccount will only be used to help build/update a config and will not be stored as a local account
  //later when a node joins it can get the network account as part of the normal sync process
  //   intially  use    someactivenode:<externalPort>/account/0x00000000...  to get the network account
  //   would have to get a list active nodes from the archiver so we can know of one to ask.
  //const networkAccount = await getTrustlessNetworkAccount()

  // this needs the logic to patch a config
  // it will also have to call its own function:
  //const patchedConfig = updateConfigFromNetworkAccount(config, networkAccount)
  //use patchedConfig instead of config below

  let configToLoad

  try {
    // Attempt to get and patch config. Error if unable to get config.
    const networkAccount = await fetchNetworkAccountFromArchiver()
    console.log('Network Account', networkAccount)
    AccountsStorage.setCachedNetworkAccount(networkAccount.data)

    configToLoad = await updateConfigFromNetworkAccount(config, networkAccount)
  } catch (error) {
    configToLoad = config
    /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'Error: Use default configs.')
    console.log(`Error: ${formatErrorMessage(error)} \nUsing default configs`)
  }

  // this code is only excuted when starting or setting up the network***
  // shardus factory for nodes joining later in the network.
  shardus = shardusFactory(configToLoad, {
    customStringifier: SerializeToJsonString,
  })

  //@ts-ignore
  logFlags = shardus.getLogFlags()
  //do not need to have log levels for these flags:
  console.log('Shardus Server Config:')
  /** This is just the ServerConfiguration part of the shardus core configuration*/
  shardusConfig = shardus.config
  console.log(JSON.stringify(shardusConfig, null, 2))

  profilerInstance = shardus.getShardusProfiler()
  configShardusEndpoints()
  if (isServiceMode())
    AccountsStorage.setAccount(networkAccount, await AccountsStorage.getAccount(networkAccount))
  shardusSetup()
  config.server = shardus.config //possibly set the server config to match the merged one?

  if (ShardeumFlags.GlobalNetworkAccount) {
    // CODE THAT GETS EXECUTED WHEN NODES START
    await (async (): Promise<void> => {
      const serverConfig = config.server
      const cycleInterval = serverConfig.p2p.cycleDuration * ONE_SECOND

      let node
      let nodeId: string
      let nodeAddress: string
      let expected = shardeumGetTime() + cycleInterval
      let drift: number
      await shardus.start()

      // THIS CODE IS CALLED ON EVERY NODE ON EVERY CYCLE
      async function networkMaintenance(): Promise<NodeJS.Timeout> {
        /* prettier-ignore */
        if (logFlags.dapp_verbose) shardus.log('New maintainence cycle has started')
        clearOldPenaltyTxs(shardus)
        drift = shardeumGetTime() - expected

        try {
          nodeId = shardus.getNodeId()
          node = shardus.getNode(nodeId)
          if (!node) {
            throw new Error(`Node with id ${nodeId} not found`)
          }
          nodeAddress = node.address

          // wait for rewards
          const latestCycles = shardus.getLatestCycles()
          if (
            latestCycles != null &&
            latestCycles.length > 0 &&
            latestCycles[0].counter < ShardeumFlags.FirstNodeRewardCycle
          ) {
            /* prettier-ignore */
            if (logFlags.dapp_verbose) shardus.log(`Too early for node reward: ${latestCycles[0].counter}.  first reward:${ShardeumFlags.FirstNodeRewardCycle}`)
            /* prettier-ignore */
            if (logFlags.dapp_verbose) shardus.log('Maintenance cycle has ended')
            expected += cycleInterval
            return setTimeout(networkMaintenance, Math.max(100, cycleInterval - drift))
          }
        } catch (err) {
          /* prettier-ignore */
          if (logFlags.error) shardus.log('ERR: ', err)
          /* prettier-ignore */
          if (logFlags.error) console.log('ERR: ', err)
          return setTimeout(networkMaintenance, 5000) // wait 5s before trying again
        }

        /* prettier-ignore */
        if (logFlags.dapp_verbose) shardus.log('nodeId: ', nodeId)
        /* prettier-ignore */
        if (logFlags.dapp_verbose) shardus.log('nodeAddress: ', nodeAddress)

        /* prettier-ignore */
        if (logFlags.dapp_verbose) shardus.log('Maintainence cycle has ended')
        expected += cycleInterval
        return setTimeout(networkMaintenance, Math.max(100, cycleInterval - drift))
      }

      shardus.on('active', async (): Promise<NodeJS.Timeout> => {
        const latestCycles = shardus.getLatestCycles()
        if (latestCycles != null && latestCycles.length > 0) {
          const latestCycle = latestCycles[0]
          const now = shardeumGetTime()
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
})()
