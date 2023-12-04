import * as crypto from '@shardus/crypto-utils'

export interface NodeAccount {
  id: string
  type: string
  balance: number
  nodeRewardTime: number
  hash: string
  timestamp: number
}

export const nodeAccount = (accountId: string): NodeAccount => {
  const account: NodeAccount = {
    id: accountId,
    type: 'NodeAccount',
    balance: 0,
    nodeRewardTime: 0,
    hash: '',
    timestamp: 0,
  }
  account.hash = crypto.hashObj(account)
  return account
}
