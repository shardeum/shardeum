import { bytesToHex, setLengthLeft, short } from '@ethereumjs/util'
import { ripemd160 } from 'ethereum-cryptography/ripemd160.js'

import { OOGResult } from '../evm.js'

import type { ExecResult } from '../types.js'
import type { PrecompileInput } from './types.js'

export function precompile03(opts: PrecompileInput): ExecResult {
  const data = opts.data

  let gasUsed = opts.common.param('gasPrices', 'ripemd160')
  gasUsed += opts.common.param('gasPrices', 'ripemd160Word') * BigInt(Math.ceil(data.length / 32))

  if (opts._debug !== undefined) {
    opts._debug(
      `Run RIPEMD160 (0x03) precompile data=${short(opts.data)} length=${
        opts.data.length
      } gasLimit=${opts.gasLimit} gasUsed=${gasUsed}`
    )
  }

  if (opts.gasLimit < gasUsed) {
    if (opts._debug !== undefined) {
      opts._debug(`RIPEMD160 (0x03) failed: OOG`)
    }
    return OOGResult(opts.gasLimit)
  }

  const hash = setLengthLeft(ripemd160(data), 32)
  if (opts._debug !== undefined) {
    opts._debug(`RIPEMD160 (0x03) return hash=${bytesToHex(hash)}`)
  }

  return {
    executionGasUsed: gasUsed,
    returnValue: setLengthLeft(ripemd160(data), 32),
  }
}
