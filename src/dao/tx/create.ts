import { Shardus, ShardusTypes } from '@shardus/core'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import create from '../accounts'
import { UserAccount } from '../accounts/userAccount'
import { DaoAccounts } from '../types'

export interface Create {
  type: string
  from: string
  to: string
  amount: number
  timestamp: number
}

export function validateFields(tx: Create, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = '"From" must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.to !== 'string') {
    response.success = false
    response.reason = '"To" must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.amount !== 'number') {
    response.success = false
    response.reason = '"Amount" must be a number.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: Create, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const to: DaoAccounts = wrappedStates[tx.to] && wrappedStates[tx.to].data
  if (to === undefined || to === null) {
    response.reason = "target account doesn't exist"
    return response
  }
  if (tx.amount < 1) {
    response.reason = 'create amount needs to be positive (1 or greater)'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: Create, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const to: UserAccount = wrappedStates[tx.to].data
  to.data.balance += tx.amount
  to.timestamp = txTimestamp
  // to.data.transactions.push({ ...tx, txId })
  dapp.log('Applied create tx', to)
}

export function keys(tx: Create, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.to]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, tx: Create, accountCreated = false): WrappedResponse {
  if (!account) {
    account = create.userAccount(accountId, tx.timestamp)
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
