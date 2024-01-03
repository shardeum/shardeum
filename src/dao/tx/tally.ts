import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import { create } from '../accounts'
import { Windows } from '../types'
import { OurAppDefinedData, TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { IssueAccount } from '../accounts/issueAccount'
import { ProposalAccount } from '../accounts/proposalAccount'
import { ApplyResponse, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { NodeAccount } from '../accounts/nodeAccount'

export interface Tally {
  type: 'tally'
  nodeId: string
  from: string
  issue: string
  proposals: string[]
  timestamp: number
}

export function validateFields(
  tx: Tally,
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
  if (typeof tx.issue !== 'string') {
    response.success = false
    response.reason = 'tx "issue" field must be a string.'
    throw new Error(response.reason)
  }
  if (!Array.isArray(tx.proposals)) {
    response.success = false
    response.reason = 'tx "proposals" field must be an array.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: Tally,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  const issue: IssueAccount = wrappedStates[tx.issue]?.data
  const proposals: ProposalAccount[] = tx.proposals.map((id: string) => wrappedStates[id].data)

  if (network.id !== daoConfig.daoAccount) {
    response.reason = 'To account must be the network account'
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
  if (issue.winnerId !== null) {
    response.reason = 'The winner for this issue has already been determined'
    return response
  }
  if (proposals.length !== issue.proposalCount) {
    response.reason =
      'The number of proposals sent in with the transaction doesnt match the issues proposalCount'
    return response
  }
  if (tx.timestamp < network.windows.graceWindow[0] || tx.timestamp > network.windows.graceWindow[1]) {
    response.reason = 'Network is not within the time window to tally votes for proposals'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: Tally,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  dapp: Shardus,
  applyResponse: ApplyResponse
): void {
  const from: NodeAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  const issue: IssueAccount = wrappedStates[tx.issue].data
  const margin = 100 / (2 * (issue.proposalCount + 1)) / 100

  const defaultProposal: ProposalAccount = wrappedStates[crypto.hash(`issue-${issue.number}-proposal-1`)].data
  const sortedProposals: ProposalAccount[] = tx.proposals
    .map((id: string) => wrappedStates[id].data)
    .sort((a: ProposalAccount, b: ProposalAccount) => b.power - a.power)
  let winner = defaultProposal

  for (const proposal of sortedProposals) {
    proposal.winner = false
  }

  if (sortedProposals.length >= 2) {
    const firstPlace = sortedProposals[0]
    const secondPlace = sortedProposals[1]
    const marginToWin = secondPlace.power + margin * secondPlace.power
    if (firstPlace.power >= marginToWin) {
      winner = firstPlace
    }
  }

  winner.winner = true // CHICKEN DINNER
  const next = winner.parameters
  const nextWindows: Windows = {
    proposalWindow: [
      network.windows.applyWindow[1],
      network.windows.applyWindow[1] + daoConfig.TIME_FOR_PROPOSALS,
    ],
    votingWindow: [
      network.windows.applyWindow[1] + daoConfig.TIME_FOR_PROPOSALS,
      network.windows.applyWindow[1] + daoConfig.TIME_FOR_PROPOSALS + daoConfig.TIME_FOR_VOTING,
    ],
    graceWindow: [
      network.windows.applyWindow[1] + daoConfig.TIME_FOR_PROPOSALS + daoConfig.TIME_FOR_VOTING,
      network.windows.applyWindow[1] +
        daoConfig.TIME_FOR_PROPOSALS +
        daoConfig.TIME_FOR_VOTING +
        daoConfig.TIME_FOR_GRACE,
    ],
    applyWindow: [
      network.windows.applyWindow[1] +
        daoConfig.TIME_FOR_PROPOSALS +
        daoConfig.TIME_FOR_VOTING +
        daoConfig.TIME_FOR_GRACE,
      network.windows.applyWindow[1] +
        daoConfig.TIME_FOR_PROPOSALS +
        daoConfig.TIME_FOR_VOTING +
        daoConfig.TIME_FOR_GRACE +
        daoConfig.TIME_FOR_APPLY,
    ],
  }

  const when = txTimestamp + 1000 * 10
  const value = {
    type: 'apply_tally',
    timestamp: when,
    network: daoConfig.daoAccount,
    next,
    nextWindows,
  }

  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = { address: daoConfig.daoAccount, value, when, source: daoConfig.daoAccount }

  issue.winnerId = winner.id

  from.timestamp = txTimestamp
  issue.timestamp = txTimestamp
  winner.timestamp = txTimestamp
  dapp.log('Applied tally tx', issue, winner)
}

export function transactionReceiptPass(
  tx: Tally,
  wrappedStates: WrappedStates,
  dapp: Shardus,
  applyResponse: ApplyResponse
): void {
  const issue: IssueAccount = wrappedStates[tx.issue].data
  const defaultProposal: ProposalAccount = wrappedStates[crypto.hash(`issue-${issue.number}-proposal-1`)].data
  const winner = defaultProposal

  const { address, value, when, source } = (applyResponse.appDefinedData as OurAppDefinedData).globalMsg
  dapp.setGlobal(address, value, when, source)
  dapp.log('PostApplied tally tx', issue, winner)
}

export function keys(tx: Tally, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [...tx.proposals, tx.issue, daoConfig.daoAccount]
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
    account = create.nodeAccount(accountId)
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
