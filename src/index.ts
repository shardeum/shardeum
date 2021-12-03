import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'
import stringify from 'fast-json-stable-stringify'
import * as crypto from 'shardus-crypto-utils'
import {Account, Address, BN, bufferToHex, toBuffer} from 'ethereumjs-util'

import {Transaction} from '@ethereumjs/tx';
import VM from '@ethereumjs/vm';
import { updateCommaList } from 'typescript'
import { parse as parseUrl } from 'url'
import got from 'got'

let {shardusFactory} = require('shardus-global-server')

crypto.init('64f152869ca2d473e4ba64ab53f49ccdb2edae22da192c126850970e788af347')

const overwriteMerge = (target, source, options) => source

let config = {server: {baseDir: './'}}

if (fs.existsSync(path.join(process.cwd(), 'config.json'))) {
  const fileConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')).toString())
  config = merge(config, fileConfig, {arrayMerge: overwriteMerge})
}

if (process.env.BASE_DIR) {
  let baseDir = process.env.BASE_DIR || '.'
  let baseDirFileConfig

  if (fs.existsSync(path.join(baseDir, 'config.json'))) {
    baseDirFileConfig = JSON.parse(fs.readFileSync(path.join(baseDir, 'config.json')).toString())
  }
  config = merge(config, baseDirFileConfig, {arrayMerge: overwriteMerge})
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
          nodesPerConsensus: 50
        }
      }
    },
    {arrayMerge: overwriteMerge}
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
    {arrayMerge: overwriteMerge}
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
    {arrayMerge: overwriteMerge}
  )
}

// Setting minNodesToAllowTxs to 1 allow single node networks
config = merge(config, {
  server: {
    p2p: {
      minNodesToAllowTxs: 1,
      minNodes: 50,
      maxNodes: 50,
    }
  }
})


