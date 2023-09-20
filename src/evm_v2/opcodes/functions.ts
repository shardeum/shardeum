import {
  Address,
  MAX_INTEGER_BIGINT,
  SECP256K1_ORDER_DIV_2,
  TWO_POW256,
  bigIntToBytes,
  bytesToBigInt,
  bytesToHex,
  concatBytes,
  ecrecover,
  hexToBytes,
  publicToAddress,
  setLengthLeft,
  setLengthRight,
} from '@ethereumjs/util'
import { keccak256 } from 'ethereum-cryptography/keccak.js'

import { ERROR } from '../exceptions.js'

import {
  addresstoBytes,
  describeLocation,
  exponentiation,
  fromTwos,
  getDataSlice,
  jumpIsValid,
  jumpSubIsValid,
  mod,
  toTwos,
  trap,
  writeCallOutput,
} from './util.js'

import type { RunState } from '../interpreter.js'
import type { Common } from '@ethereumjs/common'

const EIP3074MAGIC = hexToBytes('0x03')

export interface SyncOpHandler {
  (runState: RunState, common: Common): void
}

export interface AsyncOpHandler {
  (runState: RunState, common: Common): Promise<void>
}

export type OpHandler = SyncOpHandler | AsyncOpHandler

// the opcode functions
export const handlers: Map<number, OpHandler> = new Map([
  // 0x00: STOP
  [
    0x00,
    function (): void {
      trap(ERROR.STOP)
    },
  ],
  // 0x01: ADD
  [
    0x01,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = mod(a + b, TWO_POW256)
      runState.stack.push(r)
    },
  ],
  // 0x02: MUL
  [
    0x02,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = mod(a * b, TWO_POW256)
      runState.stack.push(r)
    },
  ],
  // 0x03: SUB
  [
    0x03,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = mod(a - b, TWO_POW256)
      runState.stack.push(r)
    },
  ],
  // 0x04: DIV
  [
    0x04,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      let r
      if (b === BigInt(0)) {
        r = BigInt(0)
      } else {
        r = mod(a / b, TWO_POW256)
      }
      runState.stack.push(r)
    },
  ],
  // 0x05: SDIV
  [
    0x05,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      let r
      if (b === BigInt(0)) {
        r = BigInt(0)
      } else {
        r = toTwos(fromTwos(a) / fromTwos(b))
      }
      runState.stack.push(r)
    },
  ],
  // 0x06: MOD
  [
    0x06,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      let r
      if (b === BigInt(0)) {
        r = b
      } else {
        r = mod(a, b)
      }
      runState.stack.push(r)
    },
  ],
  // 0x07: SMOD
  [
    0x07,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      let r
      if (b === BigInt(0)) {
        r = b
      } else {
        r = fromTwos(a) % fromTwos(b)
      }
      runState.stack.push(toTwos(r))
    },
  ],
  // 0x08: ADDMOD
  [
    0x08,
    function (runState): void {
      const [a, b, c] = runState.stack.popN(3)
      let r
      if (c === BigInt(0)) {
        r = BigInt(0)
      } else {
        r = mod(a + b, c)
      }
      runState.stack.push(r)
    },
  ],
  // 0x09: MULMOD
  [
    0x09,
    function (runState): void {
      const [a, b, c] = runState.stack.popN(3)
      let r
      if (c === BigInt(0)) {
        r = BigInt(0)
      } else {
        r = mod(a * b, c)
      }
      runState.stack.push(r)
    },
  ],
  // 0x0a: EXP
  [
    0x0a,
    function (runState): void {
      const [base, exponent] = runState.stack.popN(2)
      if (exponent === BigInt(0)) {
        runState.stack.push(BigInt(1))
        return
      }

      if (base === BigInt(0)) {
        runState.stack.push(base)
        return
      }
      const r = exponentiation(base, exponent)
      runState.stack.push(r)
    },
  ],
  // 0x0b: SIGNEXTEND
  [
    0x0b,
    function (runState): void {
      /* eslint-disable-next-line prefer-const */
      let [k, val] = runState.stack.popN(2)
      if (k < BigInt(31)) {
        const signBit = k * BigInt(8) + BigInt(7)
        const mask = (BigInt(1) << signBit) - BigInt(1)
        if ((val >> signBit) & BigInt(1)) {
          val = val | BigInt.asUintN(256, ~mask)
        } else {
          val = val & mask
        }
      }
      runState.stack.push(val)
    },
  ],
  // 0x10 range - bit ops
  // 0x10: LT
  [
    0x10,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = a < b ? BigInt(1) : BigInt(0)
      runState.stack.push(r)
    },
  ],
  // 0x11: GT
  [
    0x11,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = a > b ? BigInt(1) : BigInt(0)
      runState.stack.push(r)
    },
  ],
  // 0x12: SLT
  [
    0x12,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = fromTwos(a) < fromTwos(b) ? BigInt(1) : BigInt(0)
      runState.stack.push(r)
    },
  ],
  // 0x13: SGT
  [
    0x13,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = fromTwos(a) > fromTwos(b) ? BigInt(1) : BigInt(0)
      runState.stack.push(r)
    },
  ],
  // 0x14: EQ
  [
    0x14,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = a === b ? BigInt(1) : BigInt(0)
      runState.stack.push(r)
    },
  ],
  // 0x15: ISZERO
  [
    0x15,
    function (runState): void {
      const a = runState.stack.pop()
      const r = a === BigInt(0) ? BigInt(1) : BigInt(0)
      runState.stack.push(r)
    },
  ],
  // 0x16: AND
  [
    0x16,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = a & b
      runState.stack.push(r)
    },
  ],
  // 0x17: OR
  [
    0x17,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = a | b
      runState.stack.push(r)
    },
  ],
  // 0x18: XOR
  [
    0x18,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      const r = a ^ b
      runState.stack.push(r)
    },
  ],
  // 0x19: NOT
  [
    0x19,
    function (runState): void {
      const a = runState.stack.pop()
      const r = BigInt.asUintN(256, ~a)
      runState.stack.push(r)
    },
  ],
  // 0x1a: BYTE
  [
    0x1a,
    function (runState): void {
      const [pos, word] = runState.stack.popN(2)
      if (pos > BigInt(32)) {
        runState.stack.push(BigInt(0))
        return
      }

      const r = (word >> ((BigInt(31) - pos) * BigInt(8))) & BigInt(0xff)
      runState.stack.push(r)
    },
  ],
  // 0x1b: SHL
  [
    0x1b,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      if (a > BigInt(256)) {
        runState.stack.push(BigInt(0))
        return
      }

      const r = (b << a) & MAX_INTEGER_BIGINT
      runState.stack.push(r)
    },
  ],
  // 0x1c: SHR
  [
    0x1c,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)
      if (a > 256) {
        runState.stack.push(BigInt(0))
        return
      }

      const r = b >> a
      runState.stack.push(r)
    },
  ],
  // 0x1d: SAR
  [
    0x1d,
    function (runState): void {
      const [a, b] = runState.stack.popN(2)

      let r
      const bComp = BigInt.asIntN(256, b)
      const isSigned = bComp < 0
      if (a > 256) {
        if (isSigned) {
          r = MAX_INTEGER_BIGINT
        } else {
          r = BigInt(0)
        }
        runState.stack.push(r)
        return
      }

      const c = b >> a
      if (isSigned) {
        const shiftedOutWidth = BigInt(255) - a
        const mask = (MAX_INTEGER_BIGINT >> shiftedOutWidth) << shiftedOutWidth
        r = c | mask
      } else {
        r = c
      }
      runState.stack.push(r)
    },
  ],
  // 0x20 range - crypto
  // 0x20: KECCAK256
  [
    0x20,
    function (runState): void {
      const [offset, length] = runState.stack.popN(2)
      let data = new Uint8Array(0)
      if (length !== BigInt(0)) {
        data = runState.memory.read(Number(offset), Number(length))
      }
      const r = BigInt(bytesToHex(keccak256(data)))
      runState.stack.push(r)
    },
  ],
  // 0x30 range - closure state
  // 0x30: ADDRESS
  [
    0x30,
    function (runState): void {
      const address = bytesToBigInt(runState.interpreter.getAddress().bytes)
      runState.stack.push(address)
    },
  ],
  // 0x31: BALANCE
  [
    0x31,
    async function (runState): Promise<void> {
      const addressBigInt = runState.stack.pop()
      const address = new Address(addresstoBytes(addressBigInt))
      const balance = await runState.interpreter.getExternalBalance(address)
      runState.stack.push(balance)
    },
  ],
  // 0x32: ORIGIN
  [
    0x32,
    function (runState): void {
      runState.stack.push(runState.interpreter.getTxOrigin())
    },
  ],
  // 0x33: CALLER
  [
    0x33,
    function (runState): void {
      runState.stack.push(runState.interpreter.getCaller())
    },
  ],
  // 0x34: CALLVALUE
  [
    0x34,
    function (runState): void {
      runState.stack.push(runState.interpreter.getCallValue())
    },
  ],
  // 0x35: CALLDATALOAD
  [
    0x35,
    function (runState): void {
      const pos = runState.stack.pop()
      if (pos > runState.interpreter.getCallDataSize()) {
        runState.stack.push(BigInt(0))
        return
      }

      const i = Number(pos)
      let loaded = runState.interpreter.getCallData().subarray(i, i + 32)
      loaded = loaded.length ? loaded : Uint8Array.from([0])
      let r = bytesToBigInt(loaded)
      if (loaded.length < 32) {
        r = r << (BigInt(8) * BigInt(32 - loaded.length))
      }
      runState.stack.push(r)
    },
  ],
  // 0x36: CALLDATASIZE
  [
    0x36,
    function (runState): void {
      const r = runState.interpreter.getCallDataSize()
      runState.stack.push(r)
    },
  ],
  // 0x37: CALLDATACOPY
  [
    0x37,
    function (runState): void {
      const [memOffset, dataOffset, dataLength] = runState.stack.popN(3)

      if (dataLength !== BigInt(0)) {
        const data = getDataSlice(runState.interpreter.getCallData(), dataOffset, dataLength)
        const memOffsetNum = Number(memOffset)
        const dataLengthNum = Number(dataLength)
        runState.memory.write(memOffsetNum, dataLengthNum, data)
      }
    },
  ],
  // 0x38: CODESIZE
  [
    0x38,
    function (runState): void {
      runState.stack.push(runState.interpreter.getCodeSize())
    },
  ],
  // 0x39: CODECOPY
  [
    0x39,
    function (runState): void {
      const [memOffset, codeOffset, dataLength] = runState.stack.popN(3)

      if (dataLength !== BigInt(0)) {
        const data = getDataSlice(runState.interpreter.getCode(), codeOffset, dataLength)
        const memOffsetNum = Number(memOffset)
        const lengthNum = Number(dataLength)
        runState.memory.write(memOffsetNum, lengthNum, data)
      }
    },
  ],
  // 0x3b: EXTCODESIZE
  [
    0x3b,
    async function (runState): Promise<void> {
      const addressBigInt = runState.stack.pop()
      const size = BigInt(
        (await runState.stateManager.getContractCode(new Address(addresstoBytes(addressBigInt))))
          .length
      )
      runState.stack.push(size)
    },
  ],
  // 0x3c: EXTCODECOPY
  [
    0x3c,
    async function (runState): Promise<void> {
      const [addressBigInt, memOffset, codeOffset, dataLength] = runState.stack.popN(4)

      if (dataLength !== BigInt(0)) {
        const code = await runState.stateManager.getContractCode(
          new Address(addresstoBytes(addressBigInt))
        )

        const data = getDataSlice(code, codeOffset, dataLength)
        const memOffsetNum = Number(memOffset)
        const lengthNum = Number(dataLength)
        runState.memory.write(memOffsetNum, lengthNum, data)
      }
    },
  ],
  // 0x3f: EXTCODEHASH
  [
    0x3f,
    async function (runState): Promise<void> {
      const addressBigInt = runState.stack.pop()
      const address = new Address(addresstoBytes(addressBigInt))
      const account = await runState.stateManager.getAccount(address)
      if (!account || account.isEmpty()) {
        runState.stack.push(BigInt(0))
        return
      }

      runState.stack.push(BigInt(bytesToHex(account.codeHash)))
    },
  ],
  // 0x3d: RETURNDATASIZE
  [
    0x3d,
    function (runState): void {
      runState.stack.push(runState.interpreter.getReturnDataSize())
    },
  ],
  // 0x3e: RETURNDATACOPY
  [
    0x3e,
    function (runState): void {
      const [memOffset, returnDataOffset, dataLength] = runState.stack.popN(3)

      if (dataLength !== BigInt(0)) {
        const data = getDataSlice(
          runState.interpreter.getReturnData(),
          returnDataOffset,
          dataLength
        )
        const memOffsetNum = Number(memOffset)
        const lengthNum = Number(dataLength)
        runState.memory.write(memOffsetNum, lengthNum, data)
      }
    },
  ],
  // 0x3a: GASPRICE
  [
    0x3a,
    function (runState): void {
      runState.stack.push(runState.interpreter.getTxGasPrice())
    },
  ],
  // '0x40' range - block operations
  // 0x40: BLOCKHASH
  [
    0x40,
    async function (runState): Promise<void> {
      const number = runState.stack.pop()

      const diff = runState.interpreter.getBlockNumber() - number
      // block lookups must be within the past 256 blocks
      if (diff > BigInt(256) || diff <= BigInt(0)) {
        runState.stack.push(BigInt(0))
        return
      }

      const block = await runState.blockchain.getBlock(Number(number))

      runState.stack.push(bytesToBigInt(block.hash()))
    },
  ],
  // 0x41: COINBASE
  [
    0x41,
    function (runState): void {
      runState.stack.push(runState.interpreter.getBlockCoinbase())
    },
  ],
  // 0x42: TIMESTAMP
  [
    0x42,
    function (runState): void {
      runState.stack.push(runState.interpreter.getBlockTimestamp())
    },
  ],
  // 0x43: NUMBER
  [
    0x43,
    function (runState): void {
      runState.stack.push(runState.interpreter.getBlockNumber())
    },
  ],
  // 0x44: DIFFICULTY (EIP-4399: supplanted as PREVRANDAO)
  [
    0x44,
    function (runState, common): void {
      if (common.isActivatedEIP(4399)) {
        runState.stack.push(runState.interpreter.getBlockPrevRandao())
      } else {
        runState.stack.push(runState.interpreter.getBlockDifficulty())
      }
    },
  ],
  // 0x45: GASLIMIT
  [
    0x45,
    function (runState): void {
      runState.stack.push(runState.interpreter.getBlockGasLimit())
    },
  ],
  // 0x46: CHAINID
  [
    0x46,
    function (runState): void {
      runState.stack.push(runState.interpreter.getChainId())
    },
  ],
  // 0x47: SELFBALANCE
  [
    0x47,
    function (runState): void {
      runState.stack.push(runState.interpreter.getSelfBalance())
    },
  ],
  // 0x48: BASEFEE
  [
    0x48,
    function (runState): void {
      runState.stack.push(runState.interpreter.getBlockBaseFee())
    },
  ],
  // 0x49: BLOBHASH
  [
    0x49,
    function (runState): void {
      const index = runState.stack.pop()
      if (runState.env.versionedHashes.length > Number(index)) {
        runState.stack.push(bytesToBigInt(runState.env.versionedHashes[Number(index)]))
      } else {
        runState.stack.push(BigInt(0))
      }
    },
  ],
  // 0x50 range - 'storage' and execution
  // 0x50: POP
  [
    0x50,
    function (runState): void {
      runState.stack.pop()
    },
  ],
  // 0x51: MLOAD
  [
    0x51,
    function (runState): void {
      const pos = runState.stack.pop()
      const word = runState.memory.read(Number(pos), 32, true)
      runState.stack.push(bytesToBigInt(word))
    },
  ],
  // 0x52: MSTORE
  [
    0x52,
    function (runState): void {
      const [offset, word] = runState.stack.popN(2)
      const buf = setLengthLeft(bigIntToBytes(word), 32)
      const offsetNum = Number(offset)
      runState.memory.write(offsetNum, 32, buf)
    },
  ],
  // 0x53: MSTORE8
  [
    0x53,
    function (runState): void {
      const [offset, byte] = runState.stack.popN(2)

      const buf = bigIntToBytes(byte & BigInt(0xff))
      const offsetNum = Number(offset)
      runState.memory.write(offsetNum, 1, buf)
    },
  ],
  // 0x54: SLOAD
  [
    0x54,
    async function (runState): Promise<void> {
      const key = runState.stack.pop()
      const keyBuf = setLengthLeft(bigIntToBytes(key), 32)
      const value = await runState.interpreter.storageLoad(keyBuf)
      const valueBigInt = value.length ? bytesToBigInt(value) : BigInt(0)
      runState.stack.push(valueBigInt)
    },
  ],
  // 0x55: SSTORE
  [
    0x55,
    async function (runState): Promise<void> {
      const [key, val] = runState.stack.popN(2)

      const keyBuf = setLengthLeft(bigIntToBytes(key), 32)
      // NOTE: this should be the shortest representation
      let value
      if (val === BigInt(0)) {
        value = Uint8Array.from([])
      } else {
        value = bigIntToBytes(val)
      }

      await runState.interpreter.storageStore(keyBuf, value)
    },
  ],
  // 0x56: JUMP
  [
    0x56,
    function (runState): void {
      const dest = runState.stack.pop()
      if (dest > runState.interpreter.getCodeSize()) {
        trap(ERROR.INVALID_JUMP + ' at ' + describeLocation(runState))
      }

      const destNum = Number(dest)

      if (!jumpIsValid(runState, destNum)) {
        trap(ERROR.INVALID_JUMP + ' at ' + describeLocation(runState))
      }

      runState.programCounter = destNum
    },
  ],
  // 0x57: JUMPI
  [
    0x57,
    function (runState): void {
      const [dest, cond] = runState.stack.popN(2)
      if (cond !== BigInt(0)) {
        if (dest > runState.interpreter.getCodeSize()) {
          trap(ERROR.INVALID_JUMP + ' at ' + describeLocation(runState))
        }

        const destNum = Number(dest)

        if (!jumpIsValid(runState, destNum)) {
          trap(ERROR.INVALID_JUMP + ' at ' + describeLocation(runState))
        }

        runState.programCounter = destNum
      }
    },
  ],
  // 0x58: PC
  [
    0x58,
    function (runState): void {
      runState.stack.push(BigInt(runState.programCounter - 1))
    },
  ],
  // 0x59: MSIZE
  [
    0x59,
    function (runState): void {
      runState.stack.push(runState.memoryWordCount * BigInt(32))
    },
  ],
  // 0x5a: GAS
  [
    0x5a,
    function (runState): void {
      runState.stack.push(runState.interpreter.getGasLeft())
    },
  ],
  // 0x5b: JUMPDEST
  [0x5b, function (): void {/**/}],
  // 0x5c: BEGINSUB (EIP 2315) / TLOAD (EIP 1153)
  [
    0x5c,
    function (runState, common): void {
      if (common.isActivatedEIP(2315)) {
        // BEGINSUB
        trap(ERROR.INVALID_BEGINSUB + ' at ' + describeLocation(runState))
      } else if (common.isActivatedEIP(1153)) {
        // TLOAD
        const key = runState.stack.pop()
        const keyBuf = setLengthLeft(bigIntToBytes(key), 32)
        const value = runState.interpreter.transientStorageLoad(keyBuf)
        const valueBN = value.length ? bytesToBigInt(value) : BigInt(0)
        runState.stack.push(valueBN)
      }
    },
  ],
  // 0x5d: RETURNSUB (EIP 2315) / TSTORE (EIP 1153)
  [
    0x5d,
    function (runState, common): void {
      if (common.isActivatedEIP(2315)) {
        // RETURNSUB
        if (runState.returnStack.length < 1) {
          trap(ERROR.INVALID_RETURNSUB)
        }

        const dest = runState.returnStack.pop()
        runState.programCounter = Number(dest)
      } else if (common.isActivatedEIP(1153)) {
        // TSTORE
        if (runState.interpreter.isStatic()) {
          trap(ERROR.STATIC_STATE_CHANGE)
        }
        const [key, val] = runState.stack.popN(2)

        const keyBuf = setLengthLeft(bigIntToBytes(key), 32)
        // NOTE: this should be the shortest representation
        let value
        if (val === BigInt(0)) {
          value = Uint8Array.from([])
        } else {
          value = bigIntToBytes(val)
        }

        runState.interpreter.transientStorageStore(keyBuf, value)
      }
    },
  ],
  // 0x5e: JUMPSUB (2315) / MCOPY (5656)
  [
    0x5e,
    function (runState, common): void {
      if (common.isActivatedEIP(2315)) {
        // JUMPSUB
        const dest = runState.stack.pop()

        if (dest > runState.interpreter.getCodeSize()) {
          trap(ERROR.INVALID_JUMPSUB + ' at ' + describeLocation(runState))
        }

        const destNum = Number(dest)

        if (!jumpSubIsValid(runState, destNum)) {
          trap(ERROR.INVALID_JUMPSUB + ' at ' + describeLocation(runState))
        }

        runState.returnStack.push(BigInt(runState.programCounter))
        runState.programCounter = destNum + 1
      } else if (common.isActivatedEIP(5656)) {
        // MCOPY
        const [dst, src, length] = runState.stack.popN(3)
        const data = runState.memory.read(Number(src), Number(length), true)
        runState.memory.write(Number(dst), Number(length), data)
      }
    },
  ],
  // 0x5f: PUSH0
  [
    0x5f,
    function (runState): void {
      runState.stack.push(BigInt(0))
    },
  ],
  // 0x60: PUSH
  [
    0x60,
    function (runState, common): void {
      const numToPush = runState.opCode - 0x5f
      if (
        common.isActivatedEIP(3540) &&
        runState.programCounter + numToPush > runState.code.length
      ) {
        trap(ERROR.OUT_OF_RANGE)
      }

      const loaded = bytesToBigInt(
        runState.code.subarray(runState.programCounter, runState.programCounter + numToPush)
      )
      runState.programCounter += numToPush
      runState.stack.push(loaded)
    },
  ],
  // 0x80: DUP
  [
    0x80,
    function (runState): void {
      const stackPos = runState.opCode - 0x7f
      runState.stack.dup(stackPos)
    },
  ],
  // 0x90: SWAP
  [
    0x90,
    function (runState): void {
      const stackPos = runState.opCode - 0x8f
      runState.stack.swap(stackPos)
    },
  ],
  // 0xa0: LOG
  [
    0xa0,
    function (runState): void {
      const [memOffset, memLength] = runState.stack.popN(2)

      const topicsCount = runState.opCode - 0xa0

      const topics = runState.stack.popN(topicsCount)
      const topicsBuf = topics.map(function (a: bigint) {
        return setLengthLeft(bigIntToBytes(a), 32)
      })

      let mem = new Uint8Array(0)
      if (memLength !== BigInt(0)) {
        mem = runState.memory.read(Number(memOffset), Number(memLength))
      }

      runState.interpreter.log(mem, topicsCount, topicsBuf)
    },
  ],
  // '0xf0' range - closures
  // 0xf0: CREATE
  [
    0xf0,
    async function (runState, common): Promise<void> {
      const [value, offset, length] = runState.stack.popN(3)

      if (
        common.isActivatedEIP(3860) &&
        length > Number(common.param('vm', 'maxInitCodeSize')) &&
        !runState.interpreter._evm.allowUnlimitedInitCodeSize
      ) {
        trap(ERROR.INITCODE_SIZE_VIOLATION)
      }

      const gasLimit = runState.messageGasLimit!
      runState.messageGasLimit = undefined

      let data = new Uint8Array(0)
      if (length !== BigInt(0)) {
        data = runState.memory.read(Number(offset), Number(length), true)
      }

      const ret = await runState.interpreter.create(gasLimit, value, data)
      runState.stack.push(ret)
    },
  ],
  // 0xf5: CREATE2
  [
    0xf5,
    async function (runState, common): Promise<void> {
      if (runState.interpreter.isStatic()) {
        trap(ERROR.STATIC_STATE_CHANGE)
      }

      const [value, offset, length, salt] = runState.stack.popN(4)

      if (
        common.isActivatedEIP(3860) &&
        length > Number(common.param('vm', 'maxInitCodeSize')) &&
        !runState.interpreter._evm.allowUnlimitedInitCodeSize
      ) {
        trap(ERROR.INITCODE_SIZE_VIOLATION)
      }

      const gasLimit = runState.messageGasLimit!
      runState.messageGasLimit = undefined

      let data = new Uint8Array(0)
      if (length !== BigInt(0)) {
        data = runState.memory.read(Number(offset), Number(length), true)
      }

      const ret = await runState.interpreter.create2(
        gasLimit,
        value,
        data,
        setLengthLeft(bigIntToBytes(salt), 32)
      )
      runState.stack.push(ret)
    },
  ],
  // 0xf1: CALL
  [
    0xf1,
    async function (runState: RunState): Promise<void> {
      const [_currentGasLimit, toAddr, value, inOffset, inLength, outOffset, outLength] =
        runState.stack.popN(7)
      const toAddress = new Address(addresstoBytes(toAddr))

      let data = new Uint8Array(0)
      if (inLength !== BigInt(0)) {
        data = runState.memory.read(Number(inOffset), Number(inLength), true)
      }

      const gasLimit = runState.messageGasLimit!
      runState.messageGasLimit = undefined

      const ret = await runState.interpreter.call(gasLimit, toAddress, value, data)
      // Write return data to memory
      writeCallOutput(runState, outOffset, outLength)
      runState.stack.push(ret)
    },
  ],
  // 0xf2: CALLCODE
  [
    0xf2,
    async function (runState: RunState): Promise<void> {
      const [_currentGasLimit, toAddr, value, inOffset, inLength, outOffset, outLength] =
        runState.stack.popN(7)
      const toAddress = new Address(addresstoBytes(toAddr))

      const gasLimit = runState.messageGasLimit!
      runState.messageGasLimit = undefined

      let data = new Uint8Array(0)
      if (inLength !== BigInt(0)) {
        data = runState.memory.read(Number(inOffset), Number(inLength), true)
      }

      const ret = await runState.interpreter.callCode(gasLimit, toAddress, value, data)
      // Write return data to memory
      writeCallOutput(runState, outOffset, outLength)
      runState.stack.push(ret)
    },
  ],
  // 0xf4: DELEGATECALL
  [
    0xf4,
    async function (runState): Promise<void> {
      const value = runState.interpreter.getCallValue()
      const [_currentGasLimit, toAddr, inOffset, inLength, outOffset, outLength] =
        runState.stack.popN(6)
      const toAddress = new Address(addresstoBytes(toAddr))

      let data = new Uint8Array(0)
      if (inLength !== BigInt(0)) {
        data = runState.memory.read(Number(inOffset), Number(inLength), true)
      }

      const gasLimit = runState.messageGasLimit!
      runState.messageGasLimit = undefined

      const ret = await runState.interpreter.callDelegate(gasLimit, toAddress, value, data)
      // Write return data to memory
      writeCallOutput(runState, outOffset, outLength)
      runState.stack.push(ret)
    },
  ],
  // 0xf6: AUTH
  [
    0xf6,
    async function (runState): Promise<void> {
      // eslint-disable-next-line prefer-const
      let [authority, memOffset, memLength] = runState.stack.popN(3)

      if (memLength > BigInt(128)) {
        memLength = BigInt(128)
      }

      let mem = runState.memory.read(Number(memOffset), Number(memLength))
      if (mem.length < 128) {
        mem = setLengthRight(mem, 128)
      }

      const yParity = BigInt(mem[31])
      const r = mem.subarray(32, 64)
      const s = mem.subarray(64, 96)
      const commit = mem.subarray(96, 128)

      if (bytesToBigInt(s) > SECP256K1_ORDER_DIV_2) {
        trap(ERROR.AUTH_INVALID_S)
      }

      const paddedInvokerAddress = setLengthLeft(runState.interpreter._env.address.bytes, 32)
      const chainId = setLengthLeft(bigIntToBytes(runState.interpreter.getChainId()), 32)
      const message = concatBytes(EIP3074MAGIC, chainId, paddedInvokerAddress, commit)
      const msgHash = keccak256(message)

      let recover
      try {
        recover = ecrecover(msgHash, yParity + BigInt(27), r, s)
      } catch (e) {
        // Malformed signature, push 0 on stack, clear auth variable
        runState.stack.push(BigInt(0))
        runState.auth = undefined
        return
      }

      const addressBuffer = publicToAddress(recover)
      const address = new Address(addressBuffer)
      runState.auth = address

      const expectedAddress = new Address(setLengthLeft(bigIntToBytes(authority), 20))

      if (!expectedAddress.equals(address)) {
        // expected address does not equal the recovered address, clear auth variable
        runState.stack.push(BigInt(0))
        runState.auth = undefined
        return
      }

      runState.auth = address
      runState.stack.push(BigInt(1))
    },
  ],
  // 0xf7: AUTHCALL
  [
    0xf7,
    async function (runState): Promise<void> {
      const [
        _currentGasLimit,
        addr,
        value,
        _valueExt,
        argsOffset,
        argsLength,
        retOffset,
        retLength,
      ] = runState.stack.popN(8)

      const toAddress = new Address(addresstoBytes(addr))

      const gasLimit = runState.messageGasLimit!
      runState.messageGasLimit = undefined

      let data = new Uint8Array(0)
      if (argsLength !== BigInt(0)) {
        data = runState.memory.read(Number(argsOffset), Number(argsLength))
      }

      const ret = await runState.interpreter.authcall(gasLimit, toAddress, value, data)
      // Write return data to memory
      writeCallOutput(runState, retOffset, retLength)
      runState.stack.push(ret)
    },
  ],
  // 0xfa: STATICCALL
  [
    0xfa,
    async function (runState): Promise<void> {
      const value = BigInt(0)
      const [_currentGasLimit, toAddr, inOffset, inLength, outOffset, outLength] =
        runState.stack.popN(6)
      const toAddress = new Address(addresstoBytes(toAddr))

      const gasLimit = runState.messageGasLimit!
      runState.messageGasLimit = undefined

      let data = new Uint8Array(0)
      if (inLength !== BigInt(0)) {
        data = runState.memory.read(Number(inOffset), Number(inLength), true)
      }

      const ret = await runState.interpreter.callStatic(gasLimit, toAddress, value, data)
      // Write return data to memory
      writeCallOutput(runState, outOffset, outLength)
      runState.stack.push(ret)
    },
  ],
  // 0xf3: RETURN
  [
    0xf3,
    function (runState): void {
      const [offset, length] = runState.stack.popN(2)
      let returnData = new Uint8Array(0)
      if (length !== BigInt(0)) {
        returnData = runState.memory.read(Number(offset), Number(length))
      }
      runState.interpreter.finish(returnData)
    },
  ],
  // 0xfd: REVERT
  [
    0xfd,
    function (runState): void {
      const [offset, length] = runState.stack.popN(2)
      let returnData = new Uint8Array(0)
      if (length !== BigInt(0)) {
        returnData = runState.memory.read(Number(offset), Number(length))
      }
      runState.interpreter.revert(returnData)
    },
  ],
  // '0x70', range - other
  // 0xff: SELFDESTRUCT
  [
    0xff,
    async function (runState): Promise<void> {
      const selfdestructToAddressBigInt = runState.stack.pop()
      const selfdestructToAddress = new Address(addresstoBytes(selfdestructToAddressBigInt))
      return runState.interpreter.selfDestruct(selfdestructToAddress)
    },
  ],
])

// Fill in rest of PUSHn, DUPn, SWAPn, LOGn for handlers
const pushFn = handlers.get(0x60)!
for (let i = 0x61; i <= 0x7f; i++) {
  handlers.set(i, pushFn)
}
const dupFn = handlers.get(0x80)!
for (let i = 0x81; i <= 0x8f; i++) {
  handlers.set(i, dupFn)
}
const swapFn = handlers.get(0x90)!
for (let i = 0x91; i <= 0x9f; i++) {
  handlers.set(i, swapFn)
}
const logFn = handlers.get(0xa0)!
for (let i = 0xa1; i <= 0xa4; i++) {
  handlers.set(i, logFn)
}
