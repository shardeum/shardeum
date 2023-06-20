import { BN } from 'ethereumjs-util'
import { PenaltyTX, ViolationType } from '../../shardeum/shardeumTypes'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'

export function getPenaltyForViolation(tx: PenaltyTX, stakeLock: BN): BN {
  switch (tx.violationType) {
    case ViolationType.LeftNetworkEarly:
      return stakeLock.mul(new BN(ShardeumFlags.penaltyPercent * 100)).div(new BN(100)) // 20% of stakeLock
    case ViolationType.SyncingTooLong:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    case ViolationType.DoubleVote:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    default:
      throw new Error('Unexpected violation type: ' + tx.violationType)
  }
}
