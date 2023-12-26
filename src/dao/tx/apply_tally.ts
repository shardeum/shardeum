import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'

import _ from 'lodash'
import { daoConfig } from '../../config/dao'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { NetworkParameters, TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { Windows } from '../types'

export interface ApplyTally {
  type: 'apply_tally'
  timestamp: number
  next: NetworkParameters
  nextWindows: Windows
}

export function validateFields(tx: ApplyTally, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (_.isEmpty(tx.next) || typeof tx.next !== 'object') {
    response.success = false
    response.reason = 'tx "next" field must be a non empty object'
    throw new Error(response.reason)
  }
  if (_.isEmpty(tx.nextWindows) || typeof tx.nextWindows !== 'object') {
    response.success = false
    response.reason = 'tx "nextWindows" field must be a non empty object'
    throw new Error(response.reason)
  }
  if (typeof tx.next.title !== 'string') {
    response.success = false
    response.reason = 'tx "next parameter title" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.description !== 'string') {
    response.success = false
    response.reason = 'tx "next parameter description" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.nodeRewardInterval !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter nodeRewardInterval" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.nodeRewardAmountUsd !== 'bigint') {
    response.success = false
    response.reason = 'tx "next parameter nodeRewardAmountUsd" field must be a bigint.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.nodePenaltyUsd !== 'bigint') {
    response.success = false
    response.reason = 'tx "next parameter nodePenaltyUsd" field must be a bigint.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.stakeRequiredUsd !== 'bigint') {
    response.success = false
    response.reason = 'tx "next parameter stakeRequiredUsd" field must be a bigint.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.maintenanceInterval !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter maintenanceInterval" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.maintenanceFee !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter maintenanceFee" field must be a number.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: ApplyTally, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  network.next = tx.next
  network.nextWindows = tx.nextWindows
  network.timestamp = txTimestamp
  dapp.log(`APPLIED TALLY GLOBAL ${stringify(network)} ===`)
}

export function keys(result: TransactionKeys): TransactionKeys {
  result.targetKeys = [daoConfig.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: DaoGlobalAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Network Account must already exist for the apply_tally transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
