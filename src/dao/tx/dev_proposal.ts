import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import Decimal from 'decimal.js'
import * as utils from '../utils'
import _ from 'lodash'
import { daoConfig } from '../../config/dao'
import { DeveloperPayment } from '../types'
import { TransactionKeys, WrappedEVMAccount, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { DevIssueAccount } from '../accounts/devIssueAccount'
import { UserAccount } from '../accounts/userAccount'
import { DevProposalAccount } from '../accounts/devProposalAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { DaoTx } from '.'
import { SignedObject } from '@shardus/crypto-utils'
import { ensureShardusAddress } from '../../shardeum/evmAddress'

export interface IDevProposal {
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

export class DevProposal implements IDevProposal, DaoTx<UserAccount | DevProposalAccount> {
  readonly type = 'dev_proposal'
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

  constructor(data: IDevProposal) {
    this.from = data.from
    this.devProposal = data.devProposal
    this.devIssue = data.devIssue
    this.totalAmount = data.totalAmount
    this.payments = data.payments
    this.title = data.title
    this.description = data.description
    this.payAddress = data.payAddress
    this.timestamp = data.timestamp
    this.sign = data.sign
  }

  validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    if (typeof this.devIssue !== 'string') {
      response.success = false
      response.reason = 'tx "devIssue" field must be a string.'
      throw new Error(response.reason)
    } else if (typeof this.devProposal !== 'string') {
      response.success = false
      response.reason = 'tx "devProposal" field must be a string.'
      throw new Error(response.reason)
    } else if (typeof this.totalAmount !== 'number') {
      response.success = false
      response.reason = 'tx "totalAmount" field must be a number.'
      throw new Error(response.reason)
    } else if (this.totalAmount < 1) {
      response.success = false
      response.reason = 'Minimum "tx totalAmount" allowed for a developer proposal is 1 token'
      throw new Error(response.reason)
    } else if (this.totalAmount > 100000) {
      response.success = false
      response.reason = 'Maximum "tx totalAmount" allowed for a developer proposal is 100,000 tokens'
      throw new Error(response.reason)
    } else if (_.isEmpty(this.payments) || !Array.isArray(this.payments)) {
      response.success = false
      response.reason = 'tx "payments" field must be a non empty array.'
      throw new Error(response.reason)
    } else if (typeof this.title !== 'string') {
      response.success = false
      response.reason = 'tx "title" field must be a string.'
      throw new Error(response.reason)
    } else if (this.title.length < 1) {
      response.success = false
      response.reason = 'Minimum "tx title" field character count is 1'
      throw new Error(response.reason)
    } else if (this.title.length > 100) {
      response.success = false
      response.reason = 'Maximum "tx title" field character count is 100'
      throw new Error(response.reason)
    } else if (typeof this.description !== 'string') {
      response.success = false
      response.reason = 'tx "description" field must be a string.'
      throw new Error(response.reason)
    } else if (this.description.length < 1) {
      response.success = false
      response.reason = 'Minimum "tx description" field character count is 1'
      throw new Error(response.reason)
    } else if (this.description.length > 1000) {
      response.success = false
      response.reason = 'Maximum "tx description" field character count is 1000'
      throw new Error(response.reason)
    } else if (typeof this.payAddress !== 'string') {
      response.success = false
      response.reason = 'tx "payAddress" field must be a string.'
      throw new Error(response.reason)
    } else if (this.payAddress.length !== 64) {
      response.success = false
      response.reason = 'tx "payAddress" field length must be 64 characters (A valid public hex address)'
      throw new Error(response.reason)
    }
    return response
  }

  validate(
    wrappedStates: WrappedStates,
    response: ShardusTypes.IncomingTransactionResult
  ): ShardusTypes.IncomingTransactionResult {
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    const devIssue: DevIssueAccount = wrappedStates[ensureShardusAddress(this.devIssue)] && wrappedStates[ensureShardusAddress(this.devIssue)].data

    if (this.sign.owner !== this.from) {
      response.reason = 'not signed by from account'
      return response
    }
    if (crypto.verifyObj(this.getSignedObject()) === false) {
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
      this.devProposal !==
      crypto.hash(`dev-issue-${network.devIssue}-dev-proposal-${devIssue.devProposalCount + 1}`)
    ) {
      response.reason = 'Must give the next devIssue devProposalCount hash'
      return response
    }
    if (network.devWindows.proposalWindow.excludes(this.timestamp)) {
      response.reason = 'Network is not within the time window to accept developer proposals'
      return response
    }
    if (
      this.payments.reduce<number>(
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

  apply(txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
    const from: WrappedEVMAccount = wrappedStates[ensureShardusAddress(this.from)].data
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    const devIssue: DevIssueAccount = wrappedStates[ensureShardusAddress(this.devIssue)].data
    const devProposal: DevProposalAccount = wrappedStates[ensureShardusAddress(this.devProposal)].data

    // from.account.balance -= utils.maintenanceAmount(txTimestamp, from, network)

    devProposal.totalAmount = this.totalAmount
    devProposal.payAddress = ensureShardusAddress(this.payAddress)
    devProposal.title = this.title
    devProposal.description = this.description
    devProposal.payments = this.payments
    devIssue.devProposalCount++
    devProposal.number = devIssue.devProposalCount
    devIssue.devProposals.push(devProposal.id)

    // from.data.transactions.push({ ...this.getHashable(), txId })
    from.timestamp = txTimestamp
    devIssue.timestamp = txTimestamp
    devProposal.timestamp = txTimestamp
    dapp.log('Applied dev_proposal tx', from, devIssue, devProposal)
  }

  transactionReceiptPass(dapp: Shardus): void {
    dapp.log('PostApplied DevProposal tx')
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
      if (accountId === ensureShardusAddress(this.devProposal)) {
        account = new DevProposalAccount(accountId)
      } else {
        account = new UserAccount(accountId, this.timestamp)
      }
      accountCreated = true
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }

  getHashable(): object {
    return {
      from: this.from,
      devProposal: this.devProposal,
      devIssue: this.devIssue,
      totalAmount: this.totalAmount,
      payments: this.payments,
      title: this.title,
      description: this.description,
      payAddress: this.payAddress,
      timestamp: this.timestamp,
    }
  }

  getSignedObject(): SignedObject {
    return {
      ...this.getHashable(),
      sign: this.sign,
    }
  }
}
