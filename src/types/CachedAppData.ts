import { VectorBufferStream } from '@shardus/core'

const cShardusCachedAppData = 3
const cShardusCachedAppDataVersion = 1

export type ShardusCachedAppData = {
  accountId: string
  stateId: string
  timestamp: number
  data: EVMResult
}

export type EVMResult = {
  txId: string
  txFrom: string
  ethAddress: string
  amountSpent: string
  accountType: number
  timestamp: number
  hash: string
  receipt: EVMReceipt
  readableReceipt: EVMReadableReceipt
}

export type EVMReceipt = {
  status: number
  cumulativeBlockGasUsed: string
  logs: EVMLog[]
  bitvector: Uint8Array
}


export type EVMLog = [address: Uint8Array, topics: Uint8Array[], data: Uint8Array]

export type EVMReadableReceipt = {
  blockHash: string
  blockNumber: string
  chainId: string
  contractAddress: string | null
  cumulativeGasUsed: string
  data: string
  from: string
  gasLimit: string
  gasPrice: string
  gasRefund: string
  gasUsed: string
  logs: EVMReadableLogs[]
  logsBloom: string
  nonce: string
  r: string
  s: string
  status: number
  to: string
  transactionHash: string
  transactionIndex: string
  type: string
  v: string
  value: string
}

export type EVMReadableLogs  = {
  address: string
  blockHash: string
  blockNumber: string
  data: string
  logIndex: string
  topics: string[]
  transactionHash: string
  transactionIndex: string
}

export function serializeEVMLog(stream: VectorBufferStream, obj: EVMLog): void {
  stream.writeBuffer(Buffer.from(obj[0]))

  stream.writeUInt8(obj[1].length)
  for (const topic of obj[1]) {
    stream.writeBuffer(Buffer.from(topic))
  }

  stream.writeBuffer(Buffer.from(obj[2]))
}

export function deserializeEVMLog(stream: VectorBufferStream): EVMLog {
  const address = stream.readBuffer()

  const topicsLength = stream.readUInt8()
  const topics = []
  for (let i = 0; i < topicsLength; i++) {
    topics.push(stream.readBuffer())
  }

  const data = stream.readBuffer()

  return [address, topics, data]
}

export function serializeEVMReadableLog(stream: VectorBufferStream, obj: EVMReadableLogs): void {
  stream.writeString(obj.address)
  stream.writeString(obj.blockHash)
  stream.writeString(obj.blockNumber)
  stream.writeString(obj.data)
  stream.writeString(obj.logIndex)
  stream.writeUInt8(obj.topics.length)
  for (const topic of obj.topics) {
    stream.writeString(topic)
  }
  stream.writeString(obj.transactionHash)
  stream.writeString(obj.transactionIndex)
}

export function deserializeEVMReadableLog(stream: VectorBufferStream): EVMReadableLogs {
  const address = stream.readString()
  const blockHash = stream.readString()
  const blockNumber = stream.readString()
  const data = stream.readString()
  const logIndex = stream.readString()
  const topicsLength = stream.readUInt8()
  const topics = []
  for (let i = 0; i < topicsLength; i++) {
    topics.push(stream.readString())
  }
  const transactionHash = stream.readString()
  const transactionIndex = stream.readString()

  return {
    address,
    blockHash,
    blockNumber,
    data,
    logIndex,
    topics,
    transactionHash,
    transactionIndex,
  }
}

export function serializeEVMReceipt(stream: VectorBufferStream, obj: EVMReceipt): void {
  stream.writeUInt8(obj.status)
  stream.writeString(obj.cumulativeBlockGasUsed)
  stream.writeUInt8(obj.logs?.length || 0)
  for (const log of obj.logs || []) {
    serializeEVMLog(stream, log)
  }
  stream.writeBuffer(Buffer.from(obj.bitvector))
}

export function deserializeEVMReceipt(stream: VectorBufferStream): EVMReceipt {
  const status = stream.readUInt8()
  const cumulativeBlockGasUsed = stream.readString()
  const logsLength = stream.readUInt8()
  const logs = []
  for (let i = 0; i < logsLength; i++) {
    logs.push(deserializeEVMLog(stream))
  }
  const bitvector = stream.readBuffer()

  return {
    status,
    cumulativeBlockGasUsed,
    logs,
    bitvector,
  }
}

