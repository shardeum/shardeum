import { bytesToHex, bytesToUnprefixedHex, hexToBytes, short } from '@ethereumjs/util'
import { ec_pairing } from 'rustbn-wasm'

import { OOGResult } from '../evm.js'

import type { ExecResult } from '../types.js'
import type { PrecompileInput } from './types.js'

export function precompile08(opts: PrecompileInput): ExecResult {
  const inputData = opts.data
  // no need to care about non-divisible-by-192, because bn128.pairing will properly fail in that case
  const inputDataSize = BigInt(Math.floor(inputData.length / 192))
  const gasUsed =
    opts.common.param('gasPrices', 'ecPairing') +
    inputDataSize * opts.common.param('gasPrices', 'ecPairingWord')
  if (opts._debug !== undefined) {
    opts._debug(
      `Run ECPAIRING (0x08) precompile data=${short(opts.data)} length=${
        opts.data.length
      } gasLimit=${opts.gasLimit} gasUsed=${gasUsed}`
    )
  }

  if (opts.gasLimit < gasUsed) {
    if (opts._debug !== undefined) {
      opts._debug(`ECPAIRING (0x08) failed: OOG`)
    }
    return OOGResult(opts.gasLimit)
  }

  const returnData = hexToBytes(ec_pairing(bytesToUnprefixedHex(inputData)))

  // check ecpairing success or failure by comparing the output length
  if (returnData.length !== 32) {
    if (opts._debug !== undefined) {
      opts._debug(`ECPAIRING (0x08) failed: OOG`)
    }
    // TODO: should this really return OOG?
    return OOGResult(opts.gasLimit)
  }

  if (opts._debug !== undefined) {
    opts._debug(`ECPAIRING (0x08) return value=${bytesToHex(returnData)}`)
  }

  return {
    executionGasUsed: gasUsed,
    returnValue: returnData,
  }
}
