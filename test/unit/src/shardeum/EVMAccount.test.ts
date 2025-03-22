import { VectorBufferStream } from '@shardeum-foundation/core'
import { EVMAccount, serializeEVMAccount, deserializeEVMAccount } from '../../../../src/types/EVMAccount'
import { TypeIdentifierEnum } from '../../../../src/types/enum/TypeIdentifierEnum'
import { describe, it, expect } from '@jest/globals'

describe('EVMAccount', () => {
  // Test fixtures - Sample values to use across tests
  const validAccount: EVMAccount = {
    nonce: BigInt(1),
    balance: BigInt(1000000),
    storageRoot: new Uint8Array([1, 2, 3, 4]),
    codeHash: new Uint8Array([5, 6, 7, 8]),
  }

  const zeroAccount: EVMAccount = {
    nonce: BigInt(0),
    balance: BigInt(0),
    storageRoot: new Uint8Array([]),
    codeHash: new Uint8Array([]),
  }

  const maxAccount: EVMAccount = {
    nonce: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
    balance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
    storageRoot: new Uint8Array(new Array(32).fill(255)), // 32 bytes of FF
    codeHash: new Uint8Array(new Array(32).fill(255)), // 32 bytes of FF
  }

  // Helper function to create a fresh stream for each test
  const createStream = (): VectorBufferStream => {
    return new VectorBufferStream(0) // Provide initial capacity
  }

  describe('serializeEVMAccount', () => {
    // Positive test cases

    /**
     * Tests that serialization works with a typical valid account
     * This is a basic functional test of the serialization process
     */
    it('should serialize a valid account correctly', () => {
      const stream = createStream()
      serializeEVMAccount(stream, validAccount, false)

      // Reset position for reading
      stream.position = 0

      // Verify contents - manually check each value
      expect(stream.readUInt8()).toBe(1) // Version
      expect(stream.readString()).toBe('1') // Nonce
      expect(stream.readString()).toBe('1000000') // Balance

      const storageRoot = stream.readBuffer()
      expect(Array.from(storageRoot)).toEqual([1, 2, 3, 4])

      const codeHash = stream.readBuffer()
      expect(Array.from(codeHash)).toEqual([5, 6, 7, 8])
    })

    /**
     * Tests that serialization works correctly when the root flag is true
     * This verifies the type identifier is written when the root flag is set
     */
    it('should include type identifier when root flag is true', () => {
      const stream = createStream()
      serializeEVMAccount(stream, validAccount, true)

      // Reset position for reading
      stream.position = 0

      // Verify type identifier is included
      expect(stream.readUInt16()).toBe(TypeIdentifierEnum.cEVMAccount)
      expect(stream.readUInt8()).toBe(1) // Version
      // Rest of data would follow...
    })

    /**
     * Tests that accounts with zero values serialize correctly
     * This verifies edge cases with minimum values
     */
    it('should correctly serialize an account with zero values', () => {
      const stream = createStream()
      serializeEVMAccount(stream, zeroAccount, false)

      // Reset position for reading
      stream.position = 0

      expect(stream.readUInt8()).toBe(1) // Version
      expect(stream.readString()).toBe('0') // Nonce
      expect(stream.readString()).toBe('0') // Balance

      const storageRoot = stream.readBuffer()
      expect(storageRoot.length).toBe(0)

      const codeHash = stream.readBuffer()
      expect(codeHash.length).toBe(0)
    })

    /**
     * Tests that accounts with extremely large values serialize correctly
     * This verifies edge cases with maximum values
     */
    it('should correctly serialize an account with maximum values', () => {
      const stream = createStream()
      serializeEVMAccount(stream, maxAccount, false)

      // Reset position for reading
      stream.position = 0

      expect(stream.readUInt8()).toBe(1) // Version
      expect(stream.readString()).toBe(maxAccount.nonce.toString()) // Nonce
      expect(stream.readString()).toBe(maxAccount.balance.toString()) // Balance

      const storageRoot = stream.readBuffer()
      expect(storageRoot.length).toBe(32)
      expect(Array.from(storageRoot)).toEqual(new Array(32).fill(255))

      const codeHash = stream.readBuffer()
      expect(codeHash.length).toBe(32)
      expect(Array.from(codeHash)).toEqual(new Array(32).fill(255))
    })
  })

  describe('deserializeEVMAccount', () => {
    // Positive test cases

    /**
     * Tests basic round-trip serialization and deserialization
     * This verifies that an account serialized and then deserialized results in the same values
     */
    it('should correctly deserialize what was serialized', () => {
      const stream = createStream()
      serializeEVMAccount(stream, validAccount, false)

      // Reset position for reading
      stream.position = 0

      const deserialized = deserializeEVMAccount(stream)

      expect(deserialized.nonce).toBe(validAccount.nonce)
      expect(deserialized.balance).toBe(validAccount.balance)
      expect(Array.from(deserialized.storageRoot)).toEqual(Array.from(validAccount.storageRoot))
      expect(Array.from(deserialized.codeHash)).toEqual(Array.from(validAccount.codeHash))
    })

    /**
     * Tests deserialization of accounts with zero values
     * This verifies edge cases with minimum values
     */
    it('should correctly deserialize an account with zero values', () => {
      const stream = createStream()
      serializeEVMAccount(stream, zeroAccount, false)

      // Reset position for reading
      stream.position = 0

      const deserialized = deserializeEVMAccount(stream)

      expect(deserialized.nonce).toBe(BigInt(0))
      expect(deserialized.balance).toBe(BigInt(0))
      expect(deserialized.storageRoot.length).toBe(0)
      expect(deserialized.codeHash.length).toBe(0)
    })

    /**
     * Tests deserialization of accounts with extremely large values
     * This verifies edge cases with maximum values
     */
    it('should correctly deserialize an account with maximum values', () => {
      const stream = createStream()
      serializeEVMAccount(stream, maxAccount, false)

      // Reset position for reading
      stream.position = 0

      const deserialized = deserializeEVMAccount(stream)

      expect(deserialized.nonce).toBe(maxAccount.nonce)
      expect(deserialized.balance).toBe(maxAccount.balance)
      expect(Array.from(deserialized.storageRoot)).toEqual(new Array(32).fill(255))
      expect(Array.from(deserialized.codeHash)).toEqual(new Array(32).fill(255))
    })

    // Negative test cases

    /**
     * Tests that deserialization fails with an appropriate error when the version is too high
     * This verifies the version compatibility check works correctly
     */
    it('should throw an error when version is higher than supported', () => {
      const stream = createStream()

      // Write an unsupported version number
      stream.writeUInt8(99) // Much higher than supported version
      stream.writeString('1') // Nonce
      stream.writeString('1000000') // Balance
      stream.writeBuffer(Buffer.from([1, 2, 3, 4])) // storageRoot
      stream.writeBuffer(Buffer.from([5, 6, 7, 8])) // codeHash

      // Reset position for reading
      stream.position = 0

      expect(() => deserializeEVMAccount(stream)).toThrow('EVMAccount version mismatch')
    })

    /**
     * Tests that deserialization fails when the stream doesn't contain enough data
     * This verifies error handling for incomplete or corrupted data
     */
    it('should throw an error when stream is truncated', () => {
      const stream = createStream()

      // Write partial data
      stream.writeUInt8(1) // Version
      stream.writeString('1') // Nonce
      // Missing balance and other fields

      // Reset position for reading
      stream.position = 0

      expect(() => deserializeEVMAccount(stream)).toThrow() // Error when trying to read past end
    })

    /**
     * Tests that deserialization fails when the nonce is an invalid BigInt string
     * This verifies error handling for corrupted data
     */
    it('should throw an error when nonce is not a valid BigInt string', () => {
      const stream = createStream()

      // Write invalid data
      stream.writeUInt8(1) // Version
      stream.writeString('not a number') // Invalid nonce

      // Reset position for reading
      stream.position = 0

      expect(() => deserializeEVMAccount(stream)).toThrow() // Should throw when parsing BigInt
    })

    /**
     * Tests that deserialization fails when the balance is an invalid BigInt string
     * This verifies error handling for corrupted data
     */
    it('should throw an error when balance is not a valid BigInt string', () => {
      const stream = createStream()

      // Write invalid data
      stream.writeUInt8(1) // Version
      stream.writeString('1') // Valid nonce
      stream.writeString('not a number') // Invalid balance

      // Reset position for reading
      stream.position = 0

      expect(() => deserializeEVMAccount(stream)).toThrow() // Should throw when parsing BigInt
    })
  })

  /**
   * Tests the complete round-trip process with the type identifier
   * This verifies the full serialization and deserialization workflow including type identification
   */
  it('should handle round-trip serialization with root flag', () => {
    const stream = createStream()

    // Serialize with root flag
    serializeEVMAccount(stream, validAccount, true)

    // Reset position for reading
    stream.position = 0

    // Skip type identifier
    expect(stream.readUInt16()).toBe(TypeIdentifierEnum.cEVMAccount)

    // Deserialize the rest
    const deserialized = deserializeEVMAccount(stream)

    expect(deserialized.nonce).toBe(validAccount.nonce)
    expect(deserialized.balance).toBe(validAccount.balance)
    expect(Array.from(deserialized.storageRoot)).toEqual(Array.from(validAccount.storageRoot))
    expect(Array.from(deserialized.codeHash)).toEqual(Array.from(validAccount.codeHash))
  })

  /**
   * Tests that operations work with different buffer sizes
   * This ensures the code handles varying data sizes correctly
   */
  it('should handle buffers of different sizes', () => {
    // Account with large buffers
    const largeBufferAccount: EVMAccount = {
      nonce: BigInt(1),
      balance: BigInt(1000000),
      storageRoot: new Uint8Array(new Array(1024).fill(1)), // 1KB buffer
      codeHash: new Uint8Array(new Array(1024).fill(2)), // 1KB buffer
    }

    const stream = createStream()
    serializeEVMAccount(stream, largeBufferAccount, false)

    // Reset position for reading
    stream.position = 0

    const deserialized = deserializeEVMAccount(stream)

    expect(deserialized.nonce).toBe(largeBufferAccount.nonce)
    expect(deserialized.balance).toBe(largeBufferAccount.balance)
    expect(deserialized.storageRoot.length).toBe(1024)
    expect(deserialized.codeHash.length).toBe(1024)
    expect(Array.from(deserialized.storageRoot)).toEqual(new Array(1024).fill(1))
    expect(Array.from(deserialized.codeHash)).toEqual(new Array(1024).fill(2))
  })
})
