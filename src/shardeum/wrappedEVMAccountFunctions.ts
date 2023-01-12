import { Account, BN, generateAddress } from 'ethereumjs-util'

import { AccountType, WrappedEVMAccount, InternalAccount } from './shardeumTypes'
import * as crypto from '@shardus/crypto-utils'
import { TransactionState } from '../state'
import { getAccountShardusAddress } from './evmAddress'
import { ShardusTypes } from '@shardus/core'
import { ShardeumFlags } from './shardeumFlags'

export function isWrappedEVMAccount(obj: any): obj is WrappedEVMAccount {
  return 'ethAddress' in obj
}

export function accountSpecificHash(account: WrappedEVMAccount | InternalAccount): string {
  let hash
  delete account.hash
  if (
    account.accountType === AccountType.NetworkAccount ||
    account.accountType === AccountType.NodeAccount ||
    account.accountType === AccountType.NodeAccount2 ||
    account.accountType === AccountType.NodeRewardReceipt ||
    account.accountType === AccountType.StakeReceipt ||
    account.accountType === AccountType.UnstakeReceipt ||
    account.accountType === AccountType.DevAccount
  ) {
    account.hash = crypto.hashObj(account)
    return account.hash
  }
  if (!isWrappedEVMAccount(account)) return ''
  if (account.accountType === AccountType.Account) {
    //Hash the full account, if we knew EOA vs CA we could mabe skip some steps.
    hash = crypto.hashObj(account.account)
  } else if (account.accountType === AccountType.Debug) {
    hash = crypto.hashObj(account)
  } else if (account.accountType === AccountType.ContractStorage) {
    hash = crypto.hashObj({ key: account.key, value: account.value })
  } else if (account.accountType === AccountType.ContractCode) {
    hash = crypto.hashObj({ key: account.codeHash, value: account.codeByte })
  } else if (account.accountType === AccountType.Receipt) {
    hash = crypto.hashObj({ key: account.txId, value: account.receipt })
  }

  // hash = hash + '0'.repeat(64 - hash.length)
  account.hash = hash
  return hash
}

export function updateEthAccountHash(wrappedEVMAccount: WrappedEVMAccount) {
  wrappedEVMAccount.hash = _calculateAccountHash(wrappedEVMAccount)
}

export function _calculateAccountHash(account: WrappedEVMAccount | InternalAccount) {
  return accountSpecificHash(account)
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
 * make in place repairs to deserialized wrappedEVMAccount
 * @param wrappedEVMAccount
 */
export function fixDeserializedWrappedEVMAccount(wrappedEVMAccount: WrappedEVMAccount) {
  if (wrappedEVMAccount.accountType === AccountType.Account) {
    TransactionState.fixAccountFields(wrappedEVMAccount.account)
    wrappedEVMAccount.account = Account.fromAccountData(wrappedEVMAccount.account)
  }
  fixWrappedEVMAccountBuffers(wrappedEVMAccount)
}

function fixWrappedEVMAccountBuffers(wrappedEVMAccount: WrappedEVMAccount) {
  if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
    wrappedEVMAccount.codeHash = Buffer.from(wrappedEVMAccount.codeHash)
    wrappedEVMAccount.codeByte = Buffer.from(wrappedEVMAccount.codeByte)
  }

  if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
    wrappedEVMAccount.value = Buffer.from(wrappedEVMAccount.value)
  }
}

export function predictContractAddress(wrappedEVMAccount: WrappedEVMAccount): Buffer {
  if (wrappedEVMAccount.accountType != AccountType.Account) {
    throw new Error('predictContractAddress requires AccountType.Account')
  }
  let fromStr = wrappedEVMAccount.ethAddress
  let nonce = wrappedEVMAccount.account.nonce
  let addressBuffer = predictContractAddressDirect(fromStr, nonce)
  return addressBuffer
}

export function predictContractAddressDirect(ethAddress: string, nonce: BN): Buffer {
  let fromStr = ethAddress
  if (fromStr.length === 42) {
    fromStr = fromStr.slice(2) //trim 0x
  }
  let fromBuffer = Buffer.from(fromStr, 'hex')

  let nonceBuffer: Buffer = Buffer.from(nonce.toArray())
  let addressBuffer = generateAddress(fromBuffer, nonceBuffer)
  return addressBuffer
}
