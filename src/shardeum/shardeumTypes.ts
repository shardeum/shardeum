import { Account } from '@ethereumjs/util'
import { ShardusTypes } from '@shardus/core'
import { Block } from '@ethereumjs/block'
import { StakeCert } from '../handlers/queryCertificate'
import { TxReceipt } from '../vm_v7/types'
import { AdminCert } from '../handlers/adminCertificate'

export enum AccountType {
  Account = 0, //  EOA or CA
  ContractStorage = 1, // Contract storage key value pair
  ContractCode = 2, // Contract code bytes
  Receipt = 3, //This holds logs for a TX
  Debug = 4,
  NetworkAccount = 5,
  NodeAccount = 6,
  NodeRewardReceipt = 7,
  DevAccount = 8,
  NodeAccount2 = 9,
  StakeReceipt = 10,
  UnstakeReceipt = 11,
  InternalTxReceipt = 12,
}

export interface BaseAccount {
  accountType: AccountType
}

export class ShardeumAccount extends Account {
  constructor() {
    super()
  }
  virtual?: boolean
}

//There are a lot of change variables. Maybe I can collapse them here and update this later
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Change = any

/**
 * Still working out the details here.
 * This has become a variant data type now that can hold an EVM account or a key value pair from CA storage
 * I think that is the shortest path for now to get syncing and repair functionality working
 *
 * Long term I am not certain if we will be able to hold these in memory.  They may have to be a temporary thing
 * that is held in memory for awhile but eventually cleared.  This would mean that we have to be able to pull these
 * from disk again, and that could be a bit tricky.
 */
export interface WrappedEVMAccount extends BaseAccount {
  // accountType: AccountType // determines how the shardus address will be computed and what variant data is present
  ethAddress: string //account address in EVM space. can have different meanings depending on account type
  hash: string //account hash
  timestamp: number //account timestamp.  last time a TX changed it

  //variant data: account
  account?: Account //actual EVM account. if this is type Account
  //variant data: contract storage
  key?: string //EVM CA storage key
  value?: Uint8Array //EVM buffer value if this is of type CA_KVP
  //variant data: Contract code related and addresses
  codeHash?: Uint8Array
  codeByte?: Uint8Array
  contractAddress?: string
  //variant data: Receipt related
  receipt?: TxReceipt
  readableReceipt?: ReadableReceipt
  amountSpent?: string // transactionFee
  txId?: string
  txFrom?: string
  balance?: number // For debug tx
  operatorAccountInfo?: OperatorAccountInfo
}

export interface WrappedEVMAccountMap {
  [id: string]: WrappedEVMAccount
}

export interface BlockMap {
  [counter: number | string]: ShardeumBlockOverride | Block
}

export type ShardeumBlockOverride = Block & { number?: string; hash?: string }

export interface EVMAccountInfo {
  type: AccountType
  evmAddress: string
  contractAddress?: string
}

export enum InternalTXType {
  SetGlobalCodeBytes = 0, //Deprecated
  InitNetwork = 1,
  NodeReward = 2,   //Deprecated
  ChangeConfig = 3,
  ApplyChangeConfig = 4,
  SetCertTime = 5,
  Stake = 6,
  Unstake = 7,
  InitRewardTimes = 8,
  ClaimReward = 9,
  ChangeNetworkParam = 10,
  ApplyNetworkParam = 11,
  Penalty = 12,
}

export enum DebugTXType {
  Create = 0,
  Transfer = 1,
}

/**
 * InternalTx is a non EVM TX that shardeum can use for utility task such as global changes
 *
 */
export interface InternalTxBase {
  isInternalTx: boolean
  internalTXType: InternalTXType
}

export interface InternalTx extends InternalTxBase {
  timestamp: number
  from?: string
  to?: string
  accountData?: WrappedEVMAccount
  network?: string // Network Account
  nodeId?: string // Node Account
  change?: Change // change config
  cycle?: number // change config
  config?: string // change config
  nominee?: string // Node Account2
  nominator?: string // EVM Account (OperAcc)
  sign: ShardusTypes.Sign
}

