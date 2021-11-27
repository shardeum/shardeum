import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'
import stringify from 'fast-json-stable-stringify'
import * as crypto from 'shardus-crypto-utils'
import { add } from 'lodash'
let { shardusFactory } = require('shardus-global-server')

crypto.init('64f152869ca2d473e4ba64ab53f49ccdb2edae22da192c126850970e788af347')

let {
  Account,
  Address,
  BN,
  toBuffer,
  bufferToHex
} = require('ethereumjs-util')
let { Transaction } = require('@ethereumjs/tx')
let VM = require('@ethereumjs/vm').default

const overwriteMerge = (target, source, options) => source

let config = { server: { baseDir: './' } }

if (fs.existsSync(path.join(process.cwd(), 'config.json'))) {
  const fileConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')).toString())
  config = merge(config, fileConfig, { arrayMerge: overwriteMerge })
}

if (process.env.BASE_DIR) {
  let baseDir = process.env.BASE_DIR || '.'
  let baseDirFileConfig

  if (fs.existsSync(path.join(baseDir, 'config.json'))) {
    baseDirFileConfig = JSON.parse(fs.readFileSync(path.join(baseDir, 'config.json')).toString())
  }
  config = merge(config, baseDirFileConfig, { arrayMerge: overwriteMerge })
  config.server.baseDir = process.env.BASE_DIR
}

if (process.env.APP_SEEDLIST) {
  config = merge(
    config,
    {
      server: {
        p2p: {
          maxJoinedPerCycle: 5,
          maxRotatedPerCycle: 0,
          existingArchivers: [
            {
              ip: process.env.APP_SEEDLIST,
              port: 4000,
              publicKey: '758b1c119412298802cd28dbfa394cdfeecc4074492d60844cc192d632d84de3'
            }
          ]
        },
        sharding: {
          nodesPerConsensus: 10
        }
      }
    },
    { arrayMerge: overwriteMerge }
  )
}

if (process.env.APP_MONITOR) {
  config = merge(
    config,
    {
      server: {
        reporting: {
          recipient: `http://${process.env.APP_MONITOR}:3000/api`
        }
      }
    },
    { arrayMerge: overwriteMerge }
  )
}

if (process.env.APP_IP) {
  config = merge(
    config,
    {
      server: {
        ip: {
          externalIp: process.env.APP_IP,
          internalIp: process.env.APP_IP
        }
      }
    },
    { arrayMerge: overwriteMerge }
  )
}

// Setting minNodesToAllowTxs to 1 allow single node networks
config = merge(config, {
  server: {
    p2p: {
      minNodesToAllowTxs: 1
    }
  }
})

//some debug settings
config = merge(
  config,
  {
    server: {
      mode: 'debug',
      debug: {
        startInFatalsLogMode: true, //true setting good for big aws test with nodes joining under stress.
        startInErrorLogMode: false,
        fakeNetworkDelay:0,
        disableSnapshots: true,
        countEndpointStart: -1  
      }
    }
  },
  { arrayMerge: overwriteMerge }
)

const dapp = shardusFactory(config)

/**
 * interface account {
 *   id: string,        // 32 byte hex string
 *   hash: string,      // 32 byte hex string
 *   timestamp: number, // ms since epoch
 *   data: {
 *     balance: number
 *   }
 * }
 *
 * interface accounts {
 *   [id: string]: account
 * }
 */
let accounts = {}
let appliedTxs = {}
let EVM = new VM()

createAccount('0x2041B9176A4839dAf7A4DcC6a97BA023953d9ad9').then(result => {
  console.log('Tester account created', result)
}).catch(e => {
  console.log('Error while creating tester account')
})

async function createAccount (addressStr) {
  const accountAddress = Address.fromString(addressStr)
  const oneEth = new BN(10).pow(new BN(18))

  const acctData = {
    nonce: 0,
    balance: oneEth.mul(new BN(100)) // 100 eth
  }
  const account = Account.fromAccountData(acctData)
  await EVM.stateManager.putAccount(accountAddress, account)
  const updatedAccount = await EVM.stateManager.getAccount(accountAddress)
  updatedAccount.timestamp = Date.now()
  return updatedAccount
}

function getTransactionObj (tx) {
  if (!tx.raw) return
  try {
    const serializedInput = toBuffer(tx.raw)
    return Transaction.fromRlpSerializedTx(serializedInput)
  } catch (e) {
    console.log('Unable to get transaction obj', e)
  }
}

function getReadableTransaction (tx) {
  const transaction = getTransactionObj(tx)
  if (!transaction) return { error: 'not found' }
  return {
    from: transaction.getSenderAddress().toString(),
    to: transaction.to ? transaction.to.toString() : '',
    value: transaction.value.toString(),
    data: bufferToHex(transaction.data)
  }
}

