import { PenaltyTX, ViolationType, NodeAccount2 } from '../../shardeum/shardeumTypes'
import { _base16BNParser } from '../../utils'
import { nestedCountersInstance } from '@shardus/core'
import { cachedNetworkAccount } from '../../storage/accountStorage'
import { logFlags } from '../..'

function calculateBehaviorMultiplier(nodeAccount: NodeAccount2): number {
  const stats = nodeAccount.behaviorStats;
  if (!stats) return 1.0;

  let multiplier = 1.0;

  // Increase penalty for repeated lost status
  multiplier += Math.min(stats.lostCount * 0.2, 2.0); // Up to 3x for repeated lost status

  // Increase penalty for oscillation patterns
  multiplier += stats.oscillationCount * 0.5; // +50% per detected oscillation

  // Recent violations have higher impact
  const hoursSinceLastViolation = Math.min(
    (Date.now() - Math.max(stats.lastLostTime, stats.lastRefuteTime)) / 3600000,
    24
  );
  if (hoursSinceLastViolation < 24) {
    multiplier *= (24 - hoursSinceLastViolation) / 24 + 1;
  }

  return Math.min(multiplier, 5.0); // Cap at 5x penalty
}

export function getPenaltyForViolation(
  tx: PenaltyTX,
  stakeLock: bigint,
  nodeAccount: NodeAccount2
): bigint {
  const basePenalty = getBasePenaltyForViolation(tx, stakeLock);
  const multiplier = calculateBehaviorMultiplier(nodeAccount);
  return BigInt(Math.floor(Number(basePenalty) * multiplier));
}

function getBasePenaltyForViolation(tx: PenaltyTX, stakeLock: bigint): bigint {
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
      return (stakeLock * BigInt(cachedNetworkAccount.current.slashing.leftNetworkEarlyPenaltyPercent * 100)) / BigInt(100) // 20% of stakeLock
    case ViolationType.NodeRefuted:
      return (stakeLock * BigInt(cachedNetworkAccount.current.slashing.nodeRefutedPenaltyPercent * 100)) / BigInt(100) // 20% of stakeLock
    case ViolationType.SyncingTooLong:
      return (stakeLock * BigInt(cachedNetworkAccount.current.slashing.syncTimeoutPenaltyPercent * 100)) / BigInt(100) // 20% of stakeLock
    case ViolationType.DoubleVote:
      throw new Error('Violation type: ' + tx.violationType + ' Not implemented')
    default:
      throw new Error('Unexpected violation type: ' + tx.violationType)
  }
}
