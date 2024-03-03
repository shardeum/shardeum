import * as crypto from '@shardus/crypto-utils'
import { DeveloperPayment } from '../types'

export interface UserAccountData {
  balance: number
  toll: number | null
  chats: object
  friends: object
  stake?: number
  remove_stake_request: number | null
  transactions: object[]
  payments: DeveloperPayment[]
}

export class UserAccount {
  id: string
  data: UserAccountData = {
    balance: 50,
    stake: 0,
    remove_stake_request: null,
    toll: null,
    chats: {},
    friends: {},
    transactions: [],
    payments: [],
  }
  alias: string | null = null
  emailHash: string | null = null
  verified = false
  lastMaintenance: number
  claimedSnapshot = false
  timestamp = 0

  hash: string

  constructor(accountId: string, timestamp: number) {
    this.id = accountId
    this.lastMaintenance = timestamp
    this.hash = crypto.hashObj({
      id: this.id,
      data: this.data,
      alias: this.alias,
      emailHash: this.emailHash,
      verified: this.verified,
      lastMaintenance: this.lastMaintenance,
      claimedSnapshot: this.claimedSnapshot,
      timestamp: this.timestamp,
    })
  }
}
