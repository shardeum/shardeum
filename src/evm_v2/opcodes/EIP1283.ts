import { equalsBytes } from '@ethereumjs/util'

import type { RunState } from '../interpreter.js'
import type { Common } from '@ethereumjs/common'

/**
 * Adjusts gas usage and refunds of SStore ops per EIP-1283 (Constantinople)
 *
 * @param {RunState} runState
 * @param {Uint8Array}   currentStorage
 * @param {Uint8Array}   originalStorage
 * @param {Uint8Array}   value
 * @param {Common}   common
 */
export function updateSstoreGasEIP1283(
  runState: RunState,
  currentStorage: Uint8Array,
  originalStorage: Uint8Array,
  value: Uint8Array,
  common: Common
): bigint {
  if (equalsBytes(currentStorage, value)) {
    // If current value equals new value (this is a no-op), 200 gas is deducted.
    return common.param('gasPrices', 'netSstoreNoopGas')
  }
  // If current value does not equal new value
  if (equalsBytes(originalStorage, currentStorage)) {
    // If original value equals current value (this storage slot has not been changed by the current execution context)
    if (originalStorage.length === 0) {
      // If original value is 0, 20000 gas is deducted.
      return common.param('gasPrices', 'netSstoreInitGas')
    }
    if (value.length === 0) {
      // If new value is 0, add 15000 gas to refund counter.
      runState.interpreter.refundGas(
        common.param('gasPrices', 'netSstoreClearRefund'),
        'EIP-1283 -> netSstoreClearRefund'
      )
    }
    // Otherwise, 5000 gas is deducted.
    return common.param('gasPrices', 'netSstoreCleanGas')
  }
  // If original value does not equal current value (this storage slot is dirty), 200 gas is deducted. Apply both of the following clauses.
  if (originalStorage.length !== 0) {
    // If original value is not 0
    if (currentStorage.length === 0) {
      // If current value is 0 (also means that new value is not 0), remove 15000 gas from refund counter. We can prove that refund counter will never go below 0.
      runState.interpreter.subRefund(
        common.param('gasPrices', 'netSstoreClearRefund'),
        'EIP-1283 -> netSstoreClearRefund'
      )
    } else if (value.length === 0) {
      // If new value is 0 (also means that current value is not 0), add 15000 gas to refund counter.
      runState.interpreter.refundGas(
        common.param('gasPrices', 'netSstoreClearRefund'),
        'EIP-1283 -> netSstoreClearRefund'
      )
    }
  }
  if (equalsBytes(originalStorage, value)) {
    // If original value equals new value (this storage slot is reset)
    if (originalStorage.length === 0) {
      // If original value is 0, add 19800 gas to refund counter.
      runState.interpreter.refundGas(
        common.param('gasPrices', 'netSstoreResetClearRefund'),
        'EIP-1283 -> netSstoreResetClearRefund'
      )
    } else {
      // Otherwise, add 4800 gas to refund counter.
      runState.interpreter.refundGas(
        common.param('gasPrices', 'netSstoreResetRefund'),
        'EIP-1283 -> netSstoreResetRefund'
      )
    }
  }
  return common.param('gasPrices', 'netSstoreDirtyGas')
}
