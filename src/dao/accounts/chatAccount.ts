import * as crypto from '@shardus/crypto-utils'

export interface ChatAccount {
  id: string
  type: 'ChatAccount'
  messages: unknown[]
  timestamp: number
  hash: string
}

export const chatAccount = (accountId: string): ChatAccount => {
  const chat: ChatAccount = {
    id: accountId,
    type: 'ChatAccount',
    messages: [],
    timestamp: 0,
    hash: '',
  }
  chat.hash = crypto.hashObj(chat)
  return chat
}
