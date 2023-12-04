import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import config from '../../config'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface RemoveStake {
  type: string
  from: string
  stake: number
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: RemoveStake, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
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

export function validate(tx: RemoveStake, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from]?.data
  const network: DaoGlobalAccount = wrappedStates[config.dao.networkAccount].data
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
  if (from.data.stake < network.current.stakeRequired) {
    response.reason = `From account has insufficient stake ${network.current.stakeRequired}`
    return response
  }
  if (!from.data.remove_stake_request) {
    response.reason = `Request is not active to remove stake.`
    return response
  }
  if (tx.stake > network.current.stakeRequired) {
    response.reason = `Stake amount sent: ${tx.stake} is more than the cost required to operate a node: ${network.current.stakeRequired}`
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: RemoveStake, txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[config.dao.networkAccount].data
  const shouldRemoveState = from.data.remove_stake_request && from.data.remove_stake_request + 2 * network.current.nodeRewardInterval <= Date.now()
  if (shouldRemoveState) {
    from.data.balance += network.current.stakeRequired
    from.data.stake = 0
    from.timestamp = txTimestamp
    from.data.remove_stake_request = null
    from.data.transactions.push({ ...tx, txId })
    dapp.log('Applied remove_stake tx', from)
  } else {
    dapp.log('Cancelled remove_stake tx because `remove_stake_request` is null or earlier than 2 * nodeRewardInterval', from)
  }
  dapp.log('Applied remove_stake tx marked as requested', from)
}

export function keys(tx: RemoveStake, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Account must already exist for the remove_stake transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
