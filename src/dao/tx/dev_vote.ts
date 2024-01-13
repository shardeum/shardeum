import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import * as utils from '../utils'
import { daoConfig } from '../../config/dao'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { DevProposalAccount } from '../accounts/devProposalAccount'
import { DevIssueAccount } from '../accounts/devIssueAccount'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface DevVote {
  type: 'dev_vote'
  from: string
  devIssue: string
  devProposal: string
  approve: boolean
  amount: number
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(
  tx: DevVote,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  } else if (typeof tx.amount !== 'number') {
    response.success = false
    response.reason = 'ts "amount" field must be a number.'
    throw new Error(response.reason)
  } else if (tx.amount < 1) {
    response.success = false
    response.reason = 'Minimum voting "amount" allowed is 1 token'
    throw new Error(response.reason)
  } else if (typeof tx.approve !== 'boolean') {
    response.success = false
    response.reason = 'tx "approve" field must be a boolean.'
    throw new Error(response.reason)
  } else if (typeof tx.devProposal !== 'string') {
    response.success = false
    response.reason = 'tx "devProposal" field must be a string.'
    throw new Error(response.reason)
  } else if (typeof tx.devIssue !== 'string') {
    response.success = false
    response.reason = 'tx "devIssue" field must be a string.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: DevVote,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const devProposal: DevProposalAccount = wrappedStates[tx.devProposal] && wrappedStates[tx.devProposal].data
  const devIssue: DevIssueAccount = wrappedStates[tx.devIssue] && wrappedStates[tx.devIssue].data

  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (!devProposal) {
    response.reason = "devProposal doesn't exist"
    return response
  }
  if (!devIssue) {
    response.reason = "devIssue doesn't exist"
    return response
  }
  if (devIssue.number !== network.devIssue) {
    response.reason = `This devIssue number ${devIssue.number} does not match the current network devIssue ${network.issue}`
    return response
  }
  if (devIssue.active === false) {
    response.reason = 'devIssue no longer active'
    return response
  }
  if (tx.amount <= 0) {
    response.reason = 'Must send tokens in order to vote'
    return response
  }
  if (network.devWindows.votingWindow.excludes(tx.timestamp)) {
    response.reason = 'Network is not within the time window to accept votes for developer proposals'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: DevVote,
  txTimestamp: number,
  txId: string,
  wrappedStates: WrappedStates,
  dapp: Shardus
): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const devProposal: DevProposalAccount = wrappedStates[tx.devProposal].data

  from.data.balance -= tx.amount
  from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)

  if (tx.approve) {
    devProposal.approve += tx.amount
  } else {
    devProposal.reject += tx.amount
  }

  devProposal.totalVotes++
  from.data.transactions.push({ ...tx, txId })
  from.timestamp = txTimestamp
  devProposal.timestamp = txTimestamp
  dapp.log('Applied dev_vote tx', from, devProposal)
}

export function keys(tx: DevVote, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.devIssue, tx.devProposal, daoConfig.daoAccountAddress]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: UserAccount | DevProposalAccount,
  accountId: string,
  tx: DevVote,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    if (accountId === tx.devProposal) {
      throw Error('Dev Proposal Account must already exist for the dev_vote transaction')
    } else {
      throw Error('Account must already exist for the dev_vote transaction')
    }
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
