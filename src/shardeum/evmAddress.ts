import { AccountType, WrappedEVMAccount, WrappedEthAccounts, EVMAccountInfo } from './shardeumTypes'

import * as ShardeumFlags from './shardeumFlags'

/**
 * This will correctly get a shardus address from a WrappedEVMAccount account no matter what type it is.
 * This is preferred over toShardusAddress in any case where we have an WrappedEVMAccount
 * maybe this should live in wrappedEVMAccountFunctions?
 * @param wrappedEthAccount
 * @returns
 */
export function getAccountShardusAddress(wrappedEthAccount: WrappedEVMAccount): string {
  let addressSource = wrappedEthAccount.ethAddress

  if (wrappedEthAccount.accountType === AccountType.ContractStorage) {
    //addressSource = wrappedEthAccount.key
    let shardusAddress = toShardusAddressWithKey(wrappedEthAccount.ethAddress, wrappedEthAccount.key, wrappedEthAccount.accountType)
    return shardusAddress
  }
  if (wrappedEthAccount.accountType === AccountType.ContractCode) {
    //in this case ethAddress is the code hash which is what we want for the key
    //wrappedEthAccount.codeHash.toString('hex')
    let shardusAddress = toShardusAddressWithKey(wrappedEthAccount.contractAddress, wrappedEthAccount.ethAddress, wrappedEthAccount.accountType)
    return shardusAddress
  }

  let shardusAddress = toShardusAddress(addressSource, wrappedEthAccount.accountType)
  return shardusAddress
}

export function toShardusAddressWithKey(addressStr: string, keyStr: string, accountType: AccountType): string {
  if (accountType === AccountType.Account) {
    if (addressStr.length != 42) {
      throw new Error('must pass in a 42 character hex address for Account type.')
    }

    //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
    //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
    return addressStr.slice(2).toLowerCase() + '0'.repeat(24)
  }

  if (ShardeumFlags.contractStorageKeySilo && (accountType === AccountType.ContractStorage || accountType === AccountType.ContractCode)) {
    let numPrefixChars = 8
    // remove the 0x and get the first 8 hex characters of the address
    let prefix = addressStr.slice(2, numPrefixChars + 2)
    let suffix

    if (addressStr.length != 42) {
      throw new Error('must pass in a 42 character hex address for Account type.')
    }
    if (keyStr.length === 66) {
      keyStr = keyStr.slice(2)
    }
    //create a suffix with by discarding numPrefixChars from the start of our keyStr
    suffix = keyStr.slice(numPrefixChars)

    //force the address to lower case
    let shardusAddress = prefix + suffix
    shardusAddress = shardusAddress.toLowerCase()
    return shardusAddress
  }

  if (ShardeumFlags.contractStorageKeySilo === false && (accountType === AccountType.ContractStorage || accountType === AccountType.ContractCode)) {
    if (keyStr.length === 64) {
      //unexpected case but lets allow it
      return keyStr.toLowerCase()
    }
    if (keyStr.length != 66) {
      throw new Error(`must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`)
    }
    return keyStr.slice(2).toLowerCase()
  }

  // receipt or contract bytes remain down past here
  if (addressStr.length === 64) {
    //unexpected case but lets allow it
    return addressStr.toLowerCase()
  }

  if (addressStr.length != 66) {
    throw new Error(`must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`)
  }

  //so far rest of the accounts are just using the 32 byte eth address for a shardus address minus the "0x"
  //  later this will change so we can keep certain accounts close to their "parents"

  //change this:0x665eab3be2472e83e3100b4233952a16eed20c76111111111111111111111111
  //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  return addressStr.slice(2).toLowerCase()
}

export function toShardusAddress(addressStr, accountType: AccountType): string {
  if (accountType === AccountType.ContractStorage || accountType === AccountType.ContractCode) {
    throw new Error(`toShardusAddress does not work anymore with type ContractStorage, use toShardusAddressWithKey instead`)
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
    throw new Error(`must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`)
  }

  //so far rest of the accounts are just using the 32 byte eth address for a shardus address minus the "0x"
  //  later this will change so we can keep certain accounts close to their "parents"

  //change this:0x665eab3be2472e83e3100b4233952a16eed20c76111111111111111111111111
  //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  return addressStr.slice(2).toLowerCase()
}
