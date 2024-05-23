import { ShardusTypes, VectorBufferStream } from '@shardus/core'
import { Change, NetworkParameters } from '../shardeum/shardeumTypes'
import { DeSerializeFromJsonString, SerializeToJsonString } from '../utils'
import { BaseAccount, deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

const cNetworkAccountVersion = 1

export interface NetworkAccount extends BaseAccount {
  id: string
  current: NetworkParameters
  listOfChanges: Array<{
    cycle: number
    change: Change
  }>
  next
  hash: string
  timestamp: number
  mode: ShardusTypes.ServerMode
}

export function serializeNetworkAccount(stream: VectorBufferStream, obj: NetworkAccount, root = false): void {
  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cNetworkAccount)
  }
  stream.writeUInt8(cNetworkAccountVersion)

  serializeBaseAccount(stream, obj, false)
  stream.writeString(obj.id)

  const currentJson = SerializeToJsonString(obj.current)
  stream.writeString(currentJson)
  const nextJson = SerializeToJsonString(obj.next)
  stream.writeString(nextJson)

  stream.writeUInt16(obj.listOfChanges.length)
  for (const changeObj of obj.listOfChanges) {
    stream.writeUInt32(changeObj.cycle)
    const changeJson = SerializeToJsonString(changeObj.change)
    stream.writeString(changeJson)
  }

  stream.writeString(obj.hash)
  stream.writeBigUInt64(BigInt(obj.timestamp))
  stream.writeString(obj.mode)
}

export function deserializeNetworkAccount(stream: VectorBufferStream): NetworkAccount {
  const version = stream.readUInt8()
  if (version > cNetworkAccountVersion) {
    throw new Error('NetworkAccount version mismatch')
  }

  const baseAccount = deserializeBaseAccount(stream)
  const id = stream.readString()

  const current = DeSerializeFromJsonString<NetworkParameters>(stream.readString())
  const next = DeSerializeFromJsonString(stream.readString())

  const changesCount = stream.readUInt16()
  const listOfChanges = []
  for (let i = 0; i < changesCount; i++) {
    const cycle = stream.readUInt32()
    const change = DeSerializeFromJsonString<Change>(stream.readString())
    listOfChanges.push({ cycle, change })
  }

  const hash = stream.readString()
  const timestamp = Number(stream.readBigUInt64())
  const mode = stream.readString() as ShardusTypes.ServerMode

  return {
    ...baseAccount,
    id,
    current,
    listOfChanges,
    next,
    hash,
    timestamp,
    mode,
  }
}
