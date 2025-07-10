import { describe, it, expect, beforeEach } from '@jest/globals'
import { TraceDataFactory, ITraceData } from '../../../../../src/debug/trace/traceDataFactory'

describe('TraceDataFactory', () => {
  let TraceData: ReturnType<typeof TraceDataFactory>

  beforeEach(() => {
    // Create a new factory instance for each test to ensure isolation
    TraceData = TraceDataFactory()
  })

  describe('TraceData.from', () => {
    it('should create ITraceData from a buffer', () => {
      const buffer = Buffer.from([0x12, 0x34])
      const traceData = TraceData.from(buffer)

      expect(traceData).toBeDefined()
      expect(traceData).toHaveProperty('toBuffer')
      expect(traceData).toHaveProperty('toJSON')
    })

    it('should return the same instance for identical keys', () => {
      const buffer1 = Buffer.from([0x00, 0x00, 0x12, 0x34])
      const buffer2 = Buffer.from([0x00, 0x00, 0x12, 0x34])

      const traceData1 = TraceData.from(buffer1)
      const traceData2 = TraceData.from(buffer2)

      expect(traceData1).toBe(traceData2) // Same reference
    })

    it('should strip leading zeros when creating keys', () => {
      const bufferWithZeros = Buffer.from([0x00, 0x00, 0x12, 0x34])
      const bufferWithoutZeros = Buffer.from([0x12, 0x34])

      const traceData1 = TraceData.from(bufferWithZeros)
      const traceData2 = TraceData.from(bufferWithoutZeros)

      expect(traceData1).toBe(traceData2) // Same instance
    })

    it('should handle all zeros buffer', () => {
      const allZeros = Buffer.alloc(32) // 32 bytes of zeros
      const traceData = TraceData.from(allZeros)

      expect(traceData).toBeDefined()
      expect(traceData.toJSON()).toBe('0000000000000000000000000000000000000000000000000000000000000000')
    })

    it('should handle single byte values', () => {
      for (let i = 0; i < 256; i++) {
        const buffer = Buffer.from([i])
        const traceData = TraceData.from(buffer)
        
        expect(traceData).toBeDefined()
        
        // For single byte, it should use the hex lookup table
        const hex = i.toString(16).padStart(2, '0')
        expect(traceData.toJSON()).toMatch(new RegExp(`${hex}$`))
      }
    })
  })

  describe('ITraceData.toBuffer', () => {
    it('should return 32-byte padded buffer', () => {
      const inputBuffer = Buffer.from([0x12, 0x34])
      const traceData = TraceData.from(inputBuffer)
      const outputBuffer = traceData.toBuffer()

      expect(outputBuffer).toBeInstanceOf(Buffer)
      expect(outputBuffer.length).toBe(32)
      expect(outputBuffer[30]).toBe(0x12)
      expect(outputBuffer[31]).toBe(0x34)
      
      // Check padding zeros
      for (let i = 0; i < 30; i++) {
        expect(outputBuffer[i]).toBe(0)
      }
    })

    it('should return the same buffer for 32-byte input', () => {
      const buffer32 = Buffer.alloc(32)
      buffer32[31] = 0xff
      
      const traceData = TraceData.from(buffer32)
      const outputBuffer = traceData.toBuffer()

      expect(outputBuffer).toBe(buffer32) // Same reference
      expect(outputBuffer.length).toBe(32)
    })

    it('should cache the buffer after first call', () => {
      const inputBuffer = Buffer.from([0xaa, 0xbb])
      const traceData = TraceData.from(inputBuffer)
      
      const buffer1 = traceData.toBuffer()
      const buffer2 = traceData.toBuffer()

      expect(buffer1).toBe(buffer2) // Same reference due to caching
    })

    it('should handle various buffer sizes correctly', () => {
      const sizes = [1, 8, 16, 24, 31, 32]
      
      sizes.forEach(size => {
        const buffer = Buffer.alloc(size, 0xff)
        const traceData = TraceData.from(buffer)
        const result = traceData.toBuffer()
        
        expect(result.length).toBe(32)
        
        // Check that the data is right-aligned
        const offset = 32 - size
        for (let i = 0; i < size; i++) {
          expect(result[offset + i]).toBe(0xff)
        }
      })
    })
  })

  describe('ITraceData.toJSON', () => {
    it('should return 64-character hex string', () => {
      const buffer = Buffer.from([0x12, 0x34])
      const traceData = TraceData.from(buffer)
      const json = traceData.toJSON()

      expect(typeof json).toBe('string')
      expect(json.length).toBe(64)
      expect(json).toBe('0000000000000000000000000000000000000000000000000000000000001234')
    })

    it('should cache the string after first call', () => {
      const buffer = Buffer.from([0xaa, 0xbb])
      const traceData = TraceData.from(buffer)
      
      const json1 = traceData.toJSON()
      const json2 = traceData.toJSON()

      expect(json1).toBe(json2) // Same reference due to caching
    })

    it('should use correct prefix padding', () => {
      const testCases = [
        { buffer: Buffer.from([0x01]), expected: '0000000000000000000000000000000000000000000000000000000000000001' },
        { buffer: Buffer.from([0x01, 0x23]), expected: '0000000000000000000000000000000000000000000000000000000000000123' },
        { buffer: Buffer.from([0x01, 0x23, 0x45]), expected: '0000000000000000000000000000000000000000000000000000000000012345' },
        { buffer: Buffer.from([0x01, 0x23, 0x45, 0x67]), expected: '0000000000000000000000000000000000000000000000000000000001234567' }
      ]

      testCases.forEach(({ buffer, expected }) => {
        const traceData = TraceData.from(buffer)
        expect(traceData.toJSON()).toBe(expected)
      })
    })

    it('should handle full 32-byte values', () => {
      const buffer = Buffer.alloc(32, 0xff)
      const traceData = TraceData.from(buffer)
      const json = traceData.toJSON()

      expect(json).toBe('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    })
  })

  describe('Edge cases and special scenarios', () => {
    it('should handle empty buffer', () => {
      const emptyBuffer = Buffer.from([])
      const traceData = TraceData.from(emptyBuffer)
      
      expect(traceData.toJSON()).toBe('0000000000000000000000000000000000000000000000000000000000000000')
      
      const buffer = traceData.toBuffer()
      expect(buffer.length).toBe(32)
      expect(buffer.every(b => b === 0)).toBe(true)
    })

    it('should handle buffers larger than 32 bytes', () => {
      // The implementation doesn't handle buffers larger than 32 bytes correctly
      // It would cause a negative lengthDiff, leading to an error
      // This test documents that limitation
      const largeBuffer = Buffer.alloc(40, 0xaa)
      
      // This would throw an error due to negative lengthDiff in toBuffer
      expect(() => {
        const traceData = TraceData.from(largeBuffer)
        traceData.toBuffer()
      }).toThrow()
    })

    it('should handle buffers with mixed zero and non-zero bytes', () => {
      const mixedBuffer = Buffer.from([0x00, 0x00, 0xaa, 0x00, 0xbb, 0x00, 0xcc])
      const traceData = TraceData.from(mixedBuffer)
      
      const json = traceData.toJSON()
      expect(json).toMatch(/aa00bb00cc$/)
    })

    it('should properly handle buffer slicing in stringify', () => {
      // Test that the internal stringify function works correctly
      const buffer = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0])
      const traceData = TraceData.from(buffer)
      
      expect(traceData.toJSON()).toMatch(/123456789abcdef0$/)
    })
  })

  describe('Performance and optimization', () => {
    it('should reuse instances for performance', () => {
      const buffers = [
        Buffer.from([0x12]),
        Buffer.from([0x00, 0x12]), // Same key as above
        Buffer.from([0x34]),
        Buffer.from([0x00, 0x00, 0x34]) // Same key as above
      ]

      const instances = buffers.map(b => TraceData.from(b))
      
      expect(instances[0]).toBe(instances[1])
      expect(instances[2]).toBe(instances[3])
      expect(instances[0]).not.toBe(instances[2])
    })

    it('should handle hex lookup table efficiently', () => {
      // Test all single-byte values use the hex lookup
      for (let i = 0; i < 256; i++) {
        const buffer = Buffer.from([i])
        const traceData = TraceData.from(buffer)
        const json = traceData.toJSON()
        
        const expectedHex = i.toString(16).padStart(2, '0')
        expect(json.slice(-2)).toBe(expectedHex)
      }
    })
  })

  describe('Multiple factory instances', () => {
    it('should maintain separate caches for different factory instances', () => {
      const factory1 = TraceDataFactory()
      const factory2 = TraceDataFactory()
      
      const buffer = Buffer.from([0x12, 0x34])
      
      const data1 = factory1.from(buffer)
      const data2 = factory2.from(buffer)
      
      // Different factory instances should create different trace data instances
      expect(data1).not.toBe(data2)
      
      // But they should produce the same output
      expect(data1.toJSON()).toBe(data2.toJSON())
      expect(data1.toBuffer()).toEqual(data2.toBuffer())
    })
  })
})