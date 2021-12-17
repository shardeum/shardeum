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
import {ShardiumState, TransactionState } from './state'
import { ShardusTypes } from 'shardus-global-server'

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

const shardus = shardusFactory(config)

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

enum AccountType {
  Account, // Should/can we specify EOA vs CA?
  CA_KVP,  // Contract account key value pair
  ContractCode, // Contract code bytes
  Reciept, //This holds logs for a TX
}

/**
 * Still working out the details here.
 * This has become a variant data type now that can hold an EVM account or a key value pair from CA storage
 * I think that is the shortest path for now to get syncing and repair functionality working
 *
 * Long term I am not certain if we will be able to hold these in memory.  They may have to be a temporary thing
 * that is held in memory for awhile but eventually cleared.  This would mean that we have to be able to pull these
 * from disk again, and that could be a bit tricky.
 */
interface WrappedEVMAccount {
  accountType: AccountType 

  ethAddress: string //account address in EVM space.
  hash: string //account hash

  timestamp: number //account timestamp.  last time a TX changed it

  // Here is the EVM variant data.  An account:
  account?: Account //actual EVM account. if this is type Account
  // <or> this:
  key?: string   //EVM CA storage key
  value?: string //EVM buffer value if this is of type CA_KVP
}

interface WrappedEthAccounts {
  [id: string]: WrappedEVMAccount
}


let accounts: WrappedEthAccounts = {}
let appliedTxs = {}

let shardiumStateManager = new ShardiumState() //as StateManager
let EVM = new VM({ stateManager:shardiumStateManager })

let transactionStateMap = new Map<string, TransactionState>()


/**
 * This callback is called when the EVM tries to get an account it does not exist in trie storage or TransactionState
 * We need to build a blob of first read accounts and call SGS so that it can jump the EVM execution to the correct shard
 * @param linkedTX 
 * @param address 
 */
async function storageMiss(transactionState: TransactionState, address: string) : Promise<boolean> {

  //Get the first read version of data that we have collected so far
  let transferBlob = transactionState.getTransferBlob()
  let txID = transactionState.linkedTX

  // TODO implment this in shardus global server.  It will send the read accounts and TX info to 
  // to a remote shard so that we can restart the EVM
  //shardus.jumpToAccount(txID, address, transferBlob )

  //throw new Error('this should only happen in a multi sharded environment')

  let isRemoteShard = false
  return isRemoteShard
}

/**
 * This callback is called when the EVM tries to get an CA KVP it does not exist in trie storage or TransactionState
 * We need to build a blob of first read accounts and call SGS so that it can jump the EVM execution to the correct shard
 * @param linkedTX 
 * @param address 
 * @param key 
 */
async function contractStorageMiss(transactionState: TransactionState, address: string, key: string) : Promise<boolean> {

  //Get the first read version of data that we have collected so far
  let transferBlob = transactionState.getTransferBlob()
  let txID = transactionState.linkedTX

  // TODO implment this in shardus global server.  It will send the read accounts and TX info to 
  // to a remote shard so that we can restart the EVM
  //shardus.jumpToAccount(txID, address, transferBlob )

  // depending on how thing work out we may also want to jump to 
  //shardus.jumpToContractStorage(txID, address, transferBlob )
  
  //throw new Error('this should only happen in a multi sharded environment')

  let isRemoteShard = false
  return isRemoteShard
}

/**
 * This callback is called so that we can notify shardus global server that the TX needs to access
 * an account.  If the shardus queueEntry has not involved the account yet there is a chance the call
 * will fail in a way that we need to bubble an Error to halt the evm and fail the TX
 * @param linkedTX 
 * @param address 
 * @param isRead 
 * @returns 
 */
function accountInvolved(transactionState: TransactionState, address: string, isRead: boolean) : boolean {
  //TODO: this will call into shardus global and make sure this TX can continue execution given 
  // that we may need to invove an additional account

  let txID = transactionState.linkedTX

  //TODO implment this shardus function.
  //shardus.accountInvolved(txID, address, isRead)

  return true
}

