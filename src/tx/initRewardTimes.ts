import { Shardus, ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { NodeAccount2, InitRewardTimes, WrappedStates } from '../shardeum/shardeumTypes'

export function validateInitRewardTimesTxnFields(
  tx: InitRewardTimes,
  shardus: Shardus
): { success: boolean; reason: string } {
  if (ShardeumFlags.VerboseLogs) console.log('initRewardTimesTX', tx)
  if (!tx.nominee || tx.nominee === '')
    return { success: false, reason: 'nominee field is not found in setRewardTimes Tx' }
  if (!tx.nodeActivatedTime)
    return { success: false, reason: 'nodeActivatedTime field is not found in setRewardTimes Tx' }
  if (tx.nodeActivatedTime < 0 || tx.nodeActivatedTime > Date.now())
    return { success: false, reason: 'nodeActivatedTime is not correct in setRewardTimes Tx' }
  let isValid = crypto.verifyObj(tx)
  if (!isValid) return { success: false, reason: 'Invalid signature' }
  const latestCycles = shardus.getLatestCycles(5)
  const isInActiveList = latestCycles.some(cycle => cycle.activatedPublicKeys.includes(tx.nominee))
  if (ShardeumFlags.VerboseLogs) console.log('isInActiveList', isInActiveList)
  if (!isInActiveList)
    return { success: false, reason: 'The node publicKey is not found in the recently actived nodes!' }
  return { success: true, reason: 'valid' }
}

export function validateInitRewardTimesTx(
  tx: InitRewardTimes,
  shardus: Shardus
): { result: string; reason: string } {
  if (ShardeumFlags.VerboseLogs) console.log('initRewardTimesTX', tx)
  let isValid = crypto.verifyObj(tx)
  if (!isValid) return { result: 'fail', reason: 'Invalid signature' }
  const latestCycles = shardus.getLatestCycles(5)
  const isInActiveList = latestCycles.some(cycle => cycle.activatedPublicKeys.includes(tx.nominee))
  if (ShardeumFlags.VerboseLogs) console.log('isInActiveList', isInActiveList)
  if (!isInActiveList)
    return { result: 'fail', reason: 'The node publicKey is not found in the recently actived nodes!' }
  return { result: 'pass', reason: 'valid' }
}

export function applyInitRewardTimesTx(
  shardus,
  tx: InitRewardTimes,
  txId: string,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  applyResponse: ShardusTypes.ApplyResponse
) {
  const nodeAccount: NodeAccount2 = wrappedStates[tx.nominee].data
  if (ShardeumFlags.useAccountWrites) {
    let nodeAccountCopy = wrappedStates[tx.nominee]
    nodeAccountCopy.data.rewardStartTime = tx.nodeActivatedTime
    nodeAccountCopy.data.rewardEndTime = 0
    nodeAccountCopy.data.timestamp = txTimestamp
    shardus.applyResponseAddChangedAccount(applyResponse, tx.nominee, nodeAccountCopy, txId, txTimestamp)
  } else {
    nodeAccount.rewardStartTime = tx.nodeActivatedTime
    nodeAccount.rewardEndTime = 0
    nodeAccount.timestamp = txTimestamp
  }
  console.log('Applied set_reward_times tx', tx.nominee)
}
