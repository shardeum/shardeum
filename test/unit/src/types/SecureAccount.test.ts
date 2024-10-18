import { VectorBufferStream } from "@shardus/core";
import { deserializeSecureAccount, serializeSecureAccount } from "../../../../src/types/SecureAccount";

import { SecureAccount } from "../../../../src/shardeum/secureAccounts";
import { TypeIdentifierEnum } from "../../../../src/types/enum/TypeIdentifierEnum";

describe('SecureAccount Binary Serialization', () => {
  const testAccount: SecureAccount = {
    id: 'test-id-123',
    hash: 'test-hash-456',
    timestamp: 1234567890,
    accountType: 13, // AccountTypes.SecureAccount
    name: 'Foundation',
    nextTransferAmount: BigInt('1000000000000000000'),
    nextTransferTime: 1234567891,
    nonce: 42
  };

  it('should serialize and deserialize', () => {
    const stream = new VectorBufferStream(1024);
    
    // Serialize
    serializeSecureAccount(stream, testAccount, false);
    
    // Reset position for reading
    stream.position = 0;
    
    // Verify version
    const version = stream.readUInt8();
    expect(version).toBe(1); // cSecureAccountVersion
    
    // Deserialize
    stream.position = 0;
    const deserializedAccount = deserializeSecureAccount(stream);
    
    // Compare all fields
    expect(deserializedAccount.id).toBe(testAccount.id);
    expect(deserializedAccount.hash).toBe(testAccount.hash);
    expect(deserializedAccount.timestamp).toBe(testAccount.timestamp);
    expect(deserializedAccount.accountType).toBe(testAccount.accountType);
    expect(deserializedAccount.name).toBe(testAccount.name);
    expect(deserializedAccount.nextTransferAmount).toBe(testAccount.nextTransferAmount);
    expect(deserializedAccount.nextTransferTime).toBe(testAccount.nextTransferTime);
    expect(deserializedAccount.nonce).toBe(testAccount.nonce);
  });

  it('should serialize and deserialize with root', () => {
    const stream = new VectorBufferStream(1024);
    
    // Serialize
    serializeSecureAccount(stream, testAccount, true);
    
    // Reset position for reading
    stream.position = 0;
    
    // Read out the type because deserializeSecureAccount expects it to be there
    const type = stream.readUInt16();
    expect(type).toBe(TypeIdentifierEnum.cSecureAccount);
    const deserializedAccount = deserializeSecureAccount(stream);
    
    // Compare all fields
    expect(deserializedAccount.id).toBe(testAccount.id);
    expect(deserializedAccount.hash).toBe(testAccount.hash);
    expect(deserializedAccount.timestamp).toBe(testAccount.timestamp);
    expect(deserializedAccount.accountType).toBe(testAccount.accountType);
    expect(deserializedAccount.name).toBe(testAccount.name);
    expect(deserializedAccount.nextTransferAmount).toBe(testAccount.nextTransferAmount);
    expect(deserializedAccount.nextTransferTime).toBe(testAccount.nextTransferTime);
    expect(deserializedAccount.nonce).toBe(testAccount.nonce);
  });

  it('should throw error on version mismatch', () => {
    const stream = new VectorBufferStream(1024);
    stream.writeUInt16(TypeIdentifierEnum.cSecureAccount);
    stream.writeUInt8(2); // Write future version number
    
    stream.position = 0;
    expect(() => deserializeSecureAccount(stream))
      .toThrow('SecureAccount version mismatch');
  });

  it('should handle maximum BigInt values correctly', () => {
    const maxAccount: SecureAccount = {
      ...testAccount,
      nextTransferAmount: BigInt('18446744073709551615'), // Max uint64
      timestamp: Number.MAX_SAFE_INTEGER
    };

    const stream = new VectorBufferStream(1024);
    serializeSecureAccount(stream, maxAccount, false);
    stream.position = 0;
    
    const deserializedAccount = deserializeSecureAccount(stream);
    expect(deserializedAccount.nextTransferAmount).toBe(maxAccount.nextTransferAmount);
    expect(deserializedAccount.timestamp).toBe(maxAccount.timestamp);
  });
});
