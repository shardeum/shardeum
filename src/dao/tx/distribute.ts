import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import * as utils from '../utils'
import config from '../../config'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { UserAccount } from '../accounts/userAccount'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Distribute {
  type: 'distribute'
  from: string
  recipients: string[]
  amount: number
  timestamp: number
  sign: crypto.Signature
}

export function validateFields(tx: Distribute, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (Array.isArray(tx.recipients) !== true) {
    response.success = false
    response.reason = 'tx "recipients" field must be an array.'
    throw new Error(response.reason)
  }
  if (typeof tx.amount !== 'number' || tx.amount <= 0) {
    response.success = false
    response.reason = 'tx "amount" field must be a positive number.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: Distribute, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from] && wrappedStates[tx.from].data // type `DaoAccounts`
  const network: DaoGlobalAccount = wrappedStates[config.dao.daoAccount].data
  const recipients: UserAccount[] = tx.recipients.map((id: string) => wrappedStates[id].data)

  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (from === undefined || from === null) {
    response.reason = "from account doesn't exist"
    return response
  }
  for (const user of recipients) {
    if (!user) {
      response.reason = 'no account for one of the recipients'
      return response
    }
  }
  if (from.data.balance < recipients.length * tx.amount + network.current.transactionFee) {
    response.reason = "from account doesn't have sufficient balance to cover the transaction"
    return response
  }

  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: Distribute, txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[config.dao.daoAccount].data
  const recipients: UserAccount[] = tx.recipients.map((id: string) => wrappedStates[id].data)
  from.data.balance -= network.current.transactionFee
  from.data.transactions.push({ ...tx, txId })
  for (const user of recipients) {
    from.data.balance -= tx.amount
    user.data.balance += tx.amount
    user.data.transactions.push({ ...tx, txId })
  }
  from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)
  dapp.log('Applied distribute transaction', from, recipients)
}

export function keys(tx: Distribute, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [...tx.recipients, config.dao.daoAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    throw new Error('Account must exist in order to send a distribute transaction')
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
