import { setLengthRight, BN } from 'ethereumjs-util'
import { PrecompileInput } from './types'
import { OOGResult, ExecResult } from '../evm'
const assert = require('assert')

function multComplexity(x: BN): BN {
  let fac1
  let fac2
  if (x.lten(64)) {
    return x.sqr()
  } else if (x.lten(1024)) {
    // return Math.floor(Math.pow(x, 2) / 4) + 96 * x - 3072
    fac1 = x.sqr().divn(4)
    fac2 = x.muln(96)
    return fac1.add(fac2).subn(3072)
  } else {
    // return Math.floor(Math.pow(x, 2) / 16) + 480 * x - 199680
    fac1 = x.sqr().divn(16)
    fac2 = x.muln(480)
    return fac1.add(fac2).subn(199680)
  }
}

function multComplexityEIP2565(x: BN): BN {
  const words = x.addn(7).divn(8)
  return words.mul(words)
}

function getAdjustedExponentLength(data: Buffer): BN {
  let expBytesStart
  try {
    const baseLen = new BN(data.slice(0, 32)).toNumber()
    expBytesStart = 96 + baseLen // 96 for base length, then exponent length, and modulus length, then baseLen for the base data, then exponent bytes start
  } catch (e: any) {
    expBytesStart = Number.MAX_SAFE_INTEGER - 32
  }
  const expLen = new BN(data.slice(32, 64))
  let firstExpBytes = Buffer.from(data.slice(expBytesStart, expBytesStart + 32)) // first word of the exponent data
  firstExpBytes = setLengthRight(firstExpBytes, 32) // reading past the data reads virtual zeros
  let firstExpBN = new BN(firstExpBytes)
  let max32expLen = 0
  if (expLen.ltn(32)) {
    max32expLen = 32 - expLen.toNumber()
  }
  firstExpBN = firstExpBN.shrn(8 * Math.max(max32expLen, 0))

  let bitLen = -1
  while (firstExpBN.gtn(0)) {
    bitLen = bitLen + 1
    firstExpBN = firstExpBN.ushrn(1)
  }
  let expLenMinus32OrZero = expLen.subn(32)
  if (expLenMinus32OrZero.ltn(0)) {
    expLenMinus32OrZero = new BN(0)
  }
  const eightTimesExpLenMinus32OrZero = expLenMinus32OrZero.muln(8)
  const adjustedExpLen = eightTimesExpLenMinus32OrZero
  if (bitLen > 0) {
    adjustedExpLen.iaddn(bitLen)
  }
  return adjustedExpLen
}

function expmod(B: BN, E: BN, M: BN): BN {
  if (E.isZero()) return new BN(1).mod(M)
  // Red asserts M > 1
  if (M.lten(1)) return new BN(0)
  const red = BN.red(M)
  const redB = B.toRed(red)
  const res = redB.redPow(E)
  return res.fromRed()
}

export default function (opts: PrecompileInput): ExecResult {
  assert(opts.data)

  const data = opts.data

  let adjustedELen = getAdjustedExponentLength(data)
  if (adjustedELen.ltn(1)) {
    adjustedELen = new BN(1)
  }

  const bLen = new BN(data.slice(0, 32))
  const eLen = new BN(data.slice(32, 64))
  const mLen = new BN(data.slice(64, 96))

  let maxLen = bLen
  if (maxLen.lt(mLen)) {
    maxLen = mLen
  }
  const Gquaddivisor = opts._common.param('gasPrices', 'modexpGquaddivisor')
  let gasUsed

  const bStart = new BN(96)
  const bEnd = bStart.add(bLen)
  const eStart = bEnd
  const eEnd = eStart.add(eLen)
  const mStart = eEnd
  const mEnd = mStart.add(mLen)

  if (!opts._common.isActivatedEIP(2565)) {
    gasUsed = adjustedELen.mul(multComplexity(maxLen)).divn(Gquaddivisor)
  } else {
    gasUsed = adjustedELen.mul(multComplexityEIP2565(maxLen)).divn(Gquaddivisor)
    if (gasUsed.ltn(200)) {
      gasUsed = new BN(200)
    }
  }

  if (opts.gasLimit.lt(gasUsed)) {
    return OOGResult(opts.gasLimit)
  }

  if (bLen.isZero()) {
    return {
      gasUsed,
      returnValue: new BN(0).toArrayLike(Buffer, 'be', mLen.toNumber()),
    }
  }

  if (mLen.isZero()) {
    return {
      gasUsed,
      returnValue: Buffer.alloc(0),
    }
  }

  const maxInt = new BN(Number.MAX_SAFE_INTEGER)
  const maxSize = new BN(2147483647) // ethereumjs-util setLengthRight limitation

  if (bLen.gt(maxSize) || eLen.gt(maxSize) || mLen.gt(maxSize)) {
    return OOGResult(opts.gasLimit)
  }

  const B = new BN(setLengthRight(data.slice(bStart.toNumber(), bEnd.toNumber()), bLen.toNumber()))
  const E = new BN(setLengthRight(data.slice(eStart.toNumber(), eEnd.toNumber()), eLen.toNumber()))
  const M = new BN(setLengthRight(data.slice(mStart.toNumber(), mEnd.toNumber()), mLen.toNumber()))

  if (mEnd.gt(maxInt)) {
    return OOGResult(opts.gasLimit)
  }

  let R
  if (M.isZero()) {
    R = new BN(0)
  } else {
    R = expmod(B, E, M)
  }

  return {
    gasUsed,
    returnValue: R.toArrayLike(Buffer, 'be', mLen.toNumber()),
  }
}
