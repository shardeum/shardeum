import {
  Account,
  Address,
  bytesToHex,
  equalsBytes,
  hexToBytes,
  KECCAK256_NULL,
  unpadBytes,
} from '@ethereumjs/util'
import ShardeumState from './shardeumState'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { zeroAddressAccount, zeroAddressStr } from '../../utils'
import * as AccountsStorage from '../db'
import { AccountType, WrappedEVMAccount } from '../../shardeum/shardeumTypes'
import { toShardusAddress, toShardusAddressWithKey } from '../utils/evmAddress'
import { fixDeserializedWrappedEVMAccount } from '../utils/wrappedEVMAccountFunctions'
import { Trie } from '@ethereumjs/trie'
import { keccak256 } from 'ethereum-cryptography/keccak.js'
import { RLP } from '@ethereumjs/rlp'
import { Utils } from '@shardus/types'

export type accountEvent = (transactionState: TransactionState, address: string) => Promise<boolean>
export type contractStorageEvent = (
  transactionState: TransactionState,
  address: string,
  key: string
) => Promise<boolean>
export type involvedEvent = (transactionState: TransactionState, address: string, isRead: boolean) => boolean
export type keyInvolvedEvent = (
  transactionState: TransactionState,
  address: string,
  key: string,
  isRead: boolean
) => boolean
export type getAccountEvent = (
  transactionState: TransactionState,
  type: AccountType,
  address: string,
  key: string
) => Promise<WrappedEVMAccount>

export type monitorEvent = (category: string, name: string, count: number, message: string) => void

export interface ShardeumStorageCallbacks {
  storageMiss: accountEvent
  contractStorageMiss: contractStorageEvent
  accountInvolved: involvedEvent
  contractStorageInvolved: keyInvolvedEvent
  tryGetRemoteAccountCB: getAccountEvent
  monitorEventCB: monitorEvent
}

export interface TryRemoteAccountHistory {
  account: string[]
  storage: string[]
  codeBytes: string[]
}

//how to know about getting original version vs putted version..

//todo is secure trie the right version to use?  also when/where to commit/checpoint the tries
//access pattern is a bit different
//would be nice if shardus called put account data on a list of accounts for a given TX !!!

export interface ContractByteWrite {
  contractByte: Uint8Array
  codeHash: Uint8Array
  contractAddress: Address
}

export default class TransactionState {
  //Shardus TXID
  linkedTX: string

  // link to the shardeumState singleton (todo refactor this as non member instance)
  shardeumState: ShardeumState

  // account data
  firstAccountReads: Map<string, Uint8Array>
  allAccountWrites: Map<string, Uint8Array>
  committedAccountWrites: Map<string, Uint8Array>

  allAccountWritesStack: Map<string, Uint8Array>[]

  // contract account key: value data
  firstContractStorageReads: Map<string, Map<string, Uint8Array>>
  allContractStorageWrites: Map<string, Map<string, Uint8Array>>

  // contract account key: value data
  firstContractBytesReads: Map<string, ContractByteWrite>
  allContractBytesWrites: Map<string, ContractByteWrite>
  allContractBytesWritesByAddress: Map<string, ContractByteWrite>

  // pending contract storage commits
  pendingContractStorageCommits: Map<string, Map<string, Uint8Array>>
  pendingContractBytesCommits: Map<string, Map<string, WrappedEVMAccount>>

  tryRemoteHistory: TryRemoteAccountHistory

  // touched CAs:  //TBD step 2.+ see docs
  touchedCAs: Set<string>

  debugTrace: boolean

  createdTimestamp: number

  checkpointCount: number

  appData: unknown

  // callbacks
  accountMissCB: accountEvent
  contractStorageMissCB: contractStorageEvent
  accountInvolvedCB: involvedEvent
  contractStorageInvolvedCB: keyInvolvedEvent

  tryGetRemoteAccountCB: getAccountEvent
  monitorEventCB: monitorEvent

  /**
   * repair the fields on this account.
   * accounts need some adjustments after being deseralized
   * @param account
   */
  static fixAccountFields(account): void {
    //hmm some hacks to fix data after getting copied around..
    // if (typeof account.nonce && account.nonce.__BigInt__) {
    //   account.nonce = BigInt(account.nonce.__BigInt__)
    // }
    // if (typeof account.balance && account.balance.__BigInt__) {
    //   account.balance = BigInt(account.balance.__BigInt__)
    // }
    //hmm some hacks to fix data after getting copied around..
    if (typeof account.nonce === 'string') {
      if (account.nonce.startsWith('0x') === false) {
        account.nonce = '0x' + account.nonce
      }
    }

    if (typeof account.balance === 'string') {
      if (account.balance.startsWith('0x') === false) {
        account.balance = '0x' + account.balance
      }
    }
    this.fixAccountUint8Arrays(account)
  }

