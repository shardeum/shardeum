import stringify from 'fast-stable-stringify'
import _ from 'lodash'
import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import {
  IncomingTransactionResult,
  TransactionKeys,
  WrappedResponse,
} from '@shardus/core/dist/shardus/shardus-types'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { WrappedStates } from '@shardus/core/dist/state-manager/state-manager-types'
import { Windows } from '../types'
import { NetworkParameters } from '../../shardeum/shardeumTypes'
import { DaoTx } from '.'

export interface IApplyParameters {
  timestamp: number
  current: NetworkParameters
  next: Record<string, never>
  windows: Windows
  nextWindows: Record<string, never>
  issue: number
}

export class ApplyParameters implements IApplyParameters, DaoTx<DaoGlobalAccount> {
  timestamp: number
  current: NetworkParameters
  next: Record<string, never>
  windows: Windows
  nextWindows: Record<string, never>
  issue: number

  validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    if (_.isEmpty(this.current) || typeof this.current !== 'object') {
      response.success = false
      response.reason = 'tx "current" field must not be a non empty object'
      throw new Error(response.reason)
    }
    if (typeof this.current.title !== 'string') {
      response.success = false
      response.reason = 'tx "current parameter title" field must be a string.'
      throw new Error(response.reason)
    }
    if (typeof this.current.description !== 'string') {
      response.success = false
      response.reason = 'tx "current parameter description" field must be a string.'
      throw new Error(response.reason)
    }
    if (typeof this.current.nodeRewardInterval !== 'number') {
      response.success = false
      response.reason = 'tx "current parameter nodeRewardInterval" field must be a number.'
      throw new Error(response.reason)
    }
    if (typeof this.current.nodeRewardAmountUsd !== 'bigint') {
      response.success = false
      response.reason = 'tx "current parameter nodeRewardAmountUsd" field must be a bigint.'
      throw new Error(response.reason)
    }
    if (typeof this.current.nodePenaltyUsd !== 'bigint') {
      response.success = false
      response.reason = 'tx "current parameter nodePenaltyUsd" field must be a bigint.'
      throw new Error(response.reason)
    }
    if (typeof this.current.stakeRequiredUsd !== 'bigint') {
      response.success = false
      response.reason = 'tx "current parameter stakeRequiredUsd" field must be a bigint.'
      throw new Error(response.reason)
    }
    if (typeof this.current.maintenanceInterval !== 'number') {
      response.success = false
      response.reason = 'tx "current parameter maintenanceInterval" field must be a number.'
      throw new Error(response.reason)
    }
    if (typeof this.current.maintenanceFee !== 'number') {
      response.success = false
      response.reason = 'tx "current parameter maintenanceFee" field must be a number.'
      throw new Error(response.reason)
    }
    if (!_.isEmpty(this.next) || typeof this.next !== 'object') {
      response.success = false
      response.reason = 'tx "next" field must be an empty object.'
      throw new Error(response.reason)
    }
    if (_.isEmpty(this.windows) || typeof this.windows !== 'object') {
      response.success = false
      response.reason = 'tx "windows" field must be a non empty object.'
      throw new Error(response.reason)
    }
    if (!_.isEmpty(this.nextWindows)) {
      response.success = false
      response.reason = 'tx "nextWindows" field must be an empty object.'
      throw new Error(response.reason)
    }
    if (typeof this.issue !== 'number') {
      response.success = false
      response.reason = 'tx "issue" field must be a number.'
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
    const network = wrappedStates[daoConfig.daoAccountAddress].data as DaoGlobalAccount
    network.current = this.current
    network.next = this.next
    network.windows = this.windows
    network.nextWindows = this.nextWindows
    network.issue = this.issue
    network.timestamp = txTimestamp
    dapp.log(`=== APPLIED PARAMETERS GLOBAL ${stringify(network)} ===`)
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
      throw new Error('Network Account must already exist for the apply_parameters transaction')
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }
}
