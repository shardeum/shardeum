const objToString = Object.prototype.toString
const objKeys =
  Object.keys ||
  function(obj) {
    let keys = []
    for (const name in obj) {
      keys.push(name)
    }
    return keys
  }

export function stringify(val: any, bufferEncoding: 'base64' | 'hex' = 'base64'): string {
  const returnVal = stringifier(val, false, bufferEncoding)
  if (returnVal !== undefined) {
    return '' + returnVal
  }
  return ''
}

function stringifier(val: any, isArrayProp: boolean, bufferEncoding: 'base64' | 'hex'): string | null | undefined {
  let i, max, str, keys, key, propVal, toStr
  if (val === true) {
    return 'true'
  }
  if (val === false) {
    return 'false'
  }
  switch (typeof val) {
    case 'object':
      if (val === null) {
        return null
      } else if (val.toJSON && typeof val.toJSON === 'function') {
        return stringifier(val.toJSON(), isArrayProp, bufferEncoding)
      } else {
        toStr = objToString.call(val)
        if (toStr === '[object Array]') {
          str = '['
          max = val.length - 1
          for (i = 0; i < max; i++) {
            str += stringifier(val[i], true, bufferEncoding) + ','
          }
          if (max > -1) {
            str += stringifier(val[i], true, bufferEncoding)
          }
          return str + ']'
        } else if (toStr === '[object Object]' && objKeys(val).length == 2 && objKeys(val).includes('type') && val['type'] == 'Buffer') {
          switch (bufferEncoding) {
            case 'base64':
              return JSON.stringify({
                data: Buffer.from(val['data']).toString('base64'),
                dataType: 'bh',
              })
            case 'hex':
              return JSON.stringify({
                data: Buffer.from(val['data']).toString('hex'),
                dataType: 'bh',
              })
          }
        } else if (toStr === '[object Object]') {
          // only object is left
          keys = objKeys(val).sort()
          max = keys.length
          str = ''
          i = 0
          while (i < max) {
            key = keys[i]
            propVal = stringifier(val[key], false, bufferEncoding)
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
    case 'function':
    case 'undefined':
      return isArrayProp ? null : undefined
    case 'string':
      return JSON.stringify(val)
    default:
      return isFinite(val) ? val : null
  }
}
