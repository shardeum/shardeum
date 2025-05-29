/* eslint-disable @typescript-eslint/ban-ts-comment */
import { exec } from 'child_process'
import { arch, cpus, freemem, totalmem, platform } from 'os'
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
// Re-export for split modules
export { Address, bytesToHex, hexToBytes }
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
import { Response as GotResponse } from 'got'
import 'dotenv/config'
import { ShardeumState, TransactionState } from './state'
import {
  __ShardFunctions,
  nestedCountersInstance,
  ShardusTypes,
  DebugComplete,
  Shardus,
  DevSecurityLevel,
} from '@shardeum-foundation/core'
// Re-export types needed by split modules
export { ShardusTypes, nestedCountersInstance, DebugComplete }
import { ContractByteWrite, WarmupStats } from './state/transactionState'
import { version, devDependencies, dependencies } from '../package.json'
// Re-export version for split modules
export { version }
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
  NodeInitTxData,
  NodeRefutedViolationData,
  NodeRewardTxData,
  OperatorAccountInfo,
  OperatorStats,
  OurAppDefinedData,
  PenaltyTX,
  ReadableReceipt,
  SecureAccountInfo,
  SetCertTime,
  ShardeumBlockOverride,
  SignedNodeInitTxData,
  SignedNodeRewardTxData,
  StakeCoinsTX,
  StakeInfo,
  SyncingTimeoutViolationData,
  UnstakeCoinsTX,
  WrappedAccount,
  WrappedEVMAccount,
  WrappedStates,
} from './shardeum/shardeumTypes'
// Re-export for split modules
export { isNodeAccount2 }
import { getAccountShardusAddress, toShardusAddress, toShardusAddressWithKey } from './shardeum/evmAddress'
// Re-export for split modules
export { toShardusAddress, toShardusAddressWithKey }
import { FilePaths, ShardeumFlags, updateServicePoints, updateShardeumFlag } from './shardeum/shardeumFlags'
// Re-export for split modules
export { ShardeumFlags }
import * as WrappedEVMAccountFunctions from './shardeum/wrappedEVMAccountFunctions'
import { fixDeserializedWrappedEVMAccount, predictContractAddressDirect } from './shardeum/wrappedEVMAccountFunctions'
import {
  emptyCodeHash,
  replacer,
  fixBigIntLiteralsToBigInt,
  sleep,
  zeroAddressStr,
  _base16BNParser,
  _readableSHM,
  scaleByStabilityFactor,
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
  getTxSenderAddress,
  isInSenderCache,
  removeTxFromSenderCache,
  isStakingEVMTx,
  convertBigIntsToHex,
} from './utils'
// Re-export for split modules
export { generateTxId, isStakingEVMTx, _base16BNParser, scaleByStabilityFactor, fixBigIntLiteralsToBigInt, formatErrorMessage, getTxSenderAddress, _readableSHM, operatorCLIVersion, operatorGUIVersion }

