import { namespace, runWithContext, runWithContextAsync, getContextValue } from '../../../../src/utils/RequestContext'

describe('RequestContext', () => {
  afterEach(() => {
    // Clean up any active context - namespace.exit() requires a context to be active
    // No cleanup needed as contexts are automatically cleaned up when run() completes
  })

  describe('runWithContext', () => {
    it('should run function within context with provided values', () => {
      const context = { userId: '123', requestId: 'abc' }
      let retrievedUserId: string | undefined
      let retrievedRequestId: string | undefined

      runWithContext(() => {
        retrievedUserId = getContextValue<string>('userId')
        retrievedRequestId = getContextValue<string>('requestId')
      }, context)

      expect(retrievedUserId).toBe('123')
      expect(retrievedRequestId).toBe('abc')
    })

    it('should handle empty context', () => {
      const context = {}
      let value: any

      runWithContext(() => {
        value = getContextValue<string>('nonexistent')
      }, context)

      expect(value).toBeUndefined()
    })

    it('should handle multiple nested values in context', () => {
      const context = {
        user: { id: 1, name: 'John' },
        metadata: { timestamp: Date.now() },
        flags: ['admin', 'verified']
      }
      let retrievedUser: any
      let retrievedMetadata: any
      let retrievedFlags: any

      runWithContext(() => {
        retrievedUser = getContextValue<any>('user')
        retrievedMetadata = getContextValue<any>('metadata')
        retrievedFlags = getContextValue<any>('flags')
      }, context)

      expect(retrievedUser).toEqual({ id: 1, name: 'John' })
      expect(retrievedMetadata).toHaveProperty('timestamp')
      expect(retrievedFlags).toEqual(['admin', 'verified'])
    })

    it('should isolate context between different runs', () => {
      let value1: string | undefined
      let value2: string | undefined

      runWithContext(() => {
        value1 = getContextValue<string>('key')
      }, { key: 'value1' })

      runWithContext(() => {
        value2 = getContextValue<string>('key')
      }, { key: 'value2' })

      expect(value1).toBe('value1')
      expect(value2).toBe('value2')
    })

    it('should handle errors thrown in the function', () => {
      const context = { test: 'value' }
      const error = new Error('Test error')

      expect(() => {
        runWithContext(() => {
          throw error
        }, context)
      }).toThrow('Test error')
    })

    it('should allow context modification within the function', () => {
      const context = { initial: 'value' }
      let modifiedValue: string | undefined

      runWithContext(() => {
        namespace.set('modified', 'new value')
        modifiedValue = getContextValue<string>('modified')
      }, context)

      expect(modifiedValue).toBe('new value')
    })
  })

  describe('runWithContextAsync', () => {
    it('should run async function within context with provided values', async () => {
      const context = { userId: '456', requestId: 'def' }
      let retrievedUserId: string | undefined
      let retrievedRequestId: string | undefined

      await runWithContextAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        retrievedUserId = getContextValue<string>('userId')
        retrievedRequestId = getContextValue<string>('requestId')
      }, context)

      expect(retrievedUserId).toBe('456')
      expect(retrievedRequestId).toBe('def')
    })

    it('should handle Promise rejection', async () => {
      const context = { test: 'value' }
      const error = new Error('Async error')

      await expect(
        runWithContextAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          throw error
        }, context)
      ).rejects.toThrow('Async error')
    })

    it('should maintain context across async operations', async () => {
      const context = { counter: 0 }
      const results: number[] = []

      await runWithContextAsync(async () => {
        namespace.set('counter', 1)
        results.push(getContextValue<number>('counter')!)
        
        await new Promise(resolve => setTimeout(resolve, 10))
        namespace.set('counter', 2)
        results.push(getContextValue<number>('counter')!)
        
        await new Promise(resolve => setTimeout(resolve, 10))
        namespace.set('counter', 3)
        results.push(getContextValue<number>('counter')!)
      }, context)

      expect(results).toEqual([1, 2, 3])
    })

    it('should handle sync function returning void', async () => {
      const context = { sync: true }
      let executed = false

      await runWithContextAsync(() => {
        executed = true
      }, context)

      expect(executed).toBe(true)
    })

    it('should handle parallel async operations', async () => {
      const context = { parallel: true }
      const results: string[] = []

      await runWithContextAsync(async () => {
        await Promise.all([
          (async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
            results.push('operation1')
          })(),
          (async () => {
            await new Promise(resolve => setTimeout(resolve, 5))
            results.push('operation2')
          })(),
        ])
      }, context)

      expect(results).toContain('operation1')
      expect(results).toContain('operation2')
      expect(results.length).toBe(2)
    })
  })

  describe('getContextValue', () => {
    it('should return undefined when called outside of context', () => {
      const value = getContextValue<string>('anyKey')
      expect(value).toBeUndefined()
    })

    it('should handle different value types', () => {
      const context = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        object: { nested: 'value' },
        array: [1, 2, 3]
      }

      runWithContext(() => {
        expect(getContextValue<string>('string')).toBe('text')
        expect(getContextValue<number>('number')).toBe(42)
        expect(getContextValue<boolean>('boolean')).toBe(true)
        expect(getContextValue<null>('null')).toBe(null)
        expect(getContextValue<undefined>('undefined')).toBe(undefined)
        expect(getContextValue<any>('object')).toEqual({ nested: 'value' })
        expect(getContextValue<number[]>('array')).toEqual([1, 2, 3])
      }, context)
    })

    it('should handle special characters in keys', () => {
      const context = {
        'key-with-dash': 'value1',
        'key.with.dot': 'value2',
        'key with space': 'value3',
        'key_with_underscore': 'value4'
      }

      runWithContext(() => {
        expect(getContextValue<string>('key-with-dash')).toBe('value1')
        expect(getContextValue<string>('key.with.dot')).toBe('value2')
        expect(getContextValue<string>('key with space')).toBe('value3')
        expect(getContextValue<string>('key_with_underscore')).toBe('value4')
      }, context)
    })
  })

  describe('namespace', () => {
    it('should expose the cls-hooked namespace', () => {
      expect(namespace).toBeDefined()
      expect(namespace.name).toBe('request-context')
    })

    it('should handle namespace operations directly', () => {
      namespace.run(() => {
        namespace.set('direct', 'value')
        expect(namespace.get('direct')).toBe('value')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle circular references in context', () => {
      const obj: any = { name: 'circular' }
      obj.self = obj
      const context = { circular: obj }

      runWithContext(() => {
        const retrieved = getContextValue<any>('circular')
        expect(retrieved.name).toBe('circular')
        expect(retrieved.self).toBe(retrieved)
      }, context)
    })

    it('should handle very large contexts', () => {
      const largeContext: Record<string, any> = {}
      for (let i = 0; i < 1000; i++) {
        largeContext[`key${i}`] = `value${i}`
      }

      runWithContext(() => {
        expect(getContextValue<string>('key0')).toBe('value0')
        expect(getContextValue<string>('key500')).toBe('value500')
        expect(getContextValue<string>('key999')).toBe('value999')
      }, largeContext)
    })

    it('should handle overwriting context values', () => {
      const context = { key: 'initial' }
      let values: string[] = []

      runWithContext(() => {
        values.push(getContextValue<string>('key')!)
        namespace.set('key', 'modified')
        values.push(getContextValue<string>('key')!)
      }, context)

      expect(values).toEqual(['initial', 'modified'])
    })
  })
})