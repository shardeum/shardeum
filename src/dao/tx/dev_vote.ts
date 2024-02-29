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
import Decimal from 'decimal.js'
import _ from 'lodash'
import { DaoTx } from '.'
import { DeveloperPayment } from '../types'

export interface IDevVote {
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
  tx: IDevVote,
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
  tx: IDevVote,
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
  tx: IDevVote,
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

export function keys(tx: IDevVote, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.devIssue, tx.devProposal, daoConfig.daoAccountAddress]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: UserAccount | DevProposalAccount,
  accountId: string,
  tx: IDevVote,
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

export class DevVote implements IDevVote, DaoTx<UserAccount> {
  readonly type = 'dev_vote'
  from: string
  devIssue: string
  devProposal: string
  approve: boolean
  amount: number
  timestamp: number
  sign: crypto.Signature

  constructor(data: IDevVote) {
    this.type = data.type
    this.from = data.from
    this.devIssue = data.devIssue
    this.devProposal = data.devProposal
    this.approve = data.approve
    this.amount = data.amount
    this.timestamp = data.timestamp
    this.sign = data.sign
  }

  validateFields(
    response: ShardusTypes.IncomingTransactionResult
  ): ShardusTypes.IncomingTransactionResult {
    if (typeof this.from !== 'string') {
      response.success = false
      response.reason = 'tx "from" field must be a string.'
      throw new Error(response.reason)
    } else if (typeof this.amount !== 'number') {
      response.success = false
      response.reason = 'ts "amount" field must be a number.'
      throw new Error(response.reason)
    } else if (this.amount < 1) {
      response.success = false
      response.reason = 'Minimum voting "amount" allowed is 1 token'
      throw new Error(response.reason)
    } else if (typeof this.approve !== 'boolean') {
      response.success = false
      response.reason = 'tx "approve" field must be a boolean.'
      throw new Error(response.reason)
    } else if (typeof this.devProposal !== 'string') {
      response.success = false
      response.reason = 'tx "devProposal" field must be a string.'
      throw new Error(response.reason)
    } else if (typeof this.devIssue !== 'string') {
      response.success = false
      response.reason = 'tx "devIssue" field must be a string.'
      throw new Error(response.reason)
    }
    return response
  }

  validate(
    wrappedStates: WrappedStates,
    response: ShardusTypes.IncomingTransactionResult
  ): ShardusTypes.IncomingTransactionResult {
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    const devProposal: DevProposalAccount =
      wrappedStates[this.devProposal] && wrappedStates[this.devProposal].data
    const devIssue: DevIssueAccount = wrappedStates[this.devIssue] && wrappedStates[this.devIssue].data

    if (this.sign.owner !== this.from) {
      response.reason = 'not signed by from account'
      return response
    }
    if (crypto.verifyObj(this.getSignedObject()) === false) {
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
    if (this.amount <= 0) {
      response.reason = 'Must send tokens in order to vote'
      return response
    }
    if (network.devWindows.votingWindow.excludes(this.timestamp)) {
      response.reason = 'Network is not within the time window to accept votes for developer proposals'
      return response
    }
    response.success = true
    response.reason = 'This transaction is valid!'
    return response
  }

  apply(txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
    const from: UserAccount = wrappedStates[this.from].data
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    const devProposal: DevProposalAccount = wrappedStates[this.devProposal].data

    from.data.balance -= this.amount
    from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)

    if (this.approve) {
      devProposal.approve += this.amount
    } else {
      devProposal.reject += this.amount
    }

    devProposal.totalVotes++
    from.data.transactions.push({ ...this.getHashable(), txId })
    from.timestamp = txTimestamp
    devProposal.timestamp = txTimestamp
    dapp.log('Applied dev_vote tx', from, devProposal)
  }

  keys(result: TransactionKeys): TransactionKeys {
    result.sourceKeys = [this.from]
    result.targetKeys = [this.devIssue, this.devProposal, daoConfig.daoAccountAddress]
    result.allKeys = [...result.sourceKeys, ...result.targetKeys]
    return result
  }

  createRelevantAccount(
    dapp: Shardus,
    account: UserAccount | DevProposalAccount,
    accountId: string,
    accountCreated = false
  ): WrappedResponse {
    if (!account) {
      if (accountId === this.devProposal) {
        throw Error('Dev Proposal Account must already exist for the dev_vote transaction')
      } else {
        throw Error('Account must already exist for the dev_vote transaction')
      }
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }

  getHashable(): object {
    return {
      type: this.type,
      from: this.from,
      devIssue: this.devIssue,
      devProposal: this.devProposal,
      approve: this.approve,
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
