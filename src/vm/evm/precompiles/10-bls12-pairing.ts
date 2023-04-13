import { BN } from 'ethereumjs-util'
import { PrecompileInput } from './types'
import { VmErrorResult, ExecResult, OOGResult } from '../evm'
import { ERROR, VmError } from '../../exceptions'
const assert = require('assert')
const { BLS12_381_ToG1Point, BLS12_381_ToG2Point } = require('./util/bls12_381')

const zeroBuffer = Buffer.alloc(32, 0)
const oneBuffer = Buffer.concat([Buffer.alloc(31, 0), Buffer.from('01', 'hex')])

export default async function (opts: PrecompileInput): Promise<ExecResult> {
  assert(opts.data)

  const mcl = opts._VM._mcl

  const inputData = opts.data

  const baseGas = new BN(opts._common.paramByEIP('gasPrices', 'Bls12381PairingBaseGas', 2537))

  if (inputData.length == 0) {
    return VmErrorResult(new VmError(ERROR.BLS_12_381_INPUT_EMPTY), opts.gasLimit)
  }

  const gasUsedPerPair = new BN(
    opts._common.paramByEIP('gasPrices', 'Bls12381PairingPerPairGas', 2537)
  )
  const gasUsed = baseGas.iadd(gasUsedPerPair.imul(new BN(Math.floor(inputData.length / 384))))

  if (inputData.length % 384 != 0) {
    return VmErrorResult(new VmError(ERROR.BLS_12_381_INVALID_INPUT_LENGTH), opts.gasLimit)
  }

  if (opts.gasLimit.lt(gasUsed)) {
    return OOGResult(opts.gasLimit)
  }

  // prepare pairing list and check for mandatory zero bytes

  const pairs = []

  const zeroBytes16 = Buffer.alloc(16, 0)
  const zeroByteCheck = [
    [0, 16],
    [64, 80],
    [128, 144],
    [192, 208],
    [256, 272],
    [320, 336],
  ]

  for (let k = 0; k < inputData.length / 384; k++) {
    // zero bytes check
    const pairStart = 384 * k
    for (const index in zeroByteCheck) {
      const slicedBuffer = opts.data.slice(
        zeroByteCheck[index][0] + pairStart,
        zeroByteCheck[index][1] + pairStart
      )
      if (!slicedBuffer.equals(zeroBytes16)) {
        return VmErrorResult(new VmError(ERROR.BLS_12_381_POINT_NOT_ON_CURVE), opts.gasLimit)
      }
    }
    let G1
    try {
      G1 = BLS12_381_ToG1Point(opts.data.slice(pairStart, pairStart + 128), mcl)
    } catch (e: any) {
      return VmErrorResult(e, opts.gasLimit)
    }

    const g2start = pairStart + 128
    let G2
    try {
      G2 = BLS12_381_ToG2Point(opts.data.slice(g2start, g2start + 256), mcl)
    } catch (e: any) {
      return VmErrorResult(e, opts.gasLimit)
    }

    pairs.push([G1, G2])
  }

  // run the pairing check
  // reference (Nethermind): https://github.com/NethermindEth/nethermind/blob/374b036414722b9c8ad27e93d64840b8f63931b9/src/Nethermind/Nethermind.Evm/Precompiles/Bls/Mcl/PairingPrecompile.cs#L93

  let GT

  for (let index = 0; index < pairs.length; index++) {
    const pair = pairs[index]
    const G1 = pair[0]
    const G2 = pair[1]

    if (index == 0) {
      GT = mcl.millerLoop(G1, G2)
    } else {
      GT = mcl.mul(GT, mcl.millerLoop(G1, G2))
    }
  }

  GT = mcl.finalExp(GT)

  let returnValue

  if (GT.isOne()) {
    returnValue = oneBuffer
  } else {
    returnValue = zeroBuffer
  }

  return {
    gasUsed,
    returnValue: returnValue,
  }
}
