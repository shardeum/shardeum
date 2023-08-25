import { bytesToHex, bytesToUnprefixedHex, hexToBytes, short } from '@ethereumjs/util'
import { ec_mul } from 'rustbn-wasm'

import { OOGResult } from '../evm.js'

import type { ExecResult } from '../types.js'
import type { PrecompileInput } from './types.js'

export function precompile07(opts: PrecompileInput): ExecResult {
  const inputData = bytesToUnprefixedHex(opts.data.subarray(0, 128))
  const gasUsed = opts.common.param('gasPrices', 'ecMul')
  if (opts._debug !== undefined) {
    opts._debug(
      `Run ECMUL (0x07) precompile data=${short(opts.data)} length=${opts.data.length} gasLimit=${
        opts.gasLimit
      } gasUsed=${gasUsed}`
    )
  }

  if (opts.gasLimit < gasUsed) {
    if (opts._debug !== undefined) {
      opts._debug(`ECMUL (0x07) failed: OOG`)
    }
    return OOGResult(opts.gasLimit)
  }

  const returnData = hexToBytes(ec_mul(inputData))

  // check ecmul success or failure by comparing the output length
  if (returnData.length !== 64) {
    if (opts._debug !== undefined) {
      opts._debug(`ECMUL (0x07) failed: OOG`)
    }
    // TODO: should this really return OOG?
    return OOGResult(opts.gasLimit)
  }

  if (opts._debug !== undefined) {
    opts._debug(`ECMUL (0x07) return value=${bytesToHex(returnData)}`)
  }

  return {
    executionGasUsed: gasUsed,
    returnValue: returnData,
  }
}
