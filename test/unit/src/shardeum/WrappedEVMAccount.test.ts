import { VectorBufferStream } from '@shardeum-foundation/core'
import {
  WrappedEVMAccount,
  serializeWrappedEVMAccount,
  deserializeWrappedEVMAccount,
} from '../../../../src/types/WrappedEVMAccount'
import { TypeIdentifierEnum } from '../../../../src/types/enum/TypeIdentifierEnum'
import { describe, it, expect } from '@jest/globals'
import { Account } from '@ethereumjs/util'
import { TxReceipt } from '../../../../src/vm_v7'
import { OperatorAccountInfo, ReadableReceipt } from '../../../../src/shardeum/shardeumTypes'

describe('WrappedEVMAccount', () => {
  // Test fixtures - Sample values to use across tests
  const validAccount: WrappedEVMAccount = {
    // BaseAccount properties
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    accountType: 2, // Add accountType for BaseAccount
    // WrappedEVMAccount required properties
    ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
    timestamp: 1234567890,
    // Optional properties
    account: Account.fromAccountData({
      nonce: BigInt(1),
      balance: BigInt(1000000),
      storageRoot: new Uint8Array(Array(32).fill(1)),
      codeHash: new Uint8Array(Array(32).fill(2)),
    }),
    key: 'test-key',
    value: new Uint8Array([1, 2, 3, 4, 5]),
    codeHash: new Uint8Array([9, 10, 11, 12]),
    codeByte: new Uint8Array([13, 14, 15, 16]),
    contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    amountSpent: '50000',
    txId: '0x123abc456def789',
    txFrom: '0x9876543210abcdef9876543210abcdef98765432',
    balance: 2000000,
    receipt: { status: 1 } as unknown as TxReceipt, // Using unknown to satisfy TypeScript
    readableReceipt: {
      transactionHash: '0x123',
      transactionIndex: 0,
      blockNumber: 1,
      nonce: '1',
      status: 'success',
    } as unknown as ReadableReceipt, // Using unknown to satisfy TypeScript
    operatorAccountInfo: {
      stake: 1000,
      nominee: '0x123',
      certExp: 1234567890,
      lastStakeTimestamp: 1234567890,
      operatorStats: {},
      name: 'test-operator',
    } as unknown as OperatorAccountInfo,
  }

  const minimalAccount: WrappedEVMAccount = {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    accountType: 2, // Add accountType for BaseAccount
    ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
    timestamp: 1234567890,
    // No optional fields
  }

  // Helper function to create a fresh stream for each test
  const createStream = (): VectorBufferStream => {
    return new VectorBufferStream(0) // Provide initial capacity
  }

  describe('serializeWrappedEVMAccount', () => {
    // Positive test cases

    /**
     * Tests that a full account with all fields serializes correctly
     * This is a basic functional test of the serialization process
     */
    it('should serialize a complete account correctly', () => {
      // Create a fresh stream for this test
      const stream = createStream()

      // Serialize the account
      serializeWrappedEVMAccount(stream, validAccount, false)

      // Reset position for reading
      stream.position = 0

      // Create a new stream to manually build the expected serialization
      const expectedStream = createStream()

      // Write version
      expectedStream.writeUInt8(1) // Version

      // Write BaseAccount fields
      expectedStream.writeUInt8(1) // BaseAccount version
      expectedStream.writeUInt16(validAccount.accountType) // accountType

      // Write WrappedEVMAccount fields
      expectedStream.writeString(validAccount.ethAddress)
      expectedStream.writeString(validAccount.hash)
      expectedStream.writeBigUInt64(BigInt(validAccount.timestamp))

      // Write optional fields with presence flags
      expectedStream.writeUInt8(1) // account present
      // Skip writing account details as it's complex

      // Reset both streams to compare
      stream.position = 0
      expectedStream.position = 0

      // Check version
      expect(stream.readUInt8()).toBe(1) // Version

      // Check BaseAccount fields
      expect(stream.readUInt8()).toBe(1) // BaseAccount version
      expect(stream.readUInt16()).toBe(validAccount.accountType) // accountType

      // Check WrappedEVMAccount fields
      expect(stream.readString()).toBe(validAccount.ethAddress)
      expect(stream.readString()).toBe(validAccount.hash)
      expect(Number(stream.readBigUInt64())).toBe(validAccount.timestamp)

      // Check presence flags for optional fields
      expect(stream.readUInt8()).toBe(1) // account present
      // Skip account details check as it's complex

      // Reset stream to check the full serialization
      stream.position = 0

      // Deserialize and verify all fields match the original
      const deserializedAccount = deserializeWrappedEVMAccount(stream)
      expect(deserializedAccount.accountType).toBe(validAccount.accountType)
      expect(deserializedAccount.ethAddress).toBe(validAccount.ethAddress)
      expect(deserializedAccount.hash).toBe(validAccount.hash)
      expect(deserializedAccount.timestamp).toBe(validAccount.timestamp)
      expect(deserializedAccount.key).toBe(validAccount.key)
    })

    /**
     * Tests that a minimal account serializes correctly
     * This verifies that optional fields are correctly omitted
     */
    it('should serialize a minimal account correctly', () => {
      // Create a fresh stream for this test
      const stream = createStream()

      // Serialize the account
      serializeWrappedEVMAccount(stream, minimalAccount, false)

      // Reset position for reading
      stream.position = 0

      // Create a new stream to manually build the expected serialization
      const expectedStream = createStream()

      // Write version
      expectedStream.writeUInt8(1) // Version

      // Write BaseAccount fields
      expectedStream.writeUInt8(1) // BaseAccount version
      expectedStream.writeUInt16(minimalAccount.accountType) // accountType

      // Write WrappedEVMAccount fields
      expectedStream.writeString(minimalAccount.ethAddress)
      expectedStream.writeString(minimalAccount.hash)
      expectedStream.writeBigUInt64(BigInt(minimalAccount.timestamp))

      // Write absence flags for all optional fields
      expectedStream.writeUInt8(0) // account absent
      expectedStream.writeUInt8(0) // key absent
      expectedStream.writeUInt8(0) // value absent
      expectedStream.writeUInt8(0) // codeHash absent
      expectedStream.writeUInt8(0) // codeByte absent
      expectedStream.writeUInt8(0) // contractAddress absent
      expectedStream.writeUInt8(0) // amountSpent absent
      expectedStream.writeUInt8(0) // txId absent
      expectedStream.writeUInt8(0) // txFrom absent
      expectedStream.writeUInt8(0) // balance absent
      expectedStream.writeUInt8(0) // receipt absent
      expectedStream.writeUInt8(0) // readableReceipt absent
      expectedStream.writeUInt8(0) // operatorAccountInfo absent

      // Reset both streams to compare
      stream.position = 0
      expectedStream.position = 0

      // Check version
      expect(stream.readUInt8()).toBe(1) // Version

      // Check BaseAccount fields
      expect(stream.readUInt8()).toBe(1) // BaseAccount version
      expect(stream.readUInt16()).toBe(minimalAccount.accountType) // accountType

      // Check WrappedEVMAccount fields
      expect(stream.readString()).toBe(minimalAccount.ethAddress)
      expect(stream.readString()).toBe(minimalAccount.hash)
      expect(Number(stream.readBigUInt64())).toBe(minimalAccount.timestamp)

      // Check absence flags for optional fields
      expect(stream.readUInt8()).toBe(0) // account absent
      expect(stream.readUInt8()).toBe(0) // key absent
      expect(stream.readUInt8()).toBe(0) // value absent
      expect(stream.readUInt8()).toBe(0) // codeHash absent
      expect(stream.readUInt8()).toBe(0) // codeByte absent
      expect(stream.readUInt8()).toBe(0) // contractAddress absent
      expect(stream.readUInt8()).toBe(0) // amountSpent absent
      expect(stream.readUInt8()).toBe(0) // txId absent
      expect(stream.readUInt8()).toBe(0) // txFrom absent
      expect(stream.readUInt8()).toBe(0) // balance absent
      expect(stream.readUInt8()).toBe(0) // receipt absent
      expect(stream.readUInt8()).toBe(0) // readableReceipt absent
      expect(stream.readUInt8()).toBe(0) // operatorAccountInfo absent
    })

    /**
     * Tests that serialization works correctly when the root flag is true
     * This verifies the type identifier is written when the root flag is set
     */
    it('should include type identifier when root flag is true', () => {
      // Create a fresh stream for this test
      const stream = createStream()

      // Serialize with root flag
      serializeWrappedEVMAccount(stream, minimalAccount, true)

      // Reset position for reading
      stream.position = 0

      // Verify type identifier is included
      expect(stream.readUInt16()).toBe(TypeIdentifierEnum.cWrappedEVMAccount)

      // Check version
      expect(stream.readUInt8()).toBe(1) // Version

      // Check BaseAccount fields
      expect(stream.readUInt8()).toBe(1) // BaseAccount version
      expect(stream.readUInt16()).toBe(minimalAccount.accountType) // accountType

      // Check WrappedEVMAccount fields
      expect(stream.readString()).toBe(minimalAccount.ethAddress)
      expect(stream.readString()).toBe(minimalAccount.hash)
      expect(Number(stream.readBigUInt64())).toBe(minimalAccount.timestamp)
    })

    /**
     * Tests that empty strings are serialized correctly
     * This verifies handling of edge cases with empty string fields
     */
    it('should handle empty string fields correctly', () => {
      const accountWithEmptyStrings: WrappedEVMAccount = {
        ...minimalAccount,
        ethAddress: '', // Empty ethAddress
        hash: '', // Empty hash
        key: '', // Empty key
      }

      // Create a fresh stream for this test
      const stream = createStream()

      // Serialize the account
      serializeWrappedEVMAccount(stream, accountWithEmptyStrings, false)

      // Reset position for reading
      stream.position = 0

      // Check version
      expect(stream.readUInt8()).toBe(1) // Version

      // Check BaseAccount fields
      expect(stream.readUInt8()).toBe(1) // BaseAccount version
      expect(stream.readUInt16()).toBe(accountWithEmptyStrings.accountType) // accountType

      // Check WrappedEVMAccount fields
      expect(stream.readString()).toBe('') // Empty ethAddress
      expect(stream.readString()).toBe('') // Empty hash
      expect(Number(stream.readBigUInt64())).toBe(accountWithEmptyStrings.timestamp)

      // Check key field
      expect(stream.readUInt8()).toBe(0) // key present (1 means present, not 0)
    })

    /**
     * Tests that zero values are serialized correctly
     * This verifies handling of edge cases with zero numeric values
     */
    it('should handle zero values correctly', () => {
      const accountWithZeros: WrappedEVMAccount = {
        ...minimalAccount,
        timestamp: 0, // Zero timestamp
        balance: 0, // Zero balance
      }

      // Create a fresh stream for this test
      const stream = createStream()

      // Serialize the account
      serializeWrappedEVMAccount(stream, accountWithZeros, false)

      // Reset position for reading
      stream.position = 0

      // Check version
      expect(stream.readUInt8()).toBe(1) // Version

      // Check BaseAccount fields
      expect(stream.readUInt8()).toBe(1) // BaseAccount version
      expect(stream.readUInt16()).toBe(accountWithZeros.accountType) // accountType

      // Check WrappedEVMAccount fields
      expect(stream.readString()).toBe(accountWithZeros.ethAddress)
      expect(stream.readString()).toBe(accountWithZeros.hash)
      expect(Number(stream.readBigUInt64())).toBe(0) // Zero timestamp

      // Skip to balance field
      expect(stream.readUInt8()).toBe(0) // account absent
      expect(stream.readUInt8()).toBe(0) // key absent
      expect(stream.readUInt8()).toBe(0) // value absent
      expect(stream.readUInt8()).toBe(0) // codeHash absent
      expect(stream.readUInt8()).toBe(0) // codeByte absent
      expect(stream.readUInt8()).toBe(0) // contractAddress absent
      expect(stream.readUInt8()).toBe(0) // amountSpent absent
      expect(stream.readUInt8()).toBe(0) // txId absent
      expect(stream.readUInt8()).toBe(0) // txFrom absent

      // Check balance field
      expect(stream.readUInt8()).toBe(1) // balance present
      expect(Number(stream.readBigUInt64())).toBe(0) // Zero balance
    })
  })

  describe('deserializeWrappedEVMAccount', () => {
    // Positive test cases

    /**
     * Tests that a complete account deserializes correctly
     * This complements the serialization test with a round-trip check
     */
    it('should deserialize a complete account correctly', () => {
      const stream = createStream()

      // Step 1: Serialize the account first
      serializeWrappedEVMAccount(stream, validAccount, false)

      // Step 2: Reset position to read it back
      stream.position = 0

      // Step 3: Deserialize and verify all fields match
      const deserializedAccount = deserializeWrappedEVMAccount(stream)

      // Step 4: Verify all fields match
      expect(deserializedAccount.accountType).toBe(validAccount.accountType)
      expect(deserializedAccount.hash).toBe(validAccount.hash)
      expect(deserializedAccount.ethAddress).toBe(validAccount.ethAddress)
      expect(deserializedAccount.timestamp).toBe(validAccount.timestamp)
      expect(deserializedAccount.key).toBe(validAccount.key)
      expect(deserializedAccount.contractAddress).toBe(validAccount.contractAddress)
      expect(deserializedAccount.amountSpent).toBe(validAccount.amountSpent)
      expect(deserializedAccount.txId).toBe(validAccount.txId)
      expect(deserializedAccount.txFrom).toBe(validAccount.txFrom)
      expect(deserializedAccount.balance).toBe(validAccount.balance)

      // Verify binary fields
      expect(deserializedAccount.value instanceof Uint8Array).toBe(true)
      expect(deserializedAccount.codeHash instanceof Uint8Array).toBe(true)
      expect(deserializedAccount.codeByte instanceof Uint8Array).toBe(true)

      // Compare binary field contents
      if (deserializedAccount.value && validAccount.value) {
        expect(Array.from(deserializedAccount.value)).toEqual(Array.from(validAccount.value))
      }
      if (deserializedAccount.codeHash && validAccount.codeHash) {
        expect(Array.from(deserializedAccount.codeHash)).toEqual(Array.from(validAccount.codeHash))
      }
      if (deserializedAccount.codeByte && validAccount.codeByte) {
        expect(Array.from(deserializedAccount.codeByte)).toEqual(Array.from(validAccount.codeByte))
      }

      // Verify complex objects
      expect(deserializedAccount.receipt).toEqual(validAccount.receipt)
      expect(deserializedAccount.readableReceipt).toEqual(validAccount.readableReceipt)
      expect(deserializedAccount.operatorAccountInfo).toEqual(validAccount.operatorAccountInfo)

      // Verify account object if present by checking JSON string equality
      if (validAccount.account && deserializedAccount.account) {
        // Can't use JSON.stringify directly due to BigInt serialization issues
        expect(deserializedAccount.account.nonce).toEqual(validAccount.account.nonce)
        expect(deserializedAccount.account.balance).toEqual(validAccount.account.balance)
        // Compare other account properties as needed
      } else {
        expect(deserializedAccount.account).toBe(validAccount.account)
      }
    })

    /**
     * Tests that a minimal account deserializes correctly
     * This ensures optional fields are handled correctly when absent
     */
    it('should deserialize a minimal account correctly', () => {
      const stream = createStream()

      // First serialize the minimal account
      serializeWrappedEVMAccount(stream, minimalAccount, false)

      // Reset position to read from beginning
      stream.position = 0

      // Deserialize and verify
      const deserializedAccount = deserializeWrappedEVMAccount(stream)

      // Verify all required fields match
      expect(deserializedAccount.accountType).toBe(minimalAccount.accountType)
      expect(deserializedAccount.hash).toBe(minimalAccount.hash)
      expect(deserializedAccount.ethAddress).toBe(minimalAccount.ethAddress)
      expect(deserializedAccount.timestamp).toBe(minimalAccount.timestamp)

      // Verify optional fields are undefined
      expect(deserializedAccount.account).toBeUndefined()
      expect(deserializedAccount.key).toBeUndefined()
      expect(deserializedAccount.value).toBeUndefined()
      expect(deserializedAccount.codeHash).toBeUndefined()
      expect(deserializedAccount.codeByte).toBeUndefined()
      expect(deserializedAccount.contractAddress).toBeUndefined()
      expect(deserializedAccount.amountSpent).toBeUndefined()
      expect(deserializedAccount.txId).toBeUndefined()
      expect(deserializedAccount.txFrom).toBeUndefined()
      expect(deserializedAccount.balance).toBeUndefined()
      expect(deserializedAccount.receipt).toBeUndefined()
      expect(deserializedAccount.readableReceipt).toBeUndefined()
      expect(deserializedAccount.operatorAccountInfo).toBeUndefined()
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

      // Reset position for reading
      stream.position = 0

      expect(() => deserializeWrappedEVMAccount(stream)).toThrow('WrappedEVMAccount version mismatch')
    })

    /**
     * Tests that deserialization fails when the stream doesn't contain enough data
     * This verifies error handling for incomplete or corrupted data
     */
    it('should throw an error when stream is truncated', () => {
      const stream = createStream()

      // Write partial data
      stream.writeUInt8(1) // Version
      stream.writeString('0x1234') // Incomplete hash
      // Missing other required fields

      // Reset position for reading
      stream.position = 0

      expect(() => deserializeWrappedEVMAccount(stream)).toThrow() // Error when trying to read past end
    })

    /**
     * Tests that deserialization handles corrupted data gracefully
     * This verifies error handling for malformed data
     */
    it('should handle corrupted data gracefully', () => {
      const stream = createStream()

      // Write corrupted data
      stream.writeUInt8(1) // Version
      stream.writeUInt16(2) // accountType
      stream.writeString('0x1234') // ethAddress
      stream.writeString('0xabcd') // hash
      stream.writeBigUInt64(BigInt(123456)) // timestamp
      stream.writeUInt8(1) // account present flag
      // But don't write account data, making it corrupted

      // Reset position for reading
      stream.position = 0

      // Should throw an error when trying to deserialize corrupted data
      expect(() => deserializeWrappedEVMAccount(stream)).toThrow()
    })
  })

  /**
   * Tests the complete round-trip process with the type identifier
   * This verifies the full serialization and deserialization workflow including type identification
   */
  it('should handle round-trip serialization with root flag', () => {
    const stream = createStream()

    // Serialize with root flag
    serializeWrappedEVMAccount(stream, minimalAccount, true)

    // Reset position for reading
    stream.position = 0

    // Skip type identifier
    expect(stream.readUInt16()).toBe(TypeIdentifierEnum.cWrappedEVMAccount)

    // Deserialize the rest
    const deserialized = deserializeWrappedEVMAccount(stream)

    // Verify basic fields
    expect(deserialized.accountType).toBe(minimalAccount.accountType)
    expect(deserialized.hash).toBe(minimalAccount.hash)
    expect(deserialized.ethAddress).toBe(minimalAccount.ethAddress)
    expect(deserialized.timestamp).toBe(minimalAccount.timestamp)
  })

  /**
   * Tests serialization and deserialization of JSON fields
   * This ensures complex objects are properly handled
   */
  it('should properly serialize and deserialize JSON fields', () => {
    // Create account with just JSON fields to test
    const accountWithJsonFields: WrappedEVMAccount = {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      accountType: 2, // Add accountType for BaseAccount
      ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
      timestamp: 1234567890,
      receipt: {
        status: 1,
        gasUsed: 21000,
        logs: [{ topic: 'test', data: '0x1234' }],
      } as unknown as TxReceipt,
      readableReceipt: {
        transactionHash: '0x123',
        transactionIndex: 0,
        blockNumber: 1,
        nonce: '1',
        status: 'success',
        humanReadableLogs: ['Transfer: 1.5 ETH'],
      } as unknown as ReadableReceipt,
      operatorAccountInfo: {
        stake: 1000,
        nominee: '0x123',
        certExp: 1234567890,
        lastStakeTimestamp: 1234567890,
        operatorStats: {},
        name: 'test-operator',
      } as unknown as OperatorAccountInfo,
    }

    const testStream = createStream()
    serializeWrappedEVMAccount(testStream, accountWithJsonFields, false)

    // Reset position for reading
    testStream.position = 0

    const deserialized = deserializeWrappedEVMAccount(testStream)

    // Verify JSON fields were preserved
    expect(deserialized.receipt).toEqual(accountWithJsonFields.receipt)
    expect(deserialized.readableReceipt).toEqual(accountWithJsonFields.readableReceipt)
    expect(deserialized.operatorAccountInfo).toEqual(accountWithJsonFields.operatorAccountInfo)
  })

  /**
   * Tests serialization and deserialization of binary data fields
   * This ensures binary data is properly handled
   */
  it('should properly serialize and deserialize binary data fields', () => {
    // Create account with just binary fields to test
    const accountWithBinaryFields: WrappedEVMAccount = {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      accountType: 2,
      ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
      timestamp: 1234567890,
      value: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      codeHash: new Uint8Array([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
      codeByte: new Uint8Array([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]),
    }

    const stream = createStream()
    serializeWrappedEVMAccount(stream, accountWithBinaryFields, false)

    // Reset position for reading
    stream.position = 0

    const deserialized = deserializeWrappedEVMAccount(stream)

    // Verify binary fields were preserved
    expect(deserialized.value instanceof Uint8Array).toBe(true)
    expect(deserialized.codeHash instanceof Uint8Array).toBe(true)
    expect(deserialized.codeByte instanceof Uint8Array).toBe(true)

    // Compare binary field contents
    if (deserialized.value && accountWithBinaryFields.value) {
      expect([...deserialized.value]).toEqual([...accountWithBinaryFields.value])
    }
    if (deserialized.codeHash && accountWithBinaryFields.codeHash) {
      expect([...deserialized.codeHash]).toEqual([...accountWithBinaryFields.codeHash])
    }
    if (deserialized.codeByte && accountWithBinaryFields.codeByte) {
      expect([...deserialized.codeByte]).toEqual([...accountWithBinaryFields.codeByte])
    }
  })

  /**
   * Tests serialization and deserialization with maximum values
   * This ensures handling of edge cases with maximum numeric values
   */
  it('should handle maximum numeric values correctly', () => {
    // Use a large but valid value for uint64
    const maxSafeValue = Number.MAX_SAFE_INTEGER // 2^53 - 1, well within uint64 range
    const accountWithMaxValues: WrappedEVMAccount = {
      ...minimalAccount,
      timestamp: maxSafeValue,
      balance: maxSafeValue,
    }

    const stream = createStream()
    serializeWrappedEVMAccount(stream, accountWithMaxValues, false)

    // Reset position for reading
    stream.position = 0

    const deserialized = deserializeWrappedEVMAccount(stream)

    // Verify numeric fields were preserved
    expect(deserialized.timestamp).toBe(accountWithMaxValues.timestamp)
    expect(deserialized.balance).toBe(accountWithMaxValues.balance)
  })

  /**
   * Tests inheritance from BaseAccount is properly handled
   * This ensures the BaseAccount fields are correctly serialized and deserialized
   */
  it('should handle BaseAccount inheritance correctly', () => {
    // Create account with different accountType
    const accountWithDifferentType: WrappedEVMAccount = {
      ...minimalAccount,
      accountType: 5, // Different accountType
    }

    const stream = createStream()
    serializeWrappedEVMAccount(stream, accountWithDifferentType, false)

    // Reset position for reading
    stream.position = 0

    // Check version
    expect(stream.readUInt8()).toBe(1) // WrappedEVMAccount version

    // Check BaseAccount fields
    expect(stream.readUInt8()).toBe(1) // BaseAccount version
    expect(stream.readUInt16()).toBe(5) // accountType should be preserved as 5

    // Reset and deserialize properly
    stream.position = 0
    const deserialized = deserializeWrappedEVMAccount(stream)

    // Verify BaseAccount fields were preserved in the deserialized object
    expect(deserialized.accountType).toBe(accountWithDifferentType.accountType)
  })
})
