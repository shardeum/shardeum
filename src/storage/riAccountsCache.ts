import { nestedCountersInstance } from '@shardeum-foundation/core'
import { isServiceMode, logFlags } from '..'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { AccountType, WrappedEVMAccount } from '../shardeum/shardeumTypes'
import { accounts, storage } from './accountStorage'
import { AccountsEntry } from './storage'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import { Utils } from '@shardeum-foundation/lib-types'

export async function getCachedRIAccount(address: string): Promise<WrappedEVMAccount> {
  if (ShardeumFlags.enableRIAccountsCache === false || isServiceMode()) return
  try {
    if (ShardeumFlags.UseDBForAccounts === true) {
      const account = await storage.getRIAccountsCache(address)
      if (!account) {
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[getCachedRIAccount] RI Cache MISS - addr:${address}`)
        return
      }

      if (typeof account.data === 'string') {
        account.data = Utils.safeJsonParse(account.data) as WrappedEVMAccount
      }
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[getCachedRIAccount] RI Cache HIT - addr:${address} accountType:${account.data.accountType} timestamp:${account.timestamp} codeByteLength:${account.data.codeByte?.length}`)
      return account.data
    } else {
      // eslint-disable-next-line security/detect-object-injection
      const cachedAccount = accounts[address]
      if (cachedAccount) {
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[getCachedRIAccount] RI Memory Cache HIT - addr:${address} accountType:${cachedAccount.accountType}`)
      } else {
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[getCachedRIAccount] RI Memory Cache MISS - addr:${address}`)
      }
      return cachedAccount
    }
  } catch (e) {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[getCachedRIAccount] RI Cache ERROR - addr:${address} error:${e.message}`)
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
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[setCachedRIAccount] RI Cache SET skipped - addr:${account.accountId} accountType:${account.data.accountType} (not ContractCode)`)
      return
    }
    if (ShardeumFlags.UseDBForAccounts === true) {
      // Reduce the number of updates to the DB by checking if the account already exists
      const existingAccount = await storage.getRIAccountsCache(account.accountId)
      if (existingAccount) {
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[setCachedRIAccount] RI Cache SET skipped - addr:${account.accountId} (already exists) codeByteLength:${account.data.codeByte?.length}`)
        return
      }
      account.timestamp = Date.now()
      nestedCountersInstance.countEvent('cache', 'setCachedRIAccountData')
      // Calculate and store the hash of the account data
      account.data.hash = WrappedEVMAccountFunctions._calculateAccountHash(account.data)
      await storage.setRIAccountsCache(account)
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[setCachedRIAccount] RI Cache SET success - addr:${account.accountId} timestamp:${account.timestamp} codeByteLength:${account.data.codeByte?.length} hash:${account.data.hash}`)
      return
    } else {
      // eslint-disable-next-line security/detect-object-injection
      accounts[account.accountId] = account.data
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[setCachedRIAccount] RI Memory Cache SET success - addr:${account.accountId} accountType:${account.data.accountType} codeByteLength:${account.data.codeByte?.length}`)
    }
  } catch (e) {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`[setCachedRIAccount] RI Cache SET ERROR - addr:${account.accountId} error:${e.message}`)
    /* prettier-ignore */ if (logFlags.important_as_fatal) console.log(`Error: while trying to set cached ri account`, e.message)
  }
}