  private static fixAccountUint8Arrays(account): void {
    if (account.storageRoot?.data) {
      account.storageRoot = Uint8Array.from(account.storageRoot.data)
    }
    if (account.codeHash?.data) {
      account.codeHash = Uint8Array.from(account.codeHash.data)
    }
  }

  resetTransactionState(): void {
    this.firstAccountReads = new Map()
    this.allAccountWrites = new Map()
    this.committedAccountWrites = new Map()

    this.firstContractStorageReads = new Map()
    this.allContractStorageWrites = new Map()

    this.firstContractBytesReads = new Map()
    this.allContractBytesWrites = new Map()
    this.allContractBytesWritesByAddress = new Map()

    this.pendingContractStorageCommits = new Map()
    this.pendingContractBytesCommits = new Map()

    this.tryRemoteHistory = {
      account: [],
      storage: [],
      codeBytes: [],
    }

    this.touchedCAs = new Set()

    this.checkpointCount = 0
  }

  initData(
    shardeumState: ShardeumState,
    callbacks: ShardeumStorageCallbacks,
    linkedTX,
    firstReads: Map<string, Uint8Array>,
    firstContractStorageReads: Map<string, Map<string, Uint8Array>>
  ): void {
    this.createdTimestamp = Date.now()

    this.linkedTX = linkedTX

    this.shardeumState = shardeumState

    //callbacks for storage events
    this.accountMissCB = callbacks.storageMiss
    this.contractStorageMissCB = callbacks.contractStorageMiss
    this.accountInvolvedCB = callbacks.accountInvolved
    this.contractStorageInvolvedCB = callbacks.contractStorageInvolved
    this.tryGetRemoteAccountCB = callbacks.tryGetRemoteAccountCB
    this.monitorEventCB = callbacks.monitorEventCB

    this.firstAccountReads = new Map()
    this.allAccountWrites = new Map()
    this.committedAccountWrites = new Map()
    this.allAccountWritesStack = []

    this.firstContractStorageReads = new Map()
    this.allContractStorageWrites = new Map()

    this.firstContractBytesReads = new Map()
    this.allContractBytesWrites = new Map()
    this.allContractBytesWritesByAddress = new Map()

    this.pendingContractStorageCommits = new Map()
    this.pendingContractBytesCommits = new Map()

    this.tryRemoteHistory = {
      account: [],
      storage: [],
      codeBytes: [],
    }

    this.touchedCAs = new Set()

    //load in the first reads
    if (firstReads != null) {
      this.firstAccountReads = firstReads
    }

    //load in the first contract storage reads
    if (firstContractStorageReads != null) {
      this.firstContractStorageReads = firstContractStorageReads
    }

    // Set flag according to environment variable
    this.debugTrace = process.env.DEBUG_TRACE === 'true'

    this.checkpointCount = 0
  }

  getReadAccounts(): {
    accounts: Map<string, Uint8Array>
    contractStorages: Map<string, Map<string, Uint8Array>>
    contractBytes: Map<string, ContractByteWrite>
  } {
    return {
      accounts: this.firstAccountReads,
      contractStorages: this.firstContractStorageReads,
      contractBytes: this.firstContractBytesReads,
    }
  }

  getWrittenAccounts(): {
    accounts: Map<string, Uint8Array>
    contractStorages: Map<string, Map<string, Uint8Array>>
    contractBytes: Map<string, ContractByteWrite>
  } {
    //flatten accounts maps. from newest to oldest in our stack (newest has the highest array index)
    //only update values if there is not an existing newer value!!

    // for(let i=this.allAccountWritesStack.length-1; i>=0; i--){
    //   let accountWrites = this.allAccountWritesStack[i]
    //   //process all the values in the stack
    //   for(let [key,value] of accountWrites.entries()){
    //     //if our flattened list does not have the value yet
    //     if (this.allAccountWrites.has(key) === false) {
    //       //then flatten the value from the stack into it
    //       this.allAccountWrites.set(key,value)
    //     }
    //   }
    // }

    //let the apply function take care of wrapping these accounts?
    //return { accounts: this.allAccountWrites, contractStorages: this.allContractStorageWrites, contractBytes: this.allContractBytesWrites }

    return {
      accounts: this.committedAccountWrites,
      contractStorages: this.allContractStorageWrites,
      contractBytes: ShardeumFlags.fixContractBytes
        ? this.allContractBytesWritesByAddress
        : this.allContractBytesWrites,
    }
  }

  getTransferBlob(): { accounts: Map<string, Uint8Array>; kvPairs: Map<string, Map<string, Uint8Array>> } {
    //this is the data needed to start computation on another shard
    return { accounts: this.firstAccountReads, kvPairs: this.firstContractStorageReads }
  }

