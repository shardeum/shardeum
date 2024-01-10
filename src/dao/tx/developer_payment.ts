import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import stringify from 'fast-stable-stringify'
import { DeveloperPayment } from '../types'
import { OurAppDefinedData, TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { UserAccount } from '../accounts/userAccount'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { NodeAccount } from '../accounts/nodeAccount'
import { ApplyResponse, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { Signature } from '@shardus/crypto-utils'

export interface DevPayment {
  type: 'dev_payment'
  nodeId: string
  from: string
  developer: string
  payment: DeveloperPayment
  timestamp: number
  sign: Signature
}

export function validateFields(
  tx: DevPayment,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.nodeId !== 'string') {
    response.success = false
    response.reason = 'tx "nodeId" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.payment !== 'object') {
    response.success = false
    response.reason = 'tx "payment" field must be an object.'
    throw new Error(response.reason)
  }
  if (typeof tx.developer !== 'string') {
    response.success = false
    response.reason = 'tx "developer" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.payment.id !== 'string') {
    response.success = false
    response.reason = 'tx "payment.id" must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.payment.address !== 'string') {
    response.success = false
    response.reason = 'tx "payment.address" must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.payment.amount !== 'number') {
    response.success = false
    response.reason = 'tx "payment.amount" must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.payment.delay !== 'number') {
    response.success = false
    response.reason = 'tx "payment.delay" must be a number.'
    throw new Error(response.reason)
  }
  if (typeof tx.payment.timestamp !== 'number') {
    response.success = false
    response.reason = 'tx "payment.timestamp" must be a number.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: DevPayment,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const developer: UserAccount = wrappedStates[tx.developer] && wrappedStates[tx.developer].data

  if (tx.timestamp < tx.payment.timestamp) {
    response.reason = 'This payment is not ready to be released'
    return response
  }
  if (network.id !== daoConfig.daoAccountAddress) {
    response.reason = 'To account must be the network account'
    return response
  }
  if (!network.developerFund.some((payment: DeveloperPayment) => payment.id === tx.payment.id)) {
    response.reason = 'This payment doesnt exist'
    return response
  }
  if (!developer || !developer.data) {
    response.reason = `No account exists for the passed in tx.developer ${tx.developer}`
    return response
  }
  if (tx.developer !== tx.payment.address) {
    response.reason = `tx developer ${tx.developer} does not match address in payment ${tx.payment.address}`
    return response
  }
  if (developer.data.payments.some((payment) => payment.id === tx.payment.id)) {
    response.reason = `This payment ${stringify(tx.payment)} has already been given to the developer ${
      tx.developer
    }`
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: DevPayment,
  txTimestamp: number,
  txId: string,
  wrappedStates: WrappedStates,
  dapp: Shardus,
  applyResponse: ShardusTypes.ApplyResponse
): void {
  const from: NodeAccount = wrappedStates[tx.from].data

  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const developer: UserAccount = wrappedStates[tx.developer].data
  developer.data.payments.push(tx.payment)
  developer.data.balance += tx.payment.amount
  developer.data.transactions.push({ ...tx, txId })

  const when = txTimestamp + 1000 * 10
  const value = {
    type: 'apply_developer_payment',
    timestamp: when,
    network: daoConfig.daoAccountAddress,
    developerFund: network.developerFund.filter((payment: DeveloperPayment) => payment.id !== tx.payment.id),
  }

  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = {
    address: daoConfig.daoAccountAddress,
    value,
    when,
    source: daoConfig.daoAccountAddress,
  }

  developer.timestamp = txTimestamp
  from.timestamp = txTimestamp
  dapp.log('Applied developer_payment tx', from, developer, tx.payment)
}

export function transactionReceiptPass(dapp: Shardus, applyResponse: ApplyResponse): void {
  const { address, value, when, source } = (applyResponse.appDefinedData as OurAppDefinedData).globalMsg
  dapp.setGlobal(address, value, when, source)
  dapp.log('PostApplied developer_payment tx')
}

export function keys(tx: DevPayment, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.developer, daoConfig.daoAccountAddress]
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
