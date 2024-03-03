import * as crypto from '@shardus/crypto-utils'

export class AliasAccount {
  id: string
  inbox = ''
  address = ''
  timestamp = 0

  hash: string

  constructor(accountId: string) {
    this.id = accountId
    this.hash = crypto.hashObj({
      id: this.id,
      inbox: this.inbox,
      address: this.address,
      timestamp: this.timestamp,
    })
  }
}
