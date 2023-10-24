import { PenaltyTX, ViolationType } from '../../shardeum/shardeumTypes'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { _base16BNParser } from '../../utils'
import { nestedCountersInstance } from '@shardus/core'
import { logFlags } from '../..'

export function getPenaltyForViolation(tx: PenaltyTX, stakeLock: bigint): bigint {
  //can remove this will crash part after fix confirmed
  let willCrash = false
  if (typeof stakeLock !== 'bigint') {
    willCrash = true
  }

  //make sure we are dealing with a bigint
  stakeLock = _base16BNParser(stakeLock)

  // Check if stakeLock is not a BigInt, should never happen again due to the above fix
  if (typeof stakeLock !== 'bigint') {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.error(`stakeLock is not a BigInt. Type: ${typeof stakeLock}, Value: ${stakeLock}`)
    throw new Error(`stakeLock is not a BigInt. Type: ${typeof stakeLock}, Value: ${stakeLock}`)
  } else if (willCrash) {
    nestedCountersInstance.countEvent('shardeum', `getPenaltyForViolation crash fixed: ${typeof stakeLock}`)
  }

  switch (tx.violationType) {
    case ViolationType.LeftNetworkEarly:
      return (stakeLock * BigInt(ShardeumFlags.penaltyPercent * 100)) / BigInt(100) // 20% of stakeLock
    case ViolationType.SyncingTooLong:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    case ViolationType.DoubleVote:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    default:
      throw new Error('Unexpected violation type: ' + tx.violationType)
  }
}
