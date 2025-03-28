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
    account2.balance = BigInt(200)
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
}) 