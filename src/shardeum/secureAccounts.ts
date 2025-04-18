import {
  AccountType,
  BaseAccount,
  InternalTx,
  InternalTXType,
  WrappedAccount,
  WrappedEVMAccount,
  WrappedStates,
} from './shardeumTypes'
import { updateEthAccountHash } from './wrappedEVMAccountFunctions'
import { ShardeumFlags } from './shardeumFlags'
import { toShardusAddress } from './evmAddress'

import { ShardusTypes, DevSecurityLevel, Shardus, nestedCountersInstance } from '@shardeum-foundation/core'
import { verifyMultiSigs } from '../setup/helpers'
import { createInternalTxReceipt, shardusConfig } from '..'
import { _shardusWrappedAccount } from './wrappedEVMAccountFunctions'

import genesisSecureAccounts from '../config/genesis-secure-accounts.json'
import { Address, bigIntToHex } from '@ethereumjs/util'
import { getApplyTXState } from '../'
import { DebugComplete } from '@shardeum-foundation/core'
import { keyListAsLeveledKeys } from '../utils/keyUtils'
import multisigPermissions from '../config/multisig-permissions.json'
import { cleanMultiSigPermissions } from '../utils/multisig'
import { validateTxChainId } from '../utils/validateChainId'
import fs from 'fs'
import path from 'path'
import { Utils } from '@shardeum-foundation/lib-types'

/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-object-injection */
let finalGenesisSecureAccounts = genesisSecureAccounts
let finalMultisigPermissions = multisigPermissions

if (process.env.LOAD_JSON_GENESIS_SECURE_ACCOUNTS) {
  const GSAFilePath = process.env.LOAD_JSON_GENESIS_SECURE_ACCOUNTS.trim()

  try {
    if (fs.existsSync(GSAFilePath)) {
      const GSAData = Utils.safeJsonParse(fs.readFileSync(GSAFilePath).toString())
      finalGenesisSecureAccounts = GSAData
      console.log('secureAccounts: genesis secure accounts loaded from:', GSAFilePath)
      /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'secureAccounts: genesis secure accounts loaded from:'+ GSAFilePath )
    } else {
      /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'secureAccounts: path to the following genesis secure accounts file is incorrect:'+ GSAFilePath )
      console.error('secureAccounts: path to the following genesis secure accounts file is incorrect:', GSAFilePath)
      throw new Error('secureAccounts: path to the following genesis secure accounts file is incorrect:' + GSAFilePath)
    }
  } catch (e) {
    /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'secureAccounts: error loading genesis secure accounts file:'+ e.message )
    console.error('secureAccounts: error loading genesis secure accounts file:', e)
    throw new Error('secureAccounts: error loading genesis secure accounts file: ' + e)
  }
} else {
  console.log('secureAccounts: genesis secure accounts LOAD_JSON_GENESIS_SECURE_ACCOUNTS not set')
  /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'secureAccounts: LOAD_JSON_GENESIS_SECURE_ACCOUNTS not set' )
}

if (process.env.LOAD_JSON_MULTISIG_PERMISSIONS) {
  const MSPFilePath = process.env.LOAD_JSON_MULTISIG_PERMISSIONS.trim()

  try {
    if (fs.existsSync(MSPFilePath)) {
      const MSPData = Utils.safeJsonParse(fs.readFileSync(MSPFilePath).toString())
      finalMultisigPermissions = MSPData
      console.log('secureAccounts: multisig permissions loaded from:', MSPFilePath)
      /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'secureAccounts: multisig permissions loaded from:'+ MSPFilePath )
    } else {
      /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'secureAccounts: path to the following multisig permissions file is incorrect:'+ MSPFilePath )
      console.error('secureAccounts: path to the following multisig permissions file is incorrect:', MSPFilePath)
      throw new Error('secureAccounts: path to the following multisig permissions file is incorrect:' + MSPFilePath)
    }
  } catch (e) {
    /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'secureAccounts: error loading multisig permissions file:'+ e.message )
    console.error('secureAccounts: error loading multisig permissions file:', e)
    throw new Error('secureAccounts: error loading multisig permissions file: ' + e)
  }
} else {
  console.log('secureAccounts: multisig permissions LOAD_JSON_MULTISIG_PERMISSIONS not set')
  /* prettier-ignore */ nestedCountersInstance?.countEvent('config', 'secureAccounts: LOAD_JSON_MULTISIG_PERMISSIONS not set' )
}
/* eslint-enable security/detect-object-injection */
/* eslint-enable security/detect-non-literal-fs-filename */

