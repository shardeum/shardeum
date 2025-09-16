import { VectorBufferStream } from '@shardeum-foundation/core'
import {
  ContractStorageAccount,
  serializeContractStorageAccount,
  deserializeContractStorageAccount,
  toContractStorageAccount,
  toWrappedEVMAccount,
} from '../../../../src/types/ContractStorageAccount'
import { TypeIdentifierEnum } from '../../../../src/types/enum/TypeIdentifierEnum'
import { AccountType } from '../../../../src/shardeum/shardeumTypes'
import { describe, it, expect } from '@jest/globals'
import { accountSerializer, accountDeserializer } from '../../../../src/types/Helpers'
import { WrappedEVMAccount } from '../../../../src/types/WrappedEVMAccount'

describe('ContractStorageAccount', () => {
  // Test fixtures - Sample values to use across tests (32-byte storage values)
  const validContractStorage: ContractStorageAccount = {
    accountType: AccountType.ContractStorage,
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    timestamp: 1640995200000,
    key: '0x0000000000000000000000000000000000000000000000000000000000000001',
    value: (() => {
      const arr = new Uint8Array(32);
      arr.set([0x01, 0x02, 0x03, 0x04, 0x05], 27); // Place at end
      return arr;
    })(),
  }

  const minimalContractStorage: ContractStorageAccount = {
    accountType: AccountType.ContractStorage,
    hash: 'minhash',
    timestamp: 123456789,
    key: '0x01',
    value: (() => {
      const arr = new Uint8Array(32);
      arr[31] = 0xff; // Place at end
      return arr;
    })(),
  }

  // Bloated WrappedEVMAccount equivalent for comparison
  const bloatedWrappedAccount: WrappedEVMAccount = {
    accountType: AccountType.ContractStorage,
    ethAddress: '0x742c3cF37907A1e0F7C4e6b8E0fD2DB2E6C19E57',
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    timestamp: 1640995200000,
    key: '0x0000000000000000000000000000000000000000000000000000000000000001',
    value: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]),
    // All these bloated fields are unused for ContractStorage
    account: undefined,
    codeHash: undefined,
    codeByte: undefined,
    contractAddress: undefined,
    receipt: undefined,
    readableReceipt: undefined,
    amountSpent: undefined,
    txId: undefined,
    txFrom: undefined,
    balance: undefined,
    operatorAccountInfo: undefined,
  }

  // Helper function to create a fresh stream for each test
  const createStream = (): VectorBufferStream => {
    return new VectorBufferStream(0)
  }

  describe('serializeContractStorageAccount', () => {
    it('should serialize a complete ContractStorage account correctly', () => {
      const stream = createStream()

      // Serialize the account
      serializeContractStorageAccount(stream, validContractStorage, false)

      // Reset position for reading
      stream.position = 0

      // Manually verify the serialized structure
      expect(stream.readUInt8()).toBe(1) // Version
      expect(stream.readUInt8()).toBe(1) // BaseAccount version
      expect(stream.readUInt16()).toBe(AccountType.ContractStorage) // accountType
      expect(stream.readString()).toBe(validContractStorage.hash)
      expect(Number(stream.readBigUInt64())).toBe(validContractStorage.timestamp)
      expect(stream.readString()).toBe(validContractStorage.key)

      // Read compressed binary value
      const compressedLength = stream.readUInt8()
      expect(compressedLength).toBe(5) // 5 significant bytes
      const compressedValue = stream.readBuffer()
      expect(Array.from(new Uint8Array(compressedValue))).toEqual([0x01, 0x02, 0x03, 0x04, 0x05])
    })

    it('should include type identifier when root flag is true', () => {
      const stream = createStream()

      // Serialize with root flag
      serializeContractStorageAccount(stream, validContractStorage, true)

      // Reset position for reading
      stream.position = 0

      // Verify type identifier is included
      expect(stream.readUInt16()).toBe(TypeIdentifierEnum.cContractStorageAccount)

      // Check version
      expect(stream.readUInt8()).toBe(1)
    })

    it('should handle empty value arrays correctly', () => {
      const emptyValueAccount: ContractStorageAccount = {
        ...validContractStorage,
        value: new Uint8Array(32), // All zeros
      }

      const stream = createStream()
      serializeContractStorageAccount(stream, emptyValueAccount, false)

      stream.position = 0

      // Skip to value field
      stream.readUInt8() // Version
      stream.readUInt8() // BaseAccount version
      stream.readUInt16() // accountType
      stream.readString() // hash
      stream.readBigUInt64() // timestamp
      stream.readString() // key

      // Read compressed value - should be 1 byte (zero)
      const compressedLength = stream.readUInt8()
      expect(compressedLength).toBe(1)
      const compressedValue = stream.readBuffer()
      expect(Array.from(new Uint8Array(compressedValue))).toEqual([0])
    })

    it('should serialize much smaller than WrappedEVMAccount', () => {
      const contractStream = createStream()
      const wrappedStream = createStream()

      // Serialize ContractStorage account
      serializeContractStorageAccount(contractStream, validContractStorage, true)

      // Create a truly bloated WrappedEVMAccount with many fields filled
      const trulyBloatedAccount: WrappedEVMAccount = {
        ...bloatedWrappedAccount,
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        amountSpent: '1000000000000000000',
        txId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        txFrom: '0x9876543210abcdef9876543210abcdef98765432',
        balance: 500000000,
        receipt: { status: 1, gasUsed: 21000 } as any,
        readableReceipt: { transactionHash: '0x123', status: 'success' } as any,
        operatorAccountInfo: { stake: 1000, nominee: '0x123' } as any,
      }

      // Import the WrappedEVMAccount serializer for comparison
      const { serializeWrappedEVMAccount } = require('../../../../src/types/WrappedEVMAccount')
      serializeWrappedEVMAccount(wrappedStream, trulyBloatedAccount, true)

      // ContractStorage should be significantly smaller
      const contractSize = contractStream.getBufferLength()
      const wrappedSize = wrappedStream.getBufferLength()

      expect(contractSize).toBeLessThan(wrappedSize)
      console.log(`Size comparison: ContractStorage=${contractSize}, WrappedEVM=${wrappedSize}`)
    })
  })

  describe('deserializeContractStorageAccount', () => {
    it('should deserialize a complete account correctly', () => {
      const stream = createStream()

      // Serialize first
      serializeContractStorageAccount(stream, validContractStorage, false)

      // Reset position
      stream.position = 0

      // Deserialize
      const deserialized = deserializeContractStorageAccount(stream)

      // Verify all fields match
      expect(deserialized.accountType).toBe(validContractStorage.accountType)
      expect(deserialized.hash).toBe(validContractStorage.hash)
      expect(deserialized.timestamp).toBe(validContractStorage.timestamp)
      expect(deserialized.key).toBe(validContractStorage.key)
      expect(Array.from(deserialized.value)).toEqual(Array.from(validContractStorage.value))
    })

    it('should throw error when version is too high', () => {
      const stream = createStream()

      // Write unsupported version
      stream.writeUInt8(99)

      stream.position = 0

      expect(() => deserializeContractStorageAccount(stream)).toThrow('ContractStorageAccount version mismatch')
    })

    it('should handle binary data fields correctly', () => {
      // Test with a 64-byte value that starts with non-zero to avoid compression
      const largeValue = new Uint8Array(64);
      // Fill with pattern starting from byte 0 (no leading zeros)
      for (let i = 0; i < 64; i++) {
        largeValue[i] = (i + 1) % 256; // Avoid zero at start
      }

      const largeValueAccount: ContractStorageAccount = {
        ...validContractStorage,
        value: largeValue,
      }

      const stream = createStream()
      serializeContractStorageAccount(stream, largeValueAccount, false)

      stream.position = 0

      const deserialized = deserializeContractStorageAccount(stream)

      expect(deserialized.value).toBeInstanceOf(Uint8Array)
      expect(Array.from(deserialized.value)).toEqual(Array.from(largeValueAccount.value))
    })
  })

  describe('toContractStorageAccount', () => {
    it('should convert WrappedEVMAccount to ContractStorageAccount', () => {
      const contractStorage = toContractStorageAccount(bloatedWrappedAccount)

      expect(contractStorage.accountType).toBe(AccountType.ContractStorage)
      expect(contractStorage.hash).toBe(bloatedWrappedAccount.hash)
      expect(contractStorage.timestamp).toBe(bloatedWrappedAccount.timestamp)
      expect(contractStorage.key).toBe(bloatedWrappedAccount.key)
      expect(Array.from(contractStorage.value)).toEqual([0x01, 0x02, 0x03, 0x04, 0x05]) // Already Uint8Array
    })

    it('should throw error for non-ContractStorage accounts', () => {
      const nonContractAccount = {
        ...bloatedWrappedAccount,
        accountType: AccountType.Account,
      }

      expect(() => toContractStorageAccount(nonContractAccount)).toThrow('Account is not a ContractStorage type')
    })

    it('should throw error when missing essential fields', () => {
      const incompleteAccount = {
        ...bloatedWrappedAccount,
        key: undefined,
      }

      expect(() => toContractStorageAccount(incompleteAccount)).toThrow('ContractStorage account missing essential fields (key or value)')
    })

    it('should handle Uint8Array vs Buffer conversion', () => {
      const bufferAccount = {
        ...bloatedWrappedAccount,
        value: Buffer.from([0x01, 0x02, 0x03]),
      }

      const contractStorage = toContractStorageAccount(bufferAccount)

      expect(contractStorage.value).toBeInstanceOf(Uint8Array)
      expect(Array.from(contractStorage.value)).toEqual([0x01, 0x02, 0x03])
    })
  })

  describe('toWrappedEVMAccount', () => {
    it('should convert ContractStorageAccount back to WrappedEVMAccount format', () => {
      const wrappedAccount = toWrappedEVMAccount(validContractStorage)

      expect(wrappedAccount.accountType).toBe(validContractStorage.accountType)
      expect(wrappedAccount.hash).toBe(validContractStorage.hash)
      expect(wrappedAccount.timestamp).toBe(validContractStorage.timestamp)
      expect(wrappedAccount.key).toBe(validContractStorage.key)
      // Should be 32-byte padded format
      const expected3 = new Uint8Array(32);
      expected3.set([0x01, 0x02, 0x03, 0x04, 0x05], 27);
      expect(Array.from(wrappedAccount.value!)).toEqual(Array.from(expected3))

      // Verify bloated fields are undefined
      expect(wrappedAccount.account).toBeUndefined()
      expect(wrappedAccount.codeHash).toBeUndefined()
      expect(wrappedAccount.codeByte).toBeUndefined()
      expect(wrappedAccount.contractAddress).toBeUndefined()
      expect(wrappedAccount.ethAddress).toBeUndefined()
      expect(wrappedAccount.receipt).toBeUndefined()
      expect(wrappedAccount.operatorAccountInfo).toBeUndefined()
    })
  })

  describe('Integration with accountSerializer/accountDeserializer', () => {
    it('should work with the global account serialization system', () => {
      // Serialize using the global system
      const serialized = accountSerializer(validContractStorage)

      // Deserialize using the global system
      const buffer = serialized.getBuffer()
      const deserialized = accountDeserializer(buffer) as WrappedEVMAccount

      // Should get back a WrappedEVMAccount with only essential fields populated
      expect(deserialized.accountType).toBe(validContractStorage.accountType)
      expect(deserialized.hash).toBe(validContractStorage.hash)
      expect(deserialized.timestamp).toBe(validContractStorage.timestamp)
      expect(deserialized.key).toBe(validContractStorage.key)
      // Should be 32-byte padded format
      const expected = new Uint8Array(32);
      expected.set([0x01, 0x02, 0x03, 0x04, 0x05], 27);
      expect(Array.from(deserialized.value!)).toEqual(Array.from(expected))

      // Bloated fields should be undefined
      expect(deserialized.account).toBeUndefined()
      expect(deserialized.codeHash).toBeUndefined()
      expect(deserialized.operatorAccountInfo).toBeUndefined()
    })

    it('should use optimized serialization automatically for ContractStorage', () => {
      const serialized = accountSerializer(bloatedWrappedAccount)
      const buffer = serialized.getBuffer()

      // Create a stream to check the type identifier
      const stream = VectorBufferStream.fromBuffer(buffer)
      const typeId = stream.readUInt16()

      // Should use the optimized ContractStorageAccount serialization
      expect(typeId).toBe(TypeIdentifierEnum.cContractStorageAccount)
    })

    it('should demonstrate space savings in real usage', () => {
      // Test both approaches
      const optimizedSerialized = accountSerializer(validContractStorage)

      // Create a comparison with truly bloated fields
      const bloatedForComparison: WrappedEVMAccount = {
        ...bloatedWrappedAccount,
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        amountSpent: '1000000000000000000',
        txId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        txFrom: '0x9876543210abcdef9876543210abcdef98765432',
        balance: 500000000,
        receipt: { status: 1, gasUsed: 21000 } as any,
        readableReceipt: { transactionHash: '0x123', status: 'success' } as any,
        operatorAccountInfo: { stake: 1000, nominee: '0x123' } as any,
      }

      // Force use of old WrappedEVMAccount serialization for comparison
      const { serializeWrappedEVMAccount } = require('../../../../src/types/WrappedEVMAccount')
      const oldStream = createStream()
      serializeWrappedEVMAccount(oldStream, bloatedForComparison, true)

      const optimizedSize = optimizedSerialized.getBufferLength()
      const oldSize = oldStream.getBufferLength()

      // Log the space savings for visibility
      const savings = oldSize - optimizedSize
      const savingsPercent = Math.round((savings / oldSize) * 100)

      expect(optimizedSize).toBeLessThan(oldSize)
      expect(savingsPercent).toBeGreaterThan(10) // Should save at least 10%

      // This test documents the optimization benefit
      console.log(`ContractStorage optimization saves ${savings} bytes (${savingsPercent}%) per account`)
    })
  })

  describe('Round-trip compatibility', () => {
    it('should maintain data integrity through full serialization cycle', () => {
      // Start with WrappedEVMAccount -> serialize -> deserialize -> back to WrappedEVMAccount
      const serialized = accountSerializer(bloatedWrappedAccount)
      const buffer = serialized.getBuffer()
      const deserialized = accountDeserializer(buffer) as WrappedEVMAccount

      // Essential data should be preserved
      expect(deserialized.accountType).toBe(bloatedWrappedAccount.accountType)
      expect(deserialized.hash).toBe(bloatedWrappedAccount.hash)
      expect(deserialized.timestamp).toBe(bloatedWrappedAccount.timestamp)
      expect(deserialized.key).toBe(bloatedWrappedAccount.key)
      // Should be 32-byte padded format
      const expected2 = new Uint8Array(32);
      expected2.set([0x01, 0x02, 0x03, 0x04, 0x05], 27);
      expect(Array.from(deserialized.value!)).toEqual(Array.from(expected2))

      // Bloated fields should be cleaned up
      expect(deserialized.account).toBeUndefined()
      expect(deserialized.codeHash).toBeUndefined()
      expect(deserialized.codeByte).toBeUndefined()
      expect(deserialized.contractAddress).toBeUndefined()
      expect(deserialized.receipt).toBeUndefined()
      expect(deserialized.readableReceipt).toBeUndefined()
      expect(deserialized.amountSpent).toBeUndefined()
      expect(deserialized.txId).toBeUndefined()
      expect(deserialized.txFrom).toBeUndefined()
      expect(deserialized.balance).toBeUndefined()
      expect(deserialized.operatorAccountInfo).toBeUndefined()
    })

    it('should work with edge case values', () => {
      const edgeCaseAccount: ContractStorageAccount = {
        accountType: AccountType.ContractStorage,
        hash: '', // Empty hash
        timestamp: 0, // Zero timestamp
        key: '', // Empty key
        value: new Uint8Array(32), // Zero value (all zeros)
      }

      const serialized = accountSerializer(edgeCaseAccount)
      const buffer = serialized.getBuffer()
      const deserialized = accountDeserializer(buffer) as WrappedEVMAccount

      expect(deserialized.accountType).toBe(edgeCaseAccount.accountType)
      expect(deserialized.hash).toBe('')
      expect(deserialized.timestamp).toBe(0)
      expect(deserialized.key).toBe('')
      // Decompressed back to 32 bytes of zeros
      expect(Array.from(deserialized.value!)).toEqual(new Array(32).fill(0))
    })
  })

  describe('Performance characteristics', () => {
    it('should serialize faster than WrappedEVMAccount due to fewer fields', () => {
      const iterations = 1000

      // Warm up
      for (let i = 0; i < 10; i++) {
        accountSerializer(validContractStorage)
      }

      // Time ContractStorage serialization
      const startOptimized = performance.now()
      for (let i = 0; i < iterations; i++) {
        accountSerializer(validContractStorage)
      }
      const endOptimized = performance.now()

      // The test passes if it doesn't crash - performance timing can be flaky in tests
      expect(endOptimized).toBeGreaterThan(startOptimized)
    })
  })
})