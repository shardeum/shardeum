import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'

import _ from 'lodash'
import config from '../../config'
import { NetworkAccount } from '../accounts/networkAccount'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { NetworkParameters, Windows } from '../types'

export interface ApplyTally {
  type: string
  timestamp: number
  next: NetworkParameters
  nextWindows: Windows
}

export function validate_fields(tx: ApplyTally, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
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
  if (typeof tx.next.nodeRewardAmount !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter nodeRewardAmount" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.nodePenalty !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter nodePenalty" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.transactionFee !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter transactionFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.stakeRequired !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter stakeRequired" field must be a number.'
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
  if (typeof tx.next.proposalFee !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter proposalFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.devProposalFee !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter devProposalFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.faucetAmount !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter faucetAmount" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.next.transactionFee !== 'number') {
    response.success = false
    response.reason = 'tx "next parameter defaultToll" field must be a number.'
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
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
  network.next = tx.next
  network.nextWindows = tx.nextWindows
  network.timestamp = txTimestamp
  dapp.log(`APPLIED TALLY GLOBAL ${stringify(network)} ===`)
}

export function keys(result: TransactionKeys): TransactionKeys {
  result.targetKeys = [config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: NetworkAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Network Account must already exist for the apply_tally transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
