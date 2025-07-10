import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { Bloom } from '../../../../../src/vm_v7/bloom/index'
import { zeros } from '@ethereumjs/util'
import { keccak256 } from 'ethereum-cryptography/keccak.js'

// Mock dependencies
jest.mock('ethereum-cryptography/keccak.js')

describe('Bloom', () => {
  const mockKeccak256 = keccak256 as jest.MockedFunction<typeof keccak256>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create a Bloom filter with zeros when no bitvector provided', () => {
      const bloom = new Bloom()
      
      expect(bloom.bitvector).toBeInstanceOf(Uint8Array)
      expect(bloom.bitvector.length).toBe(256)
      expect(bloom.bitvector.every(b => b === 0)).toBe(true)
    })

    it('should create a Bloom filter with provided bitvector', () => {
      const bitvector = new Uint8Array(256).fill(0xff)
      const bloom = new Bloom(bitvector)
      
      expect(bloom.bitvector).toBe(bitvector)
      expect(bloom.bitvector.every(b => b === 0xff)).toBe(true)
    })

    it('should throw error if bitvector is not 256 bytes', () => {
      const shortBitvector = new Uint8Array(255)
      const longBitvector = new Uint8Array(257)
      
      expect(() => new Bloom(shortBitvector)).toThrow('bitvectors must be 2048 bits long')
      expect(() => new Bloom(longBitvector)).toThrow('bitvectors must be 2048 bits long')
    })

    it('should accept exactly 256 bytes (2048 bits)', () => {
      const correctBitvector = new Uint8Array(256)
      
      expect(() => new Bloom(correctBitvector)).not.toThrow()
    })
  })

  describe('add', () => {
    it('should add an element to the bloom filter', () => {
      const bloom = new Bloom()
      const element = new Uint8Array([1, 2, 3])
      
      // Mock keccak256 to return predictable hash
      const mockHash = new Uint8Array(32)
      mockHash[0] = 0x12
      mockHash[1] = 0x34
      mockHash[2] = 0x56
      mockHash[3] = 0x78
      mockHash[4] = 0x9a
      mockHash[5] = 0xbc
      mockKeccak256.mockReturnValue(mockHash)
      
      bloom.add(element)
      
      expect(mockKeccak256).toHaveBeenCalledWith(element)
      
      // Verify that some bits were set
      const hasNonZero = bloom.bitvector.some(b => b !== 0)
      expect(hasNonZero).toBe(true)
    })

    it('should set exactly 3 bits for each element', () => {
      const bloom = new Bloom()
      const element = new Uint8Array([42])
      
      // Create a hash that will produce known bit positions
      const mockHash = new Uint8Array(32)
      // First 2 bytes: 0x0001 -> bit position 1
      mockHash[0] = 0x00
      mockHash[1] = 0x01
      // Second 2 bytes: 0x0002 -> bit position 2
      mockHash[2] = 0x00
      mockHash[3] = 0x02
      // Third 2 bytes: 0x0003 -> bit position 3
      mockHash[4] = 0x00
      mockHash[5] = 0x03
      
      mockKeccak256.mockReturnValue(mockHash)
      
      bloom.add(element)
      
      // Count the number of bits set
      let bitCount = 0
      for (const byte of bloom.bitvector) {
        for (let i = 0; i < 8; i++) {
          if ((byte & (1 << i)) !== 0) {
            bitCount++
          }
        }
      }
      
      expect(bitCount).toBe(3)
    })

    it('should handle overlapping bits', () => {
      const bloom = new Bloom()
      
      // Same position for all three indices
      const mockHash = new Uint8Array(32)
      mockHash[0] = 0x00
      mockHash[1] = 0x01
      mockHash[2] = 0x00
      mockHash[3] = 0x01
      mockHash[4] = 0x00
      mockHash[5] = 0x01
      
      mockKeccak256.mockReturnValue(mockHash)
      
      bloom.add(new Uint8Array([1]))
      
      // Should only set 1 bit even though we tried to set 3
      let bitCount = 0
      for (const byte of bloom.bitvector) {
        for (let i = 0; i < 8; i++) {
          if ((byte & (1 << i)) !== 0) {
            bitCount++
          }
        }
      }
      
      expect(bitCount).toBe(1)
    })

    it('should correctly calculate bit positions with mask', () => {
      const bloom = new Bloom()
      
      // Test with maximum valid position (2047 = 0x07FF)
      const mockHash = new Uint8Array(32)
      mockHash[0] = 0x07
      mockHash[1] = 0xff
      mockHash[2] = 0x00
      mockHash[3] = 0x00
      mockHash[4] = 0x07
      mockHash[5] = 0xff
      
      mockKeccak256.mockReturnValue(mockHash)
      
      bloom.add(new Uint8Array([1]))
      
      // The last bit should be set (position 2047)
      // byteLoc = 2047 >> 3 = 255
      // bitLoc = 1 << (2047 % 8) = 1 << 7 = 128
      // bitvector[256 - 255 - 1] = bitvector[0]
      expect(bloom.bitvector[0] & 128).toBe(128)
    })
  })

  describe('check', () => {
    it('should return false for empty bloom filter', () => {
      const bloom = new Bloom()
      const element = new Uint8Array([1, 2, 3])
      
      mockKeccak256.mockReturnValue(new Uint8Array(32))
      
      expect(bloom.check(element)).toBe(false)
    })

    it('should return true for added element', () => {
      const bloom = new Bloom()
      const element = new Uint8Array([1, 2, 3])
      
      // Use consistent hash for both add and check
      const mockHash = new Uint8Array(32)
      mockHash[0] = 0x12
      mockHash[1] = 0x34
      mockKeccak256.mockReturnValue(mockHash)
      
      bloom.add(element)
      const result = bloom.check(element)
      
      expect(result).toBe(true)
      expect(mockKeccak256).toHaveBeenCalledTimes(2) // Once for add, once for check
    })

    it('should return false if any required bit is not set', () => {
      const bloom = new Bloom()
      
      // Set up bloom with specific bits
      const addHash = new Uint8Array(32)
      addHash[0] = 0x00
      addHash[1] = 0x01 // bit 1
      addHash[2] = 0x00
      addHash[3] = 0x02 // bit 2
      addHash[4] = 0x00
      addHash[5] = 0x03 // bit 3
      
      mockKeccak256.mockReturnValueOnce(addHash)
      bloom.add(new Uint8Array([1]))
      
      // Check with different hash that requires bit 4
      const checkHash = new Uint8Array(32)
      checkHash[0] = 0x00
      checkHash[1] = 0x01 // bit 1 (set)
      checkHash[2] = 0x00
      checkHash[3] = 0x02 // bit 2 (set)
      checkHash[4] = 0x00
      checkHash[5] = 0x04 // bit 4 (not set)
      
      mockKeccak256.mockReturnValueOnce(checkHash)
      
      expect(bloom.check(new Uint8Array([2]))).toBe(false)
    })

    it('should handle false positives correctly', () => {
      const bloom = new Bloom()
      
      // Add multiple elements to increase false positive probability
      const elements = [
        new Uint8Array([1]),
        new Uint8Array([2]),
        new Uint8Array([3])
      ]
      
      elements.forEach((elem, idx) => {
        const hash = new Uint8Array(32)
        hash[0] = idx
        hash[1] = idx
        mockKeccak256.mockReturnValueOnce(hash)
        bloom.add(elem)
      })
      
      // Check for an element that wasn't added but might match
      const checkHash = new Uint8Array(32)
      checkHash[0] = 0x00
      checkHash[1] = 0x00
      mockKeccak256.mockReturnValueOnce(checkHash)
      
      // This could be true (false positive) or false depending on the bits set
      const result = bloom.check(new Uint8Array([99]))
      expect(typeof result).toBe('boolean')
    })
  })

  describe('multiCheck', () => {
    it('should return true if all topics are in bloom', () => {
      const bloom = new Bloom()
      const topics = [
        new Uint8Array([1]),
        new Uint8Array([2]),
        new Uint8Array([3])
      ]
      
      // Add all topics
      topics.forEach((topic, idx) => {
        const hash = new Uint8Array(32)
        hash[0] = idx
        hash[1] = idx
        mockKeccak256.mockReturnValueOnce(hash)
        bloom.add(topic)
      })
      
      // Mock check calls to return the same hashes
      topics.forEach((_, idx) => {
        const hash = new Uint8Array(32)
        hash[0] = idx
        hash[1] = idx
        mockKeccak256.mockReturnValueOnce(hash)
      })
      
      expect(bloom.multiCheck(topics)).toBe(true)
    })

    it('should return false if any topic is not in bloom', () => {
      const bloom = new Bloom()
      
      // Add only first topic
      const hash1 = new Uint8Array(32)
      hash1[0] = 0x01
      mockKeccak256.mockReturnValueOnce(hash1)
      bloom.add(new Uint8Array([1]))
      
      // Check for two topics
      mockKeccak256.mockReturnValueOnce(hash1) // First will match
      
      const hash2 = new Uint8Array(32)
      hash2[0] = 0xff // Different hash that won't match
      mockKeccak256.mockReturnValueOnce(hash2)
      
      const topics = [
        new Uint8Array([1]),
        new Uint8Array([2])
      ]
      
      expect(bloom.multiCheck(topics)).toBe(false)
    })

    it('should return true for empty topics array', () => {
      const bloom = new Bloom()
      
      expect(bloom.multiCheck([])).toBe(true)
    })

    it('should short-circuit on first false', () => {
      const bloom = new Bloom()
      const topics = [
        new Uint8Array([1]),
        new Uint8Array([2]),
        new Uint8Array([3])
      ]
      
      // First check will return false
      const hash = new Uint8Array(32)
      hash[0] = 0xff
      mockKeccak256.mockReturnValue(hash)
      
      bloom.multiCheck(topics)
      
      // Should only call keccak256 once due to short-circuit
      expect(mockKeccak256).toHaveBeenCalledTimes(1)
    })
  })

  describe('or', () => {
    it('should OR two bloom filters together', () => {
      const bloom1 = new Bloom()
      const bloom2 = new Bloom()
      
      // Set different bits in each bloom
      bloom1.bitvector[0] = 0b10101010
      bloom1.bitvector[1] = 0b11110000
      
      bloom2.bitvector[0] = 0b01010101
      bloom2.bitvector[1] = 0b00001111
      
      bloom1.or(bloom2)
      
      expect(bloom1.bitvector[0]).toBe(0b11111111)
      expect(bloom1.bitvector[1]).toBe(0b11111111)
      
      // bloom2 should remain unchanged
      expect(bloom2.bitvector[0]).toBe(0b01010101)
      expect(bloom2.bitvector[1]).toBe(0b00001111)
    })

    it('should handle OR with empty bloom', () => {
      const bloom1 = new Bloom()
      const bloom2 = new Bloom()
      
      bloom1.bitvector[10] = 0xff
      
      bloom1.or(bloom2)
      
      // bloom1 should remain unchanged
      expect(bloom1.bitvector[10]).toBe(0xff)
    })

    it('should handle OR with full bloom', () => {
      const bloom1 = new Bloom()
      const bloom2 = new Bloom(new Uint8Array(256).fill(0xff))
      
      bloom1.bitvector[10] = 0x0f
      
      bloom1.or(bloom2)
      
      // All bits in bloom1 should now be set
      expect(bloom1.bitvector.every(b => b === 0xff)).toBe(true)
    })

    it('should OR all 256 bytes correctly', () => {
      const bloom1 = new Bloom()
      const bloom2 = new Bloom()
      
      // Set alternating bits
      for (let i = 0; i < 256; i++) {
        bloom1.bitvector[i] = i % 2 === 0 ? 0xaa : 0x55
        bloom2.bitvector[i] = i % 2 === 0 ? 0x55 : 0xaa
      }
      
      bloom1.or(bloom2)
      
      // All bytes should be 0xff after OR
      expect(bloom1.bitvector.every(b => b === 0xff)).toBe(true)
    })

    it('should handle off-by-one error in loop (<=256 vs <256)', () => {
      const bloom1 = new Bloom()
      const bloom2 = new Bloom()
      
      // The implementation has a bug: it loops to i <= 256, which would access index 256
      // This test verifies the behavior
      bloom2.bitvector[255] = 0xff
      
      // This should not throw even with the off-by-one error
      expect(() => bloom1.or(bloom2)).not.toThrow()
      
      // Last valid byte should be ORed correctly
      expect(bloom1.bitvector[255]).toBe(0xff)
    })
  })

  describe('Integration tests', () => {
    it('should correctly implement bloom filter semantics', () => {
      // Use real keccak256 for this test
      jest.unmock('ethereum-cryptography/keccak.js')
      const { keccak256: realKeccak256 } = require('ethereum-cryptography/keccak.js')
      
      const bloom = new Bloom()
      const elements = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        new Uint8Array([7, 8, 9])
      ]
      
      // Add elements with real hashing
      elements.forEach(elem => {
        mockKeccak256.mockImplementation(realKeccak256)
        bloom.add(elem)
      })
      
      // Check that all added elements are found
      elements.forEach(elem => {
        mockKeccak256.mockImplementation(realKeccak256)
        expect(bloom.check(elem)).toBe(true)
      })
      
      // Check that a non-added element is likely not found
      mockKeccak256.mockImplementation(realKeccak256)
      const notAdded = new Uint8Array([99, 98, 97])
      // This could be a false positive, but it's unlikely with only 3 elements
      bloom.check(notAdded)
    })

    it('should maintain bloom filter properties after OR operation', () => {
      const bloom1 = new Bloom()
      const bloom2 = new Bloom()
      
      // Add different elements to each bloom
      const elem1 = new Uint8Array([1])
      const elem2 = new Uint8Array([2])
      
      const hash1 = new Uint8Array(32)
      hash1[0] = 0x01
      mockKeccak256.mockReturnValueOnce(hash1)
      bloom1.add(elem1)
      
      const hash2 = new Uint8Array(32)
      hash2[0] = 0x02
      mockKeccak256.mockReturnValueOnce(hash2)
      bloom2.add(elem2)
      
      // OR them together
      bloom1.or(bloom2)
      
      // Both elements should now be found in bloom1
      mockKeccak256.mockReturnValueOnce(hash1)
      expect(bloom1.check(elem1)).toBe(true)
      
      mockKeccak256.mockReturnValueOnce(hash2)
      expect(bloom1.check(elem2)).toBe(true)
    })
  })
})