export interface SetCertTime extends InternalTxBase {
  nominee: string
  nominator: string
  duration: number
  timestamp: number
  sign: ShardusTypes.Sign
}

export interface StakeCoinsTX extends InternalTxBase {
  nominee: string
  nominator: string
  stake: bigint
  timestamp: number
  sign: ShardusTypes.Sign
}

export interface UnstakeCoinsTX extends InternalTxBase {
  nominee: string
  nominator: string
  timestamp: number
  sign: ShardusTypes.Sign
  force: boolean
}

export interface InitRewardTimes extends InternalTxBase {
  nominee: string
  timestamp: number
  nodeActivatedTime: number
  sign: ShardusTypes.Sign
}

export interface TransactionKeys extends ShardusTypes.TransactionKeys {
  storageKeys?: string[]
}

export interface ClaimRewardTX extends InternalTxBase {
  nominee: string
  nominator: string
  timestamp: number
  deactivatedNodeId: string
  nodeDeactivatedTime: number
  sign: ShardusTypes.Sign
}

export enum ViolationType {
  ShardusCoreMaxID = 999,
  ShardeumMinID = 1000,
  // 0-999 reserved for shardus core
  LeftNetworkEarly = 1000,
  SyncingTooLong = 1001,
  DoubleVote = 1002,
  NodeRefuted = 1003,
  //..others tbd

  ShardeumMaxID = 2000
}

export interface SyncingTimeoutViolationData {
  nodeLostCycle: number
  nodeDroppedTime: number
}

export interface LeftNetworkEarlyViolationData {
  nodeLostCycle: number
  nodeDroppedCycle: number
  nodeDroppedTime: number
}

export interface NodeRefutedViolationData {
  nodeRefutedCycle: number
  nodeRefutedTime: number
}

export interface PenaltyTX extends InternalTxBase {
  reportedNodeId: string
  reportedNodePublickKey: string
  operatorEVMAddress: string
  violationType: ViolationType
  violationData: LeftNetworkEarlyViolationData | SyncingTimeoutViolationData | NodeRefutedViolationData
  // will add more types later
  timestamp: number
  sign: ShardusTypes.Sign
}

export interface DebugTx {
  isDebugTx: boolean
  debugTXType: DebugTXType
  timestamp: number
  from: string
  to?: string
  accountData?: WrappedEVMAccount
}

export interface WrappedAccount {
  accountId: string
  stateId: string
  // this affects src/index.ts which is being worked on in another branch
  // I don't want to merge this branch until that one is merged
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any //NetworkAccount | NodeAccount2 | WrappedEVMAccount
  timestamp: number
  accountCreated?: boolean
}

export interface WrappedStates {
  [id: string]: WrappedAccount
}

export interface OurAppDefinedData {
  globalMsg: {
    address: string
    value: {
      isInternalTx: boolean
      internalTXType: InternalTXType
      timestamp: number
      accountData?: WrappedEVMAccount
      from?: string
      change?: {
        cycle: ShardusTypes.Cycle
        change: Change
      }
    }
    when: number
    source: string
  }
}

export interface ReadableReceipt {
  status: number // 1 for success, 0 for failure
  transactionHash: string
  transactionIndex: string
  blockNumber: string
  nonce: string
  blockHash: string
  cumulativeGasUsed: string
  gasUsed: string
  gasRefund: string
  gasPrice?: string
  gasLimit?: string
  logs: string[]
  logsBloom: string
  contractAddress: string | null
  from: string
  to: string
  value: string
  type?: string
  data: string
  chainId?: string
  reason?: string // Added this to add the evm error reason
  stakeInfo?: StakeInfo
  isInternalTx?: boolean
  internalTx?: InternalTx
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  v?: string
  r?: string
  s?: string
}

// This is used in stake/unstake tx receipt
export interface StakeInfo {
  // Node Account;
  nominee: string
  stake?: bigint
  reward?: bigint
  penalty?: bigint
  totalStakeAmount?: bigint
  totalUnstakeAmount?: bigint
  rewardStartTime?: number // this is not used anymore
  rewardEndTime?: number // this is not used anymore
}

