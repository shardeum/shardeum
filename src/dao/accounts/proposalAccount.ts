import * as crypto from '@shardus/crypto-utils'
import { NetworkParameters } from '../../shardeum/shardeumTypes'

export class ProposalAccount {
  id: string
  power = 0
  totalVotes = 0
  parameters: NetworkParameters
  winner = false
  number = null
  timestamp = 0

  hash: string

  constructor(accountId: string, parameters?: NetworkParameters) {
    this.id = accountId
    this.parameters = parameters
    this.hash = crypto.hashObj({
      id: this.id,
      power: this.power,
      totalVotes: this.totalVotes,
      parameters: this.parameters,
      winner: this.winner,
      number: this.number,
      timestamp: this.timestamp,
    })
  }
}
