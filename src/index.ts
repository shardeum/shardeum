import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'
import stringify from 'fast-json-stable-stringify'
import * as crypto from 'shardus-crypto-utils'
import { add } from 'lodash'
let { shardusFactory } = require('shardus-global-server')

crypto.init('64f152869ca2d473e4ba64ab53f49ccdb2edae22da192c126850970e788af347')

import {
  Account,
  Address,
  BN,
  toBuffer,
  bufferToHex
} from 'ethereumjs-util'

import {Transaction, TxData} from '@ethereumjs/tx';
import VM from '@ethereumjs/vm';

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

/**
 * This is for phase 1, there is lots of data not actually held by Account
 * 
 */
interface WrappedEthAccount {
  ethAddress: string //account address in ethereum space. 
  account: Account //actual Eth account.  
  timestamp: number //account timestamp
  hash: string //account hash
}

interface WrappedEthAccounts {
  [id: string]: WrappedEthAccount
}


let accounts:WrappedEthAccounts = {}
let appliedTxs = {}
let EVM = new VM()

createAccount('0x2041B9176A4839dAf7A4DcC6a97BA023953d9ad9').then(result => {
  console.log('Tester account created', result)
}).catch(e => {
  console.log('Error while creating tester account')
})

/**
 * After a Buffer goes through json stringify/parse it comes out broken
 *   maybe fix this in shardus-global-server.  for now use this safe function
 * @param buffer 
 * @returns 
 */
function safeBufferToHex(buffer){
  if(buffer.data != null){
    return bufferToHex(buffer.data)
  }
  return bufferToHex(buffer)
}

/**
 * we need this for now because the stateRoot is a stable key into a trie
 * this is flawed though and not a good hash.  it does update though
 *    probably could use balance in the string and get a bit better.
 * @param wrappedEthAccount 
 * @returns 
 */
function hashFromNonceHack(wrappedEthAccount:WrappedEthAccount):string{
  //just a basic nonce to hash because it will take more work to extract the correct hash  
  let hash = wrappedEthAccount.account.nonce.toString()
  hash = hash + '0'.repeat(64 - hash.length)
  return hash
}

function updateEthAccountHash(wrappedEthAccount:WrappedEthAccount)
{
  //this doesnt work since state root is a stable ref to a key in the db
  //let hash = bufferToHex(wrappedEthAccount.account.stateRoot)

  //just a basic nonce to hash because it will take more work to extract the correct hash  
  let hash = hashFromNonceHack(wrappedEthAccount)

  wrappedEthAccount.hash = hash
}

async function createAccount (addressStr) : Promise<WrappedEthAccount> {
  const accountAddress = Address.fromString(addressStr)
  const oneEth = new BN(10).pow(new BN(18))

  const acctData = {
    nonce: 0,
    balance: oneEth.mul(new BN(100)) // 100 eth
  }
  const account = Account.fromAccountData(acctData)
  await EVM.stateManager.putAccount(accountAddress, account)
  const updatedAccount = await EVM.stateManager.getAccount(accountAddress)

  let wrappedEthAccount = {timestamp : Date.now(), account: updatedAccount, ethAddress: addressStr, hash:'' }
  updateEthAccountHash(wrappedEthAccount)
  return wrappedEthAccount
}