/**
 * This callback is called so that we can notify shardus global server that the TX needs to access
 * an account.  If the shardus queueEntry has not involved the account yet there is a chance the call
 * will fail in a way that we need to bubble an Error to halt the evm and fail the TX
 * @param linkedTX 
 * @param address 
 * @param key 
 * @param isRead 
 * @returns 
 */
function contractStorageInvolved(transactionState: TransactionState, address: string, key: string, isRead: boolean) : boolean {
  //TODO: this will call into shardus global and make sure this TX can continue execution given 
  // that we may need to invove an additional key

  let txID = transactionState.linkedTX

  //TODO implment this shardus function.
  //shardus.accountInvolved(txID, address, isRead)

  return true
}


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
function hashFromNonceHack(wrappedEthAccount: WrappedEVMAccount): string {
  //just a basic nonce to hash because it will take more work to extract the correct hash
  let hash = wrappedEthAccount.account.nonce.toString()
  hash = hash + '0'.repeat(64 - hash.length)
  return hash
}

function updateEthAccountHash(wrappedEthAccount: WrappedEVMAccount) {
  //this doesnt work since state root is a stable ref to a key in the db
  //let hash = bufferToHex(wrappedEthAccount.account.stateRoot)

  //just a basic nonce to hash because it will take more work to extract the correct hash
  wrappedEthAccount.hash = hashFromNonceHack(wrappedEthAccount)
}

