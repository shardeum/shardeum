import { VectorBufferStream, nestedCountersInstance } from '@shardus/core'
import { AccountType, NodeAccount2 } from '../shardeum/shardeumTypes'
import { BaseAccount } from './BaseAccount'
import { DevAccount, deserializeDevAccount, serializeDevAccount } from './DevAccount'
import { NetworkAccount, deserializeNetworkAccount, serializeNetworkAccount } from './NetworkAccount'
import { NodeAccount, deserializeNodeAccount, serializeNodeAccount } from './NodeAccount'
import {
  WrappedEVMAccount,
  deserializeWrappedEVMAccount,
  serializeWrappedEVMAccount,
} from './WrappedEVMAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'
import { Utils } from '@shardus/types'

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
      nestedCountersInstance.countEvent('binarySerialize', 'DevAccount')
      serializeDevAccount(serializedPayload, data as unknown as DevAccount, true)
      break
    case AccountType.NetworkAccount:
      nestedCountersInstance.countEvent('binarySerialize', 'NetworkAccount')
      serializeNetworkAccount(serializedPayload, data as unknown as NetworkAccount, true)
      break
    case AccountType.NodeAccount:
      nestedCountersInstance.countEvent('binarySerialize', 'NodeAccount')
      serializeNodeAccount(
        serializedPayload,
        data as unknown as NodeAccount,
        TypeIdentifierEnum.cNodeAccount,
        true
      )
      break
    case AccountType.NodeAccount2:
      nestedCountersInstance.countEvent('binarySerialize', 'NodeAccount2')
      serializeNodeAccount(
        serializedPayload,
        data as unknown as NodeAccount2,
        TypeIdentifierEnum.cNodeAccount2,
        true
      )
      break
    case AccountType.Account:
    case AccountType.ContractCode:
    case AccountType.ContractStorage:
    case AccountType.Receipt:
      nestedCountersInstance.countEvent('binarySerialize', 'WrappedEVMAccount')
      serializeWrappedEVMAccount(serializedPayload, data as unknown as WrappedEVMAccount, true)
      break
    default:
      nestedCountersInstance.countEvent('binarySerialize', `UnknownAccType-${data.accountType}`)
      serializedPayload.writeUInt16(TypeIdentifierEnum.cUnknown)
      serializedPayload.writeString(Utils.safeStringify(data))
      break
  }
  return serializedPayload
}

export const accountDeserializer = <T extends BaseAccount>(data: Buffer): T => {
  const payloadStream = VectorBufferStream.fromBuffer(data)
  const payloadType = payloadStream.readUInt16()
  switch (payloadType) {
    case TypeIdentifierEnum.cDevAccount:
      nestedCountersInstance.countEvent('binaryDeserialize', 'DevAccount')
      return deserializeDevAccount(payloadStream) as unknown as T
    case TypeIdentifierEnum.cNetworkAccount:
      nestedCountersInstance.countEvent('binaryDeserialize', 'NetworkAccount')
      return deserializeNetworkAccount(payloadStream) as unknown as T
    case TypeIdentifierEnum.cNodeAccount:
      nestedCountersInstance.countEvent('binaryDeserialize', 'NodeAccount')
      return deserializeNodeAccount(payloadStream) as unknown as T
    case TypeIdentifierEnum.cNodeAccount2:
      nestedCountersInstance.countEvent('binaryDeserialize', 'NodeAccount2')
      return deserializeNodeAccount(payloadStream) as unknown as T
    case TypeIdentifierEnum.cWrappedEVMAccount:
      nestedCountersInstance.countEvent('binaryDeserialize', 'WrappedEVMAccount')
      return deserializeWrappedEVMAccount(payloadStream) as unknown as T
    default:
      nestedCountersInstance.countEvent('binaryDeserialize', `UnknownAccType-${payloadType}`)
      return Utils.safeJsonParse(payloadStream.readString()) as unknown as T
  }
}
