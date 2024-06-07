import { NetworkAccount, WrappedEVMAccount, WrappedEVMAccountMap } from '../shardeum/shardeumTypes'

import { ShardeumFlags } from '../shardeum/shardeumFlags'
import Storage from '../storage/storage'
import { fixBigIntLiteralsToBigInt } from '../utils'
import { networkAccount } from '../shardeum/shardeumConstants'
import { isArchiverMode, isServiceMode } from '..'
import { logFlags } from '..'
import { setCachedRIAccount } from './riAccountsCache'
import { getContextValue } from '../utils/RequestContext'
import { shardusGet } from '../utils/requests'
import { Block } from '@ethereumjs/block'
import { Utils } from '@shardus/types'

//WrappedEVMAccount
export let accounts: WrappedEVMAccountMap = {}

export let storage: Storage = null

let isInitialized = false

export async function init(baseDir: string, dbPath: string): Promise<void> {
  storage = new Storage(baseDir, dbPath)

  //we have to lazy init storage, because this init happens very early
}

export async function lazyInit(): Promise<void> {
  if (isInitialized === false) {
    await storage.init()
    isInitialized = true
  }
}

// TODO: we should avoid API calls in the storage layer.
// The scope of this call is limited and should be used only when archive mode is enabled.
export async function fetchAccountDataFromCollector(
  accountId: string,
  blockNumberHex: string
): Promise<WrappedEVMAccount> {
  const apiQuery = `${ShardeumFlags.collectorUrl}/api/account?accountId=${accountId}&blockNumber=${blockNumberHex}`
  try {
    const response = await shardusGet<{
      success: boolean
      accounts: { account: WrappedEVMAccount }[]
    }>(apiQuery, {})
    if (!response.data.success) {
      throw new Error('Collector failed to return account data')
    }
    if (!response.data.accounts && response.data.accounts.length === 0) {
      throw new Error('Collector returned no account data')
    }
    return response.data.accounts[0].account
  } catch (error) {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Error: while trying to fetch account data from collector`, error.message)
    return null
  }
}

export async function getAccount(address: string): Promise<WrappedEVMAccount> {
  if (isArchiverMode()) {
    const blockContext = getContextValue<Block>('block')
    if (blockContext != undefined) {
      const accountData = await fetchAccountDataFromCollector(
        address,
        '0x' + blockContext.header.number.toString(16)
      )
      return accountData
    }
  }
  if (ShardeumFlags.UseDBForAccounts === true) {
    const account = await storage.getAccountsEntry(address)
    if (!account) return

    if (typeof account.data === 'string') {
      account.data = Utils.safeJsonParse(account.data) as WrappedEVMAccount
    }

    setCachedRIAccount(account)

    return account.data
  } else {
    // eslint-disable-next-line security/detect-object-injection
    return accounts[address]
  }
  //return null
}

export async function getAccountTimestamp(address: string): Promise<number> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    //todo replace with specific sql query
    const account = await storage.getAccountsEntry(address)
    return account.timestamp
  } else {
    // eslint-disable-next-line security/detect-object-injection
    return accounts[address]?.timestamp
  }
}

export async function accountExists(address: string): Promise<boolean> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    //todo replace with specific sql query, or even a shardus cache check
    const account = await storage.getAccountsEntry(address)
    return account != null
  } else {
    // eslint-disable-next-line security/detect-object-injection
    return accounts[address] != null
  }
}

export let cachedNetworkAccount: NetworkAccount // an actual obj

export async function getCachedNetworkAccount(): Promise<NetworkAccount> {
  if (isServiceMode()) {
    return (await getAccount(networkAccount)) as unknown as NetworkAccount
  }
  return cachedNetworkAccount
}

export async function setAccount(address: string, account: WrappedEVMAccount): Promise<void> {
  try {
    if (ShardeumFlags.UseDBForAccounts === true) {
      const accountEntry = {
        accountId: address,
        timestamp: account.timestamp,
        data: account,
      }

      if (account.timestamp === 0) {
        throw new Error('setAccount timestamp should not be 0')
      }
      await storage.createOrReplaceAccountEntry(accountEntry)

      setCachedRIAccount(accountEntry)

      if (address === networkAccount) {
        cachedNetworkAccount = account as unknown as NetworkAccount
        cachedNetworkAccount = fixBigIntLiteralsToBigInt(cachedNetworkAccount)
        // if (typeof cachedNetworkAccount.current.stakeRequiredUsd === 'string') {
        //   cachedNetworkAccount.current.stakeRequiredUsd = _base16BNParser(
        //     cachedNetworkAccount.current.stakeRequiredUsd
        //   )
        // }
        // if (typeof cachedNetworkAccount.current.nodePenaltyUsd === 'string') {
        //   cachedNetworkAccount.current.nodePenaltyUsd = _base16BNParser(
        //     cachedNetworkAccount.current.nodePenaltyUsd
        //   )
        // }
        // if (typeof cachedNetworkAccount.current.nodeRewardAmountUsd === 'string') {
        //   cachedNetworkAccount.current.nodeRewardAmountUsd = _base16BNParser(
        //     cachedNetworkAccount.current.nodeRewardAmountUsd
        //   )
        // }
      }
    } else {
      // eslint-disable-next-line security/detect-object-injection
      accounts[address] = account
    }
  } catch (e) {
    /* prettier-ignore */ if (logFlags.important_as_fatal) console.log(`Error: while trying to set account`, e.message)
  }
}

export const setCachedNetworkAccount = (account: NetworkAccount): void => {
  cachedNetworkAccount = account
}

export async function debugGetAllAccounts(): Promise<WrappedEVMAccount[]> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    return (await storage.debugSelectAllAccountsEntry()) as unknown as WrappedEVMAccount[]
  } else {
    return Object.values(accounts)
  }
  //return null
}

export async function clearAccounts(): Promise<void> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    //This lazy init is not ideal.. we only know this is called because of special knowledge
    //Would be much better to make a specific api that is called at the right time before data sync
    await lazyInit()
    await storage.deleteAccountsEntry()
  } else {
    accounts = {}
  }
}

export async function queryAccountsEntryByRanges(
  accountStart,
  accountEnd,
  maxRecords
): Promise<WrappedEVMAccount[]> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    const processedResults = []
    const results = await storage.queryAccountsEntryByRanges(accountStart, accountEnd, maxRecords)
    for (const result of results) {
      if (typeof result.data === 'string') {
        result.data = Utils.safeJsonParse(result.data)
      }
      processedResults.push(result.data)
    }
    return processedResults
  } else {
    throw Error('not supported here')
  }
}

export async function queryAccountsEntryByRanges2(
  accountStart,
  accountEnd,
  tsStart,
  tsEnd,
  maxRecords,
  offset,
  accountOffset
): Promise<WrappedEVMAccount[]> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    const processedResults = []
    let results

    if (accountOffset != null && accountOffset.length > 0) {
      results = await storage.queryAccountsEntryByRanges3(
        accountStart,
        accountEnd,
        tsStart,
        tsEnd,
        maxRecords,
        accountOffset
      )
    } else {
      results = await storage.queryAccountsEntryByRanges2(
        accountStart,
        accountEnd,
        tsStart,
        tsEnd,
        maxRecords,
        offset
      )
    }

    for (const result of results) {
      if (typeof result.data === 'string') {
        result.data = Utils.safeJsonParse(result.data)
      }
      processedResults.push(result.data)
    }
    return processedResults
  } else {
    throw Error('not supported here')
    //return accounts
  }
}
