import { ShardusTypes } from '@shardus/core'
import { Change, WrappedEVMAccount } from './shardeumTypes'

export enum InternalTXType {
  SetGlobalCodeBytes = 0, //Deprecated
  InitNetwork = 1,
  NodeReward = 2, //Deprecated
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
  InitDao = 13,
  Dao = 14,
}

/**
 * InternalTx is a non EVM TX that shardeum can use for utility task such as global changes
 *
 */
export interface InternalTxBase {
  isInternalTx: true
  internalTXType: InternalTXType
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

export type InternalTx =
  | ClaimRewardTX
  | InitRewardTimes
  | OtherInternalTx
  | PenaltyTX
  | SetCertTime
  | StakeCoinsTX
  | UnstakeCoinsTX

export interface SetCertTime extends InternalTxBase {
  internalTXType: InternalTXType.SetCertTime
  nominee: string
  nominator: string
  duration: number
  timestamp: number
  sign: ShardusTypes.Sign
}

export interface StakeCoinsTX extends InternalTxBase {
  internalTXType: InternalTXType.Stake
  nominee: string
  nominator: string
  stake: bigint
  timestamp: number
  sign: ShardusTypes.Sign
}

export interface UnstakeCoinsTX extends InternalTxBase {
  internalTXType: InternalTXType.Unstake
  nominee: string
  nominator: string
  timestamp: number
  sign: ShardusTypes.Sign
  force: boolean
}

export interface InitRewardTimes extends InternalTxBase {
  internalTXType: InternalTXType.InitRewardTimes
  nominee: string
  timestamp: number
  nodeActivatedTime: number
  sign: ShardusTypes.Sign
}

export interface ClaimRewardTX extends InternalTxBase {
  internalTXType: InternalTXType.ClaimReward
  nominee: string
  nominator: string
  timestamp: number
  deactivatedNodeId: string
  nodeDeactivatedTime: number
  sign: ShardusTypes.Sign
}

export interface OtherInternalTx extends InternalTxBase {
  internalTXType:
    | InternalTXType.InitDao
    | InternalTXType.InitNetwork
    | InternalTXType.SetGlobalCodeBytes
    | InternalTXType.ChangeNetworkParam
    | InternalTXType.ApplyNetworkParam
    | InternalTXType.ApplyChangeConfig
    | InternalTXType.ChangeConfig
}

export interface PenaltyTX extends InternalTxBase {
  internalTXType: InternalTXType.Penalty
  reportedNodeId: string
  reportedNodePublickKey: string
  operatorEVMAddress: string
  violationType: ViolationType
  violationData: LeftNetworkEarlyViolationData // will add more types later
  timestamp: number
  sign: ShardusTypes.Sign
}

export interface LeftNetworkEarlyViolationData {
  nodeLostCycle: number
  nodeDroppedCycle: number
  nodeDroppedTime: number
}

export enum ViolationType {
  // 0-999 reserved for shardus core
  LeftNetworkEarly = 1000,
  SyncingTooLong = 1001,
  DoubleVote = 1002,
  //..others tbd
}
