import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import * as utils from '../utils'
import { daoConfig } from '../../config/dao'
import { NetworkParameters, TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { IssueAccount } from '../accounts/issueAccount'
import { UserAccount } from '../accounts/userAccount'
import { ProposalAccount } from '../accounts/proposalAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Proposal {
  type: 'proposal'
  from: string
  proposal: string
  issue: string
  parameters: NetworkParameters
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(
  tx: Proposal,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.proposal !== 'string') {
    response.success = false
    response.reason = 'tx "proposal" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.issue !== 'string') {
    response.success = false
    response.reason = 'tx "issue" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters !== 'object') {
    response.success = false
    response.reason = 'tx "parameters" field must be an object.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.title !== 'string') {
    response.success = false
    response.reason = 'tx "parameter title" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.description !== 'string') {
    response.success = false
    response.reason = 'tx "parameter description" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.nodeRewardInterval !== 'number') {
    response.success = false
    response.reason = 'tx "parameter nodeRewardInterval" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.nodeRewardAmountUsd !== 'bigint') {
    response.success = false
    response.reason = 'tx "parameter nodeRewardAmountUsd" field must be a bigint.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.nodePenaltyUsd !== 'bigint') {
    response.success = false
    response.reason = 'tx "parameter nodePenaltyUsd" field must be a bigint.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.stakeRequiredUsd !== 'bigint') {
    response.success = false
    response.reason = 'tx "parameter stakeRequiredUsd" field must be a bigint.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.maintenanceInterval !== 'number') {
    response.success = false
    response.reason = 'tx "parameter maintenanceInterval" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.maintenanceFee !== 'number') {
    response.success = false
    response.reason = 'tx "parameter maintenanceFee" field must be a number.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: Proposal,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const issue: IssueAccount = wrappedStates[tx.issue] && wrappedStates[tx.issue].data
  const parameters: NetworkParameters = tx.parameters
  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (!issue) {
    response.reason = "Issue doesn't exist"
    return response
  }
  if (issue.number !== network.issue) {
    response.reason = `This issue number ${issue.number} does not match the current network issue ${network.issue}`
    return response
  }
  if (issue.active === false) {
    response.reason = 'This issue is no longer active'
    return response
  }
  if (tx.proposal !== crypto.hash(`issue-${network.issue}-proposal-${issue.proposalCount + 1}`)) {
    response.reason = 'Must give the next issue proposalCount hash'
    return response
  }
  if (parameters.maintenanceFee > 0.1) {
    response.reason = 'Max maintenanceFee fee permitted is 10%'
    return response
  }
  if (parameters.maintenanceFee < 0) {
    response.reason = 'Min maintenanceFee fee permitted is 0%'
    return response
  }
  if (parameters.maintenanceInterval > 1000000000000) {
    response.reason = 'Max maintenanceInterval permitted is 1000000000000'
    return response
  }
  if (parameters.maintenanceInterval < 600000) {
    response.reason = 'Min maintenanceInterval permitted is 600000 (10 minutes)'
    return response
  }
  if (parameters.nodeRewardInterval < 60000) {
    response.reason = 'Min nodeRewardInterval permitted is 60000 (1 minute)'
    return response
  }
  if (parameters.nodeRewardInterval > 900000000000) {
    response.reason = 'Max nodeRewardInterval fee permitted is 900000000000'
    return response
  }
  if (parameters.nodeRewardAmountUsd < 0) {
    response.reason = 'Min nodeRewardAmountUsd permitted is 0'
    return response
  }
  if (parameters.nodeRewardAmountUsd > 1000000000) {
    response.reason = 'Max nodeRewardAmountUsd permitted is 1000000000'
    return response
  }
  if (tx.timestamp < network.windows.proposalWindow[0] || tx.timestamp > network.windows.proposalWindow[1]) {
    response.reason = 'Network is not within the time window to accept proposals'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: Proposal,
  txTimestamp: number,
  txId: string,
  wrappedStates: WrappedStates,
  dapp: Shardus
): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const proposal: ProposalAccount = wrappedStates[tx.proposal].data
  const issue: IssueAccount = wrappedStates[tx.issue].data

  from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)

  proposal.parameters = tx.parameters
  issue.proposalCount++
  proposal.number = issue.proposalCount
  issue.proposals.push(proposal.id)

  from.data.transactions.push({ ...tx, txId })
  from.timestamp = txTimestamp
  issue.timestamp = txTimestamp
  proposal.timestamp = txTimestamp
  dapp.log('Applied proposal tx', from, issue, proposal)
}

export function transactionReceiptPass(dapp: Shardus): void {
  dapp.log('PostApplied proposal tx')
}

export function keys(tx: Proposal, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.issue, tx.proposal, daoConfig.daoAccountAddress]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: UserAccount | ProposalAccount,
  accountId: string,
  tx: Proposal,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    if (accountId === tx.proposal) {
      account = new ProposalAccount(accountId, tx.parameters)
    } else {
      account = new UserAccount(accountId, tx.timestamp)
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
