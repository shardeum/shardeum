import { ShardusTypes, VectorBufferStream } from '@shardeum-foundation/core'
import { Change, NetworkParameters } from '../shardeum/shardeumTypes'
import { BaseAccount, deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'
import { Utils } from '@shardeum-foundation/lib-types'

const cNetworkAccountVersion = 1

// Delete this and the corresponding flag post upgrade to 1.11.2
// const Beta1_11_2NetworkAccountJson = '{"accountType":5,"current":{"activeVersion":"1.11.0","archiver":{"activeVersion":"3.4.12","latestVersion":"3.4.12","minVersion":"3.4.12"},"certCycleDuration":30,"description":"These are the initial network parameters Shardeum started with","latestVersion":"1.11.2","maintenanceFee":0,"maintenanceInterval":86400000,"minVersion":"1.11.2","nodePenaltyUsd":{"dataType":"bi","value":"8ac7230489e80000"},"nodeRewardAmountUsd":{"dataType":"bi","value":"de0b6b3a7640000"},"nodeRewardInterval":3600000,"stabilityScaleDiv":1000,"stabilityScaleMul":1000,"stakeRequiredUsd":{"dataType":"bi","value":"8ac7230489e80000"},"title":"Initial parameters","txPause":false},"hash":"6e60d839eabcb7578ae7a172288c3e2fc9c9fa8e7753e70534329f61561fb95d","id":"1000000000000000000000000000000000000000000000000000000000000001","listOfChanges":[{"appData":{"latestVersion":"1.11.2"},"change":{},"cycle":3807},{"appData":{"minVersion":"1.11.2"},"change":{},"cycle":3808},{"appData":{"minVersion":"1.11.2"},"change":{},"cycle":3809},{"appData":{"minVersion":"1.11.2"},"change":{},"cycle":3813}],"next":{},"timestamp":1719612186585}'

export interface NetworkAccount extends BaseAccount {
  id: string
  current: NetworkParameters
  listOfChanges: Array<{
    cycle: number
    change: Change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appData?: any
  }>
  next: NetworkParameters | object
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

  const currentJson = Utils.safeStringify(obj.current)
  stream.writeString(currentJson)
  const nextJson = Utils.safeStringify(obj.next)
  stream.writeString(nextJson)

  stream.writeUInt16(obj.listOfChanges.length)
  for (const changeObj of obj.listOfChanges) {
    stream.writeUInt32(changeObj.cycle)
    const changeJson = Utils.safeStringify(changeObj.change)
    stream.writeString(changeJson)
    if (changeObj.appData) {
      stream.writeUInt8(1)
      const appDataJson = Utils.safeStringify(changeObj.appData)
      stream.writeString(appDataJson)
    } else {
      stream.writeUInt8(0)
    }
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

  const current = Utils.safeJsonParse(stream.readString()) as NetworkParameters
  const next = Utils.safeJsonParse(stream.readString())

  const changesCount = stream.readUInt16()
  const listOfChanges = []
  for (let i = 0; i < changesCount; i++) {
    const cycle = stream.readUInt32()
    const change = Utils.safeJsonParse(stream.readString()) as Change

    const isAppDataPresent = stream.readUInt8() === 1
    if (isAppDataPresent) {
      const appData = Utils.safeJsonParse(stream.readString())
      listOfChanges.push({ cycle, change, appData })
    } else {
      listOfChanges.push({ cycle, change })
    }
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
