import { Address, hexToBytes } from '@ethereumjs/util'
import { OriginalStorageCache } from '../../../../../src/state/cache/originalStorageCache'

describe('OriginalStorageCache', () => {
  let address1: Address
  let address2: Address
  let key1: Uint8Array
  let key2: Uint8Array
  let value1: Uint8Array
  let value2: Uint8Array
  let mockGetContractStorage: jest.Mock

  beforeEach(() => {
    address1 = Address.fromString('0x1234567890123456789012345678901234567890')
    address2 = Address.fromString('0x2345678901234567890123456789012345678901')
    key1 = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000001')
    key2 = hexToBytes('0x0000000000000000000000000000000000000000000000000000000000000002')
    value1 = hexToBytes('0x01')
    value2 = hexToBytes('0x02')
    
    mockGetContractStorage = jest.fn()
  })

  describe('constructor', () => {
    it('should initialize with getContractStorage function', () => {
      const cache = new OriginalStorageCache(mockGetContractStorage)
      expect(cache).toBeDefined()
    })

    it('should initialize with empty internal map', () => {
      const cache = new OriginalStorageCache(mockGetContractStorage)
      expect(cache['map']).toBeDefined()
      expect(cache['map'].size).toBe(0)
    })
  })

  describe('get method', () => {
    it('should call getContractStorage with originalOnly=true', async () => {
      mockGetContractStorage.mockResolvedValue(value1)
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      const result = await cache.get(address1, key1)
      
      expect(mockGetContractStorage).toHaveBeenCalledWith(address1, key1, true)
      expect(result).toEqual(value1)
    })

    it('should always call getContractStorage directly', async () => {
      mockGetContractStorage.mockResolvedValue(value1)
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      // First call
      await cache.get(address1, key1)
      expect(mockGetContractStorage).toHaveBeenCalledTimes(1)
      
      // Second call to same address/key - should still call getContractStorage
      await cache.get(address1, key1)
      expect(mockGetContractStorage).toHaveBeenCalledTimes(2)
    })

    it('should handle different addresses and keys', async () => {
      mockGetContractStorage
        .mockResolvedValueOnce(value1)
        .mockResolvedValueOnce(value2)
      
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      const result1 = await cache.get(address1, key1)
      const result2 = await cache.get(address2, key2)
      
      expect(result1).toEqual(value1)
      expect(result2).toEqual(value2)
      expect(mockGetContractStorage).toHaveBeenCalledWith(address1, key1, true)
      expect(mockGetContractStorage).toHaveBeenCalledWith(address2, key2, true)
    })

    it('should propagate errors from getContractStorage', async () => {
      const error = new Error('Storage error')
      mockGetContractStorage.mockRejectedValue(error)
      
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      await expect(cache.get(address1, key1)).rejects.toThrow('Storage error')
    })
  })

  describe('put method', () => {
    it('should throw error when called', () => {
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      expect(() => {
        cache.put(address1, key1, value1)
      }).toThrow('OriginalStorageCache.put is not implemented')
    })

    it('should throw error with any parameters', () => {
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      expect(() => {
        cache.put(address2, key2, value2)
      }).toThrow('OriginalStorageCache.put is not implemented')
    })
  })

  describe('clear method', () => {
    it('should reset internal map', () => {
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      // Access internal map to verify it gets reset
      const initialMap = cache['map']
      cache.clear()
      const newMap = cache['map']
      
      expect(newMap).not.toBe(initialMap)
      expect(newMap.size).toBe(0)
    })

    it('should create new empty map on clear', () => {
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      // Add some dummy data to internal map
      cache['map'].set('test', new Map())
      expect(cache['map'].size).toBe(1)
      
      cache.clear()
      expect(cache['map'].size).toBe(0)
    })

    it('should allow operations after clear', async () => {
      mockGetContractStorage.mockResolvedValue(value1)
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      cache.clear()
      
      const result = await cache.get(address1, key1)
      expect(result).toEqual(value1)
      expect(mockGetContractStorage).toHaveBeenCalledWith(address1, key1, true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty values from getContractStorage', async () => {
      mockGetContractStorage.mockResolvedValue(new Uint8Array())
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      const result = await cache.get(address1, key1)
      expect(result).toEqual(new Uint8Array())
    })

    it('should handle undefined from getContractStorage', async () => {
      mockGetContractStorage.mockResolvedValue(undefined)
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      const result = await cache.get(address1, key1)
      expect(result).toBeUndefined()
    })

    it('should handle multiple clears', () => {
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      cache.clear()
      cache.clear()
      cache.clear()
      
      expect(cache['map'].size).toBe(0)
    })
  })

  describe('integration scenarios', () => {
    it('should work with async/await pattern', async () => {
      mockGetContractStorage.mockImplementation(async (address, key) => {
        // Simulate async behavior
        await new Promise(resolve => setTimeout(resolve, 10))
        return value1
      })
      
      const cache = new OriginalStorageCache(mockGetContractStorage)
      const result = await cache.get(address1, key1)
      
      expect(result).toEqual(value1)
    })

    it('should handle concurrent get requests', async () => {
      let callCount = 0
      mockGetContractStorage.mockImplementation(async () => {
        callCount++
        await new Promise(resolve => setTimeout(resolve, 10))
        return hexToBytes(`0x0${callCount}`)
      })
      
      const cache = new OriginalStorageCache(mockGetContractStorage)
      
      // Fire multiple requests concurrently
      const promises = [
        cache.get(address1, key1),
        cache.get(address1, key2),
        cache.get(address2, key1),
      ]
      
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(3)
      expect(mockGetContractStorage).toHaveBeenCalledTimes(3)
    })
  })
})