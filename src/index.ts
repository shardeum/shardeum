import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'
import stringify from 'fast-json-stable-stringify'
import * as crypto from 'shardus-crypto-utils'
import {Account, Address, BN, bufferToHex, toBuffer} from 'ethereumjs-util'

import {Transaction} from '@ethereumjs/tx';
import VM from '@ethereumjs/vm';
import {parse as parseUrl} from 'url'
import got from 'got'
import {ShardiumState, TransactionState} from './state'
import {Shardus, ShardusTypes} from 'shardus-global-server'
import {TxReceipt} from "@ethereumjs/vm/dist/types";
import {ContractByteWrite} from "./state/transactionState";

let {shardusFactory} = require('shardus-global-server')

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

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
        startInFatalsLogMode: false, //true setting good for big aws test with nodes joining under stress.
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
  Account, //  EOA or CA
  ContractStorage,  // Contract storage key value pair
  ContractCode, // Contract code bytes
  Receipt, //This holds logs for a TX
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
  value?: Buffer //EVM buffer value if this is of type CA_KVP

  //What to store for ContractCode?
  codeHash?: Buffer
  codeByte?: Buffer
  contractAddress?: string

  //What to store for Reciept?  .. doesn't look like runTX really does much with them.  runBlock seem to do more.
  //the returned receipt from runTX is seems downcasted, because it actual has more fields than expected.
  //research question..  does the RPC server have any logs checking endpoints..
  //doesnt seem like it on a quick search.
  //It does have a hardcoded logsBloom so maybe we need to fill this with correct data.
  receipt?: TxReceipt
  txId?: string
}

interface WrappedEthAccounts {
  [id: string]: WrappedEVMAccount
}


let accounts: WrappedEthAccounts = {}
let appliedTxs = {}
let shardusTxIdToEthTxId = {}

let temporaryParallelOldMode = false // Set of temporary hacks that allow running ShardiumState with some old logic.
//  Usefull to keep
// our tests running while in development and have a way to check for issues early on

let shardiumStateManager = new ShardiumState() //as StateManager
shardiumStateManager.temporaryParallelOldMode = temporaryParallelOldMode

let EVM = new VM({stateManager: shardiumStateManager})

let transactionStateMap = new Map<string, TransactionState>()


/**
 * This callback is called when the EVM tries to get an account it does not exist in trie storage or TransactionState
 * We need to build a blob of first read accounts and call SGS so that it can jump the EVM execution to the correct shard
 * @param linkedTX
 * @param address
 */
async function accountMiss(transactionState: TransactionState, address: string): Promise<boolean> {

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
async function contractStorageMiss(transactionState: TransactionState, address: string, key: string): Promise<boolean> {

  //Get the first read version of data that we have collected so far
  let transferBlob = transactionState.getTransferBlob()
  let txID = transactionState.linkedTX

  //NOTE  We do not need this for the january milestone!


  //let isRemote = shardus.isRemoteShard(address)
  // if(isRemote === false){
  //   return false
  // }

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
function accountInvolved(transactionState: TransactionState, address: string, isRead: boolean): boolean {
  //TODO: this will call into shardus global and make sure this TX can continue execution given
  // that we may need to invove an additional account

  let txID = transactionState.linkedTX


  //Need to translate address to a shardus-global-server space address!
  // let shardusAddress = toShardusAddress(address, AccountType.Account)

  //TODO implement this shardus function.
  // shardus.accountInvolved will look at the TXID to find the correct queue entry
  //  then it will see if the queueEntry already knows of this account
  //    if it has not seen this account it will test if we can add this account to the queue entry
  //      The test for this is to see if the involved account has a newer cache timestamp than this TXid
  //        If it fails the test we need to return a faliure code or assert
  //See documentation for details
  if(shardus.tryInvolveAccount != null){
    let shardusAddress = toShardusAddress( address, AccountType.Account )

    let success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
    if(success === false){
      // transactionState will throw an error and halt the evm
      return false
    }
  }

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
function contractStorageInvolved(transactionState: TransactionState, address: string, key: string, isRead: boolean): boolean {
  //TODO: this will call into shardus global and make sure this TX can continue execution given
  // that we may need to invove an additional key

  let txID = transactionState.linkedTX

  //Need to translate key (or a combination of hashing address+key) to a shardus-global-server space address!

  //TODO implement this shardus function.
  //See documentation for details
  //Note we will have 3-4 different account types where accountInvolved gets called (depending on how we handle Receipts),
  // but they will all call the same shardus.accountInvolved() and shardus will not know of the different account types
  if(shardus.tryInvolveAccount != null){
    let shardusAddress = toShardusAddress( key, AccountType.ContractStorage )

    let success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
    if(success === false){
      // transactionState will throw an error and halt the evm
      return false
    }

  }

  return true
}


/**
 * fake callbacks so that the debug transactionState object can work with creating test accounts
 * Probably not a good thing to have long term.
 */
async function accountMissHack(transactionState: TransactionState, address: string): Promise<boolean> {
  let isRemoteShard = false
  return isRemoteShard
}
async function contractStorageMissHack(transactionState: TransactionState, address: string, key: string): Promise<boolean> {
  let isRemoteShard = false
  return isRemoteShard
}
function accountInvolvedHack(transactionState: TransactionState, address: string, isRead: boolean): boolean {
  return true
}
function contractStorageInvolvedHack(transactionState: TransactionState, address: string, key: string, isRead: boolean): boolean {
  return true
}

//TODO:
//function contractBytesInvolved()

//TODO:
//function receiptInvolved()   (this will not get called by transactionState, it will get called at the end of Apply when we loop an add receipts as account types)


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
  let hash

  // temporary hack for generating hash
  if (wrappedEthAccount.accountType === AccountType.Account){
     // parse to number first since some nonces have leading zeroes
     hash = Number(wrappedEthAccount.account.nonce).toString()
  }
  else if (wrappedEthAccount.accountType === AccountType.ContractStorage) hash = crypto.hashObj({key: wrappedEthAccount.key, value: wrappedEthAccount.value})
  else if (wrappedEthAccount.accountType === AccountType.ContractCode) hash = crypto.hashObj({key: wrappedEthAccount.codeHash, value: wrappedEthAccount.codeByte})
  else if (wrappedEthAccount.accountType === AccountType.Receipt) hash = crypto.hashObj({key: wrappedEthAccount.txId, value: wrappedEthAccount.receipt})

  hash = hash + '0'.repeat(64 - hash.length)
  return hash
}

function updateEthAccountHash(wrappedEthAccount: WrappedEVMAccount) {

  wrappedEthAccount.hash = _calculateAccountHash(wrappedEthAccount)
}


function _calculateAccountHash(wrappedEthAccount: WrappedEVMAccount) {

  return hashFromNonceHack(wrappedEthAccount)

  //for accounts maybe:
  //safeBufferToHex(wrappedEVMAccount.account.stateRoot), //todo decide on if we use eth hash or our own hash..
  // safeBufferToHex(wrappedEthAccount.account.stateRoot), //todo decide on if we use eth hash or our own hash..


  // if (wrappedEthAccount.account.stateRoot) return bufferToHex(wrappedEthAccount.account.stateRoot)
  // else {
  //   throw new Error('there is not account.stateRoot')
  // }
}

function _shardusWrappedAccount(wrappedEthAccount: WrappedEVMAccount) : ShardusTypes.WrappedData {

  const wrappedChangedAccount = {
    accountId: getAccountShardusAddress(wrappedEthAccount),
    stateId: _calculateAccountHash(wrappedEthAccount),
    data: wrappedEthAccount,
    timestamp: wrappedEthAccount.timestamp
  }

  return wrappedChangedAccount
}


async function createAccount(addressStr, transactionState:TransactionState): Promise<WrappedEVMAccount> {
  console.log('Creating new account', addressStr)
  const accountAddress = Address.fromString(addressStr)
  const oneEth = new BN(10).pow(new BN(18))

  const acctData = {
    nonce: 0,
    balance: oneEth.mul(new BN(100)) // 100 eth
  }

  //I think this will have to change in the future!
  shardiumStateManager.setTransactionState(transactionState)

  const account = Account.fromAccountData(acctData)
  await EVM.stateManager.putAccount(accountAddress, account)
  const updatedAccount = await EVM.stateManager.getAccount(accountAddress)

  let wrappedEthAccount = {
    timestamp: Date.now(),
    account: updatedAccount,
    ethAddress: addressStr,
    hash: '',
    accountType: AccountType.Account
  }
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

async function getReadableAccountInfo(addressStr, accountType = 0) {
  try {
    const account: WrappedEVMAccount = accounts[toShardusAddress(addressStr, accountType)]
    return {
      nonce: account.account.nonce.toString(),
      balance: account.account.balance.toString(),
      stateRoot: bufferToHex(account.account.stateRoot),
      codeHash: bufferToHex(account.account.codeHash)
    }
  } catch (e) {
    console.log('Unable to get readable account', e)
  }
  return null
}

let useAddressConversion = true


/**
 * This will correctly get a shardus address from a WrappedEVMAccount account no matter what type it is.
 * This is preferred over toShardusAddress in any case where we have an WrappedEVMAccount
 * @param wrappedEthAccount
 * @returns 
 */
function getAccountShardusAddress(wrappedEthAccount: WrappedEVMAccount) : string {
  let addressSource = wrappedEthAccount.ethAddress

  if(wrappedEthAccount.accountType === AccountType.ContractStorage){
    addressSource = wrappedEthAccount.key
  }
  let shardusAddress = toShardusAddress(addressSource, wrappedEthAccount.accountType)
  return shardusAddress
}

function toShardusAddress(addressStr, accountType: AccountType) {
  if (useAddressConversion != true) {
    return addressStr.toLowerCase()
  }
  if (accountType === AccountType.Account) {
    if (addressStr.length != 42) {
      throw new Error('must pass in a 42 character hex address for Account type.')
    }
    //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
    //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
    return addressStr.slice(2).toLowerCase() + '0'.repeat(24)
  }

  if (addressStr.length === 64) {
    //unexpected case but lets allow it
    return addressStr.toLowerCase()
  }

  if (addressStr.length != 66) {
    throw new Error(`must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length }`)
  }

  //so far rest of the accounts are just using the 32 byte eth address for a shardus address minus the "0x"
  //  later this will change so we can keep certain accounts close to their "parents"

  //change this:0x665eab3be2472e83e3100b4233952a16eed20c76111111111111111111111111
  //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  return addressStr.slice(2).toLowerCase()
}

function fromShardusAddress(addressStr, accountType:AccountType) {
  if (useAddressConversion != true){
    return addressStr.toLowerCase()
  }
  if(accountType === AccountType.Account){
    //change this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
    //    to this:0x665eab3be2472e83e3100b4233952a16eed20c76
    return '0x' + addressStr.slice(0, 40).toLowerCase()

  }
  //so far rest of the accounts are just using the 32 byte eth address for a shardus address minus the "0x"
  //  later this will change so we can keep certain accounts close to their "parents"

  //change this:  665eab3be2472e83e3100b4233952a16eed20c76111111111111111111111111
  //    to this:0x665eab3be2472e83e3100b4233952a16eed20c76111111111111111111111111
  return '0x' + addressStr.toLowerCase()
}



//   so far not going to do this just yet:
//change contract account :0x665eab3be2472e83e3100b4233952a16eed20c76
//         contract key   :0x0b4233952a16eed20c76665eab3be2472e83e310
//                 to this:665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
//                                                 0b4233952a16eed20c76665eab3be2472e83e310
//                           665eab3be2472e83e3100b

function getDebugTXState():TransactionState{
  let txId = '0'.repeat(64)
  console.log('Creating a debug tx state for ', txId)
  let transactionState = transactionStateMap.get(txId)
  if (transactionState == null) {
    transactionState = new TransactionState()
    transactionState.initData(shardiumStateManager, {
      //dont define callbacks for db TX state!
      storageMiss: accountMissHack,
      contractStorageMiss: contractStorageMissHack,
      accountInvolved: accountInvolvedHack,
      contractStorageInvolved: contractStorageInvolvedHack
    }, txId, undefined, undefined)
    transactionStateMap.set(txId, transactionState)
  } else {
    //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
    //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
    console.log('Resetting debug transaction state for txId', txId)
    transactionState.resetTransactionState()
  }
  return transactionState
}


async function setupTester(ethAccountID: string) {

  //await sleep(4 * 60 * 1000) // wait 4 minutes to init account

  let shardusAccountID = toShardusAddress(ethAccountID, AccountType.Account)

  let debugTXState = getDebugTXState() //this isn't so great..
  let newAccount = await createAccount(ethAccountID, debugTXState)

  if(temporaryParallelOldMode === false){
    let {
      accounts: accountWrites,
      contractStorages: contractStorageWrites,
      contractBytes: contractBytesWrites
    } = debugTXState.getWrittenAccounts()

    //need to commit the account now... this is such a hack!!
    for (let account of accountWrites.entries()) {
      //1. wrap and save/update this to shardium accounts[] map
      let addressStr = account[0]
      let accountObj = Account.fromRlpSerializedAccount(account[1])

      let ethAccount = accountObj
      debugTXState.commitAccount(addressStr, ethAccount) //yikes this wants an await.

    }
  }

  console.log('Tester account created', newAccount)
  const address = Address.fromString(ethAccountID)
  let account = await EVM.stateManager.getAccount(address)

  let wrappedEthAccount = {
    timestamp: Date.now(),
    account,
    ethAddress: ethAccountID,
    hash: '',
    accountType: AccountType.Account
  }
  updateEthAccountHash(wrappedEthAccount)
  accounts[shardusAccountID] = wrappedEthAccount

  //when temporaryParallelOldMode is set false we will actually need another way to commit this data!
  //  may need to commit it with the help of a dummy TransactionState object since ShardeumState commit(),checkpoint(),revert() will be no-op'd
  //  should test first to see if it just works though
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

async function _internalHackGet(url: string) {
  let normalized = _normalizeUrl(url)
  let host = parseUrl(normalized, true)
  try {
    await got.get(host, {
      timeout: 1000,
      retry: 0,
      throwHttpErrors: false,
      //parseJson: (text:string)=>{},
      //json: false, // the whole reason for _internalHackGet was because we dont want the text response to mess things up
      //  and as a debug non shipping endpoint did not want to add optional parameters to http module
    })
  } catch (e) {
  }
}

//?id=<accountID>
shardus.registerExternalGet('faucet-all', async (req, res) => {
  let id = req.query.id as string
  setupTester(id)
  try {
    let activeNodes = shardus.p2p.state.getNodes()
    if (activeNodes) {
      for (let node of activeNodes.values()) {
        _internalHackGet(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}`)
        res.write(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}\n`)
      }
    }
    res.write(`sending faucet request to all nodes\n`)
  } catch (e) {
    res.write(`${e}\n`)
  }
  res.end()
})

shardus.registerExternalGet('faucet-one', async (req, res) => {
  let id = req.query.id as string
  setupTester(id)
  return res.json({success: true})
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
  let tx = req.body
  let id = tx.address as string
  setupTester(id)
  try {
    let activeNodes = shardus.p2p.state.getNodes()
    if (activeNodes) {
      for (let node of activeNodes.values()) {
        _internalHackGet(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}`)
        res.write(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}\n`)
      }
    }
    res.write(`sending faucet request to all nodes\n`)
  } catch (e) {
    res.write(`${e}\n`)
  }
  res.end()
})

shardus.registerExternalGet('account/:address', async (req, res) => {
  const address = req.params['address']
  let accountType = req.query['type']
  if (accountType == null) accountType = 0
  let readableAccount = await getReadableAccountInfo(address, accountType)
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
    let debugTXState = getDebugTXState() //this isn't so great..
    shardiumStateManager.setTransactionState(debugTXState)

    const callResult = await EVM.runCall(opt)
    console.log('Call Result', callResult.execResult.returnValue.toString('hex'))

    if (callResult.execResult.exceptionError) {
      console.log('Execution Error:', callResult.execResult.exceptionError)
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
    const ethTxId = bufferToHex(transaction.hash())
    let txId = crypto.hashObj(tx)
    // Create an applyResponse which will be used to tell Shardus that the tx has been applied
    console.log('DBG', new Date(), 'attempting to apply tx', txId, tx)
    const applyResponse = shardus.createApplyResponse(txId, tx.timestamp)

    //Now we need to get a transaction state object.  For single sharded networks this will be a new object.
    //When we have multiple shards we could have some blob data that wrapped up read accounts.  We will read these accounts
    //Into the the transaction state init at some point (possibly not here).  This will allow the EVM to run and not have
    //A storage miss for accounts that were read on previous shard attempts to exectute this TX
    let transactionState = transactionStateMap.get(txId)
    if (transactionState == null) {
      transactionState = new TransactionState()
      transactionState.initData(shardiumStateManager, {
        storageMiss: accountMiss,
        contractStorageMiss,
        accountInvolved,
        contractStorageInvolved
      }, txId, undefined, undefined)
      transactionStateMap.set(txId, transactionState)
    } else {
      //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
      //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
    }

    //ah shoot this binding will not be "thread safe" may need to make it part of the EEI for this tx? idk.
    shardiumStateManager.setTransactionState(transactionState)

    // loop through the wrappedStates an insert them into the transactionState as first*Reads
    for (let accountId in wrappedStates) {
      let wrappedEVMAccount: WrappedEVMAccount = wrappedStates[accountId].data
      let address = Address.fromString(wrappedEVMAccount.ethAddress)
      if (wrappedEVMAccount.accountType === AccountType.Account) {
        transactionState.insertFirstAccountReads(address, wrappedEVMAccount.account)
      } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
        transactionState.insertFirstContractBytesReads(address, wrappedEVMAccount.codeByte)
      } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
        transactionState.insertFirstContractStorageReads(address, wrappedEVMAccount.key, wrappedEVMAccount.value)
      }
    }

    try {
      // Apply the tx
      // const Receipt = await EVM.runTx({tx: transaction, skipNonce: true, skipBlockGasLimitValidation: true})
      const Receipt = await EVM.runTx({tx: transaction, skipNonce: true})
      console.log('DBG', 'applied tx', txId, Receipt)
      console.log('DBG', 'applied tx eth', ethTxId, Receipt)
      shardusTxIdToEthTxId[txId] = ethTxId
      // this is to expose tx data for json rpc server
      appliedTxs[ethTxId] = {
        txId: ethTxId,
        injected: tx,
        receipt: {...Receipt, nonce: transaction.nonce.toString('hex')},
      }

      if(temporaryParallelOldMode === true){
        //This is also temporary.  It will move to the UpdateAccountFull code once we wrap the receipt a an account type
        // shardus-global-server wont be calling all of the UpdateAccountFull calls just yet though so we need this here
        // but it is ok to start adding the code that handles receipts in UpdateAccountFull and understand it will get called
        // soon

        // TEMPORARY HACK
        // store contract account, when shardus-global-server has more progress we can disable this
        if (Receipt.createdAddress) {
          let ethAccountID = Receipt.createdAddress.toString()
          let shardusAddress = toShardusAddress(ethAccountID, AccountType.Account)
          let contractAccount = await EVM.stateManager.getAccount(Receipt.createdAddress)
          let wrappedEthAccount = {timestamp: Date.now(), account: contractAccount, ethAddress: ethAccountID, hash: '', accountType: AccountType.Account}

          updateEthAccountHash(wrappedEthAccount)

          accounts[shardusAddress] = wrappedEthAccount
          console.log('Contract account stored', accounts[shardusAddress])
        }
      }

      //get a list of accounts or CA keys that have been written to
      //This is important because the EVM could change many accounts or keys that we are not aware of
      //the transactionState is what accumulates the writes that we need
      let {
        accounts: accountWrites,
        contractStorages: contractStorageWrites,
        contractBytes: contractBytesWrites
      } = transactionState.getWrittenAccounts()

      console.log(`DBG: all contractStorages writes`, contractStorageWrites)

      for (let contractStorageEntry of contractStorageWrites.entries()) {
        //1. wrap and save/update this to shardium accounts[] map
        let addressStr = contractStorageEntry[0]
        let contractStorageWrites = contractStorageEntry[1]
        for (let [key, value] of contractStorageWrites) { // do we need .entries()?
            let wrappedEVMAccount: WrappedEVMAccount = {
            timestamp: Date.now(),
            key,
            value,
            ethAddress: addressStr, //this is confusing but I think we may want to use key here
            hash: '',
            accountType: AccountType.ContractStorage
          }
          //for now the CA shardus address will be based off of key rather than the CA address
          //eventually we may use both with most significant hex of the CA address prepended
          //to the CA storage key (or a hash of the key)

          const wrappedChangedAccount = _shardusWrappedAccount(wrappedEVMAccount)
          //attach to applyResponse
          if(shardus.applyResponseAddChangedAccount != null){
            shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
          }
        }
      }

      for (let contractBytesEntry of contractBytesWrites.entries()) {
        //1. wrap and save/update this to shardium accounts[] map
        let addressStr = contractBytesEntry[0]
        let contractByteWrite: ContractByteWrite = contractBytesEntry[1]

        let wrappedEVMAccount: WrappedEVMAccount = {
          timestamp: Date.now(),
          codeHash: contractByteWrite.codeHash,
          codeByte: contractByteWrite.contractByte,
          ethAddress: addressStr,
          contractAddress: contractByteWrite.contractAddress.toString(),
          hash: '',
          accountType: AccountType.ContractCode
        }
        const wrappedChangedAccount = _shardusWrappedAccount(wrappedEVMAccount)
        //attach to applyResponse
        if(shardus.applyResponseAddChangedAccount != null){
          shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
        }
      }

      // Handle Account type last, because CAs may depend on CA:Storage or CA:Bytecode updates
      //wrap these accounts and keys up and add them to the applyResponse as additional involved accounts
      for (let account of accountWrites.entries()) {
        //1. wrap and save/update this to shardium accounts[] map
        let addressStr = account[0]
        let accountObj = Account.fromRlpSerializedAccount(account[1])

        let wrappedEVMAccount: WrappedEVMAccount = {
          timestamp: Date.now(),
          account: accountObj,
          ethAddress: addressStr,
          hash: '',
          accountType: AccountType.Account
        }

        // I think data is unwrapped too much and we should be using wrappedEVMAccount directly as data
        const wrappedChangedAccount = _shardusWrappedAccount(wrappedEVMAccount)

        // and the added it to the apply response (not implemented yet)
        //Attach the written account data to the apply response.  This will allow it to be shared with other shards if needed.
        if(shardus.applyResponseAddChangedAccount != null){
          shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
        }
      }

      //TODO also create an account for the receipt (nested in the returned Receipt should be a receipt with a list of logs)
      // We are ready to loop over the receipts and add them
      let wrappedReceiptAccount: WrappedEVMAccount = {
        timestamp: Date.now(),
        ethAddress: txId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
        hash: '',
        receipt: Receipt.receipt,
        txId,
        accountType: AccountType.Receipt,
      }
      const wrappedChangedAccount = _shardusWrappedAccount(wrappedReceiptAccount)
      if(shardus.applyResponseAddChangedAccount != null){
        shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
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
      let transformedSourceKey = toShardusAddress(transaction.getSenderAddress().toString(), AccountType.Account)
      let transformedTargetKey = transaction.to ? toShardusAddress(transaction.to.toString(), AccountType.Account) : ''
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
    return _calculateAccountHash(wrappedEthAccount)
  },
  deleteLocalAccountData() {
    accounts = {}
  },

  setAccountData(accountRecords) {
    for (const account of accountRecords) {
      let wrappedEVMAccount = account as WrappedEVMAccount

      let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)

      accounts[shardusAddress] = wrappedEVMAccount
    }

    // update shardium state. put this in a separate loop, but maybe that is overkill
    // I was thinking we could checkpoint and commit the changes on the outer loop,
    // but now I am not so sure that is safe, and best case may need a mutex
    // I am not even 100% that we can go without a mutex even one account at time, here or in other spots
    // where we commit data to tries.  I wouldn't want the awaited code to interleave in a bad way
    for (const account of accountRecords) {
      let wrappedEVMAccount = account as WrappedEVMAccount
   
      // hmm this is not awaited yet! needs changes to shardus global server.
      if (wrappedEVMAccount.accountType === AccountType.Account) {
        let addressString = wrappedEVMAccount.ethAddress
        let evmAccount = wrappedEVMAccount.account

        shardiumStateManager.setAccountExternal(addressString, evmAccount)

      } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {

        let addressString = wrappedEVMAccount.ethAddress
        let keyString = wrappedEVMAccount.key
        let bufferStr = wrappedEVMAccount.value.toString('hex')

        shardiumStateManager.setContractAccountKeyValueExternal(addressString, keyString, bufferStr)
      }

      //TODO need to save ContractBytes and Receipt types

    }

  },
  async getRelevantData(accountId, tx) {
    if (!tx.raw) throw new Error('getRelevantData: No raw tx')

    let wrappedEthAccount = accounts[accountId]
    let accountCreated = false


    let txId = crypto.hashObj(tx)
    let transactionState = transactionStateMap.get(txId)
    if (transactionState == null) {
      transactionState = new TransactionState()
      transactionState.initData(shardiumStateManager, {
        storageMiss: accountMiss,
        contractStorageMiss,
        accountInvolved,
        contractStorageInvolved
      }, txId, undefined, undefined)
      transactionStateMap.set(txId, transactionState)
    } else {
      //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
      //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
    }


    // Create the account if it doesn't exist
    if (typeof wrappedEthAccount === 'undefined' || wrappedEthAccount === null) {

      // oops! this is a problem..  maybe we should not have a fromShardusAddress
      // when we support sharding I dont think we can assume this is an AccountType.Account
      // the TX is specified at least so it might require digging into that to check if something matches the from/to field,
      // or perhaps a storage key in an access list..
      let ethAccountID = fromShardusAddress(accountId, AccountType.Account) // accountId is a shardus address

      //some of this feels a bit redundant, will need to think more on the cleanup
      await createAccount(ethAccountID, transactionState)

      const address = Address.fromString(ethAccountID)
      let account = await EVM.stateManager.getAccount(address)

      wrappedEthAccount = {
        timestamp: Date.now(),
        account,
        ethAddress: ethAccountID,
        hash: '',
        accountType: AccountType.Account //see above, it may be wrong to assume this type in the future
      }
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
      const wrapped = _shardusWrappedAccount(wrappedEthAccount)
      results.push(wrapped)

      // Return results early if maxRecords reached
      if (results.length >= maxRecords) return results
    }
    return results
  },
  async updateAccountFull(wrappedData, localCache, applyResponse: ShardusTypes.ApplyResponse) {
    const accountId = wrappedData.accountId
    const accountCreated = wrappedData.accountCreated
    const updatedEVMAccount: WrappedEVMAccount = wrappedData.data
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
      transactionState.initData(shardiumStateManager, {storageMiss: accountMiss, contractStorageMiss, accountInvolved, contractStorageInvolved}, txId, undefined, undefined)
      transactionStateMap.set(txId, transactionState)
    } else {
      //TODO possibly need a blob to re-init with?
    }
    console.log('updatedEVMAccount', updatedEVMAccount)

    if (updatedEVMAccount.accountType === AccountType.Account) {
      //if account?
      let addressStr = updatedEVMAccount.ethAddress
      let ethAccount = updatedEVMAccount.account
      transactionState.commitAccount(addressStr, ethAccount) //yikes this wants an await.
    } else if (updatedEVMAccount.accountType === AccountType.ContractStorage) {
      //if ContractAccount?
      let addressStr = updatedEVMAccount.ethAddress
      let key = updatedEVMAccount.key
      let bufferValue = updatedEVMAccount.value
      transactionState.commitContractStorage(addressStr, key, bufferValue)
    } else if (updatedEVMAccount.accountType === AccountType.ContractCode) {
      let addressStr = updatedEVMAccount.ethAddress
      let contractAddress = updatedEVMAccount.contractAddress
      let codeHash = updatedEVMAccount.codeHash
      let codeByte = updatedEVMAccount.codeByte
      transactionState.commitContractBytes(contractAddress, codeHash, codeByte)
    } else if (updatedEVMAccount.accountType === AccountType.Receipt) {

      //TODO we can add the code that processes a receipt now.
      //  This will not call back into transactionState
      //  it will get added to the accounts[] map below just like all types,
      //  but I think we may look the data here an basically call
      //   appliedTxs[txId] = ...  the data we get...  in a way that matches the temp solution in apply()
      //   but note we will keep the temp solution in apply() for now
      //   may have to store txId on the WrappedEVMAccount variant type.
      //

      // appliedTxs[txId] = {
      //   txId: updatedEVMAccount.txId,
      //   receipt: updatedEVMAccount.receipt
      // }
    }

    let hashBefore = updatedEVMAccount.hash
    updateEthAccountHash(updatedEVMAccount)
    let hashAfter = updatedEVMAccount.hash

    // Save updatedAccount to db / persistent storage
    accounts[accountId] = updatedEVMAccount
    let ethTxId = shardusTxIdToEthTxId[txId]
    let appliedTx = appliedTxs[ethTxId]
    appliedTx.status = 1

    // TODO: the account we passed to shardus is not the final committed data for contract code and contract storage
    //  accounts

    // Add data to our required response object
    shardus.applyResponseAddState(applyResponse, updatedEVMAccount, updatedEVMAccount, accountId, applyResponse.txId, applyResponse.txTimestamp, hashBefore, hashAfter, accountCreated)
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
      let wrappedEVMAccount = accounts[addressStr]
      // Skip if not in account id range
      const id = parseInt(addressStr, 16)
      if (id < start || id > end) continue
      // Skip if not in timestamp range
      const timestamp = wrappedEVMAccount.timestamp
      if (timestamp < tsStart || timestamp > tsEnd) continue
      // Add to results
      const wrapped = _shardusWrappedAccount(wrappedEVMAccount)
      results.push(wrapped)
      // Return results early if maxRecords reached
      if (results.length >= maxRecords) return results
    }
    return results
  },
  calculateAccountHash(wrappedEVMAccount: WrappedEVMAccount) {
    return _calculateAccountHash(wrappedEVMAccount)
  },
  resetAccountData(accountBackupCopies) {
    for (let recordData of accountBackupCopies) {

      let wrappedEVMAccount = recordData.data as WrappedEVMAccount
      let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
      accounts[shardusAddress] = wrappedEVMAccount

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
        const wrapped = _shardusWrappedAccount(wrappedEthAccount)
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
