import assert from 'assert'

const ceil = (value: number, ceiling: number): number => {
  const r = value % ceiling
  if (r === 0) {
    return value
  } else {
    return value + ceiling - r
  }
}

/**
 * Memory implements a simple memory model
 * for the ethereum virtual machine.
 */
export default class Memory {
  _store: Buffer

  constructor() {
    this._store = Buffer.alloc(0)
  }

  /**
   * Extends the memory given an offset and size. Rounds extended
   * memory to word-size.
   */
  extend(offset: number, size: number) {
    if (size === 0) {
      return
    }

    const newSize = ceil(offset + size, 32)
    const sizeDiff = newSize - this._store.length
    if (sizeDiff > 0) {
      this._store = Buffer.concat([this._store, Buffer.alloc(sizeDiff)])
    }
  }

  /**
   * Writes a byte array with length `size` to memory, starting from `offset`.
   * @param offset - Starting position
   * @param size - How many bytes to write
   * @param value - Value
   */
  write(offset: number, size: number, value: Buffer) {
    if (size === 0) {
      return
    }

    assert(value.length === size, 'Invalid value size')
    assert(offset + size <= this._store.length, 'Value exceeds memory capacity')
    assert(Buffer.isBuffer(value), 'Invalid value type')

    for (let i = 0; i < size; i++) {
      this._store[offset + i] = value[i]
    }
  }

  /**
   * Reads a slice of memory from `offset` till `offset + size` as a `Buffer`.
   * It fills up the difference between memory's length and `offset + size` with zeros.
   * @param offset - Starting position
   * @param size - How many bytes to read
   */
  read(offset: number, size: number): Buffer {
    const returnBuffer = Buffer.allocUnsafe(size)
    // Copy the stored "buffer" from memory into the return Buffer

    const loaded = Buffer.from(this._store.slice(offset, offset + size))
    returnBuffer.fill(loaded, 0, loaded.length)

    if (loaded.length < size) {
      // fill the remaining part of the Buffer with zeros
      returnBuffer.fill(0, loaded.length, size)
    }

    return returnBuffer
  }
}