  /**
   * Call this from dapp.updateAccountFull / updateAccountPartial to commit changes to the EVM trie
   * EVM trie is gone, this is a no-op.  todo remove later
   * @param addressString
   * @param account
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async commitAccount(addressString: string, account: Account): Promise<void> {
    //store all writes to the persistant trie.
    //const address = Address.fromString(addressString)
    // if (ShardeumFlags.Virtual0Address && addressString === zeroAddressStr) {
    //   if (this.debugTrace) this.debugTraceLog(`commitAccount: addr:${addressString} } is neglected`)
    //   return
    // }
    //save to accounts
  }

  /**
   * Call this from dapp.updateAccountFull / updateAccountPartial to commit changes to the EVM trie
   *  EVM trie is gone, this is a no-op.  todo remove later
   * @param contractAddress
   * @param codeHash
   * @param contractByte
   */
  async commitContractBytes(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    contractAddress: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    codeHash: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    contractByte: Uint8Array
  ): Promise<void> {
    //const codeHashStr = bytesToHex(codeHash)
  }

  /**
   * EVM trie is gone, this is a no-op.  todo remove later
   * @param contractAddress
   * @param keyString
   * @param value
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async commitContractStorage(contractAddress: string, keyString: string, value: Uint8Array): Promise<void> {
    //store all writes to the persistant trie.
  }

  async getAccount(
    worldStateTrie: Trie,
    address: Address,
    originalOnly: boolean,
    canThrow: boolean
  ): Promise<Account> {
    const addressString = address.toString()
    let account: Account
    if (ShardeumFlags.Virtual0Address && addressString === zeroAddressStr) {
      return zeroAddressAccount
    }

    if (originalOnly === false) {
      //first check our map as these are the most current account values
      if (this.allAccountWrites.has(addressString)) {
        const storedRlp = this.allAccountWrites.get(addressString)
        account = storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
        if (this.debugTrace)
          this.debugTraceLog(
            `getAccount:(allAccountWrites) addr:${addressString} balance:${account?.balance} nonce:${account?.nonce}`
          )
        return account
      }

      //check stack for changes next.  from newest to oldest
      //new changes are pushed to the end of the array
      for (let i = this.allAccountWritesStack.length - 1; i >= 0; i--) {
        // eslint-disable-next-line security/detect-object-injection
        const accountWrites = this.allAccountWritesStack[i]
        if (accountWrites.has(addressString)) {
          const storedRlp = accountWrites.get(addressString)
          account = storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
          if (this.debugTrace)
            this.debugTraceLog(
              `getAccount:(allAccountWritesStack-skipped) addr:${addressString} balance:${account?.balance} nonce:${account?.nonce}`
            )
          return account
          //ignore but log this find
          //break
        }
      }
    }

    //check this before first reads
    //this is allowed even when originalOnly==-true because
    //when checkpoints === 0 in ethereumJS it clears original storage
    //maybe this is moot for accounts, but this can be an example for contract storage.
    if (this.committedAccountWrites.has(addressString)) {
      const storedRlp = this.committedAccountWrites.get(addressString)
      account = storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
      if (this.debugTrace)
        this.debugTraceLog(
          `getAccount:(committedAccountWrites) addr:${addressString} balance:${account?.balance} nonce:${account?.nonce}`
        )
      return account
    }

    if (this.firstAccountReads.has(addressString)) {
      const storedRlp = this.firstAccountReads.get(addressString)
      account = storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
      if (this.debugTrace)
        this.debugTraceLog(
          `getAccount:(firstAccountReads) addr:${addressString} balance:${account?.balance} nonce:${account?.nonce}`
        )
      return account
    }

    if (this.accountInvolvedCB(this, addressString, true) === false) {
      throw new Error('unable to proceed, cant involve account')
    }

    let storedRlp: Uint8Array

    //get from accounts
    //throw new Error('get from accounts db')

    //figure out if addres to string is ok...
    //also what about RLP format... need to do the extra conversions now, but plan on the best conversion.
    const accountShardusAddress = toShardusAddress(address.toString(), AccountType.Account)
    const wrappedAccount = await AccountsStorage.getAccount(accountShardusAddress)
    if (wrappedAccount != null) {
      fixDeserializedWrappedEVMAccount(wrappedAccount)
      account = Account.fromAccountData(wrappedAccount.account)
    }

    if (account != null) {
      storedRlp = account.serialize()
    }

    if (this.debugTrace)
      this.debugTraceLog(
        `getAccount:(AccountsStorage) addr:${addressString} balance:${account?.balance} nonce:${account?.nonce}`
      )

    //attempt to get data from tryGetRemoteAccountCB
    //this can be a long wait only suitable in some cases
    if (account == undefined) {
      const wrappedEVMAccount = await this.tryGetRemoteAccountCB(
        this,
        AccountType.Account,
        addressString,
        null
      )
      if (wrappedEVMAccount != undefined) {
        //get account aout of the wrapped evm account
        account = wrappedEVMAccount.account
        storedRlp = account.serialize()

        if (this.debugTrace)
          this.debugTraceLog(
            `getAccount:(tryGetRemoteAccountCB) addr:${addressString} balance:${account?.balance} nonce:${account?.nonce}`
          )
      }
    }

    //Storage miss!!!, account not on this shard
    if (account == undefined) {
      //event callback to inidicate we do not have the account in this shard
      // not 100% if we should await this, may need some group discussion
      const isRemoteShard = await this.accountMissCB(this, addressString)

      if (this.debugTrace)
        this.debugTraceLog(`getAccount: addr:${addressString} v:notFound isRemoteShard:${isRemoteShard}`)

      if (canThrow && isRemoteShard) throw new Error('account in remote shard, abort') //todo smarter throw?

      //return a new unitizlied account
      account = new Account()
      //;(account as any).virtual = true
      //this._update(address, account, false, false, true)

      //todo need to insert it into a map of new / virtual accounts?
      if (this.debugTrace)
        this.debugTraceLog(
          `getAccount: initialized new account addr:${addressString} v:${Utils.safeStringify(account)}`
        )

      return account
    }

    if (this.debugTrace)
      this.debugTraceLog(`getAccount: addr:${addressString} v:${Utils.safeStringify(account)}`)
    // storage hit!!! data exists in this shard
    //put this in our first reads map
    this.firstAccountReads.set(addressString, storedRlp)
    return account
  }

  /**
   *
   * @param address - Address under which to store `account`
   * @param account - The account to store
   */
  putAccount(address: Address, account: Account): void {
    const addressString = address.toString()

    if (ShardeumFlags.Virtual0Address && addressString === zeroAddressStr) {
      if (this.debugTrace) this.debugTraceLog(`putAccount: addr:${addressString} is neglected`)
      return
    }

    if (/*this.debugTrace &&*/ ShardeumFlags.VerboseLogs) {
      //print the calls stack that is calling put account
      const er = new Error()
      console.log(
        `False error for call stack: put account: ${addressString} tx:${this.linkedTX} stack: ${er.stack} `
      )
    }

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed in put acocunt, cant involve account')
    }
    TransactionState.fixAccountFields(account)

