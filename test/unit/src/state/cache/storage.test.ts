import { Address, bytesToUnprefixedHex, hexToBytes } from '@ethereumjs/util'
import { StorageCache } from '../../../../../src/state/cache/storage'
import { CacheType } from '../../../../../src/state/cache/types'

describe('StorageCache', () => {
  let address1: Address
  let address2: Address
  let address3: Address
  let key1: Uint8Array
  let key2: Uint8Array
  let key3: Uint8Array
  let value1: Uint8Array
  let value2: Uint8Array
  let value3: Uint8Array

  beforeEach(() => {
    address1 = Address.fromString('0x1234567890123456789012345678901234567890')
    address2 = Address.fromString('0x2345678901234567890123456789012345678901')
    address3 = Address.fromString('0x3456789012345678901234567890123456789012')
    
    key1 = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
    key2 = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')
    key3 = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000003')
    
    value1 = hexToBytes('0x01')
    value2 = hexToBytes('0x02')
    value3 = hexToBytes('0x03')
  })

  describe('LRU Cache Implementation', () => {
    let cache: StorageCache

    beforeEach(() => {
      cache = new StorageCache({ type: CacheType.LRU, size: 2 })
    })

    describe('basic operations', () => {
      it('should put and get a storage value', () => {
        cache.put(address1, key1, value1)
        const result = cache.get(address1, key1)
        expect(result).toEqual(value1)
      })

      it('should return undefined for non-existent storage', () => {
        const result = cache.get(address1, key1)
        expect(result).toBeUndefined()
      })

      it('should return undefined for non-existent address', () => {
        cache.put(address1, key1, value1)
        const result = cache.get(address2, key1)
        expect(result).toBeUndefined()
      })

      it('should handle multiple storage slots for same address', () => {
        cache.put(address1, key1, value1)
        cache.put(address1, key2, value2)
        
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toEqual(value2)
      })

      it('should handle delete operation', () => {
        cache.put(address1, key1, value1)
        cache.del(address1, key1)
        const result = cache.get(address1, key1)
        expect(result).toEqual(hexToBytes('0x80')) // Empty RLP encoding
      })

      it('should respect LRU size limit', () => {
        cache.put(address1, key1, value1)
        cache.put(address2, key1, value2)
        cache.put(address3, key1, value3) // This should evict address1
        
        expect(cache.get(address1, key1)).toBeUndefined()
        expect(cache.get(address2, key1)).toEqual(value2)
        expect(cache.get(address3, key1)).toEqual(value3)
      })

      it('should update age on get', () => {
        cache.put(address1, key1, value1)
        cache.put(address2, key1, value2)
        cache.get(address1, key1) // Updates age of address1
        cache.put(address3, key1, value3) // Should evict address2, not address1
        
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address2, key1)).toBeUndefined()
        expect(cache.get(address3, key1)).toEqual(value3)
      })

      it('should handle clearContractStorage', () => {
        cache.put(address1, key1, value1)
        cache.put(address1, key2, value2)
        cache.put(address1, key3, value3)
        
        cache.clearContractStorage(address1)
        
        expect(cache.get(address1, key1)).toBeUndefined()
        expect(cache.get(address1, key2)).toBeUndefined()
        expect(cache.get(address1, key3)).toBeUndefined()
      })
    })

    describe('checkpoint operations', () => {
      it('should handle single checkpoint and revert', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint()
        cache.put(address1, key2, value2)
        cache.put(address1, key1, value2) // Overwrite
        
        cache.revert()
        
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toBeUndefined()
      })

      it('should handle single checkpoint and commit', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint()
        cache.put(address1, key2, value2)
        
        cache.commit()
        
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toEqual(value2)
      })

      it('should handle nested checkpoints with revert', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint() // checkpoint 1
        cache.put(address1, key2, value2)
        cache.checkpoint() // checkpoint 2
        cache.put(address1, key3, value3)
        cache.del(address1, key1)
        
        cache.revert() // revert checkpoint 2
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toEqual(value2)
        expect(cache.get(address1, key3)).toBeUndefined()
        
        cache.revert() // revert checkpoint 1
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toBeUndefined()
      })

      it('should handle nested checkpoints with mixed commit/revert', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint() // checkpoint 1
        cache.put(address1, key2, value2)
        cache.checkpoint() // checkpoint 2
        cache.put(address1, key3, value3)
        
        cache.commit() // commit checkpoint 2
        cache.put(address1, key1, value3) // Overwrite
        
        cache.revert() // revert checkpoint 1
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toBeUndefined()
        expect(cache.get(address1, key3)).toBeUndefined()
      })

      it('should handle delete in checkpoint and revert', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint()
        cache.del(address1, key1)
        
        cache.revert()
        expect(cache.get(address1, key1)).toEqual(value1)
      })

      it('should handle adding non-existent item in checkpoint and revert', () => {
        cache.checkpoint()
        cache.put(address1, key1, value1)
        
        cache.revert()
        expect(cache.get(address1, key1)).toBeUndefined()
      })

      it('should handle multiple addresses in checkpoint operations', () => {
        cache.put(address1, key1, value1)
        cache.put(address2, key1, value2)
        cache.checkpoint()
        cache.put(address1, key2, value2)
        cache.put(address2, key2, value1)
        
        cache.revert()
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toBeUndefined()
        expect(cache.get(address2, key1)).toEqual(value2)
        expect(cache.get(address2, key2)).toBeUndefined()
      })
    })

    describe('flush operations', () => {
      it('should flush modified storage slots', () => {
        cache.put(address1, key1, value1)
        cache.put(address1, key2, value2)
        cache.put(address2, key1, value3)
        
        const flushed = cache.flush()
        expect(flushed).toHaveLength(3)
        
        const expected = [
          [bytesToUnprefixedHex(address1.bytes), bytesToUnprefixedHex(key1), value1],
          [bytesToUnprefixedHex(address1.bytes), bytesToUnprefixedHex(key2), value2],
          [bytesToUnprefixedHex(address2.bytes), bytesToUnprefixedHex(key1), value3],
        ]
        
        // Sort both arrays for comparison since order might vary
        const sortFn = (a: any[], b: any[]) => {
          const cmp = a[0].localeCompare(b[0])
          return cmp !== 0 ? cmp : a[1].localeCompare(b[1])
        }
        expect(flushed.sort(sortFn)).toEqual(expected.sort(sortFn))
      })

      it('should only flush slots modified at current checkpoint', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint()
        cache.put(address1, key2, value2)
        
        const flushed = cache.flush()
        expect(flushed).toHaveLength(1)
        expect(flushed[0]).toEqual([
          bytesToUnprefixedHex(address1.bytes),
          bytesToUnprefixedHex(key2),
          value2
        ])
      })

      it('should clear diff cache after flush', () => {
        cache.put(address1, key1, value1)
        cache.flush()
        
        cache.put(address2, key1, value2)
        const flushed = cache.flush()
        expect(flushed).toHaveLength(1)
        expect(flushed[0][0]).toBe(bytesToUnprefixedHex(address2.bytes))
      })

      it('should include deleted storage slots in flush', () => {
        cache.put(address1, key1, value1)
        cache.del(address1, key1)
        
        const flushed = cache.flush()
        expect(flushed).toHaveLength(1)
        expect(flushed[0][2]).toEqual(hexToBytes('0x80'))
      })

      it('should throw error if storage map is missing during flush', () => {
        // This is a bit contrived, but tests the error case
        const diffCache = cache['_diffCache'][0]
        diffCache.set('missingAddress', new Map([['key', value1]]))
        
        expect(() => cache.flush()).toThrow('internal error: storage cache map for account should be defined')
      })
    })

    describe('statistics', () => {
      it('should track reads, hits, writes, and deletes', () => {
        cache.put(address1, key1, value1) // 1 write
        cache.get(address1, key1) // 1 read, 1 hit
        cache.get(address2, key1) // 1 read, 0 hits (miss)
        cache.del(address1, key1) // 1 del
        
        const stats = cache.stats(false)
        expect(stats.writes).toBe(1)
        expect(stats.reads).toBe(2)
        expect(stats.hits).toBe(1)
        expect(stats.dels).toBe(1)
        expect(stats.size).toBe(1) // One address in cache
      })

      it('should reset stats when requested', () => {
        cache.put(address1, key1, value1)
        cache.get(address1, key1)
        
        const stats1 = cache.stats(true)
        expect(stats1.writes).toBe(1)
        
        const stats2 = cache.stats(false)
        expect(stats2.writes).toBe(0)
      })
    })

    describe('utility methods', () => {
      it('should return correct size', () => {
        expect(cache.size()).toBe(0)
        cache.put(address1, key1, value1)
        expect(cache.size()).toBe(1)
        cache.put(address2, key1, value2)
        expect(cache.size()).toBe(2)
      })

      it('should clear cache', () => {
        cache.put(address1, key1, value1)
        cache.put(address2, key1, value2)
        expect(cache.size()).toBe(2)
        
        cache.clear()
        expect(cache.size()).toBe(0)
        expect(cache.get(address1, key1)).toBeUndefined()
        expect(cache.get(address2, key1)).toBeUndefined()
      })
    })
  })

  describe('OrderedMap Cache Implementation', () => {
    let cache: StorageCache

    beforeEach(() => {
      cache = new StorageCache({ type: CacheType.ORDERED_MAP, size: 100 })
    })

    describe('basic operations', () => {
      it('should put and get a storage value', () => {
        cache.put(address1, key1, value1)
        const result = cache.get(address1, key1)
        expect(result).toEqual(value1)
      })

      it('should return undefined for non-existent storage', () => {
        const result = cache.get(address1, key1)
        expect(result).toBeUndefined()
      })

      it('should handle multiple storage slots for same address', () => {
        cache.put(address1, key1, value1)
        cache.put(address1, key2, value2)
        cache.put(address1, key3, value3)
        
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toEqual(value2)
        expect(cache.get(address1, key3)).toEqual(value3)
      })

      it('should handle delete operation', () => {
        cache.put(address1, key1, value1)
        cache.del(address1, key1)
        const result = cache.get(address1, key1)
        expect(result).toEqual(hexToBytes('0x80'))
      })

      it('should not have size limit for OrderedMap', () => {
        // Add more than LRU limit
        for (let i = 0; i < 10; i++) {
          const addr = Address.fromString(`0x${i.toString().padStart(40, '0')}`)
          cache.put(addr, key1, value1)
        }
        expect(cache.size()).toBe(10)
      })

      it('should handle clearContractStorage', () => {
        cache.put(address1, key1, value1)
        cache.put(address1, key2, value2)
        
        cache.clearContractStorage(address1)
        
        expect(cache.get(address1, key1)).toBeUndefined()
        expect(cache.get(address1, key2)).toBeUndefined()
      })
    })

    describe('checkpoint operations', () => {
      it('should handle single checkpoint and revert', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint()
        cache.put(address1, key2, value2)
        cache.put(address1, key1, value2) // Overwrite
        
        cache.revert()
        
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toBeUndefined()
      })

      it('should handle single checkpoint and commit', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint()
        cache.put(address1, key2, value2)
        
        cache.commit()
        
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toEqual(value2)
      })

      it('should handle nested checkpoints with revert', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint() // checkpoint 1
        cache.put(address1, key2, value2)
        cache.checkpoint() // checkpoint 2
        cache.put(address1, key3, value3)
        cache.del(address1, key1)
        
        cache.revert() // revert checkpoint 2
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toEqual(value2)
        expect(cache.get(address1, key3)).toBeUndefined()
        
        cache.revert() // revert checkpoint 1
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toBeUndefined()
      })

      it('should handle nested checkpoints with mixed commit/revert', () => {
        cache.put(address1, key1, value1)
        cache.checkpoint() // checkpoint 1
        cache.put(address1, key2, value2)
        cache.checkpoint() // checkpoint 2
        cache.put(address1, key3, value3)
        
        cache.commit() // commit checkpoint 2
        cache.put(address1, key1, value3) // Overwrite
        
        cache.revert() // revert checkpoint 1
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toBeUndefined()
        expect(cache.get(address1, key3)).toBeUndefined()
      })

      it('should handle complex nested storage diff merging on commit', () => {
        // Set up initial state
        cache.put(address1, key1, value1)
        cache.put(address2, key1, value1)
        
        cache.checkpoint() // checkpoint 1
        cache.put(address1, key2, value2)
        cache.put(address2, key2, value2)
        
        cache.checkpoint() // checkpoint 2
        cache.put(address1, key3, value3)
        cache.put(address2, key1, value3) // Overwrite
        
        cache.commit() // Merge checkpoint 2 into 1
        
        // Check merged state
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toEqual(value2)
        expect(cache.get(address1, key3)).toEqual(value3)
        expect(cache.get(address2, key1)).toEqual(value3)
        expect(cache.get(address2, key2)).toEqual(value2)
        
        cache.revert() // Revert to initial state
        expect(cache.get(address1, key1)).toEqual(value1)
        expect(cache.get(address1, key2)).toBeUndefined()
        expect(cache.get(address1, key3)).toBeUndefined()
        expect(cache.get(address2, key1)).toEqual(value1)
        expect(cache.get(address2, key2)).toBeUndefined()
      })
    })

    describe('flush operations', () => {
      it('should flush modified storage slots', () => {
        cache.put(address1, key1, value1)
        cache.put(address1, key2, value2)
        
        const flushed = cache.flush()
        expect(flushed).toHaveLength(2)
      })

      it('should handle flush with no modifications', () => {
        const flushed = cache.flush()
        expect(flushed).toHaveLength(0)
      })
    })

    describe('statistics', () => {
      it('should track operations correctly', () => {
        cache.put(address1, key1, value1) // 1 write
        cache.put(address1, key2, value2) // 1 write
        cache.get(address1, key1) // 1 read, 1 hit
        cache.get(address2, key1) // 1 read, 0 hits (miss)
        cache.del(address1, key2) // 1 del
        
        const stats = cache.stats(false)
        expect(stats.writes).toBe(2)
        expect(stats.reads).toBe(2)
        expect(stats.hits).toBe(1)
        expect(stats.dels).toBe(1)
        expect(stats.size).toBe(1) // One address in cache
      })
    })

    describe('utility methods', () => {
      it('should return correct size', () => {
        expect(cache.size()).toBe(0)
        cache.put(address1, key1, value1)
        expect(cache.size()).toBe(1)
        cache.put(address2, key1, value2)
        expect(cache.size()).toBe(2)
      })

      it('should clear cache', () => {
        cache.put(address1, key1, value1)
        cache.put(address2, key2, value2)
        expect(cache.size()).toBe(2)
        
        cache.clear()
        expect(cache.size()).toBe(0)
        expect(cache.get(address1, key1)).toBeUndefined()
        expect(cache.get(address2, key2)).toBeUndefined()
      })
    })
  })

  describe('Edge cases', () => {
    let cache: StorageCache

    beforeEach(() => {
      cache = new StorageCache({ type: CacheType.LRU, size: 3 })
    })

    it('should handle multiple updates to same storage slot', () => {
      cache.put(address1, key1, value1)
      cache.put(address1, key1, value2)
      cache.put(address1, key1, value3)
      
      const result = cache.get(address1, key1)
      expect(result).toEqual(value3)
      
      const stats = cache.stats(false)
      expect(stats.writes).toBe(3)
    })

    it('should handle checkpoint with no changes', () => {
      cache.put(address1, key1, value1)
      cache.checkpoint()
      // No changes
      cache.commit()
      
      expect(cache.get(address1, key1)).toEqual(value1)
    })

    it('should handle empty flush at different checkpoint levels', () => {
      cache.checkpoint()
      const flushed1 = cache.flush()
      expect(flushed1).toHaveLength(0)
      
      cache.checkpoint()
      const flushed2 = cache.flush()
      expect(flushed2).toHaveLength(0)
    })

    it('should maintain checkpoint counter correctly', () => {
      expect(cache['_checkpoints']).toBe(0)
      cache.checkpoint()
      expect(cache['_checkpoints']).toBe(1)
      cache.checkpoint()
      expect(cache['_checkpoints']).toBe(2)
      cache.revert()
      expect(cache['_checkpoints']).toBe(1)
      cache.commit()
      expect(cache['_checkpoints']).toBe(0)
    })

    it('should handle operations after clear', () => {
      cache.put(address1, key1, value1)
      cache.clear()
      
      cache.put(address2, key2, value2)
      expect(cache.get(address2, key2)).toEqual(value2)
      expect(cache.size()).toBe(1)
    })

    it('should handle delete on non-existent storage slot', () => {
      cache.del(address1, key1)
      expect(cache.get(address1, key1)).toEqual(hexToBytes('0x80'))
    })

    it('should handle clearContractStorage on empty address', () => {
      cache.clearContractStorage(address1)
      expect(cache.get(address1, key1)).toBeUndefined()
    })

    it('should handle revert with undefined values in OrderedMap', () => {
      const orderedCache = new StorageCache({ type: CacheType.ORDERED_MAP, size: 100 })
      orderedCache.checkpoint()
      orderedCache.put(address1, key1, value1)
      
      // Manually set up a scenario with falsy value
      const diffMap = orderedCache['_diffCache'][1]
      diffMap.set(bytesToUnprefixedHex(address2.bytes), new Map([[bytesToUnprefixedHex(key2), undefined]]))
      
      orderedCache.revert()
      expect(orderedCache.get(address1, key1)).toBeUndefined()
    })
  })

  describe('DEBUG mode', () => {
    it('should initialize DEBUG from environment', () => {
      const originalEnv = process.env.DEBUG
      process.env.DEBUG = 'ethjs'
      const debugCache = new StorageCache({ type: CacheType.LRU, size: 10 })
      expect(debugCache['DEBUG']).toBe(true)
      process.env.DEBUG = originalEnv
    })

    it('should work without DEBUG environment', () => {
      const originalEnv = process.env.DEBUG
      delete process.env.DEBUG
      const cache = new StorageCache({ type: CacheType.LRU, size: 10 })
      expect(cache['DEBUG']).toBe(false)
      process.env.DEBUG = originalEnv
    })
  })
})