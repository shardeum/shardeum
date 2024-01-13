import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import stringify from 'fast-stable-stringify'
import { DeveloperPayment, Windows, WindowRange } from '../types'
import { OurAppDefinedData, TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DevIssueAccount } from '../accounts/devIssueAccount'
import { DevProposalAccount } from '../accounts/devProposalAccount'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { NodeAccount } from '../accounts/nodeAccount'
import { ApplyResponse, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface DevTally {
  type: 'dev_tally'
  nodeId: string
  from: string
  devIssue: string
  devProposals: string[]
  timestamp: number
}

export function validateFields(
  tx: DevTally,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.nodeId !== 'string') {
    response.success = false
    response.reason = 'tx "nodeId" field must be a string.'
    throw new Error(response.reason)
  } else if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  } else if (typeof tx.devIssue !== 'string') {
    response.success = false
    response.reason = 'tx "devIssue" field must be a string.'
    throw new Error(response.reason)
  } else if (!Array.isArray(tx.devProposals)) {
    response.success = false
    response.reason = 'tx "devProposals" field must be an array.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: DevTally,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const devIssue: DevIssueAccount = wrappedStates[tx.devIssue] && wrappedStates[tx.devIssue].data
  const devProposals: DevProposalAccount[] = tx.devProposals.map((id: string) => wrappedStates[id].data)

  if (!devIssue) {
    response.reason = "devIssue doesn't exist"
    return response
  }
  if (devIssue.number !== network.issue) {
    response.reason = `This devIssue number ${devIssue.number} does not match the current network issue ${network.issue}`
    return response
  }
  if (devIssue.active === false) {
    response.reason = 'This devIssue is no longer active'
    return response
  }
  if (Array.isArray(devIssue.winners) && devIssue.winners.length > 0) {
    response.reason = `The winners for this devIssue has already been determined ${stringify(
      devIssue.winners
    )}`
    return response
  }
  if (network.id !== daoConfig.daoAccountAddress) {
    response.reason = 'To account must be the network account'
    return response
  }
  if (devProposals.length !== devIssue.devProposalCount) {
    response.reason = `The number of devProposals sent in with the transaction ${devProposals.length} doesn't match the devIssue proposalCount ${devIssue.devProposalCount}`
    return response
  }
  if (tx.timestamp < network.devWindows.graceWindow.start || tx.timestamp > network.devWindows.graceWindow.stop) {
    response.reason = 'Network is not within the time window to tally votes for developer proposals'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: DevTally,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  dapp: Shardus,
  applyResponse: ApplyResponse
): void {
  const from: NodeAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const devIssue: DevIssueAccount = wrappedStates[tx.devIssue].data
  const devProposals: DevProposalAccount[] = tx.devProposals.map((id: string) => wrappedStates[id].data)
  let nextDeveloperFund: DeveloperPayment[] = []

  for (const devProposal of devProposals) {
    if (devProposal.approve > devProposal.reject + devProposal.reject * 0.15) {
      devProposal.approved = true
      const payments = []
      for (const payment of devProposal.payments) {
        payments.push({
          timestamp: txTimestamp + daoConfig.TIME_FOR_DEV_GRACE + payment.delay,
          delay: payment.delay,
          amount: payment.amount * (devProposal.totalAmount ?? 0),
          address: devProposal.payAddress,
          id: crypto.hashObj(payment),
        })
      }
      nextDeveloperFund = [...nextDeveloperFund, ...payments]
      devProposal.timestamp = txTimestamp
      devIssue.winners.push(devProposal.id)
    } else {
      devProposal.approved = false
      devProposal.timestamp = txTimestamp
    }
  }

  const nextDevWindows: Windows = {
    proposalWindow: new WindowRange(
      network.devWindows.applyWindow.stop,
      network.devWindows.applyWindow.stop + daoConfig.TIME_FOR_DEV_PROPOSALS
    ),
    votingWindow: new WindowRange(
      network.devWindows.applyWindow.stop + daoConfig.TIME_FOR_DEV_PROPOSALS,
      network.devWindows.applyWindow.stop + daoConfig.TIME_FOR_DEV_PROPOSALS + daoConfig.TIME_FOR_DEV_VOTING
    ),
    graceWindow: new WindowRange(
      network.devWindows.applyWindow.stop + daoConfig.TIME_FOR_DEV_PROPOSALS + daoConfig.TIME_FOR_DEV_VOTING,
      network.devWindows.applyWindow.stop +
        daoConfig.TIME_FOR_DEV_PROPOSALS +
        daoConfig.TIME_FOR_DEV_VOTING +
        daoConfig.TIME_FOR_DEV_GRACE
    ),
    applyWindow: new WindowRange(
      network.devWindows.applyWindow.stop +
        daoConfig.TIME_FOR_DEV_PROPOSALS +
        daoConfig.TIME_FOR_DEV_VOTING +
        daoConfig.TIME_FOR_DEV_GRACE,
      network.devWindows.applyWindow.stop +
        daoConfig.TIME_FOR_DEV_PROPOSALS +
        daoConfig.TIME_FOR_DEV_VOTING +
        daoConfig.TIME_FOR_DEV_GRACE +
        daoConfig.TIME_FOR_DEV_APPLY
    ),
  }

  const when = txTimestamp + 1000 * 10

  const value = {
    type: 'apply_dev_tally',
    timestamp: when,
    network: daoConfig.daoAccountAddress,
    nextDeveloperFund,
    nextDevWindows,
  }

  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = {
    address: daoConfig.daoAccountAddress,
    value,
    when,
    source: daoConfig.daoAccountAddress,
  }

  from.timestamp = txTimestamp
  devIssue.timestamp = txTimestamp
  dapp.log('Applied dev_tally tx', devIssue, devProposals)
}

export function transactionReceiptPass(dapp: Shardus, applyResponse: ApplyResponse): void {
  const { address, value, when, source } = (applyResponse.appDefinedData as OurAppDefinedData).globalMsg
  dapp.setGlobal(address, value, when, source)
  dapp.log('PostApplied dev_tally tx')
}

export function keys(tx: DevTally, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [...tx.devProposals, tx.devIssue, daoConfig.daoAccountAddress]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: NodeAccount,
  accountId: string,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    account = new NodeAccount(accountId)
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
