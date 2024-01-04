import { VectorBufferStream } from '@shardus/core'
import { EVMAccount, deserializeEVMAccount, serializeEVMAccount } from './EVMAccount'
import { binaryDeserializer, binarySerializer } from './Helpers'

const cEVMAppData = 2
const cEVMAppDataVersion = 1

export interface EVMAppData {
  accountType: number
  ethAddress: string
  hash: string
  timestamp: number
  account?: EVMAccount
  key?: string
  value?: Uint8Array
  codeHash?: Uint8Array
  codeByte?: Uint8Array
  contractAddress?: string
  amountSpent?: string
  txId?: string
  txFrom?: string
  balance?: number
}

export function serializeEVMAppData(stream: VectorBufferStream, obj: EVMAppData, root = false): void {
  if (root) {
    stream.writeUInt16(cEVMAppData)
  }
  stream.writeUInt16(cEVMAppDataVersion)

  stream.writeUInt32(obj.accountType)
  stream.writeString(obj.ethAddress)
  stream.writeString(obj.hash)
  stream.writeUInt32(obj.timestamp)

  // Serialize optional fields with presence flags
  if (obj.account !== undefined) {
    stream.writeUInt8(1) // Presence flag
    serializeEVMAccount(stream, obj.account)
  } else {
    stream.writeUInt8(0) // Absence flag
  }
  obj.key !== undefined ? (stream.writeUInt8(1), stream.writeString(obj.key)) : stream.writeUInt8(0)
  obj.value !== undefined
    ? (stream.writeUInt8(1), stream.writeBuffer(Buffer.from(obj.value)))
    : stream.writeUInt8(0)
  obj.codeHash !== undefined
    ? (stream.writeUInt8(1), stream.writeBuffer(Buffer.from(obj.codeHash)))
    : stream.writeUInt8(0)
  obj.codeByte !== undefined
    ? (stream.writeUInt8(1), stream.writeBuffer(Buffer.from(obj.codeByte)))
    : stream.writeUInt8(0)
  obj.contractAddress !== undefined
    ? (stream.writeUInt8(1), stream.writeString(obj.contractAddress))
    : stream.writeUInt8(0)
  obj.amountSpent !== undefined
    ? (stream.writeUInt8(1), stream.writeString(obj.amountSpent))
    : stream.writeUInt8(0)
  obj.txId !== undefined ? (stream.writeUInt8(1), stream.writeString(obj.txId)) : stream.writeUInt8(0)
  obj.txFrom !== undefined ? (stream.writeUInt8(1), stream.writeString(obj.txFrom)) : stream.writeUInt8(0)
  obj.balance !== undefined ? (stream.writeUInt8(1), stream.writeUInt32(obj.balance)) : stream.writeUInt8(0)
}

export function deserializeEVMAppData(stream: VectorBufferStream): EVMAppData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const version = stream.readUInt16()
  const accountType = stream.readUInt32()
  const ethAddress = stream.readString()
  const hash = stream.readString()
  const timestamp = stream.readUInt32()
  const account = stream.readUInt8() === 1 ? deserializeEVMAccount(stream) : undefined
  const key = stream.readUInt8() === 1 ? stream.readString() : undefined
  const valueBuffer = stream.readUInt8() === 1 ? stream.readBuffer() : undefined
  const value = valueBuffer
    ? new Uint8Array(valueBuffer.buffer, valueBuffer.byteOffset, valueBuffer.byteLength)
    : undefined
  const codeHashBuffer = stream.readUInt8() === 1 ? stream.readBuffer() : undefined
  const codeHash = codeHashBuffer
    ? new Uint8Array(codeHashBuffer.buffer, codeHashBuffer.byteOffset, codeHashBuffer.byteLength)
    : undefined
  const codeByteBuffer = stream.readUInt8() === 1 ? stream.readBuffer() : undefined
  const codeByte = codeByteBuffer
    ? new Uint8Array(codeByteBuffer.buffer, codeByteBuffer.byteOffset, codeByteBuffer.byteLength)
    : undefined
  const contractAddress = stream.readUInt8() === 1 ? stream.readString() : undefined
  const amountSpent = stream.readUInt8() === 1 ? stream.readString() : undefined
  const txId = stream.readUInt8() === 1 ? stream.readString() : undefined
  const txFrom = stream.readUInt8() === 1 ? stream.readString() : undefined
  const balance = stream.readUInt8() === 1 ? stream.readUInt32() : undefined
  const obj: EVMAppData = {
    accountType,
    ethAddress,
    hash,
    timestamp,
    account,
    key,
    value,
    codeHash,
    codeByte,
    contractAddress,
    amountSpent,
    txId,
    txFrom,
    balance,
  }
  return obj
}
