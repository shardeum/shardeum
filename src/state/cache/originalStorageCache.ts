import { bytesToUnprefixedHex } from '@ethereumjs/util'

import type { Address } from '@ethereumjs/util'

type getContractStorage = (address: Address, key: Uint8Array, originalOnly: boolean) => Promise<Uint8Array>

export class OriginalStorageCache {
  private map: Map<string, Map<string, Uint8Array>>
  private getContractStorage: getContractStorage
  constructor(getContractStorage: getContractStorage) {
    this.map = new Map()
    this.getContractStorage = getContractStorage
  }

  async get(address: Address, key: Uint8Array): Promise<Uint8Array> {
    return await this.getContractStorage(address, key, true)

    // const addressHex = bytesToUnprefixedHex(address.bytes)
    // const map = this.map.get(addressHex)
    // if (map !== undefined) {
    //   const keyHex = bytesToUnprefixedHex(key)
    //   const value = map.get(keyHex)
    //   if (value !== undefined) {
    //     return value
    //   }
    // }
    // const value = await this.getContractStorage(address, key)
    // this.put(address, key, value)
    // return value
  }

  put(address: Address, key: Uint8Array, value: Uint8Array): void {
    throw new Error('OriginalStorageCache.put is not implemented')
    // return await this.getContractStorage(address, key, true)

    // const addressHex = bytesToUnprefixedHex(address.bytes)
    // let map = this.map.get(addressHex)
    // if (map === undefined) {
    //   map = new Map()
    //   this.map.set(addressHex, map)
    // }
    // const keyHex = bytesToUnprefixedHex(key)
    // if (map!.has(keyHex) === false) {
    //   map!.set(keyHex, value)
    // }
  }

  clear(): void {
    this.map = new Map()
  }
}
