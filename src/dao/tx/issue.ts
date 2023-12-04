import * as crypto from '@shardus/crypto-utils'
import _ from 'lodash'
import { Shardus, ShardusTypes } from '@shardus/core'
import create from '../accounts'

import { IncomingTransactionResult, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { IssueAccount } from '../accounts/issueAccount'
import { NetworkAccount } from '../accounts/networkAccount'
import { NodeAccount } from '../accounts/nodeAccount'
import { ProposalAccount } from '../accounts/proposalAccount'
import config from '../../config'

export interface Issue {
  type: string
  nodeId: string
  from: string
  issue: string
  proposal: string
  timestamp: number
}

interface ValidationResponse {
  success: boolean
  reason: string
}

export const validate_fields = (tx: Issue, response: ShardusTypes.IncomingTransactionResult): ValidationResponse => {
  if (typeof tx.nodeId !== 'string') {
    response.success = false
    response.reason = 'tx "nodeId" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from field must be a string.'
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

export const validate = (tx: Issue, wrappedStates: WrappedStates, response: IncomingTransactionResult, _dapp: Shardus): ValidationResponse => {
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
  const issue: IssueAccount = wrappedStates[tx.issue] && wrappedStates[tx.issue].data

  if (issue.active !== null) {
    response.reason = 'Issue is already active'
    return response
  }

  const networkIssueHash = crypto.hash(`issue-${network.issue}`)
  if (tx.issue !== networkIssueHash) {
    response.reason = `issue hash (${tx.issue}) does not match current network issue hash (${networkIssueHash}) --- networkAccount: ${JSON.stringify(network)}`
    return response
  }
  const networkProposalHash = crypto.hash(`issue-${network.issue}-proposal-1`)
  if (tx.proposal !== networkProposalHash) {
    response.reason = `proposalHash (${tx.proposal
      }) does not match the current default network proposal (${networkProposalHash}) --- networkAccount: ${JSON.stringify(network)}`
    return response
  }
  if (tx.timestamp < network.windows.proposalWindow[0] || tx.timestamp > network.windows.proposalWindow[1]) {
    response.reason = 'Network is not within the time window to generate issues'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export const apply = (tx: Issue, txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void => {
  const from: NodeAccount = wrappedStates[tx.from].data

  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
  const issue: IssueAccount = wrappedStates[tx.issue].data
  const proposal: ProposalAccount = wrappedStates[tx.proposal].data

  proposal.parameters = _.cloneDeep(network.current)
  proposal.parameters.title = 'Default parameters'
  proposal.parameters.description = 'Keep the current network parameters as they are'
  proposal.number = 1

  issue.number = network.issue
  issue.active = true
  issue.proposals.push(proposal.id)
  issue.proposalCount++

  from.timestamp = txTimestamp
  issue.timestamp = txTimestamp
  proposal.timestamp = txTimestamp
  dapp.log('Applied issue tx', issue, proposal)
}

export const keys = (tx: Issue, result: TransactionKeys): TransactionKeys => {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.issue, tx.proposal, config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export const createRelevantAccount = (
  dapp: Shardus,
  account: NodeAccount | IssueAccount | ProposalAccount,
  accountId: string,
  tx: Issue,
  accountCreated = false,
): WrappedResponse => {
  if (!account) {
    if (accountId === tx.issue) {
      account = create.issueAccount(accountId)
    } else if (accountId === tx.proposal) {
      account = create.proposalAccount(accountId)
    } else {
      account = create.nodeAccount(accountId)
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
