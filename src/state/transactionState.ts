import { Account, Address, bufferToHex, keccak256, KECCAK256_NULL, rlp, unpadBuffer } from 'ethereumjs-util'
import { SecureTrie as Trie } from 'merkle-patricia-tree'
import { ShardeumState } from '.'
import * as ShardeumFlags from '../shardeum/shardeumFlags'
import {zeroAddressAccount, zeroAddressStr} from "../utils";

export type accountEvent = (transactionState: TransactionState, address: string) => Promise<boolean>
export type contractStorageEvent = (transactionState: TransactionState, address: string, key: string) => Promise<boolean>
export type involvedEvent = (transactionState: TransactionState, address: string, isRead: boolean) => boolean
export type keyInvolvedEvent = (transactionState: TransactionState, address: string, key: string, isRead: boolean) => boolean

export interface ShardeumStorageCallbacks {
  storageMiss: accountEvent
  contractStorageMiss: contractStorageEvent
  accountInvolved: involvedEvent
  contractStorageInvolved: keyInvolvedEvent
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

  // callbacks
  accountMissCB: accountEvent
  contractStorageMissCB: contractStorageEvent
  accountInvolvedCB: involvedEvent
  contractStorageInvolvedCB: keyInvolvedEvent

  resetTransactionState() {
    this.firstAccountReads = new Map()
    this.allAccountWrites = new Map()

    this.firstContractStorageReads = new Map()
    this.allContractStorageWrites = new Map()

    this.firstContractBytesReads = new Map()
    this.allContractBytesWrites = new Map()
    this.allContractBytesWritesByAddress = new Map()

    this.pendingContractStorageCommits = new Map()
    this.pendingContractBytesCommits = new Map()

    this.touchedCAs = new Set()
  }

  initData(
    shardeumState: ShardeumState,
    callbacks: ShardeumStorageCallbacks,
    linkedTX,
    firstReads: Map<string, Buffer>,
    firstContractStorageReads: Map<string, Map<string, Buffer>>
  ) {
    this.linkedTX = linkedTX

    this.shardeumState = shardeumState

    //callbacks for storage events
    this.accountMissCB = callbacks.storageMiss
    this.contractStorageMissCB = callbacks.contractStorageMiss
    this.accountInvolvedCB = callbacks.accountInvolved
    this.contractStorageInvolvedCB = callbacks.contractStorageInvolved

    this.firstAccountReads = new Map()
    this.allAccountWrites = new Map()

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

    this.debugTrace = true
  }

