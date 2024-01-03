import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import {
  IncomingTransactionResult,
  TransactionKeys,
  WrappedResponse,
} from '@shardus/core/dist/shardus/shardus-types'
import { NodeAccount } from '../accounts/nodeAccount'
import { NetworkAccount, WrappedStates } from '../../shardeum/shardeumTypes'
import { Change } from '@shardus/types/build/src/p2p/CycleParserTypes'
import { DaoTx } from '.'

export interface ApplyChangeConfig {
  change: {
    cycle: number
    change: Change
  }
  timestamp: number
}

export class ApplyChangeConfig implements DaoTx<NodeAccount> {
  validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    return response
  }

  validate(_wrappedStates: WrappedStates, response: IncomingTransactionResult): IncomingTransactionResult {
    response.success = true
    response.reason = 'This transaction is valid!'
    return response
  }

  apply(txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
    const network: NetworkAccount = wrappedStates[daoConfig.daoAccount].data
    network.listOfChanges.push(this.change)
    network.timestamp = txTimestamp
    dapp.log(`=== APPLIED CHANGE_CONFIG GLOBAL ${stringify(network)} ===`)
  }

  keys(result: TransactionKeys): TransactionKeys {
    result.targetKeys = [daoConfig.daoAccount]
    result.allKeys = [...result.sourceKeys, ...result.targetKeys]
    return result
  }

  createRelevantAccount(
    dapp: Shardus,
    account: NodeAccount,
    accountId: string,
    accountCreated = false
  ): WrappedResponse {
    if (!account) {
      account = new NodeAccount(accountId)
      accountCreated = true
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }
}
