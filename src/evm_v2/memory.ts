import { concatBytes } from '@ethereumjs/util'

const ceil = (value: number, ceiling: number): number => {
  const r = value % ceiling
  if (r === 0) {
    return value
  } else {
    return value + ceiling - r
  }
}

const CONTAINER_SIZE = 8192

/**
 * Memory implements a simple memory model
 * for the ethereum virtual machine.
 */
export class Memory {
  _store: Uint8Array

  constructor() {
    this._store = new Uint8Array(0)
  }

  /**
   * Extends the memory given an offset and size. Rounds extended
   * memory to word-size.
   */
  extend(offset: number, size: number): void {
    if (size === 0) {
      return
    }

    const newSize = ceil(offset + size, 32)
    const sizeDiff = newSize - this._store.length
    if (sizeDiff > 0) {
      this._store = concatBytes(
        this._store,
        new Uint8Array(Math.ceil(sizeDiff / CONTAINER_SIZE) * CONTAINER_SIZE)
      )
    }
  }

  /**
   * Writes a byte array with length `size` to memory, starting from `offset`.
   * @param offset - Starting position
   * @param size - How many bytes to write
   * @param value - Value
   */
  write(offset: number, size: number, value: Uint8Array): void {
    if (size === 0) {
      return
    }

    this.extend(offset, size)

    if (value.length !== size) throw new Error('Invalid value size')
    if (offset + size > this._store.length) throw new Error('Value exceeds memory capacity')

    this._store.set(value, offset)
  }

  /**
   * Reads a slice of memory from `offset` till `offset + size` as a `Uint8Array`.
   * It fills up the difference between memory's length and `offset + size` with zeros.
   * @param offset - Starting position
   * @param size - How many bytes to read
   * @param avoidCopy - Avoid memory copy if possible for performance reasons (optional)
   */
  read(offset: number, size: number, avoidCopy?: boolean): Uint8Array {
    this.extend(offset, size)

    const loaded = this._store.subarray(offset, offset + size)
    if (avoidCopy === true) {
      return loaded
    }
    const returnBytes = new Uint8Array(size)
    // Copy the stored "buffer" from memory into the return Uint8Array
    returnBytes.set(loaded)

    return returnBytes
  }
}
