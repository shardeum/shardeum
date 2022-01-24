import { Account, Address, BN, bufferToHex, toBuffer } from 'ethereumjs-util'

import { Transaction, AccessListEIP2930Transaction } from '@ethereumjs/tx'
import { TxReceipt } from '@ethereumjs/vm/dist/types'

import { AccountType, WrappedEVMAccount, WrappedEVMAccountMap, EVMAccountInfo } from './shardeumTypes'

import * as ShardeumFlags from './shardeumFlags'
import * as crypto from 'shardus-crypto-utils'
import { ShardiumState, TransactionState } from '../state'
import { getAccountShardusAddress, toShardusAddressWithKey, toShardusAddress } from './evmAddress'
import { Shardus, ShardusTypes } from 'shardus-global-server'

/**
 * we need this for now because the stateRoot is a stable key into a trie
 * this is flawed though and not a good hash.  it does update though
 *    probably could use balance in the string and get a bit better.
 * @param wrappedEVMAccount
 * @returns
 */
export function hashFromNonceHack(wrappedEVMAccount: WrappedEVMAccount): string {
  //just a basic nonce to hash because it will take more work to extract the correct hash
  let hash

  // temporary hack for generating hash
  if (wrappedEVMAccount.accountType === AccountType.Account) {
    // parse to number first since some nonces have leading zeroes
    hash = Number(wrappedEVMAccount.account.nonce).toString()
  } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
    hash = crypto.hashObj({ key: wrappedEVMAccount.key, value: wrappedEVMAccount.value })
  } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
    hash = crypto.hashObj({ key: wrappedEVMAccount.codeHash, value: wrappedEVMAccount.codeByte })
  } else if (wrappedEVMAccount.accountType === AccountType.Receipt) {
    hash = crypto.hashObj({ key: wrappedEVMAccount.txId, value: wrappedEVMAccount.receipt })
  }
  hash = hash + '0'.repeat(64 - hash.length)
  return hash
}

export function accountSpecificHash(wrappedEVMAccount: WrappedEVMAccount): string {
  let hash
  if (wrappedEVMAccount.accountType === AccountType.Account) {
    //Hash the full account, if we knew EOA vs CA we could mabe skip some steps.
    hash = crypto.hashObj(wrappedEVMAccount.account)
  } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
    hash = crypto.hashObj({ key: wrappedEVMAccount.key, value: wrappedEVMAccount.value })
  } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
    hash = crypto.hashObj({ key: wrappedEVMAccount.codeHash, value: wrappedEVMAccount.codeByte })
  } else if (wrappedEVMAccount.accountType === AccountType.Receipt) {
    hash = crypto.hashObj({ key: wrappedEVMAccount.txId, value: wrappedEVMAccount.receipt })
  }

  hash = hash + '0'.repeat(64 - hash.length)
  return hash
}

export function updateEthAccountHash(wrappedEVMAccount: WrappedEVMAccount) {
  wrappedEVMAccount.hash = _calculateAccountHash(wrappedEVMAccount)
}

export function _calculateAccountHash(wrappedEVMAccount: WrappedEVMAccount) {
  //return hashFromNonceHack(wrappedEVMAccount)

  return accountSpecificHash(wrappedEVMAccount)
}

export function _shardusWrappedAccount(wrappedEVMAccount: WrappedEVMAccount): ShardusTypes.WrappedData {
  const wrappedChangedAccount = {
    accountId: getAccountShardusAddress(wrappedEVMAccount),
    stateId: _calculateAccountHash(wrappedEVMAccount),
    data: wrappedEVMAccount,
    timestamp: wrappedEVMAccount.timestamp,
  }

  return wrappedChangedAccount
}

/**
 * make in place repairs to deseriazlied wrappedEVMAccount
 * @param wrappedEVMAccount
 */
export function fixDeserializedWrappedEVMAccount(wrappedEVMAccount: WrappedEVMAccount) {
  if (wrappedEVMAccount.accountType === AccountType.Account) {
    TransactionState.fixUpAccountFields(wrappedEVMAccount.account)
    //need to take the seriazlied data and put create a proper account object from it
    const accountObj = Account.fromAccountData(wrappedEVMAccount.account)
    wrappedEVMAccount.account = accountObj
  }

  if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
    wrappedEVMAccount.codeHash = Buffer.from(wrappedEVMAccount.codeHash)
    wrappedEVMAccount.codeByte = Buffer.from(wrappedEVMAccount.codeByte)
  }

  if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
    wrappedEVMAccount.value = Buffer.from(wrappedEVMAccount.value)
  }
}
