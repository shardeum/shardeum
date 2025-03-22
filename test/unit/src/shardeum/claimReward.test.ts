/**
 * Test suite for the claimReward functionality in the Shardeum blockchain
 * This file tests the claiming of rewards for node operators after node deactivation
 * 
 * The test suite covers:
 * 1. Transaction injection - Creating and submitting reward claim transactions
 * 2. Transaction validation - Verifying transaction format and signatures
 * 3. State validation - Checking account states and reward eligibility
 * 4. Reward application - Processing and distributing rewards
 * 
 * Key components tested:
 * - Node accounts: Represent validator nodes in the network
 * - Operator accounts: Manage node operations and receive rewards
 * - Network parameters: Define reward rates and validation rules
 * - Transaction processing: Handle reward claims and state updates
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'
import { nestedCountersInstance, ShardusTypes } from '@shardeum-foundation/core'
import { Address } from '@ethereumjs/util'
import { networkAccount } from '../../../../src/shardeum/shardeumConstants'
import * as claimReward from '../../../../src/tx/claimReward'
import {
  AccountType,
  ClaimRewardTX,
  InternalTXType,
  NetworkAccount,
  NetworkParameters,
  NodeAccount2,
  NodeAccountStats,
  NodeRewardTxData,
  OperatorAccountInfo,
  OperatorStats,
  WrappedAccount,
  WrappedEVMAccount,
  WrappedStates,
} from '../../../../src/shardeum/shardeumTypes'
import * as WrappedEVMAccountFunctions from '../../../../src/shardeum/wrappedEVMAccountFunctions'
import { generateTxId, sleep, _base16BNParser, scaleByStabilityFactor } from '../../../../src/utils'
import { toShardusAddress } from '../../../../src/shardeum/evmAddress'
import { ShardusTypes as ShardusServerMode } from '@shardeum-foundation/core'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import * as indexModule from '../../../../src/index'

/**
 * Mock Implementation Details
 * -------------------------
 * Key mock behaviors:
 * 
 * crypto.verifyObj:
 * - Simulates cryptographic signature verification
 * - Returns true for valid signatures, false for invalid ones
 * 
 * generateTxId:
 * - Provides consistent transaction IDs for testing
 * - Helps track transaction flow through the system
 * 
 * _base16BNParser:
 * - Converts values to BigInt format
 * - Handles network parameters and reward calculations
 * 
 * scaleByStabilityFactor:
 * - Simulates network stability adjustments
 * - Scales reward amounts based on network conditions
 */

// Mock all external dependencies to isolate test cases
jest.mock('@shardeum-foundation/core')
jest.mock('@shardeum-foundation/lib-crypto-utils')
jest.mock('../../../../src/setup/helpers')
jest.mock('../../../../src/utils')
jest.mock('../../../../src/shardeum/wrappedEVMAccountFunctions')
jest.mock('../../../../src/shardeum/evmAddress')

/**
 * Create a mock state object that simulates the blockchain state
 * This state object is used across tests to maintain consistency
 */
const mockApplyState = {
  _transactionState: {
    appData: {},
  },
  checkpoint: jest.fn(),
  putAccount: jest.fn(),
  commit: jest.fn(),
}

// Setup promise-based mock implementations for state operations
mockApplyState.checkpoint.mockImplementation(() => Promise.resolve())
mockApplyState.putAccount.mockImplementation(() => Promise.resolve())
mockApplyState.commit.mockImplementation(() => Promise.resolve())

/**
 * Mock the index module to provide core functionality
 * This includes logFlags for verbose logging and transaction state management
 */
jest.mock('../../../../src/index', () => {
  // Expose logFlags globally for consistent logging behavior
  global.logFlags = {
    dapp_verbose: false,
  }

  return {
    shardeumGetTime: jest.fn(() => 3000),
    getApplyTXState: jest.fn(() => mockApplyState),
    logFlags: global.logFlags,
    createInternalTxReceipt: jest.fn(),
  }
})

// Store references to frequently used mock functions for assertions
const mockCreateInternalTxReceipt = indexModule.createInternalTxReceipt as jest.Mock
const mockGetApplyTXState = indexModule.getApplyTXState as jest.Mock

/**
 * Account Structure Details
 * -----------------------
 * Three main account types are tested:
 * 
 * 1. Node Account (mockNodeAccount):
 *    - Tracks node operation time
 *    - Manages reward status and amounts
 *    - Stores operational statistics
 * 
 * 2. Network Account (mockNetworkAccount):
 *    - Defines reward rates and intervals
 *    - Controls network parameters
 *    - Manages network operation mode
 * 
 * 3. Operator Account (mockOperatorAccount):
 *    - Receives node rewards
 *    - Tracks total earnings and operation time
 *    - Maintains operation history
 */

