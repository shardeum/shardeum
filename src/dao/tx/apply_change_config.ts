import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'
import { create } from '../accounts'
import config from '../../config'
import { TransactionKeys, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { NodeAccount } from '../accounts/nodeAccount'
import { NetworkAccount, WrappedStates } from '../../shardeum/shardeumTypes'
import { Change } from '@shardus/types/build/src/p2p/CycleParserTypes'

export interface ApplyChangeConfig {
  type: 'apply_change_config'
  change: {
    cycle: number
    change: Change
  }
  timestamp: number
}

export function validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  return response
}

export function validate(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: ApplyChangeConfig, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const network: NetworkAccount = wrappedStates[config.dao.daoAccount].data
  network.listOfChanges.push(tx.change)
  network.timestamp = txTimestamp
  dapp.log(`=== APPLIED CHANGE_CONFIG GLOBAL ${stringify(network)} ===`)
}

export function keys(result: TransactionKeys): TransactionKeys {
  result.targetKeys = [config.dao.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: NodeAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    account = create.nodeAccount(accountId)
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
