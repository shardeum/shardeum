import * as crypto from '@shardus/crypto-utils'
import _ from 'lodash'
import { Shardus, ShardusTypes } from '@shardus/core'
import { IncomingTransactionResult, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { WrappedStates } from '../../shardeum/shardeumTypes'
import { IssueAccount } from '../accounts/issueAccount'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { NodeAccount } from '../accounts/nodeAccount'
import { ProposalAccount } from '../accounts/proposalAccount'
import { daoConfig } from '../../config/dao'
import { DaoTx } from '.'
import { TransactionKeys } from '@shardus/core/dist/shardus/shardus-types'

export interface IIssue {
  type: 'issue'
  nodeId: string
  from: string
  issue: string
  proposal: string
  timestamp: number
}

export class Issue implements IIssue, DaoTx<IssueAccount> {
  readonly type = 'issue'
  nodeId: string
  from: string
  issue: string
  proposal: string
  timestamp: number

  constructor(data: IIssue) {
    this.nodeId = data.nodeId
    this.from = data.from
    this.issue = data.issue
    this.proposal = data.proposal
    this.timestamp = data.timestamp
  }

  validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    if (typeof this.nodeId !== 'string') {
      response.success = false
      response.reason = 'tx "nodeId" field must be a string.'
      throw new Error(response.reason)
    } else if (typeof this.from !== 'string') {
      response.success = false
      response.reason = 'tx "from field must be a string.'
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

  validate(wrappedStates: WrappedStates, response: IncomingTransactionResult): IncomingTransactionResult {
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    const issue: IssueAccount = wrappedStates[this.issue]?.data

    if (issue.active !== null) {
      response.reason = 'Issue is already active'
      return response
    }

    const networkIssueHash = crypto.hash(`issue-${network.issue}`)
    if (this.issue !== networkIssueHash) {
      response.reason = `issue hash (${
        this.issue
      }) does not match current network issue hash (${networkIssueHash}) --- networkAccount: ${JSON.stringify(
        network
      )}`
      return response
    }
    const networkProposalHash = crypto.hash(`issue-${network.issue}-proposal-1`)
    if (this.proposal !== networkProposalHash) {
      response.reason = `proposalHash (${
        this.proposal
      }) does not match the current default network proposal (${networkProposalHash}) --- networkAccount: ${JSON.stringify(
        network
      )}`
      return response
    }
    if (network.windows.proposalWindow.excludes(this.timestamp)) {
      response.reason = 'Network is not within the time window to generate issues'
      return response
    }
    response.success = true
    response.reason = 'This transaction is valid!'
    return response
  }

  apply(txTimestamp: number, _txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
    const from: NodeAccount = wrappedStates[this.from].data

    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    const issue: IssueAccount = wrappedStates[this.issue].data
    const proposal: ProposalAccount = wrappedStates[this.proposal].data

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

  keys(result: TransactionKeys): TransactionKeys {
    result.sourceKeys = [this.from]
    result.targetKeys = [this.issue, this.proposal, daoConfig.daoAccountAddress]
    result.allKeys = [...result.sourceKeys, ...result.targetKeys]
    return result
  }

  createRelevantAccount(
    dapp: Shardus,
    account: NodeAccount | IssueAccount | ProposalAccount,
    accountId: string,
    accountCreated = false
  ): WrappedResponse {
    if (!account) {
      if (accountId === this.issue) {
        account = new IssueAccount(accountId)
      } else if (accountId === this.proposal) {
        account = new ProposalAccount(accountId)
      } else {
        account = new NodeAccount(accountId)
      }
      accountCreated = true
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }
}
