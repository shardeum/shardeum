// src/types/SecureAccount.ts
import { VectorBufferStream } from '@shardus/core'
import { AccountType } from '../shardeum/shardeumTypes'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

import { SecureAccount } from '../shardeum/secureAccounts'

export function serializeSecureAccount(stream: VectorBufferStream, obj: SecureAccount, root = false): void {
  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cSecureAccount)
  }
  stream.writeString(obj.id)
  stream.writeString(obj.hash)
  stream.writeBigUInt64(BigInt(obj.timestamp))
  stream.writeUInt8(obj.accountType)
  stream.writeString(obj.name)
  stream.writeBigUInt64(BigInt(obj.nextTransferAmount))
  stream.writeBigUInt64(BigInt(obj.nextTransferTime))
  stream.writeUInt32(obj.nonce)
}

export function deserializeSecureAccount(stream: VectorBufferStream, root = false): SecureAccount {
  if (root) {
    stream.readUInt16() // TypeIdentifier
  }
  return {
    id: stream.readString(),
    hash: stream.readString(),
    timestamp: Number(stream.readBigUInt64()),
    accountType: AccountType.SecureAccount,
    name: stream.readString(),
    nextTransferAmount: stream.readBigUInt64(),
    nextTransferTime: Number(stream.readBigUInt64()),
    nonce: stream.readUInt32(),
  }
}

