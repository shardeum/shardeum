import { ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { BN, isValidAddress } from 'ethereumjs-util'
import { networkAccount, ONE_SECOND } from '..'
import config from '../config'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  ClaimRewardTX,
  InternalTXType,
  NetworkAccount,
  WrappedStates,
  NodeAccount2,
} from '../shardeum/shardeumTypes'

export function isClaimRewardTx(tx: any): boolean {
  if (tx.isInternalTx && tx.internalTXType === InternalTXType.ClaimReward) {
    return true
  }
  return false
}

export async function injectClaimRewardTx(shardus, eventData: ShardusTypes.ShardusEvent) {
  let tx = {
    nominee: eventData.publicKey,
    timestamp: Date.now(),
    deactivatedNodeId: eventData.nodeId,
    nodeDeactivatedTime: eventData.time,
    isInternalTx: true,
    internalTXType: InternalTXType.ClaimReward,
  }
  tx = shardus.signAsNode(tx)
  await shardus.put(tx)
}

export function validateClaimRewardTx(tx: ClaimRewardTX, appData: any): { isValid: boolean; reason: string } {
  if (!isValidAddress(tx.nominee)) {
    return { isValid: false, reason: 'Invalid nominee address' }
  }
  if (!isValidAddress(tx.deactivatedNodeId)) {
    return { isValid: false, reason: 'Invalid deactivatedNodeId' }
  }
  if (tx.nodeDeactivatedTime <= 0) {
    return { isValid: false, reason: 'nodeDeactivatedTime must be > 0' }
  }
  if (tx.timestamp <= 0) {
    return { isValid: false, reason: 'Duration in tx must be > 0' }
  }
  try {
    if (!crypto.verifyObj(tx)) return { isValid: false, reason: 'Invalid signature for ClaimReward tx' }
  } catch (e) {
    return { isValid: false, reason: 'Invalid signature for ClaimReward tx' }
  }

  return { isValid: true, reason: '' }
}

export function validateClaimRewardState(tx: ClaimRewardTX, shardus) {
  if (ShardeumFlags.VerboseLogs) console.log('validating claimRewardTX', tx)
  let isValid = crypto.verifyObj(tx)
  if (!isValid) return { result: 'fail', reason: 'Invalid signature' }
  const latestCycles = shardus.getLatestCycles(5)
  const isInRemovedList = latestCycles.some(cycle => cycle.removed.includes(tx.deactivatedNodeId))
  if (ShardeumFlags.VerboseLogs) console.log('isInRemovedList', isInRemovedList)
  if (!isInRemovedList)
    return { result: 'fail', reason: 'The nodeId is not found in the recently removed nodes!' }
  return { result: 'pass', reason: 'valid' }
}

export function applyClaimRewardTx(
  shardus,
  tx: ClaimRewardTX,
  wrappedStates: WrappedStates,
  txTimestamp: number,
  applyResponse: ShardusTypes.ApplyResponse
) {
  const isValidRequest = validateClaimRewardState(tx, shardus)
  if (isValidRequest.result === 'fail') {
    /* prettier-ignore */
    console.log(`Invalid claimRewardTx, nominee ${tx.nominee}, reason: ${isValidRequest.reason}`)
  }
  let nodeAccount: NodeAccount2 = wrappedStates[tx.nominee].data
  const network: NetworkAccount = wrappedStates[networkAccount].data
  const rewardRatePerMilisecond = network.current.nodeRewardAmount.div(new BN(network.current.nodeRewardInterval)) // 1 SHM divided by 10 min

  let durationInNetwork = nodeAccount.rewardEndTime - nodeAccount.rewardStartTime
  if (durationInNetwork <= 0)
    throw new Error(`applyClaimReward failed because durationInNetwork is less than or equal 0`)
  nodeAccount.reward = rewardRatePerMilisecond.mul(new BN(durationInNetwork))
  nodeAccount.timestamp = txTimestamp

  const txId = crypto.hashObj(tx)
  shardus.applyResponseAddChangedAccount(applyResponse, tx.nominee, nodeAccount, txId, txTimestamp)

  console.log('Applied claim_reward tx', tx.nominee)
}
