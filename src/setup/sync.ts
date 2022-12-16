import { Shardus, ShardusTypes } from '@shardus/core'
import Common from '@ethereumjs/common'
import { Account, Address, BN } from 'ethereumjs-util'
import { loadAccountDataFromDB } from '../shardeum/debugRestoreAccounts'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { sleep } from '../utils'
import genesis from '../config/genesis.json'
import * as AccountsStorage from '../storage/accountStorage'
import { toShardusAddress } from '../shardeum/evmAddress'
import { AccountType, InternalTXType, WrappedEVMAccount, DevAccount } from '../shardeum/shardeumTypes'
import { ShardeumState, TransactionState } from '../state'
import { StateManager } from '../vm/state'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import config from '../config'

function isDebugMode() {
  //@ts-ignore
  return config.server.mode === 'debug'
}

const oneEth = new BN(10).pow(new BN(18))

export const networkAccount = '0'.repeat(64)

//In debug mode the default value is 100 SHM.  This is needed for certain load test operations
const defaultBalance = isDebugMode() ? oneEth.mul(new BN(100)) : new BN(0)

let debugShardeumState: ShardeumState = null

export const ONE_SECOND = 1000

export const sync = (shardus: Shardus, evmCommon: Common) => async (): Promise<void> => {
  if (ShardeumFlags.useAccountWrites) shardus.useAccountWrites()
  if (ShardeumFlags.GlobalNetworkAccount) {
    if (shardus.p2p.isFirstSeed) {
      await sleep(ONE_SECOND * 5)

      const nodeId = shardus.getNodeId()

      if (ShardeumFlags.DebugRestoreFile != null && ShardeumFlags.DebugRestoreFile != '') {
        let loadOptions = {
          file: ShardeumFlags.DebugRestoreFile,
        }
        let report = await loadAccountDataFromDB(shardus, loadOptions)
        console.log('loadAccountDataFromDB:' + JSON.stringify(report))
      }

      //create genesis accounts before network account since nodes will wait for the network account
      shardus.log(`node ${nodeId} GENERATED_A_NEW_NETWORK_ACCOUNT: `)
      if (ShardeumFlags.SetupGenesisAccount) {
        let skippedAccountCount = 0
        let accountCopies = []
        for (let address in genesis) {
          let amount = new BN(genesis[address].wei)

          let shardusAccountID = toShardusAddress(address, AccountType.Account)
          const existingAccount = await shardus.getLocalOrRemoteAccount(shardusAccountID)
          if (existingAccount) {
            skippedAccountCount += 1
            continue
          }

          let { wrappedEVMAccount, accountId, cycle } = await manuallyCreateAccount(
            address,
            amount,
            evmCommon,
            shardus.getLatestCycles()
          )
          let accountCopy: ShardusTypes.AccountsCopy = {
            cycleNumber: cycle.counter,
            accountId,
            data: wrappedEVMAccount,
            hash: wrappedEVMAccount.hash,
            isGlobal: false,
            timestamp: wrappedEVMAccount.timestamp,
          }
          accountCopies.push(accountCopy)
          shardus.log(`node ${nodeId} SETUP GENESIS ACCOUNT: ${address}  amt: ${amount}`)
        }
        console.log(`Skipped ${skippedAccountCount} genesis accounts`)
        if (ShardeumFlags.devPublicKey) {
          const { account, cycle } = createDevAccount(ShardeumFlags.devPublicKey, shardus.getLatestCycles())
          const devAccount: any = account
          await AccountsStorage.setAccount(devAccount.id, devAccount)
          let accountCopy: ShardusTypes.AccountsCopy = {
            cycleNumber: cycle.counter,
            accountId: devAccount.id,
            data: devAccount,
            hash: devAccount.hash,
            isGlobal: false,
            timestamp: devAccount.timestamp,
          }
          accountCopies.push(accountCopy)
        }
        await shardus.debugCommitAccountCopies(accountCopies)
        if (ShardeumFlags.forwardGenesisAccounts) {
          await shardus.forwardAccounts({ accounts: accountCopies, receipts: [] })
        }
      }
      await sleep(ONE_SECOND * 10)

      const when = Date.now()
      const existingNetworkAccount = await shardus.getLocalOrRemoteAccount(networkAccount)
      if (existingNetworkAccount) {
        shardus.log('NETWORK_ACCOUNT ALREADY EXISTED: ', existingNetworkAccount)
        await sleep(ONE_SECOND * 5)
      } else {
        let value = {
          isInternalTx: true,
          internalTXType: InternalTXType.InitNetwork,
          timestamp: when,
          network: networkAccount,
        }
        shardus.setGlobal(networkAccount, value, when, networkAccount)
      }
    } else {
      while (!(await shardus.getLocalOrRemoteAccount(networkAccount))) {
        console.log('waiting..')
        await sleep(1000)
      }
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
  evmCommon: Common,
  latestCycles: any
) {
  let shardusAccountID = toShardusAddress(ethAccountID, AccountType.Account)

  let debugTXState = getDebugTXState(evmCommon) //this isn't so great..
  debugTXState.checkpoint()
  let newAccount = await createAccount(ethAccountID, debugTXState, balance)
  debugTXState.commit()

  let { accounts: accountWrites } = debugTXState._transactionState.getWrittenAccounts()

  //need to commit the account now... this is such a hack!!
  for (let account of accountWrites.entries()) {
    //1. wrap and save/update this to shardeum accounts[] map
    let addressStr = account[0]
    let accountObj = Account.fromRlpSerializedAccount(account[1])

    let ethAccount = accountObj
    debugTXState._transactionState.commitAccount(addressStr, ethAccount) //yikes this wants an await.
  }

  if (ShardeumFlags.VerboseLogs) console.log('Tester account created', newAccount)
  const address = Address.fromString(ethAccountID)
  let account = await debugTXState.getAccount(address)

  let cycleStart = 0
  if (latestCycles != null && latestCycles.length > 0) {
    cycleStart = latestCycles[0].start * 1000
    console.log('Tester account created time: ', cycleStart)
  }

  let wrappedEVMAccount = {
    timestamp: cycleStart,
    account,
    ethAddress: ethAccountID,
    hash: '',
    accountType: AccountType.Account,
  }
  WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
  return { accountId: shardusAccountID, wrappedEVMAccount, cycle: latestCycles[0] }
}

const createDevAccount = (accountId: string, latestCycles: any) => {
  let cycleStart = 0
  if (latestCycles != null && latestCycles.length > 0) {
    cycleStart = latestCycles[0].start * 1000
    console.log('dev account created time: ', cycleStart)
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
function getDebugTXState(evmCommon: Common): ShardeumState {
  let txId = '7'.repeat(64)
  if (ShardeumFlags.VerboseLogs) console.log('Creating a debug tx ShardeumState for ')

  let shardeumState = debugShardeumState
  if (shardeumState == null) {
    shardeumState = new ShardeumState({ common: evmCommon })
    let transactionState = new TransactionState()
    transactionState.initData(
      shardeumState,
      {
        //dont define callbacks for db TX state!
        storageMiss: accountMissNoOp,
        contractStorageMiss: contractStorageMissNoOp,
        accountInvolved: accountInvolvedNoOp,
        contractStorageInvolved: contractStorageInvolvedNoOp,
        tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp,
        monitorEventCB: () => {}
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
  stateManager: StateManager,
  balance: BN = defaultBalance
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
  const updatedAccount = await stateManager.getAccount(accountAddress)

  let wrappedEVMAccount = {
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
async function accountMissNoOp(transactionState: TransactionState, address: string): Promise<boolean> {
  let isRemoteShard = false
  return isRemoteShard
}

async function contractStorageMissNoOp(
  _transactionState: TransactionState,
  _address: string,
  _key: string
): Promise<boolean> {
  let isRemoteShard = false
  return isRemoteShard
}

function accountInvolvedNoOp(transactionState: TransactionState, address: string, isRead: boolean): boolean {
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