  getWrittenAccounts() {
    //let the apply function take care of wrapping these accounts?
    return { accounts: this.allAccountWrites, contractStorages: this.allContractStorageWrites, contractBytes: this.allContractBytesWrites }
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
  static fixUpAccountFields(account) {
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
    }
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

        if (this.debugTrace) this.debugTraceLog(`commitAccount:contractStorage: addr:${addressString} key:${keyString} v:${value.toString('hex')}`)
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
        if(ShardeumFlags.VerboseLogs) console.log( `Storing contract code for ${address.toString()}`, codeHash, codeByte)

        //decided to move this back to commit. since codebytes are global we need to be able to commit them without changing a contract account
        //push codeByte to the worldStateTrie.db
        //await this.shardeumState._trie.db.put(codeHash, codeByte)
        //account.codeHash = codeHash

        account.codeHash = contractByteWrite.codeHash

        if (this.debugTrace) this.debugTraceLog(`commitAccount:contractCode: addr:${addressString} codeHash:${codeHash.toString('hex')} v:${codeByte.length}`)
      }
    }

    TransactionState.fixUpAccountFields(account)

    account.stateRoot = Buffer.from(account.stateRoot)

    const accountObj = Account.fromAccountData(account)
    const accountRlp = accountObj.serialize()
    const accountKeyBuf = address.buf
    await this.shardeumState._trie.put(accountKeyBuf, accountRlp)

    await this.shardeumState._trie.commit()

    if (this.debugTrace) this.debugTraceLog(`commitAccount: addr:${addressString} v:${JSON.stringify(accountObj)}`)

    //TODO:  handle account deletion, if account is null. This is not a shardus concept yet
    //await this._trie.del(keyBuf)
  }

  /**
   * Call this from dapp.updateAccountFull / updateAccountPartial to commit changes to the EVM trie
   * @param contractAddress
   * @param codeHash
   * @param contractByte
   */
   async commitContractBytes(contractAddress: string, codeHash: Buffer, contractByte: Buffer) {
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

    if (this.debugTrace) this.debugTraceLog(`commitContractBytes:contractCode codeHash:${codeHash.toString('hex')} v:${contractByte.toString('hex')}`)
  }

  async commitContractStorage(contractAddress: string, keyString: string, value: Buffer) {
    //store all writes to the persistant trie.

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

  async getAccount(worldStateTrie: Trie, address: Address, originalOnly: boolean, canThrow: boolean): Promise<Account> {
    const addressString = address.toString()

    if (ShardeumFlags.Virtual0Address && addressString === zeroAddressStr) {
      return zeroAddressAccount
    }

    if (originalOnly === false) {
      if (this.allAccountWrites.has(addressString)) {
        let storedRlp = this.allAccountWrites.get(addressString)
        return storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
      }
    }
    if (this.firstAccountReads.has(addressString)) {
      let storedRlp = this.firstAccountReads.get(addressString)
      return storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
    }

    if (this.accountInvolvedCB(this, addressString, true) === false) {
      throw new Error('unable to proceed, cant involve account')
    }

    //see if we can get it from the storage trie.
    let storedRlp = await worldStateTrie.get(address.buf)
    let account = storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined

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

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed, cant involve account')
    }
    TransactionState.fixUpAccountFields(account)

    const accountObj = Account.fromAccountData(account)
    let storedRlp = accountObj.serialize()

    if (this.debugTrace) this.debugTraceLog(`putAccount: addr:${addressString} v:${JSON.stringify(accountObj)}`)

    this.allAccountWrites.set(addressString, storedRlp)
  }

  insertFirstAccountReads(address: Address, account: Account) {
    const addressString = address.toString()

    if (this.accountInvolvedCB(this, addressString, false) === false) {
      throw new Error('unable to proceed, cant involve account')
    }

    TransactionState.fixUpAccountFields(account)

    const accountObj = Account.fromAccountData(account)
    let storedRlp = accountObj.serialize()
    this.firstAccountReads.set(addressString, storedRlp)
  }

  async getContractCode(worldStateTrie: Trie, contractAddress: Address, originalOnly: boolean, canThrow: boolean): Promise<Buffer> {
    const addressString = contractAddress.toString()

    //first get the account so we can have the correct code hash to look at
    let contractAccount = await this.getAccount(worldStateTrie, contractAddress, originalOnly, canThrow)
    let codeHash = contractAccount.codeHash
    let codeHashStr = codeHash.toString('hex')

    if (originalOnly === false) {
      if (this.allContractBytesWrites.has(codeHashStr)) {
        let codeBytes = this.allContractBytesWrites.get(codeHashStr).contractByte
        if (this.debugTrace) this.debugTraceLog(`getContractCode: (allContractBytesWrites) addr:${addressString} codeHashStr:${codeHashStr} v:${codeBytes.length}`)
        return codeBytes
      }
      if (this.allContractBytesWritesByAddress.has(addressString)) {
        let codeBytes = this.allContractBytesWritesByAddress.get(addressString).contractByte
        if (this.debugTrace) this.debugTraceLog(`getContractCode: (allContractBytesWritesByAddress) addr:${addressString} v:${codeBytes.length}`)
        return codeBytes
      }
    }
    if (this.firstContractBytesReads.has(codeHashStr)) {
      let codeBytes = this.firstContractBytesReads.get(codeHashStr).contractByte
      if (this.debugTrace) this.debugTraceLog(`getContractCode: (firstContractBytesReads) addr:${addressString} codeHashStr:${codeHashStr} v:${codeBytes.length}`)
      return codeBytes
    }

    if (this.accountInvolvedCB(this, addressString, true) === false) {
      throw new Error('unable to proceed, cant involve contract bytes')
    }

    //see if we can get it from the worldStateTrie.db
    let storedCodeByte = await worldStateTrie.db.get(codeHash)
    let codeBytes = storedCodeByte // seems to be no conversio needed for codebytes.

    //Storage miss!!!, account not on this shard
    if (codeBytes == undefined) {
      //event callback to inidicate we do not have the account in this shard
      // not 100% if we should await this, may need some group discussion
      let isRemoteShard = await this.accountMissCB(this, codeHashStr)

      if (this.debugTrace) this.debugTraceLog(`getContractCode: addr:${addressString} codeHashStr:${codeHashStr} v:undefined`)

      if (canThrow && isRemoteShard) throw new Error('codeBytes in remote shard, abort') //todo smarter throw?

      //return unitiazlied new code bytes
      //todo need to insert it into a map of new / virtual accounts?
      return Buffer.alloc(0)
    }

    if (this.debugTrace) this.debugTraceLog(`getContractCode: addr:${addressString} codeHashStr:${codeHashStr} v:${codeBytes.length}`)

    // storage hit!!! data exists in this shard
    //put this in our first reads map
    this.firstContractBytesReads.set(codeHashStr, { codeHash: codeHash, contractByte: codeBytes, contractAddress: contractAddress })
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
      this.debugTraceLog(`putContractCode: addr:${addressString} codeHash:${codeHash.toString('hex')} v:${contractByteWrite.contractByte.toString('hex')}`)

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
    if (codeHash.equals(KECCAK256_NULL)) {
      return
    }
    this.firstContractBytesReads.set(bufferToHex(codeHash), { codeHash, contractByte: codeByte, contractAddress })
    this.touchedCAs.add(addressString)
  }

  async getContractStorage(storage: Trie, contractAddress: Address, key: Buffer, originalOnly: boolean, canThrow: boolean): Promise<Buffer> {
    const addressString = contractAddress.toString()
    const keyString = key.toString('hex')

    if (originalOnly === false) {
      if (this.allContractStorageWrites.has(addressString)) {
        let contractStorageWrites = this.allContractStorageWrites.get(addressString)
        if (contractStorageWrites.has(keyString)) {
          let storedRlp = contractStorageWrites.get(keyString)
          let returnValue = storedRlp ? rlp.decode(storedRlp) : undefined
          if (this.debugTrace) this.debugTraceLog(`getContractStorage: (contractStorageWrites) addr:${addressString} key:${keyString} v:${returnValue?.toString('hex')}`)
          return returnValue
        }
      }
    }
    if (this.firstContractStorageReads.has(addressString)) {
      let contractStorageReads = this.firstContractStorageReads.get(addressString)
      if (contractStorageReads.has(keyString)) {
        let storedRlp = contractStorageReads.get(keyString)
        let returnValue = storedRlp ? rlp.decode(storedRlp) : undefined
        if (this.debugTrace) this.debugTraceLog(`getContractStorage: (contractStorageReads) addr:${addressString} key:${keyString} v:${returnValue?.toString('hex')}`)
        return returnValue
      }
    }

    if (this.contractStorageInvolvedCB(this, addressString, keyString, false) === false) {
      throw new Error('unable to proceed, cant involve contract storage')
    }

    //see if we can get it from the storage trie.
    let storedRlp = await storage.get(key)
    let storedValue = storedRlp ? rlp.decode(storedRlp) : undefined
    if(ShardeumFlags.VerboseLogs) console.log( `storedValue for ${key.toString('hex')}`, storedValue)

    //Storage miss!!!, account not on this shard
    if (storedValue == undefined) {
      //event callback to inidicate we do not have the account in this shard
      let isRemoteShard = await this.contractStorageMissCB(this, addressString, keyString)

      if (this.debugTrace) this.debugTraceLog(`getContractStorage: addr:${addressString} key:${keyString} v:notFound`)

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

    if (this.debugTrace) this.debugTraceLog(`getContractStorage: addr:${addressString} key:${keyString} v:${storedValue.toString('hex')}`)

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

    if (this.debugTrace) this.debugTraceLog(`putContractStorage: addr:${addressString} key:${keyString} v:${value.toString('hex')}`)

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
    if(ShardeumFlags.VerboseLogs) console.log( `DBG:${this.linkedTX} msg:${message}`)
  }
}
