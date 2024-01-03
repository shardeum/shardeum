import * as crypto from '@shardus/crypto-utils'

export class NodeAccount {
  id: string
  balance = 0
  nodeRewardTime = 0
  timestamp = 0

  hash: crypto.hexstring

  constructor(accountId: string) {
    this.id = accountId
    this.hash = crypto.hashObj({
      id: this.id,
      balance: this.balance,
      nodeRewardTime: this.nodeRewardTime,
      timestamp: this.timestamp,
    })
  }
}
