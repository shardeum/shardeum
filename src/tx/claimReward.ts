import { nestedCountersInstance, ShardusTypes } from '@shardus/core'
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
  return await shardus.put(tx)
}

//TODO this is not called yet!  looks like it should be validateFields
export function validateClaimRewardTx(tx: ClaimRewardTX, appData: any): { isValid: boolean; reason: string } {
  if (!isValidAddress(tx.nominee)) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardTx fail tx.nominee address invalid`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx fail tx.nominee address invalid', tx)
    return { isValid: false, reason: 'Invalid nominee address' }
  }
  if (!isValidAddress(tx.deactivatedNodeId)) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardTx fail tx.deactivatedNodeId address invalid`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx fail tx.deactivatedNodeId address invalid', tx)
    return { isValid: false, reason: 'Invalid deactivatedNodeId' }
  }
  if (tx.nodeDeactivatedTime <= 0) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardTx fail tx.nodeDeactivatedTime <= 0`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx fail tx.nodeDeactivatedTime <= 0', tx)
    return { isValid: false, reason: 'nodeDeactivatedTime must be > 0' }
  }
  if (tx.timestamp <= 0) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardTx fail tx.timestamp`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx fail tx.timestamp', tx)
    return { isValid: false, reason: 'Duration in tx must be > 0' }
  }
  try {
    if (!crypto.verifyObj(tx)){
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardTx fail Invalid signature`)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx fail Invalid signature', tx)
      return { isValid: false, reason: 'Invalid signature for ClaimReward tx' }
    } 
  } catch (e) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardTx fail Invalid signature exception`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx fail Invalid signature exception', tx)
    return { isValid: false, reason: 'Invalid signature for ClaimReward tx' }
  }
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx success', tx)  
  return { isValid: true, reason: '' }
}

export function validateClaimRewardState(tx: ClaimRewardTX, shardus) {
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validating claimRewardTX', tx)
  let isValid = crypto.verifyObj(tx)
  if (!isValid){
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardState fail Invalid signature`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState fail Invalid signature', tx)
    return { result: 'fail', reason: 'Invalid signature' }
  } 
  const latestCycles = shardus.getLatestCycles(5)
  const isInRemovedList = latestCycles.some(cycle => cycle.removed.includes(tx.deactivatedNodeId))
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('isInRemovedList', isInRemovedList)
  if (!isInRemovedList){
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState fail !isInRemovedList', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardState fail !isInRemovedList`)
    return { result: 'fail', reason: 'The nodeId is not found in the recently removed nodes!' }
  }
  
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState success', tx)  
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

  /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `Applied ClaimRewardTX`)
  console.log('Applied ClaimRewardTX', tx.nominee)
}
