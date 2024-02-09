import { VectorBufferStream } from '@shardus/core'
import { AccountType } from '../shardeum/shardeumTypes'
import { BaseAccount } from './BaseAccount'
import { DevAccount, deserializeDevAccount, serializeDevAccount } from './DevAccount'
import { NetworkAccount, serializeNetworkAccount } from './NetworkAccount'
import { NodeAccount, serializeNodeAccount } from './NodeAccount'
import { WrappedEVMAccount, serializeWrappedEVMAccount } from './WrappedEVMAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

export const binarySerializer = <T>(
  data: T,
  serializerFunc: (stream: VectorBufferStream, obj: T, root?: boolean) => void
): VectorBufferStream => {
  const serializedPayload = new VectorBufferStream(0)
  serializerFunc(serializedPayload, data, true)
  return serializedPayload
}

export const binaryDeserializer = <T>(
  data: Buffer,
  deserializerFunc: (stream: VectorBufferStream, root?: boolean) => T
): T => {
  const payloadStream = VectorBufferStream.fromBuffer(data)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const payloadType = payloadStream.readUInt16()
  return deserializerFunc(payloadStream)
}

export const accountSerializer = <T extends BaseAccount>(data: T): VectorBufferStream => {
  const serializedPayload = new VectorBufferStream(0)
  switch (data.accountType) {
    case AccountType.DevAccount:
      serializeDevAccount(serializedPayload, data as unknown as DevAccount, true)
      break
    case AccountType.NetworkAccount:
      serializeNetworkAccount(serializedPayload, data as unknown as NetworkAccount, true)
      break
    case AccountType.NodeAccount:
      serializeNodeAccount(serializedPayload, data as unknown as NodeAccount, true)
      break
    default:
      serializeWrappedEVMAccount(serializedPayload, data as unknown as WrappedEVMAccount, true)
  }
  return serializedPayload
}

export const accountDeserializer = <T extends BaseAccount>(data: Buffer): T => {
  const payloadStream = VectorBufferStream.fromBuffer(data)
  const payloadType = payloadStream.readUInt16()
  switch (payloadType) {
    case TypeIdentifierEnum.cDevAccount:
      return deserializeDevAccount(payloadStream) as unknown as T
    case TypeIdentifierEnum.cNetworkAccount:
      return deserializeDevAccount(payloadStream) as unknown as T
    case TypeIdentifierEnum.cNodeAccount:
      return deserializeDevAccount(payloadStream) as unknown as T
    case TypeIdentifierEnum.cWrappedEVMAccount:
      return deserializeDevAccount(payloadStream) as unknown as T
    default:
      throw new Error(`Unknown account type ${payloadType}`)
  }
}
