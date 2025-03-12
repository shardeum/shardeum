import {
  _base10BNParser,
  _base16BNParser,
  _readableSHM,
  convertBigIntsToHex,
  debug_map_replacer,
  isObject,
} from '../../../../src/utils/serialization'

describe('Serialization Utility Functions', () => {
  describe('isObject', () => {
    it('should return true for a simple object', () => {
      expect(isObject({})).toBe(true)
    })

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false)
    })

    it('should return false for an array', () => {
      expect(isObject([])).toBe(false)
    })

    it('should return true for a function', () => {
      expect(isObject(() => {})).toBe(true)
    })

    it('should return false for a primitive type', () => {
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isObject(undefined)).toBe(false)
    })

    it('should return false for NaN', () => {
      expect(isObject(NaN)).toBe(false)
    })
  })

  describe('convertBigIntsToHex', () => {
    it('should convert bigint to hex string', () => {
      expect(convertBigIntsToHex(BigInt(12345))).toBe('0x3039')
    })

    it('should convert bigints in an object to hex strings', () => {
      const obj = { a: BigInt(123), b: { c: BigInt(456) } }
      const expected = { a: '0x7b', b: { c: '0x1c8' } }
      expect(convertBigIntsToHex(obj)).toEqual(expected)
    })

    it('should convert bigints in an array to hex strings', () => {
      const arr = [BigInt(123), { a: BigInt(456) }]
      const expected = ['0x7b', { a: '0x1c8' }]
      expect(convertBigIntsToHex(arr)).toEqual(expected)
    })

    it('should handle non-bigint values gracefully', () => {
      const obj = { a: 'test', b: 123, c: true }
      expect(convertBigIntsToHex(obj)).toEqual(obj)
    })

    it('should handle undefined values', () => {
      const obj = { a: undefined }
      expect(convertBigIntsToHex(obj)).toEqual({ a: undefined })
    })

    it('should handle null values', () => {
      const obj = { a: null }
      expect(convertBigIntsToHex(obj)).toEqual({ a: null })
    })

    it('should handle circular references', () => {
      const obj: any = { a: 1 }
      obj.self = obj
      expect(() => convertBigIntsToHex(obj)).toThrow()
    })
  })

  describe('_base16BNParser', () => {
    it('should convert a hex string to bigint', () => {
      expect(_base16BNParser('1234')).toBe(BigInt('0x1234'))
    })

    it('should throw an error for hex strings with 0x prefix', () => {
      expect(() => _base16BNParser('0x1234')).toThrow()
    })

    it('should convert a bigint to bigint', () => {
      expect(_base16BNParser(BigInt(1234))).toBe(BigInt(1234))
    })

    it('should convert an object containing a __BigInt__ property to BigInt', () => {
      const obj = { __BigInt__: '1234' }
      expect(_base16BNParser(obj)).toBe(BigInt(1234))
    })

    it('should throw an error for invalid input', () => {
      expect(() => _base16BNParser('test')).toThrow()
    })

    it('should throw an error for undefined input', () => {
      expect(() => _base16BNParser(undefined as any)).toThrow('Unacceptable parameter value')
    })

    it('should throw an error for null input', () => {
      expect(() => _base16BNParser(null as any)).toThrow('Unacceptable parameter value')
    })

    it('should throw an error for invalid __BigInt__ object', () => {
      const obj = { __BigInt__: 'invalid' }
      expect(() => _base16BNParser(obj)).toThrow()
    })

    it('should throw an error for empty string input', () => {
      expect(() => _base16BNParser('')).toThrow()
    })
  })

  describe('_base10BNParser', () => {
    it('should convert a numeric string to bigint', () => {
      expect(_base10BNParser('1234')).toBe(BigInt(1234))
    })

    it('should convert a bigint to bigint', () => {
      expect(_base10BNParser(BigInt(1234))).toBe(BigInt(1234))
    })

    it('should throw an error for invalid input', () => {
      expect(() => _base10BNParser('test')).toThrow()
    })

    it('should throw an error for undefined input', () => {
      expect(() => _base10BNParser(undefined as any)).toThrow('Unacceptable parameter value')
    })

    it('should throw an error for null input', () => {
      expect(() => _base10BNParser(null as any)).toThrow('Unacceptable parameter value')
    })

    // TODO: fix the code to handle empty string input
    // it('should throw an error for empty string input', () => {
    //   expect(() => _base10BNParser('')).toThrow()
    // })

    it('should throw an error for non-numeric string input', () => {
      expect(() => _base10BNParser('abc')).toThrow('valid base 10')
    })

    it('should throw an error for decimal numbers', () => {
      expect(() => _base10BNParser('123.45')).toThrow()
    })
  })

  describe('_readableSHM', () => {
    it('should format a bigint as SHM with decimal when length > 14', () => {
      const num = BigInt('12345678901234567890123')
      expect(_readableSHM(num)).toBe('12345.678901234567890123 shm')
    })

    it('should format a bigint as SHM with decimal and a leading zero when floating index is less than or equal to zero', () => {
      const num = BigInt('123456789012345678')
      expect(_readableSHM(num)).toBe('0.123456789012345678 shm')
    })

    it('should format a bigint as wei when length <= 14', () => {
      const num = BigInt('12345678901234')
      expect(_readableSHM(num)).toBe('12345678901234 wei')
    })

    it('should return the Wei value correctly, even when autoDecimal is false', () => {
      const num = BigInt('12345678901234567890')
      expect(_readableSHM(num, false)).toBe('12345678901234567890 wei')
    })

    it('should throw an error for undefined input', () => {
      expect(() => _readableSHM(undefined as any)).toThrow('valid bigint instance')
    })

    it('should throw an error for null input', () => {
      expect(() => _readableSHM(null as any)).toThrow('valid bigint instance')
    })

    it('should throw an error for non-bigint input', () => {
      expect(() => _readableSHM(123 as any)).toThrow('valid bigint instance')
    })

    // TODO: fix the code to handle negative bigint values
    // it('should handle negative bigint values', () => {
    //   const num = BigInt(-12345678901234567890123)
    //   expect(_readableSHM(num)).toBe('-12345.678901234567890123 shm')
    // })

    it('should handle zero value', () => {
      expect(_readableSHM(BigInt(0))).toBe('0 wei')
    })
  })

  describe('debug_map_replacer', () => {
    it('should convert a Map to an array of key-value pairs', () => {
      const map = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ])
      const result = debug_map_replacer('key', map)
      expect(result).toEqual([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ])
    })

    it('should return the value unchanged if it is not a Map', () => {
      const obj = { a: 1, b: 'test' }
      expect(debug_map_replacer('key', obj)).toEqual(obj)
    })

    it('should handle undefined value', () => {
      expect(debug_map_replacer('key', undefined)).toBe(undefined)
    })

    it('should handle null value', () => {
      expect(debug_map_replacer('key', null)).toBe(null)
    })

    it('should handle primitive values', () => {
      expect(debug_map_replacer('key', 123)).toBe(123)
      expect(debug_map_replacer('key', 'test')).toBe('test')
      expect(debug_map_replacer('key', true)).toBe(true)
    })
  })
})
