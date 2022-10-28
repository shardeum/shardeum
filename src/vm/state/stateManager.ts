import { SecureTrie as Trie } from 'merkle-patricia-tree'
import {
  Account,
  Address,
  toBuffer,
  keccak256,
  KECCAK256_NULL,
  rlp,
  unpadBuffer,
  PrefixedHexString,
  bufferToHex,
  bnToHex,
  BN,
  KECCAK256_RLP,
  setLengthLeft,
} from 'ethereumjs-util'
import Common from '@ethereumjs/common'
import { StateManager, StorageDump } from './interface'
import Cache, { getCb, putCb } from './cache'
import { BaseStateManager } from './'
import { short } from '../evm/opcodes'

type StorageProof = {
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
 * Default StateManager implementation for the VM.
 *
 * The state manager abstracts from the underlying data store
 * by providing higher level access to accounts, contract code
 * and storage slots.
 *
 * The default state manager implementation uses a
 * `merkle-patricia-tree` trie as a data backend.
 */
export default class DefaultStateManager extends BaseStateManager implements StateManager {
  _trie: Trie
  _storageTries: { [key: string]: Trie }

  /**
   * Instantiate the StateManager interface.
   */
  constructor(opts: DefaultStateManagerOpts = {}) {
    super(opts)

    this._trie = opts.trie ?? new Trie()
    this._storageTries = {}

    /*
     * For a custom StateManager implementation adopt these
     * callbacks passed to the `Cache` instantiated to perform
     * the `get`, `put` and `delete` operations with the
     * desired backend.
     */
    const getCb: getCb = async (address) => {
      const rlp = await this._trie.get(address.buf)
      return rlp ? Account.fromRlpSerializedAccount(rlp) : undefined
    }
    const putCb: putCb = async (keyBuf, accountRlp) => {
      const trie = this._trie
      await trie.put(keyBuf, accountRlp)
    }
    const deleteCb = async (keyBuf: Buffer) => {
      const trie = this._trie
      await trie.del(keyBuf)
    }
    this._cache = new Cache({ getCb, putCb, deleteCb })
  }

  /**
   * Copies the current instance of the `StateManager`
   * at the last fully committed point, i.e. as if all current
   * checkpoints were reverted.
   */
  copy(): StateManager {
    return new DefaultStateManager({
      trie: this._trie.copy(false),
      common: this._common,
    })
  }

  /**
   * Adds `value` to the state trie as code, and sets `codeHash` on the account
   * corresponding to `address` to reference this.
   * @param address - Address of the `account` to add the `code` for
   * @param value - The value of the `code`
   */
  async putContractCode(address: Address, value: Buffer): Promise<void> {
    const codeHash = keccak256(value)

    if (codeHash.equals(KECCAK256_NULL)) {
      return
    }

    await this._trie.db.put(codeHash, value)

    const account = await this.getAccount(address)
    if (this.DEBUG) {
      this._debug(`Update codeHash (-> ${short(codeHash)}) for account ${address}`)
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
    if (key.length !== 32) {
      throw new Error('Storage key must be 32 bytes long')
    }

    const trie = await this._getStorageTrie(address)
    const value = await trie.get(key)
    const decoded = rlp.decode(value)
    return decoded as Buffer
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
          this._debug(`Update contract storage for account ${address} to ${short(value)}`)
        }
        await storageTrie.put(key, encodedValue)
      } else {
        // deleting a value
        if (this.DEBUG) {
          this._debug(`Delete contract storage for account`)
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
    this._trie.checkpoint()
    await super.checkpoint()
  }

  /**
   * Commits the current change-set to the instance since the
   * last call to checkpoint.
   */
  async commit(): Promise<void> {
    // setup trie checkpointing
    await this._trie.commit()
    await super.commit()
  }

  /**
   * Reverts the current change-set to the instance since the
   * last call to checkpoint.
   */
  async revert(): Promise<void> {
    // setup trie checkpointing
    await this._trie.revert()
    this._storageTries = {}
    await super.revert()
  }

  /**
   * Get an EIP-1186 proof
   * @param address address to get proof of
   * @param storageSlots storage slots to get proof of
   */
  async getProof(address: Address, storageSlots: Buffer[] = []): Promise<Proof> {
    const account = await this.getAccount(address)
    const accountProof: PrefixedHexString[] = (await Trie.createProof(this._trie, address.buf)).map(
      (p) => bufferToHex(p)
    )
    const storageProof: StorageProof[] = []
    const storageTrie = await this._getStorageTrie(address)

    for (const storageKey of storageSlots) {
      const proof = (await Trie.createProof(storageTrie, storageKey)).map((p) => bufferToHex(p))
      let value = bufferToHex(await this.getContractStorage(address, storageKey))
      if (value === '0x') {
        value = '0x0'
      }
      const proofItem: StorageProof = {
        key: bufferToHex(storageKey),
        value,
        proof,
      }
      storageProof.push(proofItem)
    }

    const returnValue: Proof = {
      address: address.toString(),
      balance: bnToHex(account.balance),
      codeHash: bufferToHex(account.codeHash),
      nonce: bnToHex(account.nonce),
      storageHash: bufferToHex(account.stateRoot),
      accountProof,
      storageProof,
    }
    return returnValue
  }

  /**
   * Verify an EIP-1186 proof. Throws if proof is invalid, otherwise returns true.
   * @param proof the proof to prove
   */
  async verifyProof(proof: Proof): Promise<boolean> {
    const rootHash = keccak256(toBuffer(proof.accountProof[0]))
    const key = toBuffer(proof.address)
    const accountProof = proof.accountProof.map((rlpString: PrefixedHexString) =>
      toBuffer(rlpString)
    )

    // This returns the account if the proof is valid.
    // Verify that it matches the reported account.
    const value = await Trie.verifyProof(rootHash, key, accountProof)

    if (value === null) {
      // Verify that the account is empty in the proof.
      const emptyBuffer = Buffer.from('')
      const notEmptyErrorMsg = 'Invalid proof provided: account is not empty'
      const nonce = unpadBuffer(toBuffer(proof.nonce))
      if (!nonce.equals(emptyBuffer)) {
        throw new Error(`${notEmptyErrorMsg} (nonce is not zero)`)
      }
      const balance = unpadBuffer(toBuffer(proof.balance))
      if (!balance.equals(emptyBuffer)) {
        throw new Error(`${notEmptyErrorMsg} (balance is not zero)`)
      }
      const storageHash = toBuffer(proof.storageHash)
      if (!storageHash.equals(KECCAK256_RLP)) {
        throw new Error(`${notEmptyErrorMsg} (storageHash does not equal KECCAK256_RLP)`)
      }
      const codeHash = toBuffer(proof.codeHash)
      if (!codeHash.equals(KECCAK256_NULL)) {
        throw new Error(`${notEmptyErrorMsg} (codeHash does not equal KECCAK256_NULL)`)
      }
    } else {
      const account = Account.fromRlpSerializedAccount(value)
      const { nonce, balance, stateRoot, codeHash } = account
      const invalidErrorMsg = 'Invalid proof provided:'
      if (!nonce.eq(new BN(toBuffer(proof.nonce)))) {
        throw new Error(`${invalidErrorMsg} nonce does not match`)
      }
      if (!balance.eq(new BN(toBuffer(proof.balance)))) {
        throw new Error(`${invalidErrorMsg} balance does not match`)
      }
      if (!stateRoot.equals(toBuffer(proof.storageHash))) {
        throw new Error(`${invalidErrorMsg} storageHash does not match`)
      }
      if (!codeHash.equals(toBuffer(proof.codeHash))) {
        throw new Error(`${invalidErrorMsg} codeHash does not match`)
      }
    }

    const storageRoot = toBuffer(proof.storageHash)

    for (const stProof of proof.storageProof) {
      const storageProof = stProof.proof.map((value: PrefixedHexString) => toBuffer(value))
      const storageValue = setLengthLeft(toBuffer(stProof.value), 32)
      const storageKey = toBuffer(stProof.key)
      const proofValue = await Trie.verifyProof(storageRoot, storageKey, storageProof)
      const reportedValue = setLengthLeft(rlp.decode(proofValue as Buffer), 32)
      if (!reportedValue.equals(storageValue)) {
        throw new Error('Reported trie value does not match storage')
      }
    }
    return true
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
   * Checks if the `account` corresponding to `address`
   * exists
   * @param address - Address of the `account` to check
   */
  async accountExists(address: Address): Promise<boolean> {
    const account = this._cache.lookup(address)
    if (account && !(account as any).virtual && !this._cache.keyIsDeleted(address)) {
      return true
    }
    if (await this._trie.get(address.buf)) {
      return true
    }
    return false
  }
}