export interface NetworkAccount extends BaseAccount {
  id: string
  current: NetworkParameters
  listOfChanges: Array<{
    cycle: number
    change: Change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appData: any
  }>
  next: NetworkParameters | object //todo potentially improve this, but will need functional changes
  hash: string
  timestamp: number
}

//type guard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNetworkAccount(obj: any): obj is NetworkAccount {
  return 'current' in obj && 'listOfChanges' in obj && 'next' in obj
}

export interface NetworkParameters {
  title: string
  description: string
  nodeRewardInterval: number
  nodeRewardAmountUsd: bigint
  nodePenaltyUsd: bigint
  stakeRequiredUsd: bigint
  maintenanceInterval: number
  maintenanceFee: number
  stabilityScaleMul: number
  stabilityScaleDiv: number
  minVersion: string
  activeVersion: string
  latestVersion: string
  archiver: {
    minVersion: string
    activeVersion: string
    latestVersion: string
  }
  txPause: boolean
  certCycleDuration: number
}

export interface NodeAccount2 extends BaseAccount {
  id: string
  hash: string
  timestamp: number
  nominator: string | null
  stakeLock: bigint //amount of coins in stake
  reward: bigint
  rewardStartTime: number
  rewardEndTime: number
  penalty: bigint
  nodeAccountStats: NodeAccountStats
  rewarded: boolean
}

//type guard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNodeAccount2(obj: any): obj is NodeAccount2 {
  return 'nodeAccountStats' in obj && 'rewardStartTime' in obj && 'rewardEndTime' in obj
}

export interface NodeAccountStats {
  //update when node is rewarded (exits)
  totalReward: bigint
  totalPenalty: bigint
  //push begin and end times when rewarded
  history: { b: number; e: number }[]
  lastPenaltyTime: number
  penaltyHistory: { type: ViolationType; amount: bigint; timestamp: number }[]
  //set when first staked
  isShardeumRun: boolean
}

export interface DevAccount extends BaseAccount {
  id: string
  hash: string
  timestamp: number
}

export interface OperatorAccountInfo {
  stake: bigint
  nominee: string
  certExp: number
  operatorStats: OperatorStats
}

export interface OperatorStats {
  //update when node is rewarded (exits)
  totalNodeReward: bigint
  totalNodePenalty: bigint
  totalNodeTime: number
  //push begin and end times when rewarded
  history: { b: number; e: number }[]

  //update then unstaked
  totalUnstakeReward: bigint
  unstakeCount: number

  //set when first staked
  isShardeumRun: boolean
  lastStakedNodeKey: string
}

export interface ChangeConfig {
  type: string
  from: string
  cycle: ShardusTypes.Cycle
  config: string
  timestamp: number
}

export interface ApplyChangeConfig {
  type: string
  change: Change
  timestamp: number
}

export interface ChangeNetworkParam {
  type: string
  from: string
  cycle: ShardusTypes.Cycle
  config: string
  timestamp: number
}

export interface ApplyNetworkParam {
  type: string
  change: Change
  timestamp: number
}

// export interface InternalAccount extends NodeAccount, NetworkAccount, DevAccount {}

export type InternalAccount = NodeAccount2 | NetworkAccount | DevAccount

export interface NodeAccountQueryResponse {
  success: boolean
  nodeAccount?: NodeAccount2
}

export interface NodeAccountAxiosResponse {
  account: ShardusTypes.WrappedData
  error: string
}

export interface InjectTxResponse {
  success: boolean
  reason?: string
}

export interface NodeInfoAppData {
  shardeumVersion: string
  minVersion: string
  activeVersion: string
  latestVersion: string
  operatorCLIVersion: string
  operatorGUIVersion: string
}

export type HexString = string
export type DecimalString = string

export interface AppJoinData {
  version: string
  stakeCert: StakeCert
  adminCert: AdminCert
  mustUseAdminCert: boolean
}
