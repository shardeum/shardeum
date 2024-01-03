import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import Decimal from 'decimal.js'
import * as utils from '../utils'
import { create } from '../accounts'
import _ from 'lodash'
import { daoConfig } from '../../config/dao'
import { DeveloperPayment } from '../types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { DevIssueAccount } from '../accounts/devIssueAccount'
import { UserAccount } from '../accounts/userAccount'
import { DevProposalAccount } from '../accounts/devProposalAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface DevProposal {
  type: 'dev_proposal'
  from: string
  devProposal: string
  devIssue: string
  totalAmount: number
  payments: DeveloperPayment[]
  title: string
  description: string
  payAddress: string
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(
  tx: DevProposal,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.devIssue !== 'string') {
    response.success = false
    response.reason = 'tx "devIssue" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.devProposal !== 'string') {
    response.success = false
    response.reason = 'tx "devProposal" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.totalAmount !== 'number') {
    response.success = false
    response.reason = 'tx "totalAmount" field must be a number.'
    throw new Error(response.reason)
  }
  if (tx.totalAmount < 1) {
    response.success = false
    response.reason = 'Minimum "tx totalAmount" allowed for a developer proposal is 1 token'
    throw new Error(response.reason)
  }
  if (tx.totalAmount > 100000) {
    response.success = false
    response.reason = 'Maximum "tx totalAmount" allowed for a developer proposal is 100,000 tokens'
    throw new Error(response.reason)
  }
  if (_.isEmpty(tx.payments) || !Array.isArray(tx.payments)) {
    response.success = false
    response.reason = 'tx "payments" field must be a non empty array.'
    throw new Error(response.reason)
  }
  if (typeof tx.title !== 'string') {
    response.success = false
    response.reason = 'tx "title" field must be a string.'
    throw new Error(response.reason)
  }
  if (tx.title.length < 1) {
    response.success = false
    response.reason = 'Minimum "tx title" field character count is 1'
    throw new Error(response.reason)
  }
  if (tx.title.length > 100) {
    response.success = false
    response.reason = 'Maximum "tx title" field character count is 100'
    throw new Error(response.reason)
  }
  if (typeof tx.description !== 'string') {
    response.success = false
    response.reason = 'tx "description" field must be a string.'
    throw new Error(response.reason)
  }
  if (tx.description.length < 1) {
    response.success = false
    response.reason = 'Minimum "tx description" field character count is 1'
    throw new Error(response.reason)
  }
  if (tx.description.length > 1000) {
    response.success = false
    response.reason = 'Maximum "tx description" field character count is 1000'
    throw new Error(response.reason)
  }
  if (typeof tx.payAddress !== 'string') {
    response.success = false
    response.reason = 'tx "payAddress" field must be a string.'
    throw new Error(response.reason)
  }
  if (tx.payAddress.length !== 64) {
    response.success = false
    response.reason = 'tx "payAddress" field length must be 64 characters (A valid public hex address)'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: DevProposal,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  const devIssue: DevIssueAccount = wrappedStates[tx.devIssue] && wrappedStates[tx.devIssue].data

  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (!devIssue) {
    response.reason = "devIssue doesn't exist"
    return response
  }
  if (devIssue.number !== network.devIssue) {
    response.reason = `This dev issue number ${devIssue.number} does not match the current network dev issue ${network.devIssue}`
    return response
  }
  if (devIssue.active === false) {
    response.reason = 'This devIssue is no longer active'
    return response
  }
  if (
    tx.devProposal !==
    crypto.hash(`dev-issue-${network.devIssue}-dev-proposal-${devIssue.devProposalCount + 1}`)
  ) {
    response.reason = 'Must give the next devIssue devProposalCount hash'
    return response
  }
  if (
    tx.timestamp < network.devWindows.devProposalWindow[0] ||
    tx.timestamp > network.devWindows.devProposalWindow[1]
  ) {
    response.reason = 'Network is not within the time window to accept developer proposals'
    return response
  }
  if (
    tx.payments.reduce<number>(
      (acc: number, payment: DeveloperPayment) => new Decimal(payment.amount).plus(acc).toNumber(),
      0
    ) > 1
  ) {
    response.reason = 'tx payment amounts added up to more than 100%'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: DevProposal,
  txTimestamp: number,
  txId: string,
  wrappedStates: WrappedStates,
  dapp: Shardus
): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccount].data
  const devIssue: DevIssueAccount = wrappedStates[tx.devIssue].data
  const devProposal: DevProposalAccount = wrappedStates[tx.devProposal].data

  from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)

  devProposal.totalAmount = tx.totalAmount
  devProposal.payAddress = tx.payAddress
  devProposal.title = tx.title
  devProposal.description = tx.description
  devProposal.payments = tx.payments
  devIssue.devProposalCount++
  devProposal.number = devIssue.devProposalCount
  devIssue.devProposals.push(devProposal.id)

  from.data.transactions.push({ ...tx, txId })
  from.timestamp = txTimestamp
  devIssue.timestamp = txTimestamp
  devProposal.timestamp = txTimestamp
  dapp.log('Applied dev_proposal tx', from, devIssue, devProposal)
}

export function keys(tx: DevProposal, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.devIssue, tx.devProposal, daoConfig.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: UserAccount | DevProposalAccount,
  accountId: string,
  tx: DevProposal,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    if (accountId === tx.devProposal) {
      account = create.devProposalAccount(accountId)
    } else {
      account = new UserAccount(accountId, tx.timestamp)
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
