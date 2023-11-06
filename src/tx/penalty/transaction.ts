import { nestedCountersInstance, Shardus, ShardusTypes } from '@shardus/core'
import {
  AccountType,
  InternalTXType,
  isNodeAccount2,
  NodeAccount2,
  PenaltyTX,
  ViolationType,
  WrappedEVMAccount,
  WrappedStates,
} from '../../shardeum/shardeumTypes'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { crypto, hashSignedObj } from '../../setup/helpers'
import { createInternalTxReceipt, getApplyTXState, logFlags, shardeumGetTime } from '../..'
import { toShardusAddress } from '../../shardeum/evmAddress'
import { getPenaltyForViolation } from './violation'
import * as WrappedEVMAccountFunctions from '../../shardeum/wrappedEVMAccountFunctions'
import { _readableSHM, sleep, generateTxId } from '../../utils'
import { Address } from '@ethereumjs/util'
import { applyPenalty } from './penaltyFunctions'

export async function injectPenaltyTX(
  shardus: Shardus,
  eventData: ShardusTypes.ShardusEvent,
  violationData: any
): Promise<{
  success: boolean
  reason: string
  status: number
}> {
  let tx = {
    reportedNodeId: eventData.nodeId,
    reportedNodePublickKey: eventData.publicKey,
    operatorEVMAddress: '',
    timestamp: shardeumGetTime(),
    violationType: ViolationType.LeftNetworkEarly,
    violationData,
    isInternalTx: true,
    internalTXType: InternalTXType.Penalty,
  }

  const wrapeedNodeAccount: ShardusTypes.WrappedDataFromQueue = await shardus.getLocalOrRemoteAccount(
    tx.reportedNodePublickKey
  )

  if (!wrapeedNodeAccount) {
    return {
      success: false,
      reason: 'Penalty Node Account not found',
      status: 404,
    }
  }

  if (wrapeedNodeAccount && isNodeAccount2(wrapeedNodeAccount.data)) {
    tx.operatorEVMAddress = wrapeedNodeAccount.data.nominator
  } else {
    return {
      success: false,
      reason: 'Operator address could not be found for penalty node',
      status: 404,
    }
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
  }

  tx = shardus.signAsNode(tx) as PenaltyTX
  if (ShardeumFlags.VerboseLogs) {
    const txId = generateTxId(tx)
    console.log(`injectPenaltyTX: tx.timestamp: ${tx.timestamp} txid: ${txId}`, tx)
  }

  return await shardus.put(tx)
}