import { meetsMinimumVersion, isWithinMaximumVersion, VersionValidationResult } from '@shardeum-foundation/core'
// Re-export for split modules
export { meetsMinimumVersion, isWithinMaximumVersion, VersionValidationResult }
import config, { Config } from './config'
// Re-export for split modules
export { config }
import Wallet from 'ethereumjs-wallet'
import { Block } from '@ethereumjs/block'
import { ShardeumBlock } from './block/blockchain'
import * as AccountsStorage from './storage/accountStorage'
import { sync, validateTransaction, validateTxnFields } from './setup'
import { applySetCertTimeTx, injectSetCertTimeTx, getCertCycleDuration, isSetCertTimeTx } from './tx/setCertTime'
import { applyClaimRewardTx, injectClaimRewardTx } from './tx/claimReward'
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
// Re-export for split modules
export { InjectTxToConsensor }
import * as InitRewardTimesTx from './tx/initRewardTimes'
import * as PenaltyTx from './tx/penalty/transaction'
import {
  isDebugTx,
  isDestLimitTx,
  isInternalTx,
  crypto,
  getInjectedOrGeneratedTimestamp,
  verifyMultiSigs,
  verify,
} from './setup/helpers'
// Re-export crypto and others for split modules
export { crypto, verifyMultiSigs }
import { onActiveVersionChange } from './versioning'
import { shardusFactory } from '@shardeum-foundation/core'
import { unsafeGetClientIp } from './utils/requests'
import { initialNetworkParamters } from './shardeum/initialNetworkParameters'
import { oneSHM, networkAccount, ONE_SECOND } from './shardeum/shardeumConstants'
// Re-export networkAccount for split modules
export { networkAccount }
import { applyPenaltyTX, clearOldPenaltyTxs } from './tx/penalty/transaction'
import { getFinalArchiverList, setupArchiverDiscovery } from '@shardeum-foundation/lib-archiver-discovery'
import { Archiver } from '@shardeum-foundation/lib-archiver-discovery/dist/src/types'
//import blockedAt from 'blocked-at'
//import { v4 as uuidv4 } from 'uuid'
import { RunState } from './evm_v2/interpreter'
import { VM } from './vm_v7/vm'
import rfdc = require('rfdc')
import { AdminCert, PutAdminCertResult, putAdminCertificateHandler } from './handlers/adminCertificate'
import { P2P } from '@shardeum-foundation/lib-types'
import { getExternalApiMiddleware } from './middleware/externalApiMiddleware'
import { AccountsEntry } from './storage/storage'
import { getCachedRIAccount, setCachedRIAccount } from './storage/riAccountsCache'
import { isLowStake } from './tx/penalty/penaltyFunctions'
// Re-export for split modules
export { isLowStake }
import { accountDeserializer, accountSerializer } from './types/Helpers'
import { runWithContextAsync } from './utils/RequestContext'
import { Utils } from '@shardeum-foundation/lib-types'
import { SafeBalance } from './utils/safeMath'
import { isRestakingAllowed, isStakeUnlocked, verifyStakeTx, verifyUnstakeTx } from './tx/staking/verifyStake'
import { AJVSchemaEnum } from './types/enum/AJVSchemaEnum'
import { filterObjectByWhitelistedProps, initAjvSchemas, verifyPayload } from './types/ajv/Helpers'
// Re-export for split modules
export { verifyPayload }
import { Sign, ServerMode } from '@shardeum-foundation/core/dist/shardus/shardus-types'

import { safeStringify } from '@shardeum-foundation/lib-types/build/src/utils/functions/stringify'
import { initializeSerialization } from './utils/serialization/SchemaHelpers'
import { getAccountData } from './utils/account'
import {
  crack as crackTransferFromSecureAccount,
  apply as applyTransferFromSecureAccount,
  verify as verifyTransferFromSecureAccount,
  secureAccountDataMap,
} from './shardeum/secureAccounts'
import * as TicketManager from './setup/ticket-manager'
import { getHeapStatistics } from 'v8'
import { OpaqueTransaction } from '@shardeum-foundation/core/dist/shardus/shardus-types'
import { TicketTypes, doesTransactionSenderHaveTicketType } from './setup/ticket-manager'
import { buildFetchNetworkAccountFromArchiver } from './shardeum/services/networkAccountService'
import { customGot } from './utils/customHttpFunctions'
import { logEnvSetup } from './setup/environment'

// Import split modules
import { endpoints } from './endpoints'
import { joinFunctions } from './join'
import { generateAccessList } from './accesslist'
import { applyInternalTx, applyDebugTx, createInternalTxReceipt } from './internal'
// Re-export createInternalTxReceipt for other modules
export { createInternalTxReceipt }
import { shardusSetup } from './setup'

export let latestBlock = 0
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

export let shardus: Shardus
export let profilerInstance

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
  debug: false,
}

// Export EVM and related variables for split modules
export let shardeumBlock: ShardeumBlock

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

// Update functions for mutable exports
export function updateStakeCert(cert: StakeCert): void {
  stakeCert = cert
}

export function updateAdminCert(cert: AdminCert): void {
  adminCert = cert
}

const uuidCounter = 1

interface DependenciesVersions {
  [key: string]: {
    version: string
    isDevDependency: boolean
  }
}

let shardusDependenciesVersions: DependenciesVersions = null

