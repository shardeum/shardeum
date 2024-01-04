import { VectorBufferStream } from '@shardus/core'

const cEVMAccount = 1
const cEVMAccountVersion = 1

export interface EVMAccount {
  nonce: bigint
  balance: bigint
  storageRoot: Uint8Array
  codeHash: Uint8Array
}

export function serializeEVMAccount(stream: VectorBufferStream, obj: EVMAccount, root = false): void {
  if (root) {
    stream.writeUInt16(cEVMAccount)
  }
  stream.writeUInt16(cEVMAccountVersion)

  stream.writeBigUInt64(obj.nonce)
  stream.writeBigUInt64(obj.balance)
  stream.writeBuffer(Buffer.from(obj.storageRoot))
  stream.writeBuffer(Buffer.from(obj.codeHash))
}

export function deserializeEVMAccount(stream: VectorBufferStream): EVMAccount {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const version = stream.readUInt16()
  const nonce = stream.readBigInt64()
  const balance = stream.readBigInt64()
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
