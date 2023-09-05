/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
let stringify: (buffer: Buffer, start: number, end: number) => string
if (typeof (Buffer.prototype as any).latin1Slice === 'function') {
  stringify = (buffer: Buffer, start: number, end: number) => {
    // this is just `buffer.toString("hex")`, but it skips a bunch of checks
    // that don't apply because our `start` and `end` just can't be out of
    // bounds.
    return (buffer as any).hexSlice(start, end)
  }
} else {
  stringify = (buffer: Buffer, start: number, end: number) => {
    return buffer.slice(start, end).toString('hex')
  }
}

function bufferToMinHexKey(buffer: Buffer): string {
  for (let i = 0, length = buffer.byteLength; i < length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const value = buffer[i]
    // once we find a non-zero value take the rest of the buffer as the key
    if (value !== 0) {
      if (i + 1 === length) {
        // use a lookup table for single character lookups
        // eslint-disable-next-line security/detect-object-injection
        return HEX_MAP[value]
      } else {
        return stringify(buffer, i, length)
      }
    }
  }
  return ''
}

export interface ITraceData {
  isTraceData?: boolean

  toBuffer(): Buffer

  toString(): string

  toJSON(): string
}

const BYTE_LENGTH = 32

/**
 * Precomputed 32-byte prefixes to make stringification a faster
 */
const PREFIXES = [
  '',
  '00',
  '0000',
  '000000',
  '00000000',
  '0000000000',
  '000000000000',
  '00000000000000',
  '0000000000000000',
  '000000000000000000',
  '00000000000000000000',
  '0000000000000000000000',
  '000000000000000000000000',
  '00000000000000000000000000',
  '0000000000000000000000000000',
  '000000000000000000000000000000',
  '00000000000000000000000000000000',
  '0000000000000000000000000000000000',
  '000000000000000000000000000000000000',
  '00000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000',
  '000000000000000000000000000000000000000000',
  '00000000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000000000',
  '000000000000000000000000000000000000000000000000',
  '00000000000000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000000000000000',
  '000000000000000000000000000000000000000000000000000000',
  '00000000000000000000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000000000000000000000',
  '000000000000000000000000000000000000000000000000000000000000',
  '00000000000000000000000000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000000000000000000000000000',
]

export const TraceDataFactory = () => {
  const traceDataLookup: Map<string, ITraceData> = new Map()

  const TraceData = {
    from: (value: Buffer) => {
      // Remove all leading zeroes from keys.
      const key = bufferToMinHexKey(value)
      const existing = traceDataLookup.get(key)

      if (existing) {
        return existing
      }

      let buffer: Buffer
      let str: string

      const data: ITraceData = {
        /**
         * Returns a 32-byte 0-padded Buffer
         */
        toBuffer: () => {
          if (buffer) {
            return buffer
          }
          const length = value.byteLength
          if (length === BYTE_LENGTH) {
            buffer = value
          } else {
            // convert the buffer into the appropriately sized buffer.
            const lengthDiff = BYTE_LENGTH - length
            buffer = Buffer.allocUnsafe(BYTE_LENGTH).fill(0, 0, lengthDiff)
            value.copy(buffer, lengthDiff, 0, length)
          }
          return buffer
        },
        /**
         * Returns a 32-byte hex-string representation
         */
        toJSON: () => {
          if (str) {
            return str
          }
          // convert a hex key like "ab01" into "00...00ab01"
          return (str = `${PREFIXES[BYTE_LENGTH - key.length / 2]}${key}`)
        },
      }
      traceDataLookup.set(key, data)
      return data
    },
  }
  return TraceData
}

const HEX_MAP = [
  '00',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '0a',
  '0b',
  '0c',
  '0d',
  '0e',
  '0f',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '1a',
  '1b',
  '1c',
  '1d',
  '1e',
  '1f',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '2a',
  '2b',
  '2c',
  '2d',
  '2e',
  '2f',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '3a',
  '3b',
  '3c',
  '3d',
  '3e',
  '3f',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '4a',
  '4b',
  '4c',
  '4d',
  '4e',
  '4f',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '57',
  '58',
  '59',
  '5a',
  '5b',
  '5c',
  '5d',
  '5e',
  '5f',
  '60',
  '61',
  '62',
  '63',
  '64',
  '65',
  '66',
  '67',
  '68',
  '69',
  '6a',
  '6b',
  '6c',
  '6d',
  '6e',
  '6f',
  '70',
  '71',
  '72',
  '73',
  '74',
  '75',
  '76',
  '77',
  '78',
  '79',
  '7a',
  '7b',
  '7c',
  '7d',
  '7e',
  '7f',
  '80',
  '81',
  '82',
  '83',
  '84',
  '85',
  '86',
  '87',
  '88',
  '89',
  '8a',
  '8b',
  '8c',
  '8d',
  '8e',
  '8f',
  '90',
  '91',
  '92',
  '93',
  '94',
  '95',
  '96',
  '97',
  '98',
  '99',
  '9a',
  '9b',
  '9c',
  '9d',
  '9e',
  '9f',
  'a0',
  'a1',
  'a2',
  'a3',
  'a4',
  'a5',
  'a6',
  'a7',
  'a8',
  'a9',
  'aa',
  'ab',
  'ac',
  'ad',
  'ae',
  'af',
  'b0',
  'b1',
  'b2',
  'b3',
  'b4',
  'b5',
  'b6',
  'b7',
  'b8',
  'b9',
  'ba',
  'bb',
  'bc',
  'bd',
  'be',
  'bf',
  'c0',
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'c7',
  'c8',
  'c9',
  'ca',
  'cb',
  'cc',
  'cd',
  'ce',
  'cf',
  'd0',
  'd1',
  'd2',
  'd3',
  'd4',
  'd5',
  'd6',
  'd7',
  'd8',
  'd9',
  'da',
  'db',
  'dc',
  'dd',
  'de',
  'df',
  'e0',
  'e1',
  'e2',
  'e3',
  'e4',
  'e5',
  'e6',
  'e7',
  'e8',
  'e9',
  'ea',
  'eb',
  'ec',
  'ed',
  'ee',
  'ef',
  'f0',
  'f1',
  'f2',
  'f3',
  'f4',
  'f5',
  'f6',
  'f7',
  'f8',
  'f9',
  'fa',
  'fb',
  'fc',
  'fd',
  'fe',
  'ff',
]
