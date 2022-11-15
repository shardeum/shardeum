import Common, { Chain, Hardfork } from '@ethereumjs/common'
// eslint-disable-next-line node/no-extraneous-import
import { Transaction } from '@ethereumjs/tx'
import VM from '@ethereumjs/vm'
import fs from 'fs'
import path from 'path'

import { ShardeumState } from '../state'

import { Account, Address, BN, toBuffer } from 'ethereumjs-util'

import * as crypto from '@shardus/crypto-utils'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Merge })

let shardeumStateManager = new ShardeumState() //as StateManager
const vm = new VM({ common, stateManager: shardeumStateManager })

//const vm = new VM({common});

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

function getTransactionObj(tx: any): Transaction {
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

let signedTxs: Transaction[] = []
let accounts = new Map()

function initGenesis() {
  let fileName = 'genesis_block.json'
  var localDir = path.resolve('./')

  var genesis = fs.readFileSync(path.join(localDir, fileName), 'utf8')
  let genData: { [address: string]: { wei: number } } = JSON.parse(genesis)
  let transformedGenData: { [address: string]: string } = {}
  for (const [key, value] of Object.entries(genData)) {
    let newKey = '0x' + key
    transformedGenData[newKey] = '0x' + value.wei
  }
  vm.stateManager.generateGenesis(transformedGenData)
}

async function loadTXAndAccounts() {
  let fileName = 'raw_txs.json'
  var localDir = path.resolve('./')

  var rawTxs = fs.readFileSync(path.join(localDir, fileName), 'utf8')
  rawTxs = JSON.parse(rawTxs)

  //let rawTxs = JSON.parse(FS.readFileSync('../../raw_txs.json', 'utf8').toString())
  for (const [key, value] of Object.entries(rawTxs)) {
    try {
      let txRaw = { raw: value }
      let txObj = getTransactionObj(txRaw)
      let sendAddr = txObj.getSenderAddress().toString()

      await getOrCreateAccount(sendAddr)
      if (txObj.to) {
        let toAddr = txObj.to.toString()
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
  let batchSize = 100
  let batches = 100

  let totalPass = 0
  let totalFail = 0

  let txRunTimes = []

  //filter to only run some tx types with this:
  let allowedTXTypes: any = { transfer: true, execute: true, create: true }

  for (let k = 0; k < batches; k++) {
    let start = Date.now()
    let stats: any = {
      tps: 0,
      fail: 0,
      pass: 0,
      passTPS: 0,
      failTPS: 0,
      transfer: { p: 0, f: 0 },
      execute: { p: 0, f: 0 },
      create: { p: 0, f: 0 },
    }
    for (let i = 0; i < batchSize; i++) {
      if (index >= signedTxs.length) {
        console.log('no more txs') //will miss the last round of stats but that prob does not matter much

        txRunTimes.sort((a, b) => b.time - a.time)
        for (let i = 0; i < 100; i++) {
          console.log(JSON.stringify(txRunTimes[i]))
        }
        return
      }

      let tx = signedTxs[index]
      index++
      let txType = getTxType(tx)
      if (allowedTXTypes[txType] != true) {
        i-- //terrible hack
        continue //temp hack to throw out xfer
      }

      let txStart = Date.now()
      try {
        await vm.runTx({ tx, skipNonce: false, skipBlockGasLimitValidation: true })
        stats.pass++
        totalPass++
        stats[txType].p++
      } catch (e) {
        stats.fail++
        totalFail++
        stats[txType].f++
        console.log(e.message)
        // try{
        //   await vm.runTx({tx})
        // } catch(e2){

        // }
      }
      let txElapsed = Date.now() - txStart
      //if(txType != 'transfer'){
      txRunTimes.push({ time: txElapsed, t: txType, index })
      //}
    }

    let elapsed = Date.now() - start
    stats.tps = roundTo2decimals((1000 * batchSize) / elapsed)
    stats.passTPS = roundTo2decimals((1000 * stats.pass) / elapsed)
    stats.failTPS = roundTo2decimals((1000 * stats.fail) / elapsed)
    console.log(`batch ${k}. ${batchSize} txs  elapsed:${elapsed} stats:${JSON.stringify(stats)}`)
  }
}

async function test() {
  initGenesis()
  await loadTXAndAccounts()
  await runTXs(signedTxs)
}

//test()
let txStr =
  '0xf8728207b18501dfd14000832dc6c094c125bde1fdcc2ca1a0dd2583872dcc037aeed87289056bc75e2d6310000080823f61a0f56ebbe107068b9bf0a63a0c15023e75a34bd4d2807ce7dd21d62ed13cc68968a019c537ddbd95c21667433e284c32580dbce4b1f508dd41cbca7b21befd0d1024'
debugTX(txStr)
