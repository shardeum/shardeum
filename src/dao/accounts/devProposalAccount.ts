import * as crypto from '@shardus/crypto-utils'
import { DeveloperPayment } from '../types'

export interface DevProposalAccount {
  id: string
  type: 'DevProposalAccount'
  approve: number
  reject: number
  title: string | null
  description: string | null
  totalVotes: number
  totalAmount: number | null
  payAddress: string
  payments: DeveloperPayment[]
  approved: boolean | null
  number: number | null
  hash: string
  timestamp: number
}

export const devProposalAccount = (accountId: string): DevProposalAccount => {
  const devProposal: DevProposalAccount = {
    id: accountId,
    type: 'DevProposalAccount',
    title: null,
    description: null,
    approve: 0,
    reject: 0,
    totalVotes: 0,
    totalAmount: null,
    payAddress: '',
    payments: [],
    approved: null,
    number: null,
    hash: '',
    timestamp: 0,
  }
  devProposal.hash = crypto.hashObj(devProposal)
  return devProposal
}
