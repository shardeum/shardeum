import { Account, Address, bufferToHex, keccak256, KECCAK256_NULL, rlp, unpadBuffer } from 'ethereumjs-util'
import { SecureTrie as Trie } from 'merkle-patricia-tree'
import { ShardeumState } from '.'
import {ShardeumFlags} from '../shardeum/shardeumFlags'
import { zeroAddressAccount, zeroAddressStr } from '../utils'
import * as AccountsStorage from '../storage/accountStorage'
import { AccountType, WrappedEVMAccount } from '../shardeum/shardeumTypes'
import { toShardusAddress, toShardusAddressWithKey } from '../shardeum/evmAddress'
import { fixDeserializedWrappedEVMAccount } from '../shardeum/wrappedEVMAccountFunctions'

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

export interface ShardeumStorageCallbacks {
  storageMiss: accountEvent
  contractStorageMiss: contractStorageEvent
  accountInvolved: involvedEvent
  contractStorageInvolved: keyInvolvedEvent
  tryGetRemoteAccountCB: getAccountEvent
}

//how to know about getting original version vs putted version..

//todo is secure trie the right version to use?  also when/where to commit/checpoint the tries
//access pattern is a bit different
//would be nice if shardus called put account data on a list of accounts for a given TX !!!

export interface ContractByteWrite {
  contractByte: Buffer
  codeHash: Buffer
  contractAddress: Address
}

export default class TransactionState {
  //Shardus TXID
  linkedTX: string

  // link to the shardeumState singleton (todo refactor this as non member instance)
  shardeumState: ShardeumState

  // account data
  firstAccountReads: Map<string, Buffer>
  allAccountWrites: Map<string, Buffer>
  committedAccountWrites: Map<string, Buffer>

  allAccountWritesStack: Map<string, Buffer>[]

  // contract account key: value data
  firstContractStorageReads: Map<string, Map<string, Buffer>>
  allContractStorageWrites: Map<string, Map<string, Buffer>>

  // contract account key: value data
  firstContractBytesReads: Map<string, ContractByteWrite>
  allContractBytesWrites: Map<string, ContractByteWrite>
  allContractBytesWritesByAddress: Map<string, ContractByteWrite>

  // pending contract storage commits
  pendingContractStorageCommits: Map<string, Map<string, Buffer>>
  pendingContractBytesCommits: Map<string, Map<string, any>>

  // touched CAs:  //TBD step 2.+ see docs
  touchedCAs: Set<string>

  debugTrace: boolean

  createdTimestamp: number

  checkpointCount: number

  appData: any

  // callbacks
  accountMissCB: accountEvent
  contractStorageMissCB: contractStorageEvent
  accountInvolvedCB: involvedEvent
  contractStorageInvolvedCB: keyInvolvedEvent

  tryGetRemoteAccountCB: getAccountEvent

  resetTransactionState() {
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

    this.touchedCAs = new Set()

    this.checkpointCount = 0
  }

  initData(
    shardeumState: ShardeumState,
    callbacks: ShardeumStorageCallbacks,
    linkedTX,
    firstReads: Map<string, Buffer>,
    firstContractStorageReads: Map<string, Map<string, Buffer>>
  ) {
    this.createdTimestamp = Date.now()

    this.linkedTX = linkedTX

    this.shardeumState = shardeumState

    //callbacks for storage events
    this.accountMissCB = callbacks.storageMiss
    this.contractStorageMissCB = callbacks.contractStorageMiss
    this.accountInvolvedCB = callbacks.accountInvolved
    this.contractStorageInvolvedCB = callbacks.contractStorageInvolved
    this.tryGetRemoteAccountCB = callbacks.tryGetRemoteAccountCB

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

    this.touchedCAs = new Set()

    //load in the first reads
    if (firstReads != null) {
      this.firstAccountReads = firstReads
    }

    //load in the first contract storage reads
    if (firstContractStorageReads != null) {
      this.firstContractStorageReads = firstContractStorageReads
    }

    this.debugTrace = false

    this.checkpointCount = 0
  }

  getReadAccounts() {
    return {
      accounts: this.firstAccountReads,
      contractStorages: this.firstContractStorageReads,
      contractBytes: this.firstContractBytesReads,
    }
  }

