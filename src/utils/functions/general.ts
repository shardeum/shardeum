import { bufferToHex } from 'ethereumjs-util'

/**
 * After a Buffer goes through json stringify/parse it comes out broken
 *   maybe fix this in shardus-global-server.  for now use this safe function
 * @param buffer
 * @returns
 */
export function safeBufferToHex(buffer) {
  if (buffer.data != null) {
    return bufferToHex(buffer.data)
  }
  return bufferToHex(buffer)
}

export function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
