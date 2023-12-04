import _ from 'lodash';
import { Shardus, ShardusTypes } from '@shardus/core'
import config from '../../config'
import stringify from 'fast-stable-stringify'
import { DeveloperPayment, DevWindows } from '../types';
import { NetworkAccount } from '../accounts/networkAccount';
import { TransactionKeys, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types';
import { WrappedStates } from '@shardus/core/dist/state-manager/state-manager-types';

export interface ApplyDevParameters {
  type: string
  timestamp: number
  devWindows: DevWindows
  nextDevWindows: Record<string, never>
  developerFund: DeveloperPayment[]
  nextDeveloperFund: DeveloperPayment[]
  devIssue: number
}

export function validateFields(tx: ApplyDevParameters, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.devIssue !== 'number') {
    response.success = false
    response.reason = 'tx "devIssue" field must be a number.'
    throw new Error(response.reason)
  }
  if (_.isEmpty(tx.devWindows)) {
    response.success = false
    response.reason = 'tx "devWindows" field must not be empty.'
    throw new Error(response.reason)
  }
  if (!_.isEmpty(tx.nextDevWindows)) {
    response.success = false
    response.reason = 'tx "nextDevWindows" field must be an empty object.'
    throw new Error(response.reason)
  }
  if (!Array.isArray(tx.developerFund)) {
    response.success = false
    response.reason = 'tx "developerFund" field must be an array.'
    throw new Error(response.reason)
  }
  if (!_.isEmpty(tx.nextDeveloperFund) || !Array.isArray(tx.nextDeveloperFund)) {
    response.success = false
    response.reason = 'tx "nextDeveloperFund" field must be an empty array.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: ApplyDevParameters, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data as NetworkAccount
  network.devWindows = tx.devWindows
  network.nextDevWindows = tx.nextDevWindows
  network.developerFund = tx.developerFund
  network.nextDeveloperFund = tx.nextDeveloperFund
  network.devIssue = tx.devIssue
  network.timestamp = txTimestamp
  dapp.log(`=== APPLIED DEV_PARAMETERS GLOBAL ${stringify(network)} ===`)
}

export function keys(tx: ApplyDevParameters, result: TransactionKeys): ShardusTypes.TransactionKeys {
  result.targetKeys = [config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: NetworkAccount, accountId: string, tx: ApplyDevParameters, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Network Account must already exist for the apply_dev_parameters transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
