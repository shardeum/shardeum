import { BN } from 'ethereumjs-util'
import { PrecompileInput } from './types'
import { VmErrorResult, ExecResult, OOGResult } from '../evm'
import { ERROR, VmError } from '../../exceptions'
const assert = require('assert')
const {
  BLS12_381_ToG1Point,
  BLS12_381_FromG1Point,
  BLS12_381_ToFrPoint,
} = require('./util/bls12_381')

export default async function (opts: PrecompileInput): Promise<ExecResult> {
  assert(opts.data)

  const mcl = opts._VM._mcl

  const inputData = opts.data

  // note: the gas used is constant; even if the input is incorrect.
  const gasUsed = new BN(opts._common.paramByEIP('gasPrices', 'Bls12381G1MulGas', 2537))

  if (opts.gasLimit.lt(gasUsed)) {
    return OOGResult(opts.gasLimit)
  }

  if (inputData.length != 160) {
    return VmErrorResult(new VmError(ERROR.BLS_12_381_INVALID_INPUT_LENGTH), opts.gasLimit)
  }

  // check if some parts of input are zero bytes.
  const zeroBytes16 = Buffer.alloc(16, 0)
  const zeroByteCheck = [
    [0, 16],
    [64, 80],
  ]

  for (const index in zeroByteCheck) {
    const slicedBuffer = opts.data.slice(zeroByteCheck[index][0], zeroByteCheck[index][1])
    if (!slicedBuffer.equals(zeroBytes16)) {
      return VmErrorResult(new VmError(ERROR.BLS_12_381_POINT_NOT_ON_CURVE), opts.gasLimit)
    }
  }

  // convert input to mcl G1 points, add them, and convert the output to a Buffer.

  let mclPoint
  try {
    mclPoint = BLS12_381_ToG1Point(opts.data.slice(0, 128), mcl)
  } catch (e: any) {
    return VmErrorResult(e, opts.gasLimit)
  }

  const frPoint = BLS12_381_ToFrPoint(opts.data.slice(128, 160), mcl)

  const result = mcl.mul(mclPoint, frPoint)

  const returnValue = BLS12_381_FromG1Point(result)

  return {
    gasUsed,
    returnValue: returnValue,
  }
}
