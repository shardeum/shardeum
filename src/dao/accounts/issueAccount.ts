import * as crypto from '@shardus/crypto-utils'

export interface IssueAccount {
  id: string
  type: string
  active: boolean | null
  proposals: string[]
  proposalCount: number
  number: number | null
  winnerId: string | null
  hash: string
  timestamp: number
}

export const issueAccount = (accountId: string): IssueAccount => {
  const issue: IssueAccount = {
    id: accountId,
    type: 'IssueAccount',
    active: null,
    proposals: [],
    proposalCount: 0,
    number: null,
    winnerId: null,
    hash: '',
    timestamp: 0,
  }
  issue.hash = crypto.hashObj(issue)
  return issue
}
