import { logFlags } from '..'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { AccountType, WrappedEVMAccount } from '../shardeum/shardeumTypes'
import { DeSerializeFromJsonString } from '../utils'
import { accounts, storage } from './accountStorage'
import { AccountsEntry } from './storage'

export async function getCachedRIAccount(address: string): Promise<WrappedEVMAccount> {
  if (ShardeumFlags.enableRIAccountsCache === false) return
  try {
    if (ShardeumFlags.UseDBForAccounts === true) {
      const account = await storage.getRIAccountsCache(address)
      if (!account) return

      if (typeof account.data === 'string') {
        account.data = DeSerializeFromJsonString<WrappedEVMAccount>(account.data)
      }
      return account.data
    } else {
      // eslint-disable-next-line security/detect-object-injection
      return accounts[address]
    }
  } catch (e) {
    /* prettier-ignore */ if (logFlags.important_as_fatal) console.log(`Error: while trying to get cached ri account`, e.message)
  }
}

export async function setCachedRIAccount(account: AccountsEntry): Promise<void> {
  if (ShardeumFlags.enableRIAccountsCache === false) return
  try {
    if (typeof account.data === 'string') {
      account.data = DeSerializeFromJsonString<WrappedEVMAccount>(account.data)
    }
    if (account.data.accountType !== AccountType.ContractCode) {
      return
    }
    if (ShardeumFlags.UseDBForAccounts === true) {
      account.timestamp = Date.now()
      await storage.setRIAccountsCache(account)
    } else {
      // eslint-disable-next-line security/detect-object-injection
      accounts[account.accountId] = account.data
    }
  } catch (e) {
    /* prettier-ignore */ if (logFlags.important_as_fatal) console.log(`Error: while trying to set cached ri account`, e.message)
  }
}
