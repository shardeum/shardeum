export class VectorBufferStream {
  private buffer: Buffer
  public position: number

  constructor(initialSize: number) {
    this.buffer = Buffer.allocUnsafe(initialSize)
    this.position = 0
  }

  public static fromBuffer(buffer: Buffer): VectorBufferStream {
    const stream = new VectorBufferStream(0)
    stream.buffer = buffer
    stream.position = 0
    return stream
  }

  public getAsHexString(): string {
    return this.buffer.toString('hex')
  }

  public getBufferLength(): number {
    return this.buffer.length
  }

  public getDebugString(numBytes: number, offset = 0): string {
    let str = ''
    for (let i = 0; i < numBytes; i++) {
      str += this.buffer[i + offset].toString(16) + ' '
    }
    return str
  }

  public isAtOrPastEnd(): boolean {
    return this.position >= this.buffer.length
  }

  private ensureCapacity(size: number): void {
    if (this.position + size <= this.buffer.length) {
      return
    }
    const newSize = Math.max(this.buffer.length * 2, this.position + size)
    const newBuffer = Buffer.allocUnsafe(newSize)
    this.buffer.copy(newBuffer)
    this.buffer = newBuffer
  }

  public getBuffer(): Buffer {
    return this.buffer.subarray(0, this.position)
  }

  public write(value: string | Buffer, encoding?: BufferEncoding): void {
    if (typeof value === 'string') {
      encoding = encoding || 'utf8'
      const size = Buffer.byteLength(value, encoding)
      this.ensureCapacity(size)
      const written = this.buffer.write(value, this.position, size, encoding)
      this.position += written
      //console.log(`size: ${size} written: ${written}`);
    } else {
      this.ensureCapacity(value.length)
      value.copy(this.buffer, this.position)
      this.position += value.length
    }
  }

  public writeInt8(value: number): void {
    this.ensureCapacity(1)
    this.buffer.writeInt8(value, this.position)
    this.position += 1
  }

  public writeUInt8(value: number): void {
    this.ensureCapacity(1)
    this.buffer.writeUInt8(value, this.position)
    this.position += 1
  }
  public writeString(value: string): void {
    const size = Buffer.byteLength(value, 'utf8')
    this.writeUInt32(size) // Write the size of the string as a 32-bit integer
    this.ensureCapacity(size)
    this.buffer.write(value, this.position, size, 'utf8')
    this.position += size
  }

  public writeBuffer(value: Buffer): void {
    const size = value.length
    this.writeUInt32(size) // Write the size of the buffer as a 32-bit integer
    this.ensureCapacity(size)
    value.copy(this.buffer, this.position)
    this.position += size
  }

  public writeInt16(value: number): void {
    this.ensureCapacity(2)
    this.buffer.writeInt16LE(value, this.position)
    this.position += 2
  }

  public writeUInt16(value: number): void {
    this.ensureCapacity(2)
    this.buffer.writeUInt16LE(value, this.position)
    this.position += 2
  }

  public writeInt32(value: number): void {
    this.ensureCapacity(4)
    this.buffer.writeInt32LE(value, this.position)
    this.position += 4
  }

  public writeUInt32(value: number): void {
    this.ensureCapacity(4)
    this.buffer.writeUInt32LE(value, this.position)
    this.position += 4
  }

  public writeBigInt64(value: bigint): void {
    this.ensureCapacity(8)
    this.buffer.writeBigInt64LE(value, this.position)
    this.position += 8
  }

  public writeBigUInt64(value: bigint): void {
    this.ensureCapacity(8)
    this.buffer.writeBigUInt64LE(value, this.position)
    this.position += 8
  }

  public writeFloat(value: number): void {
    this.ensureCapacity(4)
    this.buffer.writeFloatLE(value, this.position)
    this.position += 4
  }

  public writeDouble(value: number): void {
    this.ensureCapacity(8)
    this.buffer.writeDoubleLE(value, this.position)
    this.position += 8
  }

  ///////////////READ METHODS////////////////////

  public readString(): string {
    const size = this.readUInt32() // Read the size of the string as a 32-bit integer
    const value = this.buffer.toString('utf8', this.position, this.position + size)
    this.position += size
    return value
  }

  public readBuffer(): Buffer {
    const size = this.readUInt32() // Read the size of the buffer as a 32-bit unsigned integer
    //console.log(`buffer size: ${size}`);
    const value = this.buffer.slice(this.position, this.position + size)
    this.position += size
    return value
  }

  public readUInt8(): number {
    const value = this.buffer.readUInt8(this.position)
    this.position += 1
    return value
  }

  public readInt16(): number {
    const value = this.buffer.readInt16LE(this.position)
    this.position += 2
    return value
  }

  public readUInt16(): number {
    const value = this.buffer.readUInt16LE(this.position)
    this.position += 2
    return value
  }

  public readInt32(): number {
    const value = this.buffer.readInt32LE(this.position)
    this.position += 4
    return value
  }

  public readUInt32(): number {
    const value = this.buffer.readUInt32LE(this.position)
    this.position += 4
    return value
  }

  public readBigInt64(): bigint {
    const value = this.buffer.readBigInt64LE(this.position)
    this.position += 8
    return value
  }

  public readBigUInt64(): bigint {
    const value = this.buffer.readBigUInt64LE(this.position)
    this.position += 8
    return value
  }

  public readFloat(): number {
    const value = this.buffer.readFloatLE(this.position)
    this.position += 4
    return value
  }

  public readDouble(): number {
    const value = this.buffer.readDoubleLE(this.position)
    this.position += 8
    return value
  }

  public readFixedBuffer(length: number): Buffer {
    const value = this.buffer.slice(this.position, this.position + length)
    this.position += length
    return value
  }

  public writeFixedBuffer(value: Buffer): void {
    this.ensureCapacity(value.length)
    value.copy(this.buffer, this.position)
    this.position += value.length
  }
}
