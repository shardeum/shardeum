import { MAX_INTEGER } from '@ethereumjs/util'
import { ShardeumFlags } from '../shardeum/shardeumFlags'

export class SafeBalance {
  static addBigintBalance(currentBalance: bigint, amountToAdd: bigint): bigint {
    const newBalance = currentBalance + amountToAdd
    if (
      ShardeumFlags.unifiedAccountBalanceEnabled &&
      (newBalance < currentBalance || newBalance < amountToAdd || newBalance > MAX_INTEGER)
    ) {
      throw new Error('value overflow')
    }
    return newBalance
  }

  static subtractBigintBalance(currentBalance: bigint, amountToSubtract: bigint): bigint {
    if (ShardeumFlags.unifiedAccountBalanceEnabled && amountToSubtract > currentBalance) {
      throw new Error('value underflow')
    }
    return currentBalance - amountToSubtract
  }
}
