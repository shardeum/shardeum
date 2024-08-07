import { nestedCountersInstance, Shardus, ShardusTypes } from '@shardus/core'
import {
  AccountType,
  InternalTXType,
  isNodeAccount2,
  LeftNetworkEarlyViolationData,
  NodeAccount2,
  NodeRefutedViolationData,
  PenaltyTX,
  SyncingTimeoutViolationData,
  ViolationType,
  WrappedEVMAccount,
  WrappedStates,
} from '../../shardeum/shardeumTypes'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { crypto } from '../../setup/helpers'
import { createInternalTxReceipt, getApplyTXState, logFlags, shardeumGetTime } from '../..'
import { toShardusAddress } from '../../shardeum/evmAddress'
import { getPenaltyForViolation } from './violation'
import * as WrappedEVMAccountFunctions from '../../shardeum/wrappedEVMAccountFunctions'
import { _readableSHM, generateTxId, sleep } from '../../utils'
import { Address, bigIntToHex } from '@ethereumjs/util'
import { applyPenalty } from './penaltyFunctions'
import * as AccountsStorage from '../../storage/accountStorage'
import config from '../../config'

const penaltyTxsMap: Map<string, PenaltyTX> = new Map()

export async function injectPenaltyTX(
  shardus: Shardus,
  eventData: ShardusTypes.ShardusEvent,
  violationData: LeftNetworkEarlyViolationData | NodeRefutedViolationData | SyncingTimeoutViolationData
): Promise<{
  success: boolean
  reason: string
  status: number
}> {
  let violationType: ViolationType
  if (eventData.type === 'node-left-early') violationType = ViolationType.LeftNetworkEarly
  else if (eventData.type === 'node-refuted') violationType = ViolationType.NodeRefuted
  else if (eventData.type === 'node-sync-timeout') violationType = ViolationType.SyncingTooLong
  const unsignedTx = {
    reportedNodeId: eventData.nodeId,
    reportedNodePublickKey: eventData.publicKey,
    operatorEVMAddress: '',
    timestamp: shardeumGetTime(),
    violationType,
    violationData,
    isInternalTx: true,
    internalTXType: InternalTXType.Penalty,
  }

  const wrapeedNodeAccount: ShardusTypes.WrappedDataFromQueue = await shardus.getLocalOrRemoteAccount(
    unsignedTx.reportedNodePublickKey
  )

  if (!wrapeedNodeAccount) {
    return {
      success: false,
      reason: 'Penalty Node Account not found',
      status: 404,
    }
  }

  if (wrapeedNodeAccount && isNodeAccount2(wrapeedNodeAccount.data)) {
    unsignedTx.operatorEVMAddress = wrapeedNodeAccount.data.nominator
  } else {
    return {
      success: false,
      reason: 'Operator address could not be found for penalty node',
      status: 404,
    }
  }

  // to make sure that differnt nodes all submit an equivalent unsignedTx that is counted as the same unsignedTx,
  // we need to make sure that we have a determinstic timestamp
  const cycleEndTime = eventData.time
  let futureTimestamp = cycleEndTime * 1000
  while (futureTimestamp < shardeumGetTime()) {
    futureTimestamp += 30 * 1000
  }
  unsignedTx.timestamp = futureTimestamp

  const signedTx = shardus.signAsNode(unsignedTx) as PenaltyTX
  const txId = generateTxId(unsignedTx)
  // store the unsignedTx to local map for later use
  recordPenaltyTX(txId, signedTx)

  // Limit the nodes that send this to the <ShardeumFlags.numberOfNodesToInjectPenaltyTx> closest to the node address ( publicKey )
  const closestNodes = shardus.getClosestNodes(
    eventData.publicKey,
    ShardeumFlags.numberOfNodesToInjectPenaltyTx
  )
  const ourId = shardus.getNodeId()
  const isLuckyNode = closestNodes.some((nodeId) => nodeId === ourId)
  if (!isLuckyNode) {
    if (ShardeumFlags.VerboseLogs)
      console.log(`injectPenaltyTX: not lucky node, skipping injection`, signedTx)
    return
  }
  const waitTime = futureTimestamp - shardeumGetTime()
  // since we have to pick a future timestamp, we need to wait until it is time to submit the signedTx
  await sleep(waitTime)

  if (ShardeumFlags.VerboseLogs) {
    console.log(`injectPenaltyTX: tx.timestamp: ${signedTx.timestamp} txid: ${txId}`, signedTx)
  }

  const result = await shardus.put(signedTx)
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('INJECTED_PENALTY_TX', result)
  return result
}

