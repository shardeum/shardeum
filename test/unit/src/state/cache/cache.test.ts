import { Cache } from '../../../../../src/state/cache/cache'

// Mock debug module to avoid process access issues
jest.mock('debug', () => {
  const debugFn = jest.fn()
  const defaultExport = Object.assign(
    jest.fn(() => debugFn),
    {
      debug: jest.fn(() => debugFn)
    }
  )
  return {
    __esModule: true,
    default: defaultExport
  }
})

// Create a concrete implementation for testing
class TestCache extends Cache {
  testCheckpoint() {
    return this._checkpoints
  }

  testStats() {
    return this._stats
  }

  testDebug() {
    return this.DEBUG
  }

  testDebugLogger() {
    return this._debug
  }
}

describe('Cache Base Class', () => {
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const cache = new TestCache()
      
      expect(cache.testCheckpoint()).toBe(0)
      expect(cache.testStats()).toEqual({
        size: 0,
        reads: 0,
        hits: 0,
        writes: 0,
        dels: 0,
      })
    })

    it('should initialize debug logger', () => {
      const debugModule = require('debug')
      // Reset mock before test
      debugModule.default.mockClear()
      debugModule.default.debug.mockClear()
      
      const cache = new TestCache()
      // Check that debug was called with the correct namespace
      expect(debugModule.default.debug).toHaveBeenCalledWith('statemanager:cache')
    })
  })

  describe('DEBUG mode', () => {
    let originalEnv: string | undefined

    beforeEach(() => {
      originalEnv = process.env.DEBUG
    })

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.DEBUG = originalEnv
      } else {
        delete process.env.DEBUG
      }
    })

    it('should set DEBUG to true when ethjs is in DEBUG env', () => {
      process.env.DEBUG = 'ethjs'
      const cache = new TestCache()
      expect(cache.testDebug()).toBe(true)
    })

    it('should set DEBUG to true when ethjs is part of DEBUG env', () => {
      process.env.DEBUG = 'express,ethjs,other'
      const cache = new TestCache()
      expect(cache.testDebug()).toBe(true)
    })

    it('should set DEBUG to false when ethjs is not in DEBUG env', () => {
      process.env.DEBUG = 'express,other'
      const cache = new TestCache()
      expect(cache.testDebug()).toBe(false)
    })

    it('should set DEBUG to false when DEBUG env is not set', () => {
      delete process.env.DEBUG
      const cache = new TestCache()
      expect(cache.testDebug()).toBe(false)
    })

    it('should set DEBUG to false when DEBUG env is empty', () => {
      process.env.DEBUG = ''
      const cache = new TestCache()
      expect(cache.testDebug()).toBe(false)
    })

    it('should handle undefined process gracefully', () => {
      // This test simulates a browser environment where process might not be defined
      const originalProcess = global.process
      Object.defineProperty(global, 'process', {
        value: undefined,
        configurable: true
      })
      
      const cache = new TestCache()
      expect(cache.testDebug()).toBe(false)
      
      Object.defineProperty(global, 'process', {
        value: originalProcess,
        configurable: true
      })
    })

    it('should handle process without env property', () => {
      const originalProcess = global.process
      Object.defineProperty(global, 'process', {
        value: {},
        configurable: true
      })
      
      const cache = new TestCache()
      expect(cache.testDebug()).toBe(false)
      
      Object.defineProperty(global, 'process', {
        value: originalProcess,
        configurable: true
      })
    })
  })

  describe('protected properties', () => {
    it('should have checkpoints counter starting at 0', () => {
      const cache = new TestCache()
      expect(cache.testCheckpoint()).toBe(0)
    })

    it('should have stats object with all properties initialized to 0', () => {
      const cache = new TestCache()
      const stats = cache.testStats()
      
      expect(stats.size).toBe(0)
      expect(stats.reads).toBe(0)
      expect(stats.hits).toBe(0)
      expect(stats.writes).toBe(0)
      expect(stats.dels).toBe(0)
    })
  })

  describe('window environment check', () => {
    it('should set DEBUG to false in browser environment', () => {
      // Simulate browser environment
      const originalWindow = global.window
      const originalProcess = global.process
      global.window = {} as any
      
      // Ensure process exists for createDebugLogger to work properly
      if (!global.process) {
        Object.defineProperty(global, 'process', {
          value: { env: {} },
          configurable: true
        })
      }
      
      const cache = new TestCache()
      expect(cache.testDebug()).toBe(false)
      
      // @ts-ignore
      delete global.window
      if (originalWindow !== undefined) {
        global.window = originalWindow
      }
      if (originalProcess !== undefined) {
        Object.defineProperty(global, 'process', {
          value: originalProcess,
          configurable: true
        })
      }
    })
  })
})