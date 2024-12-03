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
import {verifyPayload} from '../../types/ajv/Helpers';
import {AJVSchemaEnum} from '../../types/enum/AJVSchemaEnum';

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
  const errors = verifyPayload(AJVSchemaEnum.PenaltyTx, tx)
  if (errors != null) {
    nestedCountersInstance.countEvent('external', 'ajv-failed-penalty-tx')
    return { isValid: false, reason: 'Invalid penalty tx' }
  }
  // this check should happen only for exe nodes applying the penalty tx
  if (isApply) {
    // check if we have this penalty tx stored in the Map
    const preRecordedfPenaltyTX = penaltyTxsMap.get(txId)

    if (preRecordedfPenaltyTX == null) {
      return { isValid: false, reason: 'Penalty TX not found in penaltyTxsMap of exe node' }
    }
  }

  if (tx.violationType === ViolationType.LeftNetworkEarly && AccountsStorage.cachedNetworkAccount.current.slashing.enableLeftNetworkEarlySlashing === false) {
    return { isValid: false, reason: 'LeftNetworkEarly slashing is disabled' }
  }
  if (tx.violationType === ViolationType.SyncingTooLong && AccountsStorage.cachedNetworkAccount.current.slashing.enableSyncTimeoutSlashing === false) {
    return { isValid: false, reason: 'Sync timeout slashing is disabled' }
  }
  if (tx.violationType === ViolationType.NodeRefuted && AccountsStorage.cachedNetworkAccount.current.slashing.enableNodeRefutedSlashing === false) {
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

function initNodeBehaviorStats(nodeAccount: NodeAccount2): void {
  if (!nodeAccount.behaviorStats) {
    nodeAccount.behaviorStats = {
      lostCount: 0,
      refuteCount: 0,
      lastLostTime: 0,
      lastRefuteTime: 0,
      oscillationCount: 0,
      lastOscillationTime: 0,
      consecutiveLostRefutes: 0
    };
  }
}

function shouldRemoveNode(nodeAccount: NodeAccount2): boolean {
  const stats = nodeAccount.behaviorStats;
  if (!stats) return false;

  // Remove if too many oscillations
  if (stats.oscillationCount >= 5) {
    return true;
  }

  // Remove if too many lost statuses in a short time
  const recentLostCount = stats.lostCount;
  if (recentLostCount >= 10) {
    return true;
  }

  // Remove if showing persistent unstable behavior
  if (stats.consecutiveLostRefutes >= 9) { // 3 complete oscillation cycles
    return true;
  }

  return false;
}

function isRateLimited(nodeAccount: NodeAccount2, txTimestamp: number): boolean {
  const stats = nodeAccount.behaviorStats;
  if (!stats) return false;

  // Rate limit based on recent activity
  const timeSinceLastLost = txTimestamp - stats.lastLostTime;
  const timeSinceLastRefute = txTimestamp - stats.lastRefuteTime;

  // Minimum time between lost reports increases with violation count
  const minTimeBetweenLost = Math.min(300000 * (1 + stats.lostCount), 3600000); // 5min base, up to 1hr
  if (timeSinceLastLost < minTimeBetweenLost) {
    return true;
  }

  // Minimum time between refutes increases with violation count
  const minTimeBetweenRefutes = Math.min(300000 * (1 + stats.refuteCount), 3600000); // 5min base, up to 1hr
  if (timeSinceLastRefute < minTimeBetweenRefutes) {
    return true;
  }

  return false;
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

  // Check rate limiting before processing
  if (isRateLimited(nodeAccount, txTimestamp)) {
    if (logFlags.dapp_verbose) console.log(
      `Rate limited penalty TX for node ${nodeAccount.id}`,
      {
        lastLostTime: nodeAccount.behaviorStats?.lastLostTime,
        lastRefuteTime: nodeAccount.behaviorStats?.lastRefuteTime,
        txTimestamp
      }
    )
    shardus.applyResponseSetFailed(
      applyResponse,
      `Rate limited penalty TX for node ${nodeAccount.id}`
    )
    return
  }

  // Initialize behavior stats if they don't exist
  initNodeBehaviorStats(nodeAccount)

  // Update behavior stats based on violation type
  if (tx.violationType === ViolationType.LeftNetworkEarly || tx.violationType === ViolationType.SyncingTooLong) {
    nodeAccount.behaviorStats.lostCount++
    nodeAccount.behaviorStats.lastLostTime = txTimestamp
    nodeAccount.behaviorStats.consecutiveLostRefutes++
  } else if (tx.violationType === ViolationType.NodeRefuted) {
    nodeAccount.behaviorStats.refuteCount++
    nodeAccount.behaviorStats.lastRefuteTime = txTimestamp
    nodeAccount.behaviorStats.consecutiveLostRefutes++
  }

  // Always apply the penalty first
  const penalty = getPenaltyForViolation(tx, nodeAccount.stakeLock, nodeAccount)
  applyPenalty(nodeAccount, operatorAccount, penalty)

  // Then check if we should also remove the node
  if (shouldRemoveNode(nodeAccount)) {
    // Get the 5 closest nodes to this node
    const closestNodes = shardus.getClosestNodes(nodeAccount.id, 5)
    const ourId = shardus.getNodeId()
    
    // Only proceed if we're one of the closest nodes
    if (closestNodes.includes(ourId)) {
      // Create removal certificate that needs to be signed by multiple nodes
      const unsignedCertificate = {
        nodePublicKey: nodeAccount.id,
        cycle: shardus.getCurrentCycle().counter,
        reason: 'Node removed due to excessive violations',
        timestamp: txTimestamp
      }

      // Get signatures from closest nodes (4 out of 5 required)
      const { success, signatures } = await shardus.getAppDataSignatures(
        'node-removal',
        crypto.hash(JSON.stringify(unsignedCertificate)), // Hash the stringified certificate
        4, // required signatures
        unsignedCertificate,
        1 // allow 1 backup node in case one is down
      )

      if (success) {
        // Create the complete removal certificate with signatures
        const removalCertificate = {
          ...unsignedCertificate,
          signs: signatures
        }

        // Emit the removal event with proper certificate
        shardus.emit('remove-by-app', removalCertificate)
        
        // Clear node data after penalty is applied and removal is authorized
        nodeAccount.nominator = null
        nodeAccount.stakeLock = BigInt(0)
        nodeAccount.penalty = BigInt(0)
        nodeAccount.rewardStartTime = 0
        nodeAccount.rewardEndTime = 0
        nodeAccount.behaviorStats = null

        if (logFlags.dapp_verbose) console.log(`Node ${nodeAccount.id} removed from network due to excessive violations`)
      } else {
        if (logFlags.dapp_verbose) console.log(`Failed to get consensus for removing node ${nodeAccount.id}`)
      }
    }
  }

  nodeAccount.nodeAccountStats.lastPenaltyTime = eventTime
  nodeAccount.timestamp = txTimestamp
  operatorAccount.timestamp = txTimestamp

  // Record the transaction
  recordPenaltyTX(txId, tx)

  const shardeumState = getApplyTXState(txId)
  shardeumState._transactionState.appData = {}

  const operatorEVMAddress: Address = Address.fromString(tx.operatorEVMAddress)
  await shardeumState.checkpoint()
  await shardeumState.putAccount(operatorEVMAddress, operatorAccount.account)
  await shardeumState.commit()

  /* prettier-ignore */
  if (ShardeumFlags.VerboseLogs) console.log(`Calculating updated node penalty. nodePenaltyAmount: ${_readableSHM(nodeAccount.penalty)}`)

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
      bigIntToHex(BigInt(0)), // 0 amountSpent
      undefined,
      penalty
    )
  }

  /* prettier-ignore */
  nestedCountersInstance.countEvent('shardeum-penalty', `Applied PenaltyTX`)
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Applied PenaltyTX', tx.reportedNodePublickKey)

  initNodeBehaviorStats(nodeAccount);
  
  // Update behavior stats based on violation type
  if (tx.violationType === ViolationType.NodeRefuted) {
    nodeAccount.behaviorStats.refuteCount++;
    nodeAccount.behaviorStats.lastRefuteTime = txTimestamp;
    
    // Check for oscillation pattern
    const timeSinceLastLost = txTimestamp - nodeAccount.behaviorStats.lastLostTime;
    if (timeSinceLastLost < 3600000) { // Within 1 hour
      nodeAccount.behaviorStats.consecutiveLostRefutes++;
      
      // Every 3 quick lost-refute cycles counts as an oscillation
      if (nodeAccount.behaviorStats.consecutiveLostRefutes >= 3) {
        nodeAccount.behaviorStats.oscillationCount++;
        nodeAccount.behaviorStats.lastOscillationTime = txTimestamp;
        nodeAccount.behaviorStats.consecutiveLostRefutes = 0;
      }
    } else {
      nodeAccount.behaviorStats.consecutiveLostRefutes = 1;
    }
  } else if (tx.violationType === ViolationType.LeftNetworkEarly) {
    nodeAccount.behaviorStats.lostCount++;
    nodeAccount.behaviorStats.lastLostTime = txTimestamp;
  }

  // Check if node should be removed
  if (shouldRemoveNode(nodeAccount)) {
    // Set stake to 0 to force removal
    nodeAccount.stakeLock = BigInt(0);
    nodeAccount.penalty = nodeAccount.stakeLock;
    
    // Log the removal
    if (logFlags.dapp_verbose) console.log(
      `Node ${nodeAccount.id} automatically removed due to persistent bad behavior:`,
      `oscillations=${nodeAccount.behaviorStats.oscillationCount}`,
      `lostCount=${nodeAccount.behaviorStats.lostCount}`,
      `consecutiveLostRefutes=${nodeAccount.behaviorStats.consecutiveLostRefutes}`
    );
  }
}
