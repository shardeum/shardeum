import { bytesToHex, bytesToUnprefixedHex, hexToBytes, short } from '@ethereumjs/util'
import { ec_add } from 'rustbn-wasm'

import { OOGResult } from '../evm.js'

import type { ExecResult } from '../types.js'
import type { PrecompileInput } from './types.js'

export function precompile06(opts: PrecompileInput): ExecResult {
  const inputData = bytesToUnprefixedHex(opts.data.subarray(0, 128))

  const gasUsed = opts.common.param('gasPrices', 'ecAdd')
  if (opts._debug !== undefined) {
    opts._debug(
      `Run ECADD (0x06) precompile data=${short(opts.data)} length=${opts.data.length} gasLimit=${
        opts.gasLimit
      } gasUsed=${gasUsed}`
    )
  }
  if (opts.gasLimit < gasUsed) {
    if (opts._debug !== undefined) {
      opts._debug(`ECADD (0x06) failed: OOG`)
    }
    return OOGResult(opts.gasLimit)
  }

  const returnData = hexToBytes(ec_add(inputData))

  // check ecadd success or failure by comparing the output length
  if (returnData.length !== 64) {
    if (opts._debug !== undefined) {
      opts._debug(`ECADD (0x06) failed: OOG`)
    }
    return OOGResult(opts.gasLimit)
  }

  if (opts._debug !== undefined) {
    opts._debug(`ECADD (0x06) return value=${bytesToHex(returnData)}`)
  }

  return {
    executionGasUsed: gasUsed,
    returnValue: returnData,
  }
}
