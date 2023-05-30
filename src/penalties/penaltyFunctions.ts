import { BN } from 'ethereumjs-util'
import { scaleByStabilityFactor } from '../utils'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import * as AccountsStorage from '../storage/accountStorage'
import { NodeAccount2, WrappedEVMAccount } from '../shardeum/shardeumTypes'

export function applyPenalty(nodeAccount: NodeAccount2, operatorEOA: WrappedEVMAccount, penalty: BN): BN {
  if (ShardeumFlags.VerboseLogs)
    console.log(`\nApplying Penalty on Node: ${nodeAccount.id} of ${penalty.toString()} SHM`)

  if (penalty.gt(nodeAccount.stakeLock)) penalty = nodeAccount.stakeLock

  nodeAccount.stakeLock.isub(penalty)
  operatorEOA.operatorAccountInfo.stake.isub(penalty)

  nodeAccount.penalty.iadd(penalty)
  nodeAccount.nodeAccountStats.totalPenalty.iadd(penalty)
  operatorEOA.operatorAccountInfo.operatorStats.totalNodePenalty.iadd(penalty)
  return penalty
}

export function isLowStake(nodeAccount: NodeAccount2): boolean {
  /**
   * IMPORTANT FUTURE TO-DO =:
   * This function's logic needs to be updated once `stakeRequiredUsd` actually represents
   * USD value rather than SHM.
   */

  const stakeRequiredUSD = AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
  const lowStakeThreshold = scaleByStabilityFactor(
    stakeRequiredUSD.mul(new BN(ShardeumFlags.lowStakePercent * 100)).div(new BN(100)),
    AccountsStorage.cachedNetworkAccount
  )

  if (nodeAccount.stakeLock.lt(lowStakeThreshold)) return true
  return false
}
