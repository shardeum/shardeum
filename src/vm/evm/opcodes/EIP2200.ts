import Common from '@ethereumjs/common'
import { BN } from 'ethereumjs-util'
import { RunState } from './../interpreter'
import { ERROR } from '../../exceptions'
import { adjustSstoreGasEIP2929 } from './EIP2929'
import { trap } from './util'

/**
 * Adjusts gas usage and refunds of SStore ops per EIP-2200 (Istanbul)
 *
 * @param {RunState} runState
 * @param {Buffer}   currentStorage
 * @param {Buffer}   originalStorage
 * @param {Buffer}   value
 * @param {Common}   common
 */
export function updateSstoreGasEIP2200(
  runState: RunState,
  currentStorage: Buffer,
  originalStorage: Buffer,
  value: Buffer,
  key: Buffer,
  common: Common
) {
  // Fail if not enough gas is left
  if (runState.eei.getGasLeft().lten(common.param('gasPrices', 'sstoreSentryGasEIP2200'))) {
    trap(ERROR.OUT_OF_GAS)
  }

  // Noop
  if (currentStorage.equals(value)) {
    const sstoreNoopCost = new BN(common.param('gasPrices', 'sstoreNoopGasEIP2200'))
    return adjustSstoreGasEIP2929(runState, key, sstoreNoopCost, 'noop', common)
  }
  if (originalStorage.equals(currentStorage)) {
    // Create slot
    if (originalStorage.length === 0) {
      return new BN(common.param('gasPrices', 'sstoreInitGasEIP2200'))
    }
    // Delete slot
    if (value.length === 0) {
      runState.eei.refundGas(
        new BN(common.param('gasPrices', 'sstoreClearRefundEIP2200')),
        'EIP-2200 -> sstoreClearRefundEIP2200'
      )
    }
    // Write existing slot
    return new BN(common.param('gasPrices', 'sstoreCleanGasEIP2200'))
  }
  if (originalStorage.length > 0) {
    if (currentStorage.length === 0) {
      // Recreate slot
      runState.eei.subRefund(
        new BN(common.param('gasPrices', 'sstoreClearRefundEIP2200')),
        'EIP-2200 -> sstoreClearRefundEIP2200'
      )
    } else if (value.length === 0) {
      // Delete slot
      runState.eei.refundGas(
        new BN(common.param('gasPrices', 'sstoreClearRefundEIP2200')),
        'EIP-2200 -> sstoreClearRefundEIP2200'
      )
    }
  }
  if (originalStorage.equals(value)) {
    if (originalStorage.length === 0) {
      // Reset to original non-existent slot
      const sstoreInitRefund = new BN(common.param('gasPrices', 'sstoreInitRefundEIP2200'))
      runState.eei.refundGas(
        adjustSstoreGasEIP2929(runState, key, sstoreInitRefund, 'initRefund', common),
        'EIP-2200 -> initRefund'
      )
    } else {
      // Reset to original existing slot
      const sstoreCleanRefund = new BN(common.param('gasPrices', 'sstoreCleanRefundEIP2200'))
      runState.eei.refundGas(
        adjustSstoreGasEIP2929(runState, key, sstoreCleanRefund, 'cleanRefund', common),
        'EIP-2200 -> cleanRefund'
      )
    }
  }
  // Dirty update
  return new BN(common.param('gasPrices', 'sstoreDirtyGasEIP2200'))
}
