import { BN, bufferToHex } from 'ethereumjs-util'
import { NetworkAccount } from '../shardeum/shardeumTypes'

/**
 * After a Buffer goes through json stringify/parse it comes out broken
 *   maybe fix this in shardus-global-server. for now use this safe function
 * @param buffer
 * @returns
 */
export function safeBufferToHex(buffer): string {
  if (buffer.data != null) {
    return bufferToHex(buffer.data)
  }
  return bufferToHex(buffer)
}

export function calculateGasPrice(baselineTxFee: string, baselineTxGasUsage: string, networkAccount: NetworkAccount): bigint {
  const txFee = BigInt(baselineTxFee)
  const gas = BigInt(baselineTxGasUsage)
  const gasPrice = txFee / gas
  const factor = scaleByStabilityFactor(new BN(gasPrice.toString()), networkAccount);
  return BigInt(factor.toString())
}

export function scaleByStabilityFactor(input: BN, networkAccount: NetworkAccount): BN {
  const stabilityScaleMult = new BN(networkAccount.current.stabilityScaleMul)
  const stabilityScaleDiv = new BN(networkAccount.current.stabilityScaleDiv)
  return input.mul(stabilityScaleMult).div(stabilityScaleDiv)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), ms)
  })
}

export const replacer = <T, K, V>(
  _key,
  value: Map<K, V> | T
):
  | {
      dataType: 'stringifyReduce_map_2_array',
      value: [K, V][]
    }
  | T => {
  const originalObject = value // this[key]
  if (originalObject instanceof Map) {
    return {
      dataType: 'stringifyReduce_map_2_array',
      value: Array.from(originalObject.entries()), // or with spread: value: [...originalObject]
    }
  } else {
    return value as T
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
  /* eslint-disable security/detect-object-injection */
  for (let i = 0; i < testVerParts.length; i++) {
    const testV = ~~testVerParts[i] // parse int
    const minV = ~~minVerParts[i] // parse int
    if (testV > minV) return true
    if (testV < minV) return false
  }
  /* eslint-enable security/detect-object-injection */
  return false
}

/**
 * Check if the test version is equal or older than the max version
 * @param maximumVersion
 * @param testVersion
 * @returns
 */
export function isEqualOrOlderVersion(maximumVersion: string, testVersion: string): boolean {
  return isEqualOrNewerVersion(testVersion, maximumVersion)
}

// From: https://stackoverflow.com/a/19270021
export function getRandom<T>(arr: T[], n: number): T[] {
  let len = arr.length
  const taken = new Array(len)
  if (n > len) {
    n = len
  }
  const result = new Array(n)
  /* eslint-disable security/detect-object-injection */
  while (n--) {
    const x = Math.floor(Math.random() * len)
    result[n] = arr[x in taken ? taken[x] : x]
    taken[x] = --len in taken ? taken[len] : len
  }
  /* eslint-enable security/detect-object-injection */
  return result
}

/**
 * Try to print a variety of possible erros for debug purposes
 * @param err
 * @returns
 */
export function formatErrorMessage(err: unknown): string {
  let errMsg = 'An error occurred'

  if (typeof err === 'string') {
    errMsg = err
  } else if (err instanceof Error) {
    errMsg = err.message

    if (err.stack) {
      errMsg += ` \nStack trace:\n${err.stack}`
    }
  } else if (typeof err === 'object' && err !== null) {
    //chat gpt reccomended this fancy part but the linter doesn't like it

    // const keys = Object.keys(err)
    // if (keys.length > 0) {
    //   errMsg = 'Error properties:\n'
    //   const errObj = err as object
    //   for (const key of keys) {
    //     errMsg += `${key}: ${errObj[key]}\n`
    //   }
    // } else {
    errMsg = `Unknown error: ${JSON.stringify(err)}`
    // }
  } else {
    errMsg = `Unknown error: ${err}`
  }

  return errMsg
}