describe('claimReward', () => {
  // Setup common test variables
  const mockPublicKey = '0x' + '1'.repeat(62) // 64-character hex string for public key
  const mockNominatorAddress = '0x' + '2'.repeat(40) // 42-character hex string for Ethereum address
  const mockNodeId = '0x' + '3'.repeat(62) // 64-character hex string for node ID
  const mockTxData: NodeRewardTxData = {
    publicKey: mockPublicKey,
    nodeId: mockNodeId,
    endTime: 2000, // Node deactivation time
  }
  const mockSignature = 'mockSignature'
  const mockTxId = 'mockTxId'
  const mockTimestamp = 3000 // Transaction timestamp, after endTime

  // Mock objects
  let mockShardus: jest.Mocked<any>
  let mockWrappedStates: WrappedStates
  let mockApplyResponse: ShardusTypes.ApplyResponse
  let mockClaimRewardTx: ClaimRewardTX
  let mockNodeAccount: NodeAccount2
  let mockNetworkAccount: NetworkAccount
  let mockOperatorAccount: WrappedEVMAccount

  beforeEach(() => {
    jest.clearAllMocks()

    // Initialize mock Shardus instance
    mockShardus = {
      getLocalOrRemoteAccount: jest.fn(),
      signAsNode: jest.fn().mockImplementation((tx: any) => ({ ...tx, signature: mockSignature })),
      put: jest.fn().mockReturnValue(mockClaimRewardTx), // Return the mock tx for successful injection
      serviceQueue: {
        containsTxData: jest.fn().mockReturnValue(true),
      },
      getNode: jest.fn().mockReturnValue(null), // Default to node not active
      applyResponseSetFailed: jest.fn(),
      applyResponseAddChangedAccount: jest.fn(),
    }

    // Initialize mock node account statistics
    const mockNodeAccountStats: NodeAccountStats = {
      totalReward: BigInt(0),
      totalPenalty: BigInt(0),
      history: [],
      lastPenaltyTime: 0,
      penaltyHistory: [],
      isShardeumRun: false,
    }

    // Create mock node account
    mockNodeAccount = {
      type: 'node',
      id: mockNodeId,
      hash: '0x0',
      timestamp: 1000,
      rewardStartTime: 1000, // Start time for reward calculation
      rewardEndTime: 0, // Not yet claimed
      rewardRate: BigInt(100),
      nominator: mockNominatorAddress,
      rewarded: false,
      reward: BigInt(0),
      penalty: BigInt(0),
      nodeAccountStats: mockNodeAccountStats,
      accountType: AccountType.NodeAccount2,
      stakeLock: BigInt(1000),
      stakeTimestamp: 1000,
      nominatorStake: BigInt(1000),
      nominatorStakeTimestamp: 1000,
    } as NodeAccount2

    /**
     * Create mock network parameters
     * These parameters define the network's reward and penalty rules
     */
    const mockNetworkParams: NetworkParameters = {
      title: 'Test Network',
      description: 'Test Network Description',
      nodeRewardInterval: 100, // Interval between reward distributions
      nodeRewardAmountUsd: BigInt(100), // Base reward amount in USD
      nodePenaltyUsd: BigInt(500), // Penalty amount in USD
      stakeRequiredUsd: BigInt(5000), // Required stake amount in USD
      restakeCooldown: 100, // Cooldown period for restaking
      maintenanceInterval: 100,
      maintenanceFee: 0,
      stabilityScaleMul: 1000, // Multiplier for stability scaling
      stabilityScaleDiv: 1000, // Divisor for stability scaling
      minVersion: '1.0.0',
      activeVersion: '1.0.0',
      latestVersion: '1.0.0',
      archiver: {
        minVersion: '1.0.0',
        activeVersion: '1.0.0',
        latestVersion: '1.0.0',
      },
      txPause: false,
      certCycleDuration: 30,
      enableNodeSlashing: false,
      qa: {
        qaTestNumber: 0,
        qaTestBoolean: false,
        qaTestPercent: 0,
        qaTestSemver: '0.0.0',
      },
      slashing: {
        enableLeftNetworkEarlySlashing: false,
        enableSyncTimeoutSlashing: false,
        enableNodeRefutedSlashing: false,
        leftNetworkEarlyPenaltyPercent: 0.2,
        syncTimeoutPenaltyPercent: 0.2,
        nodeRefutedPenaltyPercent: 0.2,
      },
      enableRPCEndpoints: false,
      stakeLockTime: 6000,
      chainID: 8082,
    }

    /**
     * Create mock network account
     * This represents the network's global state and configuration
     */
    mockNetworkAccount = {
      type: 'network',
      id: networkAccount,
      hash: '0x0',
      timestamp: 1000,
      listOfChanges: [],
      next: {},
      current: mockNetworkParams,
      accountType: AccountType.NetworkAccount,
      mode: ShardusServerMode.ServerMode.Release,
    } as unknown as NetworkAccount

    /**
     * Initialize operator statistics
     * These track the operator's overall performance and rewards
     */
    const mockOperatorStats: OperatorStats = {
      totalNodeReward: BigInt(0), // Total rewards earned across all nodes
      totalNodePenalty: BigInt(0), // Total penalties incurred across all nodes
      totalNodeTime: 0, // Total time operating nodes
      history: [], // History of node operations
      totalUnstakeReward: BigInt(0),
      unstakeCount: 0,
      isShardeumRun: false,
      lastStakedNodeKey: '',
    }

    /**
     * Create mock operator account info
     * This contains the operator's stake and certification details
     */
    const mockOperatorInfo: OperatorAccountInfo = {
      nominee: mockPublicKey,
      operatorStats: mockOperatorStats,
      stake: BigInt(1000),
      certExp: 0,
      lastStakeTimestamp: 0,
    }

    /**
     * Create mock operator account
     * This represents the node operator's account on the network
     */
    mockOperatorAccount = {
      type: 'account',
      ethAddress: mockNominatorAddress,
      hash: '0x0',
      account: {
        nonce: BigInt(0),
        balance: BigInt(1000),
        storageRoot: '0x0',
        codeHash: '0x0',
        _validate: () => true,
        raw: () => Buffer.from(''),
        serialize: () => Buffer.from(''),
        isContract: () => false,
      },
      operatorAccountInfo: mockOperatorInfo,
      timestamp: 1000,
      accountType: AccountType.Account,
    } as unknown as WrappedEVMAccount

    /**
     * Create wrapped account representations
     * These wrap the raw account data in the format expected by the network
     */
    const mockWrappedNodeAccount: WrappedAccount = {
      accountId: mockPublicKey,
      stateId: '0x0',
      timestamp: 1000,
      data: mockNodeAccount,
    }

    const mockWrappedNetworkAccount: WrappedAccount = {
      accountId: networkAccount,
      stateId: '0x0',
      timestamp: 1000,
      data: mockNetworkAccount,
    }

    const mockWrappedOperatorAccount: WrappedAccount = {
      accountId: toShardusAddress(mockNominatorAddress, AccountType.Account),
      stateId: '0x0',
      timestamp: 1000,
      data: mockOperatorAccount,
    }

    /**
     * Initialize the wrapped states object
     * This represents the complete state of all accounts involved in the test
     */
    mockWrappedStates = {
      [mockPublicKey]: mockWrappedNodeAccount,
      [networkAccount]: mockWrappedNetworkAccount,
      [toShardusAddress(mockNominatorAddress, AccountType.Account)]: mockWrappedOperatorAccount,
    }

    /**
     * Initialize mock apply response
     * This object tracks the results and changes of transaction application
     */
    mockApplyResponse = {
      stateTableResults: [],
      txId: mockTxId,
      txTimestamp: mockTimestamp,
      accountData: [],
      accountWrites: [],
      appDefinedData: {},
      failed: false,
      failMessage: '',
      appReceiptData: null,
      appReceiptDataHash: '',
    } as ShardusTypes.ApplyResponse

    /**
     * Create mock signature for transaction validation
     * This simulates the cryptographic proof of transaction authenticity
     */
    const mockSign = {
      owner: mockPublicKey,
      sig: mockSignature,
    }

    /**
     * Create mock claim reward transaction
     * This represents the transaction that initiates the reward claim process
     */
    mockClaimRewardTx = {
      nominee: mockPublicKey,
      nominator: mockNominatorAddress,
      timestamp: mockTimestamp,
      deactivatedNodeId: mockNodeId,
      nodeDeactivatedTime: mockTxData.endTime,
      cycle: 1,
      isInternalTx: true,
      internalTXType: InternalTXType.ClaimReward,
      txData: mockTxData,
      signature: mockSignature,
      sign: mockSign,
    } as unknown as ClaimRewardTX

    /**
     * Setup common mock implementations
     * These provide consistent behavior for external dependencies
     */
    ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)
    ;(generateTxId as jest.Mock).mockReturnValue(mockTxId)

    /**
     * Configure wrapped EVM account function mocks
     * These handle the conversion between different account formats
     */
    ;(WrappedEVMAccountFunctions._shardusWrappedAccount as jest.Mock).mockImplementation((account: unknown) => ({
      data: account,
    }))

    /**
     * Setup account type checking mocks
     * These determine how different account types are handled
     */
    ;(WrappedEVMAccountFunctions.isWrappedEVMAccount as unknown as jest.Mock).mockImplementation((data: unknown) => {
      if (data && typeof data === 'object' && 'accountType' in data && data.accountType === AccountType.Account) {
        return true
      }
      return false
    })

    ;(WrappedEVMAccountFunctions.isInternalAccount as unknown as jest.Mock).mockImplementation((data: unknown) => {
      if (data && typeof data === 'object' && 'accountType' in data && data.accountType === AccountType.NodeAccount2) {
        return true
      }
      return false
    })

    /**
     * Setup utility function mocks
     * These provide predictable behavior for time-based operations
     */
    ;(sleep as jest.Mock).mockImplementation(() => Promise.resolve())

    /**
     * Configure reward calculation mocks
     * These ensure consistent and predictable reward amounts for testing
     */
    ;(_base16BNParser as jest.Mock).mockImplementation((value: unknown) => {
      if (typeof value === 'bigint') {
        return value
      }

      // Return meaningful values for network reward amount
      if (value === mockNetworkAccount.current.nodeRewardAmountUsd) {
        return BigInt(100)
      }

      // Handle existing reward values in node account
      if (value === mockNodeAccount.reward) {
        return BigInt(0) // Initial reward is zero
      }

      // Handle existing totalReward in nodeAccountStats
      if (value === mockNodeAccount.nodeAccountStats.totalReward) {
        return BigInt(0) // Initial total reward is zero
      }

      // Handle operator account stats totalNodeReward
      if (
        mockOperatorAccount.operatorAccountInfo &&
        value === mockOperatorAccount.operatorAccountInfo.operatorStats.totalNodeReward
      ) {
        return BigInt(0) // Initial operator total reward is zero
      }

      return BigInt(0)
    })

    /**
     * Configure stability factor scaling mock
     * This simulates the network's reward scaling mechanism
     */
    ;(scaleByStabilityFactor as jest.Mock).mockImplementation((value: unknown, network?: any) => {
      // For the node reward amount coming from _base16BNParser
      if (value === BigInt(100)) {
        return BigInt(1000) // Scaled reward amount for consistent testing
      }

      if (typeof value === 'bigint') {
        return value
      }

      return BigInt(0)
    })

    /**
     * Setup address conversion mock
     * This ensures consistent address formatting across the test suite
     */
    ;(toShardusAddress as jest.Mock).mockImplementation((address: unknown, accountType?: unknown) => {
      if (address === mockNominatorAddress && accountType === AccountType.Account) {
        return `shardus_${mockNominatorAddress}`
      }
      return String(address)
    })
  })

  describe('injectClaimRewardTx', () => {
    /**
     * Mock event data for testing transaction injection
     * This simulates the event that triggers a reward claim
     */
    const mockEventData = {
      publicKey: mockPublicKey,
      nodeId: mockNodeId,
      time: 2000,
      cycleNumber: 1,
      additionalData: {
        txData: mockTxData,
      },
    }

    test('should successfully inject claim reward transaction', async () => {
      /**
       * Setup: Configure mock to return a valid node account
       * This simulates finding an existing node in the network
       */
      mockShardus.getLocalOrRemoteAccount.mockResolvedValue({
        data: mockNodeAccount,
      })

      // Execute the transaction injection
      const result = await claimReward.injectClaimRewardTx(mockShardus, mockEventData)

      /**
       * Verify:
       * 1. Transaction was signed by the node
       * 2. Transaction was successfully put into the network
       */
      expect(mockShardus.put).toHaveBeenCalled()
      expect(mockShardus.signAsNode).toHaveBeenCalled()
    })

    test('should fail when node account not found', async () => {
      /**
       * Setup: Configure mock to simulate missing node account
       * This tests the error handling when a node doesn't exist
       */
      mockShardus.getLocalOrRemoteAccount.mockResolvedValue(null)

      // Execute the transaction injection
      const result = await claimReward.injectClaimRewardTx(mockShardus, mockEventData)

      /**
       * Verify:
       * 1. Transaction was not put into network
       * 2. Appropriate error event was counted
       */
      expect(mockShardus.put).not.toHaveBeenCalled()
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'injectClaimRewardTx failed cant find node'
      )
    })

    test('should fail when rewardStartTime is negative', async () => {
      /**
       * Setup: Create node account with invalid start time
       * This tests validation of reward timing constraints
       */
      const nodeAccountWithNegativeStart = { ...mockNodeAccount, rewardStartTime: -1 }
      mockShardus.getLocalOrRemoteAccount.mockResolvedValue({
        data: nodeAccountWithNegativeStart,
      })

      // Execute the transaction injection
      const result = await claimReward.injectClaimRewardTx(mockShardus, mockEventData)

      /**
       * Verify:
       * 1. Transaction was not put into network
       * 2. Appropriate error event was counted
       */
      expect(mockShardus.put).not.toHaveBeenCalled()
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'injectClaimRewardTx failed rewardStartTime < 0'
      )
    })

    test('should fail when rewardEndTime already set', async () => {
      /**
       * Setup: Create node account with reward already claimed
       * This tests prevention of double-claiming rewards
       */
      const nodeAccountWithEndTimeSet = {
        ...mockNodeAccount,
        rewardEndTime: mockEventData.additionalData.txData.endTime + 1,
      }
      mockShardus.getLocalOrRemoteAccount.mockResolvedValue({
        data: nodeAccountWithEndTimeSet,
      })

      // Execute the transaction injection
      const result = await claimReward.injectClaimRewardTx(mockShardus, mockEventData)

      /**
       * Verify:
       * 1. Transaction was not put into network
       * 2. Appropriate error event was counted
       */
      expect(mockShardus.put).not.toHaveBeenCalled()
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'injectClaimRewardTx failed rewardEndTime already set'
      )
    })
  })

  describe('validateClaimRewardTx', () => {
    /**
     * Test successful transaction validation
     * Verifies that a properly formed transaction passes all checks
     */
    test('should validate successful transaction', () => {
      /**
       * Setup:
       * 1. Node is not active (mockShardus.getNode returns null)
       * 2. Transaction signature is valid (crypto.verifyObj returns true)
       */
      mockShardus.getNode.mockReturnValue(null)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      // Execute validation
      const result = claimReward.validateClaimRewardTx(mockClaimRewardTx, mockShardus)

      /**
       * Verify:
       * 1. Validation passes (isValid is true)
       * 2. No error reason is provided
       */
      expect(result.isValid).toBe(true)
      expect(result.reason).toBe('')
    })

    /**
     * Test validation failure with invalid nominee address
     * Verifies that transaction is rejected for malformed nominee addresses
     */
    test('should fail with invalid nominee', () => {
      /**
       * Setup: Test multiple invalid nominee values
       * Each should trigger validation failure
       */
      const invalidNominees = ['', '123', undefined] as const

      invalidNominees.forEach((nominee) => {
        const txWithInvalidNominee = {
          ...mockClaimRewardTx,
          nominee: nominee as string,
        }

        // Execute validation for each invalid nominee
        const result = claimReward.validateClaimRewardTx(txWithInvalidNominee as ClaimRewardTX, mockShardus)

        /**
         * Verify:
         * 1. Validation fails
         * 2. Correct error message is set
         * 3. Error event is counted
         */
        expect(result.isValid).toBe(false)
        expect(result.reason).toBe('Invalid nominee address')
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-staking',
          'validateClaimRewardTx fail tx.nominee address invalid'
        )
      })
    })

    /**
     * Test validation failure with invalid node ID
     * Verifies that transaction is rejected for malformed node IDs
     */
    test('should fail with invalid deactivatedNodeId', () => {
      /**
       * Setup: Test multiple invalid node ID values
       * Each should trigger validation failure
       */
      const invalidNodeIds = ['', '123', undefined] as const

      invalidNodeIds.forEach((nodeId) => {
        const txWithInvalidNodeId = {
          ...mockClaimRewardTx,
          deactivatedNodeId: nodeId as string,
        }

        // Execute validation for each invalid node ID
        const result = claimReward.validateClaimRewardTx(txWithInvalidNodeId as ClaimRewardTX, mockShardus)

        /**
         * Verify:
         * 1. Validation fails
         * 2. Correct error message is set
         * 3. Error event is counted
         */
        expect(result.isValid).toBe(false)
        expect(result.reason).toBe('Invalid deactivatedNodeId')
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-staking',
          'validateClaimRewardTx fail tx.deactivatedNodeId address invalid'
        )
      })
    })

    /**
     * Test validation failure with invalid deactivation time
     * Verifies that transaction is rejected when duration is not positive
     */
    test('should fail with invalid nodeDeactivatedTime', () => {
      /**
       * Setup: Create transaction with zero deactivation time
       * This results in zero duration, which is invalid
       */
      const txWithInvalidTime = {
        ...mockClaimRewardTx,
        nodeDeactivatedTime: 0,
      }

      // Execute validation
      const result = claimReward.validateClaimRewardTx(txWithInvalidTime, mockShardus)

      /**
       * Verify:
       * 1. Validation fails
       * 2. Correct error message is set
       * 3. Error event is counted
       */
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('duration must be > 0')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateClaimRewardTx fail tx.duration <= 0'
      )
    })

    /**
     * Test validation failure when node is still active
     * Verifies that rewards cannot be claimed for active nodes
     */
    test('should fail when node is still active', () => {
      /**
       * Setup: Configure mock to indicate node is still active
       * Active nodes should not be able to claim rewards
       */
      mockShardus.getNode.mockReturnValue({ active: true })

      // Execute validation
      const result = claimReward.validateClaimRewardTx(mockClaimRewardTx, mockShardus)

      /**
       * Verify:
       * 1. Validation fails
       * 2. Correct error message is set
       * 3. Error event is counted
       */
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Node is still active')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateClaimRewardTx fail node still active'
      )
    })

    /**
     * Test validation failure with invalid signature
     * Verifies that transaction is rejected for invalid signatures
     */
    test('should fail with invalid signature', () => {
      /**
       * Setup: Configure crypto mock to indicate invalid signature
       * This simulates a tampered or incorrectly signed transaction
       */
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(false)

      // Execute validation
      const result = claimReward.validateClaimRewardTx(mockClaimRewardTx, mockShardus)

      /**
       * Verify:
       * 1. Validation fails
       * 2. Correct error message is set
       * 3. Error event is counted
       */
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Invalid signature for ClaimReward tx')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateClaimRewardTx fail Invalid signature'
      )
    })
  })

  describe('validateClaimRewardState', () => {
    /**
     * Test successful state validation
     * Verifies that a valid state configuration passes all checks
     */
    test('should validate successful state', () => {
      // Execute state validation
      const result = claimReward.validateClaimRewardState(mockClaimRewardTx, mockWrappedStates, mockShardus)

      /**
       * Verify:
       * 1. Validation passes
       * 2. Success message is set
       */
      expect(result.result).toBe('pass')
      expect(result.reason).toBe('valid')
    })

    /**
     * Test state validation failure with negative reward start time
     * Verifies that invalid reward timing is rejected
     */
    test('should fail with negative rewardStartTime', () => {
      /**
       * Setup: Set invalid reward start time
       * Negative start time should be rejected as invalid
       */
      mockNodeAccount.rewardStartTime = -1

      // Execute state validation
      const result = claimReward.validateClaimRewardState(mockClaimRewardTx, mockWrappedStates, mockShardus)

      /**
       * Verify:
       * 1. Validation fails
       * 2. Correct error message is set
       * 3. Error event is counted
       */
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('rewardStartTime is less than 0')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateClaimRewardState fail rewardStartTime < 0'
      )
    })

    /**
     * Test state validation failure when reward end time is already set
     * Verifies prevention of double reward claims
     */
    test('should fail when rewardEndTime already set', () => {
      /**
       * Setup: Set reward end time to indicate previous claim
       * Already claimed rewards should not be claimable again
       */
      mockNodeAccount.rewardEndTime = mockClaimRewardTx.nodeDeactivatedTime + 1

      // Execute state validation
      const result = claimReward.validateClaimRewardState(mockClaimRewardTx, mockWrappedStates, mockShardus)

      /**
       * Verify:
       * 1. Validation fails
       * 2. Correct error message is set
       * 3. Error event is counted
       */
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('rewardEndTime is already set')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateClaimRewardState fail rewardEndTime already set'
      )
    })

    /**
     * Test state validation failure with mismatched nominator
     * Verifies that only the correct nominator can claim rewards
     */
    test('should fail with mismatched nominator', () => {
      /**
       * Setup: Set different nominator address
       * This simulates an unauthorized claim attempt
       */
      mockNodeAccount.nominator = '0x' + '9'.repeat(40)

      // Execute state validation
      const result = claimReward.validateClaimRewardState(mockClaimRewardTx, mockWrappedStates, mockShardus)

      /**
       * Verify:
       * 1. Validation fails
       * 2. Correct error message is set
       * 3. Error event is counted
       */
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('tx.nominator does not match')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateClaimRewardState fail tx.nominator does not match'
      )
    })
  })

  describe('applyClaimRewardTx', () => {
    /**
     * Common variables for applyClaimRewardTx tests
     * These track the state changes during reward application
     */
    let mockApplyResponse: ShardusTypes.ApplyResponse
    let operatorShardusAddress: string

    beforeEach(() => {
      /**
       * Reset all mocks before each test
       * This ensures test isolation and prevents interference
       */
      mockShardus.applyResponseSetFailed.mockClear()
      mockShardus.applyResponseAddChangedAccount.mockClear()

      /**
       * Reset index module mocks
       * These handle transaction receipts and state management
       */
      mockCreateInternalTxReceipt.mockClear()
      mockGetApplyTXState.mockClear().mockReturnValue(mockApplyState)

      /**
       * Create fresh mock apply response
       * This tracks the results of transaction application
       */
      mockApplyResponse = {
        stateTableResults: [],
        txId: mockTxId,
        txTimestamp: mockTimestamp,
        accountData: [],
        accountWrites: [],
        appDefinedData: {},
        failed: false,
        failMessage: '',
        appReceiptData: null,
        appReceiptDataHash: '',
      } as ShardusTypes.ApplyResponse

      /**
       * Create consistent operator address
       * This ensures address formatting is stable across tests
       */
      operatorShardusAddress = `shardus_${mockNominatorAddress}`

      /**
       * Initialize wrapped states with all required accounts
       * This represents the complete state for reward processing
       */
      mockWrappedStates = {
        [mockPublicKey]: {
          accountId: mockPublicKey,
          stateId: '0x0',
          timestamp: 1000,
          data: mockNodeAccount,
        },
        [networkAccount]: {
          accountId: networkAccount,
          stateId: '0x0',
          timestamp: 1000,
          data: mockNetworkAccount,
        },
        [operatorShardusAddress]: {
          accountId: operatorShardusAddress,
          stateId: '0x0',
          timestamp: 1000,
          data: mockOperatorAccount,
        },
      }
    })

    /**
     * Test successful reward claim application
     * Verifies that rewards are correctly calculated and applied
     */
    test('should successfully apply reward claim', async () => {
      /**
       * Setup: Configure significant operation duration
       * This ensures a meaningful reward calculation
       */
      mockNodeAccount.rewardStartTime = 1000 // Start time
      mockClaimRewardTx.nodeDeactivatedTime = 600000 // End time - 10 minutes of operation
      mockTxData.endTime = 600000 // Make sure txData has matching end time

      /**
       * Set test parameters for reward calculation
       * These create a scenario with substantial rewards
       */
      const mockDuration = 599000 // 599,000 seconds in network (almost 10 minutes)
      mockNodeAccount.rewarded = false
      mockNodeAccount.reward = BigInt(0)
      mockNetworkAccount.current.nodeRewardInterval = 3600 * 1000 // 1 hour in ms

      /**
       * Reset mocks for clean test execution
       * This prevents interference from previous test runs
       */
      jest.clearAllMocks()

      /**
       * Configure reward calculation mocks
       * These provide predictable reward values
       */
      ;(_base16BNParser as jest.Mock).mockImplementation((value: unknown) => {
        if (value === mockNetworkAccount.current.nodeRewardAmountUsd) {
          return BigInt(100)
        }
        return typeof value === 'bigint' ? value : BigInt(0)
      })

      ;(scaleByStabilityFactor as jest.Mock).mockImplementation((value: unknown) => {
        if (value === BigInt(100)) {
          return BigInt(1000) // Scaled reward amount
        }
        return typeof value === 'bigint' ? value : BigInt(0)
      })

      /**
       * Execute reward claim application
       * This processes the complete reward calculation and distribution
       */
      await claimReward.applyClaimRewardTx(
        mockShardus,
        mockClaimRewardTx,
        mockWrappedStates,
        mockTxId,
        mockTimestamp,
        mockApplyResponse
      )

      /**
       * Verify successful application:
       * 1. Transaction did not fail
       * 2. Node is marked as rewarded
       * 3. Reward end time is set correctly
       * 4. Node timestamp is updated
       * 5. Reward amount is positive
       * 6. Node history is updated
       * 7. Operator account is updated with reward
       */
      expect(mockApplyResponse.failed).toBe(false)
      expect(mockNodeAccount.rewarded).toBe(true)
      expect(mockNodeAccount.rewardEndTime).toBe(mockClaimRewardTx.nodeDeactivatedTime)
      expect(mockNodeAccount.timestamp).toBe(mockTimestamp)
      expect(mockNodeAccount.reward).toBeGreaterThan(BigInt(0))
      expect(mockNodeAccount.nodeAccountStats.history.length).toBe(1)
      expect(mockNodeAccount.nodeAccountStats.history[0].b).toBe(mockNodeAccount.rewardStartTime)
      expect(mockNodeAccount.nodeAccountStats.history[0].e).toBe(mockNodeAccount.rewardEndTime)

      /**
       * Verify operator account updates:
       * 1. History is recorded
       * 2. Total node time is tracked
       * 3. Total rewards are accumulated
       * 4. Timestamp is updated
       */
      expect(mockOperatorAccount.operatorAccountInfo!.operatorStats.history.length).toBe(1)
      expect(mockOperatorAccount.operatorAccountInfo!.operatorStats.totalNodeTime).toBe(mockDuration)
      expect(mockOperatorAccount.operatorAccountInfo!.operatorStats.totalNodeReward).toBeGreaterThan(BigInt(0))
      expect(mockOperatorAccount.timestamp).toBe(mockTimestamp)
    })

    /**
     * Test failure when node has negative reward start time
     * Verifies that invalid timing configurations are rejected
     */
    test('should fail when node has negative rewardStartTime', async () => {
      /**
       * Setup: Configure invalid reward start time
       * Negative start time should trigger validation failure
       */
      mockNodeAccount.rewardStartTime = -1

      /**
       * Execute reward claim application
       * This should fail due to invalid start time
       */
      await claimReward.applyClaimRewardTx(
        mockShardus,
        mockClaimRewardTx,
        mockWrappedStates,
        mockTxId,
        mockTimestamp,
        mockApplyResponse
      )

      /**
       * Verify failure handling:
       * 1. Correct error message is set
       * 2. Error event is counted
       */
      expect(mockShardus.applyResponseSetFailed).toHaveBeenCalledWith(
        mockApplyResponse,
        expect.stringContaining('rewardStartTime is less than 0')
      )
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateClaimRewardState fail rewardStartTime < 0'
      )
    })

    /**
     * Test failure when duration in network is negative
     * Verifies that invalid duration calculations are rejected
     */
    test('should fail when durationInNetwork is negative', async () => {
      /**
       * Setup: Configure start time after deactivation
       * This creates a negative duration scenario
       */
      mockNodeAccount.rewardStartTime = mockClaimRewardTx.nodeDeactivatedTime + 100

      /**
       * Execute reward claim application
       * This should fail due to negative duration
       */
      await claimReward.applyClaimRewardTx(
        mockShardus,
        mockClaimRewardTx,
        mockWrappedStates,
        mockTxId,
        mockTimestamp,
        mockApplyResponse
      )

      /**
       * Verify failure handling:
       * 1. Correct error message is set
       * 2. Error event is counted
       */
      expect(mockShardus.applyResponseSetFailed).toHaveBeenCalledWith(
        mockApplyResponse,
        expect.stringContaining('durationInNetwork is less than 0')
      )
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'applyClaimRewardTx fail durationInNetwork < 0'
      )
    })

    /**
     * Test failure when node is already rewarded
     * Verifies prevention of double reward claims
     */
    test('should fail when node is already rewarded', async () => {
      /**
       * Setup: Mark node as already rewarded
       * This simulates an attempt to claim rewards twice
       */
      mockNodeAccount.rewarded = true

      /**
       * Execute reward claim application
       * This should fail due to previous reward
       */
      await claimReward.applyClaimRewardTx(
        mockShardus,
        mockClaimRewardTx,
        mockWrappedStates,
        mockTxId,
        mockTimestamp,
        mockApplyResponse
      )

      /**
       * Verify failure handling:
       * 1. Correct error message is set
       * 2. Error event is counted
       */
      expect(mockShardus.applyResponseSetFailed).toHaveBeenCalledWith(
        mockApplyResponse,
        expect.stringContaining('already rewarded')
      )
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'applyClaimRewardTx fail already rewarded'
      )
    })

    /**
     * Test failure when operator account lacks required info
     * Verifies that incomplete accounts cannot claim rewards
     */
    test('should fail when operator account has no operatorAccountInfo', async () => {
      /**
       * Setup: Remove operator account info
       * This simulates an invalid operator account state
       */
      mockOperatorAccount.operatorAccountInfo = null as any

      /**
       * Execute reward claim application
       * This should fail due to missing operator info
       */
      await claimReward.applyClaimRewardTx(
        mockShardus,
        mockClaimRewardTx,
        mockWrappedStates,
        mockTxId,
        mockTimestamp,
        mockApplyResponse
      )

      /**
       * Verify failure handling:
       * 1. Correct error message is set
       * 2. Error event is counted
       */
      expect(mockShardus.applyResponseSetFailed).toHaveBeenCalledWith(
        mockApplyResponse,
        'applyClaimReward failed because `operatorAccountInfo` is null'
      )
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'claiming reward on account with no `operatorAccountInfo`'
      )
    })

    /**
     * Test handling of seed nodes with zero start time
     * Verifies special case handling for seed nodes
     */
    test('should handle seed nodes with rewardStartTime = 0', async () => {
      /**
       * Setup: Configure seed node parameters
       * Seed nodes have special reward handling
       */
      mockNodeAccount.rewardStartTime = 0
      mockNodeAccount.rewarded = false

      /**
       * Execute reward claim application
       * This processes the seed node reward claim
       */
      await claimReward.applyClaimRewardTx(
        mockShardus,
        mockClaimRewardTx,
        mockWrappedStates,
        mockTxId,
        mockTimestamp,
        mockApplyResponse
      )

      /**
       * Verify seed node handling:
       * 1. Transaction succeeds
       * 2. Node is marked as rewarded
       * 3. Seed node event is counted
       * 4. Zero duration is recorded
       */
      expect(mockApplyResponse.failed).toBe(false)
      expect(mockNodeAccount.rewarded).toBe(true)
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        `seed node claim reward ${mockNodeAccount.id}`
      )
      expect(mockOperatorAccount.operatorAccountInfo!.operatorStats.totalNodeTime).toBe(0)
    })

    /**
     * Test account writes handling with feature flag
     * Verifies proper account state updates when feature is enabled
     */
    test('should call applyResponseAddChangedAccount when useAccountWrites flag is true', async () => {
      /**
       * Setup: Enable account writes feature
       * This activates detailed account state tracking
       */
      const originalFlag = ShardeumFlags.useAccountWrites
      ShardeumFlags.useAccountWrites = true
      mockNodeAccount.rewardStartTime = mockTimestamp - 1000
      mockNodeAccount.rewarded = false
      ;(WrappedEVMAccountFunctions._shardusWrappedAccount as jest.Mock).mockReturnValue({})

      /**
       * Execute reward claim application
       * This should trigger account state updates
       */
      await claimReward.applyClaimRewardTx(
        mockShardus,
        mockClaimRewardTx,
        mockWrappedStates,
        mockTxId,
        mockTimestamp,
        mockApplyResponse
      )

      /**
       * Verify account updates:
       * 1. Changed accounts are recorded
       * 2. Both node and operator accounts are updated
       * 3. Updates include proper metadata
       */
      expect(mockShardus.applyResponseAddChangedAccount).toHaveBeenCalledTimes(2)
      expect(mockShardus.applyResponseAddChangedAccount).toHaveBeenCalledWith(
        mockApplyResponse,
        mockPublicKey,
        expect.any(Object),
        mockTxId,
        mockTimestamp
      )
      expect(mockShardus.applyResponseAddChangedAccount).toHaveBeenCalledWith(
        mockApplyResponse,
        toShardusAddress(mockNominatorAddress, AccountType.Account),
        expect.any(Object),
        mockTxId,
        mockTimestamp
      )

      // Restore original flag state
      ShardeumFlags.useAccountWrites = originalFlag
    })

    /**
     * Test transaction receipt creation with feature flag
     * Verifies proper receipt generation when feature is enabled
     */
    test('should create internal transaction receipt when supportInternalTxReceipt flag is true', async () => {
      /**
       * Setup: Enable transaction receipt feature
       * This activates detailed transaction tracking
       */
      const originalFlag = ShardeumFlags.supportInternalTxReceipt
      ShardeumFlags.supportInternalTxReceipt = true
      mockNodeAccount.rewardStartTime = mockTimestamp - 1000
      mockNodeAccount.rewarded = false

      /**
       * Execute reward claim application
       * This should trigger receipt creation
       */
      await claimReward.applyClaimRewardTx(
        mockShardus,
        mockClaimRewardTx,
        mockWrappedStates,
        mockTxId,
        mockTimestamp,
        mockApplyResponse
      )

      /**
       * Verify receipt creation:
       * 1. Receipt is generated with correct parameters
       * 2. All required transaction details are included
       */
      expect(mockCreateInternalTxReceipt).toHaveBeenCalledWith(
        mockShardus,
        mockApplyResponse,
        mockClaimRewardTx,
        mockClaimRewardTx.nominee,
        mockClaimRewardTx.nominator,
        mockTimestamp,
        mockTxId,
        '0x0',
        expect.any(BigInt)
      )

      // Restore original flag state
      ShardeumFlags.supportInternalTxReceipt = originalFlag
    })
  })
})