config = merge(config, {
  server: {
    sharding: {
      nodesPerConsensusGroup: 50
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
        fakeNetworkDelay: 0,
        disableSnapshots: true,
        countEndpointStart: -1
      }
    }
  },
  {arrayMerge: overwriteMerge}
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


let accounts: WrappedEthAccounts = {}
let appliedTxs = {}
let EVM = new VM()

/**
 * After a Buffer goes through json stringify/parse it comes out broken
 *   maybe fix this in shardus-global-server.  for now use this safe function
 * @param buffer
 * @returns
 */
function safeBufferToHex(buffer) {
  if (buffer.data != null) {
    return bufferToHex(buffer.data)
  }
  return bufferToHex(buffer)
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}


/**
 * we need this for now because the stateRoot is a stable key into a trie
 * this is flawed though and not a good hash.  it does update though
 *    probably could use balance in the string and get a bit better.
 * @param wrappedEthAccount
 * @returns
 */
function hashFromNonceHack(wrappedEthAccount: WrappedEthAccount): string {
  //just a basic nonce to hash because it will take more work to extract the correct hash
  let hash = wrappedEthAccount.account.nonce.toString()
  hash = hash + '0'.repeat(64 - hash.length)
  return hash
}

function updateEthAccountHash(wrappedEthAccount: WrappedEthAccount) {
  //this doesnt work since state root is a stable ref to a key in the db
  //let hash = bufferToHex(wrappedEthAccount.account.stateRoot)

  //just a basic nonce to hash because it will take more work to extract the correct hash
  wrappedEthAccount.hash = hashFromNonceHack(wrappedEthAccount)
}

async function createAccount(addressStr): Promise<WrappedEthAccount> {
  console.log('Creating new account', addressStr)
  const accountAddress = Address.fromString(addressStr)
  const oneEth = new BN(10).pow(new BN(18))

  const acctData = {
    nonce: 0,
    balance: oneEth.mul(new BN(100)) // 100 eth
  }
  const account = Account.fromAccountData(acctData)
  await EVM.stateManager.putAccount(accountAddress, account)
  const updatedAccount = await EVM.stateManager.getAccount(accountAddress)

  let wrappedEthAccount = {timestamp: Date.now(), account: updatedAccount, ethAddress: addressStr, hash: ''}
  updateEthAccountHash(wrappedEthAccount)
  return wrappedEthAccount
}

function getTransactionObj(tx) {
  if (!tx.raw) return null
  try {
    const serializedInput = toBuffer(tx.raw)
    return Transaction.fromRlpSerializedTx(serializedInput)
  } catch (e) {
    console.log('Unable to get transaction obj', e)
  }
  return null
}

function getReadableTransaction(tx) {
  const transaction = getTransactionObj(tx)
  if (!transaction) return {error: 'not found'}
  return {
    from: transaction.getSenderAddress().toString(),
    to: transaction.to ? transaction.to.toString() : '',
    value: transaction.value.toString(),
    data: bufferToHex(transaction.data)
  }
}

async function getReadableAccountInfo(addressStr) {
  try {
    const address = Address.fromString(addressStr)
    const account = await EVM.stateManager.getAccount(address)
    return {
      nonce: account.nonce.toString(),
      balance: account.balance.toString(),
      stateRoot: bufferToHex(account.stateRoot),
      codeHash: bufferToHex(account.codeHash)
    }
  } catch (e) {
    console.log('Unable to get readable account', e)
  }
  return null
}

let useAddressConversion = true

function toShardusAddress(addressStr) {
  //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
  //    to this:665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  if (useAddressConversion)
    return addressStr.slice(2) + '0'.repeat(24)
  return addressStr
}

function fromShardusAddress(addressStr) {
  //change this:665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  //    to this:0x665eab3be2472e83e3100b4233952a16eed20c76
  if (useAddressConversion)
    return '0x' + addressStr.slice(0, 40)

  return addressStr
}


async function setupTester(ethAccountID: string) {

  //await sleep(4 * 60 * 1000) // wait 4 minutes to init account

  let shardusAccountID = toShardusAddress(ethAccountID)
  let newAccount = await createAccount(ethAccountID)
  console.log('Tester account created', newAccount)
  const address = Address.fromString(ethAccountID)
  let account = await EVM.stateManager.getAccount(address)

  let wrappedEthAccount = {timestamp: Date.now(), account, ethAddress: ethAccountID, hash: ''}
  updateEthAccountHash(wrappedEthAccount)
  accounts[shardusAccountID] = wrappedEthAccount
}

//setupTester("0x2041B9176A4839dAf7A4DcC6a97BA023953d9ad9")
//setupTester("0x54E1221e35CfA14e4190092870c92E88033728a3") //andrew

function _containsProtocol(url: string) {
  if (!url.match('https?://*')) return false
  return true
}

function _normalizeUrl(url: string) {
  let normalized = url
  if (!_containsProtocol(url)) normalized = 'http://' + url
  return normalized
}
async function _internalHackGet(url:string){
  let normalized = _normalizeUrl(url)
  let host = parseUrl(normalized, true)
  try{
    await got.get(host, {
      timeout: 1000,
      retry: 0,
      throwHttpErrors: false,
      //parseJson: (text:string)=>{},
      //json: false, // the whole reason for _internalHackGet was because we dont want the text response to mess things up
                   //  and as a debug non shipping endpoint did not want to add optional parameters to http module
    })
  } catch(e) {
  }
}

//?id=<accountID>
dapp.registerExternalGet('faucet-all', async (req, res) => {
  let id = req.query.id as string
  setupTester(id)
  try{
    let activeNodes = dapp.p2p.state.getNodes()
    if(activeNodes){
      for(let node of activeNodes.values()){
        _internalHackGet(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}`)
        res.write(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}\n`)
      }
    }
    res.write(`sending faucet request to all nodes\n`)
  } catch(e){
    res.write(`${e}\n`)
  }
  res.end()
})

dapp.registerExternalGet('faucet-one', async (req, res) => {
  let id = req.query.id as string
  setupTester(id)
  return res.json({ success: true})
})


dapp.registerExternalPost('inject', async (req, res) => {
  let tx = req.body
  console.log('Transaction injected:', new Date(), tx)
  try {
    const response = dapp.put(tx)
    res.json(response)
  } catch (err) {
    console.log('Failed to inject tx: ', err)
  }
})

dapp.registerExternalPost('faucet', async (req, res) => {
    // let tx = req.body
    // await setupTester(tx.address)
    // return res.json({ success: true})

    let tx = req.body
    let id = tx.address as string
    setupTester(id)
    try{
      let activeNodes = dapp.p2p.state.getNodes()
      if(activeNodes){
        for(let node of activeNodes.values()){
          _internalHackGet(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}`)
          res.write(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}\n`)
        }
      }
      res.write(`sending faucet request to all nodes\n`)
    } catch(e){
      res.write(`${e}\n`)
    }
    res.end()
})

