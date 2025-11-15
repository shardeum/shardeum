import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { validateTxnFields } from '../../../../src/setup'
import { InternalTXType, UnstakeCoinsTX, WrappedEVMAccount, NodeAccount2, AccountType, WrappedStates } from '../../../../src/shardeum/shardeumTypes'
import { toShardusAddress } from '../../../../src/shardeum/evmAddress'
import { nestedCountersInstance } from '@shardeum-foundation/core'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'

jest.mock('@shardeum-foundation/lib-crypto-utils')

jest.mock('@shardeum-foundation/core', () => ({
  nestedCountersInstance: { countEvent: jest.fn() },
}))

const mockShardus = {
  isOnStandbyList: jest.fn().mockReturnValue(false),
  isNodeActiveByPubKey: jest.fn().mockReturnValue(false),
  isNodeSelectedByPubKey: jest.fn().mockReturnValue(false),
  isNodeReadyByPubKey: jest.fn().mockReturnValue(false),
  isNodeSyncingByPubKey: jest.fn().mockReturnValue(false),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('validateTxnFields - outdated unstake tx', () => {
  test('should reject unstake tx older than account timestamps', () => {
    const nominee = '0x' + '1'.repeat(64)
    const nominator = '0x' + '2'.repeat(40)

    const operatorAccount: WrappedEVMAccount = {
      ethAddress: nominator,
      hash: '0x0',
      timestamp: 20000,
      accountType: AccountType.Account,
      account: {
        balance: BigInt(0),
        nonce: BigInt(0),
        storageRoot: '',
        codeHash: '',
        _validate: () => true,
        raw: () => Buffer.from(''),
        serialize: () => Buffer.from(''),
        isContract: () => false,
      },
      operatorAccountInfo: {
        stake: BigInt(1),
        nominee,
        certExp: 0,
        lastStakeTimestamp: 0,
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
      },
    }

    const nodeAccount: NodeAccount2 = {
      id: nominee,
      hash: '0x0',
      timestamp: 21000,
      nominator,
      stakeLock: BigInt(1),
      stakeTimestamp: 0,
      reward: BigInt(0),
      rewardStartTime: 0,
      rewardEndTime: 0,
      penalty: BigInt(0),
      nodeAccountStats: {
        totalReward: BigInt(0),
        totalPenalty: BigInt(0),
        history: [],
        lastPenaltyTime: 0,
        penaltyHistory: [],
        isShardeumRun: false,
      },
      rewarded: false,
      rewardRate: BigInt(0),
      nominatorStake: BigInt(0),
      nominatorStakeTimestamp: 0,
      accountType: AccountType.NodeAccount2,
    }

    ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

    const unstakeTx: UnstakeCoinsTX = {
      isInternalTx: true,
      internalTXType: InternalTXType.Unstake,
      nominee,
      nominator,
      timestamp: 10000,
      sign: { owner: nominator, sig: '0x' },
      force: false,
    }

    const validate = validateTxnFields(mockShardus as any, new Map())
    const result = validate({ tx: unstakeTx }, {
      internalTx: unstakeTx,
      internalTXType: InternalTXType.Unstake,
      nomineeAccount: nodeAccount,
      nominatorAccount: operatorAccount,
    })

    expect(result.success).toBe(false)
    expect(result.reason).toBe('Transaction timestamp older than account timestamp')
    expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
      'shardeum',
      'tx validation successful'
    )
  })
})
