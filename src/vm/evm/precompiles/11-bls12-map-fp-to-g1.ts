import { BN } from 'ethereumjs-util'
import { PrecompileInput } from './types'
import { VmErrorResult, ExecResult, OOGResult } from '../evm'
import { ERROR, VmError } from '../../exceptions'
const assert = require('assert')
const { BLS12_381_ToFpPoint, BLS12_381_FromG1Point } = require('./util/bls12_381')

export default async function (opts: PrecompileInput): Promise<ExecResult> {
  assert(opts.data)

  const mcl = opts._VM._mcl

  const inputData = opts.data

  // note: the gas used is constant; even if the input is incorrect.
  const gasUsed = new BN(opts._common.paramByEIP('gasPrices', 'Bls12381MapG1Gas', 2537))

  if (opts.gasLimit.lt(gasUsed)) {
    return OOGResult(opts.gasLimit)
  }

  if (inputData.length != 64) {
    return VmErrorResult(new VmError(ERROR.BLS_12_381_INVALID_INPUT_LENGTH), opts.gasLimit)
  }

  // check if some parts of input are zero bytes.
  const zeroBytes16 = Buffer.alloc(16, 0)
  if (!opts.data.slice(0, 16).equals(zeroBytes16)) {
    return VmErrorResult(new VmError(ERROR.BLS_12_381_POINT_NOT_ON_CURVE), opts.gasLimit)
  }

  // convert input to mcl Fp1 point

  let Fp1Point
  try {
    Fp1Point = BLS12_381_ToFpPoint(opts.data.slice(0, 64), mcl)
  } catch (e: any) {
    return VmErrorResult(e, opts.gasLimit)
  }

  // map it to G1
  const result = Fp1Point.mapToG1()

  const returnValue = BLS12_381_FromG1Point(result)

  return {
    gasUsed,
    returnValue: returnValue,
  }
}