dapp.registerExternalGet('account/:address', async (req, res) => {
  const address = req.params['address']
  let readableAccount = await getReadableAccountInfo(address)
  res.json({account: readableAccount})
})

dapp.registerExternalPost('contract/call', async (req, res) => {
  try {
    const callObj = req.body
    let opt = {
      to: Address.fromString(callObj.to),
      caller: Address.fromString(callObj.from),
      origin: Address.fromString(callObj.from), // The tx.origin is also the caller here
      data: toBuffer(callObj.data),
    }
    const callResult = await EVM.runCall(opt)

    if (callResult.execResult.exceptionError) {
      console.log('Execution Error:', callResult.execResult.exceptionError)
        console.log('Call Result', callResult.execResult.returnValue.toString('hex'))
      return res.json({result: null})
    }

    res.json({result: callResult.execResult.returnValue.toString('hex')})

  } catch (e) {
    console.log('Error', e)
    return res.json({result: null})
  }
})

dapp.registerExternalGet('tx/:hash', async (req, res) => {
  const txHash = req.params['hash']
  if (!appliedTxs[txHash]) {
    return res.json({tx: 'Not found'})
  }
  let appliedTx = appliedTxs[txHash]

  if (!appliedTx) return res.json({tx: 'Not found'})
    let detail = getReadableTransaction(appliedTx.injected)

  let result = {
    transactionHash: appliedTx.txId,
    transactionIndex: '0x1',
    blockNumber: '0xb',
      nonce: appliedTx.receipt.nonce,
    blockHash: '0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b',
    cumulativeGasUsed: bufferToHex(appliedTx.receipt.gasUsed),
    gasUsed: bufferToHex(appliedTx.receipt.gasUsed),
    logs: appliedTx.receipt.logs,
    contractAddress: bufferToHex(appliedTx.receipt.createdAddress),
    status: '0x1',
      ...detail,
  }
  res.json({tx: result})
})