export function serializeEVMReadableReceipt(stream: VectorBufferStream, obj: EVMReadableReceipt): void {
  stream.writeString(obj.blockHash)
  stream.writeString(obj.blockNumber)
  stream.writeString(obj.chainId)
  stream.writeString(obj.contractAddress || '')
  stream.writeString(obj.cumulativeGasUsed)
  stream.writeString(obj.data)
  stream.writeString(obj.from)
  stream.writeString(obj.gasLimit)
  // implement the rest
  stream.writeString(obj.gasPrice)
  stream.writeString(obj.gasRefund)
  stream.writeString(obj.gasUsed)
  stream.writeUInt8(obj.logs?.length || 0)
  for(const log of obj.logs){
    serializeEVMReadableLog(stream, log)
  }
  stream.writeString(obj.logsBloom)
  stream.writeString(obj.nonce)

  stream.writeString(obj.v)
  stream.writeString(obj.r)
  stream.writeString(obj.s)
  stream.writeUInt8(obj.status)

  stream.writeString(obj.to)
  stream.writeString(obj.value)
  stream.writeString(obj.transactionHash)
  stream.writeString(obj.transactionIndex)
  stream.writeString(obj.type)
}

export function deserializeEVMReadableReceipt(stream: VectorBufferStream): EVMReadableReceipt {
  const blockHash = stream.readString()
  const blockNumber = stream.readString()
  const chainId = stream.readString()

  let contractAddress = stream.readString() 
  if(contractAddress === '') contractAddress = null

  const cumulativeGasUsed = stream.readString()
  const data = stream.readString()
  const from = stream.readString()
  const gasLimit = stream.readString()

  const gasPrice = stream.readString()
  const gasRefund = stream.readString()
  const gasUsed = stream.readString()
  const logsLength = stream.readUInt8()
  const logs = []
  for (let i = 0; i < logsLength; i++) {
    logs.push(deserializeEVMReadableLog(stream))
  }
  const logsBloom = stream.readString()
  const nonce = stream.readString()
  const v = stream.readString()
  const r = stream.readString()
  const s = stream.readString()
  const status = stream.readUInt8()

  const to = stream.readString()
  const value = stream.readString()
  const transactionHash = stream.readString()
  const transactionIndex = stream.readString()
  const type = stream.readString()

  return {
    blockHash,
    blockNumber,
    chainId,
    contractAddress,
    cumulativeGasUsed,
    data,
    from,
    gasLimit,
    gasPrice,
    gasRefund,
    gasUsed,
    logs,
    logsBloom,
    nonce,
    r,
    s,
    status,
    to,
    transactionHash,
    transactionIndex,
    type,
    v,
    value,
  }

}

export function serializeEVMResult(stream: VectorBufferStream, obj: EVMResult, root = false): void {
  if (root) {
    stream.writeUInt8(cShardusCachedAppData)
  }

  stream.writeUInt8(cShardusCachedAppDataVersion)

  stream.writeString(obj.txId)
  stream.writeString(obj.txFrom)
  stream.writeString(obj.ethAddress)
  stream.writeString(obj.amountSpent)
  stream.writeUInt8(obj.accountType)
  stream.writeString(obj.timestamp.toString())
  stream.writeString(obj.hash)
  serializeEVMReceipt(stream, obj.receipt)
  serializeEVMReadableReceipt(stream, obj.readableReceipt)
}

export function deserializeEVMResult(stream: VectorBufferStream, root = false): EVMResult {
  if (root) {
    const type = stream.readUInt8()
    if (type !== cShardusCachedAppData) {
      throw new Error(`Invalid type ${type} for ShardusCachedAppData`)
    }
  }
  const serializerVersion = stream.readUInt8()
  const txId = stream.readString()
  const txFrom = stream.readString()
  const ethAddress = stream.readString()
  const amountSpent = stream.readString()
  const accountType = stream.readUInt8()
  const timestamp = parseInt(stream.readString())
  const hash = stream.readString()
  const receipt = deserializeEVMReceipt(stream)
  const readableReceipt = deserializeEVMReadableReceipt(stream)

  return {
    txId,
    txFrom,
    ethAddress,
    amountSpent,
    accountType,
    timestamp,
    hash,
    receipt,
    readableReceipt,
  }
}

export function serializeShardusCachedAppData(stream: VectorBufferStream, obj: ShardusCachedAppData): void {
  stream.writeString(obj.accountId)
  stream.writeString(obj.stateId)
  stream.writeString(obj.timestamp.toString())
  serializeEVMResult(stream, obj.data)
}

