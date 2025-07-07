import { bytesToHex, hexToBytes, concatBytes, zeros } from '@ethereumjs/util'
import { precompile06 } from '../../../../../src/evm_v2/precompiles/06-ecadd'
import { OOGResult } from '../../../../../src/evm_v2/evm'
import type { PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { Common } from '@ethereumjs/common'

// Mock the rustbn-wasm module
jest.mock('rustbn-wasm', () => ({
  ec_add: jest.fn()
}))

import { ec_add } from 'rustbn-wasm'

describe('ECADD (0x06) Precompile', () => {
  let mockCommon: jest.Mocked<Common>
  let mockDebug: jest.Mock
  let baseInput: PrecompileInput
  let mockEcAdd = ec_add as jest.MockedFunction<typeof ec_add>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockCommon = {
      param: jest.fn((topic, param) => {
        if (param === 'ecAdd') return BigInt(150)
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
    mockEcAdd.mockReturnValue('0'.repeat(128))
  })

  describe('Gas Usage', () => {
    it('should return OOG when gas limit is less than required', () => {
      const input: PrecompileInput = {
        ...baseInput,
        gasLimit: BigInt(149),
      }

      const result = precompile06(input)

      expect(result).toEqual(OOGResult(BigInt(149)))
      expect(mockDebug).toHaveBeenCalledWith('ECADD (0x06) failed: OOG')
      expect(mockEcAdd).not.toHaveBeenCalled()
    })

    it('should consume correct amount of gas on successful execution', () => {
      const data = new Uint8Array(128)
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(result.executionGasUsed).toBe(BigInt(150))
    })

    it('should use gas price from common configuration', () => {
      mockCommon.param.mockReturnValue(BigInt(500))

      const input: PrecompileInput = {
        ...baseInput,
        gasLimit: BigInt(600),
      }

      const result = precompile06(input)

      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'ecAdd')
      expect(result.executionGasUsed).toBe(BigInt(500))
    })
  })

  describe('Input Handling', () => {
    it('should handle empty input', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(),
      }

      precompile06(input)

      // Should pass empty string to ec_add
      expect(mockEcAdd).toHaveBeenCalledWith('')
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

      precompile06(input)

      // Should only pass first 128 bytes as hex
      const expectedHex = bytesToHex(data.subarray(0, 128)).slice(2) // remove 0x prefix
      expect(mockEcAdd).toHaveBeenCalledWith(expectedHex)
    })

    it('should pad input less than 128 bytes', () => {
      const data = new Uint8Array(64)
      data.fill(0xff)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      precompile06(input)

      const expectedHex = bytesToHex(data).slice(2) // 64 bytes of ff
      expect(mockEcAdd).toHaveBeenCalledWith(expectedHex)
    })
  })

  describe('EC Point Addition', () => {
    it('should handle valid point addition', () => {
      // Test with known valid points on alt_bn128 curve
      // Point 1: (1, 2)
      // Point 2: (1, 2)  
      // Result should be their sum
      const p1x = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
      const p1y = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')
      const p2x = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
      const p2y = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')

      const data = concatBytes(p1x, p1y, p2x, p2y)

      const resultX = '030644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd3'
      const resultY = '15ed738c0e0a7c92e7845f96b2ae9c0a68a6a449e3538fc7ff3ebf7a5a18a2c4'
      mockEcAdd.mockReturnValue(resultX + resultY)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(result.returnValue).toHaveLength(64)
      expect(bytesToHex(result.returnValue)).toBe('0x' + resultX + resultY)
    })

    it('should handle point at infinity (zero point)', () => {
      const data = new Uint8Array(128) // All zeros

      mockEcAdd.mockReturnValue('0'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(result.returnValue).toHaveLength(64)
      expect(result.returnValue.every(b => b === 0)).toBe(true)
    })

    it('should handle adding point to infinity', () => {
      // Point + Infinity = Point
      const px = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
      const py = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')
      const infinity = new Uint8Array(64) // zeros

      const data = concatBytes(px, py, infinity)

      mockEcAdd.mockReturnValue(bytesToHex(concatBytes(px, py)).slice(2))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(result.returnValue).toEqual(concatBytes(px, py))
    })
  })

  describe('Error Handling', () => {
    it('should return OOG when ec_add returns invalid length (not 64 bytes)', () => {
      const data = new Uint8Array(128)
      
      // Mock ec_add to return invalid length
      mockEcAdd.mockReturnValue('invalid')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(result).toEqual(OOGResult(baseInput.gasLimit))
      expect(mockDebug).toHaveBeenCalledWith('ECADD (0x06) failed: OOG')
    })

    it('should handle ec_add throwing an error', () => {
      const data = new Uint8Array(128)
      
      mockEcAdd.mockImplementation(() => {
        throw new Error('Invalid point')
      })

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      expect(() => precompile06(input)).toThrow('Invalid point')
    })

    it('should return OOG for empty ec_add return', () => {
      const data = new Uint8Array(128)
      
      mockEcAdd.mockReturnValue('')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(result).toEqual(OOGResult(baseInput.gasLimit))
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information when enabled', () => {
      const data = new Uint8Array(128)
      mockEcAdd.mockReturnValue('a'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run ECADD (0x06) precompile')
      )
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('ECADD (0x06) return value=')
      )
    })

    it('should work without debug function', () => {
      const data = new Uint8Array(128)
      
      const input: PrecompileInput = {
        ...baseInput,
        data,
        _debug: undefined,
      }

      const result = precompile06(input)

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

      precompile06(input)

      // Should still only use first 128 bytes
      const expectedHex = bytesToHex(data.subarray(0, 128)).slice(2)
      expect(mockEcAdd).toHaveBeenCalledWith(expectedHex)
    })

    it('should handle all 0xFF input', () => {
      const data = new Uint8Array(128).fill(0xff)
      
      mockEcAdd.mockReturnValue('b'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(result.returnValue).toHaveLength(64)
    })

    it('should handle alternating byte pattern', () => {
      const data = new Uint8Array(128)
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 2 === 0 ? 0x00 : 0xff
      }
      
      mockEcAdd.mockReturnValue('c'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(result.returnValue).toHaveLength(64)
    })
  })

  describe('Return Value', () => {
    it('should return exactly 64 bytes on success', () => {
      const data = new Uint8Array(128)
      
      mockEcAdd.mockReturnValue('d'.repeat(128))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(result.returnValue).toHaveLength(64)
    })

    it('should correctly convert hex result to bytes', () => {
      const data = new Uint8Array(128)
      
      const hexResult = '1234567890abcdef' + '0'.repeat(112)
      mockEcAdd.mockReturnValue(hexResult)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile06(input)

      expect(bytesToHex(result.returnValue)).toBe('0x' + hexResult)
    })
  })
})