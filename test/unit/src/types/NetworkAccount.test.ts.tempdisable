import { VectorBufferStream } from '@shardus/core'
import { Utils } from '@shardus/types'
import {
  NetworkAccount,
  deserializeNetworkAccount,
  serializeNetworkAccount,
} from '../../../../src/types/NetworkAccount'
import { TypeIdentifierEnum } from '../../../../src/types/enum/TypeIdentifierEnum'
import { AccountType } from '../../../../src/shardeum/shardeumTypes'

describe('NetworkAccount Serialization', () => {
  test('should serialize with root true', () => {
    const obj: NetworkAccount = {
      accountType: AccountType.NetworkAccount,
      id: 'test',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current: { test: 'test' } as any,
      listOfChanges: [{ cycle: 1, change: { test: 'test' }, appData: { test: 'test' } }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { test: 'test' } as any,
      hash: 'test',
      timestamp: 1,
    }
    const stream = new VectorBufferStream(0)
    serializeNetworkAccount(stream, obj, true)

    stream.position = 0

    const type = stream.readUInt16()
    expect(type).toEqual(TypeIdentifierEnum.cNetworkAccount)
    const deserialised = deserializeNetworkAccount(stream)

    expect(deserialised).toEqual(obj)
    expect(Utils.safeStringify(deserialised)).toEqual(Utils.safeStringify(obj))
  })
})
