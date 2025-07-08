import { 
  accessAddressEIP2929, 
  accessStorageEIP2929, 
  adjustSstoreGasEIP2929 
} from '../../../../../src/evm_v2/opcodes/EIP2929'
import { Common } from '@ethereumjs/common'
import { RunState } from '../../../../../src/evm_v2/interpreter'
import { Address } from '@ethereumjs/util'

describe('EIP2929 - Gas cost increases for state access opcodes', () => {
  let mockRunState: Partial<RunState>
  let mockCommon: jest.Mocked<Common>
  let mockAddress: Address
  
  beforeEach(() => {
    // Create mock address
    mockAddress = Address.fromString('0x742d35Cc6634C0532925a3b844Bc9e7595f8b2dC')
    
    // Create mock journal
    const mockJournal = {
      isWarmedAddress: jest.fn().mockReturnValue(false),
      addWarmedAddress: jest.fn(),
      isWarmedStorage: jest.fn().mockReturnValue(false),
      addWarmedStorage: jest.fn(),
    }
    
    mockRunState = {
      interpreter: {
        journal: mockJournal,
        getAddress: jest.fn().mockReturnValue(mockAddress),
      } as any,
    }
    
    mockCommon = {
      isActivatedEIP: jest.fn().mockReturnValue(true),
      param: jest.fn(),
    } as any

    // Set up default gas price returns
    mockCommon.param.mockImplementation((section: string, name: string) => {
      const gasPrices: { [key: string]: bigint } = {
        coldaccountaccess: BigInt(2600),
        warmstorageread: BigInt(100),
        coldsload: BigInt(2100),
        sstoreInitGasEIP2200: BigInt(20000),
        sstoreReset: BigInt(5000),
      }
      return gasPrices[name] || BigInt(0)
    })
  })

  describe('accessAddressEIP2929', () => {
    it('should return 0 when EIP-2929 is not activated', () => {
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const gas = accessAddressEIP2929(
        mockRunState as RunState,
        mockAddress,
        mockCommon
      )

      expect(gas).toBe(BigInt(0))
      expect(mockRunState.interpreter!.journal.isWarmedAddress).not.toHaveBeenCalled()
    })

    describe('cold address access', () => {
      it('should charge cold access cost and warm the address', () => {
        const gas = accessAddressEIP2929(
          mockRunState as RunState,
          mockAddress,
          mockCommon
        )

        expect(gas).toBe(BigInt(2600))
        expect(mockRunState.interpreter!.journal.isWarmedAddress).toHaveBeenCalledWith(mockAddress.bytes)
        expect(mockRunState.interpreter!.journal.addWarmedAddress).toHaveBeenCalledWith(mockAddress.bytes)
      })

      it('should not charge gas when chargeGas is false (CREATE/CREATE2)', () => {
        const gas = accessAddressEIP2929(
          mockRunState as RunState,
          mockAddress,
          mockCommon,
          false // chargeGas
        )

        expect(gas).toBe(BigInt(0))
        expect(mockRunState.interpreter!.journal.addWarmedAddress).toHaveBeenCalledWith(mockAddress.bytes)
      })

      it('should charge cold access for selfdestruct beneficiary', () => {
        const gas = accessAddressEIP2929(
          mockRunState as RunState,
          mockAddress,
          mockCommon,
          true, // chargeGas
          true  // isSelfdestructOrAuthcall
        )

        expect(gas).toBe(BigInt(2600))
        expect(mockRunState.interpreter!.journal.addWarmedAddress).toHaveBeenCalledWith(mockAddress.bytes)
      })
    })

    describe('warm address access', () => {
      beforeEach(() => {
        mockRunState.interpreter!.journal.isWarmedAddress = jest.fn().mockReturnValue(true)
      })

      it('should charge warm storage read cost for normal access', () => {
        const gas = accessAddressEIP2929(
          mockRunState as RunState,
          mockAddress,
          mockCommon
        )

        expect(gas).toBe(BigInt(100))
        expect(mockRunState.interpreter!.journal.addWarmedAddress).not.toHaveBeenCalled()
      })

      it('should not charge gas when chargeGas is false', () => {
        const gas = accessAddressEIP2929(
          mockRunState as RunState,
          mockAddress,
          mockCommon,
          false // chargeGas
        )

        expect(gas).toBe(BigInt(0))
      })

      it('should not charge gas for warm selfdestruct/authcall', () => {
        const gas = accessAddressEIP2929(
          mockRunState as RunState,
          mockAddress,
          mockCommon,
          true, // chargeGas
          true  // isSelfdestructOrAuthcall
        )

        expect(gas).toBe(BigInt(0))
      })
    })
  })

  describe('accessStorageEIP2929', () => {
    const storageKey = new Uint8Array(32).fill(1)

    it('should return 0 when EIP-2929 is not activated', () => {
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const gas = accessStorageEIP2929(
        mockRunState as RunState,
        storageKey,
        false,
        mockCommon
      )

      expect(gas).toBe(BigInt(0))
      expect(mockRunState.interpreter!.journal.isWarmedStorage).not.toHaveBeenCalled()
    })

    describe('cold storage access', () => {
      it('should charge cold sload cost for SLOAD', () => {
        const gas = accessStorageEIP2929(
          mockRunState as RunState,
          storageKey,
          false, // isSstore
          mockCommon
        )

        expect(gas).toBe(BigInt(2100))
        expect(mockRunState.interpreter!.journal.isWarmedStorage).toHaveBeenCalledWith(
          mockAddress.bytes,
          storageKey
        )
        expect(mockRunState.interpreter!.journal.addWarmedStorage).toHaveBeenCalledWith(
          mockAddress.bytes,
          storageKey
        )
      })

      it('should charge cold sload cost for SSTORE', () => {
        const gas = accessStorageEIP2929(
          mockRunState as RunState,
          storageKey,
          true, // isSstore
          mockCommon
        )

        expect(gas).toBe(BigInt(2100))
        expect(mockRunState.interpreter!.journal.addWarmedStorage).toHaveBeenCalledWith(
          mockAddress.bytes,
          storageKey
        )
      })
    })

    describe('warm storage access', () => {
      beforeEach(() => {
        mockRunState.interpreter!.journal.isWarmedStorage = jest.fn().mockReturnValue(true)
      })

      it('should charge warm storage read cost for SLOAD', () => {
        const gas = accessStorageEIP2929(
          mockRunState as RunState,
          storageKey,
          false, // isSstore
          mockCommon
        )

        expect(gas).toBe(BigInt(100))
        expect(mockRunState.interpreter!.journal.addWarmedStorage).not.toHaveBeenCalled()
      })

      it('should charge 0 for warm SSTORE', () => {
        const gas = accessStorageEIP2929(
          mockRunState as RunState,
          storageKey,
          true, // isSstore
          mockCommon
        )

        expect(gas).toBe(BigInt(0))
        expect(mockRunState.interpreter!.journal.addWarmedStorage).not.toHaveBeenCalled()
      })
    })
  })

  describe('adjustSstoreGasEIP2929', () => {
    const storageKey = new Uint8Array(32).fill(2)

    it('should return default cost when EIP-2929 is not activated', () => {
      mockCommon.isActivatedEIP.mockReturnValue(false)
      const defaultCost = BigInt(800)

      const gas = adjustSstoreGasEIP2929(
        mockRunState as RunState,
        storageKey,
        defaultCost,
        'noop',
        mockCommon
      )

      expect(gas).toBe(defaultCost)
    })

    describe('cold storage', () => {
      it('should return default cost for all operations', () => {
        const defaultCost = BigInt(800)

        const noopGas = adjustSstoreGasEIP2929(
          mockRunState as RunState,
          storageKey,
          defaultCost,
          'noop',
          mockCommon
        )
        expect(noopGas).toBe(defaultCost)

        const initRefundGas = adjustSstoreGasEIP2929(
          mockRunState as RunState,
          storageKey,
          BigInt(19200),
          'initRefund',
          mockCommon
        )
        expect(initRefundGas).toBe(BigInt(19200))

        const cleanRefundGas = adjustSstoreGasEIP2929(
          mockRunState as RunState,
          storageKey,
          BigInt(4200),
          'cleanRefund',
          mockCommon
        )
        expect(cleanRefundGas).toBe(BigInt(4200))

        const unknownGas = adjustSstoreGasEIP2929(
          mockRunState as RunState,
          storageKey,
          BigInt(5000),
          'unknown',
          mockCommon
        )
        expect(unknownGas).toBe(BigInt(5000))
      })
    })

    describe('warm storage', () => {
      beforeEach(() => {
        mockRunState.interpreter!.journal.isWarmedStorage = jest.fn().mockReturnValue(true)
      })

      it('should return warm read cost for noop', () => {
        const gas = adjustSstoreGasEIP2929(
          mockRunState as RunState,
          storageKey,
          BigInt(800),
          'noop',
          mockCommon
        )

        expect(gas).toBe(BigInt(100)) // warmstorageread
      })

      it('should adjust init refund correctly', () => {
        const gas = adjustSstoreGasEIP2929(
          mockRunState as RunState,
          storageKey,
          BigInt(19200),
          'initRefund',
          mockCommon
        )

        // sstoreInitGasEIP2200 (20000) - warmstorageread (100) = 19900
        expect(gas).toBe(BigInt(19900))
      })

      it('should adjust clean refund correctly', () => {
        const gas = adjustSstoreGasEIP2929(
          mockRunState as RunState,
          storageKey,
          BigInt(4200),
          'cleanRefund',
          mockCommon
        )

        // sstoreReset (5000) - coldsload (2100) - warmstorageread (100) = 2800
        expect(gas).toBe(BigInt(2800))
      })

      it('should return default cost for unknown cost names', () => {
        const defaultCost = BigInt(5000)
        const gas = adjustSstoreGasEIP2929(
          mockRunState as RunState,
          storageKey,
          defaultCost,
          'unknown',
          mockCommon
        )

        expect(gas).toBe(defaultCost)
      })
    })
  })

  describe('Edge cases and integration', () => {
    it('should handle different address formats', () => {
      const addresses = [
        Address.fromString('0x0000000000000000000000000000000000000000'),
        Address.fromString('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'),
        Address.fromString('0x1234567890123456789012345678901234567890'),
      ]

      addresses.forEach(addr => {
        const gas = accessAddressEIP2929(
          mockRunState as RunState,
          addr,
          mockCommon
        )
        expect(gas).toBe(BigInt(2600))
        expect(mockRunState.interpreter!.journal.addWarmedAddress).toHaveBeenCalledWith(addr.bytes)
      })
    })

    it('should handle different storage key sizes', () => {
      const keys = [
        new Uint8Array(32).fill(0),
        new Uint8Array(32).fill(255),
        new Uint8Array(32), // all zeros
      ]

      keys.forEach(key => {
        jest.clearAllMocks()
        const gas = accessStorageEIP2929(
          mockRunState as RunState,
          key,
          false,
          mockCommon
        )
        expect(gas).toBe(BigInt(2100))
        expect(mockRunState.interpreter!.journal.addWarmedStorage).toHaveBeenCalledWith(
          mockAddress.bytes,
          key
        )
      })
    })

    it('should properly check warmed status for storage access', () => {
      const key = new Uint8Array(32).fill(42)
      
      // First access - cold
      let gas = accessStorageEIP2929(
        mockRunState as RunState,
        key,
        false,
        mockCommon
      )
      expect(gas).toBe(BigInt(2100))

      // Simulate warming
      mockRunState.interpreter!.journal.isWarmedStorage = jest.fn().mockReturnValue(true)

      // Second access - warm
      gas = accessStorageEIP2929(
        mockRunState as RunState,
        key,
        false,
        mockCommon
      )
      expect(gas).toBe(BigInt(100))
    })

    it('should handle gas parameter variations', () => {
      mockCommon.param.mockImplementation((section, name) => {
        const customPrices: { [key: string]: bigint } = {
          coldaccountaccess: BigInt(5000),
          warmstorageread: BigInt(200),
          coldsload: BigInt(4000),
        }
        return customPrices[name] || BigInt(0)
      })

      const addressGas = accessAddressEIP2929(
        mockRunState as RunState,
        mockAddress,
        mockCommon
      )
      expect(addressGas).toBe(BigInt(5000))

      const storageGas = accessStorageEIP2929(
        mockRunState as RunState,
        new Uint8Array(32),
        false,
        mockCommon
      )
      expect(storageGas).toBe(BigInt(4000))
    })
  })
})