async function getReadableAccountInfo (addressStr) {
  const address = Address.fromString(addressStr)
  const account = await EVM.stateManager.getAccount(address)
  return {
    nonce: account.nonce.toString(),
    balance: account.balance.toString(),
    stateRoot: bufferToHex(account.stateRoot),
    codeHash: bufferToHex(account.codeHash)
  }
}

function transformAddress (addressStr) {
  // return addressStr.slice(2).padEnd(42, '0')
  return addressStr
}

dapp.registerExternalPost('inject', async (req, res) => {
  let tx = req.body
  tx.timestamp = Date.now()
  try {
    const response = dapp.put(tx)
    res.json(response)
  } catch (err) {
    console.log('Failed to inject tx: ', err)
  }
})

dapp.registerExternalGet('account/:address', async (req, res) => {
  const address = req.params['address']
  let readableAccount = await getReadableAccountInfo(address)
  res.json({ account: readableAccount })
})

dapp.registerExternalGet('tx/:hash', async (req, res) => {
  const txHash = req.params['hash']
  if (!appliedTxs[txHash]) {
    return res.json({ tx: 'Not found' })
  }
  let appliedTx = appliedTxs[txHash]

  if (!appliedTx) return res.json({ tx: 'Not found' })

  let result = {
    transactionHash: appliedTx.txId,
    transactionIndex: '0x1',
    blockNumber: '0xb',
    blockHash: '',
    cumulativeGasUsed: bufferToHex(appliedTx.receipt.gasUsed),
    gasUsed: bufferToHex(appliedTx.receipt.gasUsed),
    logs: appliedTx.receipt.logs,
    contractAddress: bufferToHex(appliedTx.receipt.createdAddress),
    status: '0x1',
    detail: getReadableTransaction(appliedTx.injected)
  }
  res.json({ tx: result })
})

console.log('Registering accounts route')
dapp.registerExternalGet('accounts', async (req, res) => {
  console.log('/accounts')
  res.json({ accounts })
})

/**
 * interface tx {
 *   type: string
 *   from: string,
 *   to: string,
 *   amount: number,
 *   timestamp: number
 * }
 */