export function isDebugMode(): boolean {
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
export const debugServicePointSpendersByType: Map<string, Map<string, number>> = new Map()
//debug map of service point types and the number of points spent
export const debugServicePointsByType: Map<string, number> = new Map()
//total number of service points spent, since we last cleared or started the capturing data
let debugTotalServicePointRequests = 0

//latest value from isReadyToJoin function call
export let isReadyToJoinLatestValue = false
//used only for when the nework is...
// isAdminCertUnexpired is now managed in join.ts, use getIsAdminCertUnexpired()

export let appStartupTimestamp = 0

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

export function createBlock(timestamp: number, blockNumber: number): Block {
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getShardusDependenciesVersions() {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const isShardus = ([key, value]) => key.startsWith('@shardeum-foundation')

  if (shardusDependenciesVersions === null) {
    shardusDependenciesVersions = {}
    Object.entries(dependencies)
      .filter(isShardus)
      .forEach(([key, value]) => {
        shardusDependenciesVersions[key] = { version: value, isDevDependency: false }
      })
    Object.entries(devDependencies)
      .filter(isShardus)
      .forEach(([key, value]) => {
        shardusDependenciesVersions[key] = { version: value, isDevDependency: true }
      })
  }
  return shardusDependenciesVersions
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
export const appliedTxs = {} //this appears to be unused. will it still be unused if we use receipts as app data
export const shardusTxIdToEthTxId = {} //this appears to only support appliedTxs

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

export let EVM: { -readonly [P in keyof VM] }
//let transactionStateMap:Map<string, TransactionState>

//Per TX or Eth call shardeum State.  Note the key is the shardus transaction id
export let shardeumStateTXMap: Map<string, ShardeumState>
//let shardeumStateCallMap:Map<string, ShardeumState>
//let shardeumStatePool:ShardeumState[]
// const debugShardeumState: ShardeumState = null

/** This map is bad and needs to be phased out in favor of data we use in app data */
export let shardusAddressToEVMAccountInfo: Map<string, EVMAccountInfo>
export let evmCommon

export let debugAppdata: Map<string, unknown>

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
    try {
      EVM = await VM.create({
        common: evmCommon,
        stateManager: undefined,
        evm: customEVM,
        // blockchain: shardeumBlock,
      })
    } finally {
      customEVM.cleanUp()
    }
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
initAjvSchemas()
initializeSerialization()

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
        /* prettier-ignore */ if (logFlags.aalg) console.log('aalg: aalg-hit', txid, shardusAddress, address, key, type)
        transactionState.warmupStats.cacheHit++
        return fixedEVMAccount
      }
      if (fixedEVMAccount === null) {
        nestedCountersInstance.countEvent('aalg-warmup', 'cache slot empty')
        transactionState.warmupStats.cacheEmpty++
        /* prettier-ignore */ if (logFlags.aalg) console.log('aalg: aalg-empty', txid, shardusAddress, address, key, type)
      }
      if (fixedEVMAccount === undefined) {
        nestedCountersInstance.countEvent('aalg-warmup', 'cache slot empty-reqmiss')
        transactionState.warmupStats.cacheEmptyReqMiss++
        /* prettier-ignore */ if (logFlags.aalg) console.log('aalg: aalg-empty-reqmiss', txid, shardusAddress, address, key, type)
      }
    } else {
      nestedCountersInstance.countEvent('aalg-warmup', 'cache miss')
      transactionState.warmupStats.cacheMiss++
      /* prettier-ignore */ if (logFlags.aalg) console.log('aalg: aalg-miss', txid, shardusAddress, address, key, type)
    }
  }

  while (retry < maxRetry && remoteShardusAccount == null) {
    //getLocalOrRemoteAccount can throw if the remote node gives us issues
    //we want to catch these and retry
    try {
      /* prettier-ignore */ if (logFlags.aalg || ShardeumFlags.VerboseLogs) console.log(`${Date.now()} Trying to get remote account for address: ${address}, type: ${type}, key: ${key} retry: ${retry}`)
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
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum', `tryRemoteAccountCB: fail. type: ${type}, address: ${address}, key: ${key}`)
    }
    //this could be new account
    return undefined
  }
  const fixedEVMAccount = remoteShardusAccount.data as WrappedEVMAccount
  fixDeserializedWrappedEVMAccount(fixedEVMAccount)
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs || logFlags.aalg) console.log(`${Date.now()} Successfully found remote account for address: ${address}, type: ${type}, key: ${key}, retry: ${retry}`, fixedEVMAccount)
  return fixedEVMAccount
}

export function getStakeTxBlobFromEVMTx(
  transaction: Transaction[TransactionType.Legacy] | Transaction[TransactionType.AccessListEIP2930]
): unknown {
  const stakeTxString = toAscii(bytesToHex(transaction.data))
  /* prettier-ignore */ if (logFlags.verbose) console.log(`stakeTxString`, stakeTxString)
  return Utils.safeJsonParse(stakeTxString)
}

