import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'
import config from '../../config'
import { create } from '../accounts'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { NodeAccount } from '../accounts/nodeAccount'

export interface InitNetwork {
  type: 'init_network'
  timestamp: number
}

export function validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  return response
}

export function validate(wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[config.dao.networkAccount].data

  if (network.id !== config.dao.networkAccount) {
    response.reason = "Network account Id doesn't match the configuration"
    return response
  }

  response.success = true
  response.reason = 'This transaction is valid'
  return response
}

export function apply(txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const network: DaoGlobalAccount = wrappedStates[config.dao.networkAccount].data
  network.timestamp = txTimestamp
  console.log(`init_network NETWORK_ACCOUNT: ${stringify(network)}`)
  // from.timestamp = txTimestamp
  dapp.log('Applied init_network transaction', network)
}

export function keys(result: TransactionKeys): TransactionKeys {
  // result.sourceKeys = [tx.from]
  result.targetKeys = [config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: NodeAccount | DaoGlobalAccount, accountId: string, tx: InitNetwork, accountCreated = false): WrappedResponse {
  if (!account) {
    if (accountId === config.dao.networkAccount) {
      account = create.createDaoGlobalAccount(accountId, tx.timestamp)
    } else {
      account = create.nodeAccount(accountId)
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
