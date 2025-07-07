import { bytesToHex, hexToBytes, utf8ToBytes } from '@ethereumjs/util'
import { sha256 } from 'ethereum-cryptography/sha256.js'
import { precompile02 } from '../../../../../src/evm_v2/precompiles/02-sha256'
import { OOGResult } from '../../../../../src/evm_v2/evm'
import type { PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { Common } from '@ethereumjs/common'

describe('SHA256 (0x02) Precompile', () => {
  let mockCommon: jest.Mocked<Common>
  let mockDebug: jest.Mock
  let baseInput: PrecompileInput

  beforeEach(() => {
    mockCommon = {
      param: jest.fn((topic, param) => {
        if (param === 'sha256') return BigInt(60)
        if (param === 'sha256Word') return BigInt(12)
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

      const result = precompile02(input)

      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'sha256')
      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'sha256Word')
      expect(result.executionGasUsed).toBe(BigInt(60)) // base cost only for empty input
    })

    it('should calculate gas for single word (32 bytes)', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(32),
      }

      const result = precompile02(input)

      expect(result.executionGasUsed).toBe(BigInt(72)) // 60 + 12*1
    })

    it('should calculate gas for partial word (31 bytes)', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(31),
      }

      const result = precompile02(input)

      expect(result.executionGasUsed).toBe(BigInt(72)) // 60 + 12*1 (rounds up)
    })

    it('should calculate gas for multiple words', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(65), // 3 words (rounds up from 2.03)
      }

      const result = precompile02(input)

      expect(result.executionGasUsed).toBe(BigInt(96)) // 60 + 12*3
    })

    it('should return OOG when gas limit is insufficient', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(32),
        gasLimit: BigInt(71), // 1 less than required
      }

      const result = precompile02(input)

      expect(result).toEqual(OOGResult(BigInt(71)))
      expect(mockDebug).toHaveBeenCalledWith('KECCAK256 (0x02) failed: OOG')
    })

    it('should handle exact gas limit', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(32),
        gasLimit: BigInt(72), // exactly required
      }

      const result = precompile02(input)

      expect(result.executionGasUsed).toBe(BigInt(72))
      expect(result.returnValue).toHaveLength(32)
    })
  })

  describe('Hash Computation', () => {
    it('should correctly hash empty input', () => {
      const data = new Uint8Array()
      const expectedHash = sha256(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(result.returnValue).toEqual(expectedHash)
      expect(bytesToHex(result.returnValue)).toBe(bytesToHex(expectedHash))
    })

    it('should correctly hash single byte', () => {
      const data = new Uint8Array([0x00])
      const expectedHash = sha256(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(result.returnValue).toEqual(expectedHash)
    })

    it('should correctly hash known test vector', () => {
      // Test vector: "abc"
      const data = utf8ToBytes('abc')
      const expectedHash = hexToBytes('0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(bytesToHex(result.returnValue)).toBe(bytesToHex(expectedHash))
    })

    it('should correctly hash longer test vector', () => {
      // Test vector: "The quick brown fox jumps over the lazy dog"
      const data = utf8ToBytes('The quick brown fox jumps over the lazy dog')
      const expectedHash = hexToBytes('0xd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592')

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(bytesToHex(result.returnValue)).toBe(bytesToHex(expectedHash))
    })

    it('should handle binary data', () => {
      const data = new Uint8Array([0xff, 0x00, 0xaa, 0x55, 0x12, 0x34, 0x56, 0x78])
      const expectedHash = sha256(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(result.returnValue).toEqual(expectedHash)
    })

    it('should handle 32-byte input', () => {
      const data = new Uint8Array(32).fill(0x42)
      const expectedHash = sha256(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(result.returnValue).toEqual(expectedHash)
      expect(result.returnValue).toHaveLength(32)
    })

    it('should handle large input', () => {
      const data = new Uint8Array(1000).fill(0x55)
      const expectedHash = sha256(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(10000),
      }

      const result = precompile02(input)

      expect(result.returnValue).toEqual(expectedHash)
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information when enabled', () => {
      const data = utf8ToBytes('test')
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run KECCAK256 (0x02) precompile')
      )
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('KECCAK256 (0x02) return hash=')
      )
      // Note: The debug messages incorrectly say KECCAK256 instead of SHA256
    })

    it('should work without debug function', () => {
      const data = utf8ToBytes('test')
      const input: PrecompileInput = {
        ...baseInput,
        data,
        _debug: undefined,
      }

      const result = precompile02(input)

      expect(result).toBeDefined()
      expect(result.returnValue).toHaveLength(32)
    })
  })

  describe('Edge Cases', () => {
    it('should handle maximum safe input size', () => {
      // Test with a reasonably large input that won't cause memory issues
      const data = new Uint8Array(10000)
      const expectedHash = sha256(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(100000),
      }

      const result = precompile02(input)

      expect(result.returnValue).toEqual(expectedHash)
    })

    it('should handle all zero bytes', () => {
      const data = new Uint8Array(100)
      const expectedHash = sha256(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(result.returnValue).toEqual(expectedHash)
    })

    it('should handle all 0xFF bytes', () => {
      const data = new Uint8Array(100).fill(0xff)
      const expectedHash = sha256(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(result.returnValue).toEqual(expectedHash)
    })

    it('should handle alternating bytes pattern', () => {
      const data = new Uint8Array(64)
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 2 === 0 ? 0x00 : 0xff
      }
      const expectedHash = sha256(data)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile02(input)

      expect(result.returnValue).toEqual(expectedHash)
    })
  })

  describe('Gas Price Configuration', () => {
    it('should use custom gas prices from common', () => {
      mockCommon.param.mockImplementation((topic, param) => {
        if (param === 'sha256') return BigInt(100)
        if (param === 'sha256Word') return BigInt(20)
        return BigInt(0)
      })

      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(64), // 2 words
      }

      const result = precompile02(input)

      expect(result.executionGasUsed).toBe(BigInt(140)) // 100 + 20*2
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

      const result1 = precompile02(input1)
      const result2 = precompile02(input2)

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

      const result1 = precompile02(input1)
      const result2 = precompile02(input2)

      expect(bytesToHex(result1.returnValue)).not.toBe(bytesToHex(result2.returnValue))
    })
  })
})