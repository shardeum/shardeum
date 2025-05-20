import { hasProtocol, normalizeUrl } from '../../../../src/utils/requests'

describe('requests utilities', () => {
  describe('hasProtocol', () => {
    it('detects valid protocols', () => {
      expect(hasProtocol('http://foo')).toBe(true)
      expect(hasProtocol('https://bar')).toBe(true)
      expect(hasProtocol('HTTP://baz')).toBe(true)
      expect(hasProtocol('  https://qux  ')).toBe(true)
    })

    it('rejects strings without protocol', () => {
      expect(hasProtocol('foo.com')).toBe(false)
      expect(hasProtocol('examplehttp://foo')).toBe(false)
      expect(hasProtocol('')).toBe(false)
    })
  })

  describe('normalizeUrl', () => {
    it('adds http when missing', () => {
      expect(normalizeUrl('foo.com')).toBe('http://foo.com')
      expect(normalizeUrl('  bar ')).toBe('http://bar')
    })

    it('preserves existing protocol', () => {
      expect(normalizeUrl('https://foo')).toBe('https://foo')
      expect(normalizeUrl('  http://bar ')).toBe('http://bar')
    })
  })
})
