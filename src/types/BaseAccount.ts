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
  stream.writeUInt16(cBaseAccountVersion)
  stream.writeUInt16(obj.accountType)
}

export function deserializeBaseAccount(stream: VectorBufferStream): BaseAccount {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const version = stream.readUInt16()
  const accountType = stream.readUInt16()
  return {
    accountType,
  }
}
