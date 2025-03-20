import { jest, describe, beforeEach, test, expect } from '@jest/globals'
import { nestedCountersInstance, ShardusTypes } from '@shardeum-foundation/core'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import {
  InitRewardTimes,
  InternalTXType,
  NetworkAccount,
  NodeAccount2,
  WrappedStates,
  NodeInitTxData,
  WrappedAccount,
  AccountType,
  NodeAccountStats,
  NetworkParameters,
} from '../../../../src/shardeum/shardeumTypes'
import * as WrappedEVMAccountFunctions from '../../../../src/shardeum/wrappedEVMAccountFunctions'
import { generateTxId, sleep, _base16BNParser } from '../../../../src/utils'
import * as initRewardTimes from '../../../../src/tx/initRewardTimes'
import { networkAccount } from '../../../../src/shardeum/shardeumConstants'

// Mock dependencies
jest.mock('@shardeum-foundation/core')
jest.mock('@shardeum-foundation/lib-crypto-utils')
jest.mock('../../../../src/setup/helpers')
jest.mock('../../../../src/utils')
jest.mock('../../../../src')
jest.mock('../../../../src/shardeum/wrappedEVMAccountFunctions')

// Mock the index module
jest.mock('../../../../src', () => ({
  shardeumGetTime: jest.fn().mockReturnValue(3000),
  createInternalTxReceipt: jest.fn(),
  logFlags: {
    dapp_verbose: false,
  },
}))

