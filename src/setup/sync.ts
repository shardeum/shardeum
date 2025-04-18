import { DevSecurityLevel, nestedCountersInstance, Shardus, ShardusTypes } from '@shardeum-foundation/core'
import { Account, Address } from '@ethereumjs/util'
import config from '../config'
import genesis from '../config/genesis.json'
import genesisSecureAccounts from '../config/genesis-secure-accounts.json'
import { loadAccountDataFromDB } from '../shardeum/debugRestoreAccounts'
import { toShardusAddress } from '../shardeum/evmAddress'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { AccountType, DevAccount, InternalTXType, WrappedEVMAccount } from '../shardeum/shardeumTypes'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import { ShardeumState, TransactionState } from '../state'
import * as AccountsStorage from '../storage/accountStorage'
import { sleep } from '../utils'
import { DefaultStateManager } from '@ethereumjs/statemanager'
import { createNetworkAccount, logFlags, shardeumGetTime } from '..'
import { Utils } from '@shardeum-foundation/lib-types'
import { initializeSecureAccount, SecureAccountConfig } from '../shardeum/secureAccounts'
import fs from 'fs'
import path from 'path'

function isDebugMode(): boolean {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return config.server.mode === 'debug'
}

const oneEth = BigInt(10) ** BigInt(18)

export const networkAccount = config.server.globalAccount

//In debug mode the default value is 100 SHM.  This is needed for certain load test operations
const defaultBalance = isDebugMode() ? oneEth * BigInt(ShardeumFlags.debugDefaultBalance) : BigInt(0)
const debugShardeumState: ShardeumState = null

export const ONE_SECOND = 1000