dapp.registerExternalGet('accounts', async (req, res) => {
  console.log('/accounts')
  res.json({accounts})
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
  validateTransaction(tx) {
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
  validateTxnFields(tx) {
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
  async apply(tx, wrappedStates) {
    // Validate the tx
    const {result, reason} = this.validateTransaction(tx)
    if (result !== 'pass') {
      throw new Error(`invalid transaction, reason: ${reason}. tx: ${JSON.stringify(tx)}`)
    }

    const transaction = getTransactionObj(tx)
    const txId = bufferToHex(transaction.hash())
    // Create an applyResponse which will be used to tell Shardus that the tx has been applied
    console.log('DBG', new Date(), 'attempting to apply tx', txId, tx)
    const applyResponse = dapp.createApplyResponse(txId, tx.timestamp)

    try {
      // Apply the tx
      // const Receipt = await EVM.runTx({tx: transaction, skipNonce: true, skipBlockGasLimitValidation: true})
      const Receipt = await EVM.runTx({tx: transaction, skipNonce: true})

      console.log('DBG', 'applied tx', txId, Receipt)

      // store contract account
      if (Receipt.createdAddress) {
        let ethAccountID = Receipt.createdAddress.toString()
        let shardusAddress = toShardusAddress(ethAccountID)
        let contractAccount = await EVM.stateManager.getAccount(Receipt.createdAddress)
        let wrappedEthAccount = {timestamp: Date.now(), account: contractAccount, ethAddress: ethAccountID, hash: ''}

        updateEthAccountHash(wrappedEthAccount)

        accounts[shardusAddress] = wrappedEthAccount
        console.log('Contract account stored', accounts[shardusAddress])
      }
        appliedTxs[txId] = {
        txId,
        injected: tx,
        receipt: { ...Receipt, nonce: transaction.nonce.toString('hex') },
      }
    } catch (e) {
      dapp.log('Unable to apply transaction', e)
      console.log('Unable to apply transaction', txId, e)
    }
    return applyResponse
  },
  getKeyFromTransaction(tx) {
    const transaction = getTransactionObj(tx)
    const result = {
      sourceKeys: [],
      targetKeys: [],
      allKeys: [],
      timestamp: tx.timestamp
    }
    try {
      let transformedSourceKey = toShardusAddress(transaction.getSenderAddress().toString())
      let transformedTargetKey = transaction.to ? toShardusAddress(transaction.to.toString()) : ''
      result.sourceKeys.push(transformedSourceKey)
      if (transaction.to) result.targetKeys.push(transformedTargetKey)
      result.allKeys = result.allKeys.concat(result.sourceKeys, result.targetKeys)
      console.log('running getKeyFromTransaction', result)
    } catch (e) {
      console.log('Unable to get keys from tx', e)
    }
    return result
  },
  getStateId(accountAddress, mustExist = true) {
    let wrappedEthAccount = accounts[accountAddress]
    return hashFromNonceHack(wrappedEthAccount)

    // if (wrappedEthAccount && wrappedEthAccount.account.stateRoot) {
    //   return bufferToHex(wrappedEthAccount.account.stateRoot)
    // } else {
    //   throw new Error('Could not get stateId for account ' + accountAddress)
    // }
  },
  deleteLocalAccountData() {
    accounts = {}
  },

  setAccountData(accountRecords) {
    for (const account of accountRecords) {
      accounts[account.id] = account as WrappedEthAccount
    }
  },
  async getRelevantData(accountId, tx) {
    if (!tx.raw) throw new Error('getRelevantData: No raw tx')

    let ethAccountID = fromShardusAddress(accountId) // accountId is a shardus address
    let wrappedEthAccount = accounts[accountId]
    let accountCreated = false

    // Create the account if it doesn't exist
    if (typeof wrappedEthAccount === 'undefined' || wrappedEthAccount === null) {
      //some of this feels a bit redundant, will need to think more on the cleanup
      await createAccount(ethAccountID)

      const address = Address.fromString(ethAccountID)
      let account = await EVM.stateManager.getAccount(address)

      wrappedEthAccount = {timestamp: Date.now(), account, ethAddress: ethAccountID, hash: ''}
      updateEthAccountHash(wrappedEthAccount)

      accounts[accountId] = wrappedEthAccount
      accountCreated = true
    }
    // Wrap it for Shardus
    return dapp.createWrappedResponse(accountId, accountCreated, safeBufferToHex(wrappedEthAccount.account.stateRoot), wrappedEthAccount.timestamp, wrappedEthAccount)//readableAccount)
  },
  getAccountData(accountStart, accountEnd, maxRecords) {
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
  updateAccountFull(wrappedData, localCache, applyResponse) {
    const accountId = wrappedData.accountId
    const accountCreated = wrappedData.accountCreated
    const updatedAccount: WrappedEthAccount = wrappedData.data
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
  updateAccountPartial(wrappedData, localCache, applyResponse) {
    //I think we may need to utilize this so that shardus is not oblicated to make temporary copies of large CAs
    //
    this.updateAccountFull(wrappedData, localCache, applyResponse)
  },
  getAccountDataByRange(accountStart, accountEnd, tsStart, tsEnd, maxRecords) {
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
      const wrapped = {
        accountId: addressStr,
        stateId: safeBufferToHex(wrappedEthAccount.account.stateRoot),
        data: wrappedEthAccount.account,
        timestamp: wrappedEthAccount.timestamp
      }
      results.push(wrapped)
      // Return results early if maxRecords reached
      if (results.length >= maxRecords) return results
    }
    return results
  },
  calculateAccountHash(wrappedEthAccount: WrappedEthAccount) {

    return hashFromNonceHack(wrappedEthAccount)

    // if (wrappedEthAccount.account.stateRoot) return bufferToHex(wrappedEthAccount.account.stateRoot)
    // else {
    //   throw new Error('there is not account.stateRoot')
    // }
  },
  resetAccountData(accountBackupCopies) {
    for (let recordData of accountBackupCopies) {

      let wrappedEthAccount = recordData.data as WrappedEthAccount
      let shardusAddress = toShardusAddress(wrappedEthAccount.ethAddress)
      accounts[shardusAddress] = wrappedEthAccount
    }
  },
  deleteAccountData(addressList) {
    for (const address of addressList) {
      delete accounts[address]
    }
  },
  getAccountDataByList(addressList) {
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
  getAccountDebugValue(wrappedAccount) {
    return `${stringify(wrappedAccount)}`
  },
  close() {
    console.log('Shutting down...')
  }
})

dapp.registerExceptionHandler()

dapp.start()