describe('initRewardTimes', () => {
  // Setup common test variables with hex strings of specific lengths for testing
  const mockPublicKey = '0x' + '1'.repeat(62) // 64-character hex string for public key
  const mockNominatorAddress = '0x' + '2'.repeat(40) // 42-character hex string for Ethereum address
  const mockNodeId = '0x' + '3'.repeat(64) // 66-character hex string for node ID
  const mockTxData: NodeInitTxData = {
    publicKey: mockPublicKey,
    nodeId: mockNodeId,
    startTime: 1000, // Initial activation time for the node
  }
  const mockSignature = 'mockSignature'
  const mockTxId = 'mockTxId'
  const mockTimestamp = 2000 // Transaction timestamp, after startTime

  // Mock objects for testing
  let mockShardus: jest.Mocked<any>
  let mockWrappedStates: WrappedStates
  let mockApplyResponse: ShardusTypes.ApplyResponse
  let mockInitRewardTimesTx: InitRewardTimes
  let mockNodeAccount: NodeAccount2
  let mockNetworkAccount: NetworkAccount

  beforeEach(() => {
    jest.clearAllMocks()

    // Initialize mock Shardus instance with required methods
    mockShardus = {
      getLocalOrRemoteAccount: jest.fn(), // For fetching account data
      signAsNode: jest.fn().mockImplementation((tx: any) => ({ ...tx, signature: mockSignature })), // Simulates node signing
      put: jest.fn(), // For submitting transactions
      serviceQueue: {
        containsTxData: jest.fn().mockReturnValue(true), // Default to valid service queue state
      },
      applyResponseSetFailed: jest.fn(), // For handling failed transactions
      applyResponseAddChangedAccount: jest.fn(), // For recording account state changes
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

    // Create a mock node account with all required fields
    mockNodeAccount = {
      type: 'node',
      id: mockNodeId,
      hash: '0x0',
      timestamp: 1000,
      rewardStartTime: 0, // Initially no rewards started
      rewardEndTime: 0, // Initially no rewards ended
      rewardRate: BigInt(0), // Initial reward rate
      nominator: mockNominatorAddress, // Address of the account that nominated this node
      rewarded: false, // Initially not rewarded
      reward: BigInt(0), // No rewards accumulated
      penalty: BigInt(0), // No penalties accumulated
      nodeAccountStats: mockNodeAccountStats,
      accountType: AccountType.NodeAccount2,
      stakeLock: BigInt(0), // No stake locked
      stakeTimestamp: 0,
      nominatorStake: BigInt(0), // No nominator stake
      nominatorStakeTimestamp: 0,
    } as NodeAccount2

    // Mock network parameters including reward amounts and intervals
    const mockNetworkParams: NetworkParameters = {
      title: 'Test Network',
      description: 'Test Network Description',
      nodeRewardInterval: 100,
      nodeRewardAmountUsd: BigInt(100), // Base reward amount for nodes
      nodePenaltyUsd: BigInt(500),
      stakeRequiredUsd: BigInt(5000),
      restakeCooldown: 100,
      maintenanceInterval: 100,
      maintenanceFee: 10,
      stabilityScaleMul: 1,
      stabilityScaleDiv: 1,
      minVersion: '1.0.0',
      activeVersion: '1.0.0',
      latestVersion: '1.0.0',
      archiver: {
        minVersion: '1.0.0',
        activeVersion: '1.0.0',
        latestVersion: '1.0.0',
      },
      txPause: false,
      certCycleDuration: 100,
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
      chainID: ShardeumFlags.ChainID,
    }

    // Create mock network account that holds global network state
    mockNetworkAccount = {
      type: 'network',
      id: networkAccount,
      hash: '0x0',
      timestamp: 1000,
      listOfChanges: [],
      next: {},
      current: mockNetworkParams, // Current network parameters
      accountType: AccountType.NetworkAccount,
      mode: ShardusTypes.ServerMode.Release,
    } as NetworkAccount

    // Wrap the node account in the expected format
    const mockWrappedNodeAccount: WrappedAccount = {
      accountId: mockPublicKey,
      stateId: '0x0',
      timestamp: 1000,
      data: mockNodeAccount,
    }

    // Wrap the network account in the expected format
    const mockWrappedNetworkAccount: WrappedAccount = {
      accountId: networkAccount,
      stateId: '0x0',
      timestamp: 1000,
      data: mockNetworkAccount,
    }

    // Create wrapped states object containing both accounts
    mockWrappedStates = {
      [mockPublicKey]: mockWrappedNodeAccount,
      [networkAccount]: mockWrappedNetworkAccount,
    } as WrappedStates

    // Initialize mock apply response for tracking transaction results
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

    // Create mock signature object for transaction signing
    const mockSign = {
      owner: mockPublicKey,
      sig: mockSignature,
    }

    // Create mock InitRewardTimes transaction with all required fields
    mockInitRewardTimesTx = {
      isInternalTx: true,
      internalTXType: InternalTXType.InitRewardTimes,
      nominee: mockPublicKey, // Node being nominated for rewards
      nodeActivatedTime: mockTxData.startTime, // When the node was activated
      timestamp: mockTimestamp, // When the transaction was created
      txData: mockTxData,
      signature: mockSignature,
      sign: mockSign,
    } as InitRewardTimes

    // Setup common mocks for all tests
    ;(crypto.verifyObj as jest.Mock).mockReturnValue(true) // Default to valid signatures
    ;(generateTxId as jest.Mock).mockReturnValue(mockTxId)
    ;(WrappedEVMAccountFunctions._shardusWrappedAccount as jest.Mock).mockImplementation((account: any) => account)
    ;(sleep as jest.Mock).mockImplementation(() => Promise.resolve())

    // Mock _base16BNParser to handle reward amount conversion
    ;(_base16BNParser as jest.Mock).mockImplementation((value: unknown) => {
      if (typeof value === 'bigint') {
        return value // Return bigint values as-is
      }
      return BigInt(0) // Default to 0 for invalid values
    })

    // Set the network reward amount for testing
    mockNetworkAccount.current.nodeRewardAmountUsd = BigInt(100) // Base reward amount in USD
  })

  /**
   * Tests for injectInitRewardTimesTx function
   * This function creates and injects a transaction to initialize reward times for a node
   */
  describe('injectInitRewardTimesTx', () => {
    // Setup specific to injectInitRewardTimesTx tests
    const mockEventData = {
      publicKey: mockPublicKey,
      additionalData: {
        txData: mockTxData,
      },
      time: 1000,
    } as unknown as ShardusTypes.ShardusEvent

    /**
     * Tests the successful case where a valid transaction is created and injected
     */
    test('should successfully inject transaction when node account exists', async () => {
      // Mock setup
      mockShardus.getLocalOrRemoteAccount.mockResolvedValue({ data: mockNodeAccount })

      // Execute function
      await initRewardTimes.injectInitRewardTimesTx(mockShardus, mockEventData)

      // Verify results
      expect(mockShardus.getLocalOrRemoteAccount).toHaveBeenCalledWith(mockPublicKey)
      expect(mockShardus.signAsNode).toHaveBeenCalled()
      expect(mockShardus.put).toHaveBeenCalled()
    })

    /**
     * Tests the case where node account cannot be found even after retry
     */
    test('should not inject transaction when node account does not exist', async () => {
      // Mock setup - node account not found
      mockShardus.getLocalOrRemoteAccount.mockResolvedValue(null)

      // Execute function
      await initRewardTimes.injectInitRewardTimesTx(mockShardus, mockEventData)

      // Verify results
      expect(mockShardus.getLocalOrRemoteAccount).toHaveBeenCalledWith(mockPublicKey)
      expect(mockShardus.getLocalOrRemoteAccount).toHaveBeenCalledTimes(2) // Should retry once
      expect(mockShardus.put).not.toHaveBeenCalled()
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'injectInitRewardTimesTx failed cant find node'
      )
    })

    /**
     * Tests the case where node account exists but doesn't have a nominator
     */
    test('should not inject transaction when node account has no nominator', async () => {
      // Mock setup - node account without nominator
      const accountWithoutNominator = { ...mockNodeAccount, nominator: null }
      mockShardus.getLocalOrRemoteAccount.mockResolvedValue({ data: accountWithoutNominator })

      // Execute function
      await initRewardTimes.injectInitRewardTimesTx(mockShardus, mockEventData)

      // Verify results
      expect(mockShardus.getLocalOrRemoteAccount).toHaveBeenCalledWith(mockPublicKey)
      expect(mockShardus.put).not.toHaveBeenCalled()
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'injectInitRewardTimesTx failed cant find nomimator'
      )
    })

    /**
     * Tests the case where node account's rewardStartTime is already set
     */
    test('should not inject transaction when rewardStartTime is already set', async () => {
      // Mock setup - rewardStartTime already set
      const accountWithRewardStartTime = { ...mockNodeAccount, rewardStartTime: 2000 }
      mockShardus.getLocalOrRemoteAccount.mockResolvedValue({ data: accountWithRewardStartTime })

      // Execute function
      await initRewardTimes.injectInitRewardTimesTx(mockShardus, mockEventData)

      // Verify results
      expect(mockShardus.getLocalOrRemoteAccount).toHaveBeenCalledWith(mockPublicKey)
      expect(mockShardus.put).not.toHaveBeenCalled()
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'injectInitRewardTimesTx failed rewardStartTime already set'
      )
    })

    /**
     * Tests behavior with ShardeumFlags.txHashingFix enabled
     * Should use deterministic timestamp and wait until future timestamp
     */
    test('should use deterministic timestamp when txHashingFix flag is enabled', async () => {
      // Save original flag state
      const originalFlag = ShardeumFlags.txHashingFix

      try {
        // Enable flag
        ShardeumFlags.txHashingFix = true
        mockShardus.getLocalOrRemoteAccount.mockResolvedValue({ data: mockNodeAccount })

        // Execute function
        await initRewardTimes.injectInitRewardTimesTx(mockShardus, mockEventData)

        // Verify results
        const txArg = mockShardus.signAsNode.mock.calls[0][0]
        expect(txArg.timestamp).toBeGreaterThanOrEqual(mockEventData.time * 1000)
        expect(sleep).toHaveBeenCalled() // Should wait until future timestamp
        expect(mockShardus.put).toHaveBeenCalled()
      } finally {
        // Restore original flag state
        ShardeumFlags.txHashingFix = originalFlag
      }
    })
  })

  /**
   * Tests for validateFields function
   * This function validates the fields of an InitRewardTimes transaction
   */
  describe('validateFields', () => {
    /**
     * Tests validation with all valid fields
     */
    test('should return success for valid fields', () => {
      // Mock setup
      mockShardus.serviceQueue.containsTxData.mockReturnValue(true)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      // Execute function
      const result = initRewardTimes.validateFields(mockInitRewardTimesTx, mockShardus)
      console.log('The reason is', result.reason)
      // Verify results
      expect(result.success).toBe(true)
      expect(result.reason).toBe('valid')
    })

    /**
     * Tests validation with invalid nominee field
     */
    test('should fail validation with invalid nominee field', () => {
      // Test cases for invalid nominee
      const testCases = [
        { nominee: '', desc: 'empty string' },
        { nominee: '123', desc: 'too short' },
        { nominee: '' as string | undefined, desc: 'undefined value' },
        { nominee: '0x' + '1'.repeat(63), desc: 'too short with 0x prefix' },
        { nominee: '0x' + '1'.repeat(65), desc: 'too long with 0x prefix' },
      ]

      testCases.forEach((testCase) => {
        // Create transaction with invalid nominee
        const txWithInvalidNominee = {
          ...mockInitRewardTimesTx,
          nominee: testCase.nominee as string, // Cast to string to satisfy type requirement
        }

        // Execute function
        const result = initRewardTimes.validateFields(txWithInvalidNominee, mockShardus)

        // Verify results
        expect(result.success).toBe(false)
        expect(result.reason).toBe('invalid nominee field in setRewardTimes Tx')
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-staking',
          'validateFields InitRewardTimes fail invalid nominee field'
        )
      })
    })

    /**
     * Tests validation with missing nodeActivatedTime
     */
    test('should fail validation with missing nodeActivatedTime', () => {
      // Create transaction without nodeActivatedTime
      const txWithoutNodeActivatedTime = {
        ...mockInitRewardTimesTx,
        nodeActivatedTime: null as unknown as number,
      } as InitRewardTimes

      // Execute function
      const result = initRewardTimes.validateFields(txWithoutNodeActivatedTime, mockShardus)

      // Verify results
      expect(result.success).toBe(false)
      expect(result.reason).toBe('nodeActivatedTime field is not found in setRewardTimes Tx')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateFields InitRewardTimes fail nodeActivatedTime missing'
      )
    })

    /**
     * Tests validation with invalid nodeActivatedTime (negative)
     */
    test('should fail validation with negative nodeActivatedTime', () => {
      // Get the mocked shardeumGetTime function

      // Test cases for invalid nodeActivatedTime
      const testCases = [{ time: -1, desc: 'negative time' }]

      testCases.forEach((testCase) => {
        // Create transaction with invalid nodeActivatedTime
        const txWithInvalidTime = {
          ...mockInitRewardTimesTx,
          nodeActivatedTime: testCase.time,
        }

        // Execute function
        const result = initRewardTimes.validateFields(txWithInvalidTime, mockShardus)

        // Verify results
        expect(result.success).toBe(false)
        expect(result.reason).toBe('nodeActivatedTime is not correct in setRewardTimes Tx')
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-staking',
          'validateFields InitRewardTimes fail nodeActivatedTime is not correct '
        )
      })
    })

    /**
     * Tests validation with invalid nodeActivatedTime (future)
     */
    test('should fail validation with future nodeActivatedTime', () => {
      // Get the mocked shardeumGetTime function
      const mockedModule = jest.requireMock('../../../../src') as { shardeumGetTime: () => number }
      const mockCurrentTime = mockedModule.shardeumGetTime()

      // Test cases for invalid nodeActivatedTime
      const testCases = [{ time: mockCurrentTime + 1000, desc: 'future time' }]

      testCases.forEach((testCase) => {
        // Create transaction with invalid nodeActivatedTime
        const txWithInvalidTime = {
          ...mockInitRewardTimesTx,
          nodeActivatedTime: testCase.time,
        }

        // Execute function
        const result = initRewardTimes.validateFields(txWithInvalidTime, mockShardus)

        // Verify results
        expect(result.success).toBe(false)
        expect(result.reason).toBe('nodeActivatedTime field is not found in setRewardTimes Tx')
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-staking',
          'validateFields InitRewardTimes fail nodeActivatedTime missing'
        )
      })
    })

    /**
     * Tests validation with invalid signature
     */
    test('should fail validation with invalid signature', () => {
      // Mock signature verification to fail
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(false)

      // Execute function
      const result = initRewardTimes.validateFields(mockInitRewardTimesTx, mockShardus)

      // Verify results
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid signature')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateFields InitRewardTimes fail Invalid signature'
      )
    })

    /**
     * Tests validation when node is not in serviceQueue
     */
    test('should fail validation when node is not in serviceQueue', () => {
      // Mock serviceQueue check to fail
      mockShardus.serviceQueue.containsTxData.mockReturnValue(false)

      // Execute function
      const result = initRewardTimes.validateFields(mockInitRewardTimesTx, mockShardus)

      // Verify results
      expect(result.success).toBe(false)
      expect(result.reason).toBe('node not in serviceQueue')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateFields InitRewardTimes fail node not in serviceQueue'
      )
    })

    /**
     * Tests validation when txData.startTime doesn't match nodeActivatedTime
     */
    test('should fail validation when txData.startTime does not match nodeActivatedTime', () => {
      // Create transaction with mismatched times
      const txWithMismatchedTimes = {
        ...mockInitRewardTimesTx,
        txData: { ...mockTxData, startTime: 1500 }, // Different from nodeActivatedTime (1000)
      }

      // Execute function
      const result = initRewardTimes.validateFields(txWithMismatchedTimes, mockShardus)

      // Verify results
      expect(result.success).toBe(false)
      expect(result.reason).toBe('txData.startTime does not match nodeActivatedTime')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateFields InitRewardTimes fail txData.startTime does not match nodeActivatedTime'
      )
    })

    /**
     * Tests validation when txData.publicKey doesn't match nominee
     */
    test('should fail validation when txData.publicKey does not match nominee', () => {
      // Create transaction with mismatched publicKey
      const differentPublicKey = '0x' + '3'.repeat(64)
      const txWithMismatchedPublicKey = {
        ...mockInitRewardTimesTx,
        txData: { ...mockTxData, publicKey: differentPublicKey },
      }

      // Execute function
      const result = initRewardTimes.validateFields(txWithMismatchedPublicKey, mockShardus)

      // Verify results
      expect(result.success).toBe(false)
      expect(result.reason).toBe('txData.publicKey does not match tx.nominee')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateFields InitRewardTimes fail txData.publicKey does not match tx.nominee'
      )
    })
  })

  /**
   * Tests for validate function
   * This function validates the signature of an InitRewardTimes transaction
   */
  describe('validate', () => {
    /**
     * Tests validation with valid signature
     */
    test('should return pass for valid signature', () => {
      // Execute function
      const result = initRewardTimes.validate(mockInitRewardTimesTx, mockShardus)

      // Verify results
      expect(result.result).toBe('pass')
      expect(result.reason).toBe('valid')
    })

    /**
     * Tests validation with invalid signature
     */
    test('should return fail for invalid signature', () => {
      // Mock signature verification to fail
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(false)

      // Execute function
      const result = initRewardTimes.validate(mockInitRewardTimesTx, mockShardus)

      // Verify results
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('Invalid signature')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validate InitRewardTimes fail Invalid signature'
      )
    })
  })

  /**
   * Tests for validateInitRewardState function
   * This function validates the state of an InitRewardTimes transaction
   */
  describe('validateInitRewardState', () => {
    /**
     * Tests validation with valid state
     */
    test('should return pass for valid state', () => {
      // Execute function
      const result = initRewardTimes.validateInitRewardState(mockInitRewardTimesTx, mockWrappedStates)

      // Verify results
      expect(result.result).toBe('pass')
      expect(result.reason).toBe('valid')
    })

    /**
     * Tests validation with invalid signature
     */
    test('should return fail for invalid signature', () => {
      // Mock signature verification to fail
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(false)

      // Execute function
      const result = initRewardTimes.validateInitRewardState(mockInitRewardTimesTx, mockWrappedStates)

      // Verify results
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('Invalid signature')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateInitRewardState fail Invalid signature'
      )
    })

    /**
     * Tests validation when rewardStartTime is already set
     */
    test('should return fail when rewardStartTime is already set', () => {
      // Set rewardStartTime higher than nodeActivatedTime
      mockNodeAccount.rewardStartTime = mockInitRewardTimesTx.nodeActivatedTime + 100

      // Execute function
      const result = initRewardTimes.validateInitRewardState(mockInitRewardTimesTx, mockWrappedStates)

      // Verify results
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('rewardStartTime is already set')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateInitRewardState fail rewardStartTime already set'
      )
    })

    /**
     * Tests validation when account timestamp is newer than tx timestamp
     */
    test('should return fail when account timestamp is newer than tx timestamp', () => {
      // Set account timestamp higher than tx timestamp
      mockNodeAccount.timestamp = mockInitRewardTimesTx.timestamp + 100

      // Execute function
      const result = initRewardTimes.validateInitRewardState(mockInitRewardTimesTx, mockWrappedStates)

      // Verify results
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('timestamp is already set')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-staking',
        'validateInitRewardState fail timestamp already set'
      )
    })
  })

  /**
   * Tests for apply function
   * This function applies an InitRewardTimes transaction to update node account state
   */
  describe('apply', () => {
    /**
     * Tests successful application of transaction
     */
    test('should apply transaction successfully', () => {
      // Execute function
      initRewardTimes.apply(
        mockShardus,
        mockInitRewardTimesTx,
        mockTxId,
        mockTimestamp,
        mockWrappedStates,
        mockApplyResponse
      )

      // Verify node account was updated correctly
      expect(mockNodeAccount.rewardStartTime).toBe(mockInitRewardTimesTx.nodeActivatedTime)
      expect(mockNodeAccount.rewardEndTime).toBe(0)
      expect(mockNodeAccount.timestamp).toBe(mockTimestamp)
      expect(mockNodeAccount.rewardRate).toBe(BigInt(100)) // From hex value 0x64

      // Verify account changes were registered
      expect(mockShardus.applyResponseAddChangedAccount).toHaveBeenCalledWith(
        mockApplyResponse,
        mockInitRewardTimesTx.nominee,
        mockNodeAccount,
        mockTxId,
        mockTimestamp
      )

      // Verify events were tracked
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith('shardeum-staking', 'Applied InitRewardTimesTX')
    })

    /**
     * Tests setting rewarded flag when ShardeumFlags.rewardedFalseInInitRewardTx is enabled
     */
    test('should set rewarded flag when rewardedFalseInInitRewardTx flag is enabled', () => {
      // Save original flag state
      const originalFlag = ShardeumFlags.rewardedFalseInInitRewardTx

      try {
        // Enable flag
        ShardeumFlags.rewardedFalseInInitRewardTx = true

        // Set initial rewarded state to true to verify it changes
        mockNodeAccount.rewarded = true

        // Execute function
        initRewardTimes.apply(
          mockShardus,
          mockInitRewardTimesTx,
          mockTxId,
          mockTimestamp,
          mockWrappedStates,
          mockApplyResponse
        )

        // Verify rewarded flag was set to false
        expect(mockNodeAccount.rewarded).toBe(false)
      } finally {
        // Restore original flag state
        ShardeumFlags.rewardedFalseInInitRewardTx = originalFlag
      }
    })

    /**
     * Tests failing application when validateInitRewardState fails
     */
    test('should fail when validateInitRewardState fails', () => {
      // Mock signature verification to fail
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(false)

      // Save original values to verify they aren't changed
      const originalRewardStartTime = mockNodeAccount.rewardStartTime
      const originalRewardEndTime = mockNodeAccount.rewardEndTime
      const originalTimestamp = mockNodeAccount.timestamp

      // Execute function
      initRewardTimes.apply(
        mockShardus,
        mockInitRewardTimesTx,
        mockTxId,
        mockTimestamp,
        mockWrappedStates,
        mockApplyResponse
      )

      // Verify failure was registered
      expect(mockShardus.applyResponseSetFailed).toHaveBeenCalled()
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith('shardeum-staking', 'applyInitRewardTimes fail ')

      // Verify node account was not updated
      expect(mockNodeAccount.rewardStartTime).toBe(originalRewardStartTime)
      expect(mockNodeAccount.rewardEndTime).toBe(originalRewardEndTime)
      expect(mockNodeAccount.timestamp).toBe(originalTimestamp)
    })

    /**
     * Tests behavior when tx.nominee is not a NodeAccount2
     */
    test('should throw error when tx.nominee is not a NodeAccount2', () => {
      // Create wrapped states with non-NodeAccount2 data
      const invalidWrappedAccount: WrappedAccount = {
        accountId: mockPublicKey,
        stateId: '0x0',
        timestamp: 1000,
        data: { type: 'not-a-node-account', accountType: AccountType.Account } as unknown as NodeAccount2,
      }

      const mockModifiedWrappedStates = {
        ...mockWrappedStates,
        [mockPublicKey]: invalidWrappedAccount,
      } as WrappedStates

      // Execute function and expect error
      expect(() => {
        initRewardTimes.apply(
          mockShardus,
          mockInitRewardTimesTx,
          mockTxId,
          mockTimestamp,
          mockModifiedWrappedStates,
          mockApplyResponse
        )
      }).toThrow('tx.nominee is not a NodeAccount2')
    })
  })
})
