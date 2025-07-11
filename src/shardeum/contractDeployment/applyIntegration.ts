import { AccountType } from '../shardeumTypes'
import { WrappedEVMAccount } from '../../types/WrappedEVMAccount'
import { ShardusTypes } from '@shardeum-foundation/core'
import { ShardeumFlags } from '../shardeumFlags'
import { bytesToHex } from '@ethereumjs/util'
import { atomicContractDeployment, ContractDeploymentBundle } from './atomicDeployment'
import * as WrappedEVMAccountFunctions from '../wrappedEVMAccountFunctions'
import { Account } from '@ethereumjs/util'

export async function processContractDeployments(
  shardus: any,
  contractBytesWrites: Map<string, any>,
  accountWrites: Map<string, Buffer | Uint8Array>,
  txTimestamp: number,
  txId: string,
  applyResponse: ShardusTypes.ApplyResponse,
  validatorStakedAccounts: Map<string, any>
): Promise<void> {
  await processAtomicDeployments(
    shardus,
    contractBytesWrites,
    accountWrites,
    txTimestamp,
    txId,
    applyResponse,
    validatorStakedAccounts
  )
}

async function processAtomicDeployments(
  shardus: any,
  contractBytesWrites: Map<string, any>,
  accountWrites: Map<string, Buffer | Uint8Array>,
  txTimestamp: number,
  txId: string,
  applyResponse: ShardusTypes.ApplyResponse,
  validatorStakedAccounts: Map<string, any>
): Promise<void> {
  const contractDeployments = new Map<string, ContractDeploymentBundle>()
  const accountToCodeHash = new Map<string, Uint8Array>()

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

    accountToCodeHash.set(contractAddress, contractByteWrite.codeHash)

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
  }

  const processedContracts = new Set<string>()

  for (const account of accountWrites.entries()) {
    const addressStr = account[0]
    const accountData = account[1]

    if (ShardeumFlags.Virtual0Address && addressStr === '0x0000000000000000000000000000000000000000') {
      continue
    }

    const accountObj = Account.fromRlpSerializedAccount(accountData)

    const wrappedEVMAccount: WrappedEVMAccount = {
      timestamp: txTimestamp,
      account: accountObj,
      ethAddress: addressStr,
      hash: '',
      accountType: AccountType.Account,
    }

    if (validatorStakedAccounts.has(addressStr)) {
      wrappedEVMAccount.operatorAccountInfo = validatorStakedAccounts.get(addressStr)
    }

    if (contractDeployments.has(addressStr)) {
      if (accountToCodeHash.has(addressStr)) {
        accountObj.codeHash = accountToCodeHash.get(addressStr)
      }

      const bundle = contractDeployments.get(addressStr)
      bundle.contractAccount = wrappedEVMAccount

      if (bundle.contractCodeAccount) {
        await atomicContractDeployment(shardus, bundle, applyResponse)
        processedContracts.add(addressStr)
      }
    } else {
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

  for (const [address, bundle] of contractDeployments) {
    if (!processedContracts.has(address) && bundle.contractCodeAccount && !bundle.contractAccount) {
      console.warn(`Orphaned contract code for ${address}, applying separately`)

      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(bundle.contractCodeAccount)

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
