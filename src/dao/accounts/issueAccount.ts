import * as crypto from '@shardus/crypto-utils'

export class IssueAccount {
  id: string
  active: boolean | null = null
  proposals: string[] = []
  proposalCount = 0
  number: number | null = null
  winnerId: string | null = null
  timestamp = 0

  hash: crypto.hexstring

  constructor(accountId: string) {
    this.id = accountId
    this.hash = crypto.hashObj({
      id: this.id,
      active: this.active,
      proposals: this.proposals,
      proposalCount: this.proposalCount,
      number: this.number,
      winnerId: this.winnerId,
      timestamp: this.timestamp,
    })
  }
}
