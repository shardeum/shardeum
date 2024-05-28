import { Account } from '@ethereumjs/util'
import { VectorBufferStream } from '@shardus/core'
import { OperatorAccountInfo, ReadableReceipt } from '../shardeum/shardeumTypes'
import { TxReceipt } from '../vm_v7'
import { BaseAccount, deserializeBaseAccount, serializeBaseAccount } from './BaseAccount'
import { deserializeEVMAccount, serializeEVMAccount } from './EVMAccount'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'
import { Utils } from '@shardus/types'

const cWrappedEVMAccountVersion = 1

export interface WrappedEVMAccount extends BaseAccount {
  ethAddress: string
  hash: string
  timestamp: number
  account?: Account
  key?: string
  value?: Uint8Array
  codeHash?: Uint8Array
  codeByte?: Uint8Array
  contractAddress?: string
  amountSpent?: string
  txId?: string
  txFrom?: string
  balance?: number
  receipt?: TxReceipt
  readableReceipt?: ReadableReceipt
  operatorAccountInfo?: OperatorAccountInfo
}

export function serializeWrappedEVMAccount(
  stream: VectorBufferStream,
  obj: WrappedEVMAccount,
  root = false
): void {
  if (root) {
    stream.writeUInt16(TypeIdentifierEnum.cWrappedEVMAccount)
  }
  stream.writeUInt8(cWrappedEVMAccountVersion)

  serializeBaseAccount(stream, obj, false)
  stream.writeString(obj.ethAddress)
  stream.writeString(obj.hash)
  stream.writeBigUInt64(BigInt(obj.timestamp))

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
  obj.balance !== undefined
    ? (stream.writeUInt8(1), stream.writeBigUInt64(BigInt(obj.balance)))
    : stream.writeUInt8(0)

  // JSON serialization
  const receiptJson = Utils.safeStringify(obj.receipt)
  obj.receipt !== undefined ? (stream.writeUInt8(1), stream.writeString(receiptJson)) : stream.writeUInt8(0)
  const readableReceiptJson = Utils.safeStringify(obj.readableReceipt)
  obj.readableReceipt !== undefined
    ? (stream.writeUInt8(1), stream.writeString(readableReceiptJson))
    : stream.writeUInt8(0)
  const operatorAccountInfoJson = Utils.safeStringify(obj.operatorAccountInfo)
  obj.operatorAccountInfo !== undefined
    ? (stream.writeUInt8(1), stream.writeString(operatorAccountInfoJson))
    : stream.writeUInt8(0)
}

export function deserializeWrappedEVMAccount(stream: VectorBufferStream): WrappedEVMAccount {
  const version = stream.readUInt8()
  if (version > cWrappedEVMAccountVersion) {
    throw new Error('WrappedEVMAccount version mismatch')
  }
  const baseAccount = deserializeBaseAccount(stream)
  const ethAddress = stream.readString()
  const hash = stream.readString()
  const timestamp = Number(stream.readBigUInt64())
  const account =
    stream.readUInt8() === 1 ? Account.fromAccountData(deserializeEVMAccount(stream)) : undefined
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
  const balance = stream.readUInt8() === 1 ? Number(stream.readBigUInt64()) : undefined

  // JSON deserialization
  const receipt =
    stream.readUInt8() === 1 ? (Utils.safeJsonParse(stream.readString()) as TxReceipt) : undefined
  const readableReceipt =
    stream.readUInt8() === 1 ? (Utils.safeJsonParse(stream.readString()) as ReadableReceipt) : undefined
  const operatorAccountInfo =
    stream.readUInt8() === 1 ? (Utils.safeJsonParse(stream.readString()) as OperatorAccountInfo) : undefined

  const obj: WrappedEVMAccount = {
    ...baseAccount,
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
    receipt,
    readableReceipt,
    operatorAccountInfo,
  }
  return obj
}
