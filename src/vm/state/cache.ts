import { Account, Address } from 'ethereumjs-util'
const Tree = require('functional-red-black-tree')

export type getCb = (address: Address) => Promise<Account | undefined>
export type putCb = (keyBuf: Buffer, accountRlp: Buffer) => Promise<void>
export type deleteCb = (keyBuf: Buffer) => Promise<void>

export interface CacheOpts {
  getCb: getCb
  putCb: putCb
  deleteCb: deleteCb
}

/**
 * @ignore
 */
export default class Cache {
  _cache: any
  _checkpoints: any[]

  _getCb: getCb
  _putCb: putCb
  _deleteCb: deleteCb

  constructor(opts: CacheOpts) {
    this._cache = Tree()
    this._getCb = opts.getCb
    this._putCb = opts.putCb
    this._deleteCb = opts.deleteCb
    this._checkpoints = []
  }

  /**
   * Puts account to cache under its address.
   * @param key - Address of account
   * @param val - Account
   */
  put(key: Address, val: Account, fromTrie: boolean = false): void {
    const modified = !fromTrie
    this._update(key, val, modified, false)
  }

  /**
   * Returns the queried account or an empty account.
   * @param key - Address of account
   */
  get(key: Address): Account {
    const account = this.lookup(key)
    return account ?? new Account()
  }

  /**
   * Returns the queried account or undefined.
   * @param key - Address of account
   */
  lookup(key: Address): Account | undefined {
    const keyStr = key.buf.toString('hex')

    const it = this._cache.find(keyStr)
    if (it.node) {
      const rlp = it.value.val
      const account = Account.fromRlpSerializedAccount(rlp)
      ;(account as any).virtual = it.value.virtual
      return account
    }
  }

  /**
   * Returns true if the key was deleted and thus existed in the cache earlier
   * @param key - trie key to lookup
   */
  keyIsDeleted(key: Address): boolean {
    const keyStr = key.buf.toString('hex')
    const it = this._cache.find(keyStr)
    if (it.node) {
      return it.value.deleted
    }
    return false
  }

  /**
   * Looks up address in cache, if not found, looks it up
   * in the underlying trie.
   * @param key - Address of account
   */
  async getOrLoad(address: Address): Promise<Account> {
    let account = this.lookup(address)

    if (!account) {
      account = await this._getCb(address)
      if (account) {
        this._update(address, account, false, false, false)
      } else {
        account = new Account()
        ;(account as any).virtual = true
        this._update(address, account, false, false, true)
      }
    }

    return account
  }

  /**
   * Flushes cache by updating accounts that have been modified
   * and removing accounts that have been deleted.
   */
  async flush(): Promise<void> {
    const it = this._cache.begin
    let next = true
    while (next) {
      if (it.value && it.value.modified && !it.value.deleted) {
        it.value.modified = false
        const accountRlp = it.value.val
        const keyBuf = Buffer.from(it.key, 'hex')
        await this._putCb(keyBuf, accountRlp)
        next = it.hasNext
        it.next()
      } else if (it.value && it.value.modified && it.value.deleted) {
        it.value.modified = false
        it.value.deleted = true
        it.value.virtual = true
        it.value.val = new Account().serialize()
        const keyBuf = Buffer.from(it.key, 'hex')
        await this._deleteCb(keyBuf)
        next = it.hasNext
        it.next()
      } else {
        next = it.hasNext
        it.next()
      }
    }
  }

  /**
   * Marks current state of cache as checkpoint, which can
   * later on be reverted or commited.
   */
  checkpoint(): void {
    this._checkpoints.push(this._cache)
  }

  /**
   * Revert changes to cache last checkpoint (no effect on trie).
   */
  revert(): void {
    this._cache = this._checkpoints.pop()
  }

  /**
   * Commits to current state of cache (no effect on trie).
   */
  commit(): void {
    this._checkpoints.pop()
  }

  /**
   * Clears cache.
   */
  clear(): void {
    this._cache = Tree()
  }

  /**
   * Marks address as deleted in cache.
   * @param key - Address
   */
  del(key: Address): void {
    this._update(key, new Account(), true, true, true)
  }

  /**
   * Generic cache update helper function
   *
   * @param key
   * @param value
   * @param modified - Has the value been modfied or is it coming unchanged from the trie (also used for deleted accounts)
   * @param deleted - Delete operation on an account
   * @param virtual - Account doesn't exist in the underlying trie
   */
  _update(
    key: Address,
    value: Account,
    modified: boolean,
    deleted: boolean,
    virtual = false
  ): void {
    const keyHex = key.buf.toString('hex')
    const it = this._cache.find(keyHex)
    const val = value.serialize()
    if (it.node) {
      this._cache = it.update({ val, modified, deleted, virtual })
    } else {
      this._cache = this._cache.insert(keyHex, { val, modified, deleted, virtual })
    }
  }
}
