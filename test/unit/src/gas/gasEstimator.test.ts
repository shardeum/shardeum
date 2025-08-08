import { Address, bytesToHex, hexToBytes } from '@ethereumjs/util'
import { TypedTransaction } from '@ethereumjs/tx'
import TransactionState from '../../../../src/state/transactionState'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { AccountType, WrappedEVMAccount } from '../../../../src/shardeum/shardeumTypes'
import * as accountStorage from '../../../../src/storage/accountStorage'
import {
  detectBatchOperations,
  calculateBatchOperationGas,
  calculateBufferPercentage,
  analyzeStorageAccess,
  enhanceGasEstimate,
  preloadStorageSlots,
} from '../../../../src/gas/gasEstimator'

jest.mock('../../../../src/storage/accountStorage')
jest.mock('../../../../src/shardeum/evmAddress', () => ({
  toShardusAddressWithKey: jest.fn((address: string, key: string) => {
    return `${address.replace('0x', '')}${key.replace('0x', '')}`
  })
}))

describe('gasEstimator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ShardeumFlags.VerboseLogs = false
  })

  describe('detectBatchOperations', () => {
    it('should return false for null data', () => {
      const result = detectBatchOperations(null)
      expect(result).toEqual({
        isBatch: false,
        estimatedOperations: 0,
        dataLength: 0,
      })
    })

    it('should return false for small data', () => {
      const data = new Uint8Array(50)
      const result = detectBatchOperations(data)
      expect(result).toEqual({
        isBatch: false,
        estimatedOperations: 0,
        dataLength: 0,
      })
    })

    it('should detect batch operations for large data', () => {
      const data = new Uint8Array(500)
      const result = detectBatchOperations(data)
      expect(result).toEqual({
        isBatch: true,
        estimatedOperations: 5,
        dataLength: 500,
      })
    })

    it('should calculate correct operations for various data sizes', () => {
      const testCases = [
        { size: 100, expectedOps: 1, isBatch: false },
        { size: 200, expectedOps: 2, isBatch: true },
        { size: 350, expectedOps: 3, isBatch: true },
        { size: 1000, expectedOps: 10, isBatch: true },
      ]

      testCases.forEach(({ size, expectedOps, isBatch }) => {
        const data = new Uint8Array(size)
        const result = detectBatchOperations(data)
        expect(result.estimatedOperations).toBe(expectedOps)
        expect(result.isBatch).toBe(isBatch)
        expect(result.dataLength).toBe(size)
      })
    })
  })

  describe('calculateBatchOperationGas', () => {
    it('should calculate gas for zero operations', () => {
      const result = calculateBatchOperationGas(0, 0)
      expect(result).toEqual({
        arrayOperationGas: BigInt(0),
        eventGas: BigInt(0),
        secondaryStorageGas: BigInt(0),
        memoryGas: BigInt(0),
        total: BigInt(0),
      })
    })

    it('should calculate gas for single operation', () => {
      const result = calculateBatchOperationGas(1, 64)
      expect(result).toEqual({
        arrayOperationGas: BigInt(10000),
        eventGas: BigInt(1500),
        secondaryStorageGas: BigInt(7600),
        memoryGas: BigInt(6), // 64 bytes = 2 words * 3 gas
        total: BigInt(19106),
      })
    })

    it('should calculate gas for multiple operations', () => {
      const result = calculateBatchOperationGas(5, 320)
      expect(result).toEqual({
        arrayOperationGas: BigInt(50000),
        eventGas: BigInt(7500),
        secondaryStorageGas: BigInt(38000),
        memoryGas: BigInt(30), // 320 bytes = 10 words * 3 gas
        total: BigInt(95530),
      })
    })

    it('should handle non-aligned data lengths', () => {
      const result = calculateBatchOperationGas(2, 100)
      expect(result).toEqual({
        arrayOperationGas: BigInt(20000),
        eventGas: BigInt(3000),
        secondaryStorageGas: BigInt(15200),
        memoryGas: BigInt(9), // 100 bytes = 3 words (floor(100/32)) * 3 gas
        total: BigInt(38209),
      })
    })
  })

  describe('calculateBufferPercentage', () => {
    it('should return base buffer for simple operations', () => {
      const result = calculateBufferPercentage(0, 0, false)
      expect(result).toBe(10)
    })

    it('should increase buffer for batch operations', () => {
      const result = calculateBufferPercentage(5, 0, false)
      expect(result).toBe(10) // Base buffer since operations < 10
    })

    it('should increase buffer for many operations', () => {
      const result = calculateBufferPercentage(15, 0, false)
      expect(result).toBe(11) // 10 + floor(15/10) = 11
    })

    it('should cap buffer at 25%', () => {
      const result = calculateBufferPercentage(200, 0, false)
      expect(result).toBe(25) // Capped at 25
    })

    it('should increase buffer for many storage writes', () => {
      const result = calculateBufferPercentage(0, 15, false)
      expect(result).toBe(15)
    })

    it('should increase buffer for logs', () => {
      const result = calculateBufferPercentage(0, 0, true)
      expect(result).toBe(12)
    })

    it('should use highest buffer when multiple conditions apply', () => {
      const result = calculateBufferPercentage(20, 15, true)
      expect(result).toBe(15) // Max of 12 (batch), 15 (storage), 12 (logs)
    })
  })

  describe('analyzeStorageAccess', () => {
    it('should handle empty storage maps', () => {
      const readAccounts = { contractStorages: new Map() }
      const writtenAccounts = { contractStorages: new Map() }
      
      const result = analyzeStorageAccess(readAccounts, writtenAccounts)
      expect(result).toEqual({
        storageReads: 0,
        storageWrites: 0,
        contractsRead: 0,
        contractsWritten: 0,
      })
    })

    it('should count storage reads correctly', () => {
      const storageMap = new Map([
        ['slot1', 'value1'],
        ['slot2', 'value2'],
        ['slot3', 'value3'],
      ])
      const readAccounts = {
        contractStorages: new Map([['contract1', storageMap]]),
      }
      const writtenAccounts = { contractStorages: new Map() }
      
      const result = analyzeStorageAccess(readAccounts, writtenAccounts)
      expect(result).toEqual({
        storageReads: 3,
        storageWrites: 0,
        contractsRead: 1,
        contractsWritten: 0,
      })
    })

    it('should count storage writes correctly', () => {
      const readAccounts = { contractStorages: new Map() }
      const storageMap = new Map([
        ['slot1', 'value1'],
        ['slot2', 'value2'],
      ])
      const writtenAccounts = {
        contractStorages: new Map([['contract1', storageMap]]),
      }
      
      const result = analyzeStorageAccess(readAccounts, writtenAccounts)
      expect(result).toEqual({
        storageReads: 0,
        storageWrites: 2,
        contractsRead: 0,
        contractsWritten: 1,
      })
    })

    it('should handle multiple contracts', () => {
      const readMap1 = new Map([['slot1', 'value1']])
      const readMap2 = new Map([['slot2', 'value2'], ['slot3', 'value3']])
      const writeMap1 = new Map([['slot4', 'value4']])
      
      const readAccounts = {
        contractStorages: new Map([
          ['contract1', readMap1],
          ['contract2', readMap2],
        ]),
      }
      const writtenAccounts = {
        contractStorages: new Map([['contract3', writeMap1]]),
      }
      
      const result = analyzeStorageAccess(readAccounts, writtenAccounts)
      expect(result).toEqual({
        storageReads: 3,
        storageWrites: 1,
        contractsRead: 2,
        contractsWritten: 1,
      })
    })
  })

  describe('enhanceGasEstimate', () => {
    let mockTransactionState: TransactionState

    beforeEach(() => {
      mockTransactionState = {
        getReadAccounts: jest.fn().mockReturnValue({ contractStorages: new Map() }),
        getWrittenAccounts: jest.fn().mockReturnValue({ contractStorages: new Map() }),
      } as unknown as TransactionState
    })

    it('should enhance gas for batch operations', async () => {
      const mockTransaction = {
        data: new Uint8Array(250), // Batch operation data
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
      } as TypedTransaction

      const baseEstimate = BigInt(21000)
      const runTxResult = {
        execResult: { logs: [] },
      }

      const result = await enhanceGasEstimate(
        baseEstimate,
        mockTransaction,
        runTxResult,
        mockTransactionState
      )

      expect(result.baseGas).toBe(baseEstimate)
      expect(result.additionalGas).toBeGreaterThan(BigInt(0))
      expect(result.bufferPercentage).toBe(10)
      expect(result.totalGas).toBeGreaterThan(baseEstimate)
    })

    it('should add gas for logs', async () => {
      const mockTransaction = {
        data: new Uint8Array(50), // Non-batch operation
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
      } as TypedTransaction

      const baseEstimate = BigInt(21000)
      const runTxResult = {
        execResult: {
          logs: [{ address: '0x123', topics: [], data: '0x' }],
        },
      }

      const result = await enhanceGasEstimate(
        baseEstimate,
        mockTransaction,
        runTxResult,
        mockTransactionState
      )

      expect(result.additionalGas).toBe(BigInt(1000)) // 1 log * 1000 gas
      expect(result.bufferPercentage).toBe(12) // Increased for logs
    })

    it('should add gas for complex storage operations', async () => {
      const mockTransaction = {
        data: new Uint8Array(50), // Non-batch operation
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
      } as TypedTransaction

      const baseEstimate = BigInt(21000)
      const runTxResult = {
        execResult: { logs: [] },
      }

      // Mock complex storage operation
      const storageMap = new Map()
      for (let i = 0; i < 15; i++) {
        storageMap.set(`slot${i}`, `value${i}`)
      }
      mockTransactionState.getWrittenAccounts = jest.fn().mockReturnValue({
        contractStorages: new Map([['contract1', storageMap]]),
      })

      const result = await enhanceGasEstimate(
        baseEstimate,
        mockTransaction,
        runTxResult,
        mockTransactionState
      )

      expect(result.additionalGas).toBe(BigInt(15000)) // 15 writes * 1000 gas
      expect(result.bufferPercentage).toBe(15) // Increased for many storage writes
    })

    it('should handle all enhancements combined', async () => {
      const mockTransaction = {
        data: new Uint8Array(250), // Batch operation data
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
      } as TypedTransaction

      const baseEstimate = BigInt(21000)
      const runTxResult = {
        execResult: {
          logs: [{ address: '0x123', topics: [], data: '0x' }],
        },
      }

      // Mock complex storage operation
      const storageMap = new Map()
      for (let i = 0; i < 15; i++) {
        storageMap.set(`slot${i}`, `value${i}`)
      }
      mockTransactionState.getWrittenAccounts = jest.fn().mockReturnValue({
        contractStorages: new Map([['contract1', storageMap]]),
      })

      const result = await enhanceGasEstimate(
        baseEstimate,
        mockTransaction,
        runTxResult,
        mockTransactionState
      )

      // Should have batch gas + storage gas (logs already accounted in batch)
      expect(result.additionalGas).toBeGreaterThan(BigInt(15000))
      expect(result.bufferPercentage).toBe(15) // Max buffer applied
      expect(result.totalGas).toBeGreaterThan(baseEstimate)
    })

    it('should enable verbose logging when flag is set', async () => {
      ShardeumFlags.VerboseLogs = true
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const mockTransaction = {
        data: new Uint8Array(250), // Batch operation data
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
      } as TypedTransaction

      const baseEstimate = BigInt(21000)
      const runTxResult = {
        execResult: { logs: [] },
      }

      await enhanceGasEstimate(
        baseEstimate,
        mockTransaction,
        runTxResult,
        mockTransactionState
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GasEstimator: Batch operation detected:'),
        expect.any(Object)
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GasEstimator: Enhancement summary:'),
        expect.any(Object)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('preloadStorageSlots', () => {
    let mockContractAccount: WrappedEVMAccount
    let mockTransactionState: TransactionState

    beforeEach(() => {
      mockContractAccount = {
        ethAddress: '0x1234567890123456789012345678901234567890',
        accountType: AccountType.Account,
      } as WrappedEVMAccount

      mockTransactionState = {
        insertFirstContractStorageReads: jest.fn(),
      } as unknown as TransactionState

      ;(accountStorage.getAccount as jest.Mock).mockResolvedValue(null)
    })

    it('should skip preloading if transaction has no "to" address', async () => {
      const mockTransaction = {
        to: undefined,
        data: hexToBytes('0x12345678'),
      } as TypedTransaction
      
      await preloadStorageSlots(
        mockTransaction,
        mockContractAccount,
        mockTransactionState
      )

      expect(accountStorage.getAccount).not.toHaveBeenCalled()
    })

    it('should skip preloading if no contract account', async () => {
      const mockTransaction = {
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
        data: hexToBytes('0x12345678'),
      } as TypedTransaction

      await preloadStorageSlots(mockTransaction, null, mockTransactionState)

      expect(accountStorage.getAccount).not.toHaveBeenCalled()
    })

    it('should skip preloading if calldata is too small', async () => {
      const mockTransaction = {
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
        data: hexToBytes('0x12'), // Less than 4 bytes
      } as TypedTransaction

      await preloadStorageSlots(
        mockTransaction,
        mockContractAccount,
        mockTransactionState
      )

      expect(accountStorage.getAccount).not.toHaveBeenCalled()
    })

    it('should preload common storage slots', async () => {
      const mockTransaction = {
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
        data: hexToBytes('0x12345678'),
      } as TypedTransaction

      const mockStorageAccount = {
        value: Buffer.from('test-value'),
      }
      ;(accountStorage.getAccount as jest.Mock).mockResolvedValue(mockStorageAccount)

      await preloadStorageSlots(
        mockTransaction,
        mockContractAccount,
        mockTransactionState
      )

      // Should attempt to load common slots (0, 1, 2, etc.)
      expect(accountStorage.getAccount).toHaveBeenCalled()
      // When storage accounts are found, insertFirstContractStorageReads should be called
      expect(mockTransactionState.insertFirstContractStorageReads).toHaveBeenCalled()
    })

    it('should preload batch operation slots for large calldata', async () => {
      const mockTransaction = {
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
        data: new Uint8Array(600), // Large calldata triggers batch detection
      } as TypedTransaction

      const mockStorageAccount = {
        value: Buffer.from('test-value'),
      }
      ;(accountStorage.getAccount as jest.Mock).mockResolvedValue(mockStorageAccount)

      await preloadStorageSlots(
        mockTransaction,
        mockContractAccount,
        mockTransactionState
      )

      // Should load more slots due to batch operation detection
      expect(accountStorage.getAccount).toHaveBeenCalled()
      const callCount = (accountStorage.getAccount as jest.Mock).mock.calls.length
      expect(callCount).toBeGreaterThan(10) // Batch operations should load many slots
      expect(mockTransactionState.insertFirstContractStorageReads).toHaveBeenCalled()
    })

    it('should handle storage loading errors gracefully', async () => {
      const mockTransaction = {
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
        data: hexToBytes('0x12345678'),
      } as TypedTransaction

      ;(accountStorage.getAccount as jest.Mock).mockRejectedValue(new Error('Storage error'))

      await expect(
        preloadStorageSlots(mockTransaction, mockContractAccount, mockTransactionState)
      ).resolves.not.toThrow()
    })

    it('should enable verbose logging when flag is set', async () => {
      ShardeumFlags.VerboseLogs = true
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const mockTransaction = {
        to: Address.fromString('0x1234567890123456789012345678901234567890'),
        data: hexToBytes('0x12345678'),
      } as TypedTransaction

      await preloadStorageSlots(
        mockTransaction,
        mockContractAccount,
        mockTransactionState
      )

      expect(consoleSpy).toHaveBeenCalled()
      const calls = consoleSpy.mock.calls
      // Check that the preloading message was logged
      const preloadCall = calls.find(call => 
        call[0]?.includes('GasEstimator: Preloading storage') && 
        call[0]?.includes('0x12345678')
      )
      expect(preloadCall).toBeDefined()

      consoleSpy.mockRestore()
    })
  })
})