import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import * as utils from '../utils'
import { daoConfig } from '../../config/dao'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { ProposalAccount } from '../accounts/proposalAccount'
import { IssueAccount } from '../accounts/issueAccount'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Vote {
  type: 'vote'
  from: string
  issue: string
  proposal: string
  amount: number
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(
  tx: Vote,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.amount !== 'number') {
    response.success = false
    response.reason = 'tx "amount" field must be a number.'
    throw new Error(response.reason)
  }
  if (tx.amount < 1) {
    response.success = false
    response.reason = 'Minimum voting "amount" allowed is 1 token'
    throw new Error(response.reason)
  }
  if (typeof tx.issue !== 'string') {
    response.success = false
    response.reason = 'tx "issue" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.proposal !== 'string') {
    response.success = false
    response.reason = 'tx "proposal" field must be a string.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: Vote,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  const proposal: ProposalAccount = wrappedStates[tx.proposal] && wrappedStates[tx.proposal].data
  const issue: IssueAccount = wrappedStates[tx.issue] && wrappedStates[tx.issue].data

  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (!issue) {
    response.reason = "issue doesn't exist"
    return response
  }
  if (issue.number !== network.issue) {
    response.reason = `This issue number ${issue.number} does not match the current network issue ${network.issue}`
    return response
  }
  if (issue.active === false) {
    response.reason = 'issue no longer active'
    return response
  }
  if (!proposal) {
    response.reason = "Proposal doesn't exist"
    return response
  }
  if (tx.amount <= 0) {
    response.reason = 'Must send tokens to vote'
    return response
  }
  if (tx.timestamp < network.windows.votingWindow[0] || tx.timestamp > network.windows.votingWindow[1]) {
    response.reason = 'Network is not within the time window to accept votes'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: Vote,
  txTimestamp: number,
  txId: string,
  wrappedStates: WrappedStates,
  dapp: Shardus
): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  const proposal: ProposalAccount = wrappedStates[tx.proposal].data
  from.data.balance -= tx.amount
  from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)
  proposal.power += tx.amount
  proposal.totalVotes++

  from.data.transactions.push({ ...tx, txId })
  from.timestamp = txTimestamp
  proposal.timestamp = txTimestamp
  dapp.log('Applied vote tx', from, proposal)
}

export function keys(tx: Vote, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.issue, tx.proposal, daoConfig.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: UserAccount,
  accountId: string,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    throw new Error('Account must already exist for the vote transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
