import * as crypto from '@shardus/crypto-utils'
import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import { DevIssueAccount } from '../accounts/devIssueAccount'
import { TransactionKeys, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { NodeAccount } from '../accounts/nodeAccount'
import { WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { DaoTx } from '.'
import { UserAccount } from '../accounts/userAccount'
import { SignedObject } from '@shardus/crypto-utils'
import { ensureShardusAddress } from '../../shardeum/evmAddress'

export interface IDevIssue {
  type: 'dev_issue'
  nodeId: string
  from: string
  devIssue: string
  timestamp: number
}

export function validateFields(
  tx: IDevIssue,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof this.nodeId !== 'string') {
    response.success = false
    response.reason = 'tx "nodeId" field must be a string.'
    throw new Error(response.reason)
  } else if (typeof this.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string.'
    throw new Error(response.reason)
  } else if (typeof this.devIssue !== 'string') {
    response.success = false
    response.reason = 'tx "devIssue" field must be a string.'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: IDevIssue,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const devIssue: DevIssueAccount = wrappedStates[ensureShardusAddress(this.devIssue)] && wrappedStates[ensureShardusAddress(this.devIssue)].data
  // let nodeInfo
  // try {
  //   nodeInfo = dapp.getNode(this.nodeId)
  // } catch (err) {
  //   dapp.log(err)
  // }
  // if (!nodeInfo) {
  //   response.reason = 'no nodeInfo'
  //   return response
  // }
  if (devIssue.active !== null) {
    response.reason = 'devIssue is already active'
    return response
  }
  const networkDevIssueHash = crypto.hash(`dev-issue-${network.devIssue}`)
  if (this.devIssue !== networkDevIssueHash) {
    response.reason = `devIssue address (${this.devIssue}) does not match current network devIssue address (${networkDevIssueHash})`
    return response
  }
  if (network.devWindows.proposalWindow.excludes(this.timestamp)) {
    response.reason = 'Network is not within the time window to generate developer proposal issues'
    return response
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: IDevIssue, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus): void {
  const from: NodeAccount = wrappedStates[ensureShardusAddress(this.from)].data
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
  const devIssue: DevIssueAccount = wrappedStates[ensureShardusAddress(this.devIssue)].data

  devIssue.number = network.devIssue
  devIssue.active = true

  from.timestamp = txTimestamp
  devIssue.timestamp = txTimestamp
  dapp.log('Applied dev_issue tx', devIssue)
}

export function keys(tx: IDevIssue, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [this.from]
  result.targetKeys = [this.devIssue, daoConfig.daoAccountAddress]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: NodeAccount | DevIssueAccount,
  accountId: string,
  tx: IDevIssue,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    if (accountId === ensureShardusAddress(this.devIssue)) {
      account = new DevIssueAccount(accountId)
    } else {
      account = new NodeAccount(accountId)
    }
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}

export class DevIssue implements IDevIssue, DaoTx<NodeAccount | DevIssueAccount> {
  readonly type = 'dev_issue'
  nodeId: string
  from: string
  devIssue: string
  timestamp: number

  constructor(data: IDevIssue) {
    this.nodeId = data.nodeId
    this.from = data.from
    this.devIssue = data.devIssue
    this.timestamp = data.timestamp
  }

  validateFields(response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
    if (typeof this.nodeId !== 'string') {
      response.success = false
      response.reason = 'tx "nodeId" field must be a string.'
      throw new Error(response.reason)
    } else if (typeof this.from !== 'string') {
      response.success = false
      response.reason = 'tx "from" field must be a string.'
      throw new Error(response.reason)
    } else if (typeof this.devIssue !== 'string') {
      response.success = false
      response.reason = 'tx "devIssue" field must be a string.'
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
    // let nodeInfo
    // try {
    //   nodeInfo = dapp.getNode(this.nodeId)
    // } catch (err) {
    //   dapp.log(err)
    // }
    // if (!nodeInfo) {
    //   response.reason = 'no nodeInfo'
    //   return response
    // }
    if (devIssue.active !== null) {
      response.reason = 'devIssue is already active'
      return response
    }
    const networkDevIssueHash = crypto.hash(`dev-issue-${network.devIssue}`)
    if (this.devIssue !== networkDevIssueHash) {
      response.reason = `devIssue address (${this.devIssue}) does not match current network devIssue address (${networkDevIssueHash})`
      return response
    }
    if (network.devWindows.proposalWindow.excludes(this.timestamp)) {
      response.reason = 'Network is not within the time window to generate developer proposal issues'
      return response
    }
    response.success = true
    response.reason = 'This transaction is valid!'
    return response
  }

  apply(txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void {
    const from: NodeAccount = wrappedStates[ensureShardusAddress(this.from)].data
    const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data
    const devIssue: DevIssueAccount = wrappedStates[ensureShardusAddress(this.devIssue)].data

    devIssue.number = network.devIssue
    devIssue.active = true

    from.timestamp = txTimestamp
    devIssue.timestamp = txTimestamp
    dapp.log('Applied dev_issue tx', devIssue)
  }

  transactionReceiptPass(dapp: Shardus): void {
    dapp.log('PostApplied DevProposal tx')
  }

  keys(result: TransactionKeys): TransactionKeys {
    result.sourceKeys = [this.from]
    result.targetKeys = [this.devIssue, daoConfig.daoAccountAddress]
    result.allKeys = [...result.sourceKeys, ...result.targetKeys]
    return result
  }

  createRelevantAccount(
    dapp: Shardus,
    account: NodeAccount | DevIssueAccount,
    accountId: string,
    accountCreated = false
  ): WrappedResponse {
    if (!account) {
      if (accountId === ensureShardusAddress(this.devIssue)) {
        account = new DevIssueAccount(accountId)
      } else {
        account = new NodeAccount(accountId)
      }
      accountCreated = true
    }
    return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
  }

  getHashable(): object {
    return {
      nodeId: this.nodeId,
      from: this.from,
      devIssue: this.devIssue,
      timestamp: this.timestamp,
    }
  }
}
