import { Stack } from '../../../../src/evm_v2/stack'
import { ERROR, EvmError } from '../../../../src/evm_v2/exceptions'
import { MAX_INTEGER_BIGINT } from '@ethereumjs/util'

// Helper to avoid BigInt literal syntax issues
const n = (value: number | string): bigint => BigInt(value)

describe('Stack', () => {
  let stack: Stack

  beforeEach(() => {
    stack = new Stack()
  })

  describe('constructor', () => {
    it('should create a stack with default max height of 1024', () => {
      expect(stack._maxHeight).toBe(1024)
      expect(stack._store).toEqual([])
    })

    it('should create a stack with custom max height', () => {
      const customStack = new Stack(512)
      expect(customStack._maxHeight).toBe(512)
    })
  })

  describe('length', () => {
    it('should return 0 for empty stack', () => {
      expect(stack.length).toBe(0)
    })

    it('should return correct length after pushing items', () => {
      stack.push(n(1))
      expect(stack.length).toBe(1)
      stack.push(n(2))
      expect(stack.length).toBe(2)
    })

    it('should update length after popping items', () => {
      stack.push(n(1))
      stack.push(n(2))
      stack.pop()
      expect(stack.length).toBe(1)
    })
  })

  describe('push', () => {
    it('should push bigint values onto the stack', () => {
      stack.push(n(42))
      expect(stack._store).toEqual([n(42)])
      expect(stack.length).toBe(1)
    })

    it('should throw INTERNAL_ERROR for non-bigint values', () => {
      expect(() => {
        // @ts-ignore - Testing runtime type check
        stack.push(42)
      }).toThrow(EvmError)
      
      try {
        // @ts-ignore - Testing runtime type check
        stack.push('42')
      } catch (e) {
        expect(e).toBeInstanceOf(EvmError)
        expect(e.error).toBe(ERROR.INTERNAL_ERROR)
      }
    })

    it('should throw OUT_OF_RANGE for values exceeding MAX_INTEGER_BIGINT', () => {
      const tooBig = MAX_INTEGER_BIGINT + n(1)
      expect(() => {
        stack.push(tooBig)
      }).toThrow(EvmError)
      
      try {
        stack.push(tooBig)
      } catch (e) {
        expect(e).toBeInstanceOf(EvmError)
        expect(e.error).toBe(ERROR.OUT_OF_RANGE)
      }
    })

    it('should accept MAX_INTEGER_BIGINT', () => {
      expect(() => {
        stack.push(MAX_INTEGER_BIGINT)
      }).not.toThrow()
      expect(stack._store[0]).toBe(MAX_INTEGER_BIGINT)
    })

    it('should throw STACK_OVERFLOW when exceeding max height', () => {
      const smallStack = new Stack(2)
      smallStack.push(n(1))
      smallStack.push(n(2))
      
      expect(() => {
        smallStack.push(n(3))
      }).toThrow(EvmError)
      
      try {
        smallStack.push(n(3))
      } catch (e) {
        expect(e).toBeInstanceOf(EvmError)
        expect(e.error).toBe(ERROR.STACK_OVERFLOW)
      }
    })

    it('should push multiple values in sequence', () => {
      stack.push(n(1))
      stack.push(n(2))
      stack.push(n(3))
      expect(stack._store).toEqual([n(1), n(2), n(3)])
    })
  })

  describe('pop', () => {
    it('should pop and return the top value', () => {
      stack.push(n(42))
      const value = stack.pop()
      expect(value).toBe(n(42))
      expect(stack.length).toBe(0)
    })

    it('should pop values in LIFO order', () => {
      stack.push(n(1))
      stack.push(n(2))
      stack.push(n(3))
      
      expect(stack.pop()).toBe(n(3))
      expect(stack.pop()).toBe(n(2))
      expect(stack.pop()).toBe(n(1))
    })

    it('should throw STACK_UNDERFLOW when popping from empty stack', () => {
      expect(() => {
        stack.pop()
      }).toThrow(EvmError)
      
      try {
        stack.pop()
      } catch (e) {
        expect(e).toBeInstanceOf(EvmError)
        expect(e.error).toBe(ERROR.STACK_UNDERFLOW)
      }
    })
  })

  describe('popN', () => {
    beforeEach(() => {
      stack.push(n(1))
      stack.push(n(2))
      stack.push(n(3))
      stack.push(n(4))
      stack.push(n(5))
    })

    it('should pop N items and return them in correct order', () => {
      const items = stack.popN(3)
      expect(items).toEqual([n(5), n(4), n(3)])
      expect(stack.length).toBe(2)
    })

    it('should pop 1 item by default', () => {
      const items = stack.popN()
      expect(items).toEqual([n(5)])
      expect(stack.length).toBe(4)
    })

    it('should return empty array when popping 0 items', () => {
      const items = stack.popN(0)
      expect(items).toEqual([])
      expect(stack.length).toBe(5)
    })

    it('should throw STACK_UNDERFLOW when popping more items than available', () => {
      expect(() => {
        stack.popN(6)
      }).toThrow(EvmError)
      
      try {
        stack.popN(10)
      } catch (e) {
        expect(e).toBeInstanceOf(EvmError)
        expect(e.error).toBe(ERROR.STACK_UNDERFLOW)
      }
    })

    it('should handle popping all items', () => {
      const items = stack.popN(5)
      expect(items).toEqual([n(5), n(4), n(3), n(2), n(1)])
      expect(stack.length).toBe(0)
    })
  })

  describe('peek', () => {
    beforeEach(() => {
      stack.push(n(1))
      stack.push(n(2))
      stack.push(n(3))
    })

    it('should peek at top item by default', () => {
      const items = stack.peek()
      expect(items).toEqual([n(3)])
      expect(stack.length).toBe(3) // Stack unchanged
    })

    it('should peek at multiple items', () => {
      const items = stack.peek(2)
      expect(items).toEqual([n(3), n(2)])
      expect(stack.length).toBe(3) // Stack unchanged
    })

    it('should throw STACK_UNDERFLOW when peeking more items than available', () => {
      expect(() => {
        stack.peek(4)
      }).toThrow(EvmError)
      
      try {
        stack.peek(10)
      } catch (e) {
        expect(e).toBeInstanceOf(EvmError)
        expect(e.error).toBe(ERROR.STACK_UNDERFLOW)
      }
    })

    it('should peek at all items', () => {
      const items = stack.peek(3)
      expect(items).toEqual([n(3), n(2), n(1)])
      expect(stack._store).toEqual([n(1), n(2), n(3)]) // Original order preserved
    })

    it('should handle peeking 0 items', () => {
      const items = stack.peek(0)
      expect(items).toEqual([])
    })
  })

  describe('swap', () => {
    beforeEach(() => {
      stack.push(n(1))
      stack.push(n(2))
      stack.push(n(3))
      stack.push(n(4))
    })

    it('should swap top with item at position 0 (no-op)', () => {
      stack.swap(0)
      expect(stack._store).toEqual([n(1), n(2), n(3), n(4)])
    })

    it('should swap top with item at position 1', () => {
      stack.swap(1)
      expect(stack._store).toEqual([n(1), n(2), n(4), n(3)])
    })

    it('should swap top with item at position 2', () => {
      stack.swap(2)
      expect(stack._store).toEqual([n(1), n(4), n(3), n(2)])
    })

    it('should swap top with bottom item', () => {
      stack.swap(3)
      expect(stack._store).toEqual([n(4), n(2), n(3), n(1)])
    })

    it('should throw STACK_UNDERFLOW when position exceeds stack size', () => {
      expect(() => {
        stack.swap(4)
      }).toThrow(EvmError)
      
      try {
        stack.swap(10)
      } catch (e) {
        expect(e).toBeInstanceOf(EvmError)
        expect(e.error).toBe(ERROR.STACK_UNDERFLOW)
      }
    })

    it('should handle swap on stack with 1 item', () => {
      const singleStack = new Stack()
      singleStack.push(n(42))
      singleStack.swap(0)
      expect(singleStack._store).toEqual([n(42)])
    })
  })

  describe('dup', () => {
    beforeEach(() => {
      stack.push(n(1))
      stack.push(n(2))
      stack.push(n(3))
    })

    it('should duplicate the top item (position 1)', () => {
      stack.dup(1)
      expect(stack._store).toEqual([n(1), n(2), n(3), n(3)])
    })

    it('should duplicate the second item (position 2)', () => {
      stack.dup(2)
      expect(stack._store).toEqual([n(1), n(2), n(3), n(2)])
    })

    it('should duplicate the bottom item', () => {
      stack.dup(3)
      expect(stack._store).toEqual([n(1), n(2), n(3), n(1)])
    })

    it('should throw STACK_UNDERFLOW when position exceeds stack size', () => {
      expect(() => {
        stack.dup(4)
      }).toThrow(EvmError)
      
      try {
        stack.dup(10)
      } catch (e) {
        expect(e).toBeInstanceOf(EvmError)
        expect(e.error).toBe(ERROR.STACK_UNDERFLOW)
      }
    })

    it('should handle duplicating when at max height', () => {
      const smallStack = new Stack(3)
      smallStack.push(n(1))
      smallStack.push(n(2))
      
      expect(() => {
        smallStack.dup(1)
      }).not.toThrow()
      expect(smallStack._store).toEqual([n(1), n(2), n(2)])
      
      expect(() => {
        smallStack.dup(1)
      }).toThrow(EvmError)
    })
  })

  describe('edge cases', () => {
    it('should handle operations with 0n', () => {
      stack.push(n(0))
      expect(stack.peek()).toEqual([n(0)])
      expect(stack.pop()).toBe(n(0))
    })

    it('should handle negative bigint values', () => {
      stack.push(n(-1))
      stack.push(n(-42))
      expect(stack.pop()).toBe(n(-42))
      expect(stack.pop()).toBe(n(-1))
    })

    it('should handle large bigint values within range', () => {
      const large = BigInt(2) ** BigInt(255)
      stack.push(large)
      expect(stack.pop()).toBe(large)
    })

    it('should maintain stack integrity after errors', () => {
      stack.push(n(1))
      stack.push(n(2))
      
      // Try invalid operation
      try {
        stack.pop()
        stack.pop()
        stack.pop() // This should throw
      } catch (e) {
        // Expected
      }
      
      // Stack should still be functional
      stack.push(n(3))
      expect(stack.pop()).toBe(n(3))
    })

    it('should handle rapid push/pop operations', () => {
      for (let i = 0; i < 100; i++) {
        stack.push(BigInt(i))
      }
      
      for (let i = 99; i >= 0; i--) {
        expect(stack.pop()).toBe(BigInt(i))
      }
      
      expect(stack.length).toBe(0)
    })
  })
})