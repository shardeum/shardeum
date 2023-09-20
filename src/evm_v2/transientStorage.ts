import { bytesToHex } from '@ethereumjs/util'

import type { TransientStorageInterface } from './types.js'
import type { Address } from '@ethereumjs/util'

type TransientStorageCurrent = Map<string, Map<string, Uint8Array>>

interface TransientStorageModification {
  addr: string
  key: string
  prevValue: Uint8Array
}

type TransientStorageJournal = TransientStorageModification[]

export class TransientStorage implements TransientStorageInterface {
  /**
   * The current values of the transient storage, keyed by contract address and then slot
   */
  private _storage: TransientStorageCurrent = new Map()
  /**
   * Each change to storage is recorded in the journal. This is never cleared.
   */
  private _changeJournal: TransientStorageJournal = []
  /**
   * The length of the journal at the beginning of each call in the call stack.
   */
  private _indices: number[] = [0]

  /**
   * Get the value for the given address and key
   * @param addr the address for which transient storage is accessed
   * @param key the key of the address to get
   */
  public get(addr: Address, key: Uint8Array): Uint8Array {
    const map = this._storage.get(addr.toString())
    if (!map) {
      return new Uint8Array(32)
    }
    const value = map.get(bytesToHex(key))
    if (!value) {
      return new Uint8Array(32)
    }
    return value
  }

  /**
   * Put the given value for the address and key
   * @param addr the address of the contract for which the key is being set
   * @param key the slot to set for the address
   * @param value the new value of the transient storage slot to set
   */
  public put(addr: Address, key: Uint8Array, value: Uint8Array): void {
    if (key.length !== 32) {
      throw new Error('Transient storage key must be 32 bytes long')
    }

    if (value.length > 32) {
      throw new Error('Transient storage value cannot be longer than 32 bytes')
    }

    const addrString = addr.toString()
    if (!this._storage.has(addrString)) {
      this._storage.set(addrString, new Map())
    }
    const map = this._storage.get(addrString)!

    const keyStr = bytesToHex(key)
    const prevValue = map.get(keyStr) ?? new Uint8Array(32)

    this._changeJournal.push({
      addr: addrString,
      key: keyStr,
      prevValue,
    })

    map.set(keyStr, value)
  }

  /**
   * Commit all the changes since the last checkpoint
   */
  public commit(): void {
    if (this._indices.length === 0) throw new Error('Nothing to commit')
    // by discarding the length of the array from the last time checkpoint was called, all changes are included in the last stack
    this._indices.pop()
  }

  /**
   * To be called whenever entering a new context. If revert is called after checkpoint, all changes after the latest checkpoint are reverted.
   */
  public checkpoint(): void {
    this._indices.push(this._changeJournal.length)
  }

  /**
   * Revert transient storage to the last checkpoint
   */
  public revert(): void {
    const lastCheckpoint = this._indices.pop()
    if (typeof lastCheckpoint === 'undefined') throw new Error('Nothing to revert')

    for (let i = this._changeJournal.length - 1; i >= lastCheckpoint; i--) {
      const { key, prevValue, addr } = this._changeJournal[i]
      this._storage.get(addr)!.set(key, prevValue)
    }
    this._changeJournal.splice(lastCheckpoint, this._changeJournal.length - lastCheckpoint)
  }

  /**
   * Create a JSON representation of the current transient storage state
   */
  public toJSON(): { [address: string]: { [key: string]: string } } {
    const result: { [address: string]: { [key: string]: string } } = {}
    for (const [address, map] of this._storage.entries()) {
      result[address] = {}
      for (const [key, value] of map.entries()) {
        result[address][key] = bytesToHex(value)
      }
    }
    return result
  }

  /**
   * Clear transient storage state.
   */
  public clear(): void {
    this._storage = new Map()
    this._changeJournal = []
  }
}
