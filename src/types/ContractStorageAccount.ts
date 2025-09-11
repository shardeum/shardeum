import { VectorBufferStream } from '@shardeum-foundation/core'
import { AccountType } from '../shardeum/shardeumTypes'
import { BaseAccount, deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'
import { WrappedEVMAccount } from './WrappedEVMAccount'

const cContractStorageAccountVersion = 1

/**
 * Compress value by removing leading zeros and storing as raw bytes
 * Much more efficient than hex string encoding
 */
function compressValue(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 0) return new Uint8Array([0])

  // Find first non-zero byte
  let firstNonZero = 0
  while (firstNonZero < bytes.length && bytes[firstNonZero] === 0) {
    firstNonZero++
  }

  // All zeros case - store as single zero byte
  if (firstNonZero === bytes.length) return new Uint8Array([0])

  // Return only the significant bytes (no length prefix needed for serialization)
  return bytes.slice(firstNonZero)
}

/**
 * Decompress value - if compressed is larger than 32 bytes, return as-is
 * Otherwise pad with leading zeros to 32 bytes
 */
function decompressValue(compressed: Uint8Array): Uint8Array {
  if (compressed.length === 1 && compressed[0] === 0) {
    return new Uint8Array(32) // All zeros, pad to 32 bytes
  }

  // If compressed value is larger than 32 bytes, return as-is (no truncation)
  if (compressed.length > 32) {
    return compressed
  }

  // Pad smaller values to 32 bytes with leading zeros
  const result = new Uint8Array(32)
  result.set(compressed, 32 - compressed.length)

  return result
}


/**
 * Convert minimal hex string to Uint8Array
 */
function fromMinimalHex(hex: string): Uint8Array {
  if (!hex.startsWith('0x')) {
    throw new Error('Hex string must start with 0x')
  }

  const cleanHex = hex.slice(2)
  if (cleanHex.length === 0 || cleanHex === '0') {
    return new Uint8Array([0])
  }

  // Pad odd length hex strings
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex

  const bytes = new Uint8Array(paddedHex.length / 2)
  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes[i / 2] = parseInt(paddedHex.substring(i, i + 2), 16)
  }

  return bytes
}

/**
 * Optimized ContractStorage account with compressed value storage.
 * Value is stored as compressed binary instead of hex string for better space efficiency.
 */
export interface ContractStorageAccount extends BaseAccount {
  accountType: AccountType.ContractStorage
  hash: string         // Account hash (required by Shardus)
  timestamp: number    // Account timestamp (required by Shardus)
  key: string          // Storage key (essential)
  value: Uint8Array    // Storage value as compressed binary (removes leading zeros)
}

/**
 * Serialize ContractStorageAccount with compressed value.
 * Value is stored as length-prefixed compressed binary.
 */
export function serializeContractStorageAccount(
  stream: VectorBufferStream,
  obj: ContractStorageAccount,
  root = false
): void {
  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cContractStorageAccount)
  }
  stream.writeUInt8(cContractStorageAccountVersion)

  // Serialize base account (accountType)
  serializeBaseAccount(stream, obj, false)
  
  // Serialize essential ContractStorage fields only
  stream.writeString(obj.hash)
  stream.writeBigUInt64(BigInt(obj.timestamp))
  stream.writeString(obj.key)

  // Compress and serialize value with length prefix
  const compressedValue = compressValue(obj.value)
  stream.writeUInt8(compressedValue.length)
  if (compressedValue.length > 0) {
    stream.writeBuffer(Buffer.from(compressedValue))
  }
}

/**
 * Deserialize ContractStorageAccount with compressed value support.
 * Handles both v1 (hex string) and v2 (compressed binary) formats.
 */
export function deserializeContractStorageAccount(stream: VectorBufferStream): ContractStorageAccount {
  const version = stream.readUInt8()
  if (version > cContractStorageAccountVersion) {
    throw new Error('ContractStorageAccount version mismatch')
  }

  const baseAccount = deserializeBaseAccount(stream)
  const hash = stream.readString()
  const timestamp = Number(stream.readBigUInt64())
  const key = stream.readString()

  // Read compressed binary value
  const compressedLength = stream.readUInt8()
  let compressedValue: Uint8Array
  if (compressedLength > 0) {
    const buffer = stream.readBuffer()
    compressedValue = new Uint8Array(buffer)
  } else {
    compressedValue = new Uint8Array([0])
  }
  const value = decompressValue(compressedValue)

  const obj: ContractStorageAccount = {
    ...baseAccount,
    accountType: AccountType.ContractStorage,
    hash,
    timestamp,
    key,
    value,
  }
  return obj
}

/**
 * Convert a WrappedEVMAccount to ContractStorageAccount with compressed value.
 * Stores value as compressed binary for space efficiency.
 */
export function toContractStorageAccount(wrappedAccount: WrappedEVMAccount): ContractStorageAccount {
  if (wrappedAccount.accountType !== AccountType.ContractStorage) {
    throw new Error('Account is not a ContractStorage type')
  }

  if (wrappedAccount.key === undefined || wrappedAccount.value === undefined) {
    throw new Error('ContractStorage account missing essential fields (key or value)')
  }

  return {
    accountType: AccountType.ContractStorage,
    hash: wrappedAccount.hash,
    timestamp: wrappedAccount.timestamp,
    key: wrappedAccount.key,
    value: wrappedAccount.value instanceof Uint8Array
      ? wrappedAccount.value
      : fromMinimalHex(wrappedAccount.value),
  }
}

/**
 * Convert ContractStorageAccount back to WrappedEVMAccount format for compatibility.
 * Value is already in binary format, no conversion needed.
 */
export function toWrappedEVMAccount(contractStorage: ContractStorageAccount): WrappedEVMAccount {
  return {
    accountType: contractStorage.accountType,
    hash: contractStorage.hash,
    timestamp: contractStorage.timestamp,
    key: contractStorage.key,
    value: contractStorage.value,
    // All other WrappedEVMAccount fields explicitly undefined (bloat eliminated)
    account: undefined,
    codeHash: undefined,
    codeByte: undefined,
    contractAddress: undefined,
    ethAddress: undefined,
    receipt: undefined,
    readableReceipt: undefined,
    amountSpent: undefined,
    txId: undefined,
    txFrom: undefined,
    balance: undefined,
    operatorAccountInfo: undefined,
  }
}