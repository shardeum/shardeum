import { debug as createDebugLogger } from 'debug'
import {
  Account,
  Address,
  bytesToBigInt,
  bytesToHex,
  bytesToUnprefixedHex,
  KECCAK256_NULL_S,
  KECCAK256_RLP_S,
  PrefixedHexString,
  unprefixedHexToBytes,
  short,
  bigIntToHex,
} from '@ethereumjs/util'
import { RLP } from '@ethereumjs/rlp'
import {
  AccountFields,
  Chain,
  Common,
  EVMStateManagerInterface,
  Hardfork,
  StorageDump,
} from '@ethereumjs/common'
import type { StorageRange } from '@ethereumjs/common/src'
import { OriginalStorageCache } from './cache/originalStorageCache'
import { CacheType, AccountCache, StorageCache } from './cache/index'
import TransactionState from './transactionState'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { Trie } from '@ethereumjs/trie'
import type { Debugger } from 'debug'
import { logFlags } from '..'

const debug = createDebugLogger('vm:state')

type AddressHex = string

export type StorageProof = {
  key: PrefixedHexString
  proof: PrefixedHexString[]
  value: PrefixedHexString
}

export type Proof = {
  address: PrefixedHexString
  balance: PrefixedHexString
  codeHash: PrefixedHexString
  nonce: PrefixedHexString
  storageHash: PrefixedHexString
  accountProof: PrefixedHexString[]
  storageProof: StorageProof[]
}

type CacheSettings = {
  deactivate: boolean
  type: CacheType
  size: number
}

/**
 * Options for constructing a {@link StateManager}.
 */
export interface DefaultStateManagerOpts {
  /**
   * Parameters of the chain {@link Common}
   */
  common?: Common
  /**
   * A {@link SecureTrie} instance
   */
  trie?: Trie
}

/**
 * Interface for getting and setting data from an underlying
 * state trie.
 */
export default class ShardeumState implements EVMStateManagerInterface {
  common: Common

  usedByApply: boolean //mark that this state has been used once by apply.  we need to prevent using it twice
  protected _debug: Debugger
  // protected _accountCache?: AccountCache
  // protected _storageCache?: StorageCache

  originalStorageCache: OriginalStorageCache

  _touched: Set<AddressHex>
  _touchedStack: Set<AddressHex>[]
  //_checkpointCount: number
  //_originalStorageCache: Map<AddressHex, Map<AddressHex, Buffer>>

  // EIP-2929 address/storage trackers.
  // This maps both the accessed accounts and the accessed storage slots.
  // It is a Map(Address => StorageSlots)
  // It is possible that the storage slots set is empty. This means that the address is warm.
  // It is not possible to have an accessed storage slot on a cold address (which is why this structure works)
  // Each call level tracks their access themselves.
  // In case of a commit, copy everything if the value does not exist, to the level above
  // In case of a revert, discard any warm slots.
  _accessedStorage: Map<string, Set<string>>[]

  // Backup structure for address/storage tracker frames on reverts
  // to also include on access list generation
  _accessedStorageReverted: Map<string, Set<string>>[]

  _transactionState: TransactionState

  //TODO remvoe this once SaveEVMTries option goes away
  _trie: Trie

  // protected _storageTries: { [key: string]: Trie }
  // protected _codeCache: { [key: string]: Uint8Array }

  // protected readonly _prefixCodeHashes: boolean
  // protected readonly _accountCacheSettings: CacheSettings
  // protected readonly _storageCacheSettings: CacheSettings

  /**
   * StateManager is run in DEBUG mode (default: false)
   * Taken from DEBUG environment variable
   *
   * Safeguards on debug() calls are added for
   * performance reasons to avoid string literal evaluation
   * @hidden
   */
  protected readonly DEBUG: boolean = true

