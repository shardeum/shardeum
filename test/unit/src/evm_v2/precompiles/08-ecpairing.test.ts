import { bytesToHex, hexToBytes, concatBytes, setLengthLeft } from '@ethereumjs/util'
import { precompile08 } from '../../../../../src/evm_v2/precompiles/08-ecpairing'
import { OOGResult } from '../../../../../src/evm_v2/evm'
import type { PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { Common } from '@ethereumjs/common'

// Mock the rustbn-wasm module
jest.mock('rustbn-wasm', () => ({
  ec_pairing: jest.fn()
}))

import { ec_pairing } from 'rustbn-wasm'

describe('ECPAIRING (0x08) Precompile', () => {
  let mockCommon: jest.Mocked<Common>
  let mockDebug: jest.Mock
  let baseInput: PrecompileInput
  let mockEcPairing = ec_pairing as jest.MockedFunction<typeof ec_pairing>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockCommon = {
      param: jest.fn((topic, param) => {
        if (param === 'ecPairing') return BigInt(45000)
        if (param === 'ecPairingWord') return BigInt(34000)
        return BigInt(0)
      }),
    } as any

    mockDebug = jest.fn()

    baseInput = {
      data: new Uint8Array(),
      gasLimit: BigInt(1000000),
      common: mockCommon,
      _EVM: {} as any,
      _debug: mockDebug,
    }

    // Default mock - return valid 32-byte result (success = 1)
    mockEcPairing.mockReturnValue('0'.repeat(62) + '01')
  })

  describe('Gas Calculation', () => {
    it('should calculate gas for empty input', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(),
      }

      const result = precompile08(input)

      expect(result.executionGasUsed).toBe(BigInt(45000)) // base cost only
    })

    it('should calculate gas for one pair (192 bytes)', () => {
      const data = new Uint8Array(192)
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result.executionGasUsed).toBe(BigInt(79000)) // 45000 + 34000*1
    })

    it('should calculate gas for two pairs (384 bytes)', () => {
      const data = new Uint8Array(384)
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result.executionGasUsed).toBe(BigInt(113000)) // 45000 + 34000*2
    })

    it('should ignore incomplete pairs in gas calculation', () => {
      // 300 bytes = 1 full pair (192) + 108 extra bytes (ignored)
      const data = new Uint8Array(300)
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result.executionGasUsed).toBe(BigInt(79000)) // 45000 + 34000*1
    })

    it('should return OOG when gas limit is insufficient', () => {
      const data = new Uint8Array(192)
      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(78999), // 1 less than required
      }

      const result = precompile08(input)

      expect(result).toEqual(OOGResult(BigInt(78999)))
      expect(mockDebug).toHaveBeenCalledWith('ECPAIRING (0x08) failed: OOG')
      expect(mockEcPairing).not.toHaveBeenCalled()
    })
  })

  describe('Pairing Check', () => {
    it('should handle empty input (trivial true)', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(),
      }

      precompile08(input)

      expect(mockEcPairing).toHaveBeenCalledWith('')
    })

    it('should pass full input data to ec_pairing', () => {
      const data = new Uint8Array(384)
      // Fill with test pattern
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 256
      }

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      precompile08(input)

      const expectedHex = bytesToHex(data).slice(2)
      expect(mockEcPairing).toHaveBeenCalledWith(expectedHex)
    })

    it('should return success (1) for valid pairing', () => {
      const data = new Uint8Array(192)
      
      // Return 32 bytes with last byte = 1 (success)
      mockEcPairing.mockReturnValue('0'.repeat(62) + '01')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result.returnValue).toHaveLength(32)
      expect(result.returnValue[31]).toBe(1)
    })

    it('should return failure (0) for invalid pairing', () => {
      const data = new Uint8Array(192)
      
      // Return 32 bytes of zeros (failure)
      mockEcPairing.mockReturnValue('0'.repeat(64))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result.returnValue).toHaveLength(32)
      expect(result.returnValue.every(b => b === 0)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should return OOG when ec_pairing returns invalid length', () => {
      const data = new Uint8Array(192)
      
      // Mock ec_pairing to return invalid length
      mockEcPairing.mockReturnValue('invalid')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result).toEqual(OOGResult(baseInput.gasLimit))
      expect(mockDebug).toHaveBeenCalledWith('ECPAIRING (0x08) failed: OOG')
    })

    it('should handle ec_pairing throwing an error', () => {
      const data = new Uint8Array(192)
      
      mockEcPairing.mockImplementation(() => {
        throw new Error('Invalid pairing')
      })

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      expect(() => precompile08(input)).toThrow('Invalid pairing')
    })

    it('should handle non-divisible by 192 input gracefully', () => {
      // 100 bytes is not divisible by 192
      const data = new Uint8Array(100)
      
      // ec_pairing should fail, but we'll mock a response
      mockEcPairing.mockReturnValue('0'.repeat(64))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      // Gas should be calculated for 0 pairs
      expect(result.executionGasUsed).toBe(BigInt(45000))
    })
  })

  describe('Multiple Pairs', () => {
    it('should handle 3 pairs correctly', () => {
      const data = new Uint8Array(576) // 192 * 3
      
      mockEcPairing.mockReturnValue('0'.repeat(62) + '01')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result.executionGasUsed).toBe(BigInt(147000)) // 45000 + 34000*3
      expect(result.returnValue).toHaveLength(32)
    })

    it('should handle maximum safe number of pairs', () => {
      // Test with 10 pairs
      const data = new Uint8Array(1920) // 192 * 10
      
      mockEcPairing.mockReturnValue('0'.repeat(64))

      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(500000),
      }

      const result = precompile08(input)

      expect(result.executionGasUsed).toBe(BigInt(385000)) // 45000 + 34000*10
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information when enabled', () => {
      const data = new Uint8Array(192)
      
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run ECPAIRING (0x08) precompile')
      )
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('ECPAIRING (0x08) return value=')
      )
    })

    it('should work without debug function', () => {
      const data = new Uint8Array(192)
      
      const input: PrecompileInput = {
        ...baseInput,
        data,
        _debug: undefined,
      }

      const result = precompile08(input)

      expect(result).toBeDefined()
      expect(result.returnValue).toHaveLength(32)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large input', () => {
      const data = new Uint8Array(19200) // 100 pairs
      
      mockEcPairing.mockReturnValue('0'.repeat(64))

      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(5000000),
      }

      const result = precompile08(input)

      expect(result.executionGasUsed).toBe(BigInt(3445000)) // 45000 + 34000*100
    })

    it('should handle all zeros input', () => {
      const data = new Uint8Array(384) // 2 pairs of zeros
      
      mockEcPairing.mockReturnValue('0'.repeat(62) + '01')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result.returnValue).toHaveLength(32)
    })

    it('should handle alternating byte pattern', () => {
      const data = new Uint8Array(192)
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 2 === 0 ? 0x00 : 0xff
      }
      
      mockEcPairing.mockReturnValue('0'.repeat(64))

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result.returnValue).toHaveLength(32)
    })
  })

  describe('Return Value', () => {
    it('should always return exactly 32 bytes on success', () => {
      const testCases = [
        new Uint8Array(0),
        new Uint8Array(192),
        new Uint8Array(384),
        new Uint8Array(576),
      ]

      for (const data of testCases) {
        mockEcPairing.mockReturnValue('0'.repeat(64))

        const input: PrecompileInput = {
          ...baseInput,
          data,
        }

        const result = precompile08(input)

        expect(result.returnValue).toHaveLength(32)
      }
    })

    it('should correctly convert hex result to bytes', () => {
      const data = new Uint8Array(192)
      
      const hexResult = '1234567890abcdef' + '0'.repeat(48)
      mockEcPairing.mockReturnValue(hexResult)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(bytesToHex(result.returnValue)).toBe('0x' + hexResult)
    })
  })

  describe('Gas Price Configuration', () => {
    it('should use custom gas prices from common', () => {
      mockCommon.param.mockImplementation((topic, param) => {
        if (param === 'ecPairing') return BigInt(100000)
        if (param === 'ecPairingWord') return BigInt(50000)
        return BigInt(0)
      })

      const data = new Uint8Array(384) // 2 pairs
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile08(input)

      expect(result.executionGasUsed).toBe(BigInt(200000)) // 100000 + 50000*2
    })
  })
})