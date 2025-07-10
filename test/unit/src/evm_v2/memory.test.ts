import { Memory } from '../../../../src/evm_v2/memory'
import { concatBytes } from '@ethereumjs/util'

// Mock concatBytes
jest.mock('@ethereumjs/util', () => ({
  concatBytes: jest.fn()
}))

describe('Memory', () => {
  let memory: Memory

  beforeEach(() => {
    memory = new Memory()
    jest.clearAllMocks()
    // Default mock implementation
    ;(concatBytes as jest.Mock).mockImplementation((a: Uint8Array, b: Uint8Array) => {
      const result = new Uint8Array(a.length + b.length)
      result.set(a)
      result.set(b, a.length)
      return result
    })
  })

  describe('constructor', () => {
    it('should initialize with empty store', () => {
      expect(memory._store).toBeInstanceOf(Uint8Array)
      expect(memory._store.length).toBe(0)
    })
  })

  describe('extend', () => {
    it('should not extend when size is 0', () => {
      const initialLength = memory._store.length
      memory.extend(100, 0)
      expect(memory._store.length).toBe(initialLength)
      expect(concatBytes).not.toHaveBeenCalled()
    })

    it('should extend memory to word-aligned size', () => {
      memory.extend(0, 33)
      // Should round up to 64 (next multiple of 32)
      // And then allocate in CONTAINER_SIZE chunks (8192)
      expect(concatBytes).toHaveBeenCalled()
      const [, newArray] = (concatBytes as jest.Mock).mock.calls[0]
      expect(newArray.length).toBe(8192) // CONTAINER_SIZE
    })

    it('should extend memory by exact word size', () => {
      memory.extend(0, 32)
      expect(concatBytes).toHaveBeenCalled()
      const [, newArray] = (concatBytes as jest.Mock).mock.calls[0]
      expect(newArray.length).toBe(8192) // CONTAINER_SIZE
    })

    it('should not extend if memory is already large enough', () => {
      // First extend
      memory._store = new Uint8Array(64)
      memory.extend(0, 32)
      expect(concatBytes).not.toHaveBeenCalled()
    })

    it('should handle large extensions with multiple containers', () => {
      memory.extend(0, 16384) // 2 * CONTAINER_SIZE
      expect(concatBytes).toHaveBeenCalled()
      const [, newArray] = (concatBytes as jest.Mock).mock.calls[0]
      expect(newArray.length).toBe(16384) // 2 * CONTAINER_SIZE
    })

    it('should calculate correct memory size with offset', () => {
      memory.extend(32, 33)
      // offset + size = 65, rounded to 96 (next multiple of 32)
      expect(concatBytes).toHaveBeenCalled()
    })
  })

  describe('write', () => {
    beforeEach(() => {
      // Set up memory with some space
      memory._store = new Uint8Array(128)
    })

    it('should not write when size is 0', () => {
      const value = new Uint8Array([1, 2, 3])
      memory.write(0, 0, value)
      expect(memory._store[0]).toBe(0)
    })

    it('should write value at specified offset', () => {
      const value = new Uint8Array([1, 2, 3, 4])
      memory.write(10, 4, value)
      
      expect(memory._store[10]).toBe(1)
      expect(memory._store[11]).toBe(2)
      expect(memory._store[12]).toBe(3)
      expect(memory._store[13]).toBe(4)
    })

    it('should extend memory if needed before writing', () => {
      memory._store = new Uint8Array(32)
      const value = new Uint8Array([1, 2, 3, 4])
      const extendSpy = jest.spyOn(memory, 'extend')
      
      memory.write(50, 4, value)
      
      expect(extendSpy).toHaveBeenCalledWith(50, 4)
    })

    it('should throw error if value size does not match size parameter', () => {
      const value = new Uint8Array([1, 2, 3])
      expect(() => memory.write(0, 4, value)).toThrow('Invalid value size')
    })

    it('should throw error if write exceeds memory capacity', () => {
      memory._store = new Uint8Array(10)
      const value = new Uint8Array([1, 2, 3, 4])
      
      // Mock extend to not actually extend (simulating memory limit)
      jest.spyOn(memory, 'extend').mockImplementation(() => {})
      
      expect(() => memory.write(8, 4, value)).toThrow('Value exceeds memory capacity')
    })

    it('should write large values correctly', () => {
      const value = new Uint8Array(64).fill(42)
      memory.write(0, 64, value)
      
      for (let i = 0; i < 64; i++) {
        expect(memory._store[i]).toBe(42)
      }
    })
  })

  describe('read', () => {
    beforeEach(() => {
      // Set up memory with test data
      memory._store = new Uint8Array(128)
      for (let i = 0; i < 128; i++) {
        memory._store[i] = i
      }
    })

    it('should read correct bytes from memory', () => {
      const result = memory.read(10, 4)
      
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(4)
      expect(result[0]).toBe(10)
      expect(result[1]).toBe(11)
      expect(result[2]).toBe(12)
      expect(result[3]).toBe(13)
    })

    it('should extend memory if reading beyond current size', () => {
      const extendSpy = jest.spyOn(memory, 'extend')
      memory.read(200, 32)
      
      expect(extendSpy).toHaveBeenCalledWith(200, 32)
    })

    it('should return copy by default', () => {
      const result = memory.read(0, 4)
      result[0] = 255
      
      expect(memory._store[0]).toBe(0) // Original unchanged
    })

    it('should return reference when avoidCopy is true', () => {
      const result = memory.read(0, 4, true)
      result[0] = 255
      
      expect(memory._store[0]).toBe(255) // Original changed
    })

    it('should handle reading zero bytes', () => {
      const result = memory.read(0, 0)
      expect(result.length).toBe(0)
    })

    it('should handle reading from high offsets', () => {
      const result = memory.read(124, 4)
      expect(result[0]).toBe(124)
      expect(result[1]).toBe(125)
      expect(result[2]).toBe(126)
      expect(result[3]).toBe(127)
    })

    it('should fill with zeros when reading beyond initialized memory', () => {
      memory._store = new Uint8Array(32)
      memory._store.fill(42)
      
      // Mock extend to create larger memory
      jest.spyOn(memory, 'extend').mockImplementation((offset, size) => {
        const newSize = Math.ceil((offset + size) / 32) * 32
        if (newSize > memory._store.length) {
          const newStore = new Uint8Array(newSize)
          newStore.set(memory._store)
          memory._store = newStore
        }
      })
      
      const result = memory.read(30, 4)
      expect(result[0]).toBe(42)
      expect(result[1]).toBe(42)
      expect(result[2]).toBe(0) // Beyond original memory
      expect(result[3]).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle word-aligned memory operations', () => {
      // Test exact word boundaries
      const value32 = new Uint8Array(32).fill(1)
      memory.write(0, 32, value32)
      
      const result = memory.read(0, 32)
      expect(result.every(b => b === 1)).toBe(true)
    })

    it('should handle non-word-aligned operations', () => {
      // Test non-aligned sizes
      const value17 = new Uint8Array(17).fill(2)
      memory.write(7, 17, value17)
      
      const result = memory.read(7, 17)
      expect(result.every(b => b === 2)).toBe(true)
    })

    it('should handle overlapping writes', () => {
      const value1 = new Uint8Array([1, 2, 3, 4])
      const value2 = new Uint8Array([5, 6, 7, 8])
      
      memory.write(0, 4, value1)
      memory.write(2, 4, value2)
      
      expect(memory.read(0, 6)).toEqual(new Uint8Array([1, 2, 5, 6, 7, 8]))
    })

    it('should handle very large memory operations', () => {
      const largeSize = 16384 // 2 * CONTAINER_SIZE
      const largeValue = new Uint8Array(largeSize).fill(99)
      
      memory.write(0, largeSize, largeValue)
      const result = memory.read(0, largeSize)
      
      expect(result.length).toBe(largeSize)
      expect(result[0]).toBe(99)
      expect(result[largeSize - 1]).toBe(99)
    })
  })
})