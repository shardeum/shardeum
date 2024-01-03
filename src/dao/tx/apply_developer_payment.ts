import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import { DeveloperPayment } from '../types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { IncomingTransactionResult, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { DaoTx } from '.'

export interface ApplyDevPayment {
  type: 'apply_dev_payment'
  timestamp: number
  developerFund: DeveloperPayment[]
}

export class ApplyDevPayment implements DaoTx<DaoGlobalAccount> {
  validateFields(this: ApplyDevPayment, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    if (!Array.isArray(this.developerFund)) {
      response.success = false
      response.reason = 'tx "developerFund" field must be an array.'
      throw new Error(response.reason)
    }
    return response
  }

  validate(_wrappedStates: WrappedStates, response: IncomingTransactionResult): IncomingTransactionResult {
    response.success = true
    response.reason = 'This transaction is valid!'
    return response
  }

  apply(this: ApplyDevPayment, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
    network.developerFund = this.developerFund
    network.timestamp = txTimestamp
    dapp.log(`=== APPLIED DEV_PAYMENT GLOBAL ${stringify(network)} ===`)
  }

  keys(result: TransactionKeys): TransactionKeys {
    result.targetKeys = [daoConfig.daoAccount]
    result.allKeys = [...result.sourceKeys, ...result.targetKeys]
    return result
  }

  createRelevantAccount(
    dapp: Shardus,
    account: DaoGlobalAccount,
    accountId: string,
    accountCreated = false
  ): WrappedResponse {
    if (!account) {
      throw new Error('Network Account must already exist for the apply_developer_payment transaction')
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }
}