export const sync = (shardus: Shardus, evmCommon: any) => async (): Promise<void> => {
  if (ShardeumFlags.useAccountWrites) shardus.useAccountWrites()
  if (ShardeumFlags.GlobalNetworkAccount) {
    const existingNetworkAccount = await shardus.getLocalOrRemoteAccount(networkAccount)
    if (existingNetworkAccount || shardus.getNetworkMode() === 'restore') {
      /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('NETWORK_ACCOUNT ALREADY EXISTED: ', existingNetworkAccount)
      await sleep(ONE_SECOND * 5)
      return
    }
    if (shardus.p2p.isFirstSeed) {
      await sleep(ONE_SECOND * 5)

      const nodeId = shardus.getNodeId()

      if (ShardeumFlags.DebugRestoreFile != null && ShardeumFlags.DebugRestoreFile != '') {
        const loadOptions = {
          file: ShardeumFlags.DebugRestoreFile,
        }
        const report = await loadAccountDataFromDB(shardus, loadOptions)
        /* prettier-ignore */ if (logFlags.important_as_error) console.log('loadAccountDataFromDB:' + Utils.safeStringify(report))
      }

      //create genesis accounts before network account since nodes will wait for the network account
      /* prettier-ignore */ if (logFlags.important_as_error) shardus.log(`node ${nodeId} GENERATED_A_NEW_NETWORK_ACCOUNT: `)
      if (ShardeumFlags.SetupGenesisAccount) {
        let skippedAccountCount = 0
        let accountCopies = []

        let finalGenesis = genesis
        let finalGenesisSecureAccounts = genesisSecureAccounts

        /* eslint-disable security/detect-non-literal-fs-filename */
        /* eslint-disable security/detect-object-injection */
        if (process.env.LOAD_JSON_GENESIS) {
          const genesisFilePath = process.env.LOAD_JSON_GENESIS.trim()
          try {
            if (fs.existsSync(genesisFilePath)) {
              const genesisData = Utils.safeJsonParse(fs.readFileSync(genesisFilePath).toString())
              finalGenesis = genesisData
              console.log('sync.ts: genesis accounts loaded from:', genesisFilePath)
              /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'sync: genesis accounts loaded from:'+ genesisFilePath )
            } else {
              /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'sync: genesis accounts file not found:'+ genesisFilePath )
              console.error('sync.ts: path to the following genesis file is incorrect:', genesisFilePath)
              throw new Error('sync.ts: path to the following genesis file is incorrect:' + genesisFilePath)
            }
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'sync: genesis accounts file error:'+ genesisFilePath )
            console.error('sync.ts: error loading genesis file:', e)
            throw new Error('sync.ts: error loading genesis file: ' + e)
          }
        } else {
          /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'sync: genesis accounts LOAD_JSON_GENESIS not set' )
          console.error('sync: genesis accounts LOAD_JSON_GENESIS not set')
        }

        if (process.env.LOAD_JSON_GENESIS_SECURE_ACCOUNTS) {
          const GSAFilePath = process.env.LOAD_JSON_GENESIS_SECURE_ACCOUNTS.trim()

          try {
            if (fs.existsSync(GSAFilePath)) {
              const GSAData = Utils.safeJsonParse(fs.readFileSync(GSAFilePath).toString())
              finalGenesisSecureAccounts = GSAData
              console.log('sync.ts: genesis secure accounts loaded from:', GSAFilePath)
              /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'sync: genesis secure accounts loaded from:'+ GSAFilePath )
            } else {
              /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'sync: genesis secure accounts file not found:'+ GSAFilePath )
              console.error('sync.ts: path to the following genesis secure accounts file is incorrect:', GSAFilePath)
              throw new Error('sync.ts: path to the following genesis secure accounts file is incorrect:' + GSAFilePath)
            }
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'sync: genesis secure accounts file error:'+ GSAFilePath )
            console.error('sync.ts: error loading genesis secure accounts file:', e)
            throw new Error('sync.ts: error loading genesis secure accounts file: ' + e)
          }
        } else {
          /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'sync: genesis secure accounts LOAD_JSON_GENESIS_SECURE_ACCOUNTS not set' )
          console.error('sync: genesis secure accounts LOAD_JSON_GENESIS_SECURE_ACCOUNTS not set')
        }

        /* eslint-enable security/detect-object-injection */
        /* eslint-enable security/detect-non-literal-fs-filename */

        // Create genesis accounts from secure accounts
        const additionalGenesisAccounts = createGenesisAccountsFromSecureAccounts(finalGenesisSecureAccounts)

        // Merge additional genesis accounts with existing genesis accounts
        const mergedGenesisAccounts = { ...finalGenesis, ...additionalGenesisAccounts }

        for (const address in mergedGenesisAccounts) {
          const amount = BigInt(mergedGenesisAccounts[address].wei)

          const shardusAccountID = toShardusAddress(address, AccountType.Account)
          const existingAccount = await shardus.getLocalOrRemoteAccount(shardusAccountID)
          if (existingAccount) {
            skippedAccountCount += 1
            continue
          }

          const ethAccountID = Address.fromString(address).toString()
          const { wrappedEVMAccount, accountId, cycle } = await manuallyCreateAccount(
            ethAccountID,
            amount,
            evmCommon,
            shardus.getLatestCycles()
          )
          const accountCopy: ShardusTypes.AccountsCopy = {
            cycleNumber: cycle.counter,
            accountId,
            data: wrappedEVMAccount,
            hash: wrappedEVMAccount.hash,
            isGlobal: false,
            timestamp: wrappedEVMAccount.timestamp,
          }

          accountCopies.push(accountCopy)
          /* prettier-ignore */ if (logFlags.important_as_error) shardus.log(`node ${nodeId} SETUP GENESIS ACCOUNT: ${address}  amt: ${amount}`);
        }

        for (const secureAccountConfig of finalGenesisSecureAccounts) {
          const cycles = shardus.getLatestCycles()
          const secureAccount = initializeSecureAccount(secureAccountConfig as SecureAccountConfig, cycles)

          const accountCopy: ShardusTypes.AccountsCopy = {
            cycleNumber: cycles[0].counter,
            accountId: secureAccount.id,
            data: secureAccount,
            hash: secureAccount.hash,
            isGlobal: false,
            timestamp: secureAccount.timestamp,
          }

          accountCopies.push(accountCopy)
          /* prettier-ignore */ if (logFlags.important_as_error) shardus.log(`node ${nodeId} SETUP GENESIS SECUREACCOUNT: ${secureAccount.id}`);
        }
        /* prettier-ignore */ if (logFlags.important_as_error) console.log(`Skipped ${skippedAccountCount} genesis accounts`)
        //TODO we need to brainstorm a way to allow migration of keys on a live network
        const devPublicKeys = shardus.getDevPublicKeys()
        for (const devPublicKey of Object.keys(devPublicKeys)) {
          // eslint-disable-next-line security/detect-object-injection
          const level = devPublicKeys[devPublicKey]
          if (level >= DevSecurityLevel.Low) {
            const { account, cycle } = createDevAccount(devPublicKey, shardus.getLatestCycles())
            const devAccount: any = account // eslint-disable-line @typescript-eslint/no-explicit-any
            await AccountsStorage.setAccount(devAccount.id, devAccount)
            const accountCopy: ShardusTypes.AccountsCopy = {
              cycleNumber: cycle.counter,
              accountId: devAccount.id,
              data: devAccount,
              hash: devAccount.hash,
              isGlobal: false,
              timestamp: devAccount.timestamp,
            }
            accountCopies.push(accountCopy)
          }
        }
        await shardus.debugCommitAccountCopies(accountCopies)
        if (ShardeumFlags.forwardGenesisAccounts) {
          accountCopies = accountCopies.map((account) => {
            return Utils.safeJsonParse(Utils.safeStringify(account))
          })
          await shardus.forwardAccounts({ accounts: accountCopies, receipts: [] })
        }
      }

      await sleep(ONE_SECOND * 10)
      const when = shardeumGetTime()
      const value = {
        isInternalTx: true,
        internalTXType: InternalTXType.InitNetwork,
        timestamp: when,
        network: networkAccount,
      }
      const wrappedEVMAccount = await createNetworkAccount(networkAccount, config, shardus.p2p.isFirstSeed)
      wrappedEVMAccount.timestamp = when
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
      const afterStatehash = wrappedChangedAccount.stateId
      shardus.setGlobal(networkAccount, '', value, when, networkAccount, afterStatehash) // need to set addressHash = '' because it's not created yet.
    } else
      while (!(await shardus.getLocalOrRemoteAccount(networkAccount))) {
        /* prettier-ignore */ if (logFlags.important_as_error) console.log('waiting..')
        await sleep(1000)
      }
  }
}

