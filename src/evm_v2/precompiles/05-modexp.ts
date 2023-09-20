import {
  bigIntToBytes,
  bytesToBigInt,
  bytesToHex,
  setLengthLeft,
  setLengthRight,
  short,
} from '@ethereumjs/util'

import { OOGResult } from '../evm.js'

import type { ExecResult } from '../types.js'
import type { PrecompileInput } from './types.js'

function multComplexity(x: bigint): bigint {
  let fac1
  let fac2
  if (x <= BigInt(64)) {
    return x ** BigInt(2)
  } else if (x <= BigInt(1024)) {
    // return Math.floor(Math.pow(x, 2) / 4) + 96 * x - 3072
    fac1 = x ** BigInt(2) / BigInt(4)
    fac2 = x * BigInt(96)
    return fac1 + fac2 - BigInt(3072)
  } else {
    // return Math.floor(Math.pow(x, 2) / 16) + 480 * x - 199680
    fac1 = x ** BigInt(2) / BigInt(16)
    fac2 = x * BigInt(480)
    return fac1 + fac2 - BigInt(199680)
  }
}

function multComplexityEIP2565(x: bigint): bigint {
  const words = (x + BigInt(7)) / BigInt(8)
  return words * words
}

function getAdjustedExponentLength(data: Uint8Array): bigint {
  let expBytesStart
  try {
    const baseLen = bytesToBigInt(data.subarray(0, 32))
    expBytesStart = 96 + Number(baseLen) // 96 for base length, then exponent length, and modulus length, then baseLen for the base data, then exponent bytes start
  } catch (e: any) {
    expBytesStart = Number.MAX_SAFE_INTEGER - 32
  }
  const expLen = bytesToBigInt(data.subarray(32, 64))
  let firstExpBytes = data.subarray(expBytesStart, expBytesStart + 32) // first word of the exponent data
  firstExpBytes = setLengthRight(firstExpBytes, 32) // reading past the data reads virtual zeros
  let firstExpBigInt = bytesToBigInt(firstExpBytes)
  let max32expLen = 0
  if (expLen < BigInt(32)) {
    max32expLen = 32 - Number(expLen)
  }
  firstExpBigInt = firstExpBigInt >> (BigInt(8) * BigInt(Math.max(max32expLen, 0)))

  let bitLen = -1
  while (firstExpBigInt > BigInt(0)) {
    bitLen = bitLen + 1
    firstExpBigInt = firstExpBigInt >> BigInt(1)
  }
  let expLenMinus32OrZero = expLen - BigInt(32)
  if (expLenMinus32OrZero < BigInt(0)) {
    expLenMinus32OrZero = BigInt(0)
  }
  const eightTimesExpLenMinus32OrZero = expLenMinus32OrZero * BigInt(8)
  let adjustedExpLen = eightTimesExpLenMinus32OrZero
  if (bitLen > 0) {
    adjustedExpLen += BigInt(bitLen)
  }
  return adjustedExpLen
}

export function expmod(a: bigint, power: bigint, modulo: bigint): bigint {
  if (power === BigInt(0)) {
    return BigInt(1) % modulo
  }
  let res = BigInt(1)
  while (power > BigInt(0)) {
    if (power & BigInt(1)) res = (res * a) % modulo
    a = (a * a) % modulo
    power >>= BigInt(1)
  }
  return res
}

export function precompile05(opts: PrecompileInput): ExecResult {
  const data = opts.data

  let adjustedELen = getAdjustedExponentLength(data)
  if (adjustedELen < BigInt(1)) {
    adjustedELen = BigInt(1)
  }

  const bLen = bytesToBigInt(data.subarray(0, 32))
  const eLen = bytesToBigInt(data.subarray(32, 64))
  const mLen = bytesToBigInt(data.subarray(64, 96))

  let maxLen = bLen
  if (maxLen < mLen) {
    maxLen = mLen
  }
  const Gquaddivisor = opts.common.param('gasPrices', 'modexpGquaddivisor')
  let gasUsed

  const bStart = BigInt(96)
  const bEnd = bStart + bLen
  const eStart = bEnd
  const eEnd = eStart + eLen
  const mStart = eEnd
  const mEnd = mStart + mLen

  if (!opts.common.isActivatedEIP(2565)) {
    gasUsed = (adjustedELen * multComplexity(maxLen)) / Gquaddivisor
  } else {
    gasUsed = (adjustedELen * multComplexityEIP2565(maxLen)) / Gquaddivisor
    if (gasUsed < BigInt(200)) {
      gasUsed = BigInt(200)
    }
  }
  if (opts._debug !== undefined) {
    opts._debug(
      `Run MODEXP (0x05) precompile data=${short(opts.data)} length=${opts.data.length} gasLimit=${
        opts.gasLimit
      } gasUsed=${gasUsed}`
    )
  }

  if (opts.gasLimit < gasUsed) {
    if (opts._debug !== undefined) {
      opts._debug(`MODEXP (0x05) failed: OOG`)
    }
    return OOGResult(opts.gasLimit)
  }

  if (bLen === BigInt(0)) {
    return {
      executionGasUsed: gasUsed,
      returnValue: setLengthLeft(bigIntToBytes(BigInt(0)), Number(mLen)),
    }
  }

  if (mLen === BigInt(0)) {
    return {
      executionGasUsed: gasUsed,
      returnValue: new Uint8Array(0),
    }
  }

  const maxInt = BigInt(Number.MAX_SAFE_INTEGER)
  const maxSize = BigInt(2147483647) // @ethereumjs/util setLengthRight limitation

  if (bLen > maxSize || eLen > maxSize || mLen > maxSize) {
    if (opts._debug !== undefined) {
      opts._debug(`MODEXP (0x05) failed: OOG`)
    }
    return OOGResult(opts.gasLimit)
  }

  const B = bytesToBigInt(setLengthRight(data.subarray(Number(bStart), Number(bEnd)), Number(bLen)))
  const E = bytesToBigInt(setLengthRight(data.subarray(Number(eStart), Number(eEnd)), Number(eLen)))
  const M = bytesToBigInt(setLengthRight(data.subarray(Number(mStart), Number(mEnd)), Number(mLen)))

  if (mEnd > maxInt) {
    if (opts._debug !== undefined) {
      opts._debug(`MODEXP (0x05) failed: OOG`)
    }
    return OOGResult(opts.gasLimit)
  }

  let R
  if (M === BigInt(0)) {
    R = BigInt(0)
  } else {
    R = expmod(B, E, M)
  }

  const res = setLengthLeft(bigIntToBytes(R), Number(mLen))
  if (opts._debug !== undefined) {
    opts._debug(`MODEXP (0x05) return value=${bytesToHex(res)}`)
  }

  return {
    executionGasUsed: gasUsed,
    returnValue: setLengthLeft(bigIntToBytes(R), Number(mLen)),
  }
}
