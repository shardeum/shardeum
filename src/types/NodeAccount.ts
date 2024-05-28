import { VectorBufferStream } from '@shardus/core'
import { NodeAccountStats } from '../shardeum/shardeumTypes'
import { BaseAccount, deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'
import { Utils } from '@shardus/types'

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

export function serializeNodeAccount(
  stream: VectorBufferStream,
  obj: NodeAccount,
  type: TypeIdentifierEnum,
  root = false
): void {
  if (root) {
    stream.writeUInt16(type)
  }
  stream.writeUInt8(cNodeAccountVersion)

  serializeBaseAccount(stream, obj, false)
  stream.writeString(obj.id)
  stream.writeString(obj.hash)
  stream.writeBigUInt64(BigInt(obj.timestamp))

  // Serialize nullable string
  if (obj.nominator !== null) {
    stream.writeUInt8(1) // true flag
    stream.writeString(obj.nominator)
  } else {
    stream.writeUInt8(0) // false flag
  }

  stream.writeString(obj.stakeLock.toString())
  stream.writeString(obj.reward.toString())
  stream.writeBigUInt64(BigInt(obj.rewardStartTime))
  stream.writeBigUInt64(BigInt(obj.rewardEndTime))
  stream.writeString(obj.penalty.toString())

  stream.writeString(Utils.safeStringify(obj.nodeAccountStats))

  stream.writeUInt8(obj.rewarded ? 1 : 0) // Serialize boolean as UInt8
}

export function deserializeNodeAccount(stream: VectorBufferStream): NodeAccount {
  const version = stream.readUInt8()
  if (version > cNodeAccountVersion) {
    throw new Error('NodeAccount version mismatch')
  }

  const baseAccount = deserializeBaseAccount(stream)
  const id = stream.readString()
  const hash = stream.readString()
  const timestamp = Number(stream.readBigUInt64())

  // Deserialize nullable string
  let nominator = null
  if (stream.readUInt8() === 1) {
    // true flag
    nominator = stream.readString()
  }
  const stakeLock = BigInt(stream.readString())
  const reward = BigInt(stream.readString())
  const rewardStartTime = Number(stream.readBigUInt64())
  const rewardEndTime = Number(stream.readBigUInt64())
  const penalty = BigInt(stream.readString())

  const nodeAccountStats = Utils.safeJsonParse(stream.readString()) as NodeAccountStats

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