/**
 * This creates an account outside of any EVM transaction
 * @param ethAccountID
 * @param balance
 */
async function manuallyCreateAccount(
  ethAccountID: string,
  balance = defaultBalance,
  evmCommon: any,
  latestCycles: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<{
  accountId: string
  wrappedEVMAccount: {
    timestamp: number
    account: Account
    ethAddress: string
    hash: string
    accountType: AccountType
  }
  cycle: { counter: number }
}> {
  const shardusAccountID = toShardusAddress(ethAccountID, AccountType.Account)

  const debugTXState = getDebugTXState(evmCommon) //this isn't so great..
  debugTXState.checkpoint()
  const newAccount = await createAccount(ethAccountID, debugTXState, balance)
  debugTXState.commit()

  const { accounts: accountWrites } = debugTXState._transactionState.getWrittenAccounts()

  //need to commit the account now... this is such a hack!!
  for (const account of accountWrites.entries()) {
    //1. wrap and save/update this to shardeum accounts[] map
    const addressStr = account[0]
    const accountObj = Account.fromRlpSerializedAccount(account[1])

    const ethAccount = accountObj
    debugTXState._transactionState.commitAccount(addressStr, ethAccount) //yikes this wants an await.
  }

  if (ShardeumFlags.VerboseLogs) console.log('Tester account created', newAccount)
  const address = Address.fromString(ethAccountID)
  const account = await debugTXState.getAccount(address)

  let cycleStart = 0
  if (latestCycles != null && latestCycles.length > 0) {
    cycleStart = latestCycles[0].start * 1000
    /* prettier-ignore */ if (logFlags.important_as_error) console.log('Tester account created time: ', cycleStart)
  }

  const wrappedEVMAccount = {
    timestamp: cycleStart,
    account,
    ethAddress: ethAccountID,
    hash: '',
    accountType: AccountType.Account,
  }
  WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
  return { accountId: shardusAccountID, wrappedEVMAccount, cycle: latestCycles[0] }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createDevAccount = (accountId: string, latestCycles: any): { account: DevAccount; cycle: any } => {
  let cycleStart = 0
  if (latestCycles != null && latestCycles.length > 0) {
    cycleStart = latestCycles[0].start * 1000
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('dev account created time: ', cycleStart)
  }
  const account: DevAccount = {
    id: accountId,
    accountType: AccountType.DevAccount,
    hash: '',
    timestamp: cycleStart,
  }
  account.hash = WrappedEVMAccountFunctions._calculateAccountHash(account)
  return { account, cycle: latestCycles[0] }
}

/**
 * Cant be used in parallel
 * @returns
 */
function getDebugTXState(evmCommon: any): ShardeumState {
  const txId = '7'.repeat(64)
  if (ShardeumFlags.VerboseLogs) console.log('Creating a debug tx ShardeumState for ')

  let shardeumState = debugShardeumState
  if (shardeumState == null) {
    shardeumState = new ShardeumState({ common: evmCommon })
    const transactionState = new TransactionState()
    transactionState.initData(
      shardeumState,
      {
        //don't define callbacks for db TX state!
        storageMiss: accountMissNoOp,
        contractStorageMiss: contractStorageMissNoOp,
        accountInvolved: accountInvolvedNoOp,
        contractStorageInvolved: contractStorageInvolvedNoOp,
        tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp,
        monitorEventCB: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
      },
      txId,
      undefined,
      undefined
    )
    shardeumState.setTransactionState(transactionState)
  } else {
    //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
    //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
    if (ShardeumFlags.VerboseLogs) console.log('Resetting debug transaction state for txId', txId)
    shardeumState.resetState()
  }

  return shardeumState
}

async function createAccount(
  addressStr: string,
  stateManager: any,
  balance: bigint = defaultBalance
): Promise<WrappedEVMAccount> {
  if (ShardeumFlags.VerboseLogs) console.log('Creating new account', addressStr)
  const accountAddress = Address.fromString(addressStr)

  const acctData = {
    nonce: 0,
    balance: balance, // 100 eth in debug mode.  0 ETH in release mode
  }

  //I think this will have to change in the future!
  // shardeumStateManager.setTransactionState(transactionState)

  const account = Account.fromAccountData(acctData)
  await stateManager.putAccount(accountAddress, account)
  const updatedAccount: Account = await stateManager.getAccount(accountAddress)

  const wrappedEVMAccount = {
    timestamp: 0,
    account: updatedAccount,
    ethAddress: addressStr,
    hash: '',
    accountType: AccountType.Account,
  }
  WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
  return wrappedEVMAccount
}

/**
 * fake callbacks so that the debug transactionState object can work with creating test accounts
 * Probably not a good thing to have long term.
 */
async function accountMissNoOp(_transactionState: TransactionState, _address: string): Promise<boolean> {
  const isRemoteShard = false
  return isRemoteShard
}

async function contractStorageMissNoOp(
  _transactionState: TransactionState,
  _address: string,
  _key: string
): Promise<boolean> {
  const isRemoteShard = false
  return isRemoteShard
}

function accountInvolvedNoOp(_transactionState: TransactionState, _address: string, _isRead: boolean): boolean {
  return true
}

function contractStorageInvolvedNoOp(
  _transactionState: TransactionState,
  _address: string,
  _key: string,
  _isRead: boolean
): boolean {
  return true
}

function tryGetRemoteAccountCBNoOp(
  _transactionState: TransactionState,
  _type: AccountType,
  _address: string,
  _key: string
): Promise<WrappedEVMAccount> {
  return undefined
}
/* eslint-enable @typescript-eslint/no-unused-vars */

function createGenesisAccountsFromSecureAccounts(
  secureAccounts: SecureAccountConfig[]
): Record<string, { wei: string }> {
  return secureAccounts.reduce((acc, account) => {
    acc[account.SourceFundsAddress] = { wei: account.SourceFundsBalance }
    return acc
  }, {} as Record<string, { wei: string }>)
}
