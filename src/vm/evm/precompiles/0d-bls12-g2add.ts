import { BN } from 'ethereumjs-util'
import { PrecompileInput } from './types'
import { VmErrorResult, ExecResult, OOGResult } from '../evm'
import { ERROR, VmError } from '../../exceptions'
const assert = require('assert')
const { BLS12_381_ToG2Point, BLS12_381_FromG2Point } = require('./util/bls12_381')

export default async function (opts: PrecompileInput): Promise<ExecResult> {
  assert(opts.data)

  const mcl = opts._VM._mcl

  const inputData = opts.data

  // note: the gas used is constant; even if the input is incorrect.
  const gasUsed = new BN(opts._common.paramByEIP('gasPrices', 'Bls12381G2AddGas', 2537))

  if (opts.gasLimit.lt(gasUsed)) {
    return OOGResult(opts.gasLimit)
  }

  if (inputData.length != 512) {
    return VmErrorResult(new VmError(ERROR.BLS_12_381_INVALID_INPUT_LENGTH), opts.gasLimit)
  }

  // check if some parts of input are zero bytes.
  const zeroBytes16 = Buffer.alloc(16, 0)
  const zeroByteCheck = [
    [0, 16],
    [64, 80],
    [128, 144],
    [192, 208],
    [256, 272],
    [320, 336],
    [384, 400],
    [448, 464],
  ]

  for (const index in zeroByteCheck) {
    const slicedBuffer = opts.data.slice(zeroByteCheck[index][0], zeroByteCheck[index][1])
    if (!slicedBuffer.equals(zeroBytes16)) {
      return VmErrorResult(new VmError(ERROR.BLS_12_381_POINT_NOT_ON_CURVE), opts.gasLimit)
    }
  }

  // TODO: verify that point is on G2

  // convert input to mcl G2 points, add them, and convert the output to a Buffer.
  let mclPoint1
  let mclPoint2

  try {
    mclPoint1 = BLS12_381_ToG2Point(opts.data.slice(0, 256), mcl)
    mclPoint2 = BLS12_381_ToG2Point(opts.data.slice(256, 512), mcl)
  } catch (e: any) {
    return VmErrorResult(e, opts.gasLimit)
  }

  const result = mcl.add(mclPoint1, mclPoint2)

  const returnValue = BLS12_381_FromG2Point(result)

  return {
    gasUsed,
    returnValue: returnValue,
  }
}
