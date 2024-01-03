import { Shardus, ShardusTypes } from '@shardus/core'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { NodeAccount } from '../accounts/nodeAccount'
import { UserAccount } from '../accounts/userAccount'

export interface GossipEmailHash {
  type: 'gossip_email_hash'
  nodeId: string
  account: string
  from: string
  emailHash: string
  verified: boolean
  timestamp: number
}

export function validateFields(
  tx: GossipEmailHash,
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
  if (typeof tx.account !== 'string') {
    response.success = false
    response.reason = 'tx "account" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.emailHash !== 'string') {
    response.success = false
    response.reason = 'tx "emailHash" field must be a string.'
    throw new Error(response.reason)
  }
  if (typeof tx.verified !== 'string') {
    response.success = false
    response.reason = 'tx "verified" field must be a string.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: GossipEmailHash,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  dapp: Shardus
): void {
  const account: UserAccount = wrappedStates[tx.account].data
  account.emailHash = tx.emailHash
  account.verified = tx.verified
  account.timestamp = txTimestamp
  dapp.log('Applied gossip_email_hash tx', account)
}

export function keys(tx: GossipEmailHash, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.account]
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
