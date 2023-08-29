import { PenaltyTX, ViolationType } from '../../shardeum/shardeumTypes'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'

export function getPenaltyForViolation(tx: PenaltyTX, stakeLock: bigint): bigint {
  switch (tx.violationType) {
    case ViolationType.LeftNetworkEarly:
      return (stakeLock * BigInt(ShardeumFlags.penaltyPercent * 100))/(BigInt(100)) // 20% of stakeLock
    case ViolationType.SyncingTooLong:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    case ViolationType.DoubleVote:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    default:
      throw new Error('Unexpected violation type: ' + tx.violationType)
  }
}
