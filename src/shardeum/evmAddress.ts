import {AccountType, WrappedEVMAccount} from './shardeumTypes'

import * as ShardeumFlags from './shardeumFlags'

/**
 * This will correctly get a shardus address from a WrappedEVMAccount account no matter what type it is.
 * This is preferred over toShardusAddress in any case where we have an WrappedEVMAccount
 * maybe this should live in wrappedEVMAccountFunctions?
 * @param wrappedEVMAccount
 * @returns
 */
export function getAccountShardusAddress(wrappedEVMAccount: WrappedEVMAccount): string {
  let addressSource = wrappedEVMAccount.ethAddress

  if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
    //addressSource = wrappedEVMAccount.key
    let shardusAddress = toShardusAddressWithKey(wrappedEVMAccount.ethAddress, wrappedEVMAccount.key, wrappedEVMAccount.accountType)
    return shardusAddress
  }
  if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
    //in this case ethAddress is the code hash which is what we want for the key
    //wrappedEVMAccount.codeHash.toString('hex')
    let shardusAddress = toShardusAddressWithKey(wrappedEVMAccount.contractAddress, wrappedEVMAccount.ethAddress, wrappedEVMAccount.accountType)
    return shardusAddress
  }
  if (wrappedEVMAccount.accountType === AccountType.Receipt) {
    //in this case ethAddress is the code hash which is what we want for the key
    //let shardusAddress = toShardusAddressWithKey(wrappedEVMAccount.txFrom, wrappedEVMAccount.ethAddress, wrappedEVMAccount.accountType)
    //let shardusAddress = toShardusAddressWithKey(wrappedEVMAccount.ethAddress.slice(0, 42), wrappedEVMAccount.ethAddress, wrappedEVMAccount.accountType)

    let shardusAddress = toShardusAddress(addressSource, wrappedEVMAccount.accountType)
    return shardusAddress
  }

  let shardusAddress = toShardusAddress(addressSource, wrappedEVMAccount.accountType)
  return shardusAddress
}

export function toShardusAddressWithKey(addressStr: string, secondaryAddressStr: string, accountType: AccountType): string {
  if (accountType === AccountType.Account) {
    if (addressStr.length != 42) {
      throw new Error('must pass in a 42 character hex addressStr for AccountType.Account type.')
    }

    //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
    //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
    return addressStr.slice(2).toLowerCase() + '0'.repeat(24)
  }

  if (accountType === AccountType.Receipt) {
    if (addressStr.length === 66) {
      return addressStr.slice(2).toLowerCase()
    } else {
      throw new Error('must pass in a 64 character hex addressStr AccountType.Receipt')
    }
  }

  if (
    ShardeumFlags.contractStorageKeySilo &&
    (accountType === AccountType.ContractStorage || accountType === AccountType.ContractCode)
  ) {
    let numPrefixChars = 8
    // remove the 0x and get the first 8 hex characters of the address
    let prefix = addressStr.slice(2, numPrefixChars + 2)
    let suffix

    if (addressStr.length != 42) {
      throw new Error('must pass in a 42 character hex address for Account type.')
    }
    if (secondaryAddressStr.length === 66) {
      secondaryAddressStr = secondaryAddressStr.slice(2)
    }
    //create a suffix with by discarding numPrefixChars from the start of our keyStr
    suffix = secondaryAddressStr.slice(numPrefixChars)

    //force the address to lower case
    let shardusAddress = prefix + suffix
    shardusAddress = shardusAddress.toLowerCase()
    return shardusAddress
  }

  if (
    ShardeumFlags.contractStorageKeySilo === false &&
    (accountType === AccountType.ContractStorage || accountType === AccountType.ContractCode)
  ) {
    if (secondaryAddressStr.length === 64) {
      //unexpected case but lets allow it
      return secondaryAddressStr.toLowerCase()
    }
    if (secondaryAddressStr.length != 66) {
      throw new Error(`must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`)
    }
    return secondaryAddressStr.slice(2).toLowerCase()
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

  if (accountType === AccountType.Account || accountType === AccountType.Debug) {
    if (addressStr.length != 42) {
      throw new Error('must pass in a 42 character hex address for Account type.')
    }
    //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
    //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
    return addressStr.slice(2).toLowerCase() + '0'.repeat(24)
  }

  if (accountType === AccountType.Receipt) {
    if (addressStr.length === 66) {
      return addressStr.slice(2).toLowerCase()
    } else {
      throw new Error('must pass in a 64 character hex addressStr AccountType.Receipt')
    }
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
