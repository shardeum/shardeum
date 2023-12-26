import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import * as utils from '../utils'
import { daoConfig } from '../../config/dao'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Friend {
  type: 'friend'
  alias: string
  from: string
  to: string
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: Friend, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
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
  if (typeof tx.alias !== 'string') {
    response.success = false
    response.reason = 'tx "alias" field must be a string.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: Friend, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from] && wrappedStates[tx.from].data // type `DaoAccounts`
  if (typeof from === 'undefined' || from === null) {
    response.reason = 'from account does not exist'
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

export function apply(tx: Friend, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)
  from.data.friends[tx.to] = tx.alias
  from.timestamp = txTimestamp
  dapp.log('Applied friend tx', from)
}

export function keys(tx: Friend, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [daoConfig.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw Error('Account must exist in order to send a friend transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
