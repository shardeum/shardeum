import { VectorBufferStream } from '@shardus/core'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

const cBaseAccountVersion = 1

export interface BaseAccount {
  accountType: number
}

export function serializeBaseAccount(stream: VectorBufferStream, obj: BaseAccount, root = false): void {
  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cBaseAccount)
  }
  stream.writeUInt8(cBaseAccountVersion)
  stream.writeUInt16(obj.accountType)
}

export function deserializeBaseAccount(stream: VectorBufferStream): BaseAccount {
  const version = stream.readUInt8()
  if (version > cBaseAccountVersion) {
    throw new Error('BaseAccount version mismatch')
  }
  const accountType = stream.readUInt16()
  return {
    accountType,
  }
}
