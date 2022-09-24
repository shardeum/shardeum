import {
    WrappedEVMAccount,
    WrappedEVMAccountMap,
} from '../shardeum/shardeumTypes'
import * as ShardeumFlags from '../shardeum/shardeumFlags'
import Storage from '../storage/storage'

const isString = (x) => {
    return Object.prototype.toString.call(x) === '[object String]'
}


class AccountStorage {
    accounts: WrappedEVMAccountMap = {}
    storage: Storage = null
    isInitialized = false

    async init(baseDir: string, dbPath: string) {
        this.storage = new Storage(
            baseDir,
            dbPath
        )
        //we have to lazy init storage, because this init happens very early
    }

    async lazyInit() {
        if (this.isInitialized === false) {
            await this.storage.init()
            this.isInitialized = true
        }
    }

    async getAccount(address: string): Promise<WrappedEVMAccount> {
        if (ShardeumFlags.UseDBForAccounts === true) {
            let account = await this.storage.getAccountsEntry(address)
            if (!account) return

            if (isString(account.data)) {
                account.data = JSON.parse(account.data as string)
            }

            return account.data
        } else {
            return this.accounts[address]
        }
        //return null
    }


    async getAccountTimestamp(address: string): Promise<number> {
        if (ShardeumFlags.UseDBForAccounts === true) {
            //todo replace with specific sql query
            let account = await this.storage.getAccountsEntry(address)
            return account.timestamp
        } else {
            return this.accounts[address]?.timestamp
        }
    }

    async accountExists(address: string): Promise<boolean> {
        if (ShardeumFlags.UseDBForAccounts === true) {
            //todo replace with specific sql query, or even a shardus cache check
            let account = await this.storage.getAccountsEntry(address)
            return account != null
        } else {
            return this.accounts[address] != null
        }
    }

    async setAccount(address: string, account: WrappedEVMAccount): Promise<void> {
        if (ShardeumFlags.UseDBForAccounts === true) {
            let accountEntry = {
                accountId: address,
                timestamp: account.timestamp,
                data: account,
            }

            if (account.timestamp === 0) {
                throw new Error('setAccount timestamp should not be 0')
            }

            await this.storage.createOrReplaceAccountEntry(accountEntry)
        } else {
            this.accounts[address] = account
        }
    }

    async debugGetAllAccounts(): Promise<WrappedEVMAccount[]> {
        if (ShardeumFlags.UseDBForAccounts === true) {
            return await this.storage.debugSelectAllAccountsEntry()
        } else {
            return Object.values(this.accounts)
        }
        //return null
    }

    async clearAccounts(): Promise<void> {
        if (ShardeumFlags.UseDBForAccounts === true) {
            //This lazy init is not ideal.. we only know this is called because of special knowledge
            //Would be much better to make a specific api that is called at the right time before data sync
            await this.lazyInit()
            await this.storage.deleteAccountsEntry()
        } else {
            this.accounts = {}
        }
    }

    async queryAccountsEntryByRanges(accountStart, accountEnd, maxRecords): Promise<WrappedEVMAccount[]> {
        if (ShardeumFlags.UseDBForAccounts === true) {
            let processedResults = []
            let results = await this.storage.queryAccountsEntryByRanges(accountStart, accountEnd, maxRecords)
            for (let result of results) {
                if (isString(result.data)) {
                    result.data = JSON.parse(result.data as string)
                }
                processedResults.push(result.data)
            }
            return processedResults
        } else {
            throw Error('not supported here')
        }
    }

    async queryAccountsEntryByRanges2(accountStart, accountEnd, tsStart, tsEnd, maxRecords, offset): Promise<WrappedEVMAccount[]> {
        if (ShardeumFlags.UseDBForAccounts === true) {
            let processedResults = []
            let results = await this.storage.queryAccountsEntryByRanges2(accountStart, accountEnd, tsStart, tsEnd, maxRecords, offset)
            for (let result of results) {
                if (isString(result.data)) {
                    result.data = JSON.parse(result.data as string)
                }
                processedResults.push(result.data)
            }
            return processedResults
        } else {
            throw Error('not supported here')
            //return accounts
        }
    }

    async close() {
        await this.storage.close()
    }
}

export default AccountStorage