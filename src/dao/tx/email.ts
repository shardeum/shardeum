import * as crypto from '@shardus/crypto-utils'
import axios from 'axios'
import { Shardus, ShardusTypes } from '@shardus/core'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface Email {
  type: 'email'
  signedTx: {
    emailHash: string
    from: string
    sign: crypto.Signature
  }
  email: string
  timestamp: number
}

export function validateFields(
  tx: Email,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.signedTx !== 'object') {
    response.success = false
    response.reason = 'tx "signedTx" field must be an object.'
    throw new Error(response.reason)
  }

  const signedTx = tx.signedTx

  if (signedTx) {
    if (typeof signedTx !== 'object') {
      response.success = false
      response.reason = '"signedTx" must be a object.'
      throw new Error(response.reason)
    }
    if (typeof signedTx.sign !== 'object') {
      response.success = false
      response.reason = '"sign" property on signedTx must be an object.'
      throw new Error(response.reason)
    }
    if (typeof signedTx.from !== 'string') {
      response.success = false
      response.reason = '"From" must be a string.'
      throw new Error(response.reason)
    }
    if (typeof signedTx.emailHash !== 'string') {
      response.success = false
      response.reason = '"emailHash" must be a string.'
      throw new Error(response.reason)
    }
  }
  if (typeof tx.email !== 'string') {
    response.success = false
    response.reason = '"email" must be a string.'
    throw new Error(response.reason)
  }
  if (tx.email.length > 30) {
    response.success = false
    response.reason = '"Email" length must be less than 31 characters (30 max)'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: Email,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const source: UserAccount = wrappedStates[tx.signedTx.from] && wrappedStates[tx.signedTx.from].data
  if (!source) {
    response.reason = 'no account associated with address in signed tx'
    return response
  }
  if (tx.signedTx.sign.owner !== tx.signedTx.from) {
    response.reason = 'not signed by from account'
    return response
  }
  if (crypto.verifyObj(tx.signedTx) === false) {
    response.reason = 'incorrect signing'
    return response
  }
  if (tx.signedTx.emailHash !== crypto.hash(tx.email)) {
    response.reason = 'Hash of the email does not match the signed email hash'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: Email, wrappedStates: WrappedStates, dapp: Shardus): void {
  const source: UserAccount = wrappedStates[tx.signedTx.from].data
  const nodeId = dapp.getNodeId()
  const { address } = dapp.getNode(nodeId)
  const [closest] = dapp.getClosestNodes(tx.signedTx.from, 5)
  if (nodeId === closest) {
    const baseNumber = 99999
    const randomNumber = Math.floor(Math.random() * 899999) + 1
    const verificationNumber = baseNumber + randomNumber

    axios.post('http://arimaa.com/mailAPI/index.cgi', {
      from: 'liberdus.verify',
      to: `${tx.email}`,
      subject: 'Verify your email for liberdus',
      message: `Please verify your email address by sending a "verify" transaction with the number: ${verificationNumber}`,
      secret: 'Liberdus', // pragma: allowlist secret
    })

    dapp.put({
      type: 'gossip_email_hash',
      nodeId,
      account: source.id,
      from: address,
      emailHash: tx.signedTx.emailHash,
      verified: crypto.hash(`${verificationNumber}`),
      timestamp: Date.now(),
    })
  }
  dapp.log('Applied email tx', source)
}

export function keys(tx: Email, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.signedTx.from]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: UserAccount,
  accountId: string,
  tx: Email,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    account = new UserAccount(accountId, tx.timestamp)
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
