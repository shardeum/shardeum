import * as cacheExports from '../../../../../src/state/cache/index'
import { AccountCache } from '../../../../../src/state/cache/account'
import { StorageCache } from '../../../../../src/state/cache/storage'
import { CacheType, CacheOpts } from '../../../../../src/state/cache/types'

describe('Cache Index Exports', () => {
  it('should export AccountCache', () => {
    expect(cacheExports.AccountCache).toBeDefined()
    expect(cacheExports.AccountCache).toBe(AccountCache)
  })

  it('should export StorageCache', () => {
    expect(cacheExports.StorageCache).toBeDefined()
    expect(cacheExports.StorageCache).toBe(StorageCache)
  })

  it('should export CacheType enum', () => {
    expect(cacheExports.CacheType).toBeDefined()
    expect(cacheExports.CacheType).toBe(CacheType)
    expect(cacheExports.CacheType.LRU).toBe('lru')
    expect(cacheExports.CacheType.ORDERED_MAP).toBe('ordered_map')
  })

  it('should export CacheOpts interface through type checking', () => {
    // TypeScript will verify at compile time that CacheOpts is exported
    const testOpts: cacheExports.CacheOpts = {
      size: 100,
      type: cacheExports.CacheType.LRU
    }
    expect(testOpts.size).toBe(100)
    expect(testOpts.type).toBe('lru')
  })

  it('should allow creating instances through exported classes', () => {
    const accountCache = new cacheExports.AccountCache({
      size: 10,
      type: cacheExports.CacheType.LRU
    })
    expect(accountCache).toBeInstanceOf(AccountCache)

    const storageCache = new cacheExports.StorageCache({
      size: 10,
      type: cacheExports.CacheType.ORDERED_MAP
    })
    expect(storageCache).toBeInstanceOf(StorageCache)
  })

  it('should have all expected exports', () => {
    const expectedExports = [
      'AccountCache',
      'StorageCache',
      'CacheType'
    ]
    
    const actualExports = Object.keys(cacheExports).filter(key => key !== 'default')
    
    expectedExports.forEach(exportName => {
      expect(actualExports).toContain(exportName)
    })
  })
})