let rawTxs = require('./raw_txs.json')
const got = require('got')

async function postJSON (url, obj) {
  const response = await got(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(obj)
  })
  return response.body
}

async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function main () {
  let tps = parseInt(process.argv[2]) || 1
  console.log(`Spamming with ${tps} tps`)
  for (let txHash in rawTxs) {
    let rawData = rawTxs[txHash]
    postJSON('http://localhost:9001/inject', {
      raw: rawData
    }).then(result => { console.log(result)})
    await sleep(Math.round(1000 / tps))
  }
}

main()
