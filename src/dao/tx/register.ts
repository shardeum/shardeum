import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import { create } from '../accounts'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { UserAccount } from '../accounts/userAccount'
import { AliasAccount } from '../accounts/aliasAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Register {
  type: 'register'
  aliasHash: string
  from: string
  alias: string
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(
  tx: Register,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.aliasHash !== 'string') {
    response.success = false
    response.reason = 'tx "aliasHash" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.alias !== 'string') {
    response.success = false
    response.reason = 'tx "alias" field must be a string.'
    throw new Error(response.reason)
  }
  if (tx.alias.length > 20) {
    response.success = false
    response.reason = 'tx "alias" field must be less than 21 characters (20 max)'
    throw new Error(response.reason)
  }
  if (/[^A-Za-z0-9]+/g.test(tx.alias)) {
    response.success = false
    response.reason = 'tx "alias" field may only contain alphanumeric characters'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: Register,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const from: UserAccount = wrappedStates[tx.from] && wrappedStates[tx.from].data
  const alias: AliasAccount = wrappedStates[tx.aliasHash] && wrappedStates[tx.aliasHash].data
  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (!alias) {
    response.reason = 'Alias account was not found for some reason'
    return response
  }
  if (from.alias !== null) {
    response.reason = 'User has already registered an alias'
    return response
  }
  if (alias.inbox === tx.alias) {
    response.reason = 'This alias is already taken'
    return response
  }
  if (/[^A-Za-z0-9]+/g.test(tx.alias)) {
    response.reason = 'Alias may only contain alphanumeric characters'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: Register, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const alias: AliasAccount = wrappedStates[tx.aliasHash].data
  // from.data.balance -= network.current.transactionFee
  // from.data.balance -= maintenanceAmount(txTimestamp, from)
  alias.inbox = tx.alias
  from.alias = tx.alias
  alias.address = tx.from
  // from.data.transactions.push({ ...tx, txId })
  alias.timestamp = txTimestamp
  from.timestamp = txTimestamp
  dapp.log('Applied register tx', from, alias)
}

export function keys(tx: Register, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.aliasHash]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: UserAccount | AliasAccount,
  accountId: string,
  tx: Register,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    if (accountId === tx.aliasHash) {
      account = create.aliasAccount(accountId)
    } else {
      account = new UserAccount(accountId, tx.timestamp)
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