export function deserializeShardusCachedAppData(stream: VectorBufferStream): ShardusCachedAppData {
  const accountId = stream.readString()
  const stateId = stream.readString()
  const timestamp = parseInt(stream.readString())
  const data = deserializeEVMResult(stream)

  return {
    accountId,
    stateId,
    timestamp,
    data,
  }
}

// cached app data example
// {
//   "accountId": "b73fcd13ada1bc94a9f53126526616380862ac4aad45427d074b77ee74a33888",
//   "data": {
//     "accountType": 3,
//     "amountSpent": "0x32489e7a103270",
//     "ethAddress": "0xb73fcd13ada1bc94a9f53126526616380862ac4aad45427d074b77ee74a33888",
//     "hash": "bc81ab588c785895037c34614597b6aeeb94e734d0a3860438479b4205528a14",
//     "readableReceipt": {
//       "blockHash": "0xf65ff2c747588d9afd54e8d0914c5bd73d2bbfb4101df5829fe143f2a6aa8851",
//       "blockNumber": "0xbf",
//       "chainId": "0x1f92",
//       "contractAddress": null,
//       "cumulativeGasUsed": "0xcaa8",
//       "data": "0xa9059cbb00000000000000000000000054076e8d5eee811668a286db42d6b2c4bc0ce6d5000000000000000000000000000000000000000000000000016345785d8a0000",
//       "from": "0xd0d5268d8aecc35b34dc93eabec366f148a127c9",
//       "gasLimit": "0x2dc6c0",
//       "gasPrice": "0x2dc6c0",
//       "gasRefund": "0x0",
//       "gasUsed": "0xcaa8",
//       "logs": [
//         {
//           "address": "0x69d7f7f6ab5fd779f64125d42d5558195bcfde0c",
//           "blockHash": "0xf65ff2c747588d9afd54e8d0914c5bd73d2bbfb4101df5829fe143f2a6aa8851",
//           "blockNumber": "0xbf",
//           "data": "0x000000000000000000000000000000000000000000000000016345785d8a0000",
//           "logIndex": "0x0",
//           "topics": [
//             "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
//             "0x000000000000000000000000d0d5268d8aecc35b34dc93eabec366f148a127c9",
//             "0x00000000000000000000000054076e8d5eee811668a286db42d6b2c4bc0ce6d5"
//           ],
//           "transactionHash": "0xb73fcd13ada1bc94a9f53126526616380862ac4aad45427d074b77ee74a33888",
//           "transactionIndex": "0x1"
//         }
//       ],
//       "logsBloom": "0x00000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000400000000000000000000002000000000000000000000000040000000000000000000000000000000000000010000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000002000000000000000000000000000000000000000000001000000000008000040000000000000000000000000000000000000000000000000000000000",
//       "nonce": "0x6",
//       "r": "0xd454b8b7d30112091851421c27d8b3c33a612813396d282d9d125cc6f5659095",
//       "s": "0x340873a6492b15eeb7a1375fd3152b4bcf3d4666078791d122fef714821d9a47",
//       "status": 1,
//       "to": "0x69d7f7f6ab5fd779f64125d42d5558195bcfde0c",
//       "transactionHash": "0xb73fcd13ada1bc94a9f53126526616380862ac4aad45427d074b77ee74a33888",
//       "transactionIndex": "0x1",
//       "type": "0x1",
//       "v": "0x0",
//       "value": "0x0"
//     },
//     "receipt": {
//       "bitvector": {
//         "0": 0,
//         "1": 0,
//         "2": 0,
//         "3": 0,
//         "4": 0,
//         "5": 0,
//         "6": 0,
//         "7": 0,
//         "8": 0,
//         "9": 0,
//         "10": 0,
//         "11": 0,
//         "12": 8,
//         "13": 0,
//         "14": 0,
//         "15": 0,
//         "16": 0,
//         "17": 0,
//         "18": 0,
//         "19": 0,
//         "20": 0,
//         "21": 0,
//         "22": 0,
//         "23": 0,
//         "24": 0,
//         "25": 0,
//         "26": 0,
//         "27": 0,
//         "28": 0,
//         "29": 0,
//         "30": 0,
//         "31": 0,
//         "32": 0,
//         "33": 0,
//         "34": 0,
//         "35": 0,
//         "36": 0,
//         "37": 0,
//         "38": 0,
//         "39": 0,
//         "40": 0,
//         "41": 0,
//         "42": 0,
//         "43": 0,
//         "44": 0,
//         "45": 0,
//         "46": 0,
//         "47": 0,
//         "48": 0,
//         "49": 0,
//         "50": 0,
//         "51": 0,
//         "52": 0,
//         "53": 0,
//         "54": 0,
//         "55": 0,
//         "56": 0,
//         "57": 0,
//         "58": 0,
//         "59": 0,
//         "60": 0,
//         "61": 0,
//         "62": 0,
//         "63": 0,
//         "64": 0,
//         "65": 0,
//         "66": 0,
//         "67": 0,
//         "68": 0,
//         "69": 0,
//         "70": 0,
//         "71": 0,
//         "72": 0,
//         "73": 0,
//         "74": 0,
//         "75": 8,
//         "76": 0,
//         "77": 0,
//         "78": 0,
//         "79": 64,
//         "80": 0,
//         "81": 0,
//         "82": 0,
//         "83": 0,
//         "84": 0,
//         "85": 0,
//         "86": 0,
//         "87": 0,
//         "88": 0,
//         "89": 0,
//         "90": 2,
//         "91": 0,
//         "92": 0,
//         "93": 0,
//         "94": 0,
//         "95": 0,
//         "96": 0,
//         "97": 0,
//         "98": 0,
//         "99": 0,
//         "100": 0,
//         "101": 0,
//         "102": 0,
//         "103": 4,
//         "104": 0,
//         "105": 0,
//         "106": 0,
//         "107": 0,
//         "108": 0,
//         "109": 0,
//         "110": 0,
//         "111": 0,
//         "112": 0,
//         "113": 0,
//         "114": 0,
//         "115": 0,
//         "116": 0,
//         "117": 0,
//         "118": 0,
//         "119": 0,
//         "120": 0,
//         "121": 0,
//         "122": 0,
//         "123": 16,
//         "124": 0,
//         "125": 0,
//         "126": 0,
//         "127": 0,
//         "128": 0,
//         "129": 0,
//         "130": 0,
//         "131": 0,
//         "132": 0,
//         "133": 0,
//         "134": 0,
//         "135": 0,
//         "136": 0,
//         "137": 0,
//         "138": 0,
//         "139": 0,
//         "140": 0,
//         "141": 0,
//         "142": 0,
//         "143": 8,
//         "144": 0,
//         "145": 0,
//         "146": 0,
//         "147": 0,
//         "148": 0,
//         "149": 0,
//         "150": 0,
//         "151": 0,
//         "152": 0,
//         "153": 0,
//         "154": 0,
//         "155": 0,
//         "156": 0,
//         "157": 0,
//         "158": 0,
//         "159": 0,
//         "160": 0,
//         "161": 0,
//         "162": 0,
//         "163": 0,
//         "164": 0,
//         "165": 0,
//         "166": 0,
//         "167": 0,
//         "168": 0,
//         "169": 0,
//         "170": 0,
//         "171": 0,
//         "172": 0,
//         "173": 0,
//         "174": 0,
//         "175": 0,
//         "176": 0,
//         "177": 0,
//         "178": 0,
//         "179": 0,
//         "180": 0,
//         "181": 0,
//         "182": 0,
//         "183": 0,
//         "184": 16,
//         "185": 0,
//         "186": 0,
//         "187": 0,
//         "188": 0,
//         "189": 0,
//         "190": 0,
//         "191": 0,
//         "192": 0,
//         "193": 0,
//         "194": 0,
//         "195": 2,
//         "196": 0,
//         "197": 0,
//         "198": 0,
//         "199": 0,
//         "200": 0,
//         "201": 0,
//         "202": 0,
//         "203": 0,
//         "204": 0,
//         "205": 0,
//         "206": 0,
//         "207": 0,
//         "208": 0,
//         "209": 0,
//         "210": 0,
//         "211": 0,
//         "212": 0,
//         "213": 0,
//         "214": 0,
//         "215": 0,
//         "216": 0,
//         "217": 0,
//         "218": 16,
//         "219": 0,
//         "220": 0,
//         "221": 0,
//         "222": 0,
//         "223": 0,
//         "224": 128,
//         "225": 0,
//         "226": 4,
//         "227": 0,
//         "228": 0,
//         "229": 0,
//         "230": 0,
//         "231": 0,
//         "232": 0,
//         "233": 0,
//         "234": 0,
//         "235": 0,
//         "236": 0,
//         "237": 0,
//         "238": 0,
//         "239": 0,
//         "240": 0,
//         "241": 0,
//         "242": 0,
//         "243": 0,
//         "244": 0,
//         "245": 0,
//         "246": 0,
//         "247": 0,
//         "248": 0,
//         "249": 0,
//         "250": 0,
//         "251": 0,
//         "252": 0,
//         "253": 0,
//         "254": 0,
//         "255": 0
//       },
//       "cumulativeBlockGasUsed": "caa8",
//       "logs": [
//         [
//           {
//             "0": 105,
//             "1": 215,
//             "2": 247,
//             "3": 246,
//             "4": 171,
//             "5": 95,
//             "6": 215,
//             "7": 121,
//             "8": 246,
//             "9": 65,
//             "10": 37,
//             "11": 212,
//             "12": 45,
//             "13": 85,
//             "14": 88,
//             "15": 25,
//             "16": 91,
//             "17": 207,
//             "18": 222,
//             "19": 12
//           },
//           [
//             {
//               "0": 221,
//               "1": 242,
//               "2": 82,
//               "3": 173,
//               "4": 27,
//               "5": 226,
//               "6": 200,
//               "7": 155,
//               "8": 105,
//               "9": 194,
//               "10": 176,
//               "11": 104,
//               "12": 252,
//               "13": 55,
//               "14": 141,
//               "15": 170,
//               "16": 149,
//               "17": 43,
//               "18": 167,
//               "19": 241,
//               "20": 99,
//               "21": 196,
//               "22": 161,
//               "23": 22,
//               "24": 40,
//               "25": 245,
//               "26": 90,
//               "27": 77,
//               "28": 245,
//               "29": 35,
//               "30": 179,
//               "31": 239
//             },
//             {
//               "0": 0,
//               "1": 0,
//               "2": 0,
//               "3": 0,
//               "4": 0,
//               "5": 0,
//               "6": 0,
//               "7": 0,
//               "8": 0,
//               "9": 0,
//               "10": 0,
//               "11": 0,
//               "12": 208,
//               "13": 213,
//               "14": 38,
//               "15": 141,
//               "16": 138,
//               "17": 236,
//               "18": 195,
//               "19": 91,
//               "20": 52,
//               "21": 220,
//               "22": 147,
//               "23": 234,
//               "24": 190,
//               "25": 195,
//               "26": 102,
//               "27": 241,
//               "28": 72,
//               "29": 161,
//               "30": 39,
//               "31": 201
//             },
//             {
//               "0": 0,
//               "1": 0,
//               "2": 0,
//               "3": 0,
//               "4": 0,
//               "5": 0,
//               "6": 0,
//               "7": 0,
//               "8": 0,
//               "9": 0,
//               "10": 0,
//               "11": 0,
//               "12": 84,
//               "13": 7,
//               "14": 110,
//               "15": 141,
//               "16": 94,
//               "17": 238,
//               "18": 129,
//               "19": 22,
//               "20": 104,
//               "21": 162,
//               "22": 134,
//               "23": 219,
//               "24": 66,
//               "25": 214,
//               "26": 178,
//               "27": 196,
//               "28": 188,
//               "29": 12,
//               "30": 230,
//               "31": 213
//             }
//           ],
//           {
//             "0": 0,
//             "1": 0,
//             "2": 0,
//             "3": 0,
//             "4": 0,
//             "5": 0,
//             "6": 0,
//             "7": 0,
//             "8": 0,
//             "9": 0,
//             "10": 0,
//             "11": 0,
//             "12": 0,
//             "13": 0,
//             "14": 0,
//             "15": 0,
//             "16": 0,
//             "17": 0,
//             "18": 0,
//             "19": 0,
//             "20": 0,
//             "21": 0,
//             "22": 0,
//             "23": 0,
//             "24": 1,
//             "25": 99,
//             "26": 69,
//             "27": 120,
//             "28": 93,
//             "29": 138,
//             "30": 0,
//             "31": 0
//           }
//         ]
//       ],
//       "status": 1
//     },
//     "timestamp": 1705645041465,
//     "txFrom": "0xd0d5268d8aecc35b34dc93eabec366f148a127c9",
//     "txId": "d968147e5bb6dbe2d66f645261af8be73d4dcb37aa86019d2707d299a63de4fb"
//   },
//   "stateId": "bc81ab588c785895037c34614597b6aeeb94e734d0a3860438479b4205528a14",
//   "timestamp": 1705645041465
// }
