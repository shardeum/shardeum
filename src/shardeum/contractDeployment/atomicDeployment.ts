import { AccountType } from '../shardeumTypes'
import { WrappedEVMAccount } from '../../types/WrappedEVMAccount'
import { toShardusAddressWithKey } from '../evmAddress'
import { bytesToHex } from '@ethereumjs/util'
import * as WrappedEVMAccountFunctions from '../wrappedEVMAccountFunctions'
import { ShardusTypes } from '@shardeum-foundation/core'
import { ShardeumFlags } from '../shardeumFlags'
import { nestedCountersInstance } from '@shardeum-foundation/core'

export interface ContractDeploymentBundle {
  contractAccount: WrappedEVMAccount
  contractCodeAccount: WrappedEVMAccount
  txId: string
  timestamp: number
}

export interface AccountUpdate {
  accountId: string
  accountData: WrappedEVMAccount
  txId: string
  txTimestamp: number
  accountType: AccountType
}

export async function atomicContractDeployment(
  shardus: any,
  bundle: ContractDeploymentBundle,
  applyResponse: ShardusTypes.ApplyResponse
): Promise<void> {
  const { contractAccount, contractCodeAccount, txId, timestamp } = bundle

  if (!contractAccount || !contractCodeAccount) {
    throw new Error('Both contract account and code account are required for atomic deployment')
  }

  if (contractAccount.accountType !== AccountType.Account) {
    throw new Error('Invalid account type for contract account')
  }

  if (contractCodeAccount.accountType !== AccountType.ContractCode) {
    throw new Error('Invalid account type for contract code account')
  }

  const updates: AccountUpdate[] = []

  const contractAccountWrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(contractAccount)
  updates.push({
    accountId: contractAccountWrapped.accountId,
    accountData: contractAccount,
    txId: txId,
    txTimestamp: timestamp,
    accountType: AccountType.Account,
  })

  const contractCodeAccountWrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(contractCodeAccount)
  updates.push({
    accountId: contractCodeAccountWrapped.accountId,
    accountData: contractCodeAccount,
    txId: txId,
    txTimestamp: timestamp,
    accountType: AccountType.ContractCode,
  })

  await applyAccountUpdatesBatch(shardus, updates, applyResponse)
}

async function applyAccountUpdatesBatch(
  shardus: any,
  updates: AccountUpdate[],
  applyResponse: ShardusTypes.ApplyResponse
): Promise<void> {
  for (const update of updates) {
    if (ShardeumFlags.VerboseLogs) {
      console.log(`Preparing atomic update for account ${update.accountId} of type ${update.accountType}`)
    }
  }

  try {
    const applyPromises = updates.map((update) => {
      const wrappedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(update.accountData)

      if (shardus && shardus.applyResponseAddChangedAccount != null) {
        return shardus.applyResponseAddChangedAccount(
          applyResponse,
          wrappedAccount.accountId,
          wrappedAccount as ShardusTypes.WrappedResponse,
          update.txId,
          wrappedAccount.timestamp
        )
      }
    })

    await Promise.all(applyPromises)
  } catch (error) {
    console.error('Error during atomic account update batch:', error)
  }

  if (ShardeumFlags.VerboseLogs) {
    console.log(`Atomic deployment completed for ${updates.length} accounts`)
  }
}

export async function validateContractDeployment(shardus: any, contractAddress: string, codeHash: Uint8Array): Promise<boolean> {
  if (!shardus) return false

  const contractAccountId = toShardusAddressWithKey(contractAddress, '', AccountType.Account)
  const contractAccount = await shardus.getLocalOrRemoteAccount(contractAccountId)

  if (!contractAccount) {
    return false
  }

  const codeHashStr = bytesToHex(codeHash)
  const codeAccountId = toShardusAddressWithKey(contractAddress, codeHashStr, AccountType.ContractCode)
  const codeAccount = await shardus.getLocalOrRemoteAccount(codeAccountId)

  if (!codeAccount || !codeAccount.data?.codeByte || codeAccount.data.codeByte.length === 0) {
    return false
  }

  return true
}

export function enhancedContractDeploymentLogic(
  shardus: any,
  contractBytesWrites: Map<string, any>,
  accountWrites: Map<string, any>,
  accountToCodeHash: Map<string, Uint8Array>,
  txTimestamp: number,
  txId: string,
  applyResponse: ShardusTypes.ApplyResponse
): void {
  const contractDeployments = new Map<string, ContractDeploymentBundle>()

  for (const contractBytesEntry of contractBytesWrites.entries()) {
    const contractByteWrite = contractBytesEntry[1]
    const contractAddress = contractByteWrite.contractAddress.toString()

    const codeHashStr = bytesToHex(contractByteWrite.codeHash)
    const codeHashStrWithPrefix = codeHashStr.startsWith('0x') ? codeHashStr : '0x' + codeHashStr
    const contractCodeAccount: WrappedEVMAccount = {
      timestamp: txTimestamp,
      codeHash: contractByteWrite.codeHash,
      codeByte: contractByteWrite.contractByte,
      ethAddress: codeHashStrWithPrefix,
      contractAddress: contractAddress,
      hash: '',
      accountType: AccountType.ContractCode,
    }

    if (!contractDeployments.has(contractAddress)) {
      contractDeployments.set(contractAddress, {
        contractAccount: null,
        contractCodeAccount: contractCodeAccount,
        txId: txId,
        timestamp: txTimestamp,
      })
    } else {
      contractDeployments.get(contractAddress).contractCodeAccount = contractCodeAccount
    }

    accountToCodeHash.set(contractAddress, contractByteWrite.codeHash)
  }

  for (const account of accountWrites.entries()) {
    const addressStr = account[0]

    if (contractDeployments.has(addressStr)) {
      const accountObj = account[1]

      const contractAccount: WrappedEVMAccount = {
        timestamp: txTimestamp,
        account: accountObj,
        ethAddress: addressStr,
        hash: '',
        accountType: AccountType.Account,
      }

      if (accountToCodeHash.has(addressStr)) {
        accountObj.codeHash = accountToCodeHash.get(addressStr)
      }

      contractDeployments.get(addressStr).contractAccount = contractAccount
    }
  }

  for (const [contractAddress, deploymentBundle] of contractDeployments) {
    if (deploymentBundle.contractAccount && deploymentBundle.contractCodeAccount) {
      atomicContractDeployment(shardus, deploymentBundle, applyResponse).catch((error) => {
        console.error(`Failed to atomically deploy contract ${contractAddress}:`, error)
        throw error
      })
    } else {
      console.warn(`Incomplete contract deployment for ${contractAddress}`)
    }
  }

  for (const account of accountWrites.entries()) {
    const addressStr = account[0]

    if (!contractDeployments.has(addressStr)) {
      const accountObj = account[1]
      const wrappedEVMAccount: WrappedEVMAccount = {
        timestamp: txTimestamp,
        account: accountObj,
        ethAddress: addressStr,
        hash: '',
        accountType: AccountType.Account,
      }

      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)

      if (shardus && shardus.applyResponseAddChangedAccount != null) {
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          wrappedChangedAccount.accountId,
          wrappedChangedAccount as ShardusTypes.WrappedResponse,
          txId,
          wrappedChangedAccount.timestamp
        )
      }
    }
  }
}
