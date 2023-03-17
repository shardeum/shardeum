import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.1.3')
  nestedCountersInstance.countEvent('migrate-1.1.3', 'calling migrate 1.1.3')

  ShardeumFlags.fixExtraStakeLessThanMin = true
  shardusConfig.features.fixHomeNodeCheckForTXGroupChanges = true
  shardusConfig.features.archiverDataSubscriptionsUpdate = true

  ShardeumFlags.checkNodesEVMtx = true
  ShardeumFlags.allowForceUnstake = true
  ShardeumFlags.unstakeCertCheckFix = true
  ShardeumFlags.rewardedFalseInInitRewardTx = true
  ShardeumFlags.fixCertExpRenew = true
  ShardeumFlags.supportInternalTxReceipt = true
}
