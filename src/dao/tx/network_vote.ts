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
import { DaoTx } from '.'

export interface IVote {
  type: 'network_vote'
  from: string
  issue: string
  proposal: string
  amount: number
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(
  tx: IVote,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  } else if (typeof tx.amount !== 'number') {
    response.success = false
    response.reason = 'tx "amount" field must be a number.'
    throw new Error(response.reason)
  } else if (tx.amount < 1) {
    response.success = false
    response.reason = 'Minimum voting "amount" allowed is 1 token'
    throw new Error(response.reason)
  } else if (typeof tx.issue !== 'string') {
    response.success = false
    response.reason = 'tx "issue" field must be a string.'
    throw new Error(response.reason)
  } else if (typeof tx.proposal !== 'string') {
    response.success = false
    response.reason = 'tx "proposal" field must be a string.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: IVote,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
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
  if (network.windows.votingWindow.excludes(tx.timestamp)) {
    response.reason = 'Network is not within the time window to accept votes'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: IVote,
  txTimestamp: number,
  txId: string,
  wrappedStates: WrappedStates,
  dapp: Shardus
): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
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

export function keys(tx: IVote, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.issue, tx.proposal, daoConfig.daoAccountAddress]
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

export class Vote implements IVote, DaoTx<UserAccount> {
  readonly type = 'network_vote'
  from: string
  issue: string
  proposal: string
  amount: number
  timestamp: number
  sign: crypto.Signature
  constructor(data: IVote) {
    this.type = data.type
    this.from = data.from
    this.issue = data.issue
    this.proposal = data.proposal
    this.amount = data.amount
    this.timestamp = data.timestamp
    this.sign = data.sign
  }

  validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    if (typeof this.from !== 'string') {
      response.success = false
      response.reason = 'tx "from" field must be a string.'
      throw new Error(response.reason)
    } else if (typeof this.amount !== 'number') {
      response.success = false
      response.reason = 'tx "amount" field must be a number.'
      throw new Error(response.reason)
    } else if (this.amount < 1) {
      response.success = false
      response.reason = 'Minimum voting "amount" allowed is 1 token'
      throw new Error(response.reason)
    } else if (typeof this.issue !== 'string') {
      response.success = false
      response.reason = 'tx "issue" field must be a string.'
      throw new Error(response.reason)
    } else if (typeof this.proposal !== 'string') {
      response.success = false
      response.reason = 'tx "proposal" field must be a string.'
      throw new Error(response.reason)
    }
    return response
  }

  validate(
    wrappedStates: WrappedStates,
    response: ShardusTypes.IncomingTransactionResult
  ): ShardusTypes.IncomingTransactionResult {
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    const proposal: ProposalAccount = wrappedStates[this.proposal] && wrappedStates[this.proposal].data
    const issue: IssueAccount = wrappedStates[this.issue] && wrappedStates[this.issue].data

    if (this.sign.owner !== this.from) {
      response.reason = 'not signed by from account'
      return response
    }
    if (crypto.verifyObj(this.getSignedObject()) === false) {
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
    if (this.amount <= 0) {
      response.reason = 'Must send tokens to vote'
      return response
    }
    if (network.windows.votingWindow.excludes(this.timestamp)) {
      response.reason = 'Network is not within the time window to accept votes'
      return response
    }
    response.success = true
    response.reason = 'This transaction is valid!'
    return response
  }

  apply(txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
    const from: UserAccount = wrappedStates[this.from].data
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    const proposal: ProposalAccount = wrappedStates[this.proposal].data
    from.data.balance -= this.amount
    from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)
    proposal.power += this.amount
    proposal.totalVotes++

    from.data.transactions.push({ ...this.getHashable(), txId })
    from.timestamp = txTimestamp
    proposal.timestamp = txTimestamp
    dapp.log('Applied vote tx', from, proposal)
  }

  keys(result: TransactionKeys): TransactionKeys {
    result.sourceKeys = [this.from]
    result.targetKeys = [this.issue, this.proposal, daoConfig.daoAccountAddress]
    result.allKeys = [...result.sourceKeys, ...result.targetKeys]
    return result
  }

  createRelevantAccount(
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

  getHashable(): object {
    return {
      type: this.type,
      from: this.from,
      issue: this.issue,
      proposal: this.proposal,
      amount: this.amount,
      timestamp: this.timestamp,
      sign: this.sign,
    }
  }

  getSignedObject(): crypto.SignedObject {
    return {
      ...this.getHashable(),
      sign: this.sign,
    }
  }
}
