import { Common } from '@ethereumjs/common'
import { BN, keccak256, setLengthRight, setLengthLeft } from 'ethereumjs-util'
import { ERROR, VmError } from './../../exceptions'
import { RunState } from './../interpreter'
import {bytesToHex} from "@ethereumjs/util";

const MASK_160 = new BN(1).shln(160).subn(1)

/**
 * Proxy function for ethereumjs-util's setLengthLeft, except it returns a zero
 *
 * length buffer in case the buffer is full of zeros.
 * @param {Buffer} value Buffer which we want to pad
 */
export function setLengthLeftStorage(value: Buffer): Buffer {
  if (value.equals(Buffer.alloc(value.length, 0))) {
    // return the empty buffer (the value is zero)
    return Buffer.alloc(0)
  } else {
    return setLengthLeft(value, 32)
  }
}

/**
 * Wraps error message as VMError
 *
 * @param {string} err
 */
export function trap(err: string): void {
  // TODO: facilitate extra data along with errors
  throw new VmError(err as ERROR)
}

/**
 * Converts BN address (they're stored like this on the stack) to buffer address
 *
 * @param  {BN}     address
 * @return {Buffer}
 */
export function addressToBuffer(address: BN | Buffer): Buffer {
  if (Buffer.isBuffer(address)) return address
  return address.and(MASK_160).toArrayLike(Buffer, 'be', 20)
}

/**
 * Error message helper - generates location string
 *
 * @param  {RunState} runState
 * @return {string}
 */
export function describeLocation(runState: RunState): string {
  const hash = keccak256(runState.eei.getCode()).toString('hex')
  const address = runState.eei.getAddress().buf.toString('hex')
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

export const short = (bytes: Uint8Array | string, maxLength = 50): string => {
  const byteStr = bytes instanceof Uint8Array ? bytesToHex(bytes) : bytes
  const len = byteStr.slice(0, 2) === '0x' ? maxLength + 2 : maxLength
  if (byteStr.length <= len) {
    return byteStr
  }
  return byteStr.slice(0, len) + '…'
}

export function mod(a: bigint, b: bigint): bigint {
  let r = a % b
  if (r < BigInt(0)) {
    r = b + r
  }
  return r
}

/**
/**
 * Returns an overflow-safe slice of an array. It right-pads
 * the data with zeros to `length`.
 *
 * @param {BN} offset
 * @param {BN} length
 * @param {Buffer} data
 * @returns {Buffer}
 */
export function getDataSlice(data: Buffer, offset: BN, length: BN): Buffer {
  const len = new BN(data.length)
  if (offset.gt(len)) {
    offset = len
  }

  let end = offset.add(length)
  if (end.gt(len)) {
    end = len
  }

  data = data.slice(offset.toNumber(), end.toNumber())
  // Right-pad with zeros to fill dataLength bytes
  data = setLengthRight(data, length.toNumber())

  return data
}

/**
 * Get full opcode name from its name and code.
 *
 * @param code {number} Integer code of opcode.
 * @param name {string} Short name of the opcode.
 * @returns {string} Full opcode name
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
 *
 * @param  {RunState} runState
 * @param  {number}   dest
 * @return {boolean}
 */
export function jumpIsValid(runState: RunState, dest: number): boolean {
  // eslint-disable-next-line security/detect-object-injection
  return runState.validJumps[dest] === 1
}

/**
 * Checks if a jumpsub is valid given a destination (defined as a 2 in the validJumps array)
 *
 * @param  {RunState} runState
 * @param  {number}   dest
 * @return {boolean}
 */
export function jumpSubIsValid(runState: RunState, dest: number): boolean {
  // eslint-disable-next-line security/detect-object-injection
  return runState.validJumps[dest] === 2
}

/**
 * Returns an overflow-safe slice of an array. It right-pads
 *
 * the data with zeros to `length`.
 * @param {BN} gasLimit - requested gas Limit
 * @param {BN} gasLeft - current gas left
 * @param {RunState} runState - the current runState
 * @param {Common} common - the common
 */
export function maxCallGas(gasLimit: BN, gasLeft: BN, runState: RunState, common: Common): BN {
  const isTangerineWhistleOrLater = common.gteHardfork('tangerineWhistle')
  if (isTangerineWhistleOrLater) {
    const gasAllowed = gasLeft.sub(gasLeft.divn(64))
    return gasLimit.gt(gasAllowed) ? gasAllowed : gasLimit
  } else {
    return gasLimit
  }
}

/**
 * Subtracts the amount needed for memory usage from `runState.gasLeft`
 *
 * @method subMemUsage
 * @param {Object} runState
 * @param {BN} offset
 * @param {BN} length
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
 * Writes data returned by eei.call* methods to memory
 *
 * @param {RunState} runState
 * @param {BN}       outOffset
 * @param {BN}       outLength
 */
export function writeCallOutput(runState: RunState, outOffset: BN, outLength: BN): void {
  const returnData = runState.eei.getReturnData()
  if (returnData.length > 0) {
    const memOffset = outOffset.toNumber()
    let dataLength = outLength.toNumber()
    if (returnData.length < dataLength) {
      dataLength = returnData.length
    }
    const data = getDataSlice(returnData, new BN(0), new BN(dataLength))
    runState.memory.extend(memOffset, dataLength)
    runState.memory.write(memOffset, dataLength, data)
  }
}

/** The first rule set of SSTORE rules, which are the rules pre-Constantinople and in Petersburg
 * @param {RunState} runState
 * @param {Buffer}   currentStorage
 * @param {Buffer}   value
 * @param {Buffer}   keyBuf
 */
export function updateSstoreGas(
  runState: RunState,
  currentStorage: Buffer,
  value: Buffer,
  common: Common
): bigint {
  if (
    (value.length === 0 && currentStorage.length === 0) ||
    (value.length > 0 && currentStorage.length > 0)
  ) {
    return common.param('gasPrices', 'sstoreReset')
  } else if (value.length === 0 && currentStorage.length > 0) {
    const gas = common.param('gasPrices', 'sstoreReset'
    runState.eei.refundGas(common.param('gasPrices', 'sstoreRefund'), 'updateSstoreGas')
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
