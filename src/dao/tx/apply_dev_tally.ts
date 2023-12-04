import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'
import config from '../../config'
import _ from 'lodash'
import { NetworkAccount } from '../accounts/networkAccount'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { DeveloperPayment, DevWindows } from '../types'

export interface ApplyDevTally {
  type: string
  timestamp: number
  nextDeveloperFund: DeveloperPayment[]
  nextDevWindows: DevWindows
}

export function validateFields(tx: ApplyDevTally, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (!Array.isArray(tx.nextDeveloperFund)) {
    response.success = false
    response.reason = 'tx "nextDeveloperFund" field must be an array.'
    throw new Error(response.reason)
  }
  if (_.isEmpty(tx.nextDevWindows)) {
    response.success = false
    response.reason = 'tx "nextDevWindows" field cannot be an empty object.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: ApplyDevTally, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
  network.nextDeveloperFund = tx.nextDeveloperFund
  network.nextDevWindows = tx.nextDevWindows
  network.timestamp = txTimestamp
  dapp.log(`=== APPLIED DEV_TALLY GLOBAL ${stringify(network)} ===`)
}

export function keys(result: TransactionKeys): TransactionKeys {
  result.targetKeys = [config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: NetworkAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Network Account must already exist for the apply_dev_tally transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
