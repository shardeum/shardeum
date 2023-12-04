import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import { create } from '../accounts'
import config from '../../config'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { UserAccount } from '../accounts/userAccount'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Verify {
  type: string
  from: string
  code: string
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: Verify, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.code !== 'string') {
    response.success = false
    response.reason = 'tx "code" field must be a string.'
    throw new Error(response.reason)
  }
  if (tx.code.length !== 6) {
    response.success = false
    response.reason = 'tx "code" length must be 6 digits.'
    throw new Error(response.reason)
  }
  if (typeof parseInt(tx.code) !== 'number') {
    response.success = false
    response.reason = 'tx "code" field must be parseable to an integer.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: Verify, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from] && wrappedStates[tx.from].data
  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (typeof from.verified !== 'string') {
    response.reason = 'From account has not been sent a verification email'
    return response
  }
  if (typeof from.verified === 'boolean') {
    response.reason = 'From account has already been verified'
    return response
  }
  if (crypto.hash(tx.code) !== from.verified) {
    response.reason = 'Hash of code in tx does not match the hash of the verification code sent'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: Verify, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[config.dao.networkAccount].data
  from.verified = true
  from.data.balance += network.current.faucetAmount
  from.timestamp = txTimestamp
  dapp.log('Applied verify tx', from)
}

export function keys(tx: Verify, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, tx: Verify, accountCreated = false): WrappedResponse {
  if (!account) {
    account = create.userAccount(accountId, tx.timestamp)
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
