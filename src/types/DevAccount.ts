import { VectorBufferStream } from '@shardus/core'
import { BaseAccount, deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

const cDevAccountVersion = 1

export interface DevAccount extends BaseAccount {
  id: string
  hash: string
  timestamp: number
}

export function serializeDevAccount(stream: VectorBufferStream, obj: DevAccount, root = false): void {
  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cDevAccount)
  }
  stream.writeUInt8(cDevAccountVersion)
  serializeBaseAccount(stream, obj, false)
  stream.writeString(obj.id)
  stream.writeString(obj.hash)
  stream.writeBigUInt64(BigInt(obj.timestamp))
}

export function deserializeDevAccount(stream: VectorBufferStream): DevAccount {
  const version = stream.readUInt8()
  if (version > cDevAccountVersion) {
    throw new Error('DevAccount version mismatch')
  }
  const baseAccount = deserializeBaseAccount(stream)
  const id = stream.readString()
  const hash = stream.readString()
  const timestamp = Number(stream.readBigUInt64())

  return {
    ...baseAccount,
    id,
    hash,
    timestamp,
  }
}