function recordPenaltyTX(txId: string, tx: PenaltyTX): void {
  if (penaltyTxsMap.has(txId) === false) {
    penaltyTxsMap.set(txId, tx)
  }
}

/**
 * Compares the event timestamp of the penalty tx with the timestamp of the last saved penalty tx
 */
function isProcessedPenaltyTx(
  tx: PenaltyTX,
  nodeAccount: NodeAccount2
): { isProcessed: boolean; eventTime: number } {
  switch (tx.violationType) {
    case ViolationType.LeftNetworkEarly:
      return {
        isProcessed:
          nodeAccount.nodeAccountStats.lastPenaltyTime >=
          (tx.violationData as LeftNetworkEarlyViolationData).nodeDroppedTime,
        eventTime: (tx.violationData as LeftNetworkEarlyViolationData).nodeDroppedTime,
      }

    case ViolationType.NodeRefuted:
      return {
        isProcessed:
          nodeAccount.nodeAccountStats.lastPenaltyTime >=
          (tx.violationData as NodeRefutedViolationData).nodeRefutedTime,
        eventTime: (tx.violationData as NodeRefutedViolationData).nodeRefutedTime,
      }

    case ViolationType.SyncingTooLong:
      return {
        isProcessed:
          nodeAccount.nodeAccountStats.lastPenaltyTime >=
          (tx.violationData as SyncingTimeoutViolationData).nodeDroppedTime,
        eventTime: (tx.violationData as SyncingTimeoutViolationData).nodeDroppedTime,
      }

    default:
      throw new Error(`Unknown Violation type: , ${tx.violationType}`)
  }
}

export function clearOldPenaltyTxs(shardus: Shardus): void {
  let deleteCount = 0
  /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-penalty', `clearOldPenaltyTxs mapSize:${penaltyTxsMap.size}`)
  const now = shardus.shardusGetTime()
  for (const [txId, tx] of penaltyTxsMap.entries()) {
    const cycleDuration = config.server.p2p.cycleDuration * 1000
    if (now - tx.timestamp > 5 * cycleDuration) {
      penaltyTxsMap.delete(txId)
      deleteCount++
    }
  }
  /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-penalty', `clearOldPenaltyTxs deleteCount: ${deleteCount}`)
}