export function validatePenaltyTX(tx: PenaltyTX, shardus: Shardus): { isValid: boolean; reason: string } {
  if (!tx.reportedNodeId || tx.reportedNodeId === '' || tx.reportedNodeId.length !== 64) {
    /* prettier-ignore */
    nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.reportedNode address invalid`)
    /* prettier-ignore */
    if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.reportedNode address invalid`, tx)
    return { isValid: false, reason: 'Invalid reportedNode ID' }
  }
  if (tx.reportedNodePublickKey == null) {
    /* prettier-ignore */
    nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.reportedNode publicKey invalid`)
    /* prettier-ignore */
    if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.reportedNode publicKey invalid`, tx)
    return { isValid: false, reason: 'Invalid reportedNode public key' }
  }
  if (tx.operatorEVMAddress == null) {
    /* prettier-ignore */
    nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.reportedNode operator address invalid`)
    /* prettier-ignore */
    if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.reportedNode operator address invalid`, tx)
    return { isValid: false, reason: 'Invalid reportedNode operator address' }
  }
  if (tx.violationType < 1000 || tx.violationType > 1002) {
    /* prettier-ignore */
    nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationType not in range`)
    /* prettier-ignore */
    if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationType not in range`, tx)
    return { isValid: false, reason: 'Invalid Violation type ' }
  }
  if (!tx.violationData) {
    //TODO validate violation data using violation types
    /* prettier-ignore */
    nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationData invalid`)
    /* prettier-ignore */
    if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationData invalid`, tx)
    return { isValid: false, reason: 'Invalid Violation data ' }
  }
  // validate node-left-early violation
  if (tx.violationType === ViolationType.LeftNetworkEarly) {
    const violationData = tx.violationData
    const latestCycles = shardus.getLatestCycles(10)
    const lostCycleRecord = latestCycles.find((record) => record.counter === violationData.nodeLostCycle)
    const droppedCycleRecord = latestCycles.find(
      (record) => record.counter === violationData.nodeDroppedCycle
    )

    if (lostCycleRecord == null || droppedCycleRecord == null) {
      /* prettier-ignore */
      nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationData lostCycleRecord or droppedCycleRecord not found`)
      /* prettier-ignore */
      if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationData lostCycleRecord or droppedCycleRecord not found`, tx)
      return { isValid: false, reason: 'Invalid Violation data ' }
    }
    if (!lostCycleRecord.lost.includes(tx.reportedNodeId)) {
      /* prettier-ignore */
      nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationData node not found in lost`)
      /* prettier-ignore */
      if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationData node not found in lost`, tx)
      return { isValid: false, reason: 'Reported node not found in lost' }
    }
    if (!droppedCycleRecord.apoptosized.includes(tx.reportedNodeId)) {
      /* prettier-ignore */
      nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationData node not found in apoptosized`)
      /* prettier-ignore */
      if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationData node not found in apoptosized`, tx)
      return { isValid: false, reason: 'Reported node not found in apoptosized' }
    }
  }
  if (tx.timestamp <= 0) {
    /* prettier-ignore */
    nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.timestamp`)
    /* prettier-ignore */
    if (ShardeumFlags.VerboseLogs) console.log('validatePenaltyTX fail tx.timestamp', tx)
    return { isValid: false, reason: 'Duration in tx must be > 0' }
  }
  try {
    if (!crypto.verifyObj(tx)) {
      /* prettier-ignore */
      nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail Invalid signature`)
      /* prettier-ignore */
      if (ShardeumFlags.VerboseLogs) console.log('validatePenaltyTX fail Invalid signature', tx)
      return { isValid: false, reason: 'Invalid signature for Penalty tx' }
    }
  } catch (e) {
    /* prettier-ignore */
    nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail Invalid signature exception`)
    /* prettier-ignore */
    if (ShardeumFlags.VerboseLogs) console.log('validatePenaltyTX fail Invalid signature exception', tx)
    return { isValid: false, reason: 'Invalid signature for Penalty tx' }
  }
  /* prettier-ignore */
  if (ShardeumFlags.VerboseLogs) console.log('validatePenaltyTX success', tx)
  return { isValid: true, reason: '' }
}

export async function applyPenaltyTX(
  shardus,
  tx: PenaltyTX,
  wrappedStates: WrappedStates,
  txTimestamp: number,
  applyResponse: ShardusTypes.ApplyResponse
): Promise<void> {
  if (ShardeumFlags.VerboseLogs) console.log(`Running applyPenaltyTX`, tx, wrappedStates)
  const isValidRequest = validatePenaltyTX(tx, shardus)
  if (!isValidRequest) {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Invalid penaltyTX, reportedNode ${tx.reportedNodePublickKey}, reason: ${isValidRequest.reason}`)
    nestedCountersInstance.countEvent('shardeum-penalty', `applyPenaltyTX fail `)
    shardus.applyResponseSetFailed(
      applyResponse,
      `applyPenaltyTX failed validatePenaltyTX reportedNode: ${tx.reportedNodePublickKey} reason: ${isValidRequest.reason}`
    )
    return
  }

  const nodeShardusAddress = tx.reportedNodePublickKey
  /* eslint-disable security/detect-object-injection */
  let nodeAccount: NodeAccount2
  if (isNodeAccount2(wrappedStates[nodeShardusAddress].data))
    nodeAccount = wrappedStates[nodeShardusAddress].data as NodeAccount2
  const operatorShardusAddress = toShardusAddress(tx.operatorEVMAddress, AccountType.Account)
  let operatorAccount: WrappedEVMAccount
  if (WrappedEVMAccountFunctions.isWrappedEVMAccount(wrappedStates[operatorShardusAddress].data)) {
    operatorAccount = wrappedStates[operatorShardusAddress].data as WrappedEVMAccount
  }

  nodeAccount.rewardEndTime = tx.violationData?.nodeDroppedTime || Math.floor(tx.timestamp / 1000)

  //TODO should we check if it was already penalized?
  const penaltyAmount = getPenaltyForViolation(tx, nodeAccount.stakeLock)
  applyPenalty(nodeAccount, operatorAccount, penaltyAmount)

  const txId = generateTxId(tx)
  const shardeumState = getApplyTXState(txId)
  shardeumState._transactionState.appData = {}

  const operatorEVMAddress: Address = Address.fromString(tx.operatorEVMAddress)
  await shardeumState.checkpoint()
  await shardeumState.putAccount(operatorEVMAddress, operatorAccount.account)
  await shardeumState.commit()

  /* prettier-ignore */
  if (ShardeumFlags.VerboseLogs) console.log(`Calculating updated node penalty. nodePenaltyAmount: ${_readableSHM(nodeAccount.penalty)}`)

  //TODO should we check for existing funds?

  if (ShardeumFlags.useAccountWrites) {
    let wrappedChangedNodeAccount: ShardusTypes.WrappedData
    if (WrappedEVMAccountFunctions.isInternalAccount(nodeAccount)) {
      wrappedChangedNodeAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(nodeAccount)
    }
    shardus.applyResponseAddChangedAccount(
      applyResponse,
      nodeShardusAddress,
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
    createInternalTxReceipt(
      shardus,
      applyResponse,
      tx,
      tx.reportedNodePublickKey,
      tx.reportedNodePublickKey,
      txTimestamp,
      txId
    )
  }

  /* prettier-ignore */
  nestedCountersInstance.countEvent('shardeum-penalty', `Applied PenaltyTX`)
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Applied PenaltyTX', tx.reportedNodePublickKey)
}
