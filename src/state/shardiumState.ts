import {add} from "lodash";

const Set = require('core-js-pure/es/set')

import {debug as createDebugLogger} from 'debug'
import {SecureTrie as Trie} from 'merkle-patricia-tree'
import {
  Account,
  Address,
  toBuffer,
  keccak256,
  KECCAK256_NULL,
  rlp,
  unpadBuffer, bufferToHex,
} from 'ethereumjs-util'
import Common, {Chain, Hardfork} from '@ethereumjs/common'
import {StateManager, StorageDump} from '@ethereumjs/vm/src/state/interface'
import Cache from './cache'
//import { getActivePrecompiles, ripemdPrecompileAddress } from '@ethereumjs/vm/src/evm/precompiles'
//import { short } from '@ethereumjs/vm/src/evm/opcodes'
import {AccessList, AccessListItem} from '@ethereumjs/tx'
import TransactionState from './transactionState'

const debug = createDebugLogger('vm:state')

type AddressHex = string

//SHARDIUM hack.  pulled from '@ethereumjs/vm/src/evm/opcodes' to make things run
function short(buffer: Buffer): string {
  const MAX_LENGTH = 50
  const bufferStr = buffer.toString('hex')
  if (bufferStr.length <= MAX_LENGTH) {
    return bufferStr
  }
  return bufferStr.slice(0, MAX_LENGTH) + '...'
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
export default class ShardiumState implements StateManager {
  _common: Common
  _trie: Trie
  _storageTries: { [key: string]: Trie }
  _cache: Cache
  _touched: Set<AddressHex>
  _touchedStack: Set<AddressHex>[]
  _checkpointCount: number
  _originalStorageCache: Map<AddressHex, Map<AddressHex, Buffer>>

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


  temporaryParallelOldMode: boolean

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
      common = new Common({chain: Chain.Mainnet, hardfork: Hardfork.Petersburg})
    }
    this._common = common

    this._trie = opts.trie ?? new Trie()
    this._storageTries = {}
    this._cache = new Cache(this._trie)
    this._touched = new Set()
    this._touchedStack = []
    this._checkpointCount = 0
    this._originalStorageCache = new Map()
    this._accessedStorage = [new Map()]
    this._accessedStorageReverted = [new Map()]

    // Safeguard if "process" is not available (browser)
    if (process !== undefined && process.env.DEBUG) {
      this.DEBUG = true
    }

    this._transactionState = null
  }

  //critical to function
  setTransactionState(transactionState: TransactionState) {
    this._transactionState = transactionState
  }

  unsetTransactionState() {
    this._transactionState = null
  }


  /**
   * Copies the current instance of the `StateManager`
   * at the last fully committed point, i.e. as if all current
   * checkpoints were reverted.
   */
  copy(): StateManager {
    return new ShardiumState({
      trie: this._trie.copy(false),
      common: this._common,
    })
  }

  /**
   * Gets the account associated with `address`. Returns an empty account if the account does not exist.
   * @param address - Address of the `account` to get
   */
  async getAccount(address: Address): Promise<Account> {

    //side run system on the side for now
    if (this._transactionState != null) {
      let testAccount = await this._transactionState.getAccount(this._trie, address, false, false)
      if(this.temporaryParallelOldMode === false){
        return testAccount
      }
    }

    if(this.temporaryParallelOldMode === false){
      return // the code below will be irrelevant post SGS upgrade
    }
    // Original implementation:
    const account = await this._cache.getOrLoad(address)
    return account

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

    if(this.temporaryParallelOldMode === false){
      return // the code below will be irrelevant post SGS upgrade
    }

    // Original implementation:
    if (this.DEBUG) {
      debug(
        `Save account address=${address} nonce=${account.nonce} balance=${
          account.balance
        } contract=${account.isContract() ? 'yes' : 'no'} empty=${account.isEmpty() ? 'yes' : 'no'}`
      )
    }
    this._cache.put(address, account)
    this.touchAccount(address)
  }

  /**
   * Deletes an account from state under the provided `address`. The account will also be removed from the state trie.
   * @param address - Address of the account which should be deleted
   */
  async deleteAccount(address: Address) {
    if (this.DEBUG) {
      debug(`Delete account ${address}`)
    }
    this._cache.del(address)
    this.touchAccount(address)
  }

  /**
   * Marks an account as touched, according to the definition
   * in [EIP-158](https://eips.ethereum.org/EIPS/eip-158).
   * This happens when the account is triggered for a state-changing
   * event. Touched accounts that are empty will be cleared
   * at the end of the tx.
   */
  touchAccount(address: Address): void {
    this._touched.add(address.buf.toString('hex'))
  }

  /**
   * Adds `value` to the state trie as code, and sets `codeHash` on the account
   * corresponding to `address` to reference this.
   * @param address - Address of the `account` to add the `code` for
   * @param value - The value of the `code`
   */
  async putContractCode(address: Address, value: Buffer): Promise<void> {
    const account = await this.getAccount(address)

    if (this._transactionState != null) {
      //side run system on the side for now
      this._transactionState.putContractCode(address, value)
    }

    if(this.temporaryParallelOldMode === false){
      return // the code below will be irrelevant post SGS upgrade
    }

    // Original implementation:

    const codeHash = keccak256(value)
    console.log('Storing contract code', codeHash, codeHash.toString('hex'), value)

    if (codeHash.equals(KECCAK256_NULL)) {
      return
    }

    await this._trie.db.put(codeHash, value)

    if (this.DEBUG) {
      debug(`Update codeHash (-> ${short(codeHash)}) for account ${address}`)
    }
    account.codeHash = codeHash
    await this.putAccount(address, account)
  }

  /**
   * Gets the code corresponding to the provided `address`.
   * @param address - Address to get the `code` for
   * @returns {Promise<Buffer>} -  Resolves with the code corresponding to the provided address.
   * Returns an empty `Buffer` if the account has no associated code.
   */
  async getContractCode(address: Address): Promise<Buffer> {
    //side run system on the side for now
    if (this._transactionState != null) {
      let testAccount = await this._transactionState.getContractCode(this._trie, address, false, false)
      if(this.temporaryParallelOldMode === false){
        return testAccount
      }
    }
    if(this.temporaryParallelOldMode === false){
      return // the code below will be irrelevant post SGS upgrade
    }
    // Original implementation:
    const account = await this.getAccount(address)
    if (!account.isContract()) {
      return Buffer.alloc(0)
    }
    const code = await this._trie.db.get(account.codeHash)
    return code ?? Buffer.alloc(0)
  }

  /**
   * Creates a storage trie from the primary storage trie
   * for an account and saves this in the storage cache.
   * @private
   */
  async _lookupStorageTrie(address: Address): Promise<Trie> {
    // from state trie
    const account = await this.getAccount(address)
    const storageTrie = this._trie.copy(false)
    storageTrie.root = account.stateRoot
    storageTrie.db.checkpoints = []
    return storageTrie
  }

  /**
   * Gets the storage trie for an account from the storage
   * cache or does a lookup.
   * @private
   */
  async _getStorageTrie(address: Address): Promise<Trie> {
    // from storage cache
    const addressHex = address.buf.toString('hex')
    let storageTrie = this._storageTries[addressHex]
    if (!storageTrie) {
      // lookup from state
      storageTrie = await this._lookupStorageTrie(address)
    }
    return storageTrie
  }

  /**
   * Gets the storage value associated with the provided `address` and `key`. This method returns
   * the shortest representation of the stored value.
   * @param address -  Address of the account to get the storage for
   * @param key - Key in the account's storage to get the value for. Must be 32 bytes long.
   * @returns {Promise<Buffer>} - The storage value for the account
   * corresponding to the provided address at the provided key.
   * If this does not exist an empty `Buffer` is returned.
   */
  async getContractStorage(address: Address, key: Buffer): Promise<Buffer> {

    if (this._transactionState != null) {
      //side run system on the side for now
      let testAccount = await this._transactionState.getContractStorage(this._trie, address, key, false, false)
      if(this.temporaryParallelOldMode === false){
        return testAccount
      }
    }
    if(this.temporaryParallelOldMode === false){
      return // the code below will be irrelevant post SGS upgrade
    }
    // Original implementation:
    if (key.length !== 32) {
      throw new Error('Storage key must be 32 bytes long')
    }

    const trie = await this._getStorageTrie(address)
    const value = await trie.get(key)
    const decoded = rlp.decode(value)
    return decoded as Buffer
  }

  /**
   * Caches the storage value associated with the provided `address` and `key`
   * on first invocation, and returns the cached (original) value from then
   * onwards. This is used to get the original value of a storage slot for
   * computing gas costs according to EIP-1283.
   * @param address - Address of the account to get the storage for
   * @param key - Key in the account's storage to get the value for. Must be 32 bytes long.
   */
  async getOriginalContractStorage(address: Address, key: Buffer): Promise<Buffer> {
    if (this._transactionState != null) {
      //side run system on the side for now
      let testAccount = await this._transactionState.getContractStorage(this._trie, address, key, true, false)
      if(this.temporaryParallelOldMode === false){
        return testAccount
      }
    }
    if(this.temporaryParallelOldMode === false){
      return // the code below will be irrelevant post SGS upgrade
    }
    // Original implementation:
    if (key.length !== 32) {
      throw new Error('Storage key must be 32 bytes long')
    }

    const addressHex = address.buf.toString('hex')
    const keyHex = key.toString('hex')

    let map: Map<AddressHex, Buffer>
    if (!this._originalStorageCache.has(addressHex)) {
      map = new Map()
      this._originalStorageCache.set(addressHex, map)
    } else {
      map = this._originalStorageCache.get(addressHex)!
    }

    if (map.has(keyHex)) {
      return map.get(keyHex)!
    } else {
      const current = await this.getContractStorage(address, key)
      map.set(keyHex, current)
      return current
    }
  }

  /**
   * Clears the original storage cache. Refer to {@link StateManager.getOriginalContractStorage}
   * for more explanation.
   */
  _clearOriginalStorageCache(): void {
    this._originalStorageCache = new Map()
  }

  /**
   * Clears the original storage cache. Refer to {@link StateManager.getOriginalContractStorage}
   * for more explanation. Alias of the internal {@link StateManager._clearOriginalStorageCache}
   */
  clearOriginalStorageCache(): void {
    this._clearOriginalStorageCache()
  }

  /**
   * Modifies the storage trie of an account.
   * @private
   * @param address -  Address of the account whose storage is to be modified
   * @param modifyTrie - Function to modify the storage trie of the account
   */
  async _modifyContractStorage(
    address: Address,
    modifyTrie: (storageTrie: Trie, done: Function) => void
  ): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      const storageTrie = await this._getStorageTrie(address)

      modifyTrie(storageTrie, async () => {
        // update storage cache
        const addressHex = address.buf.toString('hex')
        this._storageTries[addressHex] = storageTrie

        // update contract stateRoot
        const contract = this._cache.get(address)
        contract.stateRoot = storageTrie.root

        await this.putAccount(address, contract)
        this.touchAccount(address)
        resolve()
      })
    })
  }

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

    value = unpadBuffer(value)

    await this._modifyContractStorage(address, async (storageTrie, done) => {
      if (value && value.length) {
        // format input
        const encodedValue = rlp.encode(value)
        if (this.DEBUG) {
          debug(`Update contract storage for account ${address} to ${short(value)}`)
        }
        await storageTrie.put(key, encodedValue)
      } else {
        // deleting a value
        if (this.DEBUG) {
          debug(`Delete contract storage for account`)
        }
        await storageTrie.del(key)
      }
      done()
    })
  }

  /**
   * Clears all storage entries for the account corresponding to `address`.
   * @param address -  Address to clear the storage of
   */
  async clearContractStorage(address: Address): Promise<void> {
    await this._modifyContractStorage(address, (storageTrie, done) => {
      storageTrie.root = storageTrie.EMPTY_TRIE_ROOT
      done()
    })
  }

  /**
   * Checkpoints the current state of the StateManager instance.
   * State changes that follow can then be committed by calling
   * `commit` or `reverted` by calling rollback.
   */
  async checkpoint(): Promise<void> {


    //side run: shardeum will no-op this in the future
    //  investigate: will it be a problem that EVM may call this for failed functions, or does that all bubble up anyhow?
    if(this.temporaryParallelOldMode === false){
      return // the code below will be irrelevant post SGS upgrade
    }

    // Original implementation:

    this._trie.checkpoint()
    this._cache.checkpoint()
    this._touchedStack.push(new Set(Array.from(this._touched)))
    this._accessedStorage.push(new Map())
    this._checkpointCount++
  }

  /**
   * Merges a storage map into the last item of the accessed storage stack
   */
  private _accessedStorageMerge(
    storageList: Map<string, Set<string>>[],
    storageMap: Map<string, Set<string>>
  ) {
    const mapTarget = storageList[storageList.length - 1]

    if (mapTarget) {
      // Note: storageMap is always defined here per definition (TypeScript cannot infer this)
      storageMap?.forEach((slotSet: Set<string>, addressString: string) => {
        const addressExists = mapTarget.get(addressString)
        if (!addressExists) {
          mapTarget.set(addressString, new Set())
        }
        const storageSet = mapTarget.get(addressString)
        slotSet.forEach((value: string) => {
          storageSet!.add(value)
        })
      })
    }
  }

  /**
   * Commits the current change-set to the instance since the
   * last call to checkpoint.
   */
  async commit(): Promise<void> {

    //side run: shardeum will no-op this in the future
    //  investigate: will it be a problem that EVM may call this for failed functions, or does that all bubble up anyhow?
    if(this.temporaryParallelOldMode === false){
      return // the code below will be irrelevant post SGS upgrade
    }

    // Original implementation:
    // setup trie checkpointing
    await this._trie.commit()
    // setup cache checkpointing
    this._cache.commit()
    this._touchedStack.pop()
    this._checkpointCount--

    // Copy the contents of the map of the current level to a map higher.
    const storageMap = this._accessedStorage.pop()
    if (storageMap) {
      this._accessedStorageMerge(this._accessedStorage, storageMap)
    }

    if (this._checkpointCount === 0) {
      await this._cache.flush()
      this._clearOriginalStorageCache()
    }
  }

  /**
   * Reverts the current change-set to the instance since the
   * last call to checkpoint.
   */
  async revert(): Promise<void> {

    //side run: shardeum will no-op this in the future
    //  investigate: will it be a problem that EVM may call this for failed functions, or does that all bubble up anyhow?
    if(this.temporaryParallelOldMode === false){
      return // the code below will be irrelevant post SGS upgrade
    }

    // Original implementation:


    // setup trie checkpointing
    await this._trie.revert()
    // setup cache checkpointing
    this._cache.revert()
    this._storageTries = {}
    const lastItem = this._accessedStorage.pop()
    if (lastItem) {
      this._accessedStorageReverted.push(lastItem)
    }
    const touched = this._touchedStack.pop()
    if (!touched) {
      throw new Error('Reverting to invalid state checkpoint failed')
    }
    // Exceptional case due to consensus issue in Geth and Parity.
    // See [EIP issue #716](https://github.com/ethereum/EIPs/issues/716) for context.
    // The RIPEMD precompile has to remain *touched* even when the call reverts,
    // and be considered for deletion.
    //SHARDIUM hack disable - wont compile
    // if (this._touched.has(ripemdPrecompileAddress)) {
    //   touched.add(ripemdPrecompileAddress)
    // }
    this._touched = touched
    this._checkpointCount--

    if (this._checkpointCount === 0) {
      await this._cache.flush()
      this._clearOriginalStorageCache()
    }
  }

  /**
   * Gets the state-root of the Merkle-Patricia trie representation
   * of the state of this StateManager. Will error if there are uncommitted
   * checkpoints on the instance.
   * @returns {Promise<Buffer>} - Returns the state-root of the `StateManager`
   */
  async getStateRoot(): Promise<Buffer> {
    await this._cache.flush()
    const stateRoot = this._trie.root
    return stateRoot
  }

  /**
   * Sets the state of the instance to that represented
   * by the provided `stateRoot`. Will error if there are uncommitted
   * checkpoints on the instance or if the state root does not exist in
   * the state trie.
   * @param stateRoot - The state-root to reset the instance to
   */
  async setStateRoot(stateRoot: Buffer): Promise<void> {
    if (this._checkpointCount !== 0) {
      throw new Error('Cannot set state root with uncommitted checkpoints')
    }

    await this._cache.flush()

    if (!stateRoot.equals(this._trie.EMPTY_TRIE_ROOT)) {
      const hasRoot = await this._trie.checkRoot(stateRoot)
      if (!hasRoot) {
        throw new Error('State trie does not contain state root')
      }
    }

    this._trie.root = stateRoot
    this._cache.clear()
    this._storageTries = {}
  }

  /**
   * Dumps the RLP-encoded storage values for an `account` specified by `address`.
   * @param address - The address of the `account` to return storage for
   * @returns {Promise<StorageDump>} - The state of the account as an `Object` map.
   * Keys are are the storage keys, values are the storage values as strings.
   * Both are represented as hex strings without the `0x` prefix.
   */
  async dumpStorage(address: Address): Promise<StorageDump> {
    return new Promise((resolve, reject) => {
      this._getStorageTrie(address)
        .then((trie) => {
          const storage: StorageDump = {}
          const stream = trie.createReadStream()

          stream.on('data', (val: any) => {
            storage[val.key.toString('hex')] = val.value.toString('hex')
          })
          stream.on('end', () => {
            resolve(storage)
          })
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  /**
   * Get the key value pairs for a contract account, use this when syncing once we eventually flush the in memory account wrappers
   *
   * @param address
   * @returns
   */
  async getContractAccountKVPs(address: Address): Promise<StorageDump> {
    return new Promise((resolve, reject) => {
      this._getStorageTrie(address)
        .then((trie) => {
          const storage: StorageDump = {}
          const stream = trie.createReadStream()

          stream.on('data', (val: any) => {
            storage[val.key.toString('hex')] = val.value.toString('hex')
          })
          stream.on('end', () => {
            resolve(storage)
          })
        })
        .catch((e) => {
          reject(e)
        })
    })
  }


  /**
   * Checks whether the current instance has the canonical genesis state
   * for the configured chain parameters.
   * @returns {Promise<boolean>} - Whether the storage trie contains the
   * canonical genesis state for the configured chain parameters.
   */
  async hasGenesisState(): Promise<boolean> {
    const root = this._common.genesis().stateRoot
    return await this._trie.checkRoot(toBuffer(root))
  }

  /**
   * Generates a canonical genesis state on the instance based on the
   * configured chain parameters. Will error if there are uncommitted
   * checkpoints on the instance.
   */
  async generateCanonicalGenesis(): Promise<void> {
    if (this._checkpointCount !== 0) {
      throw new Error('Cannot create genesis state with uncommitted checkpoints')
    }

    const genesis = await this.hasGenesisState()
    if (!genesis) {
      await this.generateGenesis(this._common.genesisState())
    }
  }

  /**
   * Initializes the provided genesis state into the state trie
   * @param initState address -> balance | [balance, code, storage]
   */
  async generateGenesis(initState: any): Promise<void> {
    if (this._checkpointCount !== 0) {
      throw new Error('Cannot create genesis state with uncommitted checkpoints')
    }

    if (this.DEBUG) {
      debug(`Save genesis state into the state trie`)
    }
    const addresses = Object.keys(initState)
    for (const address of addresses) {
      const addr = Address.fromString(address)
      const state = initState[address]
      if (!Array.isArray(state)) {
        // Prior format: address -> balance
        const account = Account.fromAccountData({balance: state})
        await this._trie.put(addr.buf, account.serialize())
      } else {
        // New format: address -> [balance, code, storage]
        const [balance, code, storage] = state
        const account = Account.fromAccountData({balance})
        await this._trie.put(addr.buf, account.serialize())
        if (code) {
          await this.putContractCode(addr, toBuffer(code))
        }
        if (storage) {
          for (const [key, value] of Object.values(storage) as [string, string][]) {
            await this.putContractStorage(addr, toBuffer(key), toBuffer(value))
          }
        }
      }
    }
  }

  /**
   * Checks if the `account` corresponding to `address`
   * is empty or non-existent as defined in
   * EIP-161 (https://eips.ethereum.org/EIPS/eip-161).
   * @param address - Address to check
   */
  async accountIsEmpty(address: Address): Promise<boolean> {
    const account = await this.getAccount(address)
    return account.isEmpty()
  }

  /**
   * Checks if the `account` corresponding to `address`
   * exists
   * @param address - Address of the `account` to check
   */
  async accountExists(address: Address): Promise<boolean> {
    const account = this._cache.lookup(address)
    if (account && !(account as any).virtual && !this._cache.keyIsDeleted(address)) {
      return true
    }
    if (await this._cache._trie.get(address.buf)) {
      return true
    }
    return false
  }

  /** EIP-2929 logic
   * This should only be called from within the EVM
   */

  /**
   * Returns true if the address is warm in the current context
   * @param address - The address (as a Buffer) to check
   */
  isWarmedAddress(address: Buffer): boolean {
    for (let i = this._accessedStorage.length - 1; i >= 0; i--) {
      const currentMap = this._accessedStorage[i]
      if (currentMap.has(address.toString('hex'))) {
        return true
      }
    }
    return false
  }

  /**
   * Add a warm address in the current context
   * @param address - The address (as a Buffer) to check
   */
  addWarmedAddress(address: Buffer): void {
    const key = address.toString('hex')
    const storageSet = this._accessedStorage[this._accessedStorage.length - 1].get(key)
    if (!storageSet) {
      const emptyStorage = new Set()
      this._accessedStorage[this._accessedStorage.length - 1].set(key, emptyStorage)
    }
  }

  /**
   * Returns true if the slot of the address is warm
   * @param address - The address (as a Buffer) to check
   * @param slot - The slot (as a Buffer) to check
   */
  isWarmedStorage(address: Buffer, slot: Buffer): boolean {
    const addressKey = address.toString('hex')
    const storageKey = slot.toString('hex')

    for (let i = this._accessedStorage.length - 1; i >= 0; i--) {
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
    const addressKey = address.toString('hex')
    let storageSet = this._accessedStorage[this._accessedStorage.length - 1].get(addressKey)
    if (!storageSet) {
      storageSet = new Set()
      this._accessedStorage[this._accessedStorage.length - 1].set(addressKey, storageSet!)
    }
    storageSet!.add(slot.toString('hex'))
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

  /**
   * Removes accounts form the state trie that have been touched,
   * as defined in EIP-161 (https://eips.ethereum.org/EIPS/eip-161).
   */
  async cleanupTouchedAccounts(): Promise<void> {
    if (this._common.gteHardfork('spuriousDragon')) {
      const touchedArray = Array.from(this._touched)
      for (const addressHex of touchedArray) {
        const address = new Address(Buffer.from(addressHex, 'hex'))
        const empty = await this.accountIsEmpty(address)
        if (empty) {
          this._cache.del(address)
          if (this.DEBUG) {
            debug(`Cleanup touched account address=${address} (>= SpuriousDragon)`)
          }
        }
      }
    }
    this._touched.clear()
  }

  /**
   * For use by the shardeum Dapp to set account data from syncing
   */
  async setAccountExternal(addressString: string, account: Account) {

    //TODO implment this to convert string to address.
    //then checkpoint the state trie,
    //put this state to the trie
    //commit the trie

    //transactionState:commitAccount  is a good reference, but we dont need to loop the pending contract storage values like that code does
  }


  /**
   * For use by the shardeum Dapp to set account data from syncing
   */
  async setContractAccountKeyValueExternal(addressString: string, keyString: string, bufferStr: string) {

    //TODO implment this to convert string to address.
    //get the trie for this contract account address
    //checkpoint the trie
    //put this state to the trie
    //commit the trie


    //TODO, double check how much buffer values are "wrapped" before being committed.  I thought
    // I saw some code in ethereumJS where a buffer was getting RLP'd again before being saved


    //transactionState:commitAccount  , but specifically the part where CA key value pairs are saved out in the pending loop
  }

}
