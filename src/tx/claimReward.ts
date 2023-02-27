import { nestedCountersInstance, ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { BN, isValidAddress, Address } from 'ethereumjs-util'
import { networkAccount, ONE_SECOND } from '..'
import config from '../config'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  ClaimRewardTX,
  InternalTXType,
  NetworkAccount,
  WrappedStates,
  NodeAccount2,
  WrappedEVMAccount,
  AccountType,
} from '../shardeum/shardeumTypes'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import { _base16BNParser, _readableSHM, scaleByStabilityFactor, sleep } from '../utils'
import * as AccountsStorage from '../storage/accountStorage'
import { getAccountShardusAddress, toShardusAddress, toShardusAddressWithKey } from '../shardeum/evmAddress'
import { getApplyTXState } from '../index'

export function isClaimRewardTx(tx: any): boolean {
  if (tx.isInternalTx && tx.internalTXType === InternalTXType.ClaimReward) {
    return true
  }
  return false
}

export async function injectClaimRewardTx(shardus, eventData: ShardusTypes.ShardusEvent) {
  let nodeAccount = await shardus.getLocalOrRemoteAccount(eventData.publicKey)
  if (nodeAccount === null) {
    //try one more time
    nodeAccount = await shardus.getLocalOrRemoteAccount(eventData.publicKey)
    if (nodeAccount === null) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`injectClaimRewardTx failed cant find : ${eventData.publicKey}`)
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `injectClaimRewardTx failed cant find node`)
      return
    }
  }
  let tx = {
    nominee: eventData.publicKey,
    nominator: nodeAccount.data.nominator,
    timestamp: Date.now(),
    deactivatedNodeId: eventData.nodeId,
    nodeDeactivatedTime: eventData.time,
    isInternalTx: true,
    internalTXType: InternalTXType.ClaimReward,
  }

  // to make sure that differnt nodes all submit an equivalent tx that is counted as the same tx,
  // we need to make sure that we have a determinstic timestamp
  const cycleEndTime = eventData.time
  let futureTimestamp = cycleEndTime * 1000
  while (futureTimestamp < Date.now()) {
    futureTimestamp += 30 * 1000
  }
  let waitTime = futureTimestamp - Date.now()
  tx.timestamp = futureTimestamp
  // since we have to pick a future timestamp, we need to wait until it is time to submit the tx
  await sleep(waitTime)

  tx = shardus.signAsNode(tx)
  if (ShardeumFlags.VerboseLogs) {
    let customTXhash = crypto.hashObj(tx, true)
    console.log(`injectClaimRewardTx: tx.timestamp: ${tx.timestamp} customTXhash: ${customTXhash}`, tx)
  }

  return await shardus.put(tx)
}

export async function injectClaimRewardTxWithRetry(shardus, eventData: ShardusTypes.ShardusEvent) {
  for (let i = 0; i < ShardeumFlags.ClaimRewardRetryCount + 1; i++) {
    let response = await injectClaimRewardTx(shardus, eventData)
    //had an all nodes crash situation when response was null
    if (response == null) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`injectClaimRewardTxWithRetry failed response was null`)
      continue
    }
    if (response != null && (response.success || response.status === 400)) {
      return response
    }
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`failed to inject claim reward tx, retrying! reason: ${response.reason}, status: ${response.status}`)
  }
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