validateSecureAccountConfig(finalGenesisSecureAccounts)

export interface SecureAccount extends BaseAccount {
  id: string
  hash: string
  timestamp: number
  name: string
  nextTransferAmount: bigint
  nextTransferTime: number
  nonce: number
}

export interface SecureAccountConfig {
  Name: string
  SourceFundsAddress: string
  RecipientFundsAddress: string
  SecureAccountAddress: string // This will be the 32-byte address format
  SourceFundsBalance: string
}

export function isSecureAccount(obj: unknown): obj is SecureAccount {
  return (
    typeof obj === 'object' && obj !== null && 'name' in obj && 'nextTransferAmount' in obj && 'nextTransferTime' in obj
  )
}

type SerializedSecureAccount = Omit<SecureAccount, 'nextTransferAmount'> & {
  nextTransferAmount: string
}

export function initializeSecureAccount(
  secureAccountConfig: SecureAccountConfig,
  latestCycles: { start: number }[]
): SecureAccount {
  let cycleStart = 0
  if (latestCycles.length > 0) {
    cycleStart = latestCycles[0].start * 1000
  }

  const secureAccount: SecureAccount = {
    id: secureAccountConfig.SecureAccountAddress, // Use SecureAccountAddress as id
    hash: '',
    timestamp: cycleStart,
    accountType: AccountType.SecureAccount,
    name: secureAccountConfig.Name,
    nextTransferAmount: BigInt(0),
    nextTransferTime: 0,
    nonce: 0,
  }

  updateEthAccountHash(secureAccount)

  if (ShardeumFlags.VerboseLogs) console.log('SecureAccount created', secureAccount)

  return secureAccount
}

interface SecureAccountData {
  Name: string
  SourceFundsAddress: string
  RecipientFundsAddress: string
  SecureAccountAddress: string
}

export const secureAccountDataMap: Map<string, SecureAccountData> = new Map(
  finalGenesisSecureAccounts.map((account) => [account.Name, account])
)

interface CrackedData {
  sourceKeys: string[]
  targetKeys: string[]
}

export function crack(tx: InternalTx): CrackedData {
  if (!secureAccountDataMap.has(tx.accountName)) {
    throw new Error(`Secure account ${tx.accountName} not found`)
  }
  return {
    sourceKeys: [
      toShardusAddress(secureAccountDataMap.get(tx.accountName).SourceFundsAddress, AccountType.Account),
      toShardusAddress(secureAccountDataMap.get(tx.accountName).SecureAccountAddress, AccountType.SecureAccount),
    ],
    targetKeys: [toShardusAddress(secureAccountDataMap.get(tx.accountName).RecipientFundsAddress, AccountType.Account)],
  }
}

