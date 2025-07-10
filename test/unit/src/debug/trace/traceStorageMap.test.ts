import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { TraceStorageMap } from '../../../../../src/debug/trace/traceStorageMap'
import { ITraceData } from '../../../../../src/debug/trace/traceDataFactory'

// Mock ITraceData implementation
class MockTraceData implements ITraceData {
  constructor(private value: string) {}

  toBuffer(): Buffer {
    return Buffer.from(this.value)
  }

  toString(): string {
    return this.value
  }

  toJSON(): string {
    return `json_${this.value}`
  }
}

describe('TraceStorageMap', () => {
  let traceStorageMap: TraceStorageMap

  beforeEach(() => {
    traceStorageMap = new TraceStorageMap()
  })

  describe('constructor and inheritance', () => {
    it('should create an instance of TraceStorageMap', () => {
      expect(traceStorageMap).toBeInstanceOf(TraceStorageMap)
    })

    it('should inherit from Map', () => {
      expect(traceStorageMap).toBeInstanceOf(Map)
    })

    it('should start empty', () => {
      expect(traceStorageMap.size).toBe(0)
    })
  })

  describe('Map functionality', () => {
    it('should set and get ITraceData entries', () => {
      const key = new MockTraceData('key1')
      const value = new MockTraceData('value1')

      traceStorageMap.set(key, value)

      expect(traceStorageMap.get(key)).toBe(value)
      expect(traceStorageMap.size).toBe(1)
    })

    it('should handle multiple entries', () => {
      const entries: Array<[MockTraceData, MockTraceData]> = [
        [new MockTraceData('key1'), new MockTraceData('value1')],
        [new MockTraceData('key2'), new MockTraceData('value2')],
        [new MockTraceData('key3'), new MockTraceData('value3')]
      ]

      entries.forEach(([key, value]) => {
        traceStorageMap.set(key, value)
      })

      expect(traceStorageMap.size).toBe(3)
      
      entries.forEach(([key, value]) => {
        expect(traceStorageMap.get(key)).toBe(value)
      })
    })

    it('should support has() method', () => {
      const key = new MockTraceData('key1')
      const value = new MockTraceData('value1')

      expect(traceStorageMap.has(key)).toBe(false)
      
      traceStorageMap.set(key, value)
      
      expect(traceStorageMap.has(key)).toBe(true)
    })

    it('should support delete() method', () => {
      const key = new MockTraceData('key1')
      const value = new MockTraceData('value1')

      traceStorageMap.set(key, value)
      expect(traceStorageMap.has(key)).toBe(true)

      const deleted = traceStorageMap.delete(key)
      
      expect(deleted).toBe(true)
      expect(traceStorageMap.has(key)).toBe(false)
      expect(traceStorageMap.size).toBe(0)
    })

    it('should support clear() method', () => {
      traceStorageMap.set(new MockTraceData('key1'), new MockTraceData('value1'))
      traceStorageMap.set(new MockTraceData('key2'), new MockTraceData('value2'))
      
      expect(traceStorageMap.size).toBe(2)

      traceStorageMap.clear()

      expect(traceStorageMap.size).toBe(0)
    })
  })

  describe('toJSON method', () => {
    it('should return empty object for empty map', () => {
      const result = traceStorageMap.toJSON()
      
      expect(result).toEqual({})
    })

    it('should convert single entry to JSON object', () => {
      const key = new MockTraceData('key1')
      const value = new MockTraceData('value1')
      
      traceStorageMap.set(key, value)
      
      const result = traceStorageMap.toJSON()
      
      expect(result).toEqual({
        'json_key1': value
      })
    })

    it('should convert multiple entries to JSON object', () => {
      const entries: Array<[MockTraceData, MockTraceData]> = [
        [new MockTraceData('key1'), new MockTraceData('value1')],
        [new MockTraceData('key2'), new MockTraceData('value2')],
        [new MockTraceData('key3'), new MockTraceData('value3')]
      ]

      entries.forEach(([key, value]) => {
        traceStorageMap.set(key, value)
      })

      const result = traceStorageMap.toJSON()

      expect(result).toEqual({
        'json_key1': entries[0][1],
        'json_key2': entries[1][1],
        'json_key3': entries[2][1]
      })
    })

    it('should use key.toJSON() for object keys', () => {
      const mockKey = {
        toJSON: jest.fn(() => 'custom_json_key')
      } as unknown as ITraceData
      
      const value = new MockTraceData('value')
      
      traceStorageMap.set(mockKey, value)
      
      const result = traceStorageMap.toJSON()
      
      expect(mockKey.toJSON).toHaveBeenCalled()
      expect(result).toEqual({
        'custom_json_key': value
      })
    })

    it('should handle complex keys with special characters', () => {
      const key = new MockTraceData('key/with:special@chars')
      const value = new MockTraceData('value')
      
      traceStorageMap.set(key, value)
      
      const result = traceStorageMap.toJSON()
      
      expect(result).toEqual({
        'json_key/with:special@chars': value
      })
    })

    it('should preserve value references in JSON output', () => {
      const key = new MockTraceData('key')
      const value = new MockTraceData('value')
      
      traceStorageMap.set(key, value)
      
      const result = traceStorageMap.toJSON()
      
      // Value should be the same reference, not converted
      expect(result['json_key']).toBe(value)
    })
  })

  describe('iteration', () => {
    it('should support for...of iteration', () => {
      const entries: Array<[MockTraceData, MockTraceData]> = [
        [new MockTraceData('key1'), new MockTraceData('value1')],
        [new MockTraceData('key2'), new MockTraceData('value2')]
      ]

      entries.forEach(([key, value]) => {
        traceStorageMap.set(key, value)
      })

      const collected: Array<[ITraceData, ITraceData]> = []
      for (const entry of traceStorageMap) {
        collected.push(entry)
      }

      expect(collected.length).toBe(2)
    })

    it('should support keys() iterator', () => {
      const key1 = new MockTraceData('key1')
      const key2 = new MockTraceData('key2')
      
      traceStorageMap.set(key1, new MockTraceData('value1'))
      traceStorageMap.set(key2, new MockTraceData('value2'))

      const keys = Array.from(traceStorageMap.keys())
      
      expect(keys).toContain(key1)
      expect(keys).toContain(key2)
      expect(keys.length).toBe(2)
    })

    it('should support values() iterator', () => {
      const value1 = new MockTraceData('value1')
      const value2 = new MockTraceData('value2')
      
      traceStorageMap.set(new MockTraceData('key1'), value1)
      traceStorageMap.set(new MockTraceData('key2'), value2)

      const values = Array.from(traceStorageMap.values())
      
      expect(values).toContain(value1)
      expect(values).toContain(value2)
      expect(values.length).toBe(2)
    })
  })
})