export async function createAccount(
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

export function getTransactionObj(tx): Transaction[TransactionType.Legacy] | Transaction[TransactionType.AccessListEIP2930] {
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
      transactionObj = TransactionFactory.fromSerializedData<TransactionType.AccessListEIP2930>(serializedInput)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Unable to get transaction obj', e)
    }
  }

  if (transactionObj) {
    return transactionObj
  } else throw Error('tx obj fail')
}

export async function getReadableAccountInfo(account: WrappedEVMAccount): Promise<{
  nonce: string
  balance: string
  storageRoot: string
  codeHash: string
  operatorAccountInfo: OperatorStats
}> {
  try {
    //todo this code needs additional support for account type contract storage or contract code
    return {
      nonce: account.account.nonce.toString(),
      balance: account.account.balance.toString(),
      storageRoot: bytesToHex(account.account.storageRoot),
      codeHash: bytesToHex(account.account.codeHash),
      operatorAccountInfo: account.operatorAccountInfo
        ? Utils.safeJsonParse(Utils.safeStringify(account.operatorAccountInfo))
        : null,
    }
  } catch (e) {
    if (ShardeumFlags.VerboseLogs) console.log('Unable to get readable account', e)
  }
  return null
}

/**
 * only use for the duration of a call and then give up on it
 * ?? will this work
 * @returns
 */
