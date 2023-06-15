import { nestedCountersInstance, ShardusTypes } from '@shardus/core'
import { AccountType, InternalTXType, isNodeAccount2, NodeAccount2, PenaltyTX, WrappedEVMAccount, WrappedStates } from '../../shardeum/shardeumTypes'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { crypto, hashSignedObj } from '../../setup/helpers'
import { createInternalTxReceipt, getApplyTXState } from '../..'
import { toShardusAddress } from '../../shardeum/evmAddress'
import { getPenaltyForViolation } from './violation'
import * as WrappedEVMAccountFunctions from '../../shardeum/wrappedEVMAccountFunctions'
import { _base16BNParser, _readableSHM } from '../../utils'
import { Address } from 'ethereumjs-util'

export async function injectPenaltyTX(
  shardus,
  eventData: ShardusTypes.ShardusEvent,
): Promise<{
  success: boolean
  reason: string
  status: number
}> {
  let tx = {
    reportedNode: eventData.publicKey,
    timestamp: Date.now(),
    penalizedNodeId: eventData.nodeId,
    penaltyTime: eventData.time,
    isInternalTx: true,
    internalTXType: InternalTXType.Penalty,
  }

  tx = shardus.signAsNode(tx)
  if (ShardeumFlags.VerboseLogs) {
    const txid = hashSignedObj(tx)
    console.log(`injectPenaltyTX: tx.timestamp: ${tx.timestamp} txid: ${txid}`, tx)
  }

  return await shardus.put(tx)
}

export function validatePenaltyTX(tx: PenaltyTX): { isValid: boolean; reason: string } {
  if (!tx.reportedNode || tx.reportedNode === '' || tx.reportedNode.length !== 64) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.reportedNode address invalid`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.reportedNode address invalid`, tx)
    return { isValid: false, reason: 'Invalid reportedNode address' }
  }
  if (tx.violationType < 1000 || tx.violationType >1002) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationType not in range`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationType not in range`, tx)
    return { isValid: false, reason: 'Invalid Violation type ' }
  }
  if (!tx.violationData) {
    //TODO validate violation data using violation types
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.violationData invalid`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validatePenaltyTX fail tx.violationData invalid`, tx)
    return { isValid: false, reason: 'Invalid Violation data ' }
  }
  if (tx.timestamp <= 0) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail tx.timestamp`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validatePenaltyTX fail tx.timestamp', tx)
    return { isValid: false, reason: 'Duration in tx must be > 0' }
  }
  try {
    if (!crypto.verifyObj(tx)) {
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail Invalid signature`)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validatePenaltyTX fail Invalid signature', tx)
      return { isValid: false, reason: 'Invalid signature for Penalty tx' }
    }
  } catch (e) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-penalty', `validatePenaltyTX fail Invalid signature exception`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validatePenaltyTX fail Invalid signature exception', tx)
    return { isValid: false, reason: 'Invalid signature for Penalty tx' }
  }
  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validatePenaltyTX success', tx)
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
    const isValidRequest = validatePenaltyTX(tx)
    if (!isValidRequest) {
      /* prettier-ignore */
      console.log(`Invalid penaltyTX, reportedNode ${tx.reportedNode}, reason: ${isValidRequest.reason}`)
      nestedCountersInstance.countEvent('shardeum-penalty', `applyPenaltyTX fail `)
      shardus.applyResponseSetFailed(
        applyResponse,
        `applyPenaltyTX failed validatePenaltyTX reportedNode: ${tx.reportedNode} reason: ${isValidRequest.reason}`
      )
      return
    }

    const reportedNodeShardusAddress = toShardusAddress(tx.reportedNode, AccountType.Account)
    /* eslint-disable security/detect-object-injection */
    let nodeAccount: NodeAccount2
    if (isNodeAccount2(wrappedStates[tx.reportedNode].data)) {
      nodeAccount = wrappedStates[tx.reportedNode].data as NodeAccount2
    }
    let operatorAccount: WrappedEVMAccount
    if (WrappedEVMAccountFunctions.isWrappedEVMAccount(wrappedStates[reportedNodeShardusAddress].data)) {
      operatorAccount = wrappedStates[reportedNodeShardusAddress].data as WrappedEVMAccount
    }

    //TODO should we check if it was already penalized?
    nodeAccount.penalty = getPenaltyForViolation(tx)

    // update the node account historical stats
    nodeAccount.nodeAccountStats.totalPenalty = _base16BNParser(nodeAccount.nodeAccountStats.totalPenalty).add(
      nodeAccount.penalty
    )

    const txId = hashSignedObj(tx)
    const shardeumState = getApplyTXState(txId)
    shardeumState._transactionState.appData = {}

    // update the operator historical stats
    operatorAccount.operatorAccountInfo.operatorStats.history.push({
      b: nodeAccount.rewardStartTime,
      e: nodeAccount.rewardEndTime,
    })
    operatorAccount.operatorAccountInfo.operatorStats.totalNodePenalty = _base16BNParser(
      operatorAccount.operatorAccountInfo.operatorStats.totalNodePenalty
    ).add(nodeAccount.penalty)


    // hmm may be we don't need this as we are not updating nonce and balance
    const operatorEVMAddress: Address = Address.fromString(tx.reportedNode)
    await shardeumState.checkpoint()
    await shardeumState.putAccount(operatorEVMAddress, operatorAccount.account)
    await shardeumState.commit()

    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log( `Calculating node penalty. nodePenaltyAmount: ${_readableSHM(nodeAccount.penalty)}` )

    //TODO should we check for existing funds?

    if (ShardeumFlags.useAccountWrites) {
      let wrappedChangedNodeAccount: ShardusTypes.WrappedData
      if (WrappedEVMAccountFunctions.isInternalAccount(nodeAccount)) {
        wrappedChangedNodeAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(nodeAccount)
      }
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        tx.reportedNode,
        wrappedChangedNodeAccount,
        txId,
        txTimestamp
      )

      let wrappedChangedOperatorAccount: ShardusTypes.WrappedData
      /* eslint-disable security/detect-object-injection */
      if (WrappedEVMAccountFunctions.isWrappedEVMAccount(wrappedStates[reportedNodeShardusAddress].data)) {
        wrappedChangedOperatorAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
          wrappedStates[reportedNodeShardusAddress].data as WrappedEVMAccount
        )
      }
      /* eslint-enable security/detect-object-injection */
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        reportedNodeShardusAddress,
        wrappedChangedOperatorAccount,
        txId,
        txTimestamp
      )
    }

    if (ShardeumFlags.supportInternalTxReceipt) {
      createInternalTxReceipt(shardus, applyResponse, tx, tx.reportedNode, tx.reportedNode, txTimestamp, txId)
    }

    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-penalty', `Applied PenaltyTX`)
    console.log('Applied PenaltyTX', tx.reportedNode)
  }

