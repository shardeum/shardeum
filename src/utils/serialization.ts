import { DecimalString, HexString } from '../shardeum/shardeumTypes'
import { Utils } from '@shardus/types'

export const isObject = (val): boolean => {
  if (val === null) {
    return false
  }
  if (Array.isArray(val)) {
    return false
  }
  return typeof val === 'function' || typeof val === 'object'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertBigIntsToHex(obj: any): any {
  if (typeof obj === 'bigint') {
    return `0x${obj.toString(16)}`
  } else if (Array.isArray(obj)) {
    return obj.map((element) => convertBigIntsToHex(element))
  } else if (typeof obj === 'object' && obj !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newObj: { [key: string]: any } = {}
    for (const key in obj) {
      // eslint-disable-next-line security/detect-object-injection
      newObj[key] = convertBigIntsToHex(obj[key])
    }
    return newObj
  }
  // Return the value unchanged if it's not a bigint, an array, or an object
  return obj
}

// convert obj with __BigInt__ to BigInt
export function fixBigIntLiteralsToBigInt(obj): any {
  const jsonString = Utils.safeStringify(obj)
  const parsedStruct = Utils.safeJsonParse(jsonString)
  return parsedStruct
}

export const _base16BNParser = (value: bigint | HexString | { __BigInt__: string }): bigint => {
  if (typeof value == 'string' && value.slice(0, 2) == '0x') {
    throw new Error(
      'Parsing hex string with prefix 0x to bigint instance is not the same without 0x and could skewed the data'
    )
  }

  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value == 'string') {
    return BigInt('0x' + value)
  }

  if (value && typeof value.__BigInt__ === 'string') {
    return BigInt(value.__BigInt__)
  }

  throw new Error(`_base16BNParser: Unacceptable parameter value ${value}  typeof ${typeof value}`)
}

export const _base10BNParser = (value: bigint | DecimalString): bigint => {
  if (typeof value == 'string' && value.slice(0, 2) == '0x') {
    throw new Error('Parameter value does not seem to be a valid base 10 (decimal)')
  }
  if (typeof value === 'string' && isNaN(value as unknown as number)) {
    throw new Error('Parameter value does not seem to be a valid base 10 (decimal)')
  }
  if (typeof value === 'bigint') {
    return value
  }
  if (typeof value == 'string') {
    return BigInt(value)
  }
  throw new Error(`_base10BNParser: Unacceptable parameter value ${value}  typeof ${typeof value}`)
}

export const _readableSHM = (bnum: bigint, autoDecimal = true): string => {
  if (typeof bnum !== 'bigint') {
    throw new Error('Parameter value is not a valid bigint instance')
  }

  const unit_SHM = ' shm'
  const unit_WEI = ' wei'

  if (!autoDecimal) return bnum.toString() + unit_WEI

  const numString = bnum.toString()
  // 1 eth or 1 SHM === 10^18 wei
  // if wei value gets too big let's convert to SHM in a floating point precision.
  // 14 is where we set this threshold. hardcoded for now.
  if (numString.length > 14) {
    const floating_index = numString.length - 18

    if (floating_index <= 0) {
      const mantissa = '0'.repeat(Math.abs(floating_index)) + numString
      return '0.' + mantissa + unit_SHM
    }

    const mantissa = numString.slice(floating_index, numString.length)
    const base = numString.slice(0, floating_index)
    return base + '.' + mantissa + unit_SHM
  }

  return bnum.toString() + unit_WEI
}

export function debug_map_replacer<T, K, V>(key, value: T | Map<K, V>): T | [K, V][] {
  if (value instanceof Map) {
    // return {
    //   dataType: 'Map',
    //   value: Array.from(value.entries()), // or with spread: value: [...value]
    // }

    // we do not intend to revive this
    return Array.from(value.entries())
  } else {
    return value
  }
}
