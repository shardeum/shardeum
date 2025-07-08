import { updateSstoreGasEIP2200 } from '../../../../../src/evm_v2/opcodes/EIP2200'
import { Common } from '@ethereumjs/common'
import { RunState } from '../../../../../src/evm_v2/interpreter'
import { hexToBytes } from '@ethereumjs/util'
import { ERROR } from '../../../../../src/evm_v2/exceptions'

// Mock the EIP2929 module
jest.mock('../../../../../src/evm_v2/opcodes/EIP2929', () => ({
  adjustSstoreGasEIP2929: jest.fn((runState, key, cost, type, common) => cost),
}))

// Mock the util module
jest.mock('../../../../../src/evm_v2/opcodes/util', () => ({
  trap: jest.fn(),
}))

import { adjustSstoreGasEIP2929 } from '../../../../../src/evm_v2/opcodes/EIP2929'
import { trap } from '../../../../../src/evm_v2/opcodes/util'

describe('EIP2200 - Structured definitions for net gas metering', () => {
  let mockRunState: Partial<RunState>
  let mockCommon: jest.Mocked<Common>
  const mockAdjustSstoreGasEIP2929 = adjustSstoreGasEIP2929 as jest.MockedFunction<typeof adjustSstoreGasEIP2929>
  const mockTrap = trap as jest.MockedFunction<typeof trap>
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset the trap mock to throw an error when called
    mockTrap.mockImplementation((error) => {
      throw new Error(error)
    })
    
    mockRunState = {
      interpreter: {
        refundGas: jest.fn(),
        subRefund: jest.fn(),
        getGasLeft: jest.fn().mockReturnValue(BigInt(1000000)), // Default: plenty of gas
      } as any,
    }
    
    mockCommon = {
      param: jest.fn(),
    } as any

    // Set up default gas price returns
    mockCommon.param.mockImplementation((section: string, name: string) => {
      const gasPrices: { [key: string]: bigint } = {
        sstoreSentryGasEIP2200: BigInt(2300),
        sstoreNoopGasEIP2200: BigInt(800),
        sstoreInitGasEIP2200: BigInt(20000),
        sstoreCleanGasEIP2200: BigInt(5000),
        sstoreDirtyGasEIP2200: BigInt(800),
        sstoreClearRefundEIP2200: BigInt(15000),
        sstoreInitRefundEIP2200: BigInt(19200),
        sstoreCleanRefundEIP2200: BigInt(4200),
      }
      return gasPrices[name] || BigInt(0)
    })

    // Default mock for adjustSstoreGasEIP2929 - returns the input cost
    mockAdjustSstoreGasEIP2929.mockImplementation((runState, key, cost, type, common) => cost)
  })

  describe('Sentry check', () => {
    it('should trap with OUT_OF_GAS when gas left is less than or equal to sentry gas', () => {
      const mockGetGasLeft = mockRunState.interpreter!.getGasLeft as jest.MockedFunction<any>
      mockGetGasLeft.mockReturnValue(BigInt(2300)) // Exactly at sentry limit

      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x5678')
      const key = hexToBytes('0xabcd')

      expect(() => {
        updateSstoreGasEIP2200(
          mockRunState as RunState,
          currentStorage,
          originalStorage,
          value,
          key,
          mockCommon
        )
      }).toThrow('out of gas')

      expect(mockTrap).toHaveBeenCalledWith(ERROR.OUT_OF_GAS)
    })

    it('should not trap when gas left is sufficient', () => {
      const mockGetGasLeft = mockRunState.interpreter!.getGasLeft as jest.MockedFunction<any>
      mockGetGasLeft.mockReturnValue(BigInt(2301)) // Just above sentry limit

      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x1234') // No-op case

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        hexToBytes('0xabcd'),
        mockCommon
      )

      expect(mockTrap).not.toHaveBeenCalled()
      expect(gas).toBe(BigInt(800)) // noop cost
    })
  })

  describe('No-op cases', () => {
    it('should charge noop gas and apply EIP2929 adjustment when current equals new value', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x5678')
      const value = hexToBytes('0x1234')
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockAdjustSstoreGasEIP2929).toHaveBeenCalledWith(
        mockRunState,
        key,
        BigInt(800),
        'noop',
        mockCommon
      )
      expect(mockRunState.interpreter!.refundGas).not.toHaveBeenCalled()
    })
  })

  describe('Clean storage slot cases (original === current)', () => {
    it('should charge init gas when creating new storage slot', () => {
      const currentStorage = new Uint8Array(0)
      const originalStorage = new Uint8Array(0)
      const value = hexToBytes('0x1234')
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(20000))
      expect(mockAdjustSstoreGasEIP2929).not.toHaveBeenCalled()
    })

    it('should charge clean gas and add refund when deleting slot', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x1234')
      const value = new Uint8Array(0)
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(5000))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(15000),
        'EIP-2200 -> sstoreClearRefundEIP2200'
      )
    })

    it('should charge clean gas when updating existing slot', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x5678')
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(5000))
      expect(mockRunState.interpreter!.refundGas).not.toHaveBeenCalled()
    })
  })

  describe('Dirty storage slot cases (original !== current)', () => {
    it('should charge dirty gas and subtract refund when recreating deleted slot', () => {
      const currentStorage = new Uint8Array(0)
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x5678')
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockRunState.interpreter!.subRefund).toHaveBeenCalledWith(
        BigInt(15000),
        'EIP-2200 -> sstoreClearRefundEIP2200'
      )
    })

    it('should charge dirty gas and add refund when deleting recreated slot', () => {
      const currentStorage = hexToBytes('0x5678')
      const originalStorage = hexToBytes('0x1234')
      const value = new Uint8Array(0)
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(15000),
        'EIP-2200 -> sstoreClearRefundEIP2200'
      )
    })

    it('should charge dirty gas with no refund when all values are non-zero and different', () => {
      const currentStorage = hexToBytes('0x5678')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x9abc')
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockRunState.interpreter!.refundGas).not.toHaveBeenCalled()
      expect(mockRunState.interpreter!.subRefund).not.toHaveBeenCalled()
    })
  })

  describe('Reset cases (original === new value)', () => {
    it('should charge dirty gas and add init refund when resetting to original empty', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = new Uint8Array(0)
      const value = new Uint8Array(0)
      const key = hexToBytes('0xabcd')

      // Mock adjustSstoreGasEIP2929 to return adjusted value
      mockAdjustSstoreGasEIP2929.mockImplementation((runState, key, cost, type, common) => {
        if (type === 'initRefund') return BigInt(19000) // Adjusted value
        return cost
      })

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(19000),
        'EIP-2200 -> initRefund'
      )
      expect(mockAdjustSstoreGasEIP2929).toHaveBeenCalledWith(
        mockRunState,
        key,
        BigInt(19200),
        'initRefund',
        mockCommon
      )
    })

    it('should charge dirty gas and add clean refund when resetting to original non-zero', () => {
      const currentStorage = hexToBytes('0x5678')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x1234')
      const key = hexToBytes('0xabcd')

      // Mock adjustSstoreGasEIP2929 to return adjusted value
      mockAdjustSstoreGasEIP2929.mockImplementation((runState, key, cost, type, common) => {
        if (type === 'cleanRefund') return BigInt(4000) // Adjusted value
        return cost
      })

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(4000),
        'EIP-2200 -> cleanRefund'
      )
      expect(mockAdjustSstoreGasEIP2929).toHaveBeenCalledWith(
        mockRunState,
        key,
        BigInt(4200),
        'cleanRefund',
        mockCommon
      )
    })
  })

  describe('Complex scenarios', () => {
    it('should handle transition: empty -> non-empty -> empty (reset)', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = new Uint8Array(0)
      const value = new Uint8Array(0)
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalled()
    })

    it('should handle transition: non-empty -> empty -> different non-empty', () => {
      const currentStorage = new Uint8Array(0)
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x5678')
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockRunState.interpreter!.subRefund).toHaveBeenCalledWith(
        BigInt(15000),
        'EIP-2200 -> sstoreClearRefundEIP2200'
      )
    })

    it('should handle dirty slot with no original value', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = new Uint8Array(0)
      const value = hexToBytes('0x5678')
      const key = hexToBytes('0xabcd')

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockRunState.interpreter!.refundGas).not.toHaveBeenCalled()
      expect(mockRunState.interpreter!.subRefund).not.toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('should handle all empty values', () => {
      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        new Uint8Array(0),
        new Uint8Array(0),
        new Uint8Array(0),
        hexToBytes('0xabcd'),
        mockCommon
      )

      expect(gas).toBe(BigInt(800)) // no-op with EIP2929 adjustment
      expect(mockAdjustSstoreGasEIP2929).toHaveBeenCalledWith(
        mockRunState,
        hexToBytes('0xabcd'),
        BigInt(800),
        'noop',
        mockCommon
      )
    })

    it('should handle 32-byte storage values', () => {
      const currentStorage = new Uint8Array(32).fill(1)
      const originalStorage = new Uint8Array(32).fill(2)
      const value = new Uint8Array(32).fill(3)
      const key = new Uint8Array(32).fill(4)

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800)) // dirty update
    })
  })

  describe('Gas parameter variations', () => {
    it('should use correct gas parameters from common', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x5678')

      mockCommon.param.mockImplementation((section, name) => {
        if (name === 'sstoreCleanGasEIP2200') return BigInt(12345)
        if (name === 'sstoreSentryGasEIP2200') return BigInt(2300)
        return BigInt(1000000) // Default for other params
      })

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        hexToBytes('0xabcd'),
        mockCommon
      )

      expect(gas).toBe(BigInt(12345))
      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'sstoreCleanGasEIP2200')
    })
  })

  describe('Integration with EIP2929', () => {
    it('should properly integrate with EIP2929 for noop operations', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x5678')
      const value = hexToBytes('0x1234')
      const key = hexToBytes('0xabcd')

      mockAdjustSstoreGasEIP2929.mockReturnValue(BigInt(2800)) // Cold access cost

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(2800))
      expect(mockAdjustSstoreGasEIP2929).toHaveBeenCalledWith(
        mockRunState,
        key,
        BigInt(800),
        'noop',
        mockCommon
      )
    })

    it('should properly integrate with EIP2929 for refund operations', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = new Uint8Array(0)
      const value = new Uint8Array(0)
      const key = hexToBytes('0xabcd')

      mockAdjustSstoreGasEIP2929.mockImplementation((runState, k, cost, type) => {
        if (type === 'initRefund') return BigInt(17200) // Adjusted refund
        return cost
      })

      const gas = updateSstoreGasEIP2200(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        key,
        mockCommon
      )

      expect(gas).toBe(BigInt(800))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(17200),
        'EIP-2200 -> initRefund'
      )
    })
  })
})