// eslint-disable-next-line @typescript-eslint/no-var-requires
const rust_ecrecover = require('../utils/ecrecover')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires

// const messageHash = Buffer.from([
//   0x0a, 0x1e, 0x27, 0x23, 0xbd, 0x7f, 0x19, 0x96, 0x83, 0x2b, 0x7e, 0xd7, 0x40, 0x6d, 0xf8, 0xad, 0x97, 0x5d,
//   0xeb, 0xa1, 0xaa, 0x04, 0x02, 0x0b, 0x5b, 0xfc, 0x3e, 0x6f, 0xe7, 0x0e, 0xcc, 0x29,
// ])
// const v = 27
// const r = Buffer.from('3bcdbbe689224248b2dc4b669ad83dc7b3af9f8ec5ed7a42b7fcfb3110229cfb', 'hex')
// const s = Buffer.from([
//   0x24, 0x43, 0x67, 0x93, 0x9f, 0xe8, 0x50, 0xeb, 0xb2, 0x5c, 0x3e, 0x6a, 0x02, 0xbb, 0x9e, 0xd0, 0x87, 0x31,
//   0x6d, 0xac, 0x75, 0xc0, 0xc0, 0x5e, 0xba, 0xba, 0x68, 0x39, 0xe7, 0x5f, 0x1c, 0xc4,
// ])

// Function to read the file and return the transactions
const filePath = '/Users/atharva/shardeum/server/data.txt'
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function processFile(filePath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const dataRead = fs.readFileSync(filePath, 'utf8')
  const lines = dataRead.split('\n')
  const uniqueDataSet = new Set()
  const transactions = []

  lines.forEach((line) => {
    if (line) {
      const jsonLine = JSON.parse(line)
      const { data, v, r, s } = jsonLine
      const d = data
      const v_copy = v
      const r_copy = r
      const s_copy = s
      const uniqueKey = `${d}-${v}-${r}-${s}`
      // console.log(d, v, r, s)

      if (!uniqueDataSet.has(uniqueKey)) {
        uniqueDataSet.add(uniqueKey)
        // console.log(uniqueKey, '\n')
        const cleanHexStringData = d.startsWith('0x') ? d.slice(2) : d
        const cleanHexStringR = r_copy.startsWith('0x') ? r_copy.slice(2) : r_copy
        const cleanHexStringS = s_copy.startsWith('0x') ? s_copy.slice(2) : s_copy

        const r = Buffer.from(cleanHexStringR, 'hex')
        const data = Buffer.from(cleanHexStringData, 'hex')
        const s = Buffer.from(cleanHexStringS, 'hex')

        if (data.byteLength >= 32 && s.byteLength == 32 && r.byteLength == 32) {
          // TODO move to inside rust as an argument
          const v = parseInt(v_copy, 16) - (8082 * 2 + 35) + 27
          transactions.push({ data, v, r, s })
        }
      }
    }
  })
  console.log('num Transactions', transactions.length)
  return transactions
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/explicit-function-return-type
function timeEcrecover(transactions) {
  let totalTime = 0

  transactions.forEach((tx) => {
    const startTime = process.hrtime()
    // console.log(tx)
    const x = rust_ecrecover.ecrecover(tx.data, tx.v, tx.r, tx.s)
    // console.log(x);
    const [seconds, nanoseconds] = process.hrtime(startTime)
    totalTime += seconds * 1000 + nanoseconds / 1e6 // Convert to milliseconds
  })

  return totalTime
}

const transactions = processFile(filePath)
const totalTime = timeEcrecover(transactions)

const averageTime = totalTime / transactions.length
console.log(`Average time per rust run: ${averageTime} ms`)
