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
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import { _base16BNParser } from '../utils'

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
  if (!tx.nominee || tx.nominee === '' || tx.nominee.length !== 64) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardTx fail tx.nominee address invalid`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx fail tx.nominee address invalid', tx)
    return { isValid: false, reason: 'Invalid nominee address' }
  }
  if (!tx.deactivatedNodeId || tx.deactivatedNodeId === '' || tx.deactivatedNodeId.length !== 64) {
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
    if (!crypto.verifyObj(tx)) {
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
  if (!isValid) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardState fail Invalid signature`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState fail Invalid signature', tx)
    return { result: 'fail', reason: 'Invalid signature' }
  }
  const latestCycles = shardus.getLatestCycles(5)

  // This still needs to consider for lost cases, but we have to be careful for refuted back cases
  let nodeRemovedCycle
  let nodeApopedCycle
  nodeRemovedCycle = latestCycles.find(cycle => cycle.removed.includes(tx.deactivatedNodeId))
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('nodeRemovedCycle', nodeRemovedCycle)
  if (!nodeRemovedCycle) {
    nodeApopedCycle = latestCycles.find(cycle => cycle.apoptosized.includes(tx.deactivatedNodeId))
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('nodeApopedCycle', nodeApopedCycle)
    if (!nodeApopedCycle) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState fail not found on both removed or apoped lists', tx)
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardState fail not found on both removed or apoped lists`)
      return { result: 'fail', reason: 'The nodeId is not found in the recently removed or apoped nodes!' }
    }
  }
  if (
    (nodeRemovedCycle && nodeRemovedCycle.start !== tx.nodeDeactivatedTime) ||
    (nodeApopedCycle && nodeApopedCycle.start !== tx.nodeDeactivatedTime)
  ) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validate InitRewardTimes fail nodeActivedCycle.start !== tx.nodeActivatedTime', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validate InitRewardTimes fail nodeActivedCycle.start !== tx.nodeActivatedTime`)
    return { result: 'fail', reason: 'The cycle start time and nodeActivatedTime does not match!' }
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
  const nodeRewardAmount = _base16BNParser(network.current.nodeRewardAmount) //new BN(Number('0x' + network.current.nodeRewardAmount).toString())
  
  //TODO I think these calculations could be lossy.  We should use a product before a divide
  const rewardRatePerMilisecond = nodeRewardAmount.div(new BN(network.current.nodeRewardInterval)) // 1 SHM divided by 10 min
  nodeAccount.rewardEndTime = tx.nodeDeactivatedTime

  let durationInNetwork = nodeAccount.rewardEndTime - nodeAccount.rewardStartTime
  if (durationInNetwork <= 0)
    throw new Error(`applyClaimReward failed because durationInNetwork is less than or equal 0`)
  nodeAccount.reward = rewardRatePerMilisecond.mul(new BN(durationInNetwork))
  nodeAccount.timestamp = txTimestamp

  const txId = crypto.hashObj(tx)
  if (ShardeumFlags.useAccountWrites) {
    const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
      wrappedStates[tx.nominee].data
    )
    shardus.applyResponseAddChangedAccount(
      applyResponse,
      tx.nominee,
      wrappedChangedAccount,
      txId,
      txTimestamp
    )
  }

  /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `Applied ClaimRewardTX`)
  console.log('Applied ClaimRewardTX', tx.nominee)
}