export async function applyClaimRewardTx(
  shardus,
  tx: ClaimRewardTX,
  wrappedStates: WrappedStates,
  txTimestamp: number,
  applyResponse: ShardusTypes.ApplyResponse
) {
  if (ShardeumFlags.VerboseLogs) console.log(`Running applyClaimRewardTx`, tx, wrappedStates)
  const isValidRequest = validateClaimRewardState(tx, shardus)
  if (isValidRequest.result === 'fail') {
    /* prettier-ignore */
    console.log(`Invalid claimRewardTx, nominee ${tx.nominee}, reason: ${isValidRequest.reason}`)
    nestedCountersInstance.countEvent('shardeum-staking', `applyClaimRewardTx fail `)
    // throw new Error(
    //   `applyClaimReward failed validateClaimRewardState nominee ${tx.nominee} ${isValidRequest.reason}`
    // )
    shardus.applyResponseSetFailed(
      applyResponse,
      `applyClaimReward failed validateClaimRewardState nominee ${tx.nominee} ${isValidRequest.reason}`
    )
    return
  }
  let operatorShardusAddress = toShardusAddress(tx.nominator, AccountType.Account)
  let nodeAccount: NodeAccount2 = wrappedStates[tx.nominee].data
  const network: NetworkAccount = wrappedStates[networkAccount].data
  const operatorAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress].data

  const nodeRewardAmountUsd = _base16BNParser(network.current.nodeRewardAmountUsd) //new BN(Number('0x' +
  const nodeRewardAmount = scaleByStabilityFactor(nodeRewardAmountUsd, AccountsStorage.cachedNetworkAccount)
  const nodeRewardInterval = new BN(network.current.nodeRewardInterval)

  if (nodeAccount.rewardStartTime <= 0) {
    nestedCountersInstance.countEvent('shardeum-staking', `applyClaimRewardTx fail rewardStartTime <= 0`)
    shardus.applyResponseSetFailed(
      applyResponse,
      `applyClaimReward failed because rewardStartTime is less than or equal 0`
    )
    return
  }

  let durationInNetwork = tx.nodeDeactivatedTime - nodeAccount.rewardStartTime
  if (durationInNetwork <= 0) {
    nestedCountersInstance.countEvent('shardeum-staking', `applyClaimRewardTx fail durationInNetwork <= 0`)
    //throw new Error(`applyClaimReward failed because durationInNetwork is less than or equal 0`)
    shardus.applyResponseSetFailed(
      applyResponse,
      `applyClaimReward failed because durationInNetwork is less than or equal 0`
    )
    return
  }

  if (nodeAccount.rewarded === true) {
    nestedCountersInstance.countEvent('shardeum-staking', `applyClaimRewardTx fail already rewarded`)
    //throw new Error(`applyClaimReward failed already rewarded`)
    shardus.applyResponseSetFailed(applyResponse, `applyClaimReward failed already rewarded`)
    return
  }

  nodeAccount.rewardEndTime = tx.nodeDeactivatedTime

  //we multiply fist then devide to preserve precision
  let totalReward = nodeRewardAmount.mul(new BN(durationInNetwork * 1000)) // Convert from seconds to milliseconds
  //update total reward var so it can be logged
  totalReward = totalReward.div(nodeRewardInterval)
  //re-parse reward since it was saved as hex
  nodeAccount.reward = _base16BNParser(nodeAccount.reward)
  //add the reward because nodes can cycle without unstaking
  nodeAccount.reward = nodeAccount.reward.add(totalReward)
  nodeAccount.timestamp = txTimestamp

  nodeAccount.rewarded = true

  // update the node account historical stats
  nodeAccount.nodeAccountStats.totalReward = _base16BNParser(nodeAccount.nodeAccountStats.totalReward).add(
    nodeAccount.reward
  )
  nodeAccount.nodeAccountStats.history.push({ b: nodeAccount.rewardStartTime, e: nodeAccount.rewardEndTime })

  let txId = crypto.hashObj(tx)
  let shardeumState = getApplyTXState(txId)
  shardeumState._transactionState.appData = {}

  // update the operator historical stats
  operatorAccount.operatorAccountInfo.operatorStats.history.push({
    b: nodeAccount.rewardStartTime,
    e: nodeAccount.rewardEndTime,
  })
  operatorAccount.operatorAccountInfo.operatorStats.totalNodeReward = _base16BNParser(
    operatorAccount.operatorAccountInfo.operatorStats.totalNodeReward
  ).add(nodeAccount.reward)
  operatorAccount.operatorAccountInfo.operatorStats.totalNodeTime += durationInNetwork

  operatorAccount.operatorAccountInfo.operatorStats.lastStakedNodeKey =
    operatorAccount.operatorAccountInfo.nominee

  // hmm may be we don't need this as we are not updating nonce and balance
  let operatorEVMAddress: Address = Address.fromString(tx.nominator)
  await shardeumState.checkpoint()
  await shardeumState.putAccount(operatorEVMAddress, operatorAccount.account)
  await shardeumState.commit()

  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log( `Calculating node reward. nodeRewardAmount: ${_readableSHM(nodeRewardAmount)}, nodeRewardInterval: ${ network.current.nodeRewardInterval } ms, uptime duration: ${durationInNetwork} sec, totalReward: ${_readableSHM( totalReward )}, finalReward: ${_readableSHM(nodeAccount.reward)}   nodeAccount.rewardEndTime:${ nodeAccount.rewardEndTime }  nodeAccount.rewardStartTime:${nodeAccount.rewardStartTime} ` )

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

    const wrappedChangedOperatorAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
      wrappedStates[operatorShardusAddress].data
    )
    shardus.applyResponseAddChangedAccount(
      applyResponse,
      operatorShardusAddress,
      wrappedChangedOperatorAccount,
      txId,
      txTimestamp
    )
  }

  /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `Applied ClaimRewardTX`)
  console.log('Applied ClaimRewardTX', tx.nominee)
}
