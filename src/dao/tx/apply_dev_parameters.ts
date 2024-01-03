import _ from 'lodash'
import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import stringify from 'fast-stable-stringify'
import { DeveloperPayment, DevWindows } from '../types'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import {
  IncomingTransactionResult,
  TransactionKeys,
  WrappedResponse,
} from '@shardus/core/dist/shardus/shardus-types'
import { WrappedStates } from '@shardus/core/dist/state-manager/state-manager-types'
import { DaoTx } from '.'

export interface IApplyDevParameters {
  timestamp: number
  devWindows: DevWindows
  nextDevWindows: Record<string, never>
  developerFund: DeveloperPayment[]
  nextDeveloperFund: DeveloperPayment[]
  devIssue: number
}

export class ApplyDevParameters implements IApplyDevParameters, DaoTx<DaoGlobalAccount> {
  timestamp: number
  devWindows: DevWindows
  nextDevWindows: Record<string, never>
  developerFund: DeveloperPayment[]
  nextDeveloperFund: DeveloperPayment[]
  devIssue: number

  constructor(data: IApplyDevParameters) {
    this.timestamp = data.timestamp
    this.devWindows = data.devWindows
    this.nextDevWindows = data.nextDevWindows
    this.developerFund = data.developerFund
    this.nextDeveloperFund = data.nextDeveloperFund
    this.devIssue = data.devIssue
  }

  validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    if (typeof this.devIssue !== 'number') {
      response.success = false
      response.reason = 'tx "devIssue" field must be a number.'
      throw new Error(response.reason)
    }
    if (_.isEmpty(this.devWindows)) {
      response.success = false
      response.reason = 'tx "devWindows" field must not be empty.'
      throw new Error(response.reason)
    }
    if (!_.isEmpty(this.nextDevWindows)) {
      response.success = false
      response.reason = 'tx "nextDevWindows" field must be an empty object.'
      throw new Error(response.reason)
    }
    if (!Array.isArray(this.developerFund)) {
      response.success = false
      response.reason = 'tx "developerFund" field must be an array.'
      throw new Error(response.reason)
    }
    if (!_.isEmpty(this.nextDeveloperFund) || !Array.isArray(this.nextDeveloperFund)) {
      response.success = false
      response.reason = 'tx "nextDeveloperFund" field must be an empty array.'
      throw new Error(response.reason)
    }
    return response
  }

  validate(_wrappedStates: WrappedStates, response: IncomingTransactionResult): IncomingTransactionResult {
    response.success = true
    response.reason = 'This transaction is valid!'
    return response
  }

  apply(txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
    const network = wrappedStates[daoConfig.daoAccount].data as DaoGlobalAccount
    network.devWindows = this.devWindows
    network.nextDevWindows = this.nextDevWindows
    network.developerFund = this.developerFund
    network.nextDeveloperFund = this.nextDeveloperFund
    network.devIssue = this.devIssue
    network.timestamp = txTimestamp
    dapp.log(`=== APPLIED DEV_PARAMETERS GLOBAL ${stringify(network)} ===`)
  }

  keys(result: TransactionKeys): ShardusTypes.TransactionKeys {
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
      throw new Error('account must already exist for the apply_dev_parameters transaction')
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }
}
