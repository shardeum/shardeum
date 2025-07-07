import { VectorBufferStream } from '@shardeum-foundation/core'
import { serializeDevAccount, deserializeDevAccount, DevAccount } from '../../../../src/types/DevAccount'
import { TypeIdentifierEnum } from '../../../../src/types/enum/TypeIdentifierEnum'

describe('DevAccount', () => {
  const createTestDevAccount = (): DevAccount => ({
    accountType: 5,
    id: 'test-id-123',
    hash: 'test-hash-456',
    timestamp: 1234567890,
  })

  describe('serializeDevAccount', () => {
    it('should serialize a DevAccount without root identifier', () => {
      const stream = new VectorBufferStream(0)
      const account = createTestDevAccount()
      
      serializeDevAccount(stream, account, false)
      
      stream.position = 0
      expect(stream.readUInt8()).toBe(1) // version
      expect(stream.readUInt8()).toBe(1) // base account version
      expect(stream.readUInt16()).toBe(5) // accountType
      expect(stream.readString()).toBe('test-id-123')
      expect(stream.readString()).toBe('test-hash-456')
      expect(Number(stream.readBigUInt64())).toBe(1234567890)
    })

    it('should serialize a DevAccount with root identifier', () => {
      const stream = new VectorBufferStream(0)
      const account = createTestDevAccount()
      
      serializeDevAccount(stream, account, true)
      
      stream.position = 0
      expect(stream.readUInt16()).toBe(TypeIdentifierEnum.cDevAccount)
      expect(stream.readUInt8()).toBe(1) // version
      expect(stream.readUInt8()).toBe(1) // base account version
      expect(stream.readUInt16()).toBe(5) // accountType
      expect(stream.readString()).toBe('test-id-123')
      expect(stream.readString()).toBe('test-hash-456')
      expect(Number(stream.readBigUInt64())).toBe(1234567890)
    })

    it('should handle empty strings', () => {
      const stream = new VectorBufferStream(0)
      const account: DevAccount = {
        accountType: 0,
        id: '',
        hash: '',
        timestamp: 0,
      }
      
      serializeDevAccount(stream, account, false)
      
      stream.position = 0
      expect(stream.readUInt8()).toBe(1) // version
      expect(stream.readUInt8()).toBe(1) // base account version
      expect(stream.readUInt16()).toBe(0) // accountType
      expect(stream.readString()).toBe('')
      expect(stream.readString()).toBe('')
      expect(Number(stream.readBigUInt64())).toBe(0)
    })

    it('should handle large timestamp values', () => {
      const stream = new VectorBufferStream(0)
      const account: DevAccount = {
        accountType: 1,
        id: 'test',
        hash: 'hash',
        timestamp: Date.now(),
      }
      
      serializeDevAccount(stream, account, false)
      
      stream.position = 0
      stream.readUInt8() // version
      stream.readUInt8() // base account version
      stream.readUInt16() // accountType
      stream.readString() // id
      stream.readString() // hash
      expect(Number(stream.readBigUInt64())).toBe(account.timestamp)
    })
  })

  describe('deserializeDevAccount', () => {
    it('should deserialize a DevAccount correctly', () => {
      const stream = new VectorBufferStream(0)
      const originalAccount = createTestDevAccount()
      
      // First serialize
      serializeDevAccount(stream, originalAccount, false)
      
      // Then deserialize
      stream.position = 0
      const deserializedAccount = deserializeDevAccount(stream)
      
      expect(deserializedAccount).toEqual(originalAccount)
    })

    it('should throw error for version mismatch', () => {
      const stream = new VectorBufferStream(0)
      stream.writeUInt8(2) // version higher than supported
      stream.writeUInt8(1) // base account version
      stream.writeUInt16(5) // accountType
      stream.writeString('test')
      stream.writeString('hash')
      stream.writeBigUInt64(BigInt(123))
      
      stream.position = 0
      expect(() => deserializeDevAccount(stream)).toThrow('DevAccount version mismatch')
    })

    it('should deserialize with root identifier', () => {
      const stream = new VectorBufferStream(0)
      const originalAccount = createTestDevAccount()
      
      // Serialize with root
      serializeDevAccount(stream, originalAccount, true)
      
      // Skip root identifier when deserializing
      stream.position = 2
      const deserializedAccount = deserializeDevAccount(stream)
      
      expect(deserializedAccount).toEqual(originalAccount)
    })

    it('should handle edge case values', () => {
      const stream = new VectorBufferStream(0)
      const account: DevAccount = {
        accountType: 65535, // max uint16
        id: 'a'.repeat(1000), // long string
        hash: 'b'.repeat(1000), // long string
        timestamp: Number.MAX_SAFE_INTEGER,
      }
      
      serializeDevAccount(stream, account, false)
      stream.position = 0
      const deserializedAccount = deserializeDevAccount(stream)
      
      expect(deserializedAccount.accountType).toBe(65535)
      expect(deserializedAccount.id).toBe('a'.repeat(1000))
      expect(deserializedAccount.hash).toBe('b'.repeat(1000))
      expect(deserializedAccount.timestamp).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER)
    })
  })

  describe('round-trip serialization', () => {
    it('should maintain data integrity through serialize/deserialize cycle', () => {
      const testCases: DevAccount[] = [
        createTestDevAccount(),
        {
          accountType: 0,
          id: '',
          hash: '',
          timestamp: 0,
        },
        {
          accountType: 999,
          id: 'unicode-✓-test',
          hash: 'hash-with-special-chars-!@#$%',
          timestamp: Date.now(),
        },
      ]

      for (const original of testCases) {
        const stream = new VectorBufferStream(0)
        serializeDevAccount(stream, original, false)
        stream.position = 0
        const deserialized = deserializeDevAccount(stream)
        expect(deserialized).toEqual(original)
      }
    })
  })
})