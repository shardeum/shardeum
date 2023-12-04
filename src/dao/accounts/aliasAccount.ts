import * as crypto from '@shardus/crypto-utils'

export interface AliasAccount {
  id: string
  type: string
  hash: string
  inbox: string
  address: string
  timestamp: number
}

export const aliasAccount = (accountId: string): AliasAccount => {
  const alias: AliasAccount = {
    id: accountId,
    type: 'AliasAccount',
    hash: '',
    inbox: '',
    address: '',
    timestamp: 0,
  }
  alias.hash = crypto.hashObj(alias)
  return alias
}