export function validateTransferFromSecureAccount(
  tx: InternalTx,
  shardus: Shardus
): { success: boolean; reason: string } {
  if (tx.internalTXType !== InternalTXType.TransferFromSecureAccount) {
    return { success: false, reason: 'Invalid transaction type' }
  }

  if (typeof tx.amount !== 'string' || !/^\d+$/.test(tx.amount)) {
    return { success: false, reason: 'Invalid amount format' }
  }

  if (BigInt(tx.amount) <= 0) {
    return { success: false, reason: 'Amount is negative or zero' }
  }

  if (typeof tx.accountName !== 'string' || tx.accountName.trim() === '') {
    return { success: false, reason: 'Invalid account name' }
  }

  if (typeof tx.nonce !== 'number' || tx.nonce < 0) {
    return { success: false, reason: 'Invalid nonce' }
  }

  if (!validateTxChainId(tx.chainId, ShardeumFlags.ChainID)) {
    return { success: false, reason: 'Invalid chain ID' }
  }

  const secureAccountData = secureAccountDataMap.get(tx.accountName)
  if (!secureAccountData) {
    return { success: false, reason: 'Secure account not found' }
  }

  // Verify signatures
  // Check if tx.sign is not an array
  if (!Array.isArray(tx.sign)) {
    return { success: false, reason: 'tx.sign is not an array' }
  }
  // must have at least one signature
  if (tx.sign.length === 0) {
    return { success: false, reason: 'Missing signatures' }
  }

  const txData = {
    amount: tx.amount,
    accountName: tx.accountName,
    nonce: tx.nonce,
    chainId: tx.chainId, // Use the hex string version
  }

  // Clean multiSigPermissions to remove any keys not in shardusConfig.debug.multisigKeys
  const cleanedMultiSigPermissions = cleanMultiSigPermissions(finalMultisigPermissions, shardusConfig)

  // Use the permitted keys from multisig-permissions.json for secure account transfers
  const permittedKeys = cleanedMultiSigPermissions.initiateSecureAccountTransfer || []

  const securityLevel = 9 // High security level for secure account transfers
  const allowedPublicKeys = keyListAsLeveledKeys(permittedKeys, securityLevel)
  const requiredSigs = Math.max(3, shardusConfig.debug.minMultiSigRequiredForGlobalTxs || 3)

  const isSignatureValid = verifyMultiSigs(
    txData,
    tx.sign as ShardusTypes.Sign[],
    allowedPublicKeys,
    requiredSigs,
    securityLevel as DevSecurityLevel
  )

  if (!isSignatureValid) {
    console.log('Found invalid signatures for transfer from secure account!', {
      requiredSigs,
      allowedPublicKeys,
      txSign: tx.sign,
      txData,
      secureAccountData,
    })
    return { success: false, reason: 'Invalid signatures' }
  }

  return { success: true, reason: '' }
}

export function verify(
  tx: InternalTx,
  wrappedStates: WrappedStates,
  shardus: Shardus
): { success: boolean; reason: string } {
  const commonValidation = validateTransferFromSecureAccount(tx, shardus)
  if (!commonValidation.success) {
    return { success: false, reason: commonValidation.reason }
  }

  const secureAccountConfig = secureAccountDataMap.get(tx.accountName)
  const secureAccount = wrappedStates[secureAccountConfig.SecureAccountAddress] as WrappedAccount

  if (!secureAccount || secureAccount.data.accountType !== AccountType.SecureAccount) {
    return { success: false, reason: 'Secure account not found or invalid' }
  }

  const sourceFundsAccount = wrappedStates[secureAccountConfig.SourceFundsAddress] as WrappedAccount
  const recipientFundsAccount = wrappedStates[secureAccountConfig.RecipientFundsAddress] as WrappedAccount

  if (!sourceFundsAccount || !recipientFundsAccount) {
    return { success: false, reason: 'Source or recipient account not found' }
  }

  const transferAmount = BigInt(tx.amount)
  const sourceBalance = BigInt(sourceFundsAccount.data.account.balance)

  if (sourceBalance < transferAmount) {
    return { success: false, reason: 'Insufficient balance in source account' }
  }

  // assert that the result of the balance subtraction has not overflowed or underflowed
  if (sourceBalance - transferAmount < 0) {
    return { success: false, reason: 'Balance subtraction would overflow' }
  }

  // assert that the nonce is the next consecutive number
  if (tx.nonce !== Number(secureAccount.data.nonce) + 1) {
    return { success: false, reason: 'Invalid nonce' }
  }

  const currentTime = Date.now()
  if (currentTime < secureAccount.data.nextTransferTime) {
    return { success: false, reason: 'Transfer not allowed yet, time restriction' }
  }

  if (transferAmount > secureAccount.data.nextTransferAmount) {
    return { success: false, reason: 'Transfer amount exceeds allowed limit' }
  }

  return { success: true, reason: 'Valid transaction' }
}

