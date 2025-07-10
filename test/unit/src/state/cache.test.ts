import { describe, beforeEach, test, expect, jest, beforeAll } from '@jest/globals'
import { Account, Address } from '@ethereumjs/util'
import Tree from 'functional-red-black-tree'
import Cache from '../../../../src/state/cache'
import { ShardeumAccount } from '../../../../src/shardeum/shardeumTypes'

/**
 * Test suite for Cache class
 * 
 * Tests the functionality of the state cache system which maintains account state
 * using functional red-black trees with checkpoint and flush capabilities.
 */
describe('Cache', () => {
  // Mock components
  let mockTrie: jest.Mocked<any>
  let cache: Cache
  
  // Test addresses
  const address1 = new Address(Buffer.from('0x1234567890123456789012345678901234567890'.slice(2), 'hex'))
  const address2 = new Address(Buffer.from('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'.slice(2), 'hex'))
  
  // Test accounts
  const account1 = new Account()
  const account2 = new Account()
  
  beforeAll(() => {
    // Set up the accounts with some distinguishing properties
    account1.balance = BigInt(100)
    account1.nonce = BigInt(1)
    account2.balance = BigInt(200)
    account2.nonce = BigInt(2)
  })
  
  beforeEach(() => {
    // Create a fresh mock trie for each test
    mockTrie = Tree()
    
    // Mock trie functions
    mockTrie.get = jest.fn()
    mockTrie.put = jest.fn()
    mockTrie.del = jest.fn()
    
    // Create a fresh cache instance for each test
    cache = new Cache(mockTrie)
  })
  
  describe('put method', () => {
    test('should add an account to the cache', () => {
      cache.put(address1, account1)
      
      const retrievedAccount = cache.lookup(address1)
      expect(retrievedAccount).toBeDefined()
      expect(retrievedAccount!.balance).toEqual(BigInt(100))
    })
    
    test('should flag account as modified when added from outside the trie', () => {
      cache.put(address1, account1, false) // false = not from trie
      
      // Test by implementing a flush and checking if trie.put was called
      cache.flush()
      expect(mockTrie.put).toHaveBeenCalled()
    })
    
    test('should not flag account as modified when loaded from trie', () => {
      cache.put(address1, account1, true) // true = from trie
      
      // Test by implementing a flush and checking if trie.put was NOT called
      cache.flush()
      expect(mockTrie.put).not.toHaveBeenCalled()
    })
    
    test('should update an existing account in the cache', () => {
      cache.put(address1, account1)
      
      const modifiedAccount = new Account()
      modifiedAccount.balance = BigInt(150)
      cache.put(address1, modifiedAccount)
      
      const retrievedAccount = cache.lookup(address1)
      expect(retrievedAccount).toBeDefined()
      expect(retrievedAccount!.balance).toEqual(BigInt(150))
    })
  })
  
  describe('get method', () => {
    test('should return the account if it exists in cache', () => {
      cache.put(address1, account1)
      
      const result = cache.get(address1)
      expect(result.balance).toEqual(BigInt(100))
    })
    
    test('should return an empty account if the address does not exist', () => {
      const result = cache.get(address2)
      expect(result).toBeInstanceOf(Account)
      expect(result.balance).toEqual(BigInt(0))
    })
  })
  
  describe('lookup method', () => {
    test('should return the account if it exists in cache', () => {
      cache.put(address1, account1)
      
      const result = cache.lookup(address1)
      expect(result).toBeDefined()
      expect(result!.balance).toEqual(BigInt(100))
    })
    
    test('should return undefined if the address does not exist', () => {
      const result = cache.lookup(address2)
      expect(result).toBeUndefined()
    })
    
    test('should preserve virtual flag on the account', () => {
      const virtualAccount = new Account() as ShardeumAccount
      virtualAccount.virtual = true
      
      cache._update(address1, virtualAccount, false, false, true)
      
      const result = cache.lookup(address1) as ShardeumAccount
      expect(result).toBeDefined()
      expect(result.virtual).toBe(true)
    })
  })
  
  describe('keyIsDeleted method', () => {
    test('should return true for deleted keys', () => {
      cache.put(address1, account1)
      cache.del(address1)
      
      expect(cache.keyIsDeleted(address1)).toBe(true)
    })
    
    test('should return false for existing keys', () => {
      cache.put(address1, account1)
      
      expect(cache.keyIsDeleted(address1)).toBe(false)
    })
    
    test('should return false for non-existent keys', () => {
      expect(cache.keyIsDeleted(address2)).toBe(false)
    })
  })
  
  describe('getOrLoad method', () => {
    test('should return account from cache if it exists', async () => {
      cache.put(address1, account1)
      
      const result = await cache.getOrLoad(address1)
      expect(result.balance).toEqual(BigInt(100))
    })
    
    test('should load account from trie if not in cache', async () => {
      const trieAccount = new Account()
      trieAccount.balance = BigInt(300)
      
      mockTrie.get.mockResolvedValue(trieAccount.serialize())
      
      const result = await cache.getOrLoad(address1)
      expect(result.balance).toEqual(BigInt(300))
    })
    
    test('should create new account if not found in trie', async () => {
      mockTrie.get.mockResolvedValue(null)
      
      const result = await cache.getOrLoad(address1) as ShardeumAccount
      expect(result).toBeInstanceOf(Account)
      expect(result.balance).toEqual(BigInt(0))
      expect(result.virtual).toBe(true)
    })
  })
  
  describe('warm method', () => {
    test('should load accounts from trie and add to cache', async () => {
      const trieAccount = new Account()
      trieAccount.balance = BigInt(300)
      
      mockTrie.get.mockResolvedValue(trieAccount.serialize())
      
      await cache.warm([address1.toString().slice(2)])
      
      const result = cache.lookup(address1)
      expect(result).toBeDefined()
      expect(result!.balance).toEqual(BigInt(300))
    })
    
    test('should handle missing accounts by creating empty ones', async () => {
      mockTrie.get.mockResolvedValue(null)
      
      await cache.warm([address1.toString().slice(2)])
      
      const result = cache.lookup(address1)
      expect(result).toBeDefined()
      expect(result!.balance).toEqual(BigInt(0))
    })
    
    test('should handle empty address array', async () => {
      await cache.warm([])
      expect(mockTrie.get).not.toHaveBeenCalled()
    })
  })
  
  describe('flush method', () => {
    test('should update modified accounts in the trie', async () => {
      cache.put(address1, account1)
      
      await cache.flush()
      
      expect(mockTrie.put).toHaveBeenCalled()
      expect(mockTrie.put.mock.calls[0][0]).toBeTruthy()
      expect(mockTrie.put.mock.calls[0][1]).toEqual(account1.serialize())
    })
    
    test('should delete accounts marked for deletion', async () => {
      cache.put(address1, account1)
      cache.del(address1)
      
      await cache.flush()
      
      expect(mockTrie.del).toHaveBeenCalled()
      expect(mockTrie.del.mock.calls[0][0]).toBeTruthy()
    })
    
    test('should not update unmodified accounts', async () => {
      cache.put(address1, account1, true) // from trie, not modified
      
      await cache.flush()
      
      expect(mockTrie.put).not.toHaveBeenCalled()
    })
    
    test('should not update deleted accounts if they were never modified', async () => {
      // This is an edge case - account isn't in cache, but we delete it
      cache.del(address1)
      
      await cache.flush()
      
      expect(mockTrie.del).toHaveBeenCalled()
    })
  })
  
  describe('checkpoint and revert methods', () => {
    test('should restore state after checkpoint and revert', () => {
      cache.put(address1, account1)
      
      cache.checkpoint()
      
      // Modify state after checkpoint
      cache.put(address1, account2)
      cache.put(address2, account2)
      
      // Verify changes were made
      expect(cache.get(address1).balance).toEqual(BigInt(200))
      expect(cache.get(address2).balance).toEqual(BigInt(200))
      
      // Revert to checkpoint
      cache.revert()
      
      // Verify original state is restored
      expect(cache.get(address1).balance).toEqual(BigInt(100))
      expect(cache.lookup(address2)).toBeUndefined()
    })
    
    test('should handle multiple checkpoint/revert operations', () => {
      // Initial state
      cache.put(address1, account1)
      
      // First checkpoint
      cache.checkpoint()
      cache.put(address1, account2)
      
      // Second checkpoint
      cache.checkpoint()
      cache.del(address1)
      
      // Verify deletion
      expect(cache.lookup(address1)).toBeDefined()
      expect(cache.keyIsDeleted(address1)).toBe(true)
      
      // Revert to second checkpoint
      cache.revert()
      
      // Verify state after first revert
      expect(cache.get(address1).balance).toEqual(BigInt(200))
      
      // Revert to first checkpoint
      cache.revert()
      
      // Verify original state
      expect(cache.get(address1).balance).toEqual(BigInt(100))
    })
  })
  
  describe('commit method', () => {
    test('should preserve changes but remove checkpoint', () => {
      cache.put(address1, account1)
      
      cache.checkpoint()
      
      // Modify state after checkpoint
      cache.put(address1, account2)
      
      // Commit changes
      cache.commit()
      
      // Verify changes are preserved
      expect(cache.get(address1).balance).toEqual(BigInt(200))
      
      // Verify checkpoint is removed (by checking cache._checkpoints is empty)
      expect(cache._checkpoints.length).toBe(0)
    })
  })
  
  describe('clear method', () => {
    test('should remove all entries from cache', () => {
      cache.put(address1, account1)
      cache.put(address2, account2)
      
      cache.clear()
      
      expect(cache.lookup(address1)).toBeUndefined()
      expect(cache.lookup(address2)).toBeUndefined()
    })
  })
  
  describe('del method', () => {
    test('should mark an account as deleted', () => {
      cache.put(address1, account1)
      
      cache.del(address1)
      
      expect(cache.keyIsDeleted(address1)).toBe(true)
    })
    
    test('should mark non-existent accounts as deleted', () => {
      cache.del(address1)
      
      expect(cache.keyIsDeleted(address1)).toBe(true)
    })
  })
  
  describe('_update method', () => {
    test('should update an existing account in the cache', () => {
      cache.put(address1, account1)
      
      const modifiedAccount = new Account()
      modifiedAccount.balance = BigInt(150)
      
      cache._update(address1, modifiedAccount, true, false)
      
      const result = cache.lookup(address1)
      expect(result).toBeDefined()
      expect(result!.balance).toEqual(BigInt(150))
    })
    
    test('should add a new account to the cache', () => {
      cache._update(address1, account1, true, false)
      
      const result = cache.lookup(address1)
      expect(result).toBeDefined()
      expect(result!.balance).toEqual(BigInt(100))
    })
    
    test('should mark account as virtual when specified', () => {
      cache._update(address1, account1, false, false, true)
      
      const result = cache.lookup(address1) as ShardeumAccount
      expect(result.virtual).toBe(true)
    })
  })
  
  describe('_lookupAccount method', () => {
    test('should retrieve account from trie', async () => {
      const trieAccount = new Account()
      trieAccount.balance = BigInt(300)
      
      mockTrie.get.mockResolvedValue(trieAccount.serialize())
      
      const result = await cache._lookupAccount(address1)
      expect(result).toBeDefined()
      expect(result!.balance).toEqual(BigInt(300))
      expect(mockTrie.get).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
    })
    
    test('should return undefined if account not in trie', async () => {
      mockTrie.get.mockResolvedValue(null)
      
      const result = await cache._lookupAccount(address1)
      expect(result).toBeUndefined()
    })
  })
  
  describe('Edge cases and concurrent operations', () => {
    test('should handle multiple checkpoints with complex state changes', () => {
      // Initial state
      cache.put(address1, account1)
      
      // First checkpoint
      cache.checkpoint()
      const modifiedAccount1 = new Account()
      modifiedAccount1.balance = BigInt(150)
      cache.put(address1, modifiedAccount1)
      cache.put(address2, account2)
      
      // Second checkpoint
      cache.checkpoint()
      cache.del(address1)
      const modifiedAccount2 = new Account()
      modifiedAccount2.balance = BigInt(250)
      cache.put(address2, modifiedAccount2)
      
      // Third checkpoint
      cache.checkpoint()
      const newAccount = new Account()
      newAccount.balance = BigInt(300)
      cache.put(address1, newAccount)
      
      // Verify current state
      expect(cache.get(address1).balance).toEqual(BigInt(300))
      expect(cache.get(address2).balance).toEqual(BigInt(250))
      
      // Revert third checkpoint
      cache.revert()
      expect(cache.keyIsDeleted(address1)).toBe(true)
      expect(cache.get(address2).balance).toEqual(BigInt(250))
      
      // Revert second checkpoint
      cache.revert()
      expect(cache.get(address1).balance).toEqual(BigInt(150))
      expect(cache.get(address2).balance).toEqual(BigInt(200))
      
      // Revert first checkpoint
      cache.revert()
      expect(cache.get(address1).balance).toEqual(BigInt(100))
      expect(cache.lookup(address2)).toBeUndefined()
    })
    
    test('should handle warm with null addresses in array', async () => {
      await cache.warm([null as any, undefined as any, ''])
      expect(mockTrie.get).not.toHaveBeenCalled()
    })
    
    test('should handle warm with invalid hex addresses', async () => {
      // The warm method will throw on invalid hex, so we test that it throws
      await expect(cache.warm(['invalid-hex'])).rejects.toThrow()
      
      // Valid but short hex should also throw due to invalid address length
      await expect(cache.warm(['0x12'])).rejects.toThrow('Invalid address length')
    })
    
    test('should handle flush with no modifications', async () => {
      // Add account from trie (not modified)
      cache.put(address1, account1, true)
      
      await cache.flush()
      
      expect(mockTrie.put).not.toHaveBeenCalled()
      expect(mockTrie.del).not.toHaveBeenCalled()
    })
    
    test('should handle flush with mixed operations', async () => {
      // Modified account
      cache.put(address1, account1)
      
      // Deleted account that was modified
      cache.put(address2, account2)
      cache.del(address2)
      
      // Account from trie (not modified)
      const account3 = new Account()
      account3.balance = BigInt(300)
      const address3 = new Address(Buffer.from('0xfedcba9876543210fedcba9876543210fedcba98'.slice(2), 'hex'))
      cache.put(address3, account3, true)
      
      await cache.flush()
      
      // Should update modified account
      expect(mockTrie.put).toHaveBeenCalledTimes(1)
      expect(mockTrie.put).toHaveBeenCalledWith(
        expect.any(Buffer),
        account1.serialize()
      )
      
      // Should delete the deleted account
      expect(mockTrie.del).toHaveBeenCalledTimes(1)
      
      // Should verify the deleted account's state after flush
      const deletedAccount = cache.lookup(address2)
      expect(deletedAccount).toBeDefined()
      expect(cache.keyIsDeleted(address2)).toBe(true)
    })
    
    test('should handle checkpoint and commit with no changes', () => {
      cache.put(address1, account1)
      
      cache.checkpoint()
      // No changes
      cache.commit()
      
      expect(cache.get(address1).balance).toEqual(BigInt(100))
      expect(cache._checkpoints.length).toBe(0)
    })
    
    test('should handle deep checkpoint nesting', () => {
      const checkpointCount = 10
      cache.put(address1, account1)
      
      // Create nested checkpoints
      for (let i = 0; i < checkpointCount; i++) {
        cache.checkpoint()
        const account = new Account()
        account.balance = BigInt((i + 2) * 100)
        cache.put(address1, account)
      }
      
      // Verify we have the correct number of checkpoints
      expect(cache._checkpoints.length).toBe(checkpointCount)
      expect(cache.get(address1).balance).toEqual(BigInt(1100))
      
      // Revert all checkpoints
      for (let i = checkpointCount; i > 0; i--) {
        cache.revert()
        expect(cache.get(address1).balance).toEqual(BigInt(i * 100))
      }
      
      // Back to original state
      expect(cache.get(address1).balance).toEqual(BigInt(100))
      expect(cache._checkpoints.length).toBe(0)
    })
    
    test('should handle operations on cache after clear', () => {
      cache.put(address1, account1)
      cache.put(address2, account2)
      
      cache.clear()
      
      // Should be able to add new accounts after clear
      cache.put(address1, account2)
      expect(cache.get(address1).balance).toEqual(BigInt(200))
      
      // Old account2 should not exist
      expect(cache.lookup(address2)).toBeUndefined()
    })
    
    test('should handle virtual flag correctly through serialization', () => {
      const virtualAccount = new Account() as ShardeumAccount
      virtualAccount.balance = BigInt(100)
      virtualAccount.virtual = true
      
      cache._update(address1, virtualAccount, false, false, true)
      
      // The virtual flag should be preserved when looking up
      const retrieved = cache.lookup(address1) as ShardeumAccount
      expect(retrieved.virtual).toBe(true)
      expect(retrieved.balance).toEqual(BigInt(100))
    })
    
    test('should handle getOrLoad with concurrent modifications', async () => {
      const trieAccount = new Account()
      trieAccount.balance = BigInt(300)
      
      mockTrie.get.mockResolvedValue(trieAccount.serialize())
      
      // Pre-populate cache before getOrLoad
      cache.put(address1, account1)
      
      // Now getOrLoad should return the cached version
      const result = await cache.getOrLoad(address1)
      
      // Should return the cached version, not the trie version
      expect(result.balance).toEqual(BigInt(100))
      
      // Trie should not have been called since account was in cache
      expect(mockTrie.get).not.toHaveBeenCalled()
    })
    
    test('should handle empty cache iterations in flush', async () => {
      // Create an empty cache
      const emptyCache = new Cache(mockTrie)
      
      await emptyCache.flush()
      
      expect(mockTrie.put).not.toHaveBeenCalled()
      expect(mockTrie.del).not.toHaveBeenCalled()
    })
  })
}) 