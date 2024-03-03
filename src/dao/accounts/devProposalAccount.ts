import * as crypto from '@shardus/crypto-utils'
import { DeveloperPayment } from '../types'

export class DevProposalAccount {
  id: string
  approve = 0
  reject = 0
  title: string | null = null
  description: string | null = null
  totalVotes = 0
  totalAmount: number | null = null
  payAddress = ''
  payments: DeveloperPayment[] = []
  approved: boolean | null = null
  number: number | null = null
  timestamp = 0

  hash: string

  constructor(accountId: string) {
    this.id = accountId
    this.hash = crypto.hashObj({
      id: this.id,
      title: this.title,
      description: this.description,
      approve: this.approve,
      reject: this.reject,
      totalVotes: this.totalVotes,
      totalAmount: this.totalAmount,
      payAddress: this.payAddress,
      payments: this.payments,
      approved: this.approved,
      number: this.number,
      timestamp: this.timestamp,
    })
  }
}
