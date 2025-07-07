import { bytesToHex, hexToBytes, concatBytes, bigIntToBytes, setLengthLeft } from '@ethereumjs/util'
import { precompile07 } from '../../../../../src/evm_v2/precompiles/07-ecmul'
import { OOGResult } from '../../../../../src/evm_v2/evm'
import type { PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { Common } from '@ethereumjs/common'

// Mock the rustbn-wasm module
jest.mock('rustbn-wasm', () => ({
  ec_mul: jest.fn()
}))

import { ec_mul } from 'rustbn-wasm'

describe('ECMUL (0x07) Precompile', () => {
  let mockCommon: jest.Mocked<Common>
  let mockDebug: jest.Mock
  let baseInput: PrecompileInput
  let mockEcMul = ec_mul as jest.MockedFunction<typeof ec_mul>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockCommon = {
      param: jest.fn((topic, param) => {
        if (param === 'ecMul') return BigInt(6000)
        return BigInt(0)
      }),
    } as any

    mockDebug = jest.fn()

    baseInput = {
      data: new Uint8Array(),
      gasLimit: BigInt(10000),
      common: mockCommon,
      _EVM: {} as any,
      _debug: mockDebug,
    }

    // Default mock - return valid 64-byte result
    mockEcMul.mockReturnValue('0'.repeat(128))
  })

  describe('Gas Usage', () => {
    it('should return OOG when gas limit is less than required', () => {
      const input: PrecompileInput = {
        ...baseInput,
        gasLimit: BigInt(5999),
      }

      const result = precompile07(input)

      expect(result).toEqual(OOGResult(BigInt(5999)))
      expect(mockDebug).toHaveBeenCalledWith('ECMUL (0x07) failed: OOG')
      expect(mockEcMul).not.toHaveBeenCalled()
    })

    it('should consume correct amount of gas on successful execution', () => {
      const data = new Uint8Array(128)
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.executionGasUsed).toBe(BigInt(6000))
    })

    it('should use gas price from common configuration', () => {
      mockCommon.param.mockReturnValue(BigInt(8000))

      const input: PrecompileInput = {
        ...baseInput,
        gasLimit: BigInt(9000),
      }

      const result = precompile07(input)

      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'ecMul')
      expect(result.executionGasUsed).toBe(BigInt(8000))
    })
  })

  describe('Input Handling', () => {
    it('should handle empty input', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(),
      }

      precompile07(input)

      // Should pass empty string to ec_mul
      expect(mockEcMul).toHaveBeenCalledWith('')
    })

    it('should use only first 128 bytes of input', () => {
      const data = new Uint8Array(200)
      // Fill with test pattern
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 256
      }

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      precompile07(input)

      // Should only pass first 128 bytes as hex
      const expectedHex = bytesToHex(data.subarray(0, 128)).slice(2) // remove 0x prefix
      expect(mockEcMul).toHaveBeenCalledWith(expectedHex)
    })

    it('should handle input less than 128 bytes', () => {
      const data = new Uint8Array(96)
      data.fill(0xff)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      precompile07(input)

      const expectedHex = bytesToHex(data).slice(2)
      expect(mockEcMul).toHaveBeenCalledWith(expectedHex)
    })
  })

  describe('EC Point Multiplication', () => {
    it('should handle multiplication by zero (returns point at infinity)', () => {
      // Point (1, 2) * 0 = Infinity
      const px = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
      const py = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')
      const scalar = new Uint8Array(32) // 0

      const data = concatBytes(px, py, scalar)

      mockEcMul.mockReturnValue('0'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toHaveLength(64)
      expect(result.returnValue.every(b => b === 0)).toBe(true)
    })

    it('should handle multiplication by one (returns same point)', () => {
      // Point * 1 = Point
      const px = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
      const py = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')
      const scalar = setLengthLeft(bigIntToBytes(BigInt(1)), 32)

      const data = concatBytes(px, py, scalar)

      mockEcMul.mockReturnValue(bytesToHex(concatBytes(px, py)).slice(2))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toEqual(concatBytes(px, py))
    })

    it('should handle multiplication by two (point doubling)', () => {
      // Point * 2 = Point + Point
      const px = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
      const py = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')
      const scalar = setLengthLeft(bigIntToBytes(BigInt(2)), 32)

      const data = concatBytes(px, py, scalar)

      // Expected result of doubling point (1, 2)
      const resultX = '030644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd3'
      const resultY = '15ed738c0e0a7c92e7845f96b2ae9c0a68a6a449e3538fc7ff3ebf7a5a18a2c4'
      mockEcMul.mockReturnValue(resultX + resultY)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toHaveLength(64)
      expect(bytesToHex(result.returnValue)).toBe('0x' + resultX + resultY)
    })

    it('should handle multiplication of infinity', () => {
      // Infinity * scalar = Infinity
      const infinity = new Uint8Array(64) // zeros for x and y
      const scalar = setLengthLeft(bigIntToBytes(BigInt(12345)), 32)

      const data = concatBytes(infinity, scalar)

      mockEcMul.mockReturnValue('0'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toHaveLength(64)
      expect(result.returnValue.every(b => b === 0)).toBe(true)
    })

    it('should handle large scalar values', () => {
      const px = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
      const py = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')
      // Large scalar value
      const scalar = hexToBytes('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

      const data = concatBytes(px, py, scalar)

      mockEcMul.mockReturnValue('a'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toHaveLength(64)
    })
  })

  describe('Error Handling', () => {
    it('should return OOG when ec_mul returns invalid length (not 64 bytes)', () => {
      const data = new Uint8Array(128)
      
      // Mock ec_mul to return invalid length
      mockEcMul.mockReturnValue('invalid')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result).toEqual(OOGResult(baseInput.gasLimit))
      expect(mockDebug).toHaveBeenCalledWith('ECMUL (0x07) failed: OOG')
    })

    it('should handle ec_mul throwing an error', () => {
      const data = new Uint8Array(128)
      
      mockEcMul.mockImplementation(() => {
        throw new Error('Invalid point')
      })

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      expect(() => precompile07(input)).toThrow('Invalid point')
    })

    it('should return OOG for empty ec_mul return', () => {
      const data = new Uint8Array(128)
      
      mockEcMul.mockReturnValue('')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result).toEqual(OOGResult(baseInput.gasLimit))
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information when enabled', () => {
      const data = new Uint8Array(128)
      mockEcMul.mockReturnValue('b'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run ECMUL (0x07) precompile')
      )
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('ECMUL (0x07) return value=')
      )
    })

    it('should work without debug function', () => {
      const data = new Uint8Array(128)
      
      const input: PrecompileInput = {
        ...baseInput,
        data,
        _debug: undefined,
      }

      const result = precompile07(input)

      expect(result).toBeDefined()
      expect(result.returnValue).toHaveLength(64)
    })
  })

  describe('Edge Cases', () => {
    it('should handle maximum input size', () => {
      const data = new Uint8Array(1000)
      
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      precompile07(input)

      // Should still only use first 128 bytes
      const expectedHex = bytesToHex(data.subarray(0, 128)).slice(2)
      expect(mockEcMul).toHaveBeenCalledWith(expectedHex)
    })

    it('should handle all 0xFF input', () => {
      const data = new Uint8Array(128).fill(0xff)
      
      mockEcMul.mockReturnValue('c'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toHaveLength(64)
    })

    it('should handle alternating byte pattern', () => {
      const data = new Uint8Array(128)
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 2 === 0 ? 0x00 : 0xff
      }
      
      mockEcMul.mockReturnValue('d'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toHaveLength(64)
    })

    it('should handle point and scalar both set but not on curve', () => {
      // Random values that likely aren't valid curve points
      const data = new Uint8Array(96)
      for (let i = 0; i < data.length; i++) {
        data[i] = (i * 17) % 256
      }

      mockEcMul.mockReturnValue('e'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toHaveLength(64)
    })
  })

  describe('Return Value', () => {
    it('should return exactly 64 bytes on success', () => {
      const data = new Uint8Array(128)
      
      mockEcMul.mockReturnValue('f'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toHaveLength(64)
    })

    it('should correctly convert hex result to bytes', () => {
      const data = new Uint8Array(128)
      
      const hexResult = '1234567890abcdef' + '0'.repeat(112)
      mockEcMul.mockReturnValue(hexResult)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(bytesToHex(result.returnValue)).toBe('0x' + hexResult)
    })

    it('should handle scalar beyond 32 bytes correctly', () => {
      // Input with 64 bytes for point, and extra data that should be ignored
      const px = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
      const py = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')
      const scalar = setLengthLeft(bigIntToBytes(BigInt(100)), 32)
      const extraData = new Uint8Array(32).fill(0xaa) // Should be ignored

      const data = concatBytes(px, py, scalar, extraData)

      mockEcMul.mockReturnValue('9'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile07(input)

      expect(result.returnValue).toHaveLength(64)
      // Verify only first 128 bytes were used
      const expectedHex = bytesToHex(data.subarray(0, 128)).slice(2)
      expect(mockEcMul).toHaveBeenCalledWith(expectedHex)
    })
  })
})