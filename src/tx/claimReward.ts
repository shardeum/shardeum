import { nestedCountersInstance, Shardus, ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { Address } from '@ethereumjs/util'
import { networkAccount } from '../shardeum/shardeumConstants'
import { createInternalTxReceipt, getApplyTXState, logFlags, shardeumGetTime } from '../index'
import { hashSignedObj } from '../setup/helpers'
import { toShardusAddress } from '../shardeum/evmAddress'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  AccountType,
  ClaimRewardTX,
  InternalTXType,
  isNetworkAccount,
  isNodeAccount2,
  NetworkAccount,
  NodeAccount2,
  WrappedEVMAccount,
  WrappedStates,
} from '../shardeum/shardeumTypes'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import * as AccountsStorage from '../storage/accountStorage'
import { scaleByStabilityFactor, sleep, _base16BNParser, _readableSHM, generateTxId } from '../utils'
import { retry } from '../utils/retry'

export async function injectClaimRewardTx(
  shardus,
  eventData: ShardusTypes.ShardusEvent,
  nodeAccount: NodeAccount2
): Promise<{
  success: boolean
  reason: string
  status: number
}> {
  let tx = {
    nominee: eventData.publicKey,
    nominator: nodeAccount.nominator,
    timestamp: shardeumGetTime(),
    deactivatedNodeId: eventData.nodeId,
    nodeDeactivatedTime: eventData.time,
    cycle: eventData.cycleNumber,
    isInternalTx: true,
    internalTXType: InternalTXType.ClaimReward,
  }

  if (ShardeumFlags.txHashingFix) {
    // to make sure that differnt nodes all submit an equivalent tx that is counted as the same tx,
    // we need to make sure that we have a determinstic timestamp
    const cycleEndTime = eventData.time
    let futureTimestamp = cycleEndTime * 1000
    while (futureTimestamp < shardeumGetTime()) {
      futureTimestamp += 30 * 1000
    }
    const waitTime = futureTimestamp - shardeumGetTime()
    tx.timestamp = futureTimestamp
    // since we have to pick a future timestamp, we need to wait until it is time to submit the tx
    await sleep(waitTime)
    // todo: aamir keep an eye on the waitTime
  }

  tx = shardus.signAsNode(tx)
  if (ShardeumFlags.VerboseLogs) {
    const latestCycles = shardus.getLatestCycles(1)
    const txId = generateTxId(tx)
    console.log(`injectClaimRewardTx: tx.timestamp: ${tx.timestamp} txid: ${txId}, cycle:`, tx, latestCycles[0])
  }
  const injectResult = await shardus.put(tx)
  return injectResult
}

export async function injectClaimRewardTxWithRetry(
  shardus,
  eventData: ShardusTypes.ShardusEvent
): Promise<unknown> {
  let wrappedData: ShardusTypes.WrappedData = await shardus.getLocalOrRemoteAccount(eventData.publicKey)

  if (wrappedData == null || wrappedData.data == null) {
    //try one more time
    wrappedData = await shardus.getLocalOrRemoteAccount(eventData.publicKey)
    if (wrappedData == null || wrappedData.data == null) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`injectClaimRewardTx failed cant find : ${eventData.publicKey}`)
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `injectClaimRewardTx failed cant find node`)
      return
    }
  }
  const nodeAccount = wrappedData.data as NodeAccount2
  // check if the rewardStartTime is non-zero
  if (nodeAccount.rewardStartTime <= 0) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`injectClaimRewardTx failed rewardStartTime <= 0`)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `injectClaimRewardTx failed rewardStartTime <= 0`)
    return
  }
  // check if nodeAccount.rewardEndTime is already set to eventData.time
  if (nodeAccount.rewardEndTime >= eventData.time) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`injectClaimRewardTx failed rewardEndTime already set : ${eventData.publicKey}`, nodeAccount)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `injectClaimRewardTx failed rewardEndTime already set`)
    return
  }

  let rewardEndTimeBeforeInjection = nodeAccount.rewardEndTime
  if (!rewardEndTimeBeforeInjection) {
    rewardEndTimeBeforeInjection = 0
  }

  const retryFunc = async (): Promise<unknown> => {
    return await injectClaimRewardTx(shardus, eventData, nodeAccount)
  }

  const shouldRetryFunc = async (result): Promise<boolean> => {
    if (result == null) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`injectClaimRewardTxWithRetry failed response was null`)
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `injectClaimRewardTxWithRetry failed response was null`)
      return true
    }
    if (result.status === 400) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`injectClaimRewardTxWithRetry 400 error: ${result.reason}`)
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `injectClaimRewardTxWithRetry 400 error: ${result.reason}`)
      //note we want to go ahead and not retry, because 400 == bad request
      return false
    }

    if (result.success) {
      const nodeAccount = await shardus.getLocalOrRemoteAccount(eventData.publicKey)
      if (!nodeAccount) {
        return true
      }
      const data = nodeAccount.data
      // Reward end time is updated do not retry
      if (data.rewardEndTime > rewardEndTimeBeforeInjection) {// tx is applied already
        return false
      }
      return true
    }
    return true
  }

  const res = await retry(
    retryFunc,
    shouldRetryFunc,
    ShardeumFlags.ClaimRewardRetryCount,
    ShardeumFlags.FailedTxLinearBackOffConstantInSecs
  )
  if (!res) {
    /* prettier-ignore */ nestedCountersInstance.countRareEvent('linear-back-off-retry', 'fail: retries exhausted without success in injectClaimRewardTxWithRetry')
    return null
  }
  return res
}

export function validateClaimRewardTx(tx: ClaimRewardTX, shardus: Shardus): { isValid: boolean; reason: string } {
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
  if(shardus.getNode(tx.deactivatedNodeId)){
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardTx fail node still active`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx fail node still active', tx)
    return { isValid: false, reason: 'Node is still active' }
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
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardTx format success', tx)
  return { isValid: true, reason: '' }
}

export function validateClaimRewardState(
  tx: ClaimRewardTX,
  wrappedStates: WrappedStates,
  shardus,
  mustUseAdminCert = false
): { result: string; reason: string } {
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validating claimRewardTX', tx)
  const isValid = crypto.verifyObj(tx)
  if (!isValid) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardState fail Invalid signature`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState fail Invalid signature', tx)
    return { result: 'fail', reason: 'Invalid signature' }
  }

  if (!ShardeumFlags.enableClaimRewardAdminCert && mustUseAdminCert) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardState fail Reward is disabled for admin cert or golden ticket node`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState fail Reward is disabled for admin cert or golden ticket node', tx)
    return { result: 'fail', reason: 'Reward is disabled for admin cert or golden ticket node' }
  }

  /* eslint-disable security/detect-object-injection */
  let nodeAccount: NodeAccount2
  if (isNodeAccount2(wrappedStates[tx.nominee].data)) {
    nodeAccount = wrappedStates[tx.nominee].data as NodeAccount2
  }
  // check if the rewardStartTime is non-zero
  if (nodeAccount.rewardStartTime <= 0) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardState fail rewardStartTime <= 0`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState fail rewardStartTime <= 0', tx)
    return { result: 'fail', reason: 'rewardStartTime is less than or equal 0' }
  }

  // check if nodeAccount.rewardEndTime is already set to tx.nodeDeactivatedTime
  if (nodeAccount.rewardEndTime >= tx.nodeDeactivatedTime) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardState fail rewardEndTime already set`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState fail rewardEndTime already set', tx)
    return { result: 'fail', reason: 'rewardEndTime is already set' }
  }

  const latestCycles = shardus.getLatestCycles(5)

  // This still needs to consider for lost cases, but we have to be careful for refuted back cases
  let nodeApopedCycle
  const nodeRemovedCycle = latestCycles.find((cycle) => cycle.removed.includes(tx.deactivatedNodeId))
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('nodeRemovedCycle', nodeRemovedCycle)
  if (!nodeRemovedCycle) {
    nodeApopedCycle = latestCycles.find((cycle) => cycle.apoptosized.includes(tx.deactivatedNodeId))
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

  const nominee_nodeAcc = wrappedStates[tx.nominee].data as NodeAccount2
  if (nominee_nodeAcc.nominator !== tx.nominator) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState fail tx.nominator does not match', tx)
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateClaimRewardState fail tx.nominator does not match`)
    return { result: 'fail', reason: 'tx.nominator does not match' }
  }

  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateClaimRewardState success', tx)
  return { result: 'pass', reason: 'valid' }
}

export async function applyClaimRewardTx(
  shardus,
  tx: ClaimRewardTX,
  wrappedStates: WrappedStates,
  txId: string,
  txTimestamp: number,
  applyResponse: ShardusTypes.ApplyResponse,
  mustUseAdminCert = false
): Promise<void> {
  if (ShardeumFlags.VerboseLogs) console.log(`Running applyClaimRewardTx`, tx, wrappedStates)
  const isValidRequest = validateClaimRewardState(tx, wrappedStates, shardus, mustUseAdminCert)
  if (isValidRequest.result === 'fail') {
    /* prettier-ignore */
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Invalid claimRewardTx, nominee ${tx.nominee}, reason: ${isValidRequest.reason}`)
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
  const operatorShardusAddress = toShardusAddress(tx.nominator, AccountType.Account)
  /* eslint-disable security/detect-object-injection */
  let nodeAccount: NodeAccount2
  if (isNodeAccount2(wrappedStates[tx.nominee].data)) {
    nodeAccount = wrappedStates[tx.nominee].data as NodeAccount2
  }
  let network: NetworkAccount
  if (isNetworkAccount(wrappedStates[networkAccount].data)) {
    network = wrappedStates[networkAccount].data as NetworkAccount
  }
  let operatorAccount: WrappedEVMAccount
  if (WrappedEVMAccountFunctions.isWrappedEVMAccount(wrappedStates[operatorShardusAddress].data)) {
    operatorAccount = wrappedStates[operatorShardusAddress].data as WrappedEVMAccount
  }

  /* eslint-enable security/detect-object-injection */

  const nodeRewardAmountUsd = _base16BNParser(network.current.nodeRewardAmountUsd) //BigInt(Number('0x' +
  const nodeRewardAmount = scaleByStabilityFactor(nodeRewardAmountUsd, AccountsStorage.cachedNetworkAccount)
  const nodeRewardInterval = BigInt(network.current.nodeRewardInterval)

  if (nodeAccount.rewardStartTime <= 0) {
    nestedCountersInstance.countEvent('shardeum-staking', `applyClaimRewardTx fail rewardStartTime <= 0`)
    shardus.applyResponseSetFailed(
      applyResponse,
      `applyClaimReward failed because rewardStartTime is less than or equal 0`
    )
    return
  }

  const durationInNetwork = tx.nodeDeactivatedTime - nodeAccount.rewardStartTime
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
  let rewardedAmount = nodeRewardAmount * BigInt(durationInNetwork * 1000) // Convert from seconds to milliseconds
  //update total reward var so it can be logged
  rewardedAmount = rewardedAmount / nodeRewardInterval
  //re-parse reward since it was saved as hex
  nodeAccount.reward = _base16BNParser(nodeAccount.reward)
  //add the reward because nodes can cycle without unstaking
  nodeAccount.reward = nodeAccount.reward + rewardedAmount
  nodeAccount.timestamp = txTimestamp

  nodeAccount.rewarded = true

  // update the node account historical stats
  nodeAccount.nodeAccountStats.totalReward =
    _base16BNParser(nodeAccount.nodeAccountStats.totalReward) + rewardedAmount
  nodeAccount.nodeAccountStats.history.push({ b: nodeAccount.rewardStartTime, e: nodeAccount.rewardEndTime })

  const shardeumState = getApplyTXState(txId)
  shardeumState._transactionState.appData = {}

  if (operatorAccount?.operatorAccountInfo == null) {
    nestedCountersInstance.countEvent(
      'shardeum-staking',
      'claiming reward on account with no `operatorAccountInfo`'
    )
    shardus.applyResponseSetFailed(
      applyResponse,
      'applyClaimReward failed because `operatorAccountInfo` is null'
    )
    return
  }

  // update the operator historical stats
  operatorAccount.operatorAccountInfo.operatorStats.history.push({
    b: nodeAccount.rewardStartTime,
    e: nodeAccount.rewardEndTime,
  })
  operatorAccount.operatorAccountInfo.operatorStats.totalNodeReward =
    _base16BNParser(operatorAccount.operatorAccountInfo.operatorStats.totalNodeReward) + rewardedAmount
  operatorAccount.operatorAccountInfo.operatorStats.totalNodeTime += durationInNetwork

  operatorAccount.operatorAccountInfo.operatorStats.lastStakedNodeKey =
    operatorAccount.operatorAccountInfo.nominee

  // hmm may be we don't need this as we are not updating nonce and balance
  const operatorEVMAddress: Address = Address.fromString(tx.nominator)
  await shardeumState.checkpoint()
  await shardeumState.putAccount(operatorEVMAddress, operatorAccount.account)
  await shardeumState.commit()

  operatorAccount.timestamp = txTimestamp
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log( `Calculating node reward. nodeRewardAmount: ${_readableSHM(nodeRewardAmount)}, nodeRewardInterval: ${ network.current.nodeRewardInterval } ms, uptime duration: ${durationInNetwork} sec, rewardedAmount: ${_readableSHM( rewardedAmount )}, finalReward: ${_readableSHM(nodeAccount.reward)}   nodeAccount.rewardEndTime:${ nodeAccount.rewardEndTime }  nodeAccount.rewardStartTime:${nodeAccount.rewardStartTime} ` )

  if (ShardeumFlags.useAccountWrites) {
    let wrappedChangedNodeAccount: ShardusTypes.WrappedData
    if (WrappedEVMAccountFunctions.isInternalAccount(nodeAccount)) {
      wrappedChangedNodeAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(nodeAccount)
    }
    shardus.applyResponseAddChangedAccount(
      applyResponse,
      tx.nominee,
      wrappedChangedNodeAccount,
      txId,
      txTimestamp
    )

    let wrappedChangedOperatorAccount: ShardusTypes.WrappedData
    /* eslint-disable security/detect-object-injection */
    if (WrappedEVMAccountFunctions.isWrappedEVMAccount(wrappedStates[operatorShardusAddress].data)) {
      wrappedChangedOperatorAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
        wrappedStates[operatorShardusAddress].data as WrappedEVMAccount
      )
    }
    /* eslint-enable security/detect-object-injection */
    shardus.applyResponseAddChangedAccount(
      applyResponse,
      operatorShardusAddress,
      wrappedChangedOperatorAccount,
      txId,
      txTimestamp
    )
  }

  if (ShardeumFlags.supportInternalTxReceipt) {
    createInternalTxReceipt(shardus, applyResponse, tx, tx.nominee, tx.nominee, txTimestamp, txId)
  }

  /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `Applied ClaimRewardTX`)
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Applied ClaimRewardTX', tx.nominee)
}