  getWrittenAccounts() {
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
      contractBytes: this.allContractBytesWrites,
    }
  }

  getTransferBlob() {
    //this is the data needed to start computation on another shard
    return { accounts: this.firstAccountReads, kvPairs: this.firstContractStorageReads }
  }

  /**
   * repair the fields on this account.
   * accounts need some adjustments after being deseralized
   * @param account
   */
  static fixAccountFields(account) {
    //hmm some hacks to fix data after getting copied around..
    if (typeof account.nonce === 'string') {
      //account.nonce = new BN(account.nonce)

      //@ts-ignore
      if (account.nonce.startsWith('0x') === false) {
        //@ts-ignore
        account.nonce = '0x' + account.nonce
      }
    }
    // if(typeof account.balance === 'string'){
    //   account.balance = new BN('0x' + account.balance)
    // }
    if (typeof account.balance === 'string') {
      //account.balance = new BN( account.balance, 'hex')
      //@ts-ignore
      if (account.balance.startsWith('0x') === false) {
        //@ts-ignore
        account.balance = '0x' + account.balance
      }
      this.fixAccountBuffers(account)
    }
  }

  private static fixAccountBuffers(account) {
    if (account.stateRoot.data) {
      account.stateRoot = Buffer.from(account.stateRoot.data)
    }
    if (account.codeHash.data) {
      account.codeHash = Buffer.from(account.codeHash.data)
    }
  }

  /**
   * Call this from dapp.updateAccountFull / updateAccountPartial to commit changes to the EVM trie
   * @param addressString
   * @param account
   */
  async commitAccount(addressString: string, account: Account) {
    //store all writes to the persistant trie.
    let address = Address.fromString(addressString)

    if (ShardeumFlags.Virtual0Address && addressString === zeroAddressStr) {
      if (this.debugTrace) this.debugTraceLog(`commitAccount: addr:${addressString} } is neglected`)
      return
    }

    if (ShardeumFlags.SaveEVMTries) {
      this.shardeumState._trie.checkpoint()

      //IFF this is a contract account we need to update any pending contract storage values!!
      if (this.pendingContractStorageCommits.has(addressString)) {
        let contractStorageCommits = this.pendingContractStorageCommits.get(addressString)

        let storageTrie = await this.shardeumState._getStorageTrie(address)
        //what if storage trie was just created?
        storageTrie.checkpoint()
        //walk through all of these
        for (let entry of contractStorageCommits.entries()) {
          let keyString = entry[0]
          let value = entry[1] // need to check wrapping.  Does this need one more layer of toBuffer?/rlp?
          let keyBuffer = Buffer.from(keyString, 'hex')
          await storageTrie.put(keyBuffer, value)

          if (this.debugTrace)
            this.debugTraceLog(
              `commitAccount:contractStorage: addr:${addressString} key:${keyString} v:${value.toString(
                'hex'
              )}`
            )
        }
        await storageTrie.commit()

        //update the accounts state root!
        account.stateRoot = storageTrie.root
        //TODO:  handle key deletion
      }
      if (this.pendingContractBytesCommits.has(addressString)) {
        let contractBytesCommits = this.pendingContractBytesCommits.get(addressString)

        for (let [key, contractByteWrite] of contractBytesCommits) {
          let codeHash = contractByteWrite.codeHash
          let codeByte = contractByteWrite.codeByte
          if (ShardeumFlags.VerboseLogs)
            console.log(`Storing contract code for ${address.toString()}`, codeHash, codeByte)

          //decided to move this back to commit. since codebytes are global we need to be able to commit them without changing a contract account
          //push codeByte to the worldStateTrie.db
          //await this.shardeumState._trie.db.put(codeHash, codeByte)
          //account.codeHash = codeHash

          account.codeHash = contractByteWrite.codeHash

          if (this.debugTrace)
            this.debugTraceLog(
              `commitAccount:contractCode: addr:${addressString} codeHash:${codeHash.toString('hex')} v:${
                codeByte.length
              }`
            )
        }
      }

      TransactionState.fixAccountFields(account)

      account.stateRoot = Buffer.from(account.stateRoot)

      const accountObj = Account.fromAccountData(account)
      const accountRlp = accountObj.serialize()
      const accountKeyBuf = address.buf
      await this.shardeumState._trie.put(accountKeyBuf, accountRlp)

      await this.shardeumState._trie.commit()

      if (this.debugTrace)
        this.debugTraceLog(`commitAccount: addr:${addressString} v:${JSON.stringify(accountObj)}`)

      //TODO:  handle account deletion, if account is null. This is not a shardus concept yet
      //await this._trie.del(keyBuf)
    } else {
      //save to accounts
    }
  }

  /**
   * Call this from dapp.updateAccountFull / updateAccountPartial to commit changes to the EVM trie
   * @param contractAddress
   * @param codeHash
   * @param contractByte
   */
  async commitContractBytes(contractAddress: string, codeHash: Buffer, contractByte: Buffer) {
    if (ShardeumFlags.SaveEVMTries) {
      //only put this in the pending commit structure. we will do the real commit when updating the account
      if (this.pendingContractBytesCommits.has(contractAddress)) {
        let contractBytesCommit = this.pendingContractBytesCommits.get(contractAddress)
        if (contractBytesCommit.has(codeHash.toString('hex'))) {
          contractBytesCommit.set(codeHash.toString('hex'), { codeHash, codeByte: contractByte })
        }
      } else {
        let contractBytesCommit = new Map()
        contractBytesCommit.set(codeHash.toString('hex'), { codeHash, codeByte: contractByte })
        this.pendingContractBytesCommits.set(contractAddress, contractBytesCommit)
      }

      //Update the trie right away.  This used to be queued and only committed at the same time as the CA
      //Since CA bytes are global we must commit them right away because there will not be CA being updated in the same transaction any more
      this.shardeumState._trie.checkpoint()
      await this.shardeumState._trie.db.put(codeHash, contractByte)
      await this.shardeumState._trie.commit()

      if (this.debugTrace)
        this.debugTraceLog(
          `commitContractBytes:contractCode codeHash:${codeHash.toString('hex')} v:${contractByte.toString(
            'hex'
          )}`
        )
    }
  }

  async commitContractStorage(contractAddress: string, keyString: string, value: Buffer) {
    //store all writes to the persistant trie.
    if (ShardeumFlags.SaveEVMTries) {
      //only put this in the pending commit structure. we will do the real commit when updating the account
      if (this.pendingContractStorageCommits.has(contractAddress)) {
        let contractStorageCommits = this.pendingContractStorageCommits.get(contractAddress)
        if (!contractStorageCommits.has(keyString)) {
          contractStorageCommits.set(keyString, value)
        }
      } else {
        let contractStorageCommits = new Map()
        contractStorageCommits.set(keyString, value)
        this.pendingContractStorageCommits.set(contractAddress, contractStorageCommits)
      }
    }
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
        let storedRlp = this.allAccountWrites.get(addressString)
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
        let accountWrites = this.allAccountWritesStack[i]
        if (accountWrites.has(addressString)) {
          let storedRlp = accountWrites.get(addressString)
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
      let storedRlp = this.committedAccountWrites.get(addressString)
      account = storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
      if (this.debugTrace)
        this.debugTraceLog(
          `getAccount:(committedAccountWrites) addr:${addressString} balance:${account?.balance} nonce:${account?.nonce}`
        )
      return account
    }

    if (this.firstAccountReads.has(addressString)) {
      let storedRlp = this.firstAccountReads.get(addressString)
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

    let storedRlp: Buffer

    if (ShardeumFlags.SaveEVMTries) {
      //see if we can get it from the storage trie.
      storedRlp = await worldStateTrie.get(address.buf)
      account = storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
    } else {
      //get from accounts
      //throw new Error('get from accounts db')

      //figure out if addres to string is ok...
      //also what about RLP format... need to do the extra conversions now, but plan on the best conversion.
      let accountShardusAddress = toShardusAddress(address.toString(), AccountType.Account)
      let wrappedAccount = await AccountsStorage.getAccount(accountShardusAddress)
      if (wrappedAccount != null) {
        fixDeserializedWrappedEVMAccount(wrappedAccount)
        account = wrappedAccount.account
      }

      if (account != null) {
        storedRlp = account.serialize()
      }

      if (this.debugTrace)
        this.debugTraceLog(
          `getAccount:(AccountsStorage) addr:${addressString} balance:${account?.balance} nonce:${account?.nonce}`
        )
    }

    //attempt to get data from tryGetRemoteAccountCB
    //this can be a long wait only suitable in some cases
    if (account == undefined) {
      let wrappedEVMAccount = await this.tryGetRemoteAccountCB(this, AccountType.Account, addressString, null)
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
      let isRemoteShard = await this.accountMissCB(this, addressString)

      if (this.debugTrace) this.debugTraceLog(`getAccount: addr:${addressString} v:notFound`)

      if (canThrow && isRemoteShard) throw new Error('account in remote shard, abort') //todo smarter throw?

      //return a new unitizlied account
      account = new Account()
      //;(account as any).virtual = true
      //this._update(address, account, false, false, true)

      //todo need to insert it into a map of new / virtual accounts?

      return account
    }

    if (this.debugTrace) this.debugTraceLog(`getAccount: addr:${addressString} v:${JSON.stringify(account)}`)
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
  putAccount(address: Address, account: Account) {
    const addressString = address.toString()

    if (ShardeumFlags.Virtual0Address && addressString === zeroAddressStr) {
      if (this.debugTrace) this.debugTraceLog(`putAccount: addr:${addressString} is neglected`)
      return
    }

    if (/*this.debugTrace &&*/ ShardeumFlags.VerboseLogs) {
      //print the calls stack that is calling put account
      let er = new Error()
      console.log(`put account: ${addressString} tx:${this.linkedTX} stack: ${er.stack} `)      
    }

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed, cant involve account')
    }
    TransactionState.fixAccountFields(account)

    const accountObj = Account.fromAccountData(account)
    let storedRlp = accountObj.serialize()

    if (this.debugTrace)
      this.debugTraceLog(`putAccount: addr:${addressString} v:${JSON.stringify(accountObj)}`)

    //this.allAccountWrites.set(addressString, storedRlp)

    //this.checkpoints[this.checkpoints.length - 1]
    if (this.allAccountWritesStack.length > 0) {
      let accountWrites = this.allAccountWritesStack[this.allAccountWritesStack.length - 1]
      accountWrites.set(addressString, storedRlp)
    } else {
      //if we are not using checkpoints then use this data to set first account reads
      this.firstAccountReads.set(addressString, storedRlp)
    }
  }

  insertFirstAccountReads(address: Address, account: Account) {
    const addressString = address.toString()

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed, cant involve account')
    }

    TransactionState.fixAccountFields(account)

    const accountObj = Account.fromAccountData(account)
    let storedRlp = accountObj.serialize()
    this.firstAccountReads.set(addressString, storedRlp)
  }

  async getContractCode(
    worldStateTrie: Trie,
    contractAddress: Address,
    originalOnly: boolean,
    canThrow: boolean
  ): Promise<Buffer> {
    const addressString = contractAddress.toString()

    //first get the account so we can have the correct code hash to look at
    let contractAccount = await this.getAccount(worldStateTrie, contractAddress, originalOnly, canThrow)
    if (contractAccount == undefined) {
      if (this.debugTrace)
        this.debugTraceLog(`getContractCode: addr:${addressString} Found no contract account`)
      return
    }
    let codeHash = contractAccount.codeHash
    let codeHashStr = codeHash.toString('hex')

    if (originalOnly === false) {
      if (this.allContractBytesWrites.has(codeHashStr)) {
        let codeBytes = this.allContractBytesWrites.get(codeHashStr).contractByte
        if (this.debugTrace)
          this.debugTraceLog(
            `getContractCode: (allContractBytesWrites) addr:${addressString} codeHashStr:${codeHashStr} v:${codeBytes.length}`
          )
        return codeBytes
      }
      if (this.allContractBytesWritesByAddress.has(addressString)) {
        let codeBytes = this.allContractBytesWritesByAddress.get(addressString).contractByte
        if (this.debugTrace)
          this.debugTraceLog(
            `getContractCode: (allContractBytesWritesByAddress) addr:${addressString} v:${codeBytes.length}`
          )
        return codeBytes
      }
    }
    if (this.firstContractBytesReads.has(codeHashStr)) {
      let codeBytes = this.firstContractBytesReads.get(codeHashStr).contractByte
      if (this.debugTrace)
        this.debugTraceLog(
          `getContractCode: (firstContractBytesReads) addr:${addressString} codeHashStr:${codeHashStr} v:${codeBytes.length}`
        )
      return codeBytes
    }

    if (this.accountInvolvedCB(this, addressString, true) === false) {
      throw new Error('unable to proceed, cant involve contract bytes')
    }

    let storedCodeByte: Buffer
    let codeBytes: Buffer
    if (ShardeumFlags.SaveEVMTries) {
      //see if we can get it from the worldStateTrie.db
      storedCodeByte = await worldStateTrie.db.get(codeHash)
      codeBytes = storedCodeByte // seems to be no conversio needed for codebytes.
    } else {
      //get from accounts db
      //throw new Error('get from accounts db')

      //need: contract address,  code hash  for toShardusAddressWithKey
      let bytesShardusAddress = toShardusAddressWithKey(addressString, codeHashStr, AccountType.ContractCode)
      let wrappedAccount = await AccountsStorage.getAccount(bytesShardusAddress)
      if (wrappedAccount != null) {
        fixDeserializedWrappedEVMAccount(wrappedAccount)
        storedCodeByte = wrappedAccount.codeByte
        codeBytes = storedCodeByte
      }
    }

    //attempt to get data from tryGetRemoteAccountCB
    //this can be a long wait only suitable in some cases
    if (codeBytes == undefined) {
      let wrappedEVMAccount = await this.tryGetRemoteAccountCB(
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
      let isRemoteShard = await this.accountMissCB(this, codeHashStr)

      if (this.debugTrace)
        this.debugTraceLog(
          `getContractCode: addr:${addressString} codeHashStr:${codeHashStr} v:undefined isRemoteShard:${isRemoteShard}`
        )

      if (canThrow && isRemoteShard) throw new Error('codeBytes in remote shard, abort') //todo smarter throw?

      //return unitiazlied new code bytes
      //todo need to insert it into a map of new / virtual accounts?
      return Buffer.alloc(0)
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

  async putContractCode(contractAddress: Address, codeByte: Buffer) {
    const addressString = contractAddress.toString()

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    const codeHash = keccak256(codeByte)
    if (codeHash.equals(KECCAK256_NULL)) {
      return
    }

    let contractByteWrite: ContractByteWrite = {
      contractByte: codeByte,
      codeHash,
      contractAddress,
    }

    if (this.debugTrace)
      this.debugTraceLog(
        `putContractCode: addr:${addressString} codeHash:${codeHash.toString(
          'hex'
        )} v:${contractByteWrite.contractByte.toString('hex')}`
      )

    this.allContractBytesWrites.set(codeHash.toString('hex'), contractByteWrite)
    this.allContractBytesWritesByAddress.set(addressString, contractByteWrite)

    this.touchedCAs.add(addressString)
  }

  insertFirstContractBytesReads(contractAddress: Address, codeByte: Buffer) {
    const addressString = contractAddress.toString()

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    const codeHash = keccak256(codeByte)
    const codeHashStr = codeHash.toString('hex')
    if (codeHash.equals(KECCAK256_NULL)) {
      return
    }
    this.firstContractBytesReads.set(codeHashStr, { codeHash, contractByte: codeByte, contractAddress })
    this.touchedCAs.add(addressString)
  }

  async getContractStorage(
    storage: Trie,
    contractAddress: Address,
    key: Buffer,
    originalOnly: boolean,
    canThrow: boolean
  ): Promise<Buffer> {
    const addressString = contractAddress.toString()
    const keyString = key.toString('hex')

    if (originalOnly === false) {
      if (this.allContractStorageWrites.has(addressString)) {
        let contractStorageWrites = this.allContractStorageWrites.get(addressString)
        if (contractStorageWrites.has(keyString)) {
          let storedRlp = contractStorageWrites.get(keyString)
          let returnValue = storedRlp ? rlp.decode(storedRlp) : undefined
          if (this.debugTrace)
            this.debugTraceLog(
              `getContractStorage: (contractStorageWrites) addr:${addressString} key:${keyString} v:${returnValue?.toString(
                'hex'
              )}`
            )
          return returnValue
        }
      }
    }
    if (this.firstContractStorageReads.has(addressString)) {
      let contractStorageReads = this.firstContractStorageReads.get(addressString)
      if (contractStorageReads.has(keyString)) {
        let storedRlp = contractStorageReads.get(keyString)
        let returnValue = storedRlp ? rlp.decode(storedRlp) : undefined
        if (this.debugTrace)
          this.debugTraceLog(
            `getContractStorage: (contractStorageReads) addr:${addressString} key:${keyString} v:${returnValue?.toString(
              'hex'
            )}`
          )
        return returnValue
      }
    }

    if (this.contractStorageInvolvedCB(this, addressString, keyString, false) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    let storedRlp
    let storedValue
    if (ShardeumFlags.SaveEVMTries) {
      //see if we can get it from the storage trie.
      storedRlp = await storage.get(key)
      storedValue = storedRlp ? rlp.decode(storedRlp) : undefined
      if (ShardeumFlags.VerboseLogs) console.log(`storedValue for ${key.toString('hex')}`, storedValue)
    } else {
      //get from accounts db
      //throw new Error('get from accounts db')
      // toShardusAddressWithKey.. use contract address followed by key
      let storageShardusAddress = toShardusAddressWithKey(
        addressString,
        keyString,
        AccountType.ContractStorage
      )
      let wrappedAccount = await AccountsStorage.getAccount(storageShardusAddress)
      if (wrappedAccount != null) {
        fixDeserializedWrappedEVMAccount(wrappedAccount)
        storedRlp = wrappedAccount.value
        storedValue = storedRlp ? rlp.decode(storedRlp) : undefined
      }
    }

    //attempt to get data from tryGetRemoteAccountCB
    //this can be a long wait only suitable in some cases
    if (storedValue == undefined) {
      let wrappedEVMAccount = await this.tryGetRemoteAccountCB(
        this,
        AccountType.ContractStorage,
        addressString,
        keyString
      )
      if (wrappedEVMAccount != undefined && wrappedEVMAccount.value) {
        //get account aout of the wrapped evm account
        storedRlp = wrappedEVMAccount.value
        storedValue = storedRlp ? rlp.decode(storedRlp) : undefined
      }
    }

    //Storage miss!!!, account not on this shard
    if (storedValue == undefined) {
      //event callback to inidicate we do not have the account in this shard
      let isRemoteShard = await this.contractStorageMissCB(this, addressString, keyString)

      if (this.debugTrace)
        this.debugTraceLog(`getContractStorage: addr:${addressString} key:${keyString} v:notFound`)

      if (canThrow && isRemoteShard) throw new Error('account not available') //todo smarter throw?

      //rlp.decode(null) returns this:
      return Buffer.from([])
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
        `getContractStorage: addr:${addressString} key:${keyString} v:${storedValue.toString('hex')}`
      )

    return storedValue
  }

  async putContractStorage(contractAddress: Address, key: Buffer, value: Buffer): Promise<void> {
    const addressString = contractAddress.toString()
    const keyString = key.toString('hex')

    if (this.contractStorageInvolvedCB(this, addressString, keyString, true) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    value = unpadBuffer(value) // Trims leading zeros from a Buffer.

    // Step 1 update the account storage
    let storedRlp = rlp.encode(value)
    let contractStorageWrites = this.allContractStorageWrites.get(addressString)
    if (contractStorageWrites == null) {
      contractStorageWrites = new Map()
      this.allContractStorageWrites.set(addressString, contractStorageWrites)
    }
    contractStorageWrites.set(keyString, storedRlp)

    if (this.debugTrace)
      this.debugTraceLog(
        `putContractStorage: addr:${addressString} key:${keyString} v:${value.toString('hex')}`
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

  insertFirstContractStorageReads(address: Address, keyString: string, value: Buffer) {
    const addressString = address.toString()

    if (this.contractStorageInvolvedCB(this, addressString, keyString, true) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    // todo research the meaning of this next line!!!!, borrowed from existing ethereumJS code
    value = unpadBuffer(value)

    // Step 1 update the account storage
    // let storedRlp = rlp.encode(value)
    let storedRlp = value
    let contractStorageReads = this.firstContractStorageReads.get(addressString)
    if (contractStorageReads == null) {
      contractStorageReads = new Map()
      this.firstContractStorageReads.set(addressString, contractStorageReads)
    }
    contractStorageReads.set(keyString, storedRlp)
    this.touchedCAs.add(addressString)
  }

  //should go away with SaveEVMTries = false
  async exectutePendingCAStateRoots() {
    //for all touched CAs,
    // get CA storage trie.
    // checkpoint the CA storage trie
    // update contract.stateRoot = storageTrie.root
    // await this.putAccount(address, contract)
    // revert the CA storage trie
    //OOF, this only work if the CA values are local (single shard).  we may not be able to sign CA roots in the main receipt, unless we have some
    // relevant merkle info and custom update code forwarded!
    // notes on an alternative..
    // the alternative could be to not care if CAs get updated after CA key values are updated per a receipt..  sounds a bit scary but is faster
    // It could be that this is the right answer for version 1 that is on a single shard anyhow!!
  }

  //should go away with SaveEVMTries = false
  async generateTrieProofs() {
    //alternative to exectutePendingCAStateRoots
    //in this code we would look at all READ CA keys and create a set of proofs on checkpointed trie.
    //may have to insert a dummy write to the trie if there is none yet!
    //This would happen anytime we are about to jump to another shard
    //This gathered set of paths to the updated trie leafs could then be used by remote code to recalculate the CA final root even as
  }

  async deleteAccount(address: Address) {
    //TODO have a decent amount of investigation to figure out the right way to handle account deletion
    // if (this.DEBUG) {
    //   debug(`Delete account ${address}`)
    // }
    // this._cache.del(address)
    // this.touchAccount(address)
  }

  debugTraceLog(message: string) {
    if (ShardeumFlags.VerboseLogs) console.log(`DBG:${this.linkedTX} msg:${message}`)
  }

  checkpoint() {
    if (ShardeumFlags.CheckpointRevertSupport === false) {
      return
    }

    //we need checkpoint / revert stack support for accounts so that gas is handled correctly
    //this.allAccountWritesStack.push(this.allAccountWrites)
    this.allAccountWritesStack.push(new Map<string, Buffer>())

    this.allAccountWrites = new Map()

    //this.canCommit = true
    this.checkpointCount++

    // if (this.debugTrace) this.debugTraceLog(`checkpointCount:${this.checkpointCount} checkpoint `)
    // if (this.debugTrace) console.log('checkpoint: allAccountWritesStack', this.logAccountWritesStack(this.allAccountWritesStack))
  }

  commit() {
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
      let accountWrites = this.allAccountWritesStack.pop()
      let newTop = this.allAccountWritesStack[this.allAccountWritesStack.length - 1]
      //flatten these values to the new top
      for (let [key, value] of accountWrites.entries()) {
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

  revert() {
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
  }

  flushToCommittedValues() {
    if (this.debugTrace) this.debugTraceLog(`Flushing the allAccountWritesStack to committedAccountWrites`)
    let allAtOnce = false
    if (allAtOnce) {
      this.committedAccountWrites.clear()
      for (let i = this.allAccountWritesStack.length - 1; i >= 0; i--) {
        let accountWrites = this.allAccountWritesStack[i]
        //process all the values in the stack
        for (let [key, value] of accountWrites.entries()) {
          //if our flattened list does not have the value yet
          if (this.committedAccountWrites.has(key) === false) {
            //then flatten the value from the stack into it
            this.committedAccountWrites.set(key, value)
          }
        }
      }
    } else {
      // this version commits one layer at a time /////
      let accountWrites = this.allAccountWritesStack.pop()
      for (let [key, value] of accountWrites.entries()) {
        //if our flattened list does not have the value yet
        if (this.committedAccountWrites.has(key) === false) {
          //then flatten the value from the stack into it
          this.committedAccountWrites.set(key, value)
        }
      }
    }
  }

  logAccountWrites(accountWrites: Map<string, Buffer>) {
    let resultMap = new Map()
    for (const [key, value] of accountWrites.entries()) {
      let readableAccount: Account = Account.fromRlpSerializedAccount(value)
      let account: any = {}
      account.nonce = readableAccount.nonce.toString()
      account.balance = readableAccount.balance.toString()
      resultMap.set(key, account)
    }
    return resultMap
  }

  logAccountWritesStack(accountWritesStack: Map<string, Buffer>[]) {
    let resultStack = []
    for (let accountWrites of accountWritesStack) {
      let readableAccountWrites = this.logAccountWrites(accountWrites)
      resultStack.push(readableAccountWrites)
    }
    return resultStack
  }


}
