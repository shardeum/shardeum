import { ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { BN, isValidAddress } from 'ethereumjs-util'
import { networkAccount, ONE_SECOND } from '..'
import config from '../config'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  InternalTXType,
  NetworkAccount,
  SetCertTime,
  WrappedEVMAccount,
  WrappedStates,
} from '../shardeum/shardeumTypes'
import * as AccountsStorage from '../storage/accountStorage'
import { fixDeserializedWrappedEVMAccount } from '../shardeum/wrappedEVMAccountFunctions'

export function isSetCertTimeTx(tx: any): boolean {
  if (tx.isInternalTx && tx.internalTXType === InternalTXType.SetCertTime) {
    return true
  }
  return false
}

export async function injectSetCertTimeTx(shardus) {
  let ourNodeId = await shardus.getNodeId()
  let ourNode = await shardus.getNode(ourNodeId)
  let tx = {
    nominee: ourNode.publicKey,
    nominator: '',
    duration: 10,
    timestamp: Date.now(),
  }
  tx = shardus.signAsNode(tx)
  await shardus.put(tx)
}

export function validateSetCertTimeTx(tx: SetCertTime, appData: any): { isValid: boolean; reason: string } {
  if (!isValidAddress(tx.nominee)) {
    return { isValid: false, reason: 'Invalid nominee address' }
  }
  if (!isValidAddress(tx.nominator)) {
    return { isValid: false, reason: 'Invalid nominator address' }
  }
  if (tx.duration <= 0) {
    return { isValid: false, reason: 'Duration in cert tx must be > 0' }
  }
  if (tx.timestamp <= 0) {
    return { isValid: false, reason: 'Duration in cert tx must be > 0' }
  }
  try {
    if (!crypto.verifyObj(tx)) return { isValid: false, reason: 'Invalid signature for SetCertTime tx' }
  } catch (e) {
    return { isValid: false, reason: 'Invalid signature for SetCertTime tx' }
  }

  return { isValid: true, reason: '' }
}

export function validateSetCertTimeState(tx: SetCertTime, wrappedStates: WrappedStates) {
  let committedStake = new BN(0)
  let stakeRequired = new BN(0)

  const operatorEVMAccount: WrappedEVMAccount = wrappedStates[tx.nominator].data
  fixDeserializedWrappedEVMAccount(operatorEVMAccount)
  if (operatorEVMAccount == undefined) {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`setCertTime apply: found no wrapped state for operator account ${tx.nominator}`)
  } else {
    if (operatorEVMAccount && operatorEVMAccount.operatorAccountInfo) {
      committedStake = operatorEVMAccount.operatorAccountInfo.stake
    }
  }

  const minStakeRequired = AccountsStorage.cachedNetworkAccount.current.stakeRequired

  // validate operator stake
  if (committedStake < minStakeRequired) {
    return {
      isValid: false,
      reason: 'Operator has not staked the required amount',
    }
  }
}

export function applySetCertTimeTx(
  shardus,
  tx: SetCertTime,
  wrappedStates: WrappedStates,
  txTimestamp: number,
  applyResponse: ShardusTypes.ApplyResponse
) {
  const isValidRequest = validateSetCertTimeState(tx, wrappedStates)
  if (!isValidRequest.isValid) {
    /* prettier-ignore */ console.log(`Invalid SetCertTimeTx state, operator account ${tx.nominator}, reason: ${isValidRequest.reason}`)
  }
  const operatorAccountAddress = tx.nominator
  const operatorEVMAccount: WrappedEVMAccount = wrappedStates[tx.nominator].data
  operatorEVMAccount.timestamp = txTimestamp
  fixDeserializedWrappedEVMAccount(operatorEVMAccount)

  // Update state
  const serverConfig: any = config.server
  operatorEVMAccount.operatorAccountInfo.certExp = serverConfig.p2p.cycleDuration * ONE_SECOND * tx.duration
  operatorEVMAccount.account.balance = operatorEVMAccount.account.balance.sub(
    new BN(ShardeumFlags.constantTxFee)
  )

  // Apply state
  const txId = crypto.hashObj(tx)
  shardus.applyResponseAddChangedAccount(
    applyResponse,
    operatorAccountAddress,
    operatorAccountAddress,
    txId,
    txTimestamp
  )
}
