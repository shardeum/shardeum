import { VectorBufferStream } from '@shardus/core'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

const cEVMAccountVersion = 1

export interface EVMAccount {
  nonce: bigint
  balance: bigint
  storageRoot: Uint8Array
  codeHash: Uint8Array
}

export function serializeEVMAccount(stream: VectorBufferStream, obj: EVMAccount, root = false): void {
  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cEVMAccount)
  }
  stream.writeUInt8(cEVMAccountVersion)

  stream.writeString(obj.nonce.toString())
  stream.writeString(obj.balance.toString())
  stream.writeBuffer(Buffer.from(obj.storageRoot))
  stream.writeBuffer(Buffer.from(obj.codeHash))
}

export function deserializeEVMAccount(stream: VectorBufferStream): EVMAccount {
  const version = stream.readUInt8()
  if (version > cEVMAccountVersion) {
    throw new Error('EVMAccount version mismatch')
  }
  const nonce = BigInt(stream.readString())
  const balance = BigInt(stream.readString())
  const storageRootBuffer = stream.readBuffer()
  const codeHashBuffer = stream.readBuffer()

  const storageRoot = new Uint8Array(
    storageRootBuffer.buffer,
    storageRootBuffer.byteOffset,
    storageRootBuffer.byteLength
  )
  const codeHash = new Uint8Array(codeHashBuffer.buffer, codeHashBuffer.byteOffset, codeHashBuffer.byteLength)

  return {
    nonce,
    balance,
    storageRoot,
    codeHash,
  }
}
