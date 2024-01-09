import { bigIntToHex } from '@ethereumjs/util'

const objToString = Object.prototype.toString
const objKeys =
  Object.keys ||
  function (obj): unknown[] {
    const keys = []
    for (const name in obj) {
      keys.push(name)
    }
    return keys
  }

export interface StringifierOptions {
  bufferEncoding: 'base64' | 'hex' | 'none'
}

const defaultStringifierOptions: StringifierOptions = {
  bufferEncoding: 'base64',
}

function isBufferValue(toStr, val: Record<string, unknown>): boolean {
  return (
    toStr === '[object Object]' &&
    objKeys(val).length == 2 &&
    objKeys(val).includes('type') &&
    val['type'] == 'Buffer'
  )
}

function isUnit8Array(value: unknown): boolean {
  return value instanceof Uint8Array
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stringifier(
  val: any,
  isArrayProp: boolean,
  options: StringifierOptions = defaultStringifierOptions
): string | null | undefined {
  if (options == null) options = defaultStringifierOptions
  let i, max, str, keys, key, propVal, toStr
  if (val === true) {
    return 'true'
  }
  if (val === false) {
    return 'false'
  }
  if (isUnit8Array(val)) {
    val = Buffer.from(val)
  }
  /* eslint-disable security/detect-object-injection */
  switch (typeof val) {
    case 'object':
      if (val === null) {
        return null
      } else if (val.toJSON && typeof val.toJSON === 'function') {
        return stringifier(val.toJSON(), isArrayProp, options)
      } else {
        toStr = objToString.call(val)
        if (toStr === '[object Array]') {
          str = '['
          max = val.length - 1
          for (i = 0; i < max; i++) {
            str += stringifier(val[i], true, options) + ','
          }
          if (max > -1) {
            str += stringifier(val[i], true, options)
          }
          return str + ']'
        } else if (options.bufferEncoding !== 'none' && isBufferValue(toStr, val)) {
          // Handling buffer values with hex encoding directly
          return JSON.stringify({
            data: Buffer.from(val['data']).toString('hex'),
            dataType: 'bh',
          })
        } else if (toStr === '[object Object]') {
          // only object is left
          keys = objKeys(val).sort()
          max = keys.length
          str = ''
          i = 0
          while (i < max) {
            key = keys[i]
            propVal = stringifier(val[key], false, options)
            if (propVal !== undefined) {
              if (str) {
                str += ','
              }
              str += JSON.stringify(key) + ':' + propVal
            }
            i++
          }
          return '{' + str + '}'
        } else {
          return JSON.stringify(val)
        }
      }
    // eslint-disable-next-line no-fallthrough
    case 'undefined':
      return isArrayProp ? null : undefined
    case 'string':
      return JSON.stringify(val)
    case 'bigint':
      // Add some special identifier for bigint
      // return JSON.stringify({__BigInt__: val.toString()})
      return JSON.stringify(bigIntToHex(val).slice(2))
    default:
      return isFinite(val) ? val : null
  }
  /* eslint-enable security/detect-object-injection */
}

/* cryptoStringifier is a close version of default fast-stringify-json that works with BigInts */
function cryptoStringifier(val, isArrayProp): string {
  let i, max, str, keys, key, propVal, toStr;
  if (val === true) {
    return "true";
  }
  if (val === false) {
    return "false";
  }
  switch (typeof val) {
    case "object":
      if (val === null) {
        return null;
      } else if (val.toJSON && typeof val.toJSON === "function") {
        return cryptoStringifier(val.toJSON(), isArrayProp);
      } else {
        toStr = objToString.call(val);
        if (toStr === "[object Array]") {
          str = '[';
          max = val.length - 1;
          for(i = 0; i < max; i++) {
            str += cryptoStringifier(val[i], true) + ',';
          }
          if (max > -1) {
            str += cryptoStringifier(val[i], true);
          }
          return str + ']';
        } else if (toStr === "[object Object]") {
          // only object is left
          keys = objKeys(val).sort();
          max = keys.length;
          str = "";
          i = 0;
          while (i < max) {
            key = keys[i];
            propVal = cryptoStringifier(val[key], false);
            if (propVal !== undefined) {
              if (str) {
                str += ',';
              }
              str += JSON.stringify(key) + ':' + propVal;
            }
            i++;
          }
          return '{' + str + '}';
        } else {
          return JSON.stringify(val);
        }
      }
    case "function":
    case "undefined":
      return isArrayProp ? null : undefined;
    case "string":
      return JSON.stringify(val);
    case 'bigint':
      return JSON.stringify(bigIntToHex(val).slice(2))
    default:
      return isFinite(val) ? val : null;
  }
}

export function stringify(val: unknown, options: StringifierOptions = defaultStringifierOptions): string {
  const returnVal = stringifier(val, false, options)
  if (returnVal !== undefined) {
    return '' + returnVal
  }
  return ''
}

export function cryptoStringify(val: unknown, isArrayProp = false): string {
  const returnVal = cryptoStringifier(val, isArrayProp)
  if (returnVal !== undefined) {
    return '' + returnVal
  }
  return ''
}
