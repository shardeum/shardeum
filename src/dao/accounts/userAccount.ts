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

export interface UserAccount {
  id: string
  type: 'UserAccount'
  data: UserAccountData
  alias: string | null
  emailHash: string | null
  verified: string | boolean
  lastMaintenance: number
  claimedSnapshot: boolean
  timestamp: number
  hash: string
}

export const userAccount = (accountId: string, timestamp: number): UserAccount => {
  const account: UserAccount = {
    id: accountId,
    type: 'UserAccount',
    data: {
      balance: 50,
      stake: 0,
      remove_stake_request: null,
      toll: null,
      chats: {},
      friends: {},
      transactions: [],
      payments: [],
    },
    alias: null,
    emailHash: null,
    verified: false,
    hash: '',
    claimedSnapshot: false,
    lastMaintenance: timestamp,
    timestamp: 0,
  }
  account.hash = crypto.hashObj(account)
  return account
}
