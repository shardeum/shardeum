import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import _ from 'lodash'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { IncomingTransactionResult, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { DeveloperPayment, DevWindows } from '../types'
import { DaoTx } from '.'

export interface IApplyDevTally {
  type: 'apply_dev_tally'
  timestamp: number
  nextDeveloperFund: DeveloperPayment[]
  nextDevWindows: DevWindows
}

export class ApplyDevTally implements IApplyDevTally, DaoTx<DaoGlobalAccount> {
  readonly type = 'apply_dev_tally'
  timestamp: number
  nextDeveloperFund: DeveloperPayment[]
  nextDevWindows: DevWindows

  constructor(data: IApplyDevTally) {
    this.timestamp = data.timestamp
    this.nextDeveloperFund = data.nextDeveloperFund
    this.nextDevWindows = data.nextDevWindows
  }

  validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    if (!Array.isArray(this.nextDeveloperFund)) {
      response.success = false
      response.reason = 'tx "nextDeveloperFund" field must be an array.'
      throw new Error(response.reason)
    }
    if (_.isEmpty(this.nextDevWindows)) {
      response.success = false
      response.reason = 'tx "nextDevWindows" field cannot be an empty object.'
      throw new Error(response.reason)
    }
    return response
  }

  validate(_wrappedStates: WrappedStates, response: IncomingTransactionResult): IncomingTransactionResult {
    response.success = true
    response.reason = 'This transaction is valid!'
    return response
  }

  apply(txTimestamp: number, _txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    network.nextDeveloperFund = this.nextDeveloperFund
    network.nextDevWindows = this.nextDevWindows
    network.timestamp = txTimestamp
    dapp.log(`=== APPLIED DEV_TALLY GLOBAL ${stringify(network)} ===`)
  }

  keys(result: TransactionKeys): TransactionKeys {
    result.targetKeys = [daoConfig.daoAccountAddress]
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
      throw new Error('Network Account must already exist for the apply_dev_tally transaction')
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }
}