dapp.setup({
  validateTransaction (tx) {
    let txObj = getTransactionObj(tx)
    const response = {
      result: 'fail',
      reason: 'Transaction is not valid. Cannot get txObj.'
    }
    if (!txObj) return response

    try {
      let senderAddress = txObj.getSenderAddress()
      if (!senderAddress) {
        return {
          result: 'fail',
          reason: 'Cannot derive sender address from tx'
        }
      }
    } catch (e) {
      console.log('Validation error', e)
      response.result = 'fail'
      response.reason = e
      return response
    }
    // TODO: more validation here

    response.result = 'pass'
    response.reason = 'all_allowed'

    return response
  },
  validateTxnFields (tx) {
    // Validate tx fields here
    let success = true
    let reason = ''
    const txnTimestamp = tx.timestamp

    // TODO: validate more tx fields here

    return {
      success,
      reason,
      txnTimestamp
    }
  },
  async apply (tx, wrappedStates) {
    // Validate the tx
    const { result, reason } = this.validateTransaction(tx)
    if (result !== 'pass') {
      throw new Error(`invalid transaction, reason: ${reason}. tx: ${JSON.stringify(tx)}`)
    }

    const transaction = getTransactionObj(tx)
    const txId = bufferToHex(transaction.hash())
    // Create an applyResponse which will be used to tell Shardus that the tx has been applied
    const txTimestamp = Date.now()
    console.log('DBG', 'attempting to apply tx', txId, '...')
    const applyResponse = dapp.createApplyResponse(txId, txTimestamp)

    try {
      // Apply the tx
      console.time('evm_runtx')
      const Receipt = await EVM.runTx({ tx: transaction, skipNonce:true, skipBlockGasLimitValidation:true })
      console.timeEnd('evm_runtx')
      console.log('DBG', 'applied tx', txId, Receipt)
      appliedTxs[txId] = {
        txId,
        injected: tx,
        receipt: Receipt
      }
    } catch (e) {
      dapp.log('Unable to apply transaction', e)
      console.log('Unable to apply transaction', txId, e)
    }
    return applyResponse
  },
  getKeyFromTransaction (tx) {
    const transaction = getTransactionObj(tx)
    const result = {
      sourceKeys: [],
      targetKeys: [],
      allKeys: [],
      timestamp: tx.timestamp
    }
    try {
      let transformedSourceKey = transformAddress(transaction.getSenderAddress().toString())
      let transformedTargetKey = transformAddress(transaction.to.toString())
      result.sourceKeys.push(transformedSourceKey)
      if (transaction.to) result.targetKeys.push(transformedTargetKey)
      result.allKeys = result.allKeys.concat(result.sourceKeys, result.targetKeys)
      console.log('running getKeyFromTransaction', result)
    } catch (e) {
      console.log('Unable to get keys from tx')
    }
    return result
  },
  getStateId (accountAddress, mustExist = true) {
    let account = accounts[accountAddress]
    if (account && account.stateRoot) {
      return bufferToHex(account.stateRoot)
    } else {
      throw new Error('Could not get stateId for account ' + accountAddress)
    }
  },
  deleteLocalAccountData () {
    accounts = {}
  },
  setAccountData (accountRecords) {
    for (const account of accountRecords) {
      accounts[account.id] = account
    }
  },
  async getRelevantData (accountId, tx) {
    if (!tx.raw) throw new Error('getRelevantData: No raw tx')

    let account = accounts[accountId]
    let accountCreated = false

    // Create the account if it doesn't exist
    if (typeof account === 'undefined' || account === null) {
      account = await createAccount(accountId)
      accounts[accountId] = await getReadableAccountInfo(accountId)
      accountCreated = true
    }
    let readableAccount = await getReadableAccountInfo(accountId)
    // Wrap it for Shardus
    return dapp.createWrappedResponse(accountId, accountCreated, bufferToHex(account.stateRoot), account.timestamp, readableAccount)
  },
  getAccountData (accountStart, accountEnd, maxRecords) {
    const results = []
    const start = parseInt(accountStart, 16)
    const end = parseInt(accountEnd, 16)
    // Loop all accounts
    for (let addressStr in accounts) {
      let account = accounts[addressStr]
      // Skip if not in account id range
      const id = parseInt(addressStr, 16)
      if (id < start || id > end) continue

      // Add to results
      const wrapped = {
        accountId: addressStr,
        stateId: bufferToHex(account.stateRoot),
        data: account,
        timestamp: account.timestamp
      }
      results.push(wrapped)

      // Return results early if maxRecords reached
      if (results.length >= maxRecords) return results
    }
    return results
  },
  updateAccountFull (wrappedData, localCache, applyResponse) {
    const accountId = wrappedData.accountId
    const accountCreated = wrappedData.accountCreated
    const updatedAccount = wrappedData.data
    // Update hash
    const hashBefore = updatedAccount.hash
    const hashAfter = crypto.hashObj(updatedAccount || {})
    updatedAccount.hash = hashAfter
    // Save updatedAccount to db / persistent storage
    accounts[accountId] = updatedAccount
    // Add data to our required response object
    dapp.applyResponseAddState(applyResponse, updatedAccount, updatedAccount, accountId, applyResponse.txId, applyResponse.txTimestamp, hashBefore, hashAfter, accountCreated)
  },
  updateAccountPartial (wrappedData, localCache, applyResponse) {
    this.updateAccountFull(wrappedData, localCache, applyResponse)
  },
  getAccountDataByRange (accountStart, accountEnd, tsStart, tsEnd, maxRecords) {
    const results = []
    const start = parseInt(accountStart, 16)
    const end = parseInt(accountEnd, 16)
    // Loop all accounts
    for (let addressStr in accounts) {
      let account = accounts[addressStr]
      // Skip if not in account id range
      const id = parseInt(addressStr, 16)
      if (id < start || id > end) continue
      // Skip if not in timestamp range
      const timestamp = account.timestamp
      if (timestamp < tsStart || timestamp > tsEnd) continue
      // Add to results
      const wrapped = { accountId: addressStr, stateId: bufferToHex(account.stateRoot), data: account, timestamp: account.timestamp }
      results.push(wrapped)
      // Return results early if maxRecords reached
      if (results.length >= maxRecords) return results
    }
    return results
  },
  calculateAccountHash (account) {
    if (account.stateRoot) return bufferToHex(account.stateRoot)
    else {
      throw new Error('there is not account.stateRoot')
    }
  },
  resetAccountData (accountBackupCopies) {
    for (let recordData of accountBackupCopies) {
      // accounts[recordData.id] = recordData

      const account = {
        id: recordData.accountId,
        hash: recordData.hash,
        timestamp: recordData.timestamp,
        data: recordData.data.data
      }

      accounts[account.id] = account
    }
  },
  deleteAccountData (addressList) {
    for (const address of addressList) {
      delete accounts[address]
    }
  },
  getAccountDataByList (addressList) {
    const results = []
    for (const address of addressList) {
      const account = accounts[address]
      if (account) {
        const wrapped = {
          accountId: address,
          stateId: bufferToHex(account.stateRoot),
          data: account,
          timestamp: account.timestamp
        }
        results.push(wrapped)
      }
    }
    return results
  },
  getAccountDebugValue (wrappedAccount) {
    return `${stringify(wrappedAccount)}`
  },
  close () {
    console.log('Shutting down...')
  }
})

dapp.registerExceptionHandler()

dapp.start()
