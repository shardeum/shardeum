import { TransientStorage } from '../../../../src/evm_v2/transientStorage'
import { Address, bytesToHex } from '@ethereumjs/util'

// Mock dependencies
jest.mock('@ethereumjs/util', () => ({
  bytesToHex: jest.fn((bytes: Uint8Array) => {
    // Create a proper hex string from the bytes
    return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  }),
  Address: jest.fn()
}))

describe('TransientStorage', () => {
  let storage: TransientStorage
  let mockAddress1: Address
  let mockAddress2: Address

  beforeEach(() => {
    storage = new TransientStorage()
    
    // Create mock addresses
    mockAddress1 = {
      toString: () => '0x1234567890123456789012345678901234567890'
    } as Address
    
    mockAddress2 = {
      toString: () => '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    } as Address
  })

  describe('constructor', () => {
    it('should initialize with empty storage', () => {
      expect((storage as any)._storage.size).toBe(0)
      expect((storage as any)._changeJournal.length).toBe(0)
      expect((storage as any)._indices).toEqual([0])
    })
  })

  describe('get', () => {
    it('should return 32 bytes of zeros for non-existent address', () => {
      const key = new Uint8Array(32).fill(1)
      const result = storage.get(mockAddress1, key)
      
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
      expect(result.every(b => b === 0)).toBe(true)
    })


    it('should return stored value for existing address and key', () => {
      const key = new Uint8Array(32).fill(1)
      const value = new Uint8Array(32).fill(42)
      
      storage.put(mockAddress1, key, value)
      const result = storage.get(mockAddress1, key)
      
      expect(result).toEqual(value)
    })

    it('should handle multiple addresses independently', () => {
      const key = new Uint8Array(32).fill(1)
      const value1 = new Uint8Array(32).fill(10)
      const value2 = new Uint8Array(32).fill(20)
      
      storage.put(mockAddress1, key, value1)
      storage.put(mockAddress2, key, value2)
      
      expect(storage.get(mockAddress1, key)).toEqual(value1)
      expect(storage.get(mockAddress2, key)).toEqual(value2)
    })
  })

  describe('put', () => {
    it('should store value for address and key', () => {
      const key = new Uint8Array(32).fill(1)
      const value = new Uint8Array(32).fill(42)
      
      storage.put(mockAddress1, key, value)
      
      expect((storage as any)._storage.has(mockAddress1.toString())).toBe(true)
      const map = (storage as any)._storage.get(mockAddress1.toString())
      expect(map.has(bytesToHex(key))).toBe(true)
    })

    it('should throw error for non-32-byte key', () => {
      const shortKey = new Uint8Array(16)
      const value = new Uint8Array(32)
      
      expect(() => storage.put(mockAddress1, shortKey, value))
        .toThrow('Transient storage key must be 32 bytes long')
    })

    it('should throw error for value longer than 32 bytes', () => {
      const key = new Uint8Array(32)
      const longValue = new Uint8Array(33)
      
      expect(() => storage.put(mockAddress1, key, longValue))
        .toThrow('Transient storage value cannot be longer than 32 bytes')
    })

    it('should accept values shorter than 32 bytes', () => {
      const key = new Uint8Array(32).fill(1)
      const shortValue = new Uint8Array(16).fill(42)
      
      expect(() => storage.put(mockAddress1, key, shortValue)).not.toThrow()
      const result = storage.get(mockAddress1, key)
      expect(result.slice(0, 16)).toEqual(shortValue)
    })

    it('should record changes in journal', () => {
      const key = new Uint8Array(32).fill(1)
      const value = new Uint8Array(32).fill(42)
      
      storage.put(mockAddress1, key, value)
      
      const journal = (storage as any)._changeJournal
      expect(journal.length).toBe(1)
      expect(journal[0].addr).toBe(mockAddress1.toString())
      expect(journal[0].key).toBe(bytesToHex(key))
      expect(journal[0].prevValue.every((b: number) => b === 0)).toBe(true)
    })

    it('should record previous value in journal on update', () => {
      const key = new Uint8Array(32).fill(1)
      const value1 = new Uint8Array(32).fill(10)
      const value2 = new Uint8Array(32).fill(20)
      
      storage.put(mockAddress1, key, value1)
      storage.put(mockAddress1, key, value2)
      
      const journal = (storage as any)._changeJournal
      expect(journal.length).toBe(2)
      expect(journal[1].prevValue).toEqual(value1)
    })
  })

  describe('checkpoint and revert', () => {
    it('should create checkpoint and revert to it', () => {
      const key = new Uint8Array(32).fill(1)
      const value1 = new Uint8Array(32).fill(10)
      const value2 = new Uint8Array(32).fill(20)
      
      storage.put(mockAddress1, key, value1)
      storage.checkpoint()
      storage.put(mockAddress1, key, value2)
      
      expect(storage.get(mockAddress1, key)).toEqual(value2)
      
      storage.revert()
      
      expect(storage.get(mockAddress1, key)).toEqual(value1)
    })

    it('should handle multiple checkpoints', () => {
      const key = new Uint8Array(32).fill(1)
      const value1 = new Uint8Array(32).fill(10)
      const value2 = new Uint8Array(32).fill(20)
      const value3 = new Uint8Array(32).fill(30)
      
      storage.put(mockAddress1, key, value1)
      storage.checkpoint()
      storage.put(mockAddress1, key, value2)
      storage.checkpoint()
      storage.put(mockAddress1, key, value3)
      
      storage.revert() // Revert to value2
      expect(storage.get(mockAddress1, key)).toEqual(value2)
      
      storage.revert() // Revert to value1
      expect(storage.get(mockAddress1, key)).toEqual(value1)
    })

    it('should throw error when reverting with no checkpoints', () => {
      // The initial indices array has one element [0], so we need to remove it first
      storage.commit() // This removes the initial checkpoint
      expect(() => storage.revert()).toThrow('Nothing to revert')
    })

    it('should properly remove reverted changes from journal', () => {
      const key = new Uint8Array(32).fill(1)
      const value = new Uint8Array(32).fill(42)
      
      storage.checkpoint()
      storage.put(mockAddress1, key, value)
      
      expect((storage as any)._changeJournal.length).toBe(1)
      
      storage.revert()
      
      expect((storage as any)._changeJournal.length).toBe(0)
    })

    it('should revert multiple changes in correct order', () => {
      const key1 = new Uint8Array(32).fill(1)
      const key2 = new Uint8Array(32).fill(2)
      const value1 = new Uint8Array(32).fill(10)
      const value2 = new Uint8Array(32).fill(20)
      
      storage.checkpoint()
      storage.put(mockAddress1, key1, value1)
      storage.put(mockAddress1, key2, value2)
      storage.put(mockAddress1, key1, new Uint8Array(32).fill(30))
      
      storage.revert()
      
      expect(storage.get(mockAddress1, key1).every(b => b === 0)).toBe(true)
      expect(storage.get(mockAddress1, key2).every(b => b === 0)).toBe(true)
    })
  })

  describe('commit', () => {
    it('should commit changes by removing checkpoint', () => {
      storage.checkpoint()
      const indices = (storage as any)._indices
      expect(indices.length).toBe(2)
      
      storage.commit()
      
      expect(indices.length).toBe(1)
    })

    it('should throw error when committing with no checkpoints', () => {
      storage.commit() // Initial commit removes the default checkpoint
      expect(() => storage.commit()).toThrow('Nothing to commit')
    })

    it('should preserve changes after commit', () => {
      const key = new Uint8Array(32).fill(1)
      const value = new Uint8Array(32).fill(42)
      
      storage.checkpoint()
      storage.put(mockAddress1, key, value)
      storage.commit()
      
      expect(storage.get(mockAddress1, key)).toEqual(value)
    })

    it('should handle nested checkpoints with commit', () => {
      const key = new Uint8Array(32).fill(1)
      const value1 = new Uint8Array(32).fill(10)
      const value2 = new Uint8Array(32).fill(20)
      
      storage.checkpoint() // checkpoint 1
      storage.put(mockAddress1, key, value1)
      storage.checkpoint() // checkpoint 2
      storage.put(mockAddress1, key, value2)
      
      storage.commit() // commit checkpoint 2
      expect(storage.get(mockAddress1, key)).toEqual(value2)
      
      storage.revert() // revert checkpoint 1
      expect(storage.get(mockAddress1, key).every(b => b === 0)).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear all storage', () => {
      const key = new Uint8Array(32).fill(1)
      const value = new Uint8Array(32).fill(42)
      
      storage.put(mockAddress1, key, value)
      storage.put(mockAddress2, key, value)
      
      storage.clear()
      
      expect((storage as any)._storage.size).toBe(0)
      expect((storage as any)._changeJournal.length).toBe(0)
      expect(storage.get(mockAddress1, key).every(b => b === 0)).toBe(true)
      expect(storage.get(mockAddress2, key).every(b => b === 0)).toBe(true)
    })

    it('should not reset indices on clear', () => {
      storage.checkpoint()
      storage.clear()
      
      // Indices should remain to maintain checkpoint structure
      expect((storage as any)._indices.length).toBe(2)
    })
  })

  describe('toJSON', () => {
    it('should return empty object for empty storage', () => {
      const json = storage.toJSON()
      expect(json).toEqual({})
    })

    it('should return correct JSON representation', () => {
      const key1 = new Uint8Array(32).fill(1)
      const key2 = new Uint8Array(32).fill(2)
      const value1 = new Uint8Array(32).fill(10)
      const value2 = new Uint8Array(32).fill(20)
      
      storage.put(mockAddress1, key1, value1)
      storage.put(mockAddress1, key2, value2)
      storage.put(mockAddress2, key1, value1)
      
      const json = storage.toJSON()
      
      expect(json[mockAddress1.toString()]).toBeDefined()
      expect(json[mockAddress1.toString()][bytesToHex(key1)]).toBe(bytesToHex(value1))
      expect(json[mockAddress1.toString()][bytesToHex(key2)]).toBe(bytesToHex(value2))
      expect(json[mockAddress2.toString()][bytesToHex(key1)]).toBe(bytesToHex(value1))
    })

    it('should handle empty values in JSON', () => {
      const key = new Uint8Array(32).fill(1)
      const emptyValue = new Uint8Array(32) // all zeros
      
      storage.put(mockAddress1, key, emptyValue)
      
      const json = storage.toJSON()
      expect(json[mockAddress1.toString()][bytesToHex(key)]).toBe(bytesToHex(emptyValue))
    })
  })

  describe('edge cases', () => {
    it('should handle maximum 32-byte values', () => {
      const key = new Uint8Array(32).fill(255)
      const value = new Uint8Array(32).fill(255)
      
      storage.put(mockAddress1, key, value)
      expect(storage.get(mockAddress1, key)).toEqual(value)
    })

    it('should handle zero-filled keys and values', () => {
      const key = new Uint8Array(32) // all zeros
      const value = new Uint8Array(32).fill(1)
      
      storage.put(mockAddress1, key, value)
      expect(storage.get(mockAddress1, key)).toEqual(value)
    })

    it('should maintain separate storage for different addresses with same key', () => {
      const key = new Uint8Array(32).fill(1)
      const value1 = new Uint8Array(32).fill(10)
      const value2 = new Uint8Array(32).fill(20)
      
      storage.put(mockAddress1, key, value1)
      storage.put(mockAddress2, key, value2)
      
      storage.checkpoint()
      storage.put(mockAddress1, key, new Uint8Array(32).fill(30))
      
      storage.revert()
      
      expect(storage.get(mockAddress1, key)).toEqual(value1)
      expect(storage.get(mockAddress2, key)).toEqual(value2)
    })

    it('should handle rapid checkpoint/commit/revert cycles', () => {
      const key = new Uint8Array(32).fill(1)
      let value = 0
      
      for (let i = 0; i < 10; i++) {
        storage.checkpoint()
        storage.put(mockAddress1, key, new Uint8Array(32).fill(value++))
        
        if (i % 2 === 0) {
          storage.commit()
        } else {
          storage.checkpoint()
          storage.put(mockAddress1, key, new Uint8Array(32).fill(value++))
          storage.revert()
          storage.commit()
        }
      }
      
      // Should have the last committed value
      const result = storage.get(mockAddress1, key)
      expect(result[0]).toBeGreaterThan(0)
    })
  })
})