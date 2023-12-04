import * as crypto from '@shardus/crypto-utils'
import { NetworkParameters } from '../types'

export interface ProposalAccount {
  id: string
  type: string
  power: number
  totalVotes: number
  parameters: NetworkParameters
  winner: boolean
  number: number | null
  hash: string
  timestamp: number
}

export const proposalAccount = (accountId: string, parameters?: NetworkParameters): ProposalAccount => {
  const proposal: ProposalAccount = {
    id: accountId,
    type: 'ProposalAccount',
    power: 0,
    totalVotes: 0,
    winner: false,
    parameters,
    number: null,
    hash: '',
    timestamp: 0,
  }
  proposal.hash = crypto.hashObj(proposal)
  return proposal
}
