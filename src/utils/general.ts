/* eslint-disable security/detect-object-injection */
import { BN, bufferToHex } from 'ethereumjs-util'
import { NetworkAccount } from '../shardeum/shardeumTypes'

/**
 * After a Buffer goes through json stringify/parse it comes out broken
 *   maybe fix this in shardus-global-server.  for now use this safe function
 * @param buffer
 * @returns
 */
export function safeBufferToHex(buffer): string {
  if (buffer.data != null) {
    return bufferToHex(buffer.data)
  }
  return bufferToHex(buffer)
}

export function scaleByStabilityFactor(input: BN, networkAccount: NetworkAccount): BN {
  const stabilityScaleMult = new BN(networkAccount.current.stabilityScaleMul)
  const stabilityScaleDiv = new BN(networkAccount.current.stabilityScaleDiv)
  return input.mul(stabilityScaleMult).div(stabilityScaleDiv)
}

export function sleep(ms): Promise<NodeJS.Timeout> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const replacer = (key, value) => {
  const originalObject = value // this[key]
  if (originalObject instanceof Map) {
    return {
      dataType: 'stringifyReduce_map_2_array',
      value: Array.from(originalObject.entries()), // or with spread: value: [...originalObject]
    }
  } else {
    return value
  }
}

/**
 * Check if the test version is equal or newer than the min version
 * @param minimumVersion
 * @param testVersion
 * @returns
 */
export function isEqualOrNewerVersion(minimumVersion: string, testVersion: string): boolean {
  if (minimumVersion === testVersion) {
    return true
  }

  const minVerParts = minimumVersion.split('.')
  const testVerParts = testVersion.split('.')
  for (let i = 0; i < testVerParts.length; i++) {
    const testV = ~~testVerParts[i] // parse int
    const minV = ~~minVerParts[i] // parse int
    if (testV > minV) return true
    if (testV < minV) return false
  }
  return false
}

// From: https://stackoverflow.com/a/19270021
export function getRandom<T>(arr: T[], n: number): T[] {
  let len = arr.length
  const taken = new Array(len)
  if (n > len) {
    n = len
  }
  const result = new Array(n)
  while (n--) {
    const x = Math.floor(Math.random() * len)
    result[n] = arr[x in taken ? taken[x] : x]
    taken[x] = --len in taken ? taken[len] : len
  }
  return result
}