export function validatePenaltyTX(txId: string, tx: PenaltyTX, isApply = false): { isValid: boolean; reason: string } {
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
  if (tx.violationType < ViolationType.ShardeumMinID || tx.violationType > ViolationType.ShardeumMaxID) {
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

  // this check should happen only for exe nodes applying the penalty tx
  if (isApply) {
  // check if we have this penalty tx stored in the Map
  const preRecordedfPenaltyTX = penaltyTxsMap.get(txId)

  if (preRecordedfPenaltyTX == null) {
      return { isValid: false, reason: 'Penalty TX not found in penaltyTxsMap of exe node' }
  }
  }


  // validate node-left-early violation
  // if (tx.violationType === ViolationType.LeftNetworkEarly) {
  // const violationData = tx.violationData
  // const latestCycles = shardus.getLatestCycles(10)
  // const lostCycleRecord = latestCycles.find((record) => record.counter === violationData.nodeLostCycle)
  // const droppedCycleRecord = latestCycles.find(
  //   (record) => record.counter === violationData.nodeDroppedCycle
  // )
  //
  // if (lostCycleRecord == null || droppedCycleRecord == null) {
  //   /* prettier-ignore */
  //   nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationData lostCycleRecord or droppedCycleRecord not found`)
  //   /* prettier-ignore */
  //   if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationData lostCycleRecord or droppedCycleRecord not found`, tx)
  //   return { isValid: false, reason: 'Invalid Violation data ' }
  // }
  // if (!lostCycleRecord.lost.includes(tx.reportedNodeId)) {
  //   /* prettier-ignore */
  //   nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationData node not found in lost`)
  //   /* prettier-ignore */
  //   if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationData node not found in lost`, tx)
  //   return { isValid: false, reason: 'Reported node not found in lost' }
  // }
  // if (!droppedCycleRecord.apoptosized.includes(tx.reportedNodeId)) {
  //   /* prettier-ignore */
  //   nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationData node not found in apoptosized`)
  //   /* prettier-ignore */
  //   if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationData node not found in apoptosized`, tx)
  //   return { isValid: false, reason: 'Reported node not found in apoptosized' }
  // }
  // }
  if (tx.timestamp <= 0) {
    /* prettier-ignore */
    nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.timestamp`)
    /* prettier-ignore */
    if (ShardeumFlags.VerboseLogs) console.log('validatePenaltyTX fail tx.timestamp', tx)
    return { isValid: false, reason: 'Duration in tx must be > 0' }
  }
  if (tx.violationType === ViolationType.LeftNetworkEarly && AccountsStorage.cachedNetworkAccount.current.slashing.enableLeftNetworkEarly === false) {
    return { isValid: false, reason: 'LeftNetworkEarly slashing is disabled' }
  }
  if (tx.violationType === ViolationType.SyncingTooLong && AccountsStorage.cachedNetworkAccount.current.slashing.enableSyncTimeout === false) {
    return { isValid: false, reason: 'Sync timeout slashing is disabled' }
  }
  if (tx.violationType === ViolationType.NodeRefuted && AccountsStorage.cachedNetworkAccount.current.slashing.enableNodeRefuted === false) {
    return { isValid: false, reason: 'Refuted node slashing is disabled' }
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
  txId: string,
  txTimestamp: number,
  applyResponse: ShardusTypes.ApplyResponse
): Promise<void> {
  if (ShardeumFlags.VerboseLogs) console.log(`Running applyPenaltyTX`, tx, wrappedStates)
  const isValidRequest = validatePenaltyTX(txId, tx, true)
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

  const { isProcessed, eventTime } = isProcessedPenaltyTx(tx, nodeAccount)
  if (isProcessed) {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Processed penaltyTX: , TxId: ${txId}, reportedNode ${tx.reportedNodePublickKey}, ${{lastPenaltyTime: nodeAccount.nodeAccountStats.lastPenaltyTime, eventTime}}`)
    shardus.applyResponseSetFailed(
      applyResponse,
      `applyPenaltyTX failed isProcessedPenaltyTx reportedNode: ${tx.reportedNodePublickKey}`
    )
    return
  }

  //TODO should we check if it was already penalized?
  const penaltyAmount = getPenaltyForViolation(tx, nodeAccount.stakeLock)
  applyPenalty(nodeAccount, operatorAccount, penaltyAmount)
  nodeAccount.nodeAccountStats.penaltyHistory.push({
    type: tx.violationType,
    amount: penaltyAmount,
    timestamp: eventTime,
  })
  if (tx.violationType === ViolationType.LeftNetworkEarly && nodeAccount.rewardStartTime > 0) {
    nodeAccount.rewardEndTime = (tx.violationData as LeftNetworkEarlyViolationData)?.nodeDroppedTime
    nodeAccount.nodeAccountStats.history.push({
      b: nodeAccount.rewardStartTime,
      e: nodeAccount.rewardEndTime,
    })
    operatorAccount.operatorAccountInfo.operatorStats.history.push({
      b: nodeAccount.rewardStartTime,
      e: nodeAccount.rewardEndTime,
    })
  }

  nodeAccount.timestamp = txTimestamp
  nodeAccount.nodeAccountStats.lastPenaltyTime = eventTime
  operatorAccount.timestamp = txTimestamp

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
    if (WrappedEVMAccountFunctions.isWrappedEVMAccount(operatorAccount)) {
      wrappedChangedOperatorAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(operatorAccount)
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
      tx.reportedNodePublickKey, // nominee
      tx.operatorEVMAddress, // nominator
      txTimestamp,
      txId,
      bigIntToHex(BigInt(0)), // 0 amountSpent,
      undefined,
      penaltyAmount
    )
  }

  /* prettier-ignore */
  nestedCountersInstance.countEvent('shardeum-penalty', `Applied PenaltyTX`)
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Applied PenaltyTX', tx.reportedNodePublickKey)
}