/**
 * Test Case Categories
 * -------------------
 * 1. Basic Validation:
 *    - Input format checking
 *    - Address validation
 *    - Timestamp verification
 * 
 * 2. State Validation:
 *    - Account existence
 *    - Reward eligibility
 *    - Previous claim status
 * 
 * 3. Reward Calculation:
 *    - Duration computation
 *    - Rate application
 *    - Stability scaling
 * 
 * 4. State Updates:
 *    - Account modification
 *    - History recording
 *    - Event logging
 */

/**
 * Edge Case Coverage
 * ----------------
 * Tests handle special scenarios:
 * 
 * 1. Seed Nodes:
 *    - Zero start time handling
 *    - Special reward calculations
 * 
 * 2. Time Boundaries:
 *    - Network start conditions
 *    - Deactivation timing
 * 
 * 3. Account States:
 *    - Missing accounts
 *    - Incomplete information
 *    - Invalid configurations
 */

/**
 * Feature Flag Impact
 * -----------------
 * Flag-dependent behaviors:
 * 
 * useAccountWrites:
 * - Enables detailed state change tracking
 * - Records account modifications
 * - Maintains transaction history
 * 
 * supportInternalTxReceipt:
 * - Generates detailed transaction records
 * - Tracks reward distributions
 * - Maintains audit trail
 */
