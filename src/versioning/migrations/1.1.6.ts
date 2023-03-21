import { nestedCountersInstance } from '@shardus/core'
// import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
// import { shardusConfig } from '../..'

// This is a rollback migration for v1.1.3
export const migrate: Migration = async () => {
  console.log('migrate 1.1.6')
  nestedCountersInstance.countEvent('migrate-1.1.6', 'calling migrate 1.1.6')

  // this is from reverse migrate.  keeping the comments for local testing but will turn in to real migration code later
  // ShardeumFlags.fixExtraStakeLessThanMin = false
  // shardusConfig.features.fixHomeNodeCheckForTXGroupChanges = false

  // ShardeumFlags.checkNodesEVMtx = false
  // ShardeumFlags.allowForceUnstake = false
  // ShardeumFlags.unstakeCertCheckFix = false
  // ShardeumFlags.rewardedFalseInInitRewardTx = false
  // ShardeumFlags.fixCertExpRenew = false
  // ShardeumFlags.supportInternalTxReceipt = false
  // ShardeumFlags.totalUnstakeAmount = false
  // ShardeumFlags.txHashingFix = false
}
