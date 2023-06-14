import { BN } from 'ethereumjs-util'
import { PenaltyTX, ViolationType } from '../../shardeum/shardeumTypes'

export function getPenaltyForViolation(tx: PenaltyTX): BN {
  switch (tx.violationType) {
    case ViolationType.LeftNetworkEarly:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    case ViolationType.SyncingTooLong:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    case ViolationType.DoubleVote:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    default:
      throw new Error('Unexpected violation type: ' + tx.violationType)
  }
}
