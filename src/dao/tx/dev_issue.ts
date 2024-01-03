import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import { create } from '../accounts'
import { daoConfig } from '../../config/dao'
import { DevIssueAccount } from '../accounts/devIssueAccount'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { NodeAccount } from '../accounts/nodeAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface DevIssue {
  type: 'dev_issue'
  nodeId: string
  from: string
  devIssue: string
  timestamp: number
}

export function validateFields(
  tx: DevIssue,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.nodeId !== 'string') {
    response.success = false
    response.reason = 'tx "nodeId" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.devIssue !== 'string') {
    response.success = false
    response.reason = 'tx "devIssue" field must be a string.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: DevIssue,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  const devIssue: DevIssueAccount = wrappedStates[tx.devIssue] && wrappedStates[tx.devIssue].data
  // let nodeInfo
  // try {
  //   nodeInfo = dapp.getNode(tx.nodeId)
  // } catch (err) {
  //   dapp.log(err)
  // }
  // if (!nodeInfo) {
  //   response.reason = 'no nodeInfo'
  //   return response
  // }
  if (devIssue.active !== null) {
    response.reason = 'devIssue is already active'
    return response
  }
  const networkDevIssueHash = crypto.hash(`dev-issue-${network.devIssue}`)
  if (tx.devIssue !== networkDevIssueHash) {
    response.reason = `devIssue address (${tx.devIssue}) does not match current network devIssue address (${networkDevIssueHash})`
    return response
  }
  if (
    tx.timestamp < network.devWindows.devProposalWindow[0] ||
    tx.timestamp > network.devWindows.devProposalWindow[1]
  ) {
    response.reason = 'Network is not within the time window to generate developer proposal issues'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: DevIssue, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: NodeAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  const devIssue: DevIssueAccount = wrappedStates[tx.devIssue].data

  devIssue.number = network.devIssue
  devIssue.active = true

  from.timestamp = txTimestamp
  devIssue.timestamp = txTimestamp
  dapp.log('Applied dev_issue tx', devIssue)
}

export function keys(tx: DevIssue, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.devIssue, daoConfig.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: NodeAccount | DevIssueAccount,
  accountId: string,
  tx: DevIssue,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    if (accountId === tx.devIssue) {
      account = create.devIssueAccount(accountId)
    } else {
      account = create.nodeAccount(accountId)
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
