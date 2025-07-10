import { CacheType, CacheOpts } from '../../../../../src/state/cache/types'

describe('Cache Types', () => {
  describe('CacheType Enum', () => {
    it('should have LRU value', () => {
      expect(CacheType.LRU).toBe('lru')
    })

    it('should have ORDERED_MAP value', () => {
      expect(CacheType.ORDERED_MAP).toBe('ordered_map')
    })

    it('should have exactly 2 enum values', () => {
      const enumValues = Object.values(CacheType)
      expect(enumValues).toHaveLength(2)
      expect(enumValues).toContain('lru')
      expect(enumValues).toContain('ordered_map')
    })

    it('should have correct enum keys', () => {
      const enumKeys = Object.keys(CacheType)
      expect(enumKeys).toContain('LRU')
      expect(enumKeys).toContain('ORDERED_MAP')
    })

    it('should be usable in switch statements', () => {
      const testCacheType = (type: CacheType): string => {
        switch (type) {
          case CacheType.LRU:
            return 'LRU Cache'
          case CacheType.ORDERED_MAP:
            return 'Ordered Map Cache'
          default:
            // This ensures exhaustive checking
            const _exhaustiveCheck: never = type
            return _exhaustiveCheck
        }
      }

      expect(testCacheType(CacheType.LRU)).toBe('LRU Cache')
      expect(testCacheType(CacheType.ORDERED_MAP)).toBe('Ordered Map Cache')
    })

    it('should be comparable', () => {
      const type1: CacheType = CacheType.LRU
      const type2: CacheType = CacheType.LRU
      const type3: CacheType = CacheType.ORDERED_MAP

      expect(type1).toBe(type2)
      expect(type1).not.toBe(type3)
      expect(type3).toBe(CacheType.ORDERED_MAP)
    })
  })

  describe('CacheOpts Interface', () => {
    it('should accept valid cache options', () => {
      const validOpts: CacheOpts = {
        size: 100,
        type: CacheType.LRU
      }

      expect(validOpts.size).toBe(100)
      expect(validOpts.type).toBe(CacheType.LRU)
    })

    it('should work with different cache types', () => {
      const lruOpts: CacheOpts = {
        size: 50,
        type: CacheType.LRU
      }

      const orderedMapOpts: CacheOpts = {
        size: 200,
        type: CacheType.ORDERED_MAP
      }

      expect(lruOpts.type).toBe('lru')
      expect(orderedMapOpts.type).toBe('ordered_map')
    })

    it('should work with various size values', () => {
      const smallCache: CacheOpts = {
        size: 1,
        type: CacheType.LRU
      }

      const largeCache: CacheOpts = {
        size: 1000000,
        type: CacheType.ORDERED_MAP
      }

      expect(smallCache.size).toBe(1)
      expect(largeCache.size).toBe(1000000)
    })

    it('should enforce required properties at compile time', () => {
      // This test verifies TypeScript compilation
      // The following would cause compilation errors if uncommented:
      // const invalidOpts1: CacheOpts = { size: 100 } // Missing type
      // const invalidOpts2: CacheOpts = { type: CacheType.LRU } // Missing size
      // const invalidOpts3: CacheOpts = {} // Missing both

      // Valid options compile successfully
      const validOpts: CacheOpts = {
        size: 100,
        type: CacheType.LRU
      }
      expect(validOpts).toBeDefined()
    })

    it('should be usable as function parameter type', () => {
      const createCacheWithOpts = (opts: CacheOpts): string => {
        return `Cache with size ${opts.size} and type ${opts.type}`
      }

      const result = createCacheWithOpts({
        size: 64,
        type: CacheType.ORDERED_MAP
      })

      expect(result).toBe('Cache with size 64 and type ordered_map')
    })

    it('should support object destructuring', () => {
      const opts: CacheOpts = {
        size: 128,
        type: CacheType.LRU
      }

      const { size, type } = opts
      expect(size).toBe(128)
      expect(type).toBe('lru')
    })

    it('should support spreading', () => {
      const baseOpts: CacheOpts = {
        size: 256,
        type: CacheType.LRU
      }

      const modifiedOpts: CacheOpts = {
        ...baseOpts,
        size: 512
      }

      expect(modifiedOpts.size).toBe(512)
      expect(modifiedOpts.type).toBe(CacheType.LRU)
    })
  })

  describe('Type safety', () => {
    it('should only accept valid CacheType values', () => {
      const isValidCacheType = (value: any): value is CacheType => {
        return Object.values(CacheType).includes(value)
      }

      expect(isValidCacheType('lru')).toBe(true)
      expect(isValidCacheType('ordered_map')).toBe(true)
      expect(isValidCacheType('invalid')).toBe(false)
      expect(isValidCacheType(123)).toBe(false)
      expect(isValidCacheType(null)).toBe(false)
    })

    it('should work with type guards', () => {
      const processCache = (opts: unknown): string => {
        if (isCacheOpts(opts)) {
          return `Valid cache: ${opts.type} with size ${opts.size}`
        }
        return 'Invalid cache options'
      }

      function isCacheOpts(obj: any): obj is CacheOpts {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          typeof obj.size === 'number' &&
          Object.values(CacheType).includes(obj.type)
        )
      }

      expect(processCache({ size: 100, type: CacheType.LRU })).toBe('Valid cache: lru with size 100')
      expect(processCache({ size: '100', type: CacheType.LRU })).toBe('Invalid cache options')
      expect(processCache({ size: 100, type: 'invalid' })).toBe('Invalid cache options')
      expect(processCache(null)).toBe('Invalid cache options')
    })
  })
})