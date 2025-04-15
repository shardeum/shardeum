import { AccountType, InternalAccount, WrappedEVMAccount } from '../../shardeum/shardeumTypes'
import { TransactionState } from '../state'
import { fixBigIntLiteralsToBigInt } from '../../utils'
import { Account, bigIntToBytes, generateAddress } from '@ethereumjs/util'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'

/**
 * make in place repairs to deserialized wrappedEVMAccount
 * @param wrappedEVMAccount
 */
export function fixDeserializedWrappedEVMAccount(wrappedEVMAccount: WrappedEVMAccount): void {
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

export function updateEthAccountHash(wrappedEVMAccount: WrappedEVMAccount | InternalAccount): void {
  wrappedEVMAccount.hash = _calculateAccountHash(wrappedEVMAccount)
}

export function _calculateAccountHash(account: WrappedEVMAccount | InternalAccount): string {
  return accountSpecificHash(account)
}

/**
 * Computes a specific hash for an account object. This function removes any existing
 * `hash` property from the account object, calculates a new hash based on the account's
 * data, and then assigns the calculated hash back to the `hash` property of the account.
 *
 * @param account - The account object for which the hash is to be calculated.
 *                  The object is expected to have key-value pairs representing account data.
 * @returns The newly calculated hash as a string.
 */
export const accountSpecificHash = (account: any): string => {
  if (account == null || account == undefined) {
    throw new Error('Account data is null or undefined')
  }

  try {
    // Remove the existing hash property from the account object
    delete account.hash

    // Calculate a new hash based on the account's data and assign it to the hash property
    account.hash = crypto.hashObj(account)
    return account.hash
  } catch (error) {
    console.error('Error calculating account-specific hash:', error)
    throw new Error('Failed to calculate account-specific hash')
  }
}

// type guard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isWrappedEVMAccount(obj: any): obj is WrappedEVMAccount {
  return 'ethAddress' in obj
}
