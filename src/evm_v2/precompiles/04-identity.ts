import { short } from '@ethereumjs/util'

import { OOGResult } from '../evm.js'

import type { ExecResult } from '../types.js'
import type { PrecompileInput } from './types.js'

export function precompile04(opts: PrecompileInput): ExecResult {
  const data = opts.data

  let gasUsed = opts.common.param('gasPrices', 'identity')
  gasUsed += opts.common.param('gasPrices', 'identityWord') * BigInt(Math.ceil(data.length / 32))
  if (opts._debug !== undefined) {
    opts._debug(
      `Run IDENTITY (0x04) precompile data=${short(opts.data)} length=${
        opts.data.length
      } gasLimit=${opts.gasLimit} gasUsed=${gasUsed}`
    )
  }

  if (opts.gasLimit < gasUsed) {
    if (opts._debug !== undefined) {
      opts._debug(`IDENTITY (0x04) failed: OOG`)
    }
    return OOGResult(opts.gasLimit)
  }

  if (opts._debug !== undefined) {
    opts._debug(`IDENTITY (0x04) return data=${short(opts.data)}`)
  }

  return {
    executionGasUsed: gasUsed,
    returnValue: Uint8Array.from(data), // Copy the memory (`Uint8Array.from()`)
  }
}
