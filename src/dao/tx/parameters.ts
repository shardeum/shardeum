import { Shardus, ShardusTypes } from '@shardus/core'
import { ApplyResponse, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { daoConfig } from '../../config/dao'
import { OurAppDefinedData, TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { IssueAccount } from '../accounts/issueAccount'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { NodeAccount } from '../accounts/nodeAccount'

export interface Parameters {
  type: 'parameters'
  nodeId: string
  from: string
  issue: string
  timestamp: number
}

export function validateFields(
  tx: Parameters,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string'
    throw new Error(response.reason)
  }
  if (typeof tx.nodeId !== 'string') {
    response.success = false
    response.reason = 'tx "nodeId" field must be a string'
    throw new Error(response.reason)
  }
  if (typeof tx.issue !== 'string') {
    response.success = false
    response.reason = 'tx "issue" field must be a string'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: Parameters,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const issue: IssueAccount = wrappedStates[tx.issue].data

  if (network.id !== daoConfig.daoAccountAddress) {
    response.reason = 'To account must be the network account'
    return response
  }
  if (!issue) {
    response.reason = "Issue doesn't exist"
    return response
  }
  if (issue.active === false) {
    response.reason = 'This issue is no longer active'
    return response
  }
  if (tx.timestamp < network.windows.applyWindow[0] || tx.timestamp > network.windows.applyWindow[1]) {
    response.reason = 'Network is not within the time window to apply parameters'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: Parameters,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  dapp: Shardus,
  applyResponse: ShardusTypes.ApplyResponse
): void {
  const from: NodeAccount = wrappedStates[tx.from].data

  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const issue: IssueAccount = wrappedStates[tx.issue].data

  const when = txTimestamp + 1000 * 10
  const value = {
    type: 'apply_parameters',
    timestamp: when,
    network: daoConfig.daoAccountAddress,
    current: network.next,
    next: {},
    windows: network.nextWindows,
    nextWindows: {},
    issue: network.issue + 1,
  }

  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = {
    address: daoConfig.daoAccountAddress,
    value,
    when,
    source: daoConfig.daoAccountAddress,
  }

  issue.active = false

  from.timestamp = txTimestamp
  issue.timestamp = txTimestamp
  dapp.log('Applied parameters tx', issue)
}

export function transactionReceiptPass(dapp: Shardus, applyResponse: ApplyResponse): void {
  const { address, value, when, source } = (applyResponse.appDefinedData as OurAppDefinedData).globalMsg
  dapp.setGlobal(address, value, when, source)
  dapp.log('PostApplied parameters tx')
}

export function keys(tx: Parameters, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [daoConfig.daoAccountAddress, tx.issue]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: NodeAccount | IssueAccount,
  accountId: string,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    account = new NodeAccount(accountId)
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
