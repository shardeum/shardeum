import { bytesToHex, hexToBytes, utf8ToBytes, setLengthLeft } from '@ethereumjs/util'
import { ripemd160 } from 'ethereum-cryptography/ripemd160.js'
import { precompile03 } from '../../../../../src/evm_v2/precompiles/03-ripemd160'
import { OOGResult } from '../../../../../src/evm_v2/evm'
import type { PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { Common } from '@ethereumjs/common'

describe('RIPEMD160 (0x03) Precompile', () => {
  let mockCommon: jest.Mocked<Common>
  let mockDebug: jest.Mock
  let baseInput: PrecompileInput

  beforeEach(() => {
    mockCommon = {
      param: jest.fn((topic, param) => {
        if (param === 'ripemd160') return BigInt(600)
        if (param === 'ripemd160Word') return BigInt(120)
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
  })

  describe('Gas Calculation', () => {
    it('should calculate gas for empty input', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(),
      }

      const result = precompile03(input)

      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'ripemd160')
      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'ripemd160Word')
      expect(result.executionGasUsed).toBe(BigInt(600)) // base cost only for empty input
    })

    it('should calculate gas for single word (32 bytes)', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(32),
      }

      const result = precompile03(input)

      expect(result.executionGasUsed).toBe(BigInt(720)) // 600 + 120*1
    })

    it('should calculate gas for partial word (31 bytes)', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(31),
      }

      const result = precompile03(input)

      expect(result.executionGasUsed).toBe(BigInt(720)) // 600 + 120*1 (rounds up)
    })

    it('should calculate gas for multiple words', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(65), // 3 words (rounds up from 2.03)
      }

      const result = precompile03(input)

      expect(result.executionGasUsed).toBe(BigInt(960)) // 600 + 120*3
    })

    it('should return OOG when gas limit is insufficient', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(32),
        gasLimit: BigInt(719), // 1 less than required
      }

      const result = precompile03(input)

      expect(result).toEqual(OOGResult(BigInt(719)))
      expect(mockDebug).toHaveBeenCalledWith('RIPEMD160 (0x03) failed: OOG')
    })

    it('should handle exact gas limit', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(32),
        gasLimit: BigInt(720), // exactly required
      }

      const result = precompile03(input)

      expect(result.executionGasUsed).toBe(BigInt(720))
      expect(result.returnValue).toHaveLength(32)
    })
  })

  describe('Hash Computation', () => {
    it('should correctly hash empty input', () => {
      const data = new Uint8Array()
      const expectedHash = setLengthLeft(ripemd160(data), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(result.returnValue).toEqual(expectedHash)
      expect(result.returnValue).toHaveLength(32) // Should be padded to 32 bytes
      expect(bytesToHex(result.returnValue)).toBe(bytesToHex(expectedHash))
    })

    it('should correctly hash single byte', () => {
      const data = new Uint8Array([0x00])
      const expectedHash = setLengthLeft(ripemd160(data), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(result.returnValue).toEqual(expectedHash)
      expect(result.returnValue).toHaveLength(32)
    })

    it('should correctly hash known test vector', () => {
      // Test vector: "abc"
      const data = utf8ToBytes('abc')
      // RIPEMD-160 of "abc" = 8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
      const expectedRipemd = hexToBytes('0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc')
      const expectedHash = setLengthLeft(expectedRipemd, 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(bytesToHex(result.returnValue)).toBe(bytesToHex(expectedHash))
      // Check that first 12 bytes are zeros (padding)
      expect(result.returnValue.subarray(0, 12).every(b => b === 0)).toBe(true)
    })

    it('should correctly hash longer test vector', () => {
      // Test vector: "The quick brown fox jumps over the lazy dog"
      const data = utf8ToBytes('The quick brown fox jumps over the lazy dog')
      // RIPEMD-160 = 37f332f68db77bd9d7edd4969571ad671cf9dd3b
      const expectedRipemd = hexToBytes('0x37f332f68db77bd9d7edd4969571ad671cf9dd3b')
      const expectedHash = setLengthLeft(expectedRipemd, 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(bytesToHex(result.returnValue)).toBe(bytesToHex(expectedHash))
    })

    it('should handle binary data', () => {
      const data = new Uint8Array([0xff, 0x00, 0xaa, 0x55, 0x12, 0x34, 0x56, 0x78])
      const expectedHash = setLengthLeft(ripemd160(data), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(result.returnValue).toEqual(expectedHash)
      expect(result.returnValue).toHaveLength(32)
    })

    it('should handle 32-byte input', () => {
      const data = new Uint8Array(32).fill(0x42)
      const expectedHash = setLengthLeft(ripemd160(data), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(result.returnValue).toEqual(expectedHash)
      expect(result.returnValue).toHaveLength(32)
    })

    it('should handle large input', () => {
      const data = new Uint8Array(1000).fill(0x55)
      const expectedHash = setLengthLeft(ripemd160(data), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(10000),
      }

      const result = precompile03(input)

      expect(result.returnValue).toEqual(expectedHash)
      expect(result.returnValue).toHaveLength(32)
    })
  })

  describe('Output Format', () => {
    it('should always return 32 bytes with left padding', () => {
      const testCases = [
        new Uint8Array(),
        new Uint8Array([1]),
        new Uint8Array(100),
      ]

      for (const data of testCases) {
        const input: PrecompileInput = {
          ...baseInput,
          data,
        }

        const result = precompile03(input)

        expect(result.returnValue).toHaveLength(32)
        // RIPEMD-160 produces 20 bytes, so first 12 should be zeros
        expect(result.returnValue.subarray(0, 12).every(b => b === 0)).toBe(true)
      }
    })

    it('should place hash in the last 20 bytes', () => {
      const data = utf8ToBytes('test')
      const rawHash = ripemd160(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      // The actual hash should be in bytes 12-31
      expect(result.returnValue.subarray(12)).toEqual(rawHash)
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information when enabled', () => {
      const data = utf8ToBytes('test')
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run RIPEMD160 (0x03) precompile')
      )
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('RIPEMD160 (0x03) return hash=')
      )
    })

    it('should work without debug function', () => {
      const data = utf8ToBytes('test')
      const input: PrecompileInput = {
        ...baseInput,
        data,
        _debug: undefined,
      }

      const result = precompile03(input)

      expect(result).toBeDefined()
      expect(result.returnValue).toHaveLength(32)
    })
  })

  describe('Edge Cases', () => {
    it('should handle maximum safe input size', () => {
      // Test with a reasonably large input that won't cause memory issues
      const data = new Uint8Array(10000)
      const expectedHash = setLengthLeft(ripemd160(data), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(100000),
      }

      const result = precompile03(input)

      expect(result.returnValue).toEqual(expectedHash)
    })

    it('should handle all zero bytes', () => {
      const data = new Uint8Array(100)
      const expectedHash = setLengthLeft(ripemd160(data), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(result.returnValue).toEqual(expectedHash)
    })

    it('should handle all 0xFF bytes', () => {
      const data = new Uint8Array(100).fill(0xff)
      const expectedHash = setLengthLeft(ripemd160(data), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(result.returnValue).toEqual(expectedHash)
    })

    it('should handle alternating bytes pattern', () => {
      const data = new Uint8Array(64)
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 2 === 0 ? 0x00 : 0xff
      }
      const expectedHash = setLengthLeft(ripemd160(data), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile03(input)

      expect(result.returnValue).toEqual(expectedHash)
    })
  })

  describe('Gas Price Configuration', () => {
    it('should use custom gas prices from common', () => {
      mockCommon.param.mockImplementation((topic, param) => {
        if (param === 'ripemd160') return BigInt(1000)
        if (param === 'ripemd160Word') return BigInt(200)
        return BigInt(0)
      })

      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(64), // 2 words
      }

      const result = precompile03(input)

      expect(result.executionGasUsed).toBe(BigInt(1400)) // 1000 + 200*2
    })
  })

  describe('Return Value Consistency', () => {
    it('should return the same hash for the same input', () => {
      const data = utf8ToBytes('consistency test')
      
      const input1: PrecompileInput = {
        ...baseInput,
        data,
      }

      const input2: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(data), // Create a copy
      }

      const result1 = precompile03(input1)
      const result2 = precompile03(input2)

      expect(bytesToHex(result1.returnValue)).toBe(bytesToHex(result2.returnValue))
    })

    it('should return different hashes for different inputs', () => {
      const input1: PrecompileInput = {
        ...baseInput,
        data: utf8ToBytes('input1'),
      }

      const input2: PrecompileInput = {
        ...baseInput,
        data: utf8ToBytes('input2'),
      }

      const result1 = precompile03(input1)
      const result2 = precompile03(input2)

      expect(bytesToHex(result1.returnValue)).not.toBe(bytesToHex(result2.returnValue))
    })
  })
})