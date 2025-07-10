import { Account, Address, bytesToUnprefixedHex } from '@ethereumjs/util'
import { AccountCache } from '../../../../../src/state/cache/account'
import { CacheType } from '../../../../../src/state/cache/types'

describe('AccountCache', () => {
  let address1: Address
  let address2: Address
  let address3: Address
  let account1: Account
  let account2: Account
  let account3: Account

  beforeEach(() => {
    address1 = Address.fromString('0x1234567890123456789012345678901234567890')
    address2 = Address.fromString('0x2345678901234567890123456789012345678901')
    address3 = Address.fromString('0x3456789012345678901234567890123456789012')
    
    account1 = Account.fromAccountData({
      nonce: BigInt(1),
      balance: BigInt(1000),
    })
    account2 = Account.fromAccountData({
      nonce: BigInt(2),
      balance: BigInt(2000),
    })
    account3 = Account.fromAccountData({
      nonce: BigInt(3),
      balance: BigInt(3000),
    })
  })

  describe('LRU Cache Implementation', () => {
    let cache: AccountCache

    beforeEach(() => {
      cache = new AccountCache({ type: CacheType.LRU, size: 2 })
    })

    describe('basic operations', () => {
      it('should put and get an account', () => {
        cache.put(address1, account1)
        const result = cache.get(address1)
        expect(result).toBeDefined()
        expect(result!.accountRLP).toEqual(account1.serialize())
      })

      it('should put and get undefined account', () => {
        cache.put(address1, undefined)
        const result = cache.get(address1)
        expect(result).toBeDefined()
        expect(result!.accountRLP).toBeUndefined()
      })

      it('should return undefined for non-existent account', () => {
        const result = cache.get(address1)
        expect(result).toBeUndefined()
      })

      it('should handle delete operation', () => {
        cache.put(address1, account1)
        cache.del(address1)
        const result = cache.get(address1)
        expect(result).toBeDefined()
        expect(result!.accountRLP).toBeUndefined()
      })

      it('should respect LRU size limit', () => {
        cache.put(address1, account1)
        cache.put(address2, account2)
        cache.put(address3, account3) // This should evict address1
        
        expect(cache.get(address1)).toBeUndefined()
        expect(cache.get(address2)).toBeDefined()
        expect(cache.get(address3)).toBeDefined()
      })

      it('should update age on get', () => {
        cache.put(address1, account1)
        cache.put(address2, account2)
        cache.get(address1) // Updates age of address1
        cache.put(address3, account3) // Should evict address2, not address1
        
        expect(cache.get(address1)).toBeDefined()
        expect(cache.get(address2)).toBeUndefined()
        expect(cache.get(address3)).toBeDefined()
      })
    })

    describe('checkpoint operations', () => {
      it('should handle single checkpoint and revert', () => {
        cache.put(address1, account1)
        cache.checkpoint()
        cache.put(address2, account2)
        cache.put(address1, account2) // Overwrite
        
        cache.revert()
        
        expect(cache.get(address1)!.accountRLP).toEqual(account1.serialize())
        expect(cache.get(address2)).toBeUndefined()
      })

      it('should handle single checkpoint and commit', () => {
        cache.put(address1, account1)
        cache.checkpoint()
        cache.put(address2, account2)
        
        cache.commit()
        
        expect(cache.get(address1)).toBeDefined()
        expect(cache.get(address2)).toBeDefined()
      })

      it('should handle nested checkpoints with revert', () => {
        // Use larger cache size to avoid LRU eviction during test
        const largerCache = new AccountCache({ type: CacheType.LRU, size: 5 })
        largerCache.put(address1, account1)
        largerCache.checkpoint() // checkpoint 1
        largerCache.put(address2, account2)
        largerCache.checkpoint() // checkpoint 2
        largerCache.put(address3, account3)
        largerCache.del(address1)
        
        largerCache.revert() // revert checkpoint 2
        expect(largerCache.get(address1)!.accountRLP).toEqual(account1.serialize())
        expect(largerCache.get(address2)!.accountRLP).toEqual(account2.serialize())
        expect(largerCache.get(address3)).toBeUndefined()
        
        largerCache.revert() // revert checkpoint 1
        expect(largerCache.get(address1)!.accountRLP).toEqual(account1.serialize())
        expect(largerCache.get(address2)).toBeUndefined()
      })

      it('should handle nested checkpoints with mixed commit/revert', () => {
        // Use larger cache size to avoid LRU eviction during test
        const largerCache = new AccountCache({ type: CacheType.LRU, size: 5 })
        largerCache.put(address1, account1)
        largerCache.checkpoint() // checkpoint 1
        largerCache.put(address2, account2)
        largerCache.checkpoint() // checkpoint 2
        largerCache.put(address3, account3)
        
        largerCache.commit() // commit checkpoint 2
        largerCache.put(address1, account3) // Overwrite
        
        largerCache.revert() // revert checkpoint 1
        expect(largerCache.get(address1)!.accountRLP).toEqual(account1.serialize())
        expect(largerCache.get(address2)).toBeUndefined()
        expect(largerCache.get(address3)).toBeUndefined()
      })

      it('should handle delete in checkpoint and revert', () => {
        cache.put(address1, account1)
        cache.checkpoint()
        cache.del(address1)
        
        cache.revert()
        expect(cache.get(address1)!.accountRLP).toEqual(account1.serialize())
      })

      it('should handle adding non-existent item in checkpoint and revert', () => {
        cache.checkpoint()
        cache.put(address1, account1)
        
        cache.revert()
        expect(cache.get(address1)).toBeUndefined()
      })
    })

    describe('flush operations', () => {
      it('should flush modified accounts', () => {
        cache.put(address1, account1)
        cache.put(address2, account2)
        
        const flushed = cache.flush()
        expect(flushed).toHaveLength(2)
        
        const flushedAddresses = flushed.map(([addr]) => addr)
        expect(flushedAddresses).toContain(bytesToUnprefixedHex(address1.bytes))
        expect(flushedAddresses).toContain(bytesToUnprefixedHex(address2.bytes))
      })

      it('should only flush accounts modified at current checkpoint', () => {
        cache.put(address1, account1)
        cache.checkpoint()
        cache.put(address2, account2)
        
        const flushed = cache.flush()
        expect(flushed).toHaveLength(1)
        expect(flushed[0][0]).toBe(bytesToUnprefixedHex(address2.bytes))
      })

      it('should clear diff cache after flush', () => {
        cache.put(address1, account1)
        cache.flush()
        
        cache.put(address2, account2)
        const flushed = cache.flush()
        expect(flushed).toHaveLength(1)
        expect(flushed[0][0]).toBe(bytesToUnprefixedHex(address2.bytes))
      })

      it('should include deleted accounts in flush', () => {
        cache.put(address1, account1)
        cache.del(address1)
        
        const flushed = cache.flush()
        expect(flushed).toHaveLength(1)
        expect(flushed[0][1].accountRLP).toBeUndefined()
      })
    })

    describe('statistics', () => {
      it('should track reads, hits, writes, and deletes', () => {
        cache.put(address1, account1) // 1 write
        cache.get(address1) // 1 read, 1 hit
        cache.get(address2) // 1 read, 0 hits (miss)
        cache.del(address1) // 1 del
        
        const stats = cache.stats(false)
        expect(stats.writes).toBe(1)
        expect(stats.reads).toBe(2)
        expect(stats.hits).toBe(1)
        expect(stats.dels).toBe(1)
        expect(stats.size).toBe(1) // One item in cache
      })

      it('should reset stats when requested', () => {
        cache.put(address1, account1)
        cache.get(address1)
        
        const stats1 = cache.stats(true)
        expect(stats1.writes).toBe(1)
        
        const stats2 = cache.stats(false)
        expect(stats2.writes).toBe(0)
      })
    })

    describe('utility methods', () => {
      it('should return correct size', () => {
        expect(cache.size()).toBe(0)
        cache.put(address1, account1)
        expect(cache.size()).toBe(1)
        cache.put(address2, account2)
        expect(cache.size()).toBe(2)
      })

      it('should clear cache', () => {
        cache.put(address1, account1)
        cache.put(address2, account2)
        expect(cache.size()).toBe(2)
        
        cache.clear()
        expect(cache.size()).toBe(0)
        expect(cache.get(address1)).toBeUndefined()
        expect(cache.get(address2)).toBeUndefined()
      })
    })
  })

  describe('OrderedMap Cache Implementation', () => {
    let cache: AccountCache

    beforeEach(() => {
      cache = new AccountCache({ type: CacheType.ORDERED_MAP, size: 100 })
    })

    describe('basic operations', () => {
      it('should put and get an account', () => {
        cache.put(address1, account1)
        const result = cache.get(address1)
        expect(result).toBeDefined()
        expect(result!.accountRLP).toEqual(account1.serialize())
      })

      it('should put and get undefined account', () => {
        cache.put(address1, undefined)
        const result = cache.get(address1)
        expect(result).toBeDefined()
        expect(result!.accountRLP).toBeUndefined()
      })

      it('should return undefined for non-existent account', () => {
        const result = cache.get(address1)
        expect(result).toBeUndefined()
      })

      it('should handle delete operation', () => {
        cache.put(address1, account1)
        cache.del(address1)
        const result = cache.get(address1)
        expect(result).toBeDefined()
        expect(result!.accountRLP).toBeUndefined()
      })

      it('should not have size limit for OrderedMap', () => {
        // Add more than LRU limit
        for (let i = 0; i < 10; i++) {
          const addr = Address.fromString(`0x${i.toString().padStart(40, '0')}`)
          cache.put(addr, account1)
        }
        expect(cache.size()).toBe(10)
      })
    })

    describe('checkpoint operations', () => {
      it('should handle single checkpoint and revert', () => {
        cache.put(address1, account1)
        cache.checkpoint()
        cache.put(address2, account2)
        cache.put(address1, account2) // Overwrite
        
        cache.revert()
        
        expect(cache.get(address1)!.accountRLP).toEqual(account1.serialize())
        expect(cache.get(address2)).toBeUndefined()
      })

      it('should handle single checkpoint and commit', () => {
        cache.put(address1, account1)
        cache.checkpoint()
        cache.put(address2, account2)
        
        cache.commit()
        
        expect(cache.get(address1)).toBeDefined()
        expect(cache.get(address2)).toBeDefined()
      })

      it('should handle nested checkpoints with revert', () => {
        cache.put(address1, account1)
        cache.checkpoint() // checkpoint 1
        cache.put(address2, account2)
        cache.checkpoint() // checkpoint 2
        cache.put(address3, account3)
        cache.del(address1)
        
        cache.revert() // revert checkpoint 2
        expect(cache.get(address1)!.accountRLP).toEqual(account1.serialize())
        expect(cache.get(address2)!.accountRLP).toEqual(account2.serialize())
        expect(cache.get(address3)).toBeUndefined()
        
        cache.revert() // revert checkpoint 1
        expect(cache.get(address1)!.accountRLP).toEqual(account1.serialize())
        expect(cache.get(address2)).toBeUndefined()
      })

      it('should handle nested checkpoints with mixed commit/revert', () => {
        cache.put(address1, account1)
        cache.checkpoint() // checkpoint 1
        cache.put(address2, account2)
        cache.checkpoint() // checkpoint 2
        cache.put(address3, account3)
        
        cache.commit() // commit checkpoint 2
        cache.put(address1, account3) // Overwrite
        
        cache.revert() // revert checkpoint 1
        expect(cache.get(address1)!.accountRLP).toEqual(account1.serialize())
        expect(cache.get(address2)).toBeUndefined()
        expect(cache.get(address3)).toBeUndefined()
      })
    })

    describe('flush operations', () => {
      it('should flush modified accounts', () => {
        cache.put(address1, account1)
        cache.put(address2, account2)
        
        const flushed = cache.flush()
        expect(flushed).toHaveLength(2)
        
        const flushedAddresses = flushed.map(([addr]) => addr)
        expect(flushedAddresses).toContain(bytesToUnprefixedHex(address1.bytes))
        expect(flushedAddresses).toContain(bytesToUnprefixedHex(address2.bytes))
      })

      it('should handle flush with no modifications', () => {
        const flushed = cache.flush()
        expect(flushed).toHaveLength(0)
      })
    })

    describe('statistics', () => {
      it('should track operations correctly', () => {
        cache.put(address1, account1) // 1 write
        cache.put(address2, account2) // 1 write
        cache.get(address1) // 1 read, 1 hit
        cache.get(address3) // 1 read, 0 hits (miss)
        cache.del(address2) // 1 del
        
        const stats = cache.stats(false)
        expect(stats.writes).toBe(2)
        expect(stats.reads).toBe(2)
        expect(stats.hits).toBe(1)
        expect(stats.dels).toBe(1)
        expect(stats.size).toBe(2) // Two items in cache
      })
    })

    describe('utility methods', () => {
      it('should return correct size', () => {
        expect(cache.size()).toBe(0)
        cache.put(address1, account1)
        expect(cache.size()).toBe(1)
        cache.put(address2, account2)
        expect(cache.size()).toBe(2)
        cache.del(address1)
        expect(cache.size()).toBe(2) // Deleted items still count
      })

      it('should clear cache', () => {
        cache.put(address1, account1)
        cache.put(address2, account2)
        expect(cache.size()).toBe(2)
        
        cache.clear()
        expect(cache.size()).toBe(0)
        expect(cache.get(address1)).toBeUndefined()
        expect(cache.get(address2)).toBeUndefined()
      })
    })
  })

  describe('Edge cases', () => {
    let cache: AccountCache

    beforeEach(() => {
      cache = new AccountCache({ type: CacheType.LRU, size: 3 })
    })

    it('should handle multiple updates to same address', () => {
      cache.put(address1, account1)
      cache.put(address1, account2)
      cache.put(address1, account3)
      
      const result = cache.get(address1)
      expect(result!.accountRLP).toEqual(account3.serialize())
      
      const stats = cache.stats(false)
      expect(stats.writes).toBe(3)
    })

    it('should handle checkpoint with no changes', () => {
      cache.put(address1, account1)
      cache.checkpoint()
      // No changes
      cache.commit()
      
      expect(cache.get(address1)).toBeDefined()
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
      cache.put(address1, account1)
      cache.clear()
      
      cache.put(address2, account2)
      expect(cache.get(address2)).toBeDefined()
      expect(cache.size()).toBe(1)
    })
  })

  describe('DEBUG mode', () => {
    it('should initialize DEBUG from environment', () => {
      const originalEnv = process.env.DEBUG
      process.env.DEBUG = 'ethjs'
      const debugCache = new AccountCache({ type: CacheType.LRU, size: 10 })
      expect(debugCache['DEBUG']).toBe(true)
      process.env.DEBUG = originalEnv
    })

    it('should work without DEBUG environment', () => {
      const originalEnv = process.env.DEBUG
      delete process.env.DEBUG
      const cache = new AccountCache({ type: CacheType.LRU, size: 10 })
      expect(cache['DEBUG']).toBe(false)
      process.env.DEBUG = originalEnv
    })
  })
})