import { Hardfork } from '@ethereumjs/common'
import {
  bigIntToBytes,
  bytesToHex,
  equalsBytes,
  setLengthLeft,
  setLengthRight,
} from '@ethereumjs/util'
import { keccak256 } from 'ethereum-cryptography/keccak.js'

import { EvmError } from '../exceptions.js'

import type { ERROR } from '../exceptions.js'
import type { RunState } from '../interpreter.js'
import type { Common } from '@ethereumjs/common'

const MASK_160 = (BigInt(1) << BigInt(160)) - BigInt(1)

/**
 * Proxy function for @ethereumjs/util's setLengthLeft, except it returns a zero
 * length Uint8Array in case the Uint8Array is full of zeros.
 * @param value Uint8Array which we want to pad
 */
export function setLengthLeftStorage(value: Uint8Array): Uint8Array {
  if (equalsBytes(value, new Uint8Array(value.length))) {
    // return the empty Uint8Array (the value is zero)
    return new Uint8Array(0)
  } else {
    return setLengthLeft(value, 32)
  }
}

/**
 * Wraps error message as EvmError
 */
export function trap(err: string): void {
  // TODO: facilitate extra data along with errors
  throw new EvmError(err as ERROR)
}

/**
 * Converts bigint address (they're stored like this on the stack) to Uint8Array address
 */
export function addresstoBytes(address: bigint | Uint8Array): Uint8Array {
  if (address instanceof Uint8Array) return address
  return setLengthLeft(bigIntToBytes(address & MASK_160), 20)
}

/**
 * Error message helper - generates location string
 */
export function describeLocation(runState: RunState): string {
  const hash = bytesToHex(keccak256(runState.interpreter.getCode()))
  const address = runState.interpreter.getAddress().toString()
  const pc = runState.programCounter - 1
  return `${hash}/${address}:${pc}`
}

/**
 * Find Ceil(a / b)
 *
 * @param {bigint} a
 * @param {bigint} b
 * @return {bigint}
 */
export function divCeil(a: bigint, b: bigint): bigint {
  const div = a / b
  const modulus = mod(a, b)

  // Fast case - exact division
  if (modulus === BigInt(0)) return div

  // Round up
  return div < BigInt(0) ? div - BigInt(1) : div + BigInt(1)
}

/**
 * Returns an overflow-safe slice of an array. It right-pads
 * the data with zeros to `length`.
 */
export function getDataSlice(data: Uint8Array, offset: bigint, length: bigint): Uint8Array {
  const len = BigInt(data.length)
  if (offset > len) {
    offset = len
  }

  let end = offset + length
  if (end > len) {
    end = len
  }

  data = data.subarray(Number(offset), Number(end))
  // Right-pad with zeros to fill dataLength bytes
  data = setLengthRight(data, Number(length))

  return data
}

/**
 * Get full opcode name from its name and code.
 *
 * @param code Integer code of opcode.
 * @param name Short name of the opcode.
 * @returns Full opcode name
 */
export function getFullname(code: number, name: string): string {
  switch (name) {
    case 'LOG':
      name += code - 0xa0
      break
    case 'PUSH':
      name += code - 0x5f
      break
    case 'DUP':
      name += code - 0x7f
      break
    case 'SWAP':
      name += code - 0x8f
      break
  }
  return name
}

/**
 * Checks if a jump is valid given a destination (defined as a 1 in the validJumps array)
 */
export function jumpIsValid(runState: RunState, dest: number): boolean {
  return runState.validJumps[dest] === 1
}

/**
 * Checks if a jumpsub is valid given a destination (defined as a 2 in the validJumps array)
 */
export function jumpSubIsValid(runState: RunState, dest: number): boolean {
  return runState.validJumps[dest] === 2
}

/**
 * Returns an overflow-safe slice of an array. It right-pads
 * the data with zeros to `length`.
 * @param gasLimit requested gas Limit
 * @param gasLeft current gas left
 * @param runState the current runState
 * @param common the common
 */
export function maxCallGas(
  gasLimit: bigint,
  gasLeft: bigint,
  runState: RunState,
  common: Common
): bigint {
  if (common.gteHardfork(Hardfork.TangerineWhistle)) {
    const gasAllowed = gasLeft - gasLeft / BigInt(64)
    return gasLimit > gasAllowed ? gasAllowed : gasLimit
  } else {
    return gasLimit
  }
}

/**
 * Subtracts the amount needed for memory usage from `runState.gasLeft`
 */
export function subMemUsage(runState: RunState, offset: bigint, length: bigint, common: Common): bigint {
  // YP (225): access with zero length will not extend the memory
  if (length === BigInt(0)) return BigInt(0)

  const newMemoryWordCount = divCeil(offset + length, BigInt(32))
  if (newMemoryWordCount <= runState.memoryWordCount) return BigInt(0)

  const words = newMemoryWordCount
  const fee = common.param('gasPrices', 'memory')
  const quadCoeff = common.param('gasPrices', 'quadCoeffDiv')
  // words * 3 + words ^2 / 512
  let cost = words * fee + (words * words) / quadCoeff

  if (cost > runState.highestMemCost) {
    const currentHighestMemCost = runState.highestMemCost
    runState.highestMemCost = cost
    cost -= currentHighestMemCost
  }

  runState.memoryWordCount = newMemoryWordCount

  return cost
}

/**
 * Writes data returned by evm.call* methods to memory
 */
export function writeCallOutput(runState: RunState, outOffset: bigint, outLength: bigint): void {
  const returnData = runState.interpreter.getReturnData()
  if (returnData.length > 0) {
    const memOffset = Number(outOffset)
    let dataLength = Number(outLength)
    if (BigInt(returnData.length) < dataLength) {
      dataLength = returnData.length
    }
    const data = getDataSlice(returnData, BigInt(0), BigInt(dataLength))
    runState.memory.extend(memOffset, dataLength)
    runState.memory.write(memOffset, dataLength, data)
  }
}

/**
 * The first rule set of SSTORE rules, which are the rules pre-Constantinople and in Petersburg
 */
export function updateSstoreGas(
  runState: RunState,
  currentStorage: Uint8Array,
  value: Uint8Array,
  common: Common
): bigint {
  if (
    (value.length === 0 && currentStorage.length === 0) ||
    (value.length > 0 && currentStorage.length > 0)
  ) {
    const gas = common.param('gasPrices', 'sstoreReset')
    return gas
  } else if (value.length === 0 && currentStorage.length > 0) {
    const gas = common.param('gasPrices', 'sstoreReset')
    runState.interpreter.refundGas(common.param('gasPrices', 'sstoreRefund'), 'updateSstoreGas')
    return gas
  } else {
    /*
      The situations checked above are:
      -> Value/Slot are both 0
      -> Value/Slot are both nonzero
      -> Value is zero, but slot is nonzero
      Thus, the remaining case is where value is nonzero, but slot is zero, which is this clause
    */
    return common.param('gasPrices', 'sstoreSet')
  }
}

export function mod(a: bigint, b: bigint): bigint {
  let r = a % b
  if (r < BigInt(0)) {
    r = b + r
  }
  return r
}

export function fromTwos(a: bigint): bigint {
  return BigInt.asIntN(256, a)
}

export function toTwos(a: bigint): bigint {
  return BigInt.asUintN(256, a)
}

export function abs(a: bigint): bigint {
  if (a > 0) {
    return a
  }
  return a * BigInt(-1)
}

const N = BigInt(115792089237316195423570985008687907853269984665640564039457584007913129639936)
export function exponentiation(bas: bigint, exp: bigint): bigint {
  let t = BigInt(1)
  while (exp > BigInt(0)) {
    if (exp % BigInt(2) !== BigInt(0)) {
      t = (t * bas) % N
    }
    bas = (bas * bas) % N
    exp = exp / BigInt(2)
  }
  return t
}
