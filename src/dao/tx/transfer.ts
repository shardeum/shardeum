import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import * as utils from '../utils'
import { daoConfig } from '../../config/dao'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Transfer {
  type: 'transfer'
  from: string
  to: string
  amount: number
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: Transfer, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
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
  if (typeof tx.amount !== 'number' || tx.amount <= 0) {
    response.success = false
    response.reason = 'tx "amount" field must be a positive number.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: Transfer, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from] && wrappedStates[tx.from].data
  const to = wrappedStates[tx.to] && wrappedStates[tx.to].data
  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (from === undefined || from === null) {
    response.reason = "from account doesn't exist"
    return response
  }
  if (to === undefined || to === null) {
    response.reason = "To account doesn't exist"
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: Transfer, txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from = wrappedStates[tx.from].data
  const to: UserAccount = wrappedStates[tx.to].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)
  to.data.balance += tx.amount
  from.data.transactions.push({ ...tx, txId })
  to.data.transactions.push({ ...tx, txId })
  from.timestamp = txTimestamp
  to.timestamp = txTimestamp
  dapp.log('Applied transfer tx', from, to)
}

export function keys(tx: Transfer, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.to, daoConfig.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw Error('Account must exist in order to send a transfer transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