export function getCallTXState(): ShardeumState {
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

export function getPreRunTXState(txId: string): ShardeumState {
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

/**
 * deleteApplyTXState
 * @param txId
 * @param context must be a non format string to avoid counter spam
 */
export function deleteApplyTXState(txId: string, context: string): void {
  if (shardeumStateTXMap.has(txId)) {
    nestedCountersInstance.countEvent('shardeum', `deleteApplyTXState ${context}`)
    shardeumStateTXMap.delete(txId)
  }
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

export async function _internalHackPostWithResp(url: string, body): Promise<GotResponse<any>> {
  const normalized = _normalizeUrl(url)

  try {
    const res = await customGot().post(normalized, {
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
    if (ShardeumFlags.VerboseLogs) console.log(`access list for ${message} ${Utils.safeStringify(appData.accessList)}`)
  }
}

const configShardusNetworkTransactions = (): void => {
  shardus.serviceQueue.registerBeforeAddVerifier(
    'nodeReward',
    async (txEntry: P2P.ServiceQueueTypes.AddNetworkTx<SignedNodeRewardTxData>) => {
      const tx = txEntry.txData
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Validating nodeReward fields', Utils.safeStringify(tx))
      try {
        if (!crypto.verifyObj(tx)) {
          /* prettier-ignore */
          if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerifier - nodeReward: fail Invalid signature', Utils.safeStringify(tx))
          return false
        }
      } catch (e) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Invalid signature for internal tx', Utils.safeStringify(tx))
        return false
      }
      const shardusAddress = tx.publicKey?.toLowerCase()
      const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
      if (!account) {
        console.log(
          `registerBeforeAddVerifier - nodeReward: Account for shardus address ${shardusAddress} not found, do not add tx`
        )
        return false
      }
      if (!account.data) {
        console.log(
          `registerBeforeAddVerifier - nodeReward: Account for shardus address ${shardusAddress} has no data, do not add tx`
        )
        return false
      }
      if ((account.data as NodeAccount2).nominator == null) {
        console.log(
          `registerBeforeAddVerifier - nodeReward: Account for shardus address ${shardusAddress} has null nominator, do not add tx`
        )
        return false
      }
      if (txEntry.priority !== 0) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerifier - nodeReward: fail Invalid priority', Utils.safeStringify(tx))
        return false
      }
      if (txEntry.subQueueKey == null || txEntry.subQueueKey != tx.publicKey) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerifier - nodeReward: fail Invalid subQueueKey', Utils.safeStringify(tx))
        return false
      }
      if (!tx.publicKey || tx.publicKey === '' || tx.publicKey.length !== 64) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerify nodeReward fail invalid publicKey field', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `registerBeforeAddVerify nodeReward fail invalid publicKey field`)
        return false
      }

      const nodePubKey = shardus.getRemovedNodePubKeyFromCache(tx.nodeId)
      if (nodePubKey == null || tx.publicKey !== nodePubKey) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerify nodeReward fail invalid nodeId field', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `registerBeforeAddVerify nodeReward fail invalid nodeId field`)
        return false
      }
      const amountOfCycles = 5
      const latestCycles = shardus.getLatestCycles(amountOfCycles)
      if (tx.endTime === undefined) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerify nodeReward fail endTime field missing', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `registerBeforeAddVerify nodeReward fail endTime field missing`)
        return false
      }

      const nodeDeactivatedCycle = latestCycles.find(
        (cycle) =>
          cycle.removed.includes(tx.nodeId) ||
          cycle.apoptosized.includes(tx.nodeId) ||
          cycle.appRemoved.includes(tx.nodeId)
      )
      if (!nodeDeactivatedCycle) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerify nodeReward fail !nodeDeactivatedCycle', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `registerBeforeAddVerify nodeReward fail !nodeDeactivatedCycle`)
        return false
      }
      const removeCycleRange = [nodeDeactivatedCycle.start, nodeDeactivatedCycle.start + nodeDeactivatedCycle.duration]
      if (tx.endTime == null) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerify nodeReward fail endTime field missing', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `registerBeforeAddVerify nodeReward fail endTime field missing`)
        return false
      }

      if (tx.endTime < removeCycleRange[0] || tx.endTime > removeCycleRange[1]) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerify nodeReward fail endTime is not in range', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `registerBeforeAddVerify nodeReward fail endTime is not in range`)
        return false
      }

      const nodeRemovedCycle = latestCycles.find(
        (cycle) => cycle.removed.includes(tx.nodeId) || cycle.lost.includes(tx.nodeId)
      )
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('nodeRemovedCycle', nodeRemovedCycle)
      if (!nodeRemovedCycle) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerify nodeReward fail !nodeRemovedCycle', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent(
        'shardeum-staking',
        `registerBeforeAddVerify nodeReward fail !nodeRemovedCycle`
      )
        return false
      }

      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerify nodeReward success', Utils.safeStringify(tx))
      return true
    }
  )
  shardus.serviceQueue.registerApplyVerifier(
    'nodeReward',
    async (txEntry: P2P.ServiceQueueTypes.AddNetworkTx<SignedNodeRewardTxData>) => {
      const tx = txEntry.txData
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Validating nodeReward applied', Utils.safeStringify(tx))
      const shardusAddress = tx.publicKey?.toLowerCase()
      const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
      if (!account) {
        console.log(
          `registerApplyVerifier - nodeReward: Account for shardus address ${shardusAddress} not found, removing tx`
        )
        return true
      }
      if (!account.data) {
        console.log(
          `registerApplyVerifier - nodeReward: Account for shardus address ${shardusAddress} has no data, removing tx`
        )
        return true
      }
      const data = account.data as NodeAccount2
      if (data.nominator == null) {
        console.log(
          `registerApplyVerifier - nodeReward: Account for shardus address ${shardusAddress} has null nominator, removing tx`
        )
        return true
      }
      const appliedEntry = data.rewardEndTime === tx.endTime
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerApplyVerify nodeReward appliedEntry', appliedEntry)
      return appliedEntry
    }
  )
  shardus.serviceQueue.registerBeforeAddVerifier(
    'nodeInitReward',
    async (txEntry: P2P.ServiceQueueTypes.AddNetworkTx<SignedNodeInitTxData>) => {
      const tx = txEntry.txData
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Validating nodeInitReward', safeStringify(tx))

      const isValid = crypto.verifyObj(tx)
      if (!isValid) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validate nodeInitReward fail Invalid signature', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validate nodeInitReward fail Invalid signature`)
        return false
      }
      const shardusAddress = tx.publicKey?.toLowerCase()
      const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
      if (!account) {
        console.log(
          `registerBeforeAddVerifier - nodeInitReward: Account for shardus address ${shardusAddress} not found, do not add tx`
        )
        return false
      }
      if (!account.data) {
        console.log(
          `registerBeforeAddVerifier - nodeInitReward: Account for shardus address ${shardusAddress} has no data, do not add tx`
        )
        return false
      }
      if ((account.data as NodeAccount2).nominator == null) {
        console.log(
          `registerBeforeAddVerifier - nodeInitReward: Account for shardus address ${shardusAddress} has null nominator, do not add tx`
        )
        return false
      }
      if (txEntry.subQueueKey == null || txEntry.subQueueKey != tx.publicKey) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerifier - nodeInitReward: fail Invalid subQueueKey', Utils.safeStringify(tx))
        return false
      }

      const node = shardus.getNode(tx.nodeId)
      if (node == null || tx.publicKey !== node.publicKey) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerBeforeAddVerify nodeInitReward fail invalid nodeId field', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `registerBeforeAddVerify nodeInitReward fail invalid nodeId field`)
        return false
      }
      const latestCycles = shardus.getLatestCycles(5)
      const nodeActivedCycle = latestCycles.find((cycle) => cycle.activatedPublicKeys.includes(tx.publicKey))
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('nodeActivedCycle', nodeActivedCycle)
      if (!nodeActivedCycle) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validate nodeInitReward fail !nodeActivedCycle', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validate nodeInitReward fail !nodeActivedCycle`)
        return false
      }
      if (nodeActivedCycle.start !== tx.startTime) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validate nodeInitReward fail nodeActivedCycle.start !== tx.nodeActivatedTime', Utils.safeStringify(tx))
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validate nodeInitReward fail nodeActivedCycle.start !== tx.nodeActivatedTime`)
        return false
      }

      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validate nodeInitReward success', Utils.safeStringify(tx))
      return true
    }
  )
  shardus.serviceQueue.registerApplyVerifier(
    'nodeInitReward',
    async (txEntry: P2P.ServiceQueueTypes.AddNetworkTx<SignedNodeInitTxData>) => {
      const tx = txEntry.txData
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Validating nodeInitReward applied', Utils.safeStringify(tx))
      const shardusAddress = tx.publicKey?.toLowerCase()
      const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
      if (!account) {
        console.log(
          `registerApplyVerifier - nodeInitReward: Account for shardus address ${shardusAddress} not found, removing tx`
        )
        return true
      }
      if (!account.data) {
        console.log(
          `registerApplyVerifier - nodeReward: Account for shardus address ${shardusAddress} has no data, removing tx`
        )
        return true
      }
      const data = account.data as NodeAccount2
      if (data.nominator == null) {
        console.log(
          `registerApplyVerifier - nodeInitReward: Account for shardus address ${shardusAddress} has null nominator, removing tx`
        )
        return true
      }

      // check if nodeAccount.rewardStartTime is already set to tx.nodeActivatedTime
      if (data.rewardStartTime >= tx.startTime) {
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateInitRewardState success rewardStartTime already set`)
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerApplyVerify nodeInitReward data.rewardStartTime >= tx.startTime')
        return true
      }

      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('registerApplyVerify nodeInitReward node.rewardStartTime not applied yet')
      return false
    }
  )
  shardus.serviceQueue.registerShutdownHandler(
    'nodeInitReward',
    (node: P2P.NodeListTypes.Node, record: P2P.CycleCreatorTypes.CycleRecord) => {
      if (record.activated.includes(node.id)) {
        if (record.txadd.some((entry) => entry.txData.nodeId === node.id && entry.type === 'nodeInitReward')) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`shutdown condition: active node with id ${node.id} is already in txadd (nodeInitReward); this should not happen`)
        } else {
          return {
            type: 'nodeInitReward',
            txData: {
              startTime: record.start,
              publicKey: node.publicKey,
              nodeId: node.id,
            },
            priority: 1,
            subQueueKey: node.publicKey,
          }
        }
      }
    }
  )
  shardus.serviceQueue.registerShutdownHandler(
    'nodeReward',
    (node: P2P.NodeListTypes.Node, record: P2P.CycleCreatorTypes.CycleRecord) => {
      if (record.txadd.some((entry) => entry.txData.nodeId === node.id && entry.type === 'nodeReward')) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`shutdown condition: active node with id ${node.id} is already in txadd; this should not happen`)
        return
      }

      // get latest entry for node in txList. and if it is init then we inject otherwise continue
      // first iterate over txlist backwards and get first entry that has public key of node
      const txListEntry = shardus.serviceQueue.getLatestNetworkTxEntryForSubqueueKey(node.publicKey)
      if (txListEntry && txListEntry.tx.type === 'nodeReward') {
        /** prettier-ignore */ if (ShardeumFlags.VerboseLogs)
          console.log(
            `Skipping creation of shutdown reward tx (last entry already is of type ${txListEntry.tx.type})`,
            Utils.safeStringify(txListEntry)
          )
        return
      }
      /** prettier-ignore */ if (ShardeumFlags.VerboseLogs)
        console.log(`Creating a shutdown reward tx`, Utils.safeStringify(txListEntry), Utils.safeStringify(node))
      return {
        type: 'nodeReward',
        txData: {
          endTime: record.start,
          publicKey: node.publicKey,
          nodeId: node.id,
        },
        priority: 0,
        subQueueKey: node.publicKey,
      }
    }
  )
}