export async function apply(
  tx: InternalTx,
  txId: string,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  shardus: Shardus,
  applyResponse: ShardusTypes.ApplyResponse
): Promise<void> {
  const secureAccountConfig = secureAccountDataMap.get(tx.accountName)

  const sourceEOA = wrappedStates[toShardusAddress(secureAccountConfig.SourceFundsAddress, AccountType.Account)]
  const destEOA = wrappedStates[toShardusAddress(secureAccountConfig.RecipientFundsAddress, AccountType.Account)]
  const secureAccount =
    wrappedStates[toShardusAddress(secureAccountConfig.SecureAccountAddress, AccountType.SecureAccount)]

  // throw if any of the required accounts are not found
  if (!sourceEOA || !destEOA || !secureAccount) {
    throw new Error('One or more required accounts not found')
  }

  const sourceEOAData = sourceEOA.data as WrappedEVMAccount
  const destEOAData = destEOA.data as WrappedEVMAccount
  const secureAccountData = secureAccount.data as SecureAccount

  const amount = BigInt(tx.amount)

  // Get the shardeumState instance
  const shardeumState = getApplyTXState(txId)

  // Start transaction
  shardus.setDebugSetLastAppAwait(`apply():checkpoint_secure_accounts`)
  await shardeumState.checkpoint()

  try {
    // Update EVM accounts
    sourceEOAData.account.balance = BigInt(sourceEOAData.account.balance) - amount
    sourceEOAData.account.nonce += BigInt(1)
    destEOAData.account.balance = BigInt(destEOAData.account.balance) + amount

    sourceEOAData.timestamp = txTimestamp
    destEOAData.timestamp = txTimestamp

    updateEthAccountHash(sourceEOAData)
    updateEthAccountHash(destEOAData)

    // Put updated EVM accounts into state
    await shardeumState.putAccount(Address.fromString(secureAccountConfig.SourceFundsAddress), sourceEOAData.account)
    await shardeumState.putAccount(Address.fromString(secureAccountConfig.RecipientFundsAddress), destEOAData.account)

    // Update secure account
    secureAccountData.timestamp = txTimestamp
    secureAccountData.nonce += 1
    updateEthAccountHash(secureAccountData)
    // note: secure account is already in wrappedStates, no need for putAccount

    // Only commit after all updates succeed
    await shardeumState.commit()
  } catch (error) {
    // If anything fails, revert all changes
    await shardeumState.revert()
    throw error
  }

  shardus.setDebugSetLastAppAwait(`apply():checkpoint_secure_accounts`, DebugComplete.Completed)

  const wrappedSourceEOA = _shardusWrappedAccount(sourceEOAData)
  const wrappedDestEOA = _shardusWrappedAccount(destEOAData)
  const wrappedSecureAccount = _shardusWrappedAccount(secureAccountData)

  shardus.applyResponseAddChangedAccount(
    applyResponse,
    toShardusAddress(secureAccountConfig.SourceFundsAddress, AccountType.Account),
    wrappedSourceEOA as ShardusTypes.WrappedResponse,
    txId,
    applyResponse.txTimestamp
  )
  shardus.applyResponseAddChangedAccount(
    applyResponse,
    toShardusAddress(secureAccountConfig.RecipientFundsAddress, AccountType.Account),
    wrappedDestEOA as ShardusTypes.WrappedResponse,
    txId,
    applyResponse.txTimestamp
  )
  shardus.applyResponseAddChangedAccount(
    applyResponse,
    toShardusAddress(secureAccountConfig.SecureAccountAddress, AccountType.SecureAccount),
    wrappedSecureAccount as ShardusTypes.WrappedResponse,
    txId,
    applyResponse.txTimestamp
  )

  if (ShardeumFlags.supportInternalTxReceipt) {
    createInternalTxReceipt(
      shardus,
      applyResponse,
      tx,
      toShardusAddress(secureAccountConfig.SourceFundsAddress, AccountType.Account),
      toShardusAddress(secureAccountConfig.RecipientFundsAddress, AccountType.Account),
      txTimestamp,
      txId,
      bigIntToHex(BigInt(tx.amount)),
      undefined,
      undefined,
      tx.accountName
    )
  }
}

function validateSecureAccountConfig(config: SecureAccountConfig[]): void {
  const seenAddresses = new Set<string>()

  for (const account of config) {
    if (account.SourceFundsAddress === account.RecipientFundsAddress) {
      throw new Error(
        `Invalid secure account config for ${account.Name}: Source and recipient addresses must be different`
      )
    }

    if (seenAddresses.has(account.SourceFundsAddress)) {
      throw new Error(`Duplicate source address found: ${account.SourceFundsAddress}`)
    }
    if (seenAddresses.has(account.RecipientFundsAddress)) {
      throw new Error(`Duplicate recipient address found: ${account.RecipientFundsAddress}`)
    }

    seenAddresses.add(account.SourceFundsAddress)
    seenAddresses.add(account.RecipientFundsAddress)
  }
}
