import Common, { Chain, Hardfork } from '@ethereumjs/common'
import { Transaction } from '@ethereumjs/tx'
import VM from '@ethereumjs/vm'
import fs from 'fs'
import path from 'path'

import { ShardeumState } from '../state'

import { Account, Address, BN, toBuffer } from 'ethereumjs-util'

import * as crypto from '@shardus/crypto-utils'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Merge })

const shardeumStateManager = new ShardeumState() //as StateManager
const vm = new VM({ common, stateManager: shardeumStateManager })

function debugTX(txStr) {
  const serializedInput = toBuffer(txStr)
  const transaction = Transaction.fromRlpSerializedTx(serializedInput)

  console.log(JSON.stringify(transaction))

  console.log('to ' + transaction.to)

  console.log('verify ' + transaction.verifySignature())

  console.log('sender ' + transaction.getSenderAddress())

  console.log('sender PK ' + transaction.getSenderPublicKey().toString())

  console.log('sender json.. ' + JSON.stringify(transaction.toJSON()))
}

function getTransactionObj(tx): Transaction {
  if (!tx.raw) throw Error('fail')
  try {
    const serializedInput = toBuffer(tx.raw)
    const transaction = Transaction.fromRlpSerializedTx(serializedInput)
    return transaction
  } catch (e) {
    console.log('Unable to get transaction obj', e)
    throw Error('fail2')
  }
}

const signedTxs: Transaction[] = []
const accounts = new Map()

function initGenesis() {
  const fileName = 'genesis_block.json'
  const localDir = path.resolve('./')

  const genesis = fs.readFileSync(path.join(localDir, fileName), 'utf8')
  const genData: { [address: string]: { wei: number } } = JSON.parse(genesis)
  const transformedGenData: { [address: string]: string } = {}
  for (const [key, value] of Object.entries(genData)) {
    const newKey = '0x' + key
    transformedGenData[newKey] = '0x' + value.wei // eslint-disable-line security/detect-object-injection
  }
  vm.stateManager.generateGenesis(transformedGenData)
}

async function loadTXAndAccounts() {
  const fileName = 'raw_txs.json'
  const localDir = path.resolve('./')

  let rawTxs = fs.readFileSync(path.join(localDir, fileName), 'utf8')
  rawTxs = JSON.parse(rawTxs)

  //let rawTxs = JSON.parse(FS.readFileSync('../../raw_txs.json', 'utf8').toString())
  for (const [, value] of Object.entries(rawTxs)) {
    try {
      const txRaw = { raw: value }
      const txObj = getTransactionObj(txRaw)
      const sendAddr = txObj.getSenderAddress().toString()

      await getOrCreateAccount(sendAddr)
      if (txObj.to) {
        const toAddr = txObj.to.toString()
        await getOrCreateAccount(toAddr)
      }
      signedTxs.push(txObj)
    } catch (e) {}
  }
}

function getTxType(txObj: Transaction): string {
  if (txObj.data != null && txObj.data.length > 0) {
    if (!txObj.to) {
      return 'create'
    } else {
      return 'execute'
    }
  } else {
    return 'transfer'
  }
}

async function getOrCreateAccount(addressStr: string) {
  if (accounts.has(addressStr)) {
    return null
  }
  const accountAddress = Address.fromString(addressStr)

  //we could have this from genesis already but it is not in our map yet
  // const existingAcc = await vm.stateManager.getAccount(accountAddress)
  // if(existingAcc != null){
  //   accounts.set(addressStr, existingAcc )
  //   return existingAcc
  // }

  const oneEth = new BN(10).pow(new BN(18))

  const acctData = {
    nonce: 0,
    balance: oneEth.mul(new BN(1000000000000)), // 100 eth
  }
  const account = Account.fromAccountData(acctData)
  await vm.stateManager.putAccount(accountAddress, account)
  const updatedAccount = await vm.stateManager.getAccount(accountAddress)
  //updatedAccount.timestamp = Date.now()

  accounts.set(addressStr, updatedAccount)

  return updatedAccount
}

function roundTo2decimals(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100
}
async function runTXs(signedTxs: Transaction[]) {
  let index = 0
  const batchSize = 100
  const batches = 100
  const txRunTimes = []

  //filter to only run some tx types with this:
  const allowedTXTypes = { transfer: true, execute: true, create: true }

  for (let k = 0; k < batches; k++) {
    const start = Date.now()
    const stats = {
      tps: 0,
      fail: 0,
      pass: 0,
      passTPS: 0,
      failTPS: 0,
      transfer: { p: 0, f: 0 },
      execute: { p: 0, f: 0 },
      create: { p: 0, f: 0 },
    }
    /* eslint-disable security/detect-object-injection */
    for (let i = 0; i < batchSize; i++) {
      if (index >= signedTxs.length) {
        console.log('no more txs') //will miss the last round of stats but that prob does not matter much

        txRunTimes.sort((a, b) => b.time - a.time)
        for (let i = 0; i < 100; i++) {
          console.log(JSON.stringify(txRunTimes[i]))
        }
        return
      }

      const tx = signedTxs[index]
      index++
      const txType = getTxType(tx)
      if (allowedTXTypes[txType] != true) {
        i-- //terrible hack
        continue //temp hack to throw out xfer
      }

      const txStart = Date.now()
      try {
        await vm.runTx({ tx, skipNonce: false, skipBlockGasLimitValidation: true })
        stats.pass++
        stats[txType].p++
      } catch (e) {
        stats.fail++
        stats[txType].f++
        console.log(e.message)
      }
      const txElapsed = Date.now() - txStart
      txRunTimes.push({ time: txElapsed, t: txType, index })
    }
    /* eslint-enable security/detect-object-injection */

    const elapsed = Date.now() - start
    stats.tps = roundTo2decimals((1000 * batchSize) / elapsed)
    stats.passTPS = roundTo2decimals((1000 * stats.pass) / elapsed)
    stats.failTPS = roundTo2decimals((1000 * stats.fail) / elapsed)
    console.log(`batch ${k}. ${batchSize} txs  elapsed:${elapsed} stats:${JSON.stringify(stats)}`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function test() {
  initGenesis()
  await loadTXAndAccounts()
  await runTXs(signedTxs)
}

//test()
const txStr =
  '0xf8728207b18501dfd14000832dc6c094c125bde1fdcc2ca1a0dd2583872dcc037aeed87289056bc75e2d6310000080823f61a0f56ebbe107068b9bf0a63a0c15023e75a34bd4d2807ce7dd21d62ed13cc68968a019c537ddbd95c21667433e284c32580dbce4b1f508dd41cbca7b21befd0d1024'
debugTX(txStr)
