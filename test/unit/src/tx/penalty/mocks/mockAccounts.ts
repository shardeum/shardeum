import { Account } from '@ethereumjs/util'
import {
  AccountType,
  NodeAccount2,
  NodeAccountStats,
  OperatorAccountInfo,
  OperatorStats,
  WrappedEVMAccount,
} from '../../../../../../src/shardeum/shardeumTypes'

/**
 * Factory function to create mock NodeAccountStats.
 */
export function createMockNodeAccountStats(overrides: Partial<NodeAccountStats> = {}): NodeAccountStats {
  return {
    totalReward: BigInt(0),
    totalPenalty: BigInt(0),
    history: [],
    lastPenaltyTime: 0,
    penaltyHistory: [],
    isShardeumRun: false,
    ...overrides,
  }
}

/**
 * Factory function to create mock NodeAccount2.
 */
export function createMockNodeAccount(overrides: Partial<NodeAccount2> = {}): NodeAccount2 {
  const mockNodeAccountStats = createMockNodeAccountStats(overrides.nodeAccountStats || {})

  return {
    id: 'mockNodeId',
    hash: '0x0',
    timestamp: 1000,
    rewardStartTime: 1000,
    rewardEndTime: 0,
    rewardRate: BigInt(100),
    nominator: 'mockNominatorAddress',
    rewarded: false,
    reward: BigInt(0),
    penalty: BigInt(0),
    nodeAccountStats: mockNodeAccountStats,
    accountType: AccountType.NodeAccount2,
    stakeLock: BigInt(1000),
    stakeTimestamp: 1000,
    ...overrides,
  }
}

/**
 * Factory function to create mock OperatorStats.
 */
export function createMockOperatorStats(overrides: Partial<OperatorStats> = {}): OperatorStats {
  return {
    totalNodeReward: BigInt(0),
    totalNodePenalty: BigInt(0),
    totalNodeTime: 0,
    history: [],
    totalUnstakeReward: BigInt(0),
    unstakeCount: 0,
    isShardeumRun: false,
    lastStakedNodeKey: '',
    ...overrides,
  }
}

/**
 * Factory function to create mock OperatorAccountInfo.
 */
export function createMockOperatorAccountInfo(overrides: Partial<OperatorAccountInfo> = {}): OperatorAccountInfo {
  const mockOperatorStats = createMockOperatorStats(overrides.operatorStats || {})

  return {
    nominee: 'mockPublicKey',
    operatorStats: mockOperatorStats,
    stake: BigInt(1000),
    certExp: 0,
    lastStakeTimestamp: 0,
    ...overrides,
  }
}

/**
 * Factory function to create mock WrappedEVMAccount.
 */
export function createMockOperatorAccount(overrides: Partial<WrappedEVMAccount> = {}): WrappedEVMAccount {
  const mockOperatorInfo = createMockOperatorAccountInfo(overrides.operatorAccountInfo || {})

  return {
    ethAddress: 'mockNominatorAddress',
    hash: '0x0',
    account: new Account(),
    operatorAccountInfo: mockOperatorInfo,
    timestamp: 1000,
    accountType: AccountType.Account,
    ...overrides,
  }
}
