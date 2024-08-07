import { VectorBufferStream } from '@shardus/core'
import { Utils } from '@shardus/types'
import { Change, NetworkParameters } from '../shardeum/shardeumTypes'
import { BaseAccount, deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

const cNetworkAccountVersion = 1

export interface NetworkAccount extends BaseAccount {
  id: string
  current: NetworkParameters
  listOfChanges: Array<{
    cycle: number
    change: Change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appData: any
  }>
  next: NetworkParameters | object
  hash: string
  timestamp: number
  nonce: bigint
  networkId: string
}

export function serializeNetworkAccount(stream: VectorBufferStream, obj: NetworkAccount, root = false): void {
  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cNetworkAccount)
  }
  stream.writeUInt8(cNetworkAccountVersion)

  serializeBaseAccount(stream, obj, false)
  stream.writeString(obj.id)

  const currentJson = Utils.safeStringify(obj.current)
  stream.writeString(currentJson)
  const nextJson = Utils.safeStringify(obj.next)
  stream.writeString(nextJson)

  stream.writeUInt16(obj.listOfChanges.length)
  for (const changeObj of obj.listOfChanges) {
    stream.writeUInt32(changeObj.cycle)
    const changeJson = Utils.safeStringify(changeObj.change)
    stream.writeString(changeJson)
    const appDataJson = Utils.safeStringify(changeObj.appData)
    stream.writeString(appDataJson)
  }

  stream.writeString(obj.hash)
  stream.writeBigUInt64(BigInt(obj.timestamp))
  stream.writeString(obj.nonce.toString())
  stream.writeString(obj.networkId)
}

export function deserializeNetworkAccount(stream: VectorBufferStream): NetworkAccount {
  const version = stream.readUInt8()
  if (version > cNetworkAccountVersion) {
    throw new Error('NetworkAccount version mismatch')
  }

  const baseAccount = deserializeBaseAccount(stream)
  const id = stream.readString()

  const current = Utils.safeJsonParse(stream.readString()) as NetworkParameters
  const next = Utils.safeJsonParse(stream.readString())

  const changesCount = stream.readUInt16()
  const listOfChanges = []
  for (let i = 0; i < changesCount; i++) {
    const cycle = stream.readUInt32()
    const change = Utils.safeJsonParse(stream.readString()) as Change
    const appData = Utils.safeJsonParse(stream.readString())
    listOfChanges.push({ cycle, change, appData })
  }

  const hash = stream.readString()
  const timestamp = Number(stream.readBigUInt64())
  const nonce = BigInt(stream.readString())
  const networkId = stream.readString()

  return {
    ...baseAccount,
    id,
    current,
    listOfChanges,
    next,
    hash,
    timestamp,
    nonce,
    networkId,
  }
}
