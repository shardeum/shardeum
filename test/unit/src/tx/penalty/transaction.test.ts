import { nestedCountersInstance, Shardus, ShardusTypes } from '@shardeum-foundation/core'
import { shardeumGetTime } from '../../../../../src'
import {
  AccountType,
  isNodeAccount2,
  LeftNetworkEarlyViolationData,
  NetworkAccount,
  NodeAccount2,
  NodeRefutedViolationData,
  PenaltyTX,
  SyncingTimeoutViolationData,
  ViolationType,
  WrappedEVMAccount,
  WrappedStates,
} from '../../../../../src/shardeum/shardeumTypes'
import {
  applyPenaltyTX,
  clearOldPenaltyTxs,
  injectPenaltyTX,
  validatePenaltyTX,
} from '../../../../../src/tx/penalty/transaction'
import * as utils from '../../../../../src/utils'
import { transactionUtils } from '../../../../../src/tx/penalty/transaction'
import config from '../../../../../src/config'
import { verifyPayload } from '../../../../../src/types/ajv/Helpers'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'
import * as AccountsStorage from '../../../../../src/storage/accountStorage'
import { Address } from '@ethereumjs/util'
import { ShardeumFlags } from '../../../../../src/shardeum/shardeumFlags'
import { networkAccount } from '../../../../../src/shardeum/shardeumConstants'
import { ShardeumState } from '../../../../../src/state'
import {
  createMockPenaltyTX,
  createMockNodeAccount,
  createMockWrappedStates,
  createMockNetworkAccount,
  createMockOperatorAccount,
  createMockEventData,
  createMockViolationData,
} from './mocks/mockFactory'

/**
 * Mocking dependencies to isolate the logic of the functions being tested.
 * These mocks are shared across multiple test cases and can be overridden in specific tests.
 */

jest.mock('@src/index.ts', () => ({
  shardeumGetTime: jest.fn().mockReturnValue(1234567890),
  logFlags: {
    dapp_verbose: false,
  },
  getApplyTXState: jest.fn().mockReturnValue({
    _transactionState: { appData: {} },
    checkpoint: jest.fn().mockResolvedValue(undefined),
    putAccount: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
  }),
  createInternalTxReceipt: jest.fn(),
}))

jest.mock('@src/shardeum/shardeumTypes', () => ({
  ...jest.requireActual('../../../../../src/shardeum/shardeumTypes'),
  isNodeAccount2: jest.fn(),
  AccountType: {
    ContractCode: '2',
  },
}))

jest.mock('@src/utils', () => ({
  generateTxId: jest.fn(),
  sleep: jest.fn(),
}))

jest.mock('@src/shardeum/shardeumFlags', () => ({
  ShardeumFlags: {
    numberOfNodesToInjectPenaltyTx: 5,
    VerboseLogs: false,
  },
}))

/**
 * Top-level describe block for all penalty transaction tests.
 * This block contains nested describe blocks for each function being tested.
 */

