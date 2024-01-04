import * as crypto from '@shardus/crypto-utils'

export class DevIssueAccount {
  id: string
  devProposals: string[] = []
  devProposalCount = 0
  winners: string[] = []
  active: boolean | null = null
  number: number | null = null
  timestamp = 0

  hash: crypto.hexstring

  constructor(accountId: string) {
    this.id = accountId
    this.hash = crypto.hashObj({
      id: this.id,
      devProposals: this.devProposals,
      devProposalCount: this.devProposalCount,
      winners: this.winners,
      active: this.active,
      number: this.number,
      timestamp: this.timestamp,
    })
  }
}
