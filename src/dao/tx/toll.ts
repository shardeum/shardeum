import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import * as utils from '../utils'
import config from '../../config'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { NetworkAccount } from '../accounts/networkAccount'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Toll {
  type: string
  from: string
  toll: number
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: Toll, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.toll !== 'number') {
    response.success = false
    response.reason = 'tx "toll" field must be a number.'
    throw new Error(response.reason)
  }
  if (tx.toll < 1) {
    response.success = false
    response.reason = 'Minimum "toll" allowed is 1 token'
    throw new Error(response.reason)
  }
  if (tx.toll > 1000000) {
    response.success = false
    response.reason = 'Maximum toll allowed is 1,000,000 tokens.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: Toll, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from] && wrappedStates[tx.from].data
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (!from) {
    response.reason = 'from account does not exist'
    return response
  }
  if (from.data.balance < network.current.transactionFee) {
    response.reason = 'from account does not have sufficient funds to complete toll transaction'
    return response
  }
  if (!tx.toll) {
    response.reason = 'Toll was not defined in the transaction'
    return response
  }
  if (tx.toll < 1) {
    response.reason = 'Toll must be greater than or equal to 1'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: Toll, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
  from.data.balance -= network.current.transactionFee
  from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)
  from.data.toll = tx.toll
  // from.data.transactions.push({ ...tx, txId })
  from.timestamp = txTimestamp
  dapp.log('Applied toll tx', from)
}

export function keys(tx: Toll, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Account must already exist for the toll transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
