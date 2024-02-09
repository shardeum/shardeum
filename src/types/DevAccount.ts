import { VectorBufferStream } from '@shardus/core'
import { BaseAccount, serializeBaseAccount } from './BaseAccount'
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
  stream.writeUInt16(cDevAccountVersion)
  serializeBaseAccount(stream, obj, false)
  stream.writeString(obj.id)
  stream.writeString(obj.hash)
  stream.writeString(obj.timestamp.toString())
}

export function deserializeDevAccount(stream: VectorBufferStream): DevAccount {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const version = stream.readUInt16()
  const baseAccount = deserializeDevAccount(stream)
  const id = stream.readString()
  const hash = stream.readString()
  const timestamp = Number(stream.readString())

  return {
    ...baseAccount,
    id,
    hash,
    timestamp,
  }
}
