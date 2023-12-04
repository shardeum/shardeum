import { Shardus, ShardusTypes } from '@shardus/core'
import { create } from '../accounts'
import config from '../../config'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { Node } from '@shardus/types/build/src/p2p/NodeListTypes'
import { NodeAccount } from '../accounts/nodeAccount'
import { UserAccount } from '../accounts/userAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'

export interface NodeReward {
  type: 'node_reward'
  nodeId: string
  from: string
  to: string
  timestamp: number
}

export function validateFields(tx: NodeReward, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string'
    throw new Error(response.reason)
  }
  if (typeof tx.nodeId !== 'string') {
    response.success = false
    response.reason = 'tx "nodeId" field must be a string'
    throw new Error(response.reason)
  }
  if (typeof tx.to !== 'string') {
    response.success = false
    response.reason = 'tx "to" field must be a string'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: NodeReward, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult, dapp: Shardus): ShardusTypes.IncomingTransactionResult {
  const from = wrappedStates[tx.from] && wrappedStates[tx.from].data
  const network: DaoGlobalAccount = wrappedStates[config.dao.networkAccount].data
  let nodeInfo: Node
  try {
    nodeInfo = dapp.getNode(tx.nodeId)
  } catch (err) {
    dapp.log(err)
  }
  if (!nodeInfo) {
    response.reason = 'no nodeInfo'
    return response
  }
  if (tx.timestamp - nodeInfo.activeTimestamp < network.current.nodeRewardInterval) {
    response.reason = 'Too early for this node to get a reward'
    return response
  }
  if (!from) {
    response.success = true
    response.reason = 'This transaction in valid'
    return response
  }
  if (from) {
    if (!from.nodeRewardTime) {
      response.success = true
      response.reason = 'This transaction in valid'
      return response
    }
    if (tx.timestamp - from.nodeRewardTime < network.current.nodeRewardInterval) {
      response.reason = 'Too early for this node to get paid'
      return response
    }
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: NodeReward, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: NodeAccount = wrappedStates[tx.from].data
  const to: UserAccount = wrappedStates[tx.to].data
  const network: DaoGlobalAccount = wrappedStates[config.dao.networkAccount].data
  //const nodeAccount: NodeAccount = to
  from.balance += network.current.nodeRewardAmount
  dapp.log(`Reward from ${tx.from} to ${tx.to}`)
  if (tx.from !== tx.to) {
    dapp.log('Node reward to and from are different.')
    dapp.log('TO ACCOUNT', to.data)
    if (to.data.stake >= network.current.stakeRequired) {
      to.data.balance += from.balance
      if (to.data.remove_stake_request) to.data.remove_stake_request = null
      from.balance = 0
      to.timestamp = txTimestamp
    }
  }
  from.nodeRewardTime = txTimestamp
  from.timestamp = txTimestamp
  //NodeAccount does not have transactions
  //to.data.transactions.push({ ...tx, txId })
  dapp.log('Applied node_reward tx', from, to)
}

export function keys(tx: NodeReward, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [tx.to, config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: NodeAccount | UserAccount, accountId: string, tx: NodeReward, accountCreated = false): WrappedResponse {
  if (!account) {
    if (accountId === tx.nodeId) {
      account = create.nodeAccount(accountId)
    } else {
      throw new Error('UserAccount must already exist for the node_reward transaction')
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
