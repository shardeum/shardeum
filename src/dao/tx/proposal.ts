import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import * as utils from '../utils'
import create from '../accounts'
import config from '../../config'
import { NetworkParameters } from '../types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { NetworkAccount } from '../accounts/networkAccount'
import { IssueAccount } from '../accounts/issueAccount'
import { UserAccount } from '../accounts/userAccount'
import { ProposalAccount } from '../accounts/proposalAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Proposal {
  type: string
  from: string
  proposal: string
  issue: string
  parameters: NetworkParameters
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: Proposal, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
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
  if (typeof tx.parameters.nodeRewardAmount !== 'number') {
    response.success = false
    response.reason = 'tx "parameter nodeRewardAmount" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.nodePenalty !== 'number') {
    response.success = false
    response.reason = 'tx "parameter nodePenalty" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.transactionFee !== 'number') {
    response.success = false
    response.reason = 'tx "parameter transactionFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.stakeRequired !== 'number') {
    response.success = false
    response.reason = 'tx "parameter stakeRequired" field must be a number.'
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
  if (typeof tx.parameters.proposalFee !== 'number') {
    response.success = false
    response.reason = 'tx "parameter proposalFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.devProposalFee !== 'number') {
    response.success = false
    response.reason = 'tx "parameter devProposalFee" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.faucetAmount !== 'number') {
    response.success = false
    response.reason = 'tx "parameter faucetAmount" field must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.parameters.transactionFee !== 'number') {
    response.success = false
    response.reason = 'tx "parameter defaultToll" field must be a number.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: Proposal, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from] && wrappedStates[tx.from].data
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
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
  if (from.data.balance < network.current.proposalFee + network.current.transactionFee) {
    response.reason = 'From account has insufficient balance to submit a proposal'
    return response
  }
  if (parameters.transactionFee < 0) {
    response.reason = 'Min transaction fee permitted is 0'
    return response
  }
  if (parameters.transactionFee > 10) {
    response.reason = 'Max transaction fee permitted is 10'
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
  if (parameters.nodeRewardAmount < 0) {
    response.reason = 'Min nodeRewardAmount permitted is 0 tokens'
    return response
  }
  if (parameters.nodeRewardAmount > 1000000000) {
    response.reason = 'Max nodeRewardAmount permitted is 1000000000'
    return response
  }
  if (parameters.proposalFee < 0) {
    response.reason = 'Min proposalFee permitted is 0 tokens'
    return response
  }
  if (parameters.proposalFee > 1000000000) {
    response.reason = 'Max proposalFee permitted is 1000000000 tokens'
    return response
  }
  if (parameters.devProposalFee < 0) {
    response.reason = 'Min devProposalFee permitted is 0 tokens'
    return response
  }
  if (parameters.devProposalFee > 1000000000) {
    response.reason = 'Max devProposalFee permitted is 1000000000 tokens'
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

export function apply(tx: Proposal, txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
  const proposal: ProposalAccount = wrappedStates[tx.proposal].data
  const issue: IssueAccount = wrappedStates[tx.issue].data

  from.data.balance -= network.current.proposalFee
  from.data.balance -= network.current.transactionFee
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
  result.targetKeys = [tx.issue, tx.proposal, config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount | ProposalAccount, accountId: string, tx: Proposal, accountCreated = false): WrappedResponse {
  if (!account) {
    if (accountId === tx.proposal) {
      account = create.proposalAccount(accountId, tx.parameters)
    } else {
      account = create.userAccount(accountId, tx.timestamp)
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