async function createAccount(addressStr): Promise<WrappedEVMAccount> {
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

  let wrappedEthAccount = {timestamp: Date.now(), account: updatedAccount, ethAddress: addressStr, hash: '', accountType: AccountType.Account}
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

  //change contract account :0x665eab3be2472e83e3100b4233952a16eed20c76
  //         contract key   :0x0b4233952a16eed20c76665eab3be2472e83e310
  //                 to this:665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  //                                                 0b4233952a16eed20c76665eab3be2472e83e310
  //                           665eab3be2472e83e3100b


async function setupTester(ethAccountID: string) {

  //await sleep(4 * 60 * 1000) // wait 4 minutes to init account

  let shardusAccountID = toShardusAddress(ethAccountID)
  let newAccount = await createAccount(ethAccountID)
  console.log('Tester account created', newAccount)
  const address = Address.fromString(ethAccountID)
  let account = await EVM.stateManager.getAccount(address)

  let wrappedEthAccount = {timestamp: Date.now(), account, ethAddress: ethAccountID, hash: '', accountType: AccountType.Account}
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
shardus.registerExternalGet('faucet-all', async (req, res) => {
  let id = req.query.id as string
  setupTester(id)
  try{
    let activeNodes = shardus.p2p.state.getNodes()
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

shardus.registerExternalGet('faucet-one', async (req, res) => {
  let id = req.query.id as string
  setupTester(id)
  return res.json({ success: true})
})


shardus.registerExternalPost('inject', async (req, res) => {
  let tx = req.body
  console.log('Transaction injected:', new Date(), tx)
  try {
    const response = shardus.put(tx)
    res.json(response)
  } catch (err) {
    console.log('Failed to inject tx: ', err)
  }
})

shardus.registerExternalPost('faucet', async (req, res) => {
    // let tx = req.body
    // await setupTester(tx.address)
    // return res.json({ success: true})

    let tx = req.body
    let id = tx.address as string
    setupTester(id)
    try{
      let activeNodes = shardus.p2p.state.getNodes()
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

shardus.registerExternalGet('account/:address', async (req, res) => {
  const address = req.params['address']
  let readableAccount = await getReadableAccountInfo(address)
  res.json({account: readableAccount})
})

shardus.registerExternalPost('contract/call', async (req, res) => {
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

shardus.registerExternalGet('tx/:hash', async (req, res) => {
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

shardus.registerExternalGet('accounts', async (req, res) => {
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
shardus.setup({
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
    const applyResponse = shardus.createApplyResponse(txId, tx.timestamp)

    //Now we need to get a transaction state object.  For single sharded networks this will be a new object.
    //When we have multiple shards we could have some blob data that wrapped up read accounts.  We will read these accounts
    //Into the the transaction state init at some point (possibly not here).  This will allow the EVM to run and not have 
    //A storage miss for accounts that were read on previous shard attempts to exectute this TX
    let transactionState = transactionStateMap.get(txId)
    if(transactionState == null){
      transactionState = new TransactionState()
      transactionState.initData(shardiumStateManager, {storageMiss, contractStorageMiss, accountInvolved, contractStorageInvolved}, txId, undefined, undefined)
      transactionStateMap.set(txId, transactionState)
    } else {
      //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change 
      //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
    }

    //ah shoot this binding will not be "thread safe" may need to make it part of the EEI for this tx? idk.
    shardiumStateManager.setTransactionState(transactionState)

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
        let wrappedEthAccount = {timestamp: Date.now(), account: contractAccount, ethAddress: ethAccountID, hash: '', accountType: AccountType.Account}

        updateEthAccountHash(wrappedEthAccount)

        accounts[shardusAddress] = wrappedEthAccount
        console.log('Contract account stored', accounts[shardusAddress])
      }
        appliedTxs[txId] = {
        txId,
        injected: tx,
        receipt: { ...Receipt, nonce: transaction.nonce.toString('hex') },
      }

      //get a list of accounts or CA keys that have been written to
      //This is important because the EVM could change many accounts or keys that we are not aware of
      //the transactionState is what accumulates the writes that we need
      let {accounts:accountWrites, kvPairs:kvPairWrites } = transactionState.getWrittenAccounts()
      
      //wrap these accounts and keys up and add them to the applyResponse as additional involved accounts
      for(let account of accountWrites){

        //1. wrap and save/update this to shardium accounts[] map

        //2.
        //Attach the written account data to the apply response.  This will allow it to be shared with other shards if needed.
        //Also wi
        //shardus.applyResponseAddChangedAccount(applyResponse, accountId, accountObject ) //account value would be the EVM account object 
      }
      for(let kvPair of kvPairWrites){
        //1. wrap and save/update this to shardium accounts[] map

        //2.
        //shardus.applyResponseAddChangedAccount(applyResponse, accountId, accountValue ) //account value would be the EVM account object 
        // <or> possibly:
        //shardus.applyResponseAddChangedKeyedAccount(applyResponse, accountId, key, accountValue ) //in this case account value would be the hex string of the value buffer
      }

    } catch (e) {

      //TODO need to detect if an execption here is a result of jumping the TX to another thread!
      // shardus must be made to handle that

      shardus.log('Unable to apply transaction', e)
      console.log('Unable to apply transaction', txId, e)
    }



    shardiumStateManager.unsetTransactionState()

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
      let wrappedEVMAccount = account as WrappedEVMAccount
      accounts[account.id] = wrappedEVMAccount
    }

    // update shardium state. put this in a separate loop, but maybe that is overkill
    // I was thinking we could checkpoint and commit the changes on the outer loop,
    // but now I am not so sure that is safe, and best case may need a mutex
    // I am not even 100% that we can go without a mutex even one account at time, here or in other spots
    // where we commit data to tries.  I wouldn't want the awaited code to interleave in a bad way
    for (const account of accountRecords) {

      let wrappedEVMAccount = account as WrappedEVMAccount
      accounts[account.id] = wrappedEVMAccount


      // hmm this is not awaited yet! needs changes to shardus global server.
      if(wrappedEVMAccount.accountType === AccountType.Account){
        let addressString = wrappedEVMAccount.ethAddress
        let evmAccount = wrappedEVMAccount.account

        shardiumStateManager.setAccountExternal(addressString, evmAccount)

      } else if(wrappedEVMAccount.accountType === AccountType.CA_KVP){

        let addressString = wrappedEVMAccount.ethAddress
        let keyString = wrappedEVMAccount.key
        let bufferStr = wrappedEVMAccount.value

        shardiumStateManager.setContractAccountKeyValueExternal(addressString, keyString, bufferStr)
      }

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

      wrappedEthAccount = {timestamp: Date.now(), account, ethAddress: ethAccountID, hash: '', accountType: AccountType.Account}
      updateEthAccountHash(wrappedEthAccount)

      accounts[accountId] = wrappedEthAccount
      accountCreated = true
    }
    // Wrap it for Shardus
    return shardus.createWrappedResponse(accountId, accountCreated, safeBufferToHex(wrappedEthAccount.account.stateRoot), wrappedEthAccount.timestamp, wrappedEthAccount)//readableAccount)
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
  updateAccountFull(wrappedData, localCache, applyResponse: ShardusTypes.ApplyResponse) {
    const accountId = wrappedData.accountId
    const accountCreated = wrappedData.accountCreated
    const updatedAccount: WrappedEVMAccount = wrappedData.data
    // Update hash.   currently letting the hash be controlled by the EVM.
    //                not sure if we want to hash the WrappedEthAccount instead, but probably not
    // const hashBefore = updatedAccount.hash
    // const hashAfter = crypto.hashObj(updatedAccount || {})
    // updatedAccount.hash = hashAfter

    // oof, we dont have the TXID!!!
    let txId = applyResponse?.txId
    let transactionState = transactionStateMap.get(txId)
    if(transactionState == null){
      transactionState = new TransactionState()
      transactionState.initData(shardiumStateManager, {storageMiss, contractStorageMiss, accountInvolved, contractStorageInvolved}, txId, undefined, undefined)
      transactionStateMap.set(txId, transactionState)
    } else {
      //TODO possibly need a blob to re-init with?
    }

    if(updatedAccount.accountType === AccountType.Account){
      //if account?
      let addressStr = updatedAccount.ethAddress
      let ethAccount = updatedAccount.account
      transactionState.commitAccount(addressStr, ethAccount) //yikes this wants an await.      
    } else if(updatedAccount.accountType === AccountType.CA_KVP) {
      //if ContractAccount?

      let addressStr = updatedAccount.ethAddress
      let key = updatedAccount.key
      let bufferStr = updatedAccount.value
      transactionState.commitContractStorage(addressStr, key, bufferStr )      
    }

    let hashBefore = updatedAccount.hash
    updateEthAccountHash(updatedAccount)
    let hashAfter = updatedAccount.hash

    // Save updatedAccount to db / persistent storage
    accounts[accountId] = updatedAccount

    // Add data to our required response object
    shardus.applyResponseAddState(applyResponse, updatedAccount, updatedAccount, accountId, applyResponse.txId, applyResponse.txTimestamp, hashBefore, hashAfter, accountCreated)
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
  calculateAccountHash(wrappedEthAccount: WrappedEVMAccount) {

    return hashFromNonceHack(wrappedEthAccount)

    // if (wrappedEthAccount.account.stateRoot) return bufferToHex(wrappedEthAccount.account.stateRoot)
    // else {
    //   throw new Error('there is not account.stateRoot')
    // }
  },
  resetAccountData(accountBackupCopies) {
    for (let recordData of accountBackupCopies) {

      let wrappedEthAccount = recordData.data as WrappedEVMAccount
      let shardusAddress = toShardusAddress(wrappedEthAccount.ethAddress)
      accounts[shardusAddress] = wrappedEthAccount

      //TODO need to also update shardiumState! probably can do that in a batch outside of this loop
      // a wrappedEVMAccount could be an EVM Account or a CA key value pair
      // maybe could just refactor the loop in setAccountData??
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

shardus.registerExceptionHandler()

shardus.start()