function getTransactionObj (tx) {
  if (!tx.raw) return null
  try {
    const serializedInput = toBuffer(tx.raw)
    return Transaction.fromRlpSerializedTx(serializedInput)
  } catch (e) {
    console.log('Unable to get transaction obj', e)
  }
  return null
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

//type EthAddress = string

let useAddressConversion = true

function toShardusAddress (addressStr) {
  //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
  //    to this:665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  if(useAddressConversion)
    return addressStr.slice(2)+'0'.repeat(24)

  return addressStr
}
function fromShardusAddress (addressStr) {
  //change this:665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  //    to this:0x665eab3be2472e83e3100b4233952a16eed20c76
  if(useAddressConversion)
    return '0x' + addressStr.slice(0,40)

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
      let transformedSourceKey = toShardusAddress(transaction.getSenderAddress().toString())
      let transformedTargetKey = toShardusAddress(transaction.to.toString())
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
    let wrappedEthAccount = accounts[accountAddress]

    let hash = hashFromNonceHack(wrappedEthAccount)
    return hash

    // if (wrappedEthAccount && wrappedEthAccount.account.stateRoot) {
    //   return bufferToHex(wrappedEthAccount.account.stateRoot)
    // } else {
    //   throw new Error('Could not get stateId for account ' + accountAddress)
    // }
  },
  deleteLocalAccountData () {
    accounts = {}
  },

  setAccountData (accountRecords) {
    for (const account of accountRecords) {
      accounts[account.id] = account as WrappedEthAccount
    }
  },
  async getRelevantData (accountId, tx) {
    if (!tx.raw) throw new Error('getRelevantData: No raw tx')
  
    let ethAccountID = fromShardusAddress(accountId)
    let wrappedEthAccount = accounts[accountId]
    let accountCreated = false

    // Create the account if it doesn't exist
    if (typeof wrappedEthAccount === 'undefined' || wrappedEthAccount === null) {
      //some of this feels a bit redundant, will need to think more on the cleanup
      let account1 = await createAccount(ethAccountID)
      // let updatedAccount = await getReadableAccountInfo(ethAccountID)

      const address = Address.fromString(ethAccountID)
      let account = await EVM.stateManager.getAccount(address)

      wrappedEthAccount = {timestamp : Date.now(), account, ethAddress: ethAccountID, hash:'' }
      updateEthAccountHash(wrappedEthAccount)

      accounts[accountId] = wrappedEthAccount
      accountCreated = true
    }
    // Wrap it for Shardus
    return dapp.createWrappedResponse(accountId, accountCreated, safeBufferToHex(wrappedEthAccount.account.stateRoot), wrappedEthAccount.timestamp, wrappedEthAccount)//readableAccount)
  },
  getAccountData (accountStart, accountEnd, maxRecords) {
    const results = []
    const start = parseInt(accountStart, 16)
    const end = parseInt(accountEnd, 16)
    // Loop all accounts
    for (let addressStr in accounts) {
      let wrappedEthAccount = accounts[addressStr]
      // Skip if not in account id range
      const id = parseInt(addressStr, 16)
      if (id < start || id > end) continue

      // Add to results (wrapping is redundant?)
      const wrapped = {
        accountId: addressStr,
        stateId: safeBufferToHex(wrappedEthAccount.account.stateRoot), //todo decide on if we use eth hash or our own hash..
        data: wrappedEthAccount.account,
        timestamp: wrappedEthAccount.timestamp
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
    const updatedAccount:WrappedEthAccount = wrappedData.data
    // Update hash.   currently letting the hash be controlled by the EVM.  
    //                not sure if we want to hash the WrappedEthAccount instead, but probably not
    // const hashBefore = updatedAccount.hash
    // const hashAfter = crypto.hashObj(updatedAccount || {})
    // updatedAccount.hash = hashAfter

    let hashBefore = updatedAccount.hash
    updateEthAccountHash(updatedAccount)
    let hashAfter = updatedAccount.hash

    // Save updatedAccount to db / persistent storage
    accounts[accountId] = updatedAccount //this isn't doing much, and will get reworked when we have a custom EVM:statemanager

    // Add data to our required response object
    dapp.applyResponseAddState(applyResponse, updatedAccount, updatedAccount, accountId, applyResponse.txId, applyResponse.txTimestamp, hashBefore, hashAfter, accountCreated)
  },
  updateAccountPartial (wrappedData, localCache, applyResponse) {
    //I think we may need to utilize this so that shardus is not oblicated to make temporary copies of large CAs
    //
    this.updateAccountFull(wrappedData, localCache, applyResponse)
  },
  getAccountDataByRange (accountStart, accountEnd, tsStart, tsEnd, maxRecords) {
    const results = []
    const start = parseInt(accountStart, 16)
    const end = parseInt(accountEnd, 16)
    // Loop all accounts
    for (let addressStr in accounts) {
      let wrappedEthAccount = accounts[addressStr]
      // Skip if not in account id range
      const id = parseInt(addressStr, 16)
      if (id < start || id > end) continue
      // Skip if not in timestamp range
      const timestamp = wrappedEthAccount.timestamp
      if (timestamp < tsStart || timestamp > tsEnd) continue
      // Add to results
      const wrapped = { accountId: addressStr, stateId: safeBufferToHex(wrappedEthAccount.account.stateRoot), data: wrappedEthAccount.account, timestamp: wrappedEthAccount.timestamp }
      results.push(wrapped)
      // Return results early if maxRecords reached
      if (results.length >= maxRecords) return results
    }
    return results
  },
  calculateAccountHash (wrappedEthAccount:WrappedEthAccount) {

    let hash = hashFromNonceHack(wrappedEthAccount)
    return hash

    // if (wrappedEthAccount.account.stateRoot) return bufferToHex(wrappedEthAccount.account.stateRoot)
    // else {
    //   throw new Error('there is not account.stateRoot')
    // }
  },
  resetAccountData (accountBackupCopies) {
    for (let recordData of accountBackupCopies) {

      let wrappedEthAccount = recordData.data as WrappedEthAccount
      let shardusAddress = toShardusAddress(wrappedEthAccount.ethAddress)
      accounts[shardusAddress] = wrappedEthAccount
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
      const wrappedEthAccount = accounts[address]
      if (wrappedEthAccount) {
        const wrapped = {
          accountId: address,
          stateId: bufferToHex(wrappedEthAccount.account.stateRoot),
          data: wrappedEthAccount.account,
          timestamp: wrappedEthAccount.timestamp //todo, timestamp?
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
