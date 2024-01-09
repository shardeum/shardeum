import stringify from 'fast-stable-stringify'
import { Shardus, ShardusTypes } from '@shardus/core'

import _ from 'lodash'
import { daoConfig } from '../../config/dao'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { NetworkParameters, TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { IncomingTransactionResult, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { Windows } from '../types'
import { DaoTx } from '.'

export interface IApplyTally {
  type: 'apply_tally'
  timestamp: number
  next: NetworkParameters
  nextWindows: Windows
}

export class ApplyTally implements IApplyTally, DaoTx<DaoGlobalAccount> {
  readonly type = 'apply_tally'
  timestamp: number
  next: NetworkParameters
  nextWindows: Windows

  constructor(data: IApplyTally) {
    this.timestamp = data.timestamp
    this.next = data.next
    this.nextWindows = data.nextWindows
  }

  validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    if (_.isEmpty(this.next) || typeof this.next !== 'object') {
      response.success = false
      response.reason = 'tx "next" field must be a non empty object'
      throw new Error(response.reason)
    }
    if (_.isEmpty(this.nextWindows) || typeof this.nextWindows !== 'object') {
      response.success = false
      response.reason = 'tx "nextWindows" field must be a non empty object'
      throw new Error(response.reason)
    }
    if (typeof this.next.title !== 'string') {
      response.success = false
      response.reason = 'tx "next parameter title" field must be a string.'
      throw new Error(response.reason)
    }
    if (typeof this.next.description !== 'string') {
      response.success = false
      response.reason = 'tx "next parameter description" field must be a string.'
      throw new Error(response.reason)
    }
    if (typeof this.next.nodeRewardInterval !== 'number') {
      response.success = false
      response.reason = 'tx "next parameter nodeRewardInterval" field must be a number.'
      throw new Error(response.reason)
    }
    if (typeof this.next.nodeRewardAmountUsd !== 'bigint') {
      response.success = false
      response.reason = 'tx "next parameter nodeRewardAmountUsd" field must be a bigint.'
      throw new Error(response.reason)
    }
    if (typeof this.next.nodePenaltyUsd !== 'bigint') {
      response.success = false
      response.reason = 'tx "next parameter nodePenaltyUsd" field must be a bigint.'
      throw new Error(response.reason)
    }
    if (typeof this.next.stakeRequiredUsd !== 'bigint') {
      response.success = false
      response.reason = 'tx "next parameter stakeRequiredUsd" field must be a bigint.'
      throw new Error(response.reason)
    }
    if (typeof this.next.maintenanceInterval !== 'number') {
      response.success = false
      response.reason = 'tx "next parameter maintenanceInterval" field must be a number.'
      throw new Error(response.reason)
    }
    if (typeof this.next.maintenanceFee !== 'number') {
      response.success = false
      response.reason = 'tx "next parameter maintenanceFee" field must be a number.'
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
    network.next = this.next
    network.nextWindows = this.nextWindows
    network.timestamp = txTimestamp
    dapp.log(`APPLIED TALLY GLOBAL ${stringify(network)} ===`)
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
      throw new Error('Network Account must already exist for the apply_tally transaction')
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }
}
