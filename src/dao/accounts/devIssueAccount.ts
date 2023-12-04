import * as crypto from '@shardus/crypto-utils'

export interface DevIssueAccount {
  id: string
  type: string
  devProposals: string[]
  devProposalCount: number
  winners: string[]
  active: boolean | null
  number: number | null
  hash: string
  timestamp: number
}

export const devIssueAccount = (accountId: string): DevIssueAccount => {
  const devIssue: DevIssueAccount = {
    id: accountId,
    type: 'DevIssueAccount',
    devProposals: [],
    devProposalCount: 0,
    winners: [],
    hash: '',
    active: null,
    number: null,
    timestamp: 0,
  }
  devIssue.hash = crypto.hashObj(devIssue)
  return devIssue
}
