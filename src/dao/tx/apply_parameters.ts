import stringify from 'fast-stable-stringify'
import _ from 'lodash'
import { Shardus, ShardusTypes } from '@shardus/core'
import config from '../../config'
import { TransactionKeys, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { WrappedStates } from '@shardus/core/dist/state-manager/state-manager-types'
import { NetworkParameters, Windows } from '../types'

export interface ApplyParameters {
  type: 'apply_parameters'
  timestamp: number
  current: NetworkParameters
  next: Record<string, never>
  windows: Windows
  nextWindows: Record<string, never>
  issue: number
}

export function validateFields(tx: ApplyParameters, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (_.isEmpty(tx.current) || typeof tx.current !== 'object') {
    response.success = false
    response.reason = 'tx "current" field must not be a non empty object'
    throw new Error(response.reason)
  }
  if (typeof tx.current.title !== 'string') {
    response.success = false
    response.reason = 'tx "current parameter title" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.description !== 'string') {
    response.success = false
    response.reason = 'tx "current parameter description" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.nodeRewardInterval !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter nodeRewardInterval" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.nodeRewardAmount !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter nodeRewardAmount" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.nodePenalty !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter nodePenalty" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.transactionFee !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter transactionFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.stakeRequired !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter stakeRequired" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.maintenanceInterval !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter maintenanceInterval" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.maintenanceFee !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter maintenanceFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.proposalFee !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter proposalFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.devProposalFee !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter devProposalFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.faucetAmount !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter faucetAmount" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.current.transactionFee !== 'number') {
    response.success = false
    response.reason = 'tx "current parameter defaultToll" field must be a number.'
    throw new Error(response.reason)
  }
  if (!_.isEmpty(tx.next) || typeof tx.next !== 'object') {
    response.success = false
    response.reason = 'tx "next" field must be an empty object.'
    throw new Error(response.reason)
  }
  if (_.isEmpty(tx.windows) || typeof tx.windows !== 'object') {
    response.success = false
    response.reason = 'tx "windows" field must be a non empty object.'
    throw new Error(response.reason)
  }
  if (!_.isEmpty(tx.nextWindows)) {
    response.success = false
    response.reason = 'tx "nextWindows" field must be an empty object.'
    throw new Error(response.reason)
  }
  if (typeof tx.issue !== 'number') {
    response.success = false
    response.reason = 'tx "issue" field must be a number.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: ApplyParameters, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const network = wrappedStates[config.dao.daoAccount].data as DaoGlobalAccount
  network.current = tx.current
  network.next = tx.next
  network.windows = tx.windows
  network.nextWindows = tx.nextWindows
  network.issue = tx.issue
  network.timestamp = txTimestamp
  dapp.log(`=== APPLIED PARAMETERS GLOBAL ${stringify(network)} ===`)
}

export function keys(result: TransactionKeys): TransactionKeys {
  result.targetKeys = [config.dao.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: DaoGlobalAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Network Account must already exist for the apply_parameters transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
