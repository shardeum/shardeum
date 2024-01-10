import { Shardus, ShardusTypes } from '@shardus/core'
import { ApplyResponse, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import * as crypto from '@shardus/crypto-utils'
import { daoConfig } from '../../config/dao'
import { OurAppDefinedData, TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DevIssueAccount } from '../accounts/devIssueAccount'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { NodeAccount } from '../accounts/nodeAccount'
import { UserAccount } from '../accounts/userAccount'

export interface DevParameters {
  type: 'dev_parameters'
  nodeId: string
  from: string
  devIssue: string
  timestamp: number
}

export function validateFields(
  tx: DevParameters,
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
  tx: DevParameters,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const devIssue: DevIssueAccount = wrappedStates[tx.devIssue].data

  if (network.id !== daoConfig.daoAccountAddress) {
    response.reason = 'To account must be the network account'
    return response
  }
  if (!devIssue) {
    response.reason = "devIssue doesn't exist"
    return response
  }
  if (devIssue.number !== network.devIssue) {
    response.reason = `This devIssue number ${devIssue.number} does not match the current network issue ${network.devIssue}`
    return response
  }
  const networkDevIssueHash = crypto.hash(`dev-issue-${network.devIssue}`)
  if (tx.devIssue !== networkDevIssueHash) {
    response.reason = `devIssue address (${tx.devIssue}) does not match current network devIssue address (${networkDevIssueHash})`
    return response
  }
  if (devIssue.active === false) {
    response.reason = 'This devIssue is no longer active'
    return response
  }
  if (
    tx.timestamp < network.devWindows.applyWindow[0] ||
    tx.timestamp > network.devWindows.applyWindow[1]
  ) {
    response.reason = 'Network is not within the time window to apply developer proposal winners'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: DevParameters,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  dapp: Shardus,
  applyResponse: ShardusTypes.ApplyResponse
): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const devIssue: DevIssueAccount = wrappedStates[tx.devIssue].data

  const when = txTimestamp + 1000 * 10
  const value = {
    type: 'apply_dev_parameters',
    timestamp: when,
    network: daoConfig.daoAccountAddress,
    devWindows: network.nextDevWindows,
    nextDevWindows: {},
    developerFund: [...network.developerFund, ...network.nextDeveloperFund].sort(
      (a, b) => a.timestamp - b.timestamp
    ),
    nextDeveloperFund: [],
    devIssue: network.devIssue + 1,
  }

  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = { address: daoConfig.daoAccountAddress, value, when, source: daoConfig.daoAccountAddress }

  devIssue.active = false

  from.timestamp = txTimestamp
  devIssue.timestamp = txTimestamp
  dapp.log('Applied dev_parameters tx', from, devIssue)
}

export function transactionReceiptPass(dapp: Shardus, applyResponse: ApplyResponse): void {
  const { address, value, when, source } = (applyResponse.appDefinedData as OurAppDefinedData).globalMsg
  dapp.setGlobal(address, value, when, source)
  dapp.log('PostApplied dev_parameters tx')
}

export function keys(tx: DevParameters, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.devIssue, daoConfig.daoAccountAddress]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
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
