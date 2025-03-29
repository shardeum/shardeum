import { isHexString } from '@ethereumjs/util'
import { getReadableAccountInfo, isArchiverMode } from '..'
import { toShardusAddress, toShardusAddressWithKey } from '../shardeum/evmAddress'
import { AccountType } from '../shardeum/shardeumTypes'
import { fixDeserializedWrappedEVMAccount } from '../shardeum/wrappedEVMAccountFunctions'
import { convertBigIntsToHex } from './serialization'
import * as AccountsStorage from '../storage/accountStorage'

export async function getAccountData(shardus, address: string, req: any): Promise<any> {
  if (address.length !== 42 && address.length !== 64) {
    return { error: 'Invalid address' }
  }

  const id = shardus.getNodeId()
  const isInRotationBonds = shardus.isNodeInRotationBounds(id)
  if (isInRotationBonds) {
    return { error: 'node close to rotation edges' }
  }

  if (!req.query.type) {
    let shardusAddress = address.toLowerCase()
    if (address.length === 42) {
      shardusAddress = toShardusAddress(address, AccountType.Account)
    }
    const hexBlockNumber = req.query.blockNumber
    const hexBlockNumberStr = isHexString(hexBlockNumber) ? hexBlockNumber : null

    let data
    if (isArchiverMode() && hexBlockNumberStr) {
      data = await AccountsStorage.fetchAccountDataFromCollector(shardusAddress, hexBlockNumberStr)
      if (!data) {
        return { account: null }
      }
    } else {
      const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
      if (!account) {
        return { account: null }
      }
      data = account.data
    }

    fixDeserializedWrappedEVMAccount(data)
    const readableAccount = await getReadableAccountInfo(data)
    return readableAccount ? { account: readableAccount } : { account: data }
  } else {
    const accountType = parseInt(req.query.type)
    if (AccountType[accountType] == null) {
      return { error: 'Invalid account type' }
    }

    const secondaryAddressStr = (req.query.secondaryAddress || '').toString()
    if (secondaryAddressStr && secondaryAddressStr.length !== 66) {
      return { error: 'Invalid secondary address' }
    }

    const shardusAddress = toShardusAddressWithKey(address, secondaryAddressStr, accountType)
    const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
    const readableAccount = convertBigIntsToHex(account)
    return { account: readableAccount }
  }
}
