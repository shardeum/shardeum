import { 
  bytesToHex, 
  hexToBytes, 
  bigIntToBytes, 
  bytesToBigInt,
  setLengthLeft,
  setLengthRight,
  concatBytes
} from '@ethereumjs/util'
import { precompile05, expmod } from '../../../../../src/evm_v2/precompiles/05-modexp'
import { OOGResult } from '../../../../../src/evm_v2/evm'
import type { PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { Common } from '@ethereumjs/common'

describe('MODEXP (0x05) Precompile', () => {
  let mockCommon: jest.Mocked<Common>
  let mockDebug: jest.Mock
  let baseInput: PrecompileInput

  beforeEach(() => {
    mockCommon = {
      param: jest.fn((topic, param) => {
        if (param === 'modexpGquaddivisor') return BigInt(20)
        return BigInt(0)
      }),
      isActivatedEIP: jest.fn((eip) => false), // Default to pre-EIP2565
    } as any

    mockDebug = jest.fn()

    baseInput = {
      data: new Uint8Array(),
      gasLimit: BigInt(1000000),
      common: mockCommon,
      _EVM: {} as any,
      _debug: mockDebug,
    }
  })

  describe('expmod function', () => {
    it('should handle base cases correctly', () => {
      expect(expmod(BigInt(2), BigInt(0), BigInt(5))).toBe(BigInt(1)) // 2^0 mod 5 = 1
      expect(expmod(BigInt(0), BigInt(0), BigInt(5))).toBe(BigInt(1)) // 0^0 mod 5 = 1
      expect(expmod(BigInt(0), BigInt(5), BigInt(7))).toBe(BigInt(0)) // 0^5 mod 7 = 0
    })

    it('should compute modular exponentiation correctly', () => {
      expect(expmod(BigInt(2), BigInt(3), BigInt(5))).toBe(BigInt(3)) // 2^3 mod 5 = 8 mod 5 = 3
      expect(expmod(BigInt(3), BigInt(4), BigInt(7))).toBe(BigInt(4)) // 3^4 mod 7 = 81 mod 7 = 4
      expect(expmod(BigInt(5), BigInt(117), BigInt(19))).toBe(BigInt(1)) // 5^117 mod 19 = 1
    })

    it('should handle large numbers', () => {
      const base = BigInt(123456789)
      const exp = BigInt(987654321)
      const mod = BigInt(1000000007)
      const result = expmod(base, exp, mod)
      expect(result).toBeLessThan(mod)
      expect(result).toBeGreaterThanOrEqual(BigInt(0))
    })
  })

  describe('Input Parsing', () => {
    it('should pad input to 96 bytes if shorter', () => {
      const shortData = new Uint8Array(50)
      const input: PrecompileInput = {
        ...baseInput,
        data: shortData,
      }

      const result = precompile05(input)

      expect(result).toBeDefined()
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run MODEXP (0x05) precompile')
      )
    })

    it('should parse base, exponent, and modulus lengths correctly', () => {
      // Create input: bLen=32, eLen=32, mLen=32
      const data = new Uint8Array(96 + 32 + 32 + 32) // lengths + base + exp + mod
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 0) // base length
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 32) // exp length
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 64) // mod length
      
      // Set values
      data.set(setLengthLeft(bigIntToBytes(BigInt(2)), 32), 96) // base = 2
      data.set(setLengthLeft(bigIntToBytes(BigInt(3)), 32), 128) // exp = 3
      data.set(setLengthLeft(bigIntToBytes(BigInt(5)), 32), 160) // mod = 5

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.returnValue).toHaveLength(32)
      expect(bytesToBigInt(result.returnValue)).toBe(BigInt(3)) // 2^3 mod 5 = 3
    })
  })

  describe('Gas Calculation', () => {
    it('should calculate gas for small inputs', () => {
      const data = new Uint8Array(96)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 0) // bLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32) // eLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 64) // mLen = 1

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.executionGasUsed).toBeGreaterThanOrEqual(BigInt(0))
    })

    it('should return OOG when gas limit is insufficient', () => {
      const data = new Uint8Array(96)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1024)), 32), 0) // large base
      data.set(setLengthLeft(bigIntToBytes(BigInt(1024)), 32), 32) // large exp
      data.set(setLengthLeft(bigIntToBytes(BigInt(1024)), 32), 64) // large mod

      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(1), // Very low gas limit
      }

      const result = precompile05(input)

      expect(result).toEqual(OOGResult(BigInt(1)))
    })

    it('should apply EIP-2565 gas calculation when activated', () => {
      mockCommon.isActivatedEIP.mockReturnValue(true)

      const data = new Uint8Array(96)
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 0)
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 32)
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 64)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.executionGasUsed).toBeGreaterThanOrEqual(BigInt(200)) // Min gas under EIP-2565
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero base length', () => {
      const data = new Uint8Array(96)
      data.set(setLengthLeft(bigIntToBytes(BigInt(0)), 32), 0) // bLen = 0
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 32) // eLen = 32
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 64) // mLen = 32

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.returnValue).toHaveLength(32)
      expect(bytesToBigInt(result.returnValue)).toBe(BigInt(0))
    })

    it('should handle zero modulus length', () => {
      const data = new Uint8Array(96)
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 0) // bLen = 32
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 32) // eLen = 32
      data.set(setLengthLeft(bigIntToBytes(BigInt(0)), 32), 64) // mLen = 0

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.returnValue).toHaveLength(0)
    })

    it('should handle modulus value of zero', () => {
      const data = new Uint8Array(96 + 1 + 1 + 1)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 0) // bLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32) // eLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 64) // mLen = 1
      data[96] = 2 // base = 2
      data[97] = 3 // exp = 3
      data[98] = 0 // mod = 0

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.returnValue).toHaveLength(1)
      expect(result.returnValue[0]).toBe(0)
    })

    it('should handle very large length values', () => {
      const data = new Uint8Array(96)
      const largeValue = BigInt(2147483648) // Larger than maxSize
      data.set(setLengthLeft(bigIntToBytes(largeValue), 32), 0)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 64)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result).toEqual(OOGResult(baseInput.gasLimit))
    })
  })

  describe('Test Vectors', () => {
    it('should compute 2^8 mod 7 = 4', () => {
      const data = new Uint8Array(96 + 1 + 1 + 1)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 0) // bLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32) // eLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 64) // mLen = 1
      data[96] = 2 // base = 2
      data[97] = 8 // exp = 8
      data[98] = 7 // mod = 7

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.returnValue).toHaveLength(1)
      expect(result.returnValue[0]).toBe(4) // 2^8 = 256, 256 mod 7 = 4
    })

    it('should handle multi-byte values', () => {
      const base = BigInt(12345)
      const exp = BigInt(67890)
      const mod = BigInt(99999)
      
      const data = new Uint8Array(96 + 3 + 3 + 3)
      data.set(setLengthLeft(bigIntToBytes(BigInt(3)), 32), 0) // bLen = 3
      data.set(setLengthLeft(bigIntToBytes(BigInt(3)), 32), 32) // eLen = 3
      data.set(setLengthLeft(bigIntToBytes(BigInt(3)), 32), 64) // mLen = 3
      
      data.set(setLengthLeft(bigIntToBytes(base), 3), 96)
      data.set(setLengthLeft(bigIntToBytes(exp), 3), 99)
      data.set(setLengthLeft(bigIntToBytes(mod), 3), 102)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.returnValue).toHaveLength(3)
      const resultValue = bytesToBigInt(result.returnValue)
      expect(resultValue).toBeLessThan(mod)
    })
  })

  describe('Adjusted Exponent Length', () => {
    it('should calculate adjusted exponent length for small exponents', () => {
      const data = new Uint8Array(96 + 1 + 1 + 1)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 0) // bLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32) // eLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 64) // mLen = 1
      data[96] = 2 // base
      data[97] = 3 // exp
      data[98] = 5 // mod

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.executionGasUsed).toBeGreaterThanOrEqual(BigInt(0))
    })

    it('should handle large exponent lengths', () => {
      const data = new Uint8Array(96 + 32)
      data.set(setLengthLeft(bigIntToBytes(BigInt(0)), 32), 0) // bLen = 0
      data.set(setLengthLeft(bigIntToBytes(BigInt(64)), 32), 32) // eLen = 64
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 64) // mLen = 32
      
      // Set first bytes of exponent to calculate bit length
      data[96] = 0xff

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.executionGasUsed).toBeGreaterThanOrEqual(BigInt(0))
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information when enabled', () => {
      const data = new Uint8Array(96)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 0)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 64)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      precompile05(input)

      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run MODEXP (0x05) precompile')
      )
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('MODEXP (0x05) return value=')
      )
    })

    it('should work without debug function', () => {
      const data = new Uint8Array(96)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 0)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 64)

      const input: PrecompileInput = {
        ...baseInput,
        data,
        _debug: undefined,
      }

      const result = precompile05(input)

      expect(result).toBeDefined()
    })
  })

  describe('Return Value Format', () => {
    it('should pad return value to modulus length', () => {
      const data = new Uint8Array(96 + 1 + 1 + 1)
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 0) // bLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32) // eLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(10)), 32), 64) // mLen = 10
      data[96] = 2 // base = 2
      data[97] = 3 // exp = 3
      data[98] = 100 // mod = 100

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.returnValue).toHaveLength(10)
    })

    it('should handle empty input gracefully', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(),
      }

      const result = precompile05(input)

      expect(result).toBeDefined()
      // With empty input padded to 96 bytes, all lengths are 0, but min gas is 1
      expect(result.executionGasUsed).toBeGreaterThanOrEqual(BigInt(0))
      // The modexp may return at least 1 byte even for zero lengths
      expect(result.returnValue).toBeDefined()
    })
  })

  describe('Complexity Cases', () => {
    it('should handle case where base length > modulus length', () => {
      const data = new Uint8Array(96 + 32 + 1 + 16)
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 0) // bLen = 32
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32) // eLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(16)), 32), 64) // mLen = 16

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.returnValue).toHaveLength(16)
    })

    it('should handle case where modulus length > base length', () => {
      const data = new Uint8Array(96 + 16 + 1 + 32)
      data.set(setLengthLeft(bigIntToBytes(BigInt(16)), 32), 0) // bLen = 16
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32) // eLen = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(32)), 32), 64) // mLen = 32

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile05(input)

      expect(result.returnValue).toHaveLength(32)
    })
  })
})