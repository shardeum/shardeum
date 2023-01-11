import { NetworkAccount, WrappedEVMAccount, WrappedEVMAccountMap, HexString, DecimalString } from '../shardeum/shardeumTypes'

import { ShardeumFlags } from '../shardeum/shardeumFlags'
import Storage from '../storage/storage'
import { DeSerializeFromJsonString, _base16BNParser } from '../utils'
import { networkAccount } from '..'
import { BN } from 'bn.js'

const isString = x => {
  return Object.prototype.toString.call(x) === '[object String]'
}

//WrappedEVMAccount
export let accounts: WrappedEVMAccountMap = {}

export let storage: Storage = null

let isInitialized = false

export async function init(baseDir: string, dbPath: string) {
  storage = new Storage(baseDir, dbPath)

  //we have to lazy init storage, because this init happens very early
}

export async function lazyInit() {
  if (isInitialized === false) {
    await storage.init()
    isInitialized = true
  }
}

export async function getAccount(address: string): Promise<WrappedEVMAccount> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    let account = await storage.getAccountsEntry(address)
    if (!account) return

    if (isString(account.data)) {
      account.data = DeSerializeFromJsonString<WrappedEVMAccount>(account.data)
    }

    return account.data
  } else {
    return accounts[address]
  }
  //return null
}

export async function getAccountTimestamp(address: string): Promise<number> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    //todo replace with specific sql query
    let account = await storage.getAccountsEntry(address)
    return account.timestamp
  } else {
    return accounts[address]?.timestamp
  }
}

export async function accountExists(address: string): Promise<boolean> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    //todo replace with specific sql query, or even a shardus cache check
    let account = await storage.getAccountsEntry(address)
    return account != null
  } else {
    return accounts[address] != null
  }
}

export let cachedNetworkAccount: NetworkAccount // an actual obj
export async function setAccount(address: string, account: WrappedEVMAccount): Promise<void> {
  try {
    if (ShardeumFlags.UseDBForAccounts === true) {
      let accountEntry = {
        accountId: address,
        timestamp: account.timestamp,
        data: account,
      }

      if (account.timestamp === 0) {
        throw new Error('setAccount timestamp should not be 0')
      }
      await storage.createOrReplaceAccountEntry(accountEntry)

      if (address === networkAccount) {
        cachedNetworkAccount = (account as any) as NetworkAccount
        if (typeof cachedNetworkAccount.current.stakeRequired === 'string') {
          cachedNetworkAccount.current.stakeRequired = _base16BNParser(cachedNetworkAccount.current.stakeRequired)
        }
        if (typeof cachedNetworkAccount.current.nodePenalty === 'string') {
          cachedNetworkAccount.current.nodePenalty = _base16BNParser(cachedNetworkAccount.current.nodePenalty)
        }
        if (typeof cachedNetworkAccount.current.nodeRewardAmount === 'string') {
          cachedNetworkAccount.current.nodeRewardAmount = _base16BNParser(cachedNetworkAccount.current.nodeRewardAmount)
        }
      }
    } else {
      accounts[address] = account
    }
  } catch (e) {
    console.log(`Error: while trying to set account`, e.message)
  }
}

export async function debugGetAllAccounts(): Promise<WrappedEVMAccount[]> {
  if (ShardeumFlags.UseDBForAccounts === true) {
    return await storage.debugSelectAllAccountsEntry()
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
    let processedResults = []
    let results = await storage.queryAccountsEntryByRanges(accountStart, accountEnd, maxRecords)
    for (let result of results) {
      if (isString(result.data)) {
        result.data = DeSerializeFromJsonString(result.data as string)
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
    let processedResults = []
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

    for (let result of results) {
      if (isString(result.data)) {
        result.data = DeSerializeFromJsonString(result.data as string)
      }
      processedResults.push(result.data)
    }
    return processedResults
  } else {
    throw Error('not supported here')
    //return accounts
  }
}
