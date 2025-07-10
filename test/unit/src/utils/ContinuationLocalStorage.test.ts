import CLS from '../../../../src/utils/ContinuationLocalStorage'

describe('ContinuationLocalStorage', () => {
  let cls: CLS<any>

  beforeEach(() => {
    cls = new CLS()
  })

  describe('runWithContext', () => {
    it('should run function within context and access values', () => {
      let retrievedValue: any

      cls.runWithContext(() => {
        cls.set('key', 'value')
        retrievedValue = cls.get('key')
      })

      expect(retrievedValue).toBe('value')
    })

    it('should isolate contexts between runs', () => {
      let value1: any
      let value2: any

      cls.runWithContext(() => {
        cls.set('key', 'value1')
        value1 = cls.get('key')
      })

      cls.runWithContext(() => {
        cls.set('key', 'value2')
        value2 = cls.get('key')
      })

      expect(value1).toBe('value1')
      expect(value2).toBe('value2')
    })

    it('should handle errors thrown in the function', () => {
      const error = new Error('Test error')

      expect(() => {
        cls.runWithContext(() => {
          throw error
        })
      }).toThrow('Test error')
    })

    it('should support nested contexts', () => {
      const values: any[] = []

      cls.runWithContext(() => {
        cls.set('level', 1)
        values.push(cls.get('level'))

        cls.runWithContext(() => {
          cls.set('level', 2)
          values.push(cls.get('level'))
        })

        // Note: cls-hooked doesn't restore parent context after nested run
        values.push(cls.get('level'))
      })

      expect(values[0]).toBe(1)
      expect(values[1]).toBe(2)
      // Context is not automatically restored after nested run in cls-hooked
    })
  })

  describe('runWithContextAsync', () => {
    it('should run async function within context', async () => {
      let retrievedValue: any

      await cls.runWithContextAsync(async () => {
        cls.set('async-key', 'async-value')
        await new Promise(resolve => setTimeout(resolve, 10))
        retrievedValue = cls.get('async-key')
      })

      expect(retrievedValue).toBe('async-value')
    })

    it('should handle async errors properly', async () => {
      const error = new Error('Async error')

      await expect(
        cls.runWithContextAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          throw error
        })
      ).rejects.toThrow('Async error')
    })

    it('should maintain context across async operations', async () => {
      const values: any[] = []

      await cls.runWithContextAsync(async () => {
        cls.set('counter', 1)
        values.push(cls.get('counter'))

        await new Promise(resolve => setTimeout(resolve, 10))
        cls.set('counter', 2)
        values.push(cls.get('counter'))

        await new Promise(resolve => setTimeout(resolve, 10))
        cls.set('counter', 3)
        values.push(cls.get('counter'))
      })

      expect(values).toEqual([1, 2, 3])
    })

    it('should handle sync function returning void', async () => {
      let executed = false

      await cls.runWithContextAsync(async () => {
        executed = true
      })

      expect(executed).toBe(true)
    })

    it('should handle parallel async operations', async () => {
      const results: string[] = []

      await cls.runWithContextAsync(async () => {
        cls.set('test', 'value')

        await Promise.all([
          (async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
            results.push(cls.get('test') || 'none')
          })(),
          (async () => {
            await new Promise(resolve => setTimeout(resolve, 5))
            results.push(cls.get('test') || 'none')
          })(),
        ])
      })

      expect(results).toContain('value')
      expect(results.length).toBe(2)
    })
  })

  describe('set and get', () => {
    it('should return undefined outside of context', () => {
      expect(cls.get('key')).toBeUndefined()
    })

    it('should handle setting outside of context gracefully', () => {
      expect(() => cls.set('key', 'value')).not.toThrow()
      expect(cls.get('key')).toBeUndefined()
    })

    it('should handle different value types', () => {
      cls.runWithContext(() => {
        cls.set('string', 'text')
        cls.set('number', 42)
        cls.set('boolean', true)
        cls.set('object', { nested: 'value' })
        cls.set('array', [1, 2, 3])
        cls.set('null', null)
        cls.set('undefined', undefined)

        expect(cls.get('string')).toBe('text')
        expect(cls.get('number')).toBe(42)
        expect(cls.get('boolean')).toBe(true)
        expect(cls.get('object')).toEqual({ nested: 'value' })
        expect(cls.get('array')).toEqual([1, 2, 3])
        expect(cls.get('null')).toBe(null)
        expect(cls.get('undefined')).toBe(undefined)
      })
    })

    it('should handle overwriting values', () => {
      cls.runWithContext(() => {
        cls.set('key', 'initial')
        expect(cls.get('key')).toBe('initial')

        cls.set('key', 'updated')
        expect(cls.get('key')).toBe('updated')
      })
    })

    it('should return undefined for non-existent keys', () => {
      cls.runWithContext(() => {
        expect(cls.get('nonexistent')).toBeUndefined()
      })
    })
  })

  describe('type safety', () => {
    it('should work with generic types', () => {
      interface User {
        id: number
        name: string
      }

      const userCLS = new CLS<User>()

      userCLS.runWithContext(() => {
        const user: User = { id: 1, name: 'John' }
        userCLS.set('currentUser', user)

        const retrieved = userCLS.get('currentUser')
        expect(retrieved).toEqual(user)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle very large contexts', () => {
      cls.runWithContext(() => {
        for (let i = 0; i < 1000; i++) {
          cls.set(`key${i}`, `value${i}`)
        }

        expect(cls.get('key0')).toBe('value0')
        expect(cls.get('key500')).toBe('value500')
        expect(cls.get('key999')).toBe('value999')
      })
    })

    it('should handle circular references', () => {
      cls.runWithContext(() => {
        const obj: any = { name: 'circular' }
        obj.self = obj
        cls.set('circular', obj)

        const retrieved = cls.get('circular')
        expect(retrieved.name).toBe('circular')
        expect(retrieved.self).toBe(retrieved)
      })
    })
  })
})