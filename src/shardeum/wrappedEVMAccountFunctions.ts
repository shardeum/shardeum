import { Account, bigIntToBytes, generateAddress } from '@ethereumjs/util'

import { ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { TransactionState } from '../state'
import { getAccountShardusAddress } from './evmAddress'
import { AccountType, InternalAccount, WrappedEVMAccount } from './shardeumTypes'
import { fixBigIntLiteralsToBigInt } from '../utils'
import { ShardeumFlags } from '../shardeum/shardeumFlags'

// type guard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isWrappedEVMAccount(obj: any): obj is WrappedEVMAccount {
  return 'ethAddress' in obj
}

// type guard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isInternalAccount(obj: any): obj is InternalAccount {
  return 'id' in obj
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
    account.accountType === AccountType.InternalTxReceipt ||
    account.accountType === AccountType.DevAccount
  ) {
    account.hash = crypto.hashObj(account)
    return account.hash
  }
  if (!isWrappedEVMAccount(account)) return ''
  if (account.accountType === AccountType.Account) {
    const { account: EVMAccountInfo, operatorAccountInfo, timestamp } = account
    const accountData = operatorAccountInfo
      ? { EVMAccountInfo, operatorAccountInfo, timestamp }
      : { EVMAccountInfo, timestamp }
    hash = crypto.hashObj(accountData)
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

export function updateEthAccountHash(wrappedEVMAccount: WrappedEVMAccount | InternalAccount): void {
  wrappedEVMAccount.hash = _calculateAccountHash(wrappedEVMAccount)
}

export function _calculateAccountHash(account: WrappedEVMAccount | InternalAccount): string {
  return accountSpecificHash(account)
}

export function _shardusWrappedAccount(
  wrappedEVMAccount: WrappedEVMAccount | InternalAccount
): ShardusTypes.WrappedData {
  const reuseHash = wrappedEVMAccount.accountType === AccountType.ContractCode && wrappedEVMAccount.hash // Use cached hash if available for ContractCode
  const wrappedChangedAccount = {
    accountId: getAccountShardusAddress(wrappedEVMAccount),
    stateId: reuseHash ? wrappedEVMAccount.hash : _calculateAccountHash(wrappedEVMAccount),
    data: wrappedEVMAccount,
    timestamp: wrappedEVMAccount.timestamp,
  }
  return wrappedChangedAccount
}

/**
 * Check if a field is a valid Uint8Array or can be converted to a Uint8Array
 * @param field - The field to check
 * @returns True if the field is a valid Uint8Array or can be converted to a Uint8Array, false otherwise
 */
function isValidUint8ArrayField(field: any): boolean {
  if (field instanceof Uint8Array) {
    return true
  }
  if (
    Array.isArray(field) &&
    field.length <= ShardeumFlags.maxUint8ArrayLength &&
    field.every((item) => typeof item === 'number')
  ) {
    return true
  }
  if (typeof field === 'object' && Object.values(field).every((item) => typeof item === 'number')) {
    return true
  }
  return false
}

/**
 * Check if a value is a scalar value
 * @param value - The value to check
 * @returns True if the value is a scalar value, false otherwise
 */
function isScalarValue(value: any): boolean {
  return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean'
}

/**
 * Sanitize the wrappedEVMAccount object to ensure all fields are valid Uint8Array fields or objects that can be converted to Uint8Array
 * @param wrappedEVMAccount - The WrappedEVMAccount object to sanitize
 * @throws Will throw an error if any field is not a valid Uint8Array
 */
function sanitizeWrappedEVMAccount(wrappedEVMAccount: WrappedEVMAccount): void {
  function sanitizeFields(obj: any): void {
    Object.entries(obj).forEach(([key, value]) => {
      if (isScalarValue(value)) {
        // Keep scalar values as-is
        return
      } else if (typeof value === 'bigint') {
        obj[key] = value.toString()
      } else if (typeof value === 'object' && value !== null) {
        if (isValidUint8ArrayField(value)) {
          obj[key] = Uint8Array.from(Object.values(value))
        } else {
          sanitizeFields(value)
        }
      } else {
        throw new Error(`Invalid field: ${key}`)
      }
    })
  }
  sanitizeFields(wrappedEVMAccount)
}

/**
 * make in place repairs to deserialized wrappedEVMAccount
 * @param wrappedEVMAccount
 */
export function fixDeserializedWrappedEVMAccount(wrappedEVMAccount: WrappedEVMAccount): void {
  try {
    const sanitizedAccount = wrappedEVMAccount // Not updating the original object
    sanitizeWrappedEVMAccount(sanitizedAccount) // Check for invalid fields
  } catch (error) {
    console.error('Error sanitizing wrappedEVMAccount:', error.message)
    return // Exit the function if sanitization fails
  }
  if (wrappedEVMAccount.accountType === AccountType.Account) {
    TransactionState.fixAccountFields(wrappedEVMAccount.account)
    wrappedEVMAccount.account = Account.fromAccountData(wrappedEVMAccount.account)
    if (wrappedEVMAccount.operatorAccountInfo)
      wrappedEVMAccount.operatorAccountInfo = fixBigIntLiteralsToBigInt(wrappedEVMAccount.operatorAccountInfo)
  }
  fixWrappedEVMAccountBuffers(wrappedEVMAccount)
  // for (const key in wrappedEVMAccount) {
  //   wrappedEVMAccount[key] = fixBigIntLiteralsToBigInt(wrappedEVMAccount[key])
  // }
}

function fixWrappedEVMAccountBuffers(wrappedEVMAccount: WrappedEVMAccount): void {
  if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
    if (
      !(wrappedEVMAccount.codeHash instanceof Uint8Array) &&
      typeof wrappedEVMAccount.codeHash === 'object' &&
      Object.values(wrappedEVMAccount.codeHash).length === 32
    ) {
      wrappedEVMAccount.codeHash = Uint8Array.from(Object.values(wrappedEVMAccount.codeHash))
      wrappedEVMAccount.codeByte = Uint8Array.from(Object.values(wrappedEVMAccount.codeByte))
    } else {
      wrappedEVMAccount.codeHash = Uint8Array.from(wrappedEVMAccount.codeHash)
      wrappedEVMAccount.codeByte = Uint8Array.from(wrappedEVMAccount.codeByte)
    }
  }

  if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
    if (!(wrappedEVMAccount.value instanceof Uint8Array) && typeof wrappedEVMAccount.value === 'object') {
      wrappedEVMAccount.value = Uint8Array.from(Object.values(wrappedEVMAccount.value))
    } else {
      wrappedEVMAccount.value = Uint8Array.from(wrappedEVMAccount.value)
    }
  }
}

export function predictContractAddress(wrappedEVMAccount: WrappedEVMAccount): Buffer {
  if (wrappedEVMAccount.accountType != AccountType.Account) {
    throw new Error('predictContractAddress requires AccountType.Account')
  }
  const fromStr = wrappedEVMAccount.ethAddress
  const nonce = wrappedEVMAccount.account.nonce
  const addressBuffer = predictContractAddressDirect(fromStr, nonce)
  return addressBuffer
}

export function predictContractAddressDirect(ethAddress: string, nonce: bigint): Buffer {
  let fromStr = ethAddress
  if (fromStr.length === 42) {
    fromStr = fromStr.slice(2) //trim 0x
  }
  const fromBuffer = Buffer.from(fromStr, 'hex')
  const addressArray = generateAddress(fromBuffer, bigIntToBytes(nonce))
  return Buffer.from(addressArray)
}
