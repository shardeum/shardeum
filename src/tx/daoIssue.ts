import { ShardusTypes } from '@shardus/core'
import {
  ClaimRewardTX,
  WrappedStates
} from '../shardeum/shardeumTypes'

export async function injectDaoIssueTx(
  shardus,
  eventData: ShardusTypes.ShardusEvent,
  nodeAccount
): Promise<{
  success: boolean
  reason: string
  status: number
}> {
  // [TODO] [AS] Fill this out for creating DAO Issues
  return
}

export function validateDaoIssueTx(tx: ClaimRewardTX): { isValid: boolean; reason: string } {
  // [TODO] [AS] Fill this out for creating DAO Issues
  return
}

export function validateDaoIssueState(tx: ClaimRewardTX, shardus): { result: string; reason: string } {
  // [TODO] [AS] Fill this out for creating DAO Issues
  return
}

export async function applyDaoIssueTx(
  shardus,
  tx: ClaimRewardTX,
  wrappedStates: WrappedStates,
  txTimestamp: number,
  applyResponse: ShardusTypes.ApplyResponse
): Promise<void> {

  // FROM LIBERDUS:

  // const from: NodeAccount = wrappedStates[tx.from].data

  // const network: NetworkAccount = wrappedStates[config.networkAccount].data
  // const issue: IssueAccount = wrappedStates[tx.issue].data
  // const proposal: ProposalAccount = wrappedStates[tx.proposal].data

  // proposal.parameters = _.cloneDeep(network.current)
  // proposal.parameters.title = 'Default parameters'
  // proposal.parameters.description = 'Keep the current network parameters as they are'
  // proposal.number = 1

  // issue.number = network.issue
  // issue.active = true
  // issue.proposals.push(proposal.id)
  // issue.proposalCount++

  // from.timestamp = txTimestamp
  // issue.timestamp = txTimestamp
  // proposal.timestamp = txTimestamp
  // dapp.log('Applied issue tx', issue, proposal)

  return
}
