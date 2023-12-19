import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import config from '../../config'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface RemoveFriend {
  type: 'remove_friend'
  from: string
  to: string
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: RemoveFriend, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.to !== 'string') {
    response.success = false
    response.reason = 'tx "to" field must be a string.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: RemoveFriend, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from] && wrappedStates[tx.from].data
  const to = wrappedStates[tx.to] && wrappedStates[tx.to].data
  if (typeof from === 'undefined' || from === null) {
    response.reason = 'from account does not exist'
    return response
  }
  if (typeof to === 'undefined' || to === null) {
    response.reason = 'To account does not exist'
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
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: RemoveFriend, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  delete from.data.friends[tx.to]
  from.timestamp = txTimestamp
  // from.data.transactions.push({ ...tx, txId })
  dapp.log('Applied remove_friend tx', from)
}

export function keys(tx: RemoveFriend, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.to, config.dao.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw Error('Account must exist in order to send a remove_friend transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