export function setGlobalCodeByteUpdate(
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

  const addressHash = WrappedEVMAccountFunctions._calculateAccountHash(wrappedEVMAccount)
  const afterStateHash = addressHash

  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = {
    address: globalAddress,
    addressHash,
    value,
    when,
    source: globalAddress,
    afterStateHash: afterStateHash,
  }
}

export async function _transactionReceiptPass(
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
    const dataId = toShardusAddressWithKey(appReceiptData.data.readableReceipt.transactionHash, '', AccountType.Receipt)
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
    const { address, addressHash, value, when, source, afterStateHash } = ourAppDefinedData.globalMsg
    //delete value.sign
    shardus.setGlobal(address, addressHash, value, when, source, afterStateHash)
    if (ShardeumFlags.VerboseLogs) {
      const txHash = generateTxId(value)
      console.log(`transactionReceiptPass setglobal: ${txHash} ${Utils.safeStringify(tx)}  `)
    }
  }
  if (tx.internalTXType === InternalTXType.Penalty) {
    let nodeAccount: NodeAccount2
    if (isNodeAccount2(wrappedStates[tx.reportedNodePublickKey].data))
      nodeAccount = wrappedStates[tx.reportedNodePublickKey].data as NodeAccount2

    if (isLowStake(nodeAccount)) {
      if (ShardeumFlags.VerboseLogs) console.log(`isLowStake for nodeAccount ${nodeAccount.id}: true`, nodeAccount)
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

export const getNetworkAccount = async (): Promise<ShardusTypes.WrappedData> => {
  const globalAccount = shardusConfig.globalAccount
  const wrappedEVMAccount = await AccountsStorage.getAccount(globalAccount)
  if (!wrappedEVMAccount) return null
  const account = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
  return account
}

export const createNetworkAccount = async (
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
    mode: config.server.mode as ServerMode,
  }
  account.hash = WrappedEVMAccountFunctions._calculateAccountHash(account)
  /* prettier-ignore */ if (logFlags.important_as_error) console.log('INITIAL_HASH: ', account.hash)
  return account
}

export const createNodeAccount2 = (accountId: string): NodeAccount2 => {
  const nodeAccount: NodeAccount2 = {
    id: accountId,
    hash: '',
    timestamp: 0,
    nominator: '',
    stakeLock: BigInt(0),
    stakeTimestamp: 0,
    reward: BigInt(0),
    rewardStartTime: 0,
    rewardEndTime: 0,
    penalty: BigInt(0),
    accountType: AccountType.NodeAccount2,
    nodeAccountStats: {
      totalReward: BigInt(0),
      totalPenalty: BigInt(0),
      history: [],
      penaltyHistory: [],
      lastPenaltyTime: 0,
      isShardeumRun: false,
    },
    rewarded: false,
    rewardRate: BigInt(0),
  }
  WrappedEVMAccountFunctions.updateEthAccountHash(nodeAccount)
  return nodeAccount
}

export const getOrCreateBlockFromTimestamp = (timestamp: number, scheduleNextBlock = false): Block => {
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

  if (ShardeumFlags.extraTxTime && !scheduleNextBlock) timestamp = timestamp + ShardeumFlags.extraTxTime * 1000

  const cycleStart = (cycle.start + cycle.duration) * 1000
  const timeElapsed = timestamp - cycleStart
  const decimal = timeElapsed / (cycle.duration * 1000)
  const numBlocksPerCycle = cycle.duration / ShardeumFlags.blockProductionRate
  const blockNumber = Math.floor(ShardeumFlags.initialBlockNumber + (cycle.counter + 1 + decimal) * numBlocksPerCycle)
  const newBlockTimestampInSecond =
    cycle.start +
    cycle.duration +
    (blockNumber - ShardeumFlags.initialBlockNumber - (cycle.counter + 1) * 10) * ShardeumFlags.blockProductionRate
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

type CodeHashObj = { codeHash: string; contractAddress: string }

export async function fetchAndCacheAccountData(
  shardusAddress: string,
  warmupCache: Map<string, WrappedEVMAccount>,
  warmupStats: WarmupStats,
  useRICache: boolean,
  txid: string,
  type: AccountType
): Promise<void> {
  warmupStats.accReq++

  const startTime = Date.now()
  /* prettier-ignore */ if (logFlags.aalg) console.log('aalg: fetchAndCacheAccountData-enter', txid, shardusAddress, type)
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
      /* prettier-ignore */ if (logFlags.aalg) console.log('aalg: fetchAndCacheAccountData-null', elapsed, txid, shardusAddress, type)
      warmupCache.set(shardusAddress, null) //could we init with undefined?
    } else {
      nestedCountersInstance.countEvent('aalg-warmup', 'account warmed')
      warmupCache.set(shardusAddress, warmupAcc.data as WrappedEVMAccount)
      warmupStats.accRcvd++
      /* prettier-ignore */ if (logFlags.aalg) console.log('aalg: fetchAndCacheAccountData-got', elapsed, txid, shardusAddress, type)
    }
  } catch (er) {
    const elapsed = Date.now() - startTime
    warmupStats.accReqErr++
    nestedCountersInstance.countEvent('aalg-warmup', `account er: ${er.message}`)
    /* prettier-ignore */ if (logFlags.aalg) console.log('aalg: fetchAndCacheAccountData-error', elapsed, txid, shardusAddress, type)
  }
}

