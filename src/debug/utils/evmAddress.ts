import { AccountType } from '../../shardeum/shardeumTypes'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'

export function toShardusAddressWithKey(
  addressStr: string,
  secondaryAddressStr: string,
  accountType: AccountType
): string {
  if (accountType === AccountType.Account) {
    if (addressStr.length != 42) {
      throw new Error(
        `must pass in a 42 character hex addressStr for AccountType of Account. addressStr: ${addressStr}`
      )
    }

    //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
    //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
    return addressStr.slice(2).toLowerCase() + '0'.repeat(24)
  }

  if (
    accountType === AccountType.Receipt ||
    accountType === AccountType.StakeReceipt ||
    accountType === AccountType.UnstakeReceipt ||
    accountType === AccountType.InternalTxReceipt
  ) {
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
    const numPrefixChars = 8
    // remove the 0x and get the first 8 hex characters of the address
    const prefix = addressStr.slice(2, numPrefixChars + 2)

    if (addressStr.length != 42) {
      throw new Error(
        'must pass in a 42 character hex address for Account type ContractStorage or ContractCode.'
      )
    }
    if (secondaryAddressStr.length === 66) {
      secondaryAddressStr = secondaryAddressStr.slice(2)
    }
    //create a suffix with by discarding numPrefixChars from the start of our keyStr
    const suffix = secondaryAddressStr.slice(numPrefixChars)

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
      throw new Error(
        `must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`
      )
    }
    return secondaryAddressStr.slice(2).toLowerCase()
  }

  if (
    accountType === AccountType.NetworkAccount ||
    accountType === AccountType.NodeAccount ||
    accountType === AccountType.NodeAccount2 ||
    accountType === AccountType.NodeRewardReceipt ||
    accountType === AccountType.DevAccount
  ) {
    return addressStr.toLowerCase()
  }

  // receipt or contract bytes remain down past here
  if (addressStr.length === 64) {
    //unexpected case but lets allow it
    return addressStr.toLowerCase()
  }

  if (addressStr.length != 66) {
    throw new Error(
      `must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`
    )
  }

  //so far rest of the accounts are just using the 32 byte eth address for a shardus address minus the "0x"
  //  later this will change so we can keep certain accounts close to their "parents"

  //change this:0x665eab3be2472e83e3100b4233952a16eed20c76111111111111111111111111
  //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  return addressStr.slice(2).toLowerCase()
}

export function toShardusAddress(addressStr: string, accountType: AccountType): string {
  if (ShardeumFlags.VerboseLogs) {
    console.log(`Running toShardusAddress`, typeof addressStr, addressStr, accountType)
  }
  if (accountType === AccountType.ContractStorage || accountType === AccountType.ContractCode) {
    throw new Error(
      `toShardusAddress does not work anymore with type ContractStorage, use toShardusAddressWithKey instead`
    )
  }

  if (accountType === AccountType.Account || accountType === AccountType.Debug) {
    if (addressStr.length != 42) {
      throw new Error(
        `must pass in a 42 character hex address for Account type of Account or Debug. addressStr: ${addressStr} ${addressStr.length}}`
      )
    }
    //change this:0x665eab3be2472e83e3100b4233952a16eed20c76
    //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
    return addressStr.slice(2).toLowerCase() + '0'.repeat(24)
  }

  if (
    accountType === AccountType.Receipt ||
    accountType === AccountType.StakeReceipt ||
    accountType === AccountType.UnstakeReceipt ||
    accountType === AccountType.InternalTxReceipt
  ) {
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
    throw new Error(
      `must pass in a 66 character 32 byte address for non Account types. use the key for storage and codehash contractbytes ${addressStr.length}`
    )
  }

  //so far rest of the accounts are just using the 32 byte eth address for a shardus address minus the "0x"
  //  later this will change so we can keep certain accounts close to their "parents"

  //change this:0x665eab3be2472e83e3100b4233952a16eed20c76111111111111111111111111
  //    to this:  665eab3be2472e83e3100b4233952a16eed20c76000000000000000000000000
  return addressStr.slice(2).toLowerCase()
}