    const accountObj = Account.fromAccountData(account)
    const storedRlp = accountObj.serialize()

    if (this.debugTrace)
      this.debugTraceLog(`putAccount: addr:${addressString} v:${Utils.safeStringify(accountObj)}`)

    //this.allAccountWrites.set(addressString, storedRlp)

    //this.checkpoints[this.checkpoints.length - 1]
    if (this.allAccountWritesStack.length > 0) {
      const accountWrites = this.allAccountWritesStack[this.allAccountWritesStack.length - 1]
      accountWrites.set(addressString, storedRlp)
    } else {
      //if we are not using checkpoints then use this data to set first account reads
      this.firstAccountReads.set(addressString, storedRlp)
    }
  }

  insertFirstAccountReads(address: any, account: Account): void {
    const addressString = address.toString()

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed, cant involve account')
    }

    TransactionState.fixAccountFields(account)

    const accountObj = Account.fromAccountData(account)
    const storedRlp = accountObj.serialize()
    this.firstAccountReads.set(addressString, storedRlp)
  }

  async getContractCode(
    worldStateTrie: Trie,
    contractAddress: Address,
    originalOnly: boolean,
    canThrow: boolean
  ): Promise<Uint8Array> {
    const addressString = contractAddress.toString()

    //first get the account so we can have the correct code hash to look at
    const contractAccount = await this.getAccount(worldStateTrie, contractAddress, originalOnly, canThrow)
    if (contractAccount == undefined) {
      if (this.debugTrace)
        this.debugTraceLog(`getContractCode: addr:${addressString} Found no contract account`)
      return
    }
    const codeHash = contractAccount.codeHash
    const codeHashStr = bytesToHex(codeHash)

    if (originalOnly === false) {
      if (this.allContractBytesWrites.has(codeHashStr)) {
        const codeBytes = this.allContractBytesWrites.get(codeHashStr).contractByte
        if (this.debugTrace)
          this.debugTraceLog(
            `getContractCode: (allContractBytesWrites) addr:${addressString} codeHashStr:${codeHashStr} v:${codeBytes.length}`
          )
        return codeBytes
      }
      if (this.allContractBytesWritesByAddress.has(addressString)) {
        const codeBytes = this.allContractBytesWritesByAddress.get(addressString).contractByte
        if (this.debugTrace)
          this.debugTraceLog(
            `getContractCode: (allContractBytesWritesByAddress) addr:${addressString} v:${codeBytes.length}`
          )
        return codeBytes
      }
    }
    if (this.firstContractBytesReads.has(codeHashStr)) {
      const codeBytes = this.firstContractBytesReads.get(codeHashStr).contractByte
      if (this.debugTrace)
        this.debugTraceLog(
          `getContractCode: (firstContractBytesReads) addr:${addressString} codeHashStr:${codeHashStr} v:${codeBytes.length}`
        )
      return codeBytes
    }

    if (this.accountInvolvedCB(this, addressString, true) === false) {
      throw new Error('unable to proceed, cant involve contract bytes')
    }

    let storedCodeByte: Uint8Array
    let codeBytes: Uint8Array

    //get from accounts db
    //throw new Error('get from accounts db')

    //need: contract address,  code hash  for toShardusAddressWithKey
    const bytesShardusAddress = toShardusAddressWithKey(addressString, codeHashStr, AccountType.ContractCode)
    const wrappedAccount = await AccountsStorage.getAccount(bytesShardusAddress)
    if (wrappedAccount != null) {
      fixDeserializedWrappedEVMAccount(wrappedAccount)
      storedCodeByte = wrappedAccount.codeByte
      codeBytes = storedCodeByte
    }

    //attempt to get data from tryGetRemoteAccountCB
    //this can be a long wait only suitable in some cases
    if (codeBytes == undefined) {
      const wrappedEVMAccount = await this.tryGetRemoteAccountCB(
        this,
        AccountType.ContractCode,
        addressString,
        codeHashStr
      )
      if (wrappedEVMAccount != undefined && wrappedEVMAccount.codeByte) {
        //get account aout of the wrapped evm account
        codeBytes = wrappedEVMAccount.codeByte
      }
    }

    //Storage miss!!!, account not on this shard
    if (codeBytes == undefined) {
      //event callback to inidicate we do not have the account in this shard
      // not 100% if we should await this, may need some group discussion
      const isRemoteShard = await this.accountMissCB(this, codeHashStr)

      if (this.debugTrace)
        this.debugTraceLog(
          `getContractCode: addr:${addressString} codeHashStr:${codeHashStr} v:undefined isRemoteShard:${isRemoteShard}`
        )

      if (canThrow && isRemoteShard) throw new Error('codeBytes in remote shard, abort') //todo smarter throw?

      //return unitiazlied new code bytes
      //todo need to insert it into a map of new / virtual accounts?
      return new Uint8Array(0)
    }

    if (this.debugTrace)
      this.debugTraceLog(
        `getContractCode: addr:${addressString} codeHashStr:${codeHashStr} v:${codeBytes.length}`
      )

    // storage hit!!! data exists in this shard
    //put this in our first reads map
    this.firstContractBytesReads.set(codeHashStr, {
      codeHash: codeHash,
      contractByte: codeBytes,
      contractAddress: contractAddress,
    })
    return codeBytes
  }

  async putContractCode(contractAddress: Address, codeByte: Uint8Array): Promise<void> {
    const addressString = contractAddress.toString()

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    const codeHash = keccak256(codeByte)
    const codeHashStr = bytesToHex(codeHash)
    if (equalsBytes(codeHash, KECCAK256_NULL)) {
      return
    }

    const contractByteWrite: ContractByteWrite = {
      contractByte: codeByte,
      codeHash,
      contractAddress,
    }

    if (this.debugTrace)
      this.debugTraceLog(
        `putContractCode: addr:${addressString} codeHash:${codeHashStr} v:${bytesToHex(
          contractByteWrite.contractByte
        )}`
      )

    this.allContractBytesWrites.set(codeHashStr, contractByteWrite)
    this.allContractBytesWritesByAddress.set(addressString, contractByteWrite)

    this.touchedCAs.add(addressString)
  }

  insertFirstContractBytesReads(contractAddress: Address, codeByte: Uint8Array): void {
    const addressString = contractAddress.toString()

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    const codeHash = keccak256(codeByte)
    const codeHashStr = bytesToHex(codeHash)
    if (equalsBytes(codeHash, KECCAK256_NULL)) {
      return
    }
    this.firstContractBytesReads.set(codeHashStr, { codeHash, contractByte: codeByte, contractAddress })
    this.touchedCAs.add(addressString)
  }

  async getContractStorage(
    storage: Trie,
    contractAddress: Address,
    key: Uint8Array,
    originalOnly: boolean,
    canThrow: boolean
  ): Promise<Uint8Array> {
    const addressString = contractAddress.toString()
    const keyString = bytesToHex(key)

    if (originalOnly === false) {
      if (this.allContractStorageWrites.has(addressString)) {
        const contractStorageWrites = this.allContractStorageWrites.get(addressString)
        if (contractStorageWrites.has(keyString)) {
          const storedRlp = contractStorageWrites.get(keyString)
          const returnValue = storedRlp
            ? (RLP.decode(storedRlp ?? new Uint8Array(0)) as Uint8Array)
            : undefined
          if (this.debugTrace)
            this.debugTraceLog(
              `getContractStorage: (contractStorageWrites) addr:${addressString} key:${keyString} v:${
                returnValue ? bytesToHex(returnValue) : undefined
              }`
            )
          return returnValue
        }
      }
    }
    if (this.firstContractStorageReads.has(addressString)) {
      const contractStorageReads = this.firstContractStorageReads.get(addressString)
      if (contractStorageReads.has(keyString)) {
        const storedRlp = contractStorageReads.get(keyString)
        const returnValue = storedRlp ? (RLP.decode(storedRlp ?? new Uint8Array(0)) as Uint8Array) : undefined
        if (this.debugTrace)
          this.debugTraceLog(
            `getContractStorage: (contractStorageReads) addr:${addressString} key:${keyString} v:${
              returnValue ? bytesToHex(returnValue) : undefined
            }}`
          )
        return returnValue
      }
    }

    if (this.contractStorageInvolvedCB(this, addressString, keyString, false) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    let storedRlp
    let storedValue

    //get from accounts db
    //throw new Error('get from accounts db')
    // toShardusAddressWithKey.. use contract address followed by key
    const storageShardusAddress = toShardusAddressWithKey(
      addressString,
      keyString,
      AccountType.ContractStorage
    )
    const wrappedAccount = await AccountsStorage.getAccount(storageShardusAddress)
    if (wrappedAccount != null) {
      fixDeserializedWrappedEVMAccount(wrappedAccount)
      storedRlp = wrappedAccount.value
      storedValue = storedRlp ? RLP.decode(storedRlp) : undefined
    }

    //attempt to get data from tryGetRemoteAccountCB
    //this can be a long wait only suitable in some cases
    if (storedValue == undefined) {
      const wrappedEVMAccount = await this.tryGetRemoteAccountCB(
        this,
        AccountType.ContractStorage,
        addressString,
        keyString
      )
      if (wrappedEVMAccount != undefined && wrappedEVMAccount.value) {
        //get account aout of the wrapped evm account
        storedRlp = wrappedEVMAccount.value
        storedValue = storedRlp ? RLP.decode(storedRlp) : undefined
      }
    }

    //Storage miss!!!, account not on this shard
    if (storedValue == undefined) {
      //event callback to inidicate we do not have the account in this shard
      const isRemoteShard = await this.contractStorageMissCB(this, addressString, keyString)

      if (this.debugTrace)
        this.debugTraceLog(`getContractStorage: addr:${addressString} key:${keyString} v:notFound`)

      if (canThrow && isRemoteShard) throw new Error('account not available') //todo smarter throw?

      //RLP.decode(null) returns this:
      return Uint8Array.from([])
    }

    // storage hit!!! data exists in this shard
    //put this in our first reads map
    let contractStorageReads = this.firstContractStorageReads.get(addressString)
    if (contractStorageReads == null) {
      contractStorageReads = new Map()
      this.firstContractStorageReads.set(addressString, contractStorageReads)
    }
    contractStorageReads.set(keyString, storedRlp)

    if (this.debugTrace)
      this.debugTraceLog(
        `getContractStorage: addr:${addressString} key:${keyString} v:${
          storedValue ? bytesToHex(storedValue) : undefined
        }`
      )

    return storedValue
  }

  async putContractStorage(contractAddress: Address, key: Uint8Array, value: Uint8Array): Promise<void> {
    const addressString = contractAddress.toString()
    const keyString = bytesToHex(key)

    if (this.contractStorageInvolvedCB(this, addressString, keyString, true) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    value = unpadBytes(value) // Trims leading zeros from a Uint8Array.

    // Step 1 update the account storage
    const storedRlp = RLP.encode(value)
    let contractStorageWrites = this.allContractStorageWrites.get(addressString)
    if (contractStorageWrites == null) {
      contractStorageWrites = new Map()
      this.allContractStorageWrites.set(addressString, contractStorageWrites)
    }
    contractStorageWrites.set(keyString, storedRlp)

    if (this.debugTrace)
      this.debugTraceLog(
        `putContractStorage: addr:${addressString} key:${keyString} v:${
          value ? bytesToHex(value) : undefined
        }`
      )

    //here is our take on things:
    // todo investigate..  need to figure out if the code above does actually update the CA values storage hash or if that happens in commit?

    // TODO some part of our commit accounts to real storage need to exectute a version of:
    // _modifyContractStorage where we also mark the contract account as changed.. the actuall account wont finish changing until we mess with the
    // trie though.  OOF

    // was going to do that efficiently in a post receipt commit hook. may have to actuall checkpoint and revert tries but that is ugly.
    // in theory it should be ok as lont as everyone signs the same set of key updates.

    // current thinking, is that we can touch the CA to this set.
    // then after we have exectuted runTX we will call exectutePendingCAStateRoots() to use temporary trie commit/revert to update
    // CA values..  oh shoot.. we cant do this in a data forwarded situation.
    this.touchedCAs.add(addressString)
  }

  insertFirstContractStorageReads(address: Address, keyString: string, value: Uint8Array): void {
    const addressString = address.toString()

    if (this.contractStorageInvolvedCB(this, addressString, keyString, true) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    // todo research the meaning of this next line!!!!, borrowed from existing ethereumJS code
    value = unpadBytes(value)

    // Step 1 update the account storage
    // let storedRlp = RLP.encode(value)
    const storedRlp = value
    let contractStorageReads = this.firstContractStorageReads.get(addressString)
    if (contractStorageReads == null) {
      contractStorageReads = new Map()
      this.firstContractStorageReads.set(addressString, contractStorageReads)
    }
    contractStorageReads.set(keyString, storedRlp)
    this.touchedCAs.add(addressString)
  }

  //should go away with SaveEVMTries = false
  async exectutePendingCAStateRoots(): Promise<void> {
    //for all touched CAs,
    // get CA storage trie.
    // checkpoint the CA storage trie
    // update contract.storageRoot = storageTrie.root
    // await this.putAccount(address, contract)
    // revert the CA storage trie
    //OOF, this only work if the CA values are local (single shard).  we may not be able to sign CA roots in the main receipt, unless we have some
    // relevant merkle info and custom update code forwarded!
    // notes on an alternative..
    // the alternative could be to not care if CAs get updated after CA key values are updated per a receipt..  sounds a bit scary but is faster
    // It could be that this is the right answer for version 1 that is on a single shard anyhow!!
  }

  //should go away with SaveEVMTries = false
  async generateTrieProofs(): Promise<void> {
    //alternative to exectutePendingCAStateRoots
    //in this code we would look at all READ CA keys and create a set of proofs on checkpointed trie.
    //may have to insert a dummy write to the trie if there is none yet!
    //This would happen anytime we are about to jump to another shard
    //This gathered set of paths to the updated trie leafs could then be used by remote code to recalculate the CA final root even as
  }

  //async deleteAccount(address: Address) {
  //TODO have a decent amount of investigation to figure out the right way to handle account deletion
  // if (this.DEBUG) {
  //   debug(`Delete account ${address}`)
  // }
  // this._cache.del(address)
  // this.touchAccount(address)
  //}

  debugTraceLog(message: string): void {
    console.log(`DBG-Trace: ${this.linkedTX} msg:${message}`)
  }

  checkpoint(): void {
    if (ShardeumFlags.CheckpointRevertSupport === false) {
      return
    }

    //we need checkpoint / revert stack support for accounts so that gas is handled correctly
    //this.allAccountWritesStack.push(this.allAccountWrites)
    this.allAccountWritesStack.push(new Map<string, Uint8Array>())

    this.allAccountWrites = new Map()

    //this.canCommit = true
    this.checkpointCount++

    // if (this.debugTrace) this.debugTraceLog(`checkpointCount:${this.checkpointCount} checkpoint `)
    // if (this.debugTrace) console.log('checkpoint: allAccountWritesStack', this.logAccountWritesStack(this.allAccountWritesStack))
  }

  commit(): void {
    if (ShardeumFlags.CheckpointRevertSupport === false) {
      return
    }

    // can use this se we only commit once until there is another checkpoint?
    // if(this.canCommit === false){
    //   //todo log this
    //   return
    // }
    // this.canCommit = false

    // let preCheckpointLogic = true

    // if(preCheckpointLogic){

    //   //this is kind of strange, but if checkpoints represent the start of a set of changes,
    //   // then the way the rest of things work by putting currne changes in allAccountWrites
    //   // we need to actually make allAccountWrites be the top of the stack.

    //   //If this turns out to be the correct way to handle things, then we may want to do them in
    //   //a less hacky way.
    //   //this.checkpoint()

    //   this.allAccountWritesStack.push(this.allAccountWrites)

    //   this.allAccountWrites = new Map()
    // }

    // THIS version commits all in one go /////////////////
    //I think it is best to clear this. this will allow the newest values to get in
    //this does make some assumptions about how many times commit is called though..

    this.checkpointCount--
    if (this.debugTrace) this.debugTraceLog(`checkpointCount:${this.checkpointCount} commit `)

    if (this.checkpointCount > 0) {
      //pop the top checkpoint
      const accountWrites = this.allAccountWritesStack.pop()
      const newTop = this.allAccountWritesStack[this.allAccountWritesStack.length - 1]
      //flatten these values to the new top
      for (const [key, value] of accountWrites.entries()) {
        newTop.set(key, value)
      }
      // if (this.debugTrace) console.log('commit: updated allAccountWritesStack', this.logAccountWritesStack(this.allAccountWritesStack))
    } else if (this.checkpointCount === 0) {
      // if (this.debugTrace) console.log('commit: allAccountWritesStack', this.logAccountWritesStack(this.allAccountWritesStack))
      this.flushToCommittedValues()
    }

    //not 100% sure if we should do this...
    //this.allAccountWrites.clear()
  }

  revert(): void {
    if (ShardeumFlags.CheckpointRevertSupport === false) {
      return
    }

    //we need checkpoint / revert stack support for accounts so that gas is handled correctly

    //the top of the stack becomes our base level set of values.
    //this.allAccountWrites = this.allAccountWritesStack.pop()

    this.allAccountWrites = this.allAccountWritesStack.pop()
    this.allAccountWrites.clear()

    //other saved values do not need a stack and are simply cleared:
    //this.allAccountWrites.clear()
    this.allContractStorageWrites.clear()
    this.allContractBytesWritesByAddress.clear()

    this.checkpointCount--
    if (this.debugTrace) this.debugTraceLog(`checkpointCount:${this.checkpointCount} revert `)
    if (this.debugTrace)
      console.log('revert: allAccountWritesStack', this.logAccountWritesStack(this.allAccountWritesStack))
    if (this.checkpointCount === 0) {
      //I think this is just supposed to tell the cache(if we had one) to save values to the trie
      // how does that apply to what we have given that we have no cache.
      //this.flushToCommittedValues()
    }

    if (ShardeumFlags.VerboseLogs) {
      // monitor counts the last tried remote accounts
      const lastAccountTryRemote =
        this.tryRemoteHistory.account.length > 0
          ? this.tryRemoteHistory.account[this.tryRemoteHistory.account.length - 1]
          : null
      const lastStorageTryRemote =
        this.tryRemoteHistory.storage.length > 0
          ? this.tryRemoteHistory.storage[this.tryRemoteHistory.storage.length - 1]
          : null
      const lastCodeBytesTryRemote =
        this.tryRemoteHistory.codeBytes.length > 0
          ? this.tryRemoteHistory.codeBytes[this.tryRemoteHistory.codeBytes.length - 1]
          : null

      if (lastAccountTryRemote != null) {
        this.monitorEventCB('shardeum', 'eoa_ca inject miss', 1, lastAccountTryRemote)
      }
      if (lastStorageTryRemote != null) {
        this.monitorEventCB('shardeum', 'account storage inject miss', 1, lastStorageTryRemote)
      }
      if (lastCodeBytesTryRemote != null) {
        this.monitorEventCB('shardeum', 'code bytes miss', 1, lastCodeBytesTryRemote)
      }
    }
  }

  flushToCommittedValues(): void {
    if (this.debugTrace) this.debugTraceLog(`Flushing the allAccountWritesStack to committedAccountWrites`)
    const allAtOnce = false
    if (allAtOnce) {
      this.committedAccountWrites.clear()
      for (let i = this.allAccountWritesStack.length - 1; i >= 0; i--) {
        // eslint-disable-next-line security/detect-object-injection
        const accountWrites = this.allAccountWritesStack[i]
        //process all the values in the stack
        for (const [key, value] of accountWrites.entries()) {
          //if our flattened list does not have the value yet
          if (this.committedAccountWrites.has(key) === false) {
            //then flatten the value from the stack into it
            this.committedAccountWrites.set(key, value)
          }
        }
      }
    } else {
      // this version commits one layer at a time /////
      const accountWrites = this.allAccountWritesStack.pop()
      for (const [key, value] of accountWrites.entries()) {
        //if our flattened list does not have the value yet
        if (this.committedAccountWrites.has(key) === false) {
          //then flatten the value from the stack into it
          this.committedAccountWrites.set(key, value)
        }
      }
    }
  }

  logAccountWrites(accountWrites: Map<string, Uint8Array>): Map<unknown, unknown> {
    const resultMap = new Map()
    for (const [key, value] of accountWrites.entries()) {
      const readableAccount: Account = Account.fromRlpSerializedAccount(value)
      const account: Account = new Account()
      account.nonce = readableAccount.nonce
      account.balance = readableAccount.balance
      resultMap.set(key, account)
    }
    return resultMap
  }

  logAccountWritesStack(accountWritesStack: Map<string, Uint8Array>[]): unknown[] {
    const resultStack = []
    for (const accountWrites of accountWritesStack) {
      const readableAccountWrites = this.logAccountWrites(accountWrites)
      resultStack.push(readableAccountWrites)
    }
    return resultStack
  }
}
