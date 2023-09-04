import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { DecimalString, HexString } from '../shardeum/shardeumTypes'
import { stringify } from './stringify'
import { isHexPrefixed, isHexString } from '@ethereumjs/util'

export function SerializeToJsonString(obj: unknown): string {
  if (ShardeumFlags.UseBase64BufferEncoding) {
    return stringify(obj, { bufferEncoding: 'base64' })
  } else {
    return stringify(obj, { bufferEncoding: 'none' })
  }
}

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
export function GetBufferFromField(input: any, encoding?: 'base64' | 'hex'): Buffer {
  switch (encoding) {
    case 'base64':
      return Buffer.from(input.data, 'base64')
    default:
      return Buffer.from(input)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function base64BufferReviver(key: string, value: any): any {
  const originalObject = value
  if (
    isObject(originalObject) &&
    Object.prototype.hasOwnProperty.call(originalObject, 'dataType') &&
    originalObject.dataType &&
    originalObject.dataType == 'bh'
  ) {
    return new Uint8Array(GetBufferFromField(originalObject, 'base64'))
  } else if (value && value.__BigInt__) {
    return BigInt(value.__BigInt__)
  } else {
    return value
  }
}

export function DeSerializeFromJsonString<T>(jsonString: string): T {
  let parsedStruct
  if (ShardeumFlags.UseBase64BufferEncoding) {
    parsedStruct = JSON.parse(jsonString, base64BufferReviver) as T
  } else {
    parsedStruct = JSON.parse(jsonString) as T
  }
  return parsedStruct
}

// convert obj with __BigInt__ to BigInt
export function fixBigIntLiteralsToBigInt(obj): any {
  const jsonString = SerializeToJsonString(obj)
  const parsedStruct = DeSerializeFromJsonString(jsonString)
  return parsedStruct
}

export const _base16BNParser = (value: bigint | HexString): bigint => {
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

  throw new Error('Unacceptable parameter value')
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
  throw new Error('Unacceptable parameter value')
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
