import { updateSstoreGasEIP1283 } from '../../../../../src/evm_v2/opcodes/EIP1283'
import { Common, Hardfork } from '@ethereumjs/common'
import { RunState } from '../../../../../src/evm_v2/interpreter'
import { hexToBytes } from '@ethereumjs/util'

describe('EIP1283 - Net gas metering for SSTORE', () => {
  let mockRunState: Partial<RunState>
  let mockCommon: jest.Mocked<Common>
  
  beforeEach(() => {
    mockRunState = {
      interpreter: {
        refundGas: jest.fn(),
        subRefund: jest.fn(),
      } as any,
    }
    
    mockCommon = {
      param: jest.fn(),
    } as any

    // Set up default gas price returns
    mockCommon.param.mockImplementation((section: string, name: string) => {
      const gasPrices: { [key: string]: bigint } = {
        netSstoreNoopGas: BigInt(200),
        netSstoreInitGas: BigInt(20000),
        netSstoreCleanGas: BigInt(5000),
        netSstoreDirtyGas: BigInt(200),
        netSstoreClearRefund: BigInt(15000),
        netSstoreResetClearRefund: BigInt(19800),
        netSstoreResetRefund: BigInt(4800),
      }
      return gasPrices[name] || BigInt(0)
    })
  })

  describe('No-op cases', () => {
    it('should charge 200 gas when current value equals new value', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x5678')
      const value = hexToBytes('0x1234')

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200))
      expect(mockRunState.interpreter!.refundGas).not.toHaveBeenCalled()
      expect(mockRunState.interpreter!.subRefund).not.toHaveBeenCalled()
    })
  })

  describe('Clean storage slot cases (original === current)', () => {
    it('should charge 20000 gas when setting non-zero value on empty slot', () => {
      const currentStorage = new Uint8Array(0) // empty
      const originalStorage = new Uint8Array(0) // empty
      const value = hexToBytes('0x1234')

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(20000))
      expect(mockRunState.interpreter!.refundGas).not.toHaveBeenCalled()
    })

    it('should charge 5000 gas and add 15000 refund when clearing non-empty slot', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x1234')
      const value = new Uint8Array(0) // clearing

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(5000))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(15000),
        'EIP-1283 -> netSstoreClearRefund'
      )
    })

    it('should charge 5000 gas when changing from one non-zero to another', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x5678')

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(5000))
      expect(mockRunState.interpreter!.refundGas).not.toHaveBeenCalled()
    })
  })

  describe('Dirty storage slot cases (original !== current)', () => {
    it('should charge 200 gas and subtract 15000 refund when original non-zero, current zero, new non-zero', () => {
      const currentStorage = new Uint8Array(0)
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x5678')

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200))
      expect(mockRunState.interpreter!.subRefund).toHaveBeenCalledWith(
        BigInt(15000),
        'EIP-1283 -> netSstoreClearRefund'
      )
    })

    it('should charge 200 gas and add 15000 refund when original non-zero, current non-zero, new zero', () => {
      const currentStorage = hexToBytes('0x5678')
      const originalStorage = hexToBytes('0x1234')
      const value = new Uint8Array(0)

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(15000),
        'EIP-1283 -> netSstoreClearRefund'
      )
    })

    it('should charge 200 gas with no refund when all values are non-zero and different', () => {
      const currentStorage = hexToBytes('0x5678')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x9abc')

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200))
      expect(mockRunState.interpreter!.refundGas).not.toHaveBeenCalled()
      expect(mockRunState.interpreter!.subRefund).not.toHaveBeenCalled()
    })
  })

  describe('Reset cases (original === new value)', () => {
    it('should charge 200 gas and add 19800 refund when resetting to original zero', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = new Uint8Array(0)
      const value = new Uint8Array(0)

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(19800),
        'EIP-1283 -> netSstoreResetClearRefund'
      )
    })

    it('should charge 200 gas and add 4800 refund when resetting to original non-zero', () => {
      const currentStorage = hexToBytes('0x5678')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x1234')

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(4800),
        'EIP-1283 -> netSstoreResetRefund'
      )
    })
  })

  describe('Complex scenarios', () => {
    it('should handle case: original=0, current=X, new=0', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = new Uint8Array(0)
      const value = new Uint8Array(0)

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200))
      // Should trigger reset refund since we're going back to original value (0)
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(19800),
        'EIP-1283 -> netSstoreResetClearRefund'
      )
    })

    it('should handle case: original=X, current=0, new=Y (not X)', () => {
      const currentStorage = new Uint8Array(0)
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x5678')

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200))
      // Should subtract refund since current is 0 but we're setting to non-zero
      expect(mockRunState.interpreter!.subRefund).toHaveBeenCalledWith(
        BigInt(15000),
        'EIP-1283 -> netSstoreClearRefund'
      )
    })

    it('should handle case: original=X, current=Y, new=X (reset to original)', () => {
      const currentStorage = hexToBytes('0x5678')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x1234')

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200))
      expect(mockRunState.interpreter!.refundGas).toHaveBeenCalledWith(
        BigInt(4800),
        'EIP-1283 -> netSstoreResetRefund'
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle empty arrays correctly', () => {
      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        new Uint8Array(0),
        new Uint8Array(0),
        new Uint8Array(0),
        mockCommon
      )

      expect(gas).toBe(BigInt(200)) // no-op case
    })

    it('should handle single byte arrays', () => {
      const currentStorage = new Uint8Array([1])
      const originalStorage = new Uint8Array([1])
      const value = new Uint8Array([2])

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(5000))
    })

    it('should handle 32-byte arrays (typical storage values)', () => {
      const currentStorage = new Uint8Array(32).fill(1)
      const originalStorage = new Uint8Array(32).fill(2)
      const value = new Uint8Array(32).fill(3)

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(200)) // dirty slot
    })
  })

  describe('Gas parameter variations', () => {
    it('should use correct gas parameters from common', () => {
      const currentStorage = hexToBytes('0x1234')
      const originalStorage = hexToBytes('0x1234')
      const value = hexToBytes('0x5678')

      mockCommon.param.mockReturnValue(BigInt(12345))

      const gas = updateSstoreGasEIP1283(
        mockRunState as RunState,
        currentStorage,
        originalStorage,
        value,
        mockCommon
      )

      expect(gas).toBe(BigInt(12345))
      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'netSstoreCleanGas')
    })
  })
})