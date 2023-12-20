import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import config from '../../config'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { UserAccount } from '../accounts/userAccount'

export interface RemoveStakeRequest {
  type: 'remove_stake_request'
  from: string
  stake: number
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: RemoveStakeRequest, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.stake !== 'number') {
    response.success = false
    response.reason = 'tx "stake" field must be a number.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: RemoveStakeRequest, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from]?.data
  const network: DaoGlobalAccount = wrappedStates[config.dao.daoAccount].data
  if (from == null) {
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
  if (from.data.stake < network.current.stakeRequiredUsd) {
    response.reason = `From account has insufficient stake ${network.current.stakeRequiredUsd}`
    return response
  }
  if (tx.stake > network.current.stakeRequiredUsd) {
    response.reason = `Stake amount sent: ${tx.stake} is more than the cost required to operate a node: ${network.current.stakeRequiredUsd}`
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: RemoveStakeRequest, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  from.data.remove_stake_request = Date.now()
  dapp.log('Applied remove_stake tx marked as requested', from)
}

export function keys(tx: RemoveStakeRequest, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [config.dao.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Account must already exist for the remove_stake_request transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
