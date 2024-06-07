import { nestedCountersInstance } from '@shardus/core'
import { isServiceMode, logFlags } from '..'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { AccountType, WrappedEVMAccount } from '../shardeum/shardeumTypes'
import { accounts, storage } from './accountStorage'
import { AccountsEntry } from './storage'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import { Utils } from '@shardus/types'

export async function getCachedRIAccount(address: string): Promise<WrappedEVMAccount> {
  if (ShardeumFlags.enableRIAccountsCache === false || isServiceMode()) return
  try {
    if (ShardeumFlags.UseDBForAccounts === true) {
      const account = await storage.getRIAccountsCache(address)
      if (!account) return

      if (typeof account.data === 'string') {
        account.data = Utils.safeJsonParse(account.data) as WrappedEVMAccount
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
  if (ShardeumFlags.enableRIAccountsCache === false || isServiceMode()) return
  try {
    if (typeof account.data === 'string') {
      account.data = Utils.safeJsonParse(account.data) as WrappedEVMAccount
    }
    if (account.data.accountType !== AccountType.ContractCode) {
      return
    }
    if (ShardeumFlags.UseDBForAccounts === true) {
      // Reduce the number of updates to the DB by checking if the account already exists
      const existingAccount = await storage.getRIAccountsCache(account.accountId)
      if (existingAccount) {
        return
      }
      account.timestamp = Date.now()
      nestedCountersInstance.countEvent('cache', 'setCachedRIAccountData')
      // Calculate and store the hash of the account data
      account.data.hash = WrappedEVMAccountFunctions._calculateAccountHash(account.data)
      await storage.setRIAccountsCache(account)
      return
    } else {
      // eslint-disable-next-line security/detect-object-injection
      accounts[account.accountId] = account.data
    }
  } catch (e) {
    /* prettier-ignore */ if (logFlags.important_as_fatal) console.log(`Error: while trying to set cached ri account`, e.message)
  }
}