  /**
   * Instantiate the StateManager interface.
   */
  constructor(opts: DefaultStateManagerOpts = {}) {
    let common = opts.common
    if (!common) {
      common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Istanbul })
    }
    this.common = common

    this.usedByApply = false

    this.originalStorageCache = new OriginalStorageCache(this.getContractStorage.bind(this))

    //this._cache = new Cache(this._trie)
    this._touched = new Set()
    this._touchedStack = []
    //this._checkpointCount = 0
    //this._originalStorageCache = new Map()
    this._accessedStorage = [new Map()]
    this._accessedStorageReverted = [new Map()]

    // this._storageTries = {}

    // Safeguard if "process" is not available (browser)
    if (process !== undefined && process.env.DEBUG) {
      this.DEBUG = true
    }

    this._transactionState = null
  }

  //critical to function
  setTransactionState(transactionState: TransactionState): void {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Setting new transactionState', transactionState.linkedTX)
    if (this._transactionState) {
      /* prettier-ignore */
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Try to set new transaction state ${transactionState.linkedTX}. But found existing transaction state ${this._transactionState.linkedTX}`)
      // TODO: we should find a way handle this condition
    }
    this._transactionState = transactionState
  }

  unsetTransactionState(txId: string): void {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Running unsetTransactionState', this._transactionState.linkedTX)
    if (this._transactionState.linkedTX !== txId) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Unable to unset transaction with different txId')
      // TODO: we should find a way handle this condition
    }
    this._transactionState = null
  }

  resetState(): void {
    //todo any other reset?

    this._transactionState.resetTransactionState()
  }

  /**
   * Copies the current instance of the `StateManager`
   * at the last fully committed point, i.e. as if all current
   * checkpoints were reverted.
   */
  copy(): EVMStateManagerInterface {
    return new ShardeumState({
      common: this.common,
    })
  }

  /**
   * Gets the account associated with `address`. Returns an empty account if the account does not exist.
   * @param address - Address of the `account` to get
   */
  async getAccount(address: Address): Promise<Account> {
    let testAccount
    //side run system on the side for now
    if (this._transactionState != null) {
      testAccount = await this._transactionState.getAccount(null, address, false, false)
      return testAccount
    }

    if (ShardeumFlags.VerboseLogs) console.log('Unable to find transactionState', address)
    return
  }

  /**
   * Saves an account into state under the provided `address`.
   * @param address - Address under which to store `account`
   * @param account - The account to store
   */
  async putAccount(address: Address, account: Account): Promise<void> {
    if (this._transactionState != null) {
      //side run system on the side for now
      this._transactionState.putAccount(address, account)
    }
    return
  }

  /**
   * Deletes an account from state under the provided `address`. The account will also be removed from the state trie.
   * @param address - Address of the account which should be deleted
   */
  async deleteAccount(address: Address): Promise<void> {
    if (this.DEBUG) {
      debug(`Delete account ${address}`)
    }

    return // I think we can just return and ignore this for now
    // need to actually create a plan for deleting data
  }

  /**
   * Marks an account as touched, according to the definition
   * in [EIP-158](https://eips.ethereum.org/EIPS/eip-158).
   * This happens when the account is triggered for a state-changing
   * event. Touched accounts that are empty will be cleared
   * at the end of the tx.
   */
  touchAccount(address: Address): void {
    this._touched.add(bytesToHex(address.bytes))
  }

  /**
   * Adds `value` to the state trie as code, and sets `codeHash` on the account
   * corresponding to `address` to reference this.
   * @param address - Address of the `account` to add the `code` for
   * @param value - The value of the `code`
   */
  async putContractCode(address: Address, value: Buffer): Promise<void> {
    //It could be triggering some marking/including of accounts, but that
    //may be moot now.

    if (this._transactionState != null) {
      //side run system on the side for now
      this._transactionState.putContractCode(address, value)
    }
    return
  }

  /**
   * Gets the code corresponding to the provided `address`.
   * @param address - Address to get the `code` for
   * @returns {Promise<Buffer>} -  Resolves with the code corresponding to the provided address.
   * Returns an empty `Buffer` if the account has no associated code.
   */
  async getContractCode(address: Address): Promise<Uint8Array> {
    //side run system on the side for now
    if (this._transactionState != null) {
      const testAccount = await this._transactionState.getContractCode(null, address, false, false)
      return testAccount
    }
    if (ShardeumFlags.VerboseLogs) console.log('Unable to find transactionState', address)
    return
  }

  /**
   * Creates a storage trie from the primary storage trie
   * for an account and saves this in the storage cache.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _lookupStorageTrie(address: Address): Promise<Trie> {
    throw new Error('_lookupStorageTrie not impl')
  }

  /**
   * Gets the storage value associated with the provided `address` and `key`. This method returns
   * the shortest representation of the stored value.
   * @param address -  Address of the account to get the storage for
   * @param key - Key in the account's storage to get the value for. Must be 32 bytes long.
   * @param originOnly
   * @returns {Promise<Buffer>} - The storage value for the account
   * corresponding to the provided address at the provided key.
   * If this does not exist an empty `Buffer` is returned.
   */
  async getContractStorage(address: Address, key: Uint8Array, originalOnly = false): Promise<Buffer> {
    let testAccount
    if (this._transactionState != null) {
      testAccount = await this._transactionState.getContractStorage(null, address, key, originalOnly, false)
      return testAccount
    }
    if (ShardeumFlags.VerboseLogs) console.log('Unable to find transactionState', address)
    return
  }

  /**
   * Caches the storage value associated with the provided `address` and `key`
   * on first invocation, and returns the cached (original) value from then
   * onwards. This is used to get the original value of a storage slot for
   * computing gas costs according to EIP-1283.
   * @param address - Address of the account to get the storage for
   * @param key - Key in the account's storage to get the value for. Must be 32 bytes long.
   */
  async getOriginalContractStorage(address: Address, key: Buffer): Promise<Uint8Array> {
    if (this._transactionState != null) {
      const testAccount = await this._transactionState.getContractStorage(null, address, key, true, false)
      return testAccount
    }
    if (ShardeumFlags.VerboseLogs) console.log('Unable to find transactionState', address)
    return
  }

  /**
   * Clears the original storage cache. Refer to {@link StateManager.getOriginalContractStorage}
   * for more explanation.
   */
  _clearOriginalStorageCache(): void {
    //this._originalStorageCache = new Map()
  }

  /**
   * Clears the original storage cache. Refer to {@link StateManager.getOriginalContractStorage}
   * for more explanation. Alias of the internal {@link StateManager._clearOriginalStorageCache}
   * TODO investigate this:
   * Is there any use in clearOriginalStorageCache??
   *
   */
  clearOriginalStorageCache(): void {
    this._clearOriginalStorageCache()
  }

  // /**
  //  * Modifies the storage trie of an account.
  //  * @private
  //  * @param address -  Address of the account whose storage is to be modified
  //  * @param modifyTrie - Function to modify the storage trie of the account
  //  */
  // protected async _modifyContractStorage(
  //   address: Address,
  //   account: Account,
  //   // eslint-disable-next-line @typescript-eslint/ban-types
  //   modifyTrie: (storageTrie: Trie, done: Function) => void
  // ): Promise<void> {
  //   // eslint-disable-next-line no-async-promise-executor
  //   return new Promise(async (resolve) => {
  //     const storageTrie = await this._getStorageTrie(address, account)

  //     modifyTrie(storageTrie, async () => {
  //       // update storage cache
  //       const addressHex = bytesToUnprefixedHex(address.bytes)
  //       this._storageTries[addressHex] = storageTrie

  //       // update contract storageRoot
  //       account.storageRoot = storageTrie.root()
  //       await this.putAccount(address, account)
  //       resolve()
  //     })
  //   })
  // }
  // protected async _writeContractStorage(
  //   address: Address,
  //   account: Account,
  //   key: Uint8Array,
  //   value: Uint8Array
  // ): Promise<void> {
  //   await this._modifyContractStorage(address, account, async (storageTrie, done) => {
  //     if (value instanceof Uint8Array && value.length) {
  //       // format input
  //       const encodedValue = RLP.encode(value)
  //       if (this.DEBUG) {
  //         this._debug(`Update contract storage for account ${address} to ${short(value)}`)
  //       }
  //       await storageTrie.put(key, encodedValue)
  //     } else {
  //       // deleting a value
  //       if (this.DEBUG) {
  //         this._debug(`Delete contract storage for account`)
  //       }
  //       await storageTrie.del(key)
  //     }
  //     done()
  //   })
  // }

  /**
   * Adds value to the state trie for the `account`
   * corresponding to `address` at the provided `key`.
   * @param address -  Address to set a storage value for
   * @param key - Key to set the value at. Must be 32 bytes long.
   * @param value - Value to set at `key` for account corresponding to `address`. Cannot be more than 32 bytes. Leading zeros are stripped. If it is a empty or filled with zeros, deletes the value.
   */
  async putContractStorage(address: Address, key: Buffer, value: Buffer): Promise<void> {
    if (key.length !== 32) {
      throw new Error('Storage key must be 32 bytes long')
    }

    if (value.length > 32) {
      throw new Error('Storage value cannot be longer than 32 bytes')
    }

    if (this._transactionState != null) {
      //side run system on the side for now
      this._transactionState.putContractStorage(address, key, value)
    }
    return
  }

  /**
   * Clears all storage entries for the account corresponding to `address`.
   * @param address -  Address to clear the storage of
   */
  async clearContractStorage(): Promise<void> {
    /* empty */
  }

  /**
   * Checkpoints the current state of the StateManager instance.
   * State changes that follow can then be committed by calling
   * `commit` or `reverted` by calling rollback.
   */
  async checkpoint(): Promise<void> {
    this._touchedStack.push(new Set(Array.from(this._touched)))

    if (this._transactionState != null) {
      this._transactionState.checkpoint()
    }
    return
  }

  /**
   * Commits the current change-set to the instance since the
   * last call to checkpoint.
   */
  async commit(): Promise<void> {
    this._touchedStack.pop()

    if (this._transactionState != null) {
      this._transactionState.commit()
    }
    return
  }

  /**
   * Merges a storage map into the last item of the accessed storage stack
   */
  // private _accessedStorageMerge(storageList: Map<string, Set<string>>[], storageMap: Map<string, Set<string>>) {
  //   const mapTarget = storageList[storageList.length - 1]

  //   if (mapTarget) {
  //     // Note: storageMap is always defined here per definition (TypeScript cannot infer this)
  //     storageMap?.forEach((slotSet: Set<string>, addressString: string) => {
  //       const addressExists = mapTarget.get(addressString)
  //       if (!addressExists) {
  //         mapTarget.set(addressString, new Set())
  //       }
  //       const storageSet = mapTarget.get(addressString)
  //       slotSet.forEach((value: string) => {
  //         storageSet!.add(value)
  //       })
  //     })
  //   }
  // }

  /**
   * Reverts the current change-set to the instance since the
   * last call to checkpoint.
   */
  async revert(): Promise<void> {
    if (this._transactionState != null) {
      this._transactionState.revert()
    }
    return
  }

  /**
   * Gets the state-root of the Merkle-Patricia trie representation
   * of the state of this StateManager. Will error if there are uncommitted
   * checkpoints on the instance.
   * @returns {Promise<Buffer>} - Returns the state-root of the `StateManager`
   */
  async getStateRoot(): Promise<Buffer> {
    //may not need to do anything. but we need to trace where this is used
    //looks like just Pre-Byzantium paths use this in a receipt
    //throw new Error('todo implement update to getStateRoot ')
    return Buffer.from([])
  }

  /**
   * Sets the state of the instance to that represented
   * by the provided `stateRoot`. Will error if there are uncommitted
   * checkpoints on the instance or if the state root does not exist in
   * the state trie.
   * @param stateRoot - The state-root to reset the instance to
   */
  async setStateRoot(): Promise<void> {
    //should not need this when we use runTX and no blocks
    return
  }

  /**
   * Dumps the RLP-encoded storage values for an `account` specified by `address`.
   * @param address - The address of the `account` to return storage for
   * @returns {Promise<StorageDump>} - The state of the account as an `Object` map.
   * Keys are the storage keys, values are the storage values as strings.
   * Both are represented as hex strings without the `0x` prefix.
   */
  async dumpStorage(): Promise<StorageDump> {
    // this was kinda nice. looks like we are loosing a way to find all of the storage for a single contract.
    //    ...would that be crazy to add to a relational DB.  After all this is just debugging stuff here
    return { result: 'no storage when SaveEVMTries === false' }
  }

  async dumpStorageRange(address: Address, startKey: bigint, limit: number): Promise<StorageRange> {
    if (!Number.isSafeInteger(limit) || limit < 0) {
      throw new Error(`Limit is not a proper uint.`)
    }

    await this.flush()
    const account = await this.getAccount(address)
    if (!account) {
      throw new Error(`Account does not exist.`)
    }

    return new Promise((resolve, reject) => {
      this._getStorageTrie(address, account)
        .then((trie) => {
          let inRange = false
          let i = 0

          /** Object conforming to {@link StorageRange.storage}. */
          const storageMap: StorageRange['storage'] = {}
          const stream = trie.createReadStream()

          stream.on('data', (val: any) => {
            if (!inRange) {
              // Check if the key is already in the correct range.
              if (bytesToBigInt(val.key) >= startKey) {
                inRange = true
              } else {
                return
              }
            }

            if (i < limit) {
              storageMap[bytesToHex(val.key)] = { key: null, value: bytesToHex(val.value) }
              i++
            } else if (i === limit) {
              resolve({
                storage: storageMap,
                nextKey: bytesToHex(val.key),
              })
            }
          })

          stream.on('end', () => {
            resolve({
              storage: storageMap,
              nextKey: null,
            })
          })
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  /**
   * Get an EIP-1186 proof
   * @param address address to get proof of
   * @param storageSlots storage slots to get proof of
   */
  async getProof(address: Address, storageSlots: Uint8Array[] = []): Promise<Proof> {
    const account = await this.getAccount(address)
    if (!account) {
      // throw new Error(`getProof() can only be called for an existing account`)
      const returnValue: Proof = {
        address: address.toString(),
        balance: '0x',
        codeHash: KECCAK256_NULL_S,
        nonce: '0x',
        storageHash: KECCAK256_RLP_S,
        accountProof: (await this._trie.createProof(address.bytes)).map((p) => bytesToHex(p)),
        storageProof: [],
      }
      return returnValue
    }
    const accountProof: PrefixedHexString[] = (await this._trie.createProof(address.bytes)).map((p) =>
      bytesToHex(p)
    )
    const storageProof: StorageProof[] = []
    const storageTrie = await this._getStorageTrie(address, account)

    for (const storageKey of storageSlots) {
      const proof = (await storageTrie.createProof(storageKey)).map((p) => bytesToHex(p))
      const value = bytesToHex(await this.getContractStorage(address, storageKey))
      const proofItem: StorageProof = {
        key: bytesToHex(storageKey),
        value: value === '0x' ? '0x0' : value, // Return '0x' values as '0x0' since this is a JSON RPC response
        proof,
      }
      storageProof.push(proofItem)
    }

    const returnValue: Proof = {
      address: address.toString(),
      balance: bigIntToHex(account.balance),
      codeHash: bytesToHex(account.codeHash),
      nonce: bigIntToHex(account.nonce),
      storageHash: bytesToHex(account.storageRoot),
      accountProof,
      storageProof,
    }
    return returnValue
  }

  async flush(): Promise<void> {
    throw new Error('flush is not valid for ShardeumState')

    // if (!this._storageCacheSettings.deactivate) {
    //   const items = this._storageCache!.flush()
    //   for (const item of items) {
    //     const address = Address.fromString(`0x${item[0]}`)
    //     const keyHex = item[1]
    //     const keyBytes = unprefixedHexToBytes(keyHex)
    //     const value = item[2]

    //     const decoded = RLP.decode(value ?? new Uint8Array(0)) as Uint8Array
    //     const account = await this.getAccount(address)
    //     if (account) {
    //       await this._writeContractStorage(address, account, keyBytes, decoded)
    //     }
    //   }
    // }
    // if (!this._accountCacheSettings.deactivate) {
    //   const items = this._accountCache!.flush()
    //   for (const item of items) {
    //     const addressHex = item[0]
    //     const addressBytes = unprefixedHexToBytes(addressHex)
    //     const elem = item[1]
    //     if (elem.accountRLP === undefined) {
    //       const trie = this._trie
    //       await trie.del(addressBytes)
    //     } else {
    //       const trie = this._trie
    //       await trie.put(addressBytes, elem.accountRLP)
    //     }
    //   }
    // }
  }

  /**
   * Checks whether the current instance has the canonical genesis state
   * for the configured chain parameters.
   * @returns {Promise<boolean>} - Whether the storage trie contains the
   * canonical genesis state for the configured chain parameters.
   */
  async hasGenesisState(): Promise<boolean> {
    //only matters if running a blockchain
    throw new Error('hasGenesisState not valid because we dont run an ethjs blockchain')

    // original
    // const root = this._common.genesis().stateRoot
    // return await this._trie.checkRoot(toBuffer(root))
  }

  /**
   * Generates a canonical genesis state on the instance based on the
   * configured chain parameters. Will error if there are uncommitted
   * checkpoints on the instance.
   */
  async generateCanonicalGenesis(): Promise<void> {
    //only matters if running a blockchain
    throw new Error('generateCanonicalGenesis not valid because we dont run an ethjs blockchain')
  }

  /**
   * Initializes the provided genesis state into the state trie
   * @param initState address -> balance | [balance, code, storage]
   */
  async generateGenesis(): Promise<void> {
    //only matters if running a blockchain
    throw new Error('generateGenesis not valid because we dont run an ethjs blockchain')
  }

  /**
   * Checks if the `account` corresponding to `address`
   * is empty or non-existent as defined in
   * EIP-161 (https://eips.ethereum.org/EIPS/eip-161).
   * @param address - Address to check
   */
  async accountIsEmpty(address: Address): Promise<boolean> {
    const account = await this.getAccount(address)
    return account == null || account.isEmpty()
  }

  /**
   * Checks if the `account` corresponding to `address`
   * exists
   * @param address - Address of the `account` to check
   */
  async accountExists(address: Address): Promise<boolean> {
    // let accountShardusAddress = toShardusAddress(address.toString(), AccountType.Account)
    // let exists = await AccountsStorage.accountExists(accountShardusAddress)
    // return exists

    const account = await this.getAccount(address)
    return account != null //&& account.isEmpty() === false
  }

  /**
   * Returns true if the address is warm in the current context
   * @param address - The address (as a Buffer) to check
   */
  isWarmedAddress(address: Buffer): boolean {
    for (let i = this._accessedStorage.length - 1; i >= 0; i--) {
      // eslint-disable-next-line security/detect-object-injection
      const currentMap = this._accessedStorage[i]
      if (currentMap.has(address.toString())) {
        return true
      }
    }
    return false
  }

  /** EIP-2929 logic
   * This should only be called from within the EVM
   * TODO need to push this into transaction state?
   *   or is it light enought to leave on state manager
   */

  /**
   * Add a warm address in the current context
   * @param address - The address (as a Buffer) to check
   */
  addWarmedAddress(address: Buffer): void {
    const key = address.toString()
    const storageSet = this._accessedStorage[this._accessedStorage.length - 1].get(key)
    if (!storageSet) {
      const emptyStorage = new Set<string>()
      this._accessedStorage[this._accessedStorage.length - 1].set(key, emptyStorage)
    }
  }

  /**
   * Returns true if the slot of the address is warm
   * @param address - The address (as a Buffer) to check
   * @param slot - The slot (as a Buffer) to check
   */
  isWarmedStorage(address: Buffer, slot: Buffer): boolean {
    const addressKey = address.toString()
    const storageKey = slot.toString()

    for (let i = this._accessedStorage.length - 1; i >= 0; i--) {
      // eslint-disable-next-line security/detect-object-injection
      const currentMap = this._accessedStorage[i]
      if (currentMap.has(addressKey) && currentMap.get(addressKey)!.has(storageKey)) {
        return true
      }
    }

    return false
  }

  /**
   * Mark the storage slot in the address as warm in the current context
   * @param address - The address (as a Buffer) to check
   * @param slot - The slot (as a Buffer) to check
   */
  addWarmedStorage(address: Buffer, slot: Buffer): void {
    const addressKey = address.toString()
    let storageSet = this._accessedStorage[this._accessedStorage.length - 1].get(addressKey)
    if (!storageSet) {
      storageSet = new Set()
      this._accessedStorage[this._accessedStorage.length - 1].set(addressKey, storageSet!)
    }
    storageSet!.add(slot.toString())
  }

  /**
   * Clear the warm accounts and storage. To be called after a transaction finished.
   * @param boolean - If true, returns an EIP-2930 access list generated
   */
  clearWarmedAccounts(): void {
    this._accessedStorage = [new Map()]
    this._accessedStorageReverted = [new Map()]
  }

  /**
   * Removes accounts form the state trie that have been touched,
   * as defined in EIP-161 (https://eips.ethereum.org/EIPS/eip-161).
   */
  async cleanupTouchedAccounts(): Promise<void> {
    this._touched.clear()

    // not sure yet if we need to implement this..
    //throw new Error('cleanupTouchedAccounts not implemented yet when SaveEVMTries === false')
    return

    // TODO do we need to bring back some of this functionality?

    // if (this._common.gteHardfork('spuriousDragon')) {
    //   const touchedArray = Array.from(this._touched)
    //   for (const addressHex of touchedArray) {
    //     const address = new Address(Buffer.from(addressHex, 'hex'))
    //     const empty = await this.accountIsEmpty(address)
    //     if (empty) {
    //       this._cache.del(address)
    //       if (this.DEBUG) {
    //         debug(`Cleanup touched account address=${address} (>= SpuriousDragon)`)
    //       }
    //     }
    //   }
    // }
  }

  /**
   * Generates an EIP-2930 access list
   *
   * Note: this method is not yet part of the {@link StateManager} interface.
   * If not implemented, {@link VM.runTx} is not allowed to be used with the
   * `reportAccessList` option and will instead throw.
   *
   * Note: there is an edge case on accessList generation where an
   * internal call might revert without an accessList but pass if the
   * accessList is used for a tx run (so the subsequent behavior might change).
   * This edge case is not covered by this implementation.
   *
   * @param addressesRemoved - List of addresses to be removed from the final list
   * @param addressesOnlyStorage - List of addresses only to be added in case of present storage slots
   *
   * @returns - an [@ethereumjs/tx](https://github.com/ethereumjs/ethereumjs-monorepo/packages/tx) `AccessList`
   */
  //SHARDIUM hack disable - wont compile
  //   generateAccessList(
  //     addressesRemoved: Address[] = [],
  //     addressesOnlyStorage: Address[] = []
  //   ): AccessList {
  //     // Merge with the reverted storage list
  //     const mergedStorage = [...this._accessedStorage, ...this._accessedStorageReverted]

  //     // Fold merged storage array into one Map
  //     while (mergedStorage.length >= 2) {
  //       const storageMap = mergedStorage.pop()
  //       if (storageMap) {
  //         this._accessedStorageMerge(mergedStorage, storageMap)
  //       }
  //     }
  //     const folded = new Map([...mergedStorage[0].entries()].sort())

  //     // Transfer folded map to final structure
  //     const accessList: AccessList = []
  //     folded.forEach((slots, addressStr) => {
  //       const address = Address.fromString(`0x${addressStr}`)
  //       const check1 = getActivePrecompiles(this._common).find((a) => a.equals(address))
  //       const check2 = addressesRemoved.find((a) => a.equals(address))
  //       const check3 =
  //         addressesOnlyStorage.find((a) => a.equals(address)) !== undefined && slots.size === 0

  //       if (!check1 && !check2 && !check3) {
  //         const storageSlots = Array.from(slots)
  //           .map((s) => `0x${s}`)
  //           .sort()
  //         const accessListItem: AccessListItem = {
  //           address: `0x${addressStr}`,
  //           storageKeys: storageSlots,
  //         }
  //         accessList!.push(accessListItem)
  //       }
  //     })

  //     return accessList
  //   }

  hasStateRoot(root: Uint8Array): Promise<boolean> {
    // todo: flesh this out
    return Promise.resolve(false)
  }

  async modifyAccountFields(address: Address, accountFields: AccountFields): Promise<void> {
    let account = await this.getAccount(address)
    if (!account) {
      account = new Account()
    }
    account.nonce = accountFields.nonce ?? account.nonce
    account.balance = accountFields.balance ?? account.balance
    account.storageRoot = accountFields.storageRoot ?? account.storageRoot
    account.codeHash = accountFields.codeHash ?? account.codeHash
    await this.putAccount(address, account)
  }

  shallowCopy(): EVMStateManagerInterface {
    // todo: flesh this out
    // const trie = this._trie.shallowCopy()
    return this
  }

  /**
   * Gets the storage trie for an account from the storage
   * cache or does a lookup.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _getStorageTrie(address: Address, account: Account): Promise<Trie> {
    throw new Error('_getStorageTrie not valid for ShardeumState')

    // const addressHex = bytesToUnprefixedHex(address.bytes)
    // const storageTrie = this._storageTries[addressHex]
    // if (storageTrie === undefined) {
    //   const storageTrie = this._trie.shallowCopy(false)
    //   storageTrie.root(account.storageRoot)
    //   storageTrie.flushCheckpoints()
    //   this._storageTries[addressHex] = storageTrie
    //   return storageTrie
    // }
    // return storageTrie
  }
}
