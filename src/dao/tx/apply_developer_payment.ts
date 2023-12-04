import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'
import config from '../../config'
import { DeveloperPayment } from '../types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface ApplyDevPayment {
  type: 'apply_dev_payment'
  timestamp: number
  developerFund: DeveloperPayment[]
}

export function validateFields(tx: ApplyDevPayment, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (!Array.isArray(tx.developerFund)) {
    response.success = false
    response.reason = 'tx "developerFund" field must be an array.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: ApplyDevPayment, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const network: DaoGlobalAccount = wrappedStates[config.dao.networkAccount].data
  network.developerFund = tx.developerFund
  network.timestamp = txTimestamp
  dapp.log(`=== APPLIED DEV_PAYMENT GLOBAL ${stringify(network)} ===`)
}

export function keys(result: TransactionKeys): TransactionKeys {
  result.targetKeys = [config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: DaoGlobalAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Network Account must already exist for the apply_developer_payment transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
