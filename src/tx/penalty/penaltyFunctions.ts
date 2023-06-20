import { BN } from 'ethereumjs-util'
import { scaleByStabilityFactor, _base16BNParser } from '../../utils'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import * as AccountsStorage from '../../storage/accountStorage'
import { NodeAccount2, WrappedEVMAccount } from '../../shardeum/shardeumTypes'

export function applyPenalty(nodeAccount: NodeAccount2, operatorEOA: WrappedEVMAccount, penalty: BN): boolean {
  if (ShardeumFlags.VerboseLogs)
    console.log(`\nApplying Penalty on Node: ${nodeAccount.id} of ${penalty.toString()} SHM`)

  // convert hex value to BN
  operatorEOA.operatorAccountInfo.stake = _base16BNParser(operatorEOA.operatorAccountInfo.stake)
  operatorEOA.operatorAccountInfo.operatorStats.totalNodePenalty = _base16BNParser(operatorEOA.operatorAccountInfo.operatorStats.totalNodePenalty)
  nodeAccount.stakeLock = _base16BNParser(nodeAccount.stakeLock)
  nodeAccount.penalty = _base16BNParser(nodeAccount.penalty)
  nodeAccount.nodeAccountStats.totalPenalty = _base16BNParser(nodeAccount.nodeAccountStats.totalPenalty)

  if (penalty.gt(nodeAccount.stakeLock)) penalty = nodeAccount.stakeLock

  // update operator account
  operatorEOA.operatorAccountInfo.stake.isub(penalty)
  operatorEOA.operatorAccountInfo.operatorStats.totalNodePenalty.iadd(penalty)

  // update node account
  nodeAccount.stakeLock.isub(penalty)
  nodeAccount.penalty.iadd(penalty)
  nodeAccount.nodeAccountStats.totalPenalty.iadd(penalty)
  nodeAccount.nodeAccountStats.history.push({ b: nodeAccount.rewardStartTime, e: nodeAccount.rewardEndTime })
  return true
}

export function isLowStake(nodeAccount: NodeAccount2): boolean {
  /**
   * IMPORTANT FUTURE TO-DO =:
   * This function's logic needs to be updated once `stakeRequiredUsd` actually represents
   * USD value rather than SHM.
   */

  const stakeRequiredUSD = AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
  const lowStakeThresholdUSD = stakeRequiredUSD.mul(new BN(ShardeumFlags.lowStakePercent * 100)).div(new BN(100));
  const lowStakeThreshold = scaleByStabilityFactor(
    lowStakeThresholdUSD,
    AccountsStorage.cachedNetworkAccount
  )

  if (nodeAccount.stakeLock.lt(lowStakeThreshold)) return true
  return false
}