export function getNodeCountForCertSignatures(): number {
  let latestCycle: ShardusTypes.Cycle
  const latestCycles: ShardusTypes.Cycle[] = shardus.getLatestCycles()
  if (latestCycles && latestCycles.length > 0) [latestCycle] = latestCycles
  const activeNodeCount = latestCycle ? latestCycle.active : 1
  if (ShardeumFlags.VerboseLogs) console.log(`Active node count computed for cert signs ${activeNodeCount}`)
  return Math.min(ShardeumFlags.MinStakeCertSig, activeNodeCount)
}

//Note, this functionality was disabled 10 months ago.
//now that we are moving away from TX expiration we would need to be safe if we ever
//turn this back on.  (note, disabled by having setTimeout not called again)
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

export async function fetchNetworkAccountFromArchiver(): Promise<WrappedAccount> {
  const built = buildFetchNetworkAccountFromArchiver({
    getFinalArchiverList,
    getRandom,
    verify,
    ShardeumFlags,
    WrappedEVMAccountFunctions,
    nestedCountersInstance,
    findMajorityResult,
    safeStringify,
  })
  return await built()
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
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`TESTING existingObject: ${Utils.safeStringify(existingObject)}`)
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`TESTING changeObj: ${Utils.safeStringify(changeObj)}`)
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
    AccountsStorage.setCachedNetworkAccount(networkAccount.data)
    /* prettier-ignore */ console.log(`Got network account from archiver:\n ${Utils.safeStringify(networkAccount)}`)
    configToLoad = await updateConfigFromNetworkAccount(config, networkAccount)
  } catch (error) {
    configToLoad = config
    /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'Error: Use default configs.')
    /* prettier-ignore */ console.log(`Error Using default configs: ${formatErrorMessage(error)} \n`)
    /* prettier-ignore */ console.log(`using default config:\n ${Utils.safeStringify(configToLoad)}`)
  }

  // this code is only excuted when starting or setting up the network***
  // shardus factory for nodes joining later in the network.
  shardus = shardusFactory(configToLoad)

  logEnvSetup()

  //@ts-ignore
  logFlags = shardus.getLogFlags()
  //do not need to have log levels for these flags:
  console.log(`Heap Size Limit: ${getHeapStatistics().heap_size_limit / 1024 / 1024} MB`)
  console.log('Shardus Server Config:')
  /** This is just the ServerConfiguration part of the shardus core configuration*/
  shardusConfig = shardus.config
  console.log(Utils.safeStringify(shardusConfig))

  profilerInstance = shardus.getShardusProfiler()
  endpoints.configShardusEndpoints()
  configShardusNetworkTransactions()
  if (isServiceMode()) AccountsStorage.setAccount(networkAccount, await AccountsStorage.getAccount(networkAccount))
  shardusSetup()
  config.server = shardus.config //possibly set the server config to match the merged one?

  /** Start process for updating tickets (e.g. silver) */
  TicketManager.updateTicketMapAndScheduleNextUpdate()

  appStartupTimestamp = shardeumGetTime()

  logEnvSetup()

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
        if (logFlags.dapp_verbose) shardus.log('New maintenance cycle has started')
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

        shardus.registerCacheTopic('receipt', ShardeumFlags.cacheMaxCycleAge, ShardeumFlags.cacheMaxItemPerTopic)

        return setTimeout(networkMaintenance, cycleInterval)
      })
    })()
  } else {
    shardus.start()
  }
})()
