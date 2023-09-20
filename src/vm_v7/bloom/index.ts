import { zeros } from '@ethereumjs/util'
import { keccak256 } from 'ethereum-cryptography/keccak.js'

const BYTE_SIZE = 256

export class Bloom {
  bitvector: Uint8Array

  /**
   * Represents a Bloom filter.
   */
  constructor(bitvector?: Uint8Array) {
    if (!bitvector) {
      this.bitvector = zeros(BYTE_SIZE)
    } else {
      if (bitvector.length !== BYTE_SIZE) throw new Error('bitvectors must be 2048 bits long')
      this.bitvector = bitvector
    }
  }

  /**
   * Adds an element to a bit vector of a 64 byte bloom filter.
   * @param e - The element to add
   */
  add(e: Uint8Array): void {
    e = keccak256(e)
    const mask = 2047 // binary 11111111111

    for (let i = 0; i < 3; i++) {
      const first2bytes = new DataView(e.buffer).getUint16(i * 2)
      const loc = mask & first2bytes
      const byteLoc = loc >> 3
      const bitLoc = 1 << loc % 8
      this.bitvector[BYTE_SIZE - byteLoc - 1] |= bitLoc
    }
  }

  /**
   * Checks if an element is in the bloom.
   * @param e - The element to check
   */
  check(e: Uint8Array): boolean {
    e = keccak256(e)
    const mask = 2047 // binary 11111111111
    let match = true

    for (let i = 0; i < 3 && match; i++) {
      const first2bytes = new DataView(e.buffer).getUint16(i * 2)
      const loc = mask & first2bytes
      const byteLoc = loc >> 3
      const bitLoc = 1 << loc % 8
      match = (this.bitvector[BYTE_SIZE - byteLoc - 1] & bitLoc) !== 0
    }

    return Boolean(match)
  }

  /**
   * Checks if multiple topics are in a bloom.
   * @returns `true` if every topic is in the bloom
   */
  multiCheck(topics: Uint8Array[]): boolean {
    return topics.every((t: Uint8Array) => this.check(t))
  }

  /**
   * Bitwise or blooms together.
   */
  or(bloom: Bloom): void {
    for (let i = 0; i <= BYTE_SIZE; i++) {
      this.bitvector[i] = this.bitvector[i] | bloom.bitvector[i]
    }
  }
}
