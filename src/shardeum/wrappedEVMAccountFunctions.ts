import { Account, BN, generateAddress } from 'ethereumjs-util'

import { AccountType, WrappedEVMAccount } from './shardeumTypes'
import * as crypto from '@shardus/crypto-utils'
import { TransactionState } from '../state'
import { getAccountShardusAddress } from './evmAddress'
import { ShardusTypes } from '@shardus/core'
import { UseBase64BufferEncoding } from './shardeumFlags'

export function accountSpecificHash(wrappedEVMAccount: WrappedEVMAccount): string {
  let hash
  delete wrappedEVMAccount.hash
  if (
    wrappedEVMAccount.accountType === AccountType.NetworkAccount ||
    wrappedEVMAccount.accountType === AccountType.NodeAccount ||
    wrappedEVMAccount.accountType === AccountType.NodeRewardReceipt ||
    wrappedEVMAccount.accountType === AccountType.DevAccount
  ) {
    wrappedEVMAccount.hash = crypto.hashObj(wrappedEVMAccount)
    return wrappedEVMAccount.hash
  }
  if (wrappedEVMAccount.accountType === AccountType.Account) {
    //Hash the full account, if we knew EOA vs CA we could mabe skip some steps.
    hash = crypto.hashObj(wrappedEVMAccount.account)
  } else if (wrappedEVMAccount.accountType === AccountType.Debug) {
    hash = crypto.hashObj(wrappedEVMAccount)
  } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
    hash = crypto.hashObj({ key: wrappedEVMAccount.key, value: wrappedEVMAccount.value })
  } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
    hash = crypto.hashObj({ key: wrappedEVMAccount.codeHash, value: wrappedEVMAccount.codeByte })
  } else if (wrappedEVMAccount.accountType === AccountType.Receipt) {
    hash = crypto.hashObj({ key: wrappedEVMAccount.txId, value: wrappedEVMAccount.receipt })
  }

  // hash = hash + '0'.repeat(64 - hash.length)
  wrappedEVMAccount.hash = hash
  return hash
}

export function updateEthAccountHash(wrappedEVMAccount: WrappedEVMAccount) {
  wrappedEVMAccount.hash = _calculateAccountHash(wrappedEVMAccount)
}

export function _calculateAccountHash(wrappedEVMAccount: WrappedEVMAccount) {
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
 * make in place repairs to deserialized wrappedEVMAccount
 * @param wrappedEVMAccount
 */
export function fixDeserializedWrappedEVMAccount(wrappedEVMAccount: WrappedEVMAccount) {
  if (wrappedEVMAccount.accountType === AccountType.Account) {
    TransactionState.fixAccountFields(wrappedEVMAccount.account)
    wrappedEVMAccount.account = Account.fromAccountData(wrappedEVMAccount.account)
  }
  if (!UseBase64BufferEncoding) {
    fixWrappedEVMAccountBuffers(wrappedEVMAccount)
  }
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
