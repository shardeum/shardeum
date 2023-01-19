import { Shardus } from '@shardus/core'
import { toShardusAddress, toShardusAddressWithKey } from '../shardeum/evmAddress'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { AccountType, WrappedEVMAccount } from '../shardeum/shardeumTypes'
import { TransactionState } from '../state'

/**
 * This callback is called when the EVM tries to get an account it does not exist in trie storage or TransactionState
 * We need to build a blob of first read accounts and call SGS so that it can jump the EVM execution to the correct shard
 * @param linkedTX
 * @param address
 */
export async function accountMiss(transactionState: TransactionState, address: string): Promise<boolean> {
  //Get the first read version of data that we have collected so far

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
export async function contractStorageMiss(transactionState: TransactionState): Promise<boolean> {
  //Get the first read version of data that we have collected so far

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
export const accountInvolved = (shardus: Shardus) => (
  transactionState: TransactionState,
  address: string,
  isRead: boolean
): boolean => {
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
  if (shardus.tryInvolveAccount != null) {
    let shardusAddress = toShardusAddress(address, AccountType.Account)

    let success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
    if (success === false) {
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
export const contractStorageInvolved = (shardus: Shardus) => (
  transactionState: TransactionState,
  address: string,
  key: string,
  isRead: boolean
): boolean => {
  //TODO: this will call into shardus global and make sure this TX can continue execution given
  // that we may need to invove an additional key

  let txID = transactionState.linkedTX

  //Need to translate key (or a combination of hashing address+key) to a shardus-global-server space address!

  //TODO implement this shardus function.
  //See documentation for details
  //Note we will have 3-4 different account types where accountInvolved gets called (depending on how we handle Receipts),
  // but they will all call the same shardus.accountInvolved() and shardus will not know of the different account types
  if (shardus.tryInvolveAccount != null) {
    //let shardusAddress = toShardusAddress(key, AccountType.ContractStorage)
    let shardusAddress = toShardusAddressWithKey(address, key, AccountType.ContractStorage)

    let success = shardus.tryInvolveAccount(txID, shardusAddress, isRead)
    if (success === false) {
      // transactionState will throw an error and halt the evm
      return false
    }
  }

  return true
}

export function tryGetRemoteAccountCBNoOp(
  transactionState: TransactionState,
  type: AccountType,
  address: string,
  key: string
): Promise<WrappedEVMAccount> {
  if (ShardeumFlags.VerboseLogs) {
    if (type === AccountType.Account) {
      console.log(`account miss: ${address} tx:${this.linkedTX}`)
      transactionState.tryRemoteHistory.account.push(address)
    } else if (type === AccountType.ContractCode) {
      console.log(`account bytes miss: ${address} key: ${key} tx:${this.linkedTX}`)
      transactionState.tryRemoteHistory.codeBytes.push(`${address}_${key}`)
    } else if (type === AccountType.ContractStorage) {
      console.log(`account storage miss: ${address} key: ${key} tx:${this.linkedTX}`)
      transactionState.tryRemoteHistory.storage.push(`${address}_${key}`)
    }
    logAccessList('tryGetRemoteAccountCBNoOp access list:', transactionState.appData)
  }

  return undefined
}

function logAccessList(message: string, appData: any) {
  if (appData != null && appData.accessList != null) {
    if (ShardeumFlags.VerboseLogs)
      console.log(`access list for ${message} ${JSON.stringify(appData.accessList)}`)
  }
}
