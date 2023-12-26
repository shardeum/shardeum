/**
  * TODO: per discussion with Andrew, we will likely not port snapshots over as they are no longer used
  */

import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'

export interface SnapshotClaim {
  type: 'snapshot_claim'
  from: string
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: SnapshotClaim, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: SnapshotClaim, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from: UserAccount = wrappedStates[tx.from] && wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount] && wrappedStates[daoConfig.daoAccount].data
  if (from === undefined || from === null) {
    response.reason = "from account doesn't exist"
    return response
  }
  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (from.claimedSnapshot) {
    response.reason = 'Already claimed tokens from the snapshot'
    return response
  }
  if (!network) {
    response.reason = 'Snapshot account does not exist yet, OR wrong snapshot address provided in the "to" field'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: SnapshotClaim, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  from.claimedSnapshot = true
  from.timestamp = txTimestamp
  network.timestamp = txTimestamp
  dapp.log('Applied snapshot_claim tx', from, network)
}

export function keys(tx: SnapshotClaim, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [daoConfig.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Account must already exist for the snapshot_claim transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
