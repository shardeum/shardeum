import { bytesToHex, hexToBytes, utf8ToBytes } from '@ethereumjs/util'
import { precompile04 } from '../../../../../src/evm_v2/precompiles/04-identity'
import { OOGResult } from '../../../../../src/evm_v2/evm'
import type { PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { Common } from '@ethereumjs/common'

describe('IDENTITY (0x04) Precompile', () => {
  let mockCommon: jest.Mocked<Common>
  let mockDebug: jest.Mock
  let baseInput: PrecompileInput

  beforeEach(() => {
    mockCommon = {
      param: jest.fn((topic, param) => {
        if (param === 'identity') return BigInt(15)
        if (param === 'identityWord') return BigInt(3)
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

      const result = precompile04(input)

      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'identity')
      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'identityWord')
      expect(result.executionGasUsed).toBe(BigInt(15)) // base cost only for empty input
    })

    it('should calculate gas for single word (32 bytes)', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(32),
      }

      const result = precompile04(input)

      expect(result.executionGasUsed).toBe(BigInt(18)) // 15 + 3*1
    })

    it('should calculate gas for partial word (31 bytes)', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(31),
      }

      const result = precompile04(input)

      expect(result.executionGasUsed).toBe(BigInt(18)) // 15 + 3*1 (rounds up)
    })

    it('should calculate gas for multiple words', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(65), // 3 words (rounds up from 2.03)
      }

      const result = precompile04(input)

      expect(result.executionGasUsed).toBe(BigInt(24)) // 15 + 3*3
    })

    it('should return OOG when gas limit is insufficient', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(32),
        gasLimit: BigInt(17), // 1 less than required
      }

      const result = precompile04(input)

      expect(result).toEqual(OOGResult(BigInt(17)))
      expect(mockDebug).toHaveBeenCalledWith('IDENTITY (0x04) failed: OOG')
    })

    it('should handle exact gas limit', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(32),
        gasLimit: BigInt(18), // exactly required
      }

      const result = precompile04(input)

      expect(result.executionGasUsed).toBe(BigInt(18))
      expect(result.returnValue).toHaveLength(32)
    })
  })

  describe('Data Copying', () => {
    it('should return empty array for empty input', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(),
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(new Uint8Array())
      expect(result.returnValue).toHaveLength(0)
    })

    it('should return exact copy of input data', () => {
      const data = utf8ToBytes('Hello, World!')
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
      expect(bytesToHex(result.returnValue)).toBe(bytesToHex(data))
    })

    it('should return a new array instance (not the same reference)', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
      expect(result.returnValue).not.toBe(data) // Different reference
      
      // Verify it's a true copy by modifying the original
      data[0] = 99
      expect(result.returnValue[0]).toBe(1) // Should still be 1
    })

    it('should handle binary data', () => {
      const data = new Uint8Array([0xff, 0x00, 0xaa, 0x55, 0x12, 0x34, 0x56, 0x78])
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
    })

    it('should handle 32-byte input', () => {
      const data = new Uint8Array(32).fill(0x42)
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
      expect(result.returnValue).toHaveLength(32)
    })

    it('should handle large input', () => {
      const data = new Uint8Array(1000).fill(0x55)
      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(10000),
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
      expect(result.returnValue).toHaveLength(1000)
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information when enabled', () => {
      const data = utf8ToBytes('test')
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run IDENTITY (0x04) precompile')
      )
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('IDENTITY (0x04) return data=')
      )
    })

    it('should work without debug function', () => {
      const data = utf8ToBytes('test')
      const input: PrecompileInput = {
        ...baseInput,
        data,
        _debug: undefined,
      }

      const result = precompile04(input)

      expect(result).toBeDefined()
      expect(result.returnValue).toEqual(data)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single byte', () => {
      const data = new Uint8Array([0x00])
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
      expect(result.returnValue).toHaveLength(1)
    })

    it('should handle maximum safe input size', () => {
      // Test with a reasonably large input that won't cause memory issues
      const data = new Uint8Array(10000)
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 256
      }

      const input: PrecompileInput = {
        ...baseInput,
        data,
        gasLimit: BigInt(100000),
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
      expect(result.returnValue).toHaveLength(10000)
    })

    it('should handle all zero bytes', () => {
      const data = new Uint8Array(100)
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
      expect(result.returnValue.every(b => b === 0)).toBe(true)
    })

    it('should handle all 0xFF bytes', () => {
      const data = new Uint8Array(100).fill(0xff)
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
      expect(result.returnValue.every(b => b === 0xff)).toBe(true)
    })

    it('should handle alternating bytes pattern', () => {
      const data = new Uint8Array(64)
      for (let i = 0; i < data.length; i++) {
        data[i] = i % 2 === 0 ? 0x00 : 0xff
      }
      
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
      for (let i = 0; i < result.returnValue.length; i++) {
        expect(result.returnValue[i]).toBe(i % 2 === 0 ? 0x00 : 0xff)
      }
    })

    it('should handle hex data', () => {
      const data = hexToBytes('0x1234567890abcdef')
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(bytesToHex(result.returnValue)).toBe('0x1234567890abcdef')
    })
  })

  describe('Gas Price Configuration', () => {
    it('should use custom gas prices from common', () => {
      mockCommon.param.mockImplementation((topic, param) => {
        if (param === 'identity') return BigInt(50)
        if (param === 'identityWord') return BigInt(10)
        return BigInt(0)
      })

      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(64), // 2 words
      }

      const result = precompile04(input)

      expect(result.executionGasUsed).toBe(BigInt(70)) // 50 + 10*2
    })
  })

  describe('Data Integrity', () => {
    it('should preserve byte order', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      for (let i = 0; i < data.length; i++) {
        expect(result.returnValue[i]).toBe(data[i])
      }
    })

    it('should handle consecutive calls with different data', () => {
      const data1 = utf8ToBytes('first call')
      const data2 = utf8ToBytes('second call')

      const input1: PrecompileInput = {
        ...baseInput,
        data: data1,
      }

      const input2: PrecompileInput = {
        ...baseInput,
        data: data2,
      }

      const result1 = precompile04(input1)
      const result2 = precompile04(input2)

      expect(result1.returnValue).toEqual(data1)
      expect(result2.returnValue).toEqual(data2)
      expect(result1.returnValue).not.toEqual(result2.returnValue)
    })

    it('should handle data with null bytes', () => {
      const data = new Uint8Array([0x00, 0x01, 0x00, 0x02, 0x00, 0x03])
      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile04(input)

      expect(result.returnValue).toEqual(data)
    })
  })
})