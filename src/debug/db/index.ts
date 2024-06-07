import fs from 'fs'
import { AccountType, WrappedEVMAccount } from '../../shardeum/shardeumTypes'
import { isValidAddress } from 'ethereumjs-util'
import { toShardusAddress, toShardusAddressWithKey } from '../utils/evmAddress'
import { Utils } from '@shardus/types'

export type jsonState = {
  accountId: string
  data: WrappedEVMAccount
  stateId?: string
  timestamp?: number
}

export const accounts: Map<string, WrappedEVMAccount> = new Map()

export function addCreatedAccount(address: string, account: WrappedEVMAccount): void {
  let accountId
  if (isValidAddress(address)) {
    accountId = toShardusAddress(address, AccountType.Account)
  }
  if (accountId) accounts.set(accountId, account)
}

export function loadStatesFromJson(fileName: string): boolean {
  // LOAD BEFORE STATES (CS)
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const data = Utils.safeJsonParse(fs.readFileSync(fileName, 'utf8'))
  const estimateOnly = !!data.txData

  if (!data.beforeStateAccounts) {
    if (!estimateOnly) {
      throw new Error('beforeStateAccounts not found in file')
    }
  }
  const beforeStates: jsonState[] = estimateOnly ? [] : data.beforeStateAccounts

  // LOAD STATES (EOA | CA | CB)
  fileName = `${fileName.slice(0, -5)}_states.json`
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(fileName)) {
    // State file not found. Create a new one.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(fileName, '[]')
    return estimateOnly
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const fileContent = fs.readFileSync(fileName, 'utf8')
  const stateArray: jsonState[] = Utils.safeJsonParse(fileContent)

  // Iterate through all states in stateArray
  // eslint-disable-next-line security/detect-object-injection
  stateArray.forEach((state) => {
    const properties = ['codeHash', 'storageRoot', 'stateRoot', 'codeByte']
    properties.forEach((property) => {
      // Check if property exists
      // eslint-disable-next-line security/detect-object-injection
      if (!state.data?.account?.[property]) return

      // eslint-disable-next-line security/detect-object-injection
      if (state.data.account[property]['type'] === 'Buffer') {
        return
      }

      // eslint-disable-next-line security/detect-object-injection
      if (typeof state.data.account[property] === 'object') {
        const arr: number[] = Object.keys(state.data.account.codeHash).map(
          // eslint-disable-next-line security/detect-object-injection
          (key) => state.data.account[property][key]
        )

        // eslint-disable-next-line security/detect-object-injection
        state.data.account[property] = Uint8Array.from(arr)
      }
    })
  })

  beforeStates.concat(stateArray).forEach((state) => accounts.set(state.accountId, state.data))
  return estimateOnly
}

export function getAccount(address: string): WrappedEVMAccount {
  if (isValidAddress(address)) {
    address = toShardusAddress(address, AccountType.Account)
  }
  return accounts.get(address)
}

export function hasAccount(address: string): { found: boolean; shardusKey: string } {
  if (isValidAddress(address)) {
    address = toShardusAddress(address, AccountType.Account)
  }
  return { found: accounts.has(address), shardusKey: address }
}

export function getKey(
  address: string,
  secondaryAddress: string,
  type: AccountType
): { account: WrappedEVMAccount; shardusKey: string } {
  const key = toShardusAddressWithKey(address, secondaryAddress, type)
  return { account: accounts.get(key), shardusKey: key }
}
