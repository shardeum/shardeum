import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import * as utils from '../utils'
import create from '../accounts'
import config from '../../config'
import { Message } from '../types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { UserAccount } from '../accounts/userAccount'
import { ChatAccount } from '../accounts/chatAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { NetworkAccount } from '../accounts/networkAccount'

export function validateFields(tx: Message, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.to !== 'string') {
    response.success = false
    response.reason = 'tx "to" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.chatId !== 'string') {
    response.success = false
    response.reason = 'tx "chatId" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.message !== 'string') {
    response.success = false
    response.reason = 'tx "message" field must be a string.'
    throw new Error(response.reason)
  }
  if (tx.message.length > 5000) {
    response.success = false
    response.reason = 'tx "message" length must be less than 5000 characters.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: Message, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from] && wrappedStates[tx.from].data
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
  const to = wrappedStates[tx.to] && wrappedStates[tx.to].data
  if (tx.sign.owner !== tx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (typeof from === 'undefined' || from === null) {
    response.reason = '"from" account does not exist.'
    return response
  }
  if (typeof to === 'undefined' || to === null) {
    response.reason = '"target" account does not exist.'
    return response
  }
  if (to.data.friends[tx.from]) {
    if (from.data.balance < network.current.transactionFee) {
      response.reason = `from account does not have sufficient funds: ${from.data.balance} to cover transaction fee: ${network.current.transactionFee}.`
      return response
    }
  } else {
    if (to.data.toll === null) {
      if (from.data.balance < network.current.defaultToll + network.current.transactionFee) {
        response.reason = `from account does not have sufficient funds ${from.data.balance} to cover the default toll + transaction fee ${network.current
          .defaultToll + network.current.transactionFee}.`
        return response
      }
    } else {
      if (from.data.balance < to.data.toll + network.current.transactionFee) {
        response.reason = 'from account does not have sufficient funds.'
        return response
      }
    }
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: Message, txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: UserAccount = wrappedStates[tx.from].data
  const to: UserAccount = wrappedStates[tx.to].data
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data
  const chat = wrappedStates[tx.chatId].data
  from.data.balance -= network.current.transactionFee
  if (!to.data.friends[from.id]) {
    if (to.data.toll === null) {
      from.data.balance -= network.current.defaultToll
      to.data.balance += network.current.defaultToll
    } else {
      from.data.balance -= to.data.toll
      to.data.balance += to.data.toll
    }
  }
  from.data.balance -= utils.maintenanceAmount(txTimestamp, from, network)

  if (!from.data.chats[tx.to]) from.data.chats[tx.to] = tx.chatId
  if (!to.data.chats[tx.from]) to.data.chats[tx.from] = tx.chatId

  chat.messages.push(tx.message)
  from.data.transactions.push({ ...tx, txId })
  to.data.transactions.push({ ...tx, txId })

  chat.timestamp = txTimestamp
  from.timestamp = txTimestamp
  to.timestamp = txTimestamp

  dapp.log('Applied message tx', chat, from, to)
}

export function keys(tx: Message, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.to, tx.chatId, config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: UserAccount | ChatAccount, accountId: string, tx: Message, accountCreated = false): WrappedResponse {
  if (!account) {
    if (accountId === tx.chatId) {
      account = create.chatAccount(accountId)
    } else {
      throw Error('Account must exist in order to send a message transaction')
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
