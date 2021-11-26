const fs = require('fs')
const { resolve } = require('path')
const vorpal = require('vorpal')()
const got = require('got')
const crypto = require('shardus-crypto-utils')
crypto.init('64f152869ca2d473e4ba64ab53f49ccdb2edae22da192c126850970e788af347')

const walletFile = resolve('./wallet.json')
let walletEntries = {}

try {
  walletEntries = require(walletFile)
} catch (e) {
  saveEntries(walletEntries, walletFile)
  console.log(`Created wallet file '${walletFile}'.`)
}

function saveEntries (entries, file) {
  const stringifiedEntries = JSON.stringify(entries, null, 2)
  fs.writeFileSync(file, stringifiedEntries)
}
function createEntry (name, id) {
  if (typeof id === 'undefined' || id === null) {
    id = crypto.hash(name)
  }
  walletEntries[name] = String(id)
  saveEntries(walletEntries, walletFile)
  return id
}

console.log(`Loaded wallet entries from '${walletFile}'.`)

let host = process.argv[2] || 'localhost:9001'

function getInjectUrl () { return `http://${host}/inject` }
function getAccountsUrl () { return `http://${host}/accounts` }
function getAccountUrl (id) { return `http://${host}/account/${id}` }

console.log(`Using ${host} as coin-app node for queries and transactions.`)

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
/**
 * interface tx {
 *   type: string
 *   from: string,
 *   to: string,
 *   amount: number,
 *   timestamp: number
 * }
 */
async function injectTx (tx = {}) {
  tx = Object.assign({
    type: 'create',
    from: 'noone',
    to: 'someone',
    amount: 1,
    timestamp: Date.now()
  }, tx)
  try {
    const res = await postJSON(getInjectUrl(), tx)
    return res
  } catch (err) {
    return err.message
  }
}
async function getAccountData (id) {
  try {
    const res = await got(typeof id !== 'undefined' && id !== null ? getAccountUrl(id) : getAccountsUrl())
    return res.body
  } catch (err) {
    return err.message
  }
}

vorpal
  .command('use <host>', 'Uses the given <host> as the coin-app node for queries and transactions.')
  .action(function (args, callback) {
    host = args.host
    this.log(`Set ${args.host} as coin-app node for transactions.`)
    callback()
  })

vorpal
  .command('wallet create <name> [id]', 'Creates a wallet with the given <name> and [id]. Makes [id] = hash(<name>) if [id] is not given.')
  .action(function (args, callback) {
    if (typeof walletEntries[args.name] !== 'undefined' && walletEntries[args.name] !== null) {
      this.log(`Wallet named '${args.name}' already exists.`)
      callback()
      return
    }
    const id = createEntry(args.name, args.id)
    this.log(`Created wallet '${args.name}': '${id}'.`)
    callback()
  })

vorpal
  .command('wallet list [name]', 'Lists wallet for the given [name]. Otherwise, lists all wallets.')
  .action(function (args, callback) {
    let wallet = walletEntries[args.name]
    if (typeof wallet !== 'undefined' && wallet !== null) {
      this.log(`${JSON.stringify(wallet, null, 2)}`)
    } else {
      this.log(`${JSON.stringify(walletEntries, null, 2)}`)
    }
    callback()
  })

vorpal
  .command('tokens create <amount> <to>', 'Creates <amount> tokens for the <to> wallet.')
  .action(function (args, callback) {
    let toId = walletEntries[args.to]
    if (typeof toId === 'undefined' || toId === null) {
      toId = createEntry(args.to)
      this.log(`Created wallet '${args.to}': '${toId}'.`)
    }
    injectTx({ type: 'create', from: '0'.repeat(32), to: toId, amount: args.amount }).then((res) => {
      this.log(res)
      callback()
    })
  })

vorpal
  .command('tokens transfer <amount> <from> <to>', 'Transfers <amount> tokens from the <from> wallet to the <to> wallet.')
  .action(function (args, callback) {
    const fromId = walletEntries[args.from]
    if (typeof fromId === 'undefined' || fromId === null) {
      this.log(`Wallet '${args.from}' does not exist.`)
      this.callback()
    }
    let toId = walletEntries[args.to]
    if (typeof toId === 'undefined' || toId === null) {
      toId = createEntry(args.to)
      this.log(`Created wallet '${args.to}': '${toId}'.`)
    }
    injectTx({ type: 'transfer', from: fromId, to: toId, amount: args.amount }).then((res) => {
      this.log(res)
      callback()
    })
  })

vorpal
  .command('query [account]', 'Queries network data for the account associated with the given [wallet]. Otherwise, gets all network data.')
  .action(function (args, callback) {
    const accountId = walletEntries[args.account]
    this.log(`Querying network for ${accountId ? `'${args.account}' wallet data` : 'all data'}:`)
    getAccountData(accountId).then(res => {
      try {
        const parsed = JSON.parse(res)
        res = JSON.stringify(parsed, null, 2)
      } catch (err) {
        this.log('Response is not a JSON object')
      } finally {
        this.log(res)
        callback()
      }
    })
  })

vorpal
  .delimiter('client$')
  .show()