describe('Penalty Transaction Tests', () => {
  // Global variable used across multiple test cases in this suite.
  let shardusMock: jest.Mocked<Shardus>
  beforeEach(() => {
    shardusMock = {
      getLocalOrRemoteAccount: jest.fn(),
      signAsNode: jest.fn(),
      getClosestNodes: jest.fn(),
      getNodeId: jest.fn(),
      put: jest.fn(),
      applyResponseSetFailed: jest.fn(),
      applyResponseAddChangedAccount: jest.fn(),
      shardusGetTime: jest.fn(),
    } as unknown as jest.Mocked<Shardus>
  })

  /**
   * Tests for the `injectPenaltyTX` function.
   * This function is responsible for injecting penalty transactions onto the blockchain.
   */
  describe('injectPenaltyTX', () => {
    let mockEventData: ShardusTypes.ShardusEvent
    let mockViolationData: LeftNetworkEarlyViolationData | NodeRefutedViolationData | SyncingTimeoutViolationData

    /**
     * Helper function to set up common mocks for `injectPenaltyTX` tests.
     * This ensures consistent mock data and behavior across multiple test cases.
     */
    function injectPenaltyTXMockSetup(): void {
      // Mocking dependencies within injectPenaltyTX to isolate and test the injectPenaltyTX logic exclusively
      shardusMock.getLocalOrRemoteAccount.mockResolvedValue({
        seenInQueue: false, // Indicates the account has not been seen in the queue.
        accountId: 'mockAccountId', // Mock account ID.
        stateId: 'mockStateId', // Mock state ID.
        timestamp: 1234567890, // Mock timestamp for the account.
        data: { nominator: 'mockOperatorAddress' }, // Mock data containing the nominator's address.
      })
      // This simulates that the account being checked is a valid NodeAccount2.
      ;(isNodeAccount2 as unknown as jest.Mock).mockReturnValue(true)
      // This simulates fetching the closest nodes, with the current node being included in the list.
      shardusMock.getClosestNodes.mockReturnValue(['currentNodeId'])
      // This simulates fetching the ID of the node executing the test.
      shardusMock.getNodeId.mockReturnValue('currentNodeId')
      // This ensures that the transaction ID is consistent across tests.
      ;(utils.generateTxId as jest.Mock).mockReturnValue('mockTxId')
      // This prevents delays in tests that rely on `sleep` and ensures faster execution.
      ;(utils.sleep as jest.Mock).mockResolvedValue(undefined)
    }

    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetAllMocks()
    })

    describe('Violation Type Tests', () => {
      it('injectPenaltyTX should set correct violation type for node-left-early', async () => {
        // Arrange
        injectPenaltyTXMockSetup()
        mockEventData = createMockEventData({ type: 'node-left-early' })
        mockViolationData = createMockViolationData(ViolationType.LeftNetworkEarly)
        // Act
        await injectPenaltyTX(shardusMock, mockEventData, mockViolationData)

        // Assert
        expect(shardusMock.signAsNode).toHaveBeenCalledWith(
          expect.objectContaining({
            violationType: ViolationType.LeftNetworkEarly,
          })
        )
      })

      it('injectPenaltyTX should set correct violation type for node-refuted', async () => {
        // Arrange
        injectPenaltyTXMockSetup()
        mockEventData = createMockEventData({ type: 'node-refuted' })
        mockViolationData = createMockViolationData(ViolationType.NodeRefuted)
        // Act
        await injectPenaltyTX(shardusMock, mockEventData, mockViolationData)

        // Assert
        expect(shardusMock.signAsNode).toHaveBeenCalledWith(
          expect.objectContaining({
            violationType: ViolationType.NodeRefuted,
          })
        )
      })

      it('injectPenaltyTX should set correct violation type for node-sync-timeout', async () => {
        // Arrange
        injectPenaltyTXMockSetup()

        mockEventData = createMockEventData({ type: 'node-sync-timeout' })
        mockViolationData = createMockViolationData(ViolationType.SyncingTooLong)

        // Act
        await injectPenaltyTX(shardusMock, mockEventData, mockViolationData)

        // Assert
        expect(shardusMock.signAsNode).toHaveBeenCalledWith(
          expect.objectContaining({
            violationType: ViolationType.SyncingTooLong,
          })
        )
      })
    })

    describe('Node Account Tests', () => {
      it('injectPenaltyTX should return error when node account is not found', async () => {
        // Arrange
        shardusMock.getLocalOrRemoteAccount.mockResolvedValue(null)
        mockEventData = createMockEventData({
          type: 'node-left-early',
        })
        mockViolationData = createMockViolationData(ViolationType.LeftNetworkEarly)
        // Act
        const result = await injectPenaltyTX(shardusMock, mockEventData, mockViolationData)

        // Assert
        expect(result).toEqual({
          success: false,
          reason: 'Penalty Node Account not found',
          status: 404,
        })
        expect(shardusMock.put).not.toHaveBeenCalled()
      })

      it('injectPenaltyTX should return error when operator address is not found', async () => {
        // Arrange
        shardusMock.getLocalOrRemoteAccount.mockResolvedValue({
          seenInQueue: false,
          accountId: 'mockAccountId',
          stateId: 'mockStateId',
          timestamp: 1234567890,
          data: { someOtherData: 'value' },
        })
        ;(isNodeAccount2 as unknown as jest.Mock).mockReturnValue(false)
        mockEventData = createMockEventData({
          type: 'node-left-early',
        })
        mockViolationData = createMockViolationData(ViolationType.LeftNetworkEarly)
        // Act
        const result = await injectPenaltyTX(shardusMock, mockEventData, mockViolationData)

        // Assert
        expect(result).toEqual({
          success: false,
          reason: 'Operator address could not be found for penalty node',
          status: 404,
        })
      })
    })

    describe('Lucky Node Tests', () => {
      it('injectPenaltyTX should skip injection when not a lucky node', async () => {
        // Arrange
        injectPenaltyTXMockSetup()
        shardusMock.getClosestNodes.mockReturnValue(['otherNodeId'])
        shardusMock.getNodeId.mockReturnValue('currentNodeId')
        mockEventData = createMockEventData({
          type: 'node-left-early',
        })
        mockViolationData = createMockViolationData(ViolationType.LeftNetworkEarly)
        // Act
        const result = await injectPenaltyTX(shardusMock, mockEventData, mockViolationData)

        // Assert
        expect(result).toBeUndefined()
        expect(shardusMock.put).not.toHaveBeenCalled()
      })
    })

    describe('Timestamp and Transaction Tests', () => {
      it('injectPenaltyTX should calculate correct future timestamp and wait time', async () => {
        // Arrange
        injectPenaltyTXMockSetup()
        const eventTime = 1234567890
        const currentTime = eventTime * 1000 - 5000 // Current time before event time
        mockEventData = createMockEventData({
          type: 'node-left-early',
        })
        mockEventData.time = eventTime
        mockViolationData = createMockViolationData(ViolationType.LeftNetworkEarly)
        ;(shardeumGetTime as jest.Mock)
          .mockReturnValueOnce(currentTime) // First call for timestamp
          .mockReturnValueOnce(currentTime) // Second call for while loop
          .mockReturnValueOnce(currentTime) // Third call for wait time calculation

        // Act
        await injectPenaltyTX(shardusMock, mockEventData, mockViolationData)

        // Assert
        // Verify the transaction was signed with the correct timestamp
        expect(shardusMock.signAsNode).toHaveBeenCalledWith(
          expect.objectContaining({
            timestamp: eventTime * 1000, // Should be event time in milliseconds
          })
        )

        // Verify sleep was called with correct wait time
        const expectedWaitTime = eventTime * 1000 - currentTime
        expect(utils.sleep).toHaveBeenCalledWith(expectedWaitTime)
      })

      it('injectPenaltyTX should adjust future timestamp when current time is ahead', async () => {
        // Arrange
        injectPenaltyTXMockSetup()
        const eventTime = 1234567890
        const currentTime = eventTime * 1000 + 5000 // Current time after event time
        mockEventData = createMockEventData({
          type: 'node-left-early',
        })
        mockEventData.time = eventTime
        mockViolationData = createMockViolationData(ViolationType.LeftNetworkEarly)
        ;(shardeumGetTime as jest.Mock)
          .mockReturnValueOnce(currentTime)
          .mockReturnValueOnce(currentTime)
          .mockReturnValue(currentTime)

        // Act
        await injectPenaltyTX(shardusMock, mockEventData, mockViolationData)

        // Assert

        // Verify the transaction was signed with adjusted timestamp
        expect(shardusMock.signAsNode).toHaveBeenCalledWith(
          expect.objectContaining({
            timestamp: eventTime * 1000 + 30000, // Should be event time + 30 seconds
          })
        )
        // Verify sleep was called with correct wait time
        const expectedWaitTime = eventTime * 1000 + 30000 - currentTime
        expect(utils.sleep).toHaveBeenCalledWith(expectedWaitTime)
      })
      it('injectPenaltyTX should successfully inject penalty transaction', async () => {
        // Arrange
        injectPenaltyTXMockSetup()
        shardusMock.put.mockResolvedValue({ success: true, reason: '', status: 200 })
        mockEventData = createMockEventData({
          type: 'node-left-early',
        })
        mockViolationData = createMockViolationData(ViolationType.LeftNetworkEarly)
        // Act
        const result = await injectPenaltyTX(shardusMock, mockEventData, mockViolationData)

        // Assert
        expect(result).toEqual({
          success: true,
          reason: '',
          status: 200,
        })
      })
    })
  })
  /**
   * Tests for the `isProcessedPenaltyTx` function.
   * This function checks whether a penalty transaction has already been processed for a given node account.
   * It validates the transaction against the node's last penalty time and violation-specific data.
   * These tests cover various violation types, edge cases, and error handling scenarios.
   */
  describe('isProcessedPenaltyTx', () => {
    let mockPenaltyTX: PenaltyTX
    let mockNodeAccount: NodeAccount2

    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetAllMocks()

      // Setup base mock NodeAccount
      mockNodeAccount = createMockNodeAccount()

      mockPenaltyTX = createMockPenaltyTX()
    })

    describe('LeftNetworkEarly Violation', () => {
      beforeEach(() => {
        mockPenaltyTX.violationType = ViolationType.LeftNetworkEarly
        mockPenaltyTX.violationData = {
          nodeDroppedTime: 900,
          nodeLostCycle: 1,
        } as LeftNetworkEarlyViolationData
      })

      it('isProcessedPenaltyTx should return isProcessed true when lastPenaltyTime is greater than nodeDroppedTime', () => {
        // Arrange
        mockNodeAccount.nodeAccountStats.lastPenaltyTime = 1000
        ;(mockPenaltyTX.violationData as LeftNetworkEarlyViolationData).nodeDroppedTime = 900

        // Act
        const result = transactionUtils.isProcessedPenaltyTx(mockPenaltyTX, mockNodeAccount)

        // Assert
        expect(result).toEqual({
          isProcessed: true,
          eventTime: 900,
        })
      })

      it('isProcessedPenaltyTx should return isProcessed false when lastPenaltyTime is less than nodeDroppedTime', () => {
        // Arrange
        mockNodeAccount.nodeAccountStats.lastPenaltyTime = 800
        ;(mockPenaltyTX.violationData as LeftNetworkEarlyViolationData).nodeDroppedTime = 900

        // Act
        const result = transactionUtils.isProcessedPenaltyTx(mockPenaltyTX, mockNodeAccount)

        // Assert
        expect(result).toEqual({
          isProcessed: false,
          eventTime: 900,
        })
      })
    })

    describe('NodeRefuted Violation', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
        mockPenaltyTX.violationType = ViolationType.NodeRefuted
        mockPenaltyTX.violationData = {
          nodeRefutedTime: 900,
        } as NodeRefutedViolationData
      })

      it('isProcessedPenaltyTx should return isProcessed true when lastPenaltyTime is greater than nodeRefutedTime', () => {
        // Arrange
        mockNodeAccount.nodeAccountStats.lastPenaltyTime = 1000
        ;(mockPenaltyTX.violationData as NodeRefutedViolationData).nodeRefutedTime = 900

        // Act
        const result = transactionUtils.isProcessedPenaltyTx(mockPenaltyTX, mockNodeAccount)

        // Assert
        expect(result).toEqual({
          isProcessed: true,
          eventTime: 900,
        })
      })

      it('isProcessedPenaltyTx should return isProcessed false when lastPenaltyTime is less than nodeRefutedTime', () => {
        // Arrange
        mockNodeAccount.nodeAccountStats.lastPenaltyTime = 800
        ;(mockPenaltyTX.violationData as NodeRefutedViolationData).nodeRefutedTime = 900

        // Act
        const result = transactionUtils.isProcessedPenaltyTx(mockPenaltyTX, mockNodeAccount)

        // Assert
        expect(result).toEqual({
          isProcessed: false,
          eventTime: 900,
        })
      })
    })

    describe('SyncingTooLong Violation', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
        mockPenaltyTX.violationType = ViolationType.SyncingTooLong
        mockPenaltyTX.violationData = {
          nodeDroppedTime: 900,
        } as SyncingTimeoutViolationData
      })

      it('isProcessedPenaltyTx should return isProcessed true when lastPenaltyTime is greater than nodeDroppedTime', () => {
        // Arrange
        mockNodeAccount.nodeAccountStats.lastPenaltyTime = 1000
        ;(mockPenaltyTX.violationData as SyncingTimeoutViolationData).nodeDroppedTime = 900

        // Act
        const result = transactionUtils.isProcessedPenaltyTx(mockPenaltyTX, mockNodeAccount)

        // Assert
        expect(result).toEqual({
          isProcessed: true,
          eventTime: 900,
        })
      })

      it('isProcessedPenaltyTx should return isProcessed false when lastPenaltyTime is less than nodeDroppedTime', () => {
        // Arrange
        mockNodeAccount.nodeAccountStats.lastPenaltyTime = 800
        ;(mockPenaltyTX.violationData as SyncingTimeoutViolationData).nodeDroppedTime = 900

        // Act
        const result = transactionUtils.isProcessedPenaltyTx(mockPenaltyTX, mockNodeAccount)

        // Assert
        expect(result).toEqual({
          isProcessed: false,
          eventTime: 900,
        })
      })
    })

    describe('Error Handling', () => {
      it('isProcessedPenaltyTx should throw error for unknown violation type', () => {
        // Arrange
        mockPenaltyTX.violationType = 999 as ViolationType

        // Act & Assert
        expect(() => transactionUtils.isProcessedPenaltyTx(mockPenaltyTX, mockNodeAccount)).toThrow(
          'Unknown Violation type: , 999'
        )
      })

      it('isProcessedPenaltyTx should handle edge case when lastPenaltyTime equals event time', () => {
        // Arrange
        mockPenaltyTX.violationType = ViolationType.LeftNetworkEarly
        mockPenaltyTX.violationData = {
          nodeDroppedTime: 900,
          nodeLostCycle: 1,
        } as LeftNetworkEarlyViolationData
        mockNodeAccount.nodeAccountStats.lastPenaltyTime = 900

        // Act
        const result = transactionUtils.isProcessedPenaltyTx(mockPenaltyTX, mockNodeAccount)

        // Assert
        expect(result).toEqual({
          isProcessed: true,
          eventTime: 900,
        })
      })
    })
  })

  /**
   * Tests for the `clearOldPenaltyTxs` function.
   * This function removes penalty transactions that are older than a specified threshold (5 cycle durations).
   * It ensures that the penalty transaction map is kept clean and does not retain outdated transactions.
   * These tests cover scenarios such as:
   * - Removing old transactions
   * - Retaining recent transactions
   * - Handling edge cases like empty maps or transactions at the threshold
   * - Counting events for monitoring purposes
   */
  describe('clearOldPenaltyTxs', () => {
    let mockPenaltyTX: PenaltyTX
    const CURRENT_TIME = 1000000
    const CYCLE_DURATION = config.server.p2p.cycleDuration // 1 second in milliseconds

    beforeEach(() => {
      // Reset all mocks and state
      jest.clearAllMocks()
      transactionUtils.getPenaltyTxsMap().clear()

      // Setup Shardus mock
      shardusMock = {
        shardusGetTime: jest.fn().mockReturnValue(CURRENT_TIME),
      } as unknown as jest.Mocked<Shardus>

      // Mock nestedCountersInstance
      ;(nestedCountersInstance.countEvent as jest.Mock) = jest.fn()
    })

    afterEach(() => {
      // Clean up after each test
      transactionUtils.getPenaltyTxsMap().clear()
    })

    describe('Transaction Removal Tests', () => {
      it('clearOldPenaltyTxs should remove transactions older than 5 cycle durations', () => {
        // Arrange
        const oldTxId = 'old-tx'
        const newTxId = 'new-tx'

        transactionUtils.recordPenaltyTX(oldTxId, {
          ...mockPenaltyTX,
          timestamp: CURRENT_TIME - 6 * CYCLE_DURATION * 1000,
        })
        transactionUtils.recordPenaltyTX(newTxId, {
          ...mockPenaltyTX,
          timestamp: CURRENT_TIME - 4 * CYCLE_DURATION * 1000,
        })

        // Act
        clearOldPenaltyTxs(shardusMock)

        // Assert
        const map = transactionUtils.getPenaltyTxsMap()
        expect(map.has(oldTxId)).toBeFalsy()
        expect(map.has(newTxId)).toBeTruthy()
        expect(map.size).toBe(1)
      })

      it('clearOldPenaltyTxs should keep all transactions when none are old enough', () => {
        // Arrange
        const recentTxs = [
          { id: 'tx-1', age: 2 },
          { id: 'tx-2', age: 3 },
          { id: 'tx-3', age: 4 },
        ]

        recentTxs.forEach(({ id, age }) => {
          transactionUtils.recordPenaltyTX(id, {
            ...mockPenaltyTX,
            timestamp: CURRENT_TIME - age * CYCLE_DURATION * 1000,
          })
        })

        // Act
        clearOldPenaltyTxs(shardusMock)

        // Assert
        const map = transactionUtils.getPenaltyTxsMap()
        expect(map.size).toBe(recentTxs.length)
        recentTxs.forEach(({ id }) => {
          expect(map.has(id)).toBeTruthy()
        })
      })
    })

    describe('Edge Case Tests', () => {
      it('clearOldPenaltyTxs should handle empty penalty map', () => {
        // Act
        clearOldPenaltyTxs(shardusMock)

        // Assert
        const map = transactionUtils.getPenaltyTxsMap()
        expect(map.size).toBe(0)
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-penalty',
          'clearOldPenaltyTxs mapSize:0'
        )
      })

      it('clearOldPenaltyTxs should handle transactions at exactly 5 cycle durations', () => {
        // Arrange
        const txId = 'edge-case-tx'
        transactionUtils.recordPenaltyTX(txId, {
          ...mockPenaltyTX,
          timestamp: CURRENT_TIME - 5 * CYCLE_DURATION * 1000,
        })

        // Act
        clearOldPenaltyTxs(shardusMock)

        // Assert
        const map = transactionUtils.getPenaltyTxsMap()
        expect(map.has(txId)).toBeTruthy()
        expect(map.size).toBe(1)
      })

      it('clearOldPenaltyTxs should handle mixed old and new transactions', () => {
        // Arrange
        const transactions = [
          { id: 'very-old', age: 10 },
          { id: 'just-old', age: 6 },
          { id: 'edge-case', age: 5 },
          { id: 'recent', age: 3 },
          { id: 'very-recent', age: 1 },
        ]

        transactions.forEach(({ id, age }) => {
          transactionUtils.recordPenaltyTX(id, {
            ...mockPenaltyTX,
            timestamp: CURRENT_TIME - age * CYCLE_DURATION * 1000,
          })
        })

        // Act
        clearOldPenaltyTxs(shardusMock)

        // Assert
        const map = transactionUtils.getPenaltyTxsMap()
        expect(map.size).toBe(3) // Should keep edge-case and newer
        expect(map.has('very-old')).toBeFalsy()
        expect(map.has('just-old')).toBeFalsy()
        expect(map.has('edge-case')).toBeTruthy()
        expect(map.has('recent')).toBeTruthy()
        expect(map.has('very-recent')).toBeTruthy()
      })
    })

    describe('Event Counting Tests', () => {
      it('clearOldPenaltyTxs should count events correctly', () => {
        // Arrange
        const oldTxs = [
          { id: 'old-tx-1', age: 6 },
          { id: 'old-tx-2', age: 7 },
        ]

        oldTxs.forEach(({ id, age }) => {
          transactionUtils.recordPenaltyTX(id, {
            ...mockPenaltyTX,
            timestamp: CURRENT_TIME - age * CYCLE_DURATION * 1000,
          })
        })

        // Act
        clearOldPenaltyTxs(shardusMock)

        // Assert
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-penalty',
          'clearOldPenaltyTxs mapSize:2'
        )
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-penalty',
          'clearOldPenaltyTxs deleteCount: 2'
        )
      })
    })
  })

  /**
   * Tests for the `validatePenaltyTX` function.
   * This function validates a penalty transaction to ensure it meets all required conditions.
   * It checks the transaction's schema, signature, slashing rules, and whether it exists in the penalty transaction map.
   * These tests cover scenarios such as:
   * - Schema validation using AJV
   * - Signature verification
   * - Slashing rule enforcement
   * - Handling missing or invalid penalty transactions
   * - Successful validation of properly formed penalty transactions
   */
  describe('validatePenaltyTX', () => {
    let mockPenaltyTX: PenaltyTX
    const TEST_TX_ID = 'test-tx-id'

    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks()
      transactionUtils.getPenaltyTxsMap().clear()

      // Use the mock factory to create the PenaltyTX object
      mockPenaltyTX = createMockPenaltyTX()
      // Setup mocks
      ;(verifyPayload as jest.Mock) = jest.fn().mockReturnValue(null)
      ;(crypto.verifyObj as jest.Mock) = jest.fn().mockReturnValue(true)
      ;(nestedCountersInstance.countEvent as jest.Mock) = jest.fn()

      // Mock AccountsStorage
      ;(AccountsStorage as any).cachedNetworkAccount = {
        current: {
          slashing: {
            enableLeftNetworkEarlySlashing: true,
            enableSyncTimeoutSlashing: true,
            enableNodeRefutedSlashing: true,
          },
        },
      }
    })

    describe('AJV Schema Validation', () => {
      it('validatePenaltyTX should return invalid when AJV validation fails', () => {
        // Arrange
        ;(verifyPayload as jest.Mock).mockReturnValue(['error'])

        // Act
        const result = validatePenaltyTX(TEST_TX_ID, mockPenaltyTX)

        // Assert
        expect(result).toEqual({
          isValid: false,
          reason: 'Invalid penalty tx',
        })
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith('external', 'ajv-failed-penalty-tx')
      })
    })

    describe('Penalty TX Map Validation', () => {
      it('validatePenaltyTX should validate stored penalty TX when isApply is true', () => {
        // Arrange
        transactionUtils.recordPenaltyTX(TEST_TX_ID, mockPenaltyTX)

        // Act
        const result = validatePenaltyTX(TEST_TX_ID, mockPenaltyTX, true)

        // Assert
        expect(result.isValid).toBeTruthy()
      })

      it('validatePenaltyTX should return invalid when penalty TX not found in map with isApply true', () => {
        // Act
        const result = validatePenaltyTX(TEST_TX_ID, mockPenaltyTX, true)

        // Assert
        expect(result).toEqual({
          isValid: false,
          reason: 'Penalty TX not found in penaltyTxsMap of exe node',
        })
      })
    })

    describe('Slashing Validation', () => {
      const slashingTests = [
        {
          type: ViolationType.LeftNetworkEarly,
          flag: 'enableLeftNetworkEarlySlashing',
          reason: 'LeftNetworkEarly slashing is disabled',
        },
        {
          type: ViolationType.SyncingTooLong,
          flag: 'enableSyncTimeoutSlashing',
          reason: 'Sync timeout slashing is disabled',
        },
        {
          type: ViolationType.NodeRefuted,
          flag: 'enableNodeRefutedSlashing',
          reason: 'Refuted node slashing is disabled',
        },
      ]

      slashingTests.forEach(({ type, flag, reason }) => {
        it(`validatePenaltyTX should return invalid when ${type} slashing is disabled`, () => {
          // Arrange
          mockPenaltyTX.violationType = type

          // Update mock values
          ;(AccountsStorage as any).cachedNetworkAccount = {
            current: {
              slashing: {
                enableLeftNetworkEarlySlashing: flag === 'enableLeftNetworkEarlySlashing' ? false : true,
                enableSyncTimeoutSlashing: flag === 'enableSyncTimeoutSlashing' ? false : true,
                enableNodeRefutedSlashing: flag === 'enableNodeRefutedSlashing' ? false : true,
              },
            },
          }

          // Act
          const result = validatePenaltyTX(TEST_TX_ID, mockPenaltyTX)

          // Assert
          expect(result).toEqual({
            isValid: false,
            reason,
          })
        })
      })
    })

    describe('Signature Validation', () => {
      it('validatePenaltyTX should return invalid when signature verification fails', () => {
        // Arrange
        ;(crypto.verifyObj as jest.Mock).mockReturnValue(false)

        // Act
        const result = validatePenaltyTX(TEST_TX_ID, mockPenaltyTX)

        // Assert
        expect(result).toEqual({
          isValid: false,
          reason: 'Invalid signature for Penalty tx',
        })
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-penalty',
          'validatePenaltyTX fail Invalid signature'
        )
      })

      it('validatePenaltyTX should return invalid when signature verification throws', () => {
        // Arrange
        ;(crypto.verifyObj as jest.Mock).mockImplementation(() => {
          throw new Error('Verification failed')
        })

        // Act
        const result = validatePenaltyTX(TEST_TX_ID, mockPenaltyTX)

        // Assert
        expect(result).toEqual({
          isValid: false,
          reason: 'Invalid signature for Penalty tx',
        })
        expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
          'shardeum-penalty',
          'validatePenaltyTX fail Invalid signature exception'
        )
      })
    })

    describe('Success Case', () => {
      it('validatePenaltyTX should return valid for a properly formed penalty TX', () => {
        // Act
        const result = validatePenaltyTX(TEST_TX_ID, mockPenaltyTX)

        // Assert
        expect(result).toEqual({
          isValid: true,
          reason: '',
        })
      })
    })
  })

  /**
   * Tests for the `applyPenaltyTX` function.
   * This function applies penalties to nodes based on penalty transactions.
   * It validates the penalty transaction, updates the node and operator accounts, and commits the changes.
   * These tests cover scenarios such as:
   * - Handling invalid penalty transactions
   * - Checking if a penalty transaction has already been processed
   * - Applying penalties and updating account states
   * - Handling specific violation types
   * - Creating internal transaction receipts
   * - Adding changed accounts to the apply response
   */
  describe('applyPenaltyTX', () => {
    let mockPenaltyTX: PenaltyTX
    let mockNetworkAccount: NetworkAccount
    let mockOperatorAccount: WrappedEVMAccount
    let mockApplyResponse: ShardusTypes.ApplyResponse
    let mockWrappedStates: WrappedStates

    // Constants
    const mockPublicKey = '0x' + '1'.repeat(62) // 64-character hex string for public key
    const mockNominatorAddress = '0x' + '2'.repeat(40) // 42-character hex string for Ethereum address
    const mockNodeId = '0x' + '3'.repeat(62) // 64-character hex string for node ID
    const TEST_TX_ID = 'test-tx-id'
    const TEST_TX_TIMESTAMP = 1234567890

    beforeEach(() => {
      jest.clearAllMocks()
      ;(isNodeAccount2 as unknown as jest.Mock).mockReturnValue(true)
      jest.spyOn(transactionUtils, 'toShardusAddress').mockReturnValue('')
      jest.spyOn(transactionUtils, 'validatePenaltyTX').mockReturnValue({ isValid: true, reason: '' })
      jest
        .spyOn(transactionUtils, 'isProcessedPenaltyTx')
        .mockReturnValue({ isProcessed: false, eventTime: 1234567890 })
      jest.spyOn(transactionUtils, 'getPenaltyForViolation').mockReturnValue(BigInt(100))
      jest.spyOn(transactionUtils, 'applyPenalty').mockImplementation(() => true)
      jest.spyOn(transactionUtils, 'createInternalTxReceipt').mockReturnValue(undefined)

      jest.spyOn(transactionUtils, 'getApplyTXState').mockReturnValue({
        _transactionState: {
          appData: {},
        },
        checkpoint: jest.fn().mockResolvedValue(undefined),
        putAccount: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
      } as unknown as Partial<ShardeumState> as ShardeumState)

      // Use mock factories to create test data with overrides
      mockPenaltyTX = createMockPenaltyTX({
        reportedNodeId: mockNodeId,
        reportedNodePublickKey: mockPublicKey,
        operatorEVMAddress: mockNominatorAddress,
        timestamp: TEST_TX_TIMESTAMP,
      })

      const mockNodeAccount = createMockNodeAccount({
        id: mockNodeId,
        rewardStartTime: 2000, // Override only this property
        nominator: mockNominatorAddress, // Override only this property
      })

      mockNetworkAccount = createMockNetworkAccount({
        id: networkAccount, // Override only this property
        current: {
          ...createMockNetworkAccount().current,
          nodeRewardInterval: 200, // Override only this property
        },
      })

      mockOperatorAccount = createMockOperatorAccount({
        ethAddress: mockNominatorAddress, // Override only this property
        operatorAccountInfo: {
          ...createMockOperatorAccount().operatorAccountInfo,
          stake: BigInt(2000), // Override only this property
          nominee: 'mockNominee', // Override only this property
        },
      })

      // Dynamically create mockWrappedStates using the refactored factory function
      mockWrappedStates = createMockWrappedStates(
        mockPublicKey,
        networkAccount,
        mockNodeAccount,
        mockNetworkAccount,
        mockOperatorAccount,
        transactionUtils // Pass transactionUtils for dynamic address generation
      )
    })

    describe('Validation Tests', () => {
      it('applyPenaltyTX should fail if validatePenaltyTX returns invalid', async () => {
        // Arrange
        jest.spyOn(transactionUtils, 'validatePenaltyTX').mockReturnValue({
          isValid: false,
          reason: 'Invalid penaltyTX',
        })

        // Act
        await applyPenaltyTX(
          shardusMock,
          mockPenaltyTX,
          mockWrappedStates,
          TEST_TX_ID,
          TEST_TX_TIMESTAMP,
          mockApplyResponse
        )

        // Assert
        expect(shardusMock.applyResponseSetFailed).toHaveBeenCalledWith(
          mockApplyResponse,
          `applyPenaltyTX failed validatePenaltyTX reportedNode: ${mockPublicKey} reason: Invalid penaltyTX`
        )
      })

      it('applyPenaltyTX should fail if isProcessedPenaltyTx returns isProcessed true', async () => {
        // Arrange
        jest.spyOn(transactionUtils, 'isProcessedPenaltyTx').mockReturnValue({
          isProcessed: true,
          eventTime: 1234567890,
        })

        // Act
        await applyPenaltyTX(
          shardusMock,
          mockPenaltyTX,
          mockWrappedStates,
          TEST_TX_ID,
          TEST_TX_TIMESTAMP,
          mockApplyResponse
        )

        // Assert
        expect(shardusMock.applyResponseSetFailed).toHaveBeenCalledWith(
          mockApplyResponse,
          `applyPenaltyTX failed isProcessedPenaltyTx reportedNode: ${mockPublicKey}`
        )
      })
    })

    describe('Processing Tests', () => {
      it('applyPenaltyTX should apply penalty and update node and operator accounts', async () => {
        // Act
        await applyPenaltyTX(
          shardusMock,
          mockPenaltyTX,
          mockWrappedStates,
          TEST_TX_ID,
          TEST_TX_TIMESTAMP,
          mockApplyResponse
        )

        // Assert
        expect(transactionUtils.applyPenalty).toHaveBeenCalledWith(
          mockWrappedStates[mockPublicKey].data,
          mockWrappedStates[transactionUtils.toShardusAddress(mockNominatorAddress, AccountType.Account)].data,
          BigInt(100)
        )
        expect(mockWrappedStates[mockPublicKey].data.nodeAccountStats.penaltyHistory).toHaveLength(1)
      })

      it('applyPenaltyTX should handle rewardEndTime update for LeftNetworkEarly violation', async () => {
        // Arrange
        mockWrappedStates[mockPublicKey].data.rewardStartTime = 1000

        // Act
        await applyPenaltyTX(
          shardusMock,
          mockPenaltyTX,
          mockWrappedStates,
          TEST_TX_ID,
          TEST_TX_TIMESTAMP,
          mockApplyResponse
        )

        // Assert
        expect(mockWrappedStates[mockPublicKey].data.rewardEndTime).toBe(TEST_TX_TIMESTAMP)
        expect(mockWrappedStates[mockPublicKey].data.nodeAccountStats.history).toHaveLength(1)
      })
    })

    describe('State Update Tests', () => {
      it('applyPenaltyTX should call checkpoint, putAccount, and commit on shardeumState', async () => {
        // Arrange
        const mockShardeumState = transactionUtils.getApplyTXState(TEST_TX_ID)
        const operatorEVMAddress = Address.fromString(mockPenaltyTX.operatorEVMAddress)

        // Act
        await applyPenaltyTX(
          shardusMock,
          mockPenaltyTX,
          mockWrappedStates,
          TEST_TX_ID,
          TEST_TX_TIMESTAMP,
          mockApplyResponse
        )

        // Assert
        expect(mockShardeumState.checkpoint).toHaveBeenCalled()
        expect(mockShardeumState.putAccount).toHaveBeenCalledWith(
          operatorEVMAddress,
          mockWrappedStates[transactionUtils.toShardusAddress(mockNominatorAddress, AccountType.Account)].data.account
        )
        expect(mockShardeumState.commit).toHaveBeenCalled()
      })

      it('applyPenaltyTX should add changed accounts to applyResponse when useAccountWrites is enabled', async () => {
        // Arrange
        ShardeumFlags.useAccountWrites = true

        // Act
        await applyPenaltyTX(
          shardusMock,
          mockPenaltyTX,
          mockWrappedStates,
          TEST_TX_ID,
          TEST_TX_TIMESTAMP,
          mockApplyResponse
        )

        // Assert
        expect(shardusMock.applyResponseAddChangedAccount).toHaveBeenCalledTimes(2)
      })

      it('applyPenaltyTX should create internal transaction receipt when supportInternalTxReceipt is enabled', async () => {
        // Arrange
        ShardeumFlags.supportInternalTxReceipt = true

        // Act
        await applyPenaltyTX(
          shardusMock,
          mockPenaltyTX,
          mockWrappedStates,
          TEST_TX_ID,
          TEST_TX_TIMESTAMP,
          mockApplyResponse
        )

        // Assert
        expect(transactionUtils.createInternalTxReceipt).toHaveBeenCalled()
      })
    })
  })
})
