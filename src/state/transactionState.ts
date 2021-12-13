
import {
    Account,
    Address,
    toBuffer,
    keccak256,
    KECCAK256_NULL,
    rlp,
    unpadBuffer,
  } from 'ethereumjs-util'
import { SecureTrie as Trie } from 'merkle-patricia-tree'

export type accountEvent = (linkedTX: string, address: string) => Promise<void>
export type k2Event = (linkedTX: string, address: string, key: string) => Promise<void>

export interface ShardeumStorageCallbacks {
  storageMiss: accountEvent
  k2Miss: k2Event
}


//how to know about getting original version vs putted version..

//todo is secure trie the right version to use?  also when/where to commit/checpoint the tries
   //access pattern is a bit different
   //would be nice if shardus called put account data on a list of accounts for a given TX !!!

export default class TransactionState {
    linkedTX: string

    // account data
    firstReads: Map<string, Buffer>
    allWrites: Map<string, Buffer>

    // contract account key: value data
    firstK2Reads: Map<string,Map<string, Buffer>>
    allK2Writes: Map<string,Map<string, Buffer>>

    // touched CAs:
    touchedCAs: Set<string>

    accountStorageMissCB: accountEvent
    k2StorageMissCB: k2Event
    
    //??
    loadDataFromBuffer(){

    }

    //?
    saveDataToBuffer(){

    }

    loadData(callbacks:ShardeumStorageCallbacks, linkedTX, firstReads: Map<string, Buffer>, firstK2Reads: Map<string,Map<string, Buffer>>) {
        this.linkedTX = linkedTX

        //callbacks for storage events
        this.accountStorageMissCB = callbacks.storageMiss
        this.k2StorageMissCB = callbacks.k2Miss

        this.firstReads = new Map()
        this.allWrites = new Map()

        this.firstK2Reads = new Map()
        this.allK2Writes = new Map()

        this.touchedCAs = new Set()

        //load in the first reads
        if(firstReads != null){

        }

        //load in the first k2 reads
        if(firstK2Reads != null){

        }
    }

    // should be per accounts or a list of accounts??
    commitData(){
        //store all writes to the persistant trie.

    }


    async getAccount(storage:Trie, address: Address, originalOnly:boolean, canThrow: boolean): Promise<Account> {
        const addressString = address.buf.toString('hex')

        if(originalOnly === false){
          if(this.allWrites.has(addressString)){
              let storedRlp = this.allWrites.get(addressString)
              return storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
          }          
        }
        if(this.firstReads.has(addressString)){
            let storedRlp = this.firstReads.get(addressString)
            return storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined
        }

        //see if we can get it from the storage trie.
        let storedRlp = await storage.get(address.buf)
        let account = storedRlp ? Account.fromRlpSerializedAccount(storedRlp) : undefined

        //Storage miss!!!, account not on this shard
        if(account == undefined){
          //event callback to inidicate we do not have the account in this shard
          // not 100% if we should await this, may need some group discussion
          await this.accountStorageMissCB(this.linkedTX, addressString)

          if(canThrow)
            throw new Error('account not available') //todo smarter throw?

          return undefined //probably not good, can throw is just a temporary test option
        } 
         
        // storage hit!!! data exists in this shard
        //put this in our first reads map
        this.firstReads.set(addressString, storedRlp)
        return account 
    }

    /**
     * 
     * @param address - Address under which to store `account`
     * @param account - The account to store
     */
    putAccount(address: Address, account: Account) {
      const addressString = address.buf.toString('hex')

      let storedRlp = account.serialize()
      this.allWrites.set(addressString, storedRlp )
    }

    async getContractStorage(storage:Trie, address: Address, key: Buffer, originalOnly:boolean, canThrow: boolean): Promise<Buffer> {
      const addressString = address.buf.toString('hex')
      const keyString = key.toString('hex')

        if(originalOnly === false){
          if(this.allK2Writes.has(addressString)){
            let contractK2Writes = this.allK2Writes.get(addressString)
            if(contractK2Writes.has(keyString)){
                let storedRlp = contractK2Writes.get(keyString)
                return storedRlp ? rlp.decode(storedRlp) : undefined
            }             
          }
        }
        if(this.firstK2Reads.has(addressString)){
          let contractK2Reads = this.firstK2Reads.get(addressString)
          if(contractK2Reads.has(keyString)){
              let storedRlp = contractK2Reads.get(keyString)
              return storedRlp ? rlp.decode(storedRlp) : undefined
          }             
        }

        //see if we can get it from the storage trie.
        let storedRlp = await storage.get(address.buf)
        let storedValue = storedRlp ? rlp.decode(storedRlp) : undefined

        //Storage miss!!!, account not on this shard
        if(storedValue == undefined){
          //event callback to inidicate we do not have the account in this shard
          await this.k2StorageMissCB(this.linkedTX, addressString, keyString)

          if(canThrow)
            throw new Error('account not available') //todo smarter throw?

          return undefined //probably not good, can throw is just a temporary test option
        } 
         
        // storage hit!!! data exists in this shard
        //put this in our first reads map
        let contractK2Reads = this.firstK2Reads.get(addressString)
        if(contractK2Reads == null){
          contractK2Reads = new Map()
          this.firstK2Reads.set(addressString, contractK2Reads)   
        }
        contractK2Reads.set(keyString, storedRlp)

        return storedValue
    }

    async putContractStorage(address: Address, key: Buffer, value: Buffer): Promise<void> {

      const addressString = address.buf.toString('hex')

      // todo research the meaning of this next line!!!!, borrowed from existing ethereumJS code
      value = unpadBuffer(value)

      // Step 1 update the account storage
      let storedRlp = rlp.encode(value)
      let contractK2Writes = this.allK2Writes.get(addressString)
      if(contractK2Writes == null){
        contractK2Writes = new Map()
        this.allK2Writes.set(addressString, contractK2Writes)   
      }
      contractK2Writes.set(addressString, storedRlp )

      // for refrence this is the orginal code in put:
      // todo.  this next bit is ugly, need to figure out if we HAVE to to update the related account hash immediately.
      // probably yes, but oof!

      // await this._modifyContractStorage(address, async (storageTrie, done) => {
      //   if (value && value.length) {
      //     // format input
      //     const encodedValue = rlp.encode(value)
      //     if (this.DEBUG) {
      //       debug(`Update contract storage for account ${address} to ${short(value)}`)
      //     }
      //     await storageTrie.put(key, encodedValue)
      //   } else {
      //     // deleting a value
      //     if (this.DEBUG) {
      //       debug(`Delete contract storage for account`)
      //     }
      //     await storageTrie.del(key)
      //   }
      //   done()
      // })

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

    async exectutePendingCAStateRoots(){
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


    async generateTrieProofs(){
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
}