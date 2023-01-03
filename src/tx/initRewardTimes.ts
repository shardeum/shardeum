import { Shardus, ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  NodeAccount2,
  InitRewardTimes,
  WrappedStates,
  InternalTx,
  InternalTXType,
} from '../shardeum/shardeumTypes'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'

export async function injectInitRewardTimesTx(shardus, eventData: ShardusTypes.ShardusEvent) {
  let tx = {
    isInternalTx: true,
    internalTXType: InternalTXType.InitRewardTimes,
    nominee: eventData.publicKey,
    nodeActivatedTime: eventData.time,
    // timestamp: Date.now(),
  } as InitRewardTimes
  tx = shardus.signAsNode(tx)
  return await shardus.put(tx)
}

export function validateFields(tx: InitRewardTimes, shardus: Shardus): { success: boolean; reason: string } {
  if (ShardeumFlags.VerboseLogs) console.log('Validating InitRewardTimesTX fields', tx)
  if (!tx.nominee || tx.nominee === '')
    return { success: false, reason: 'nominee field is not found in setRewardTimes Tx' }
  if (!tx.nodeActivatedTime)
    return { success: false, reason: 'nodeActivatedTime field is not found in setRewardTimes Tx' }
  if (tx.nodeActivatedTime < 0 || tx.nodeActivatedTime > Date.now())
    return { success: false, reason: 'nodeActivatedTime is not correct in setRewardTimes Tx' }
  let isValid = crypto.verifyObj(tx)
  if (!isValid) return { success: false, reason: 'Invalid signature' }
  const latestCycles = shardus.getLatestCycles(5)
  const nodeActivedCycle = latestCycles.find(cycle => cycle.activatedPublicKeys.includes(tx.nominee))
  if (ShardeumFlags.VerboseLogs) console.log('nodeActivedCycle', nodeActivedCycle)
  if (!nodeActivedCycle)
    return { success: false, reason: 'The node publicKey is not found in the recently actived nodes!' }
  if (nodeActivedCycle.start !== tx.nodeActivatedTime)
    return { success: false, reason: 'The cycle start time and nodeActivatedTime does not match!' }
  return { success: true, reason: 'valid' }
}

export function validatePreCrackData(shardus, tx: InternalTx, appData) {
  if (ShardeumFlags.VerboseLogs) console.log('Validating InitRewardTimesTX PreCrackData', tx)
}

export function validate(tx: InitRewardTimes, shardus: Shardus): { result: string; reason: string } {
  if (ShardeumFlags.VerboseLogs) console.log('Validating InitRewardTimesTX', tx)
  let isValid = crypto.verifyObj(tx)
  if (!isValid) return { result: 'fail', reason: 'Invalid signature' }
  const latestCycles = shardus.getLatestCycles(5)
  const nodeActivedCycle = latestCycles.find(cycle => cycle.activatedPublicKeys.includes(tx.nominee))
  if (ShardeumFlags.VerboseLogs) console.log('nodeActivedCycle', nodeActivedCycle)
  if (!nodeActivedCycle)
    return { result: 'fail', reason: 'The node publicKey is not found in the recently actived nodes!' }
  if (nodeActivedCycle.start !== tx.nodeActivatedTime)
    return { result: 'fail', reason: 'The cycle start time and nodeActivatedTime does not match!' }
  return { result: 'pass', reason: 'valid' }
}

export function apply(
  shardus,
  tx: InitRewardTimes,
  txId: string,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  applyResponse: ShardusTypes.ApplyResponse
) {
  let nodeAccount: NodeAccount2 = wrappedStates[tx.nominee].data
  nodeAccount.rewardStartTime = tx.nodeActivatedTime
  nodeAccount.rewardEndTime = 0
  nodeAccount.timestamp = txTimestamp
  if (ShardeumFlags.useAccountWrites) {
    const wrappedAccount: any = nodeAccount
    const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedAccount)
    shardus.applyResponseAddChangedAccount(
      applyResponse,
      tx.nominee,
      wrappedChangedAccount,
      txId,
      txTimestamp
    )
  }
  console.log('Applied InitRewardTimesTX for', tx.nominee)
}
