import { VectorBufferStream } from '@shardus/core'
import { NodeAccountStats } from '../shardeum/shardeumTypes'
import { DeSerializeFromJsonString, SerializeToJsonString } from '../utils'
import { BaseAccount, deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

const cNodeAccountVersion = 1

export interface NodeAccount extends BaseAccount {
  id: string
  hash: string
  timestamp: number
  nominator: string | null
  stakeLock: bigint
  reward: bigint
  rewardStartTime: number
  rewardEndTime: number
  penalty: bigint
  nodeAccountStats: NodeAccountStats
  rewarded: boolean
}

export function serializeNodeAccount(stream: VectorBufferStream, obj: NodeAccount, root = false): void {
  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cNodeAccount)
  }
  stream.writeUInt16(cNodeAccountVersion)

  serializeBaseAccount(stream, obj, false)
  stream.writeString(obj.id)
  stream.writeString(obj.hash)
  stream.writeString(obj.timestamp.toString())

  // Serialize nullable string
  if (obj.nominator !== null) {
    stream.writeUInt8(1) // true flag
    stream.writeString(obj.nominator)
  } else {
    stream.writeUInt8(0) // false flag
  }

  stream.writeString(obj.stakeLock.toString())
  stream.writeString(obj.reward.toString())
  stream.writeString(obj.rewardStartTime.toString())
  stream.writeString(obj.rewardEndTime.toString())
  stream.writeString(obj.penalty.toString())

  stream.writeString(SerializeToJsonString(obj.nodeAccountStats))

  stream.writeUInt8(obj.rewarded ? 1 : 0) // Serialize boolean as UInt8
}

export function deserializeNodeAccount(stream: VectorBufferStream): NodeAccount {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const version = stream.readUInt16()

  const baseAccount = deserializeBaseAccount(stream)
  const id = stream.readString()
  const hash = stream.readString()
  const timestamp = Number(stream.readString())

  // Deserialize nullable string
  let nominator = null
  if (stream.readUInt8() === 1) {
    // true flag
    nominator = stream.readString()
  }
  const stakeLock = BigInt(stream.readString())
  const reward = BigInt(stream.readString())
  const rewardStartTime = Number(stream.readString())
  const rewardEndTime = Number(stream.readString())
  const penalty = BigInt(stream.readString())

  const nodeAccountStats = DeSerializeFromJsonString<NodeAccountStats>(stream.readString())

  const rewarded = stream.readUInt8() === 1

  return {
    ...baseAccount,
    id,
    hash,
    timestamp,
    nominator,
    stakeLock,
    reward,
    rewardStartTime,
    rewardEndTime,
    penalty,
    nodeAccountStats,
    rewarded,
  }
}
