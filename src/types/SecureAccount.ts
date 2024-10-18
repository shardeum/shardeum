// src/types/SecureAccount.ts
import { VectorBufferStream } from '@shardus/core'
import { AccountType } from '../shardeum/shardeumTypes'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

import { SecureAccount } from '../shardeum/secureAccounts'
import { deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { Utils } from '@shardus/types'

function validateSecureAccount(obj: SecureAccount) {
  if (typeof obj.id !== 'string' || typeof obj.hash !== 'string' || typeof obj.timestamp !== 'number' || typeof obj.name !== 'string' || typeof obj.nextTransferAmount !== 'bigint' || typeof obj.nextTransferTime !== 'number' || typeof obj.nonce !== 'number') {
    throw new Error(`Invalid SecureAccount object: ${Utils.safeStringify(obj)}`)
  }
}

const cSecureAccountVersion = 1
export function serializeSecureAccount(stream: VectorBufferStream, obj: SecureAccount, root = false): void {
  // Apply basic validation on the object (check that all the properties of SecureAccount are present and of the correct types)
  validateSecureAccount(obj)

  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cSecureAccount)
  }
  stream.writeUInt8(cSecureAccountVersion)

  serializeBaseAccount(stream, obj, false)
  stream.writeString(obj.id)
  stream.writeString(obj.hash)
  stream.writeBigUInt64(BigInt(obj.timestamp))

  stream.writeString(obj.name)
  stream.writeBigUInt64(obj.nextTransferAmount)
  stream.writeBigUInt64(BigInt(obj.nextTransferTime))
  stream.writeUInt32(obj.nonce)
}

export function deserializeSecureAccount(stream: VectorBufferStream): SecureAccount {
  const version = stream.readUInt8()
  if (version > cSecureAccountVersion) {
    throw new Error('SecureAccount version mismatch')
  }

  const baseAccount = deserializeBaseAccount(stream)
  // Check if we have enough bytes remaining for the rest of the data
  const remainingBytes = (stream as any).buffer.length - stream.position;
  const minimumBytesNeeded =
    8 + // id (String)
    8 + // hash (String)
    8 + // timestamp (BigUInt64)
    4 + // minimum for string length fields
    8 + // nextTransferAmount (BigUInt64)
    8 + // nextTransferTime (BigUInt64)
    4;  // nonce (UInt32)

  if (remainingBytes < minimumBytesNeeded) {
    throw new Error(`Unexpected end of buffer: remaining bytes: ${remainingBytes}, needed ${minimumBytesNeeded}`);
  }

  // Read each field, asserting its type as we go. If there is an issue, log and throw error.
  try {
    const id = stream.readString()
    if (typeof id !== 'string') throw new Error('id must be string')

    const hash = stream.readString()
    if (typeof hash !== 'string') throw new Error('hash must be string')

    const timestamp = Number(stream.readBigUInt64())
    if (isNaN(timestamp)) throw new Error('timestamp must be number')

    const name = stream.readString()
    if (typeof name !== 'string') throw new Error('name must be string')

    const nextTransferAmount = stream.readBigUInt64()
    if (typeof nextTransferAmount !== 'bigint') throw new Error('nextTransferAmount must be bigint')

    const nextTransferTime = Number(stream.readBigUInt64())
    if (isNaN(nextTransferTime)) throw new Error('nextTransferTime must be number')

    const nonce = stream.readUInt32()
    if (typeof nonce !== 'number') throw new Error('nonce must be number')

    const foo = {
      ...baseAccount,
      id,
      hash,
      timestamp,
      name,
      nextTransferAmount,
      nextTransferTime,
      nonce
    }
    validateSecureAccount(foo)
    return foo
  } catch (err) {
    throw new Error(`Could not deserialize secure account: ${err.message} ${err.stack}`);
  }
}
