import { VectorBufferStream } from '@shardeum-foundation/core'
import { AccountType } from '../shardeum/shardeumTypes'
import { BaseAccount, deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'
import { WrappedEVMAccount } from './WrappedEVMAccount'

const cContractStorageAccountVersion = 1

/**
 * Minimal ContractStorage account type with only essential fields.
 * This eliminates the bloat from unused WrappedEVMAccount fields.
 */
export interface ContractStorageAccount extends BaseAccount {
  accountType: AccountType.ContractStorage
  hash: string         // Account hash (required by Shardus)
  timestamp: number    // Account timestamp (required by Shardus)
  key: string          // Storage key (essential)
  value: Uint8Array    // Storage value (essential)
}

/**
 * Serialize ContractStorageAccount with minimal overhead.
 * Only serializes the 5 essential fields, eliminating 12+ unused fields.
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
  stream.writeBuffer(Buffer.from(obj.value))
}

/**
 * Deserialize ContractStorageAccount.
 * Only reads the essential fields, much faster than WrappedEVMAccount.
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
  const valueBuffer = stream.readBuffer()
  const value = new Uint8Array(valueBuffer.buffer, valueBuffer.byteOffset, valueBuffer.byteLength)

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
 * Convert a WrappedEVMAccount to ContractStorageAccount.
 * Validates it's actually a ContractStorage account and extracts only essential fields.
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
      : new Uint8Array(wrappedAccount.value),
  }
}

/**
 * Convert ContractStorageAccount back to WrappedEVMAccount format for compatibility.
 * Only populates the essential fields, leaves all other fields undefined.
 * Returns a properly typed WrappedEVMAccount with only ContractStorage-relevant fields populated.
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