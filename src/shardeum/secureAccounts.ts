import { AccountMap, AccountType, BaseAccount, InternalTXType, ReadableReceipt, TransferFromSecureAccount, WrappedEVMAccount } from './shardeumTypes'
import { updateEthAccountHash } from './wrappedEVMAccountFunctions'
import { ShardeumFlags } from './shardeumFlags'
import { generateTxId } from '../utils'
import { toShardusAddress } from './evmAddress'
import genesisSecureAccounts from '../config/genesis-secure-accounts.json'
import { ShardusTypes, DevSecurityLevel, Shardus } from '@shardus/core'
import { verifyMultiSigs } from '../setup/helpers'
import { shardusConfig } from '..'
import { _shardusWrappedAccount } from './wrappedEVMAccountFunctions'
import { crypto } from '@shardus/core'

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
  Name: string;
  SourceFundsAddress: string;
  RecipientFundsAddress: string;
  SecureAccountAddress: string; // This will be the 32-byte address format
  SourceFundsBalance: string;
}

export function isSecureAccount(obj: unknown): obj is SecureAccount {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'nextTransferAmount' in obj &&
    'nextTransferTime' in obj
  )
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
    nonce: 0
  }

  updateEthAccountHash(secureAccount)

  if (ShardeumFlags.VerboseLogs) console.log('SecureAccount created', secureAccount)

  return secureAccount
}

export function serializeSecureAccount(account: SecureAccount): any {
  return {
    ...account,
    nextTransferAmount: account.nextTransferAmount.toString(),
  };
}

interface SecureAccountData {
  Name: string
  SourceFundsAddress: string
  RecipientFundsAddress: string
  SecureAccountAddress: string
}

const secureAccountDataMap: Map<string, SecureAccountData> = new Map(
  genesisSecureAccounts.map(account => [account.Name, account])
)

interface CrackedData {
  timestamp: number
  txId: string
  involvedAccounts: {
    sourceFunds: string
    recipientFunds: string
    secureAccount: string
  }
}

export function crack(tx: TransferFromSecureAccount): CrackedData {
  const timestamp = Date.now()
  const txId = generateTxId(tx)

  const secureAccountData = secureAccountDataMap.get(tx.accountName)
  if (!secureAccountData) {
    throw new Error(`SecureAccount not found for name: ${tx.accountName}`)
  }

  const involvedAccounts = {
    sourceFunds: toShardusAddress(secureAccountData.SourceFundsAddress, AccountType.Account),
    recipientFunds: toShardusAddress(secureAccountData.RecipientFundsAddress, AccountType.Account),
    secureAccount: toShardusAddress(secureAccountData.SecureAccountAddress, AccountType.SecureAccount)
  }

  return {
    timestamp,
    txId,
    involvedAccounts
  }
}

export function validateTransferFromSecureAccount(tx: TransferFromSecureAccount, shardus: Shardus): { success: boolean; reason: string } {
 if (tx.txType !== InternalTXType.TransferFromSecureAccount) {
    return { success: false, reason: 'Invalid transaction type' }
  }

  if (typeof tx.amount !== 'string' || !/^\d+$/.test(tx.amount)) {
    return { success: false, reason: 'Invalid amount format' }
  }

  if (typeof tx.accountName !== 'string' || tx.accountName.trim() === '') {
    return { success: false, reason: 'Invalid account name' }
  }

  if (typeof tx.nonce !== 'number' || tx.nonce < 0) {
    return { success: false, reason: 'Invalid nonce' }
  }

  const secureAccountData = genesisSecureAccounts.find(account => account.Name === tx.accountName)
  if (!secureAccountData) {
    return { success: false, reason: 'Secure account not found' }
  }

  // Verify signatures
  if (!tx.sign || tx.sign.length === 0) {
    return { success: false, reason: 'Missing signatures' }
  }

  const txData = {
    txType: tx.txType,
    amount: tx.amount,
    accountName: tx.accountName,
    nonce: tx.nonce
  }

  const allowedPublicKeys = shardus.getMultisigPublicKeys()
  const requiredSigs = Math.max(1, shardusConfig.debug.minMultiSigRequiredForGlobalTxs)

  const isSignatureValid = verifyMultiSigs(
    txData,
    tx.sign,
    allowedPublicKeys,
    requiredSigs,
    DevSecurityLevel.High
  )

  if (!isSignatureValid) {
    return { success: false, reason: 'Invalid signatures' }
  }

  return { success: true, reason: '' }
}

export function verify(
  tx: TransferFromSecureAccount,
  wrappedStates: AccountMap,
  shardus: Shardus
): { isValid: boolean; reason: string } {
  const commonValidation = validateTransferFromSecureAccount(tx, shardus)
  if (!commonValidation.success) {
    return { isValid: false, reason: commonValidation.reason }
  }

  const secureAccountData = wrappedStates.get(tx.accountName)
  if (!secureAccountData || secureAccountData.accountType !== AccountType.SecureAccount) {
    return { isValid: false, reason: 'Secure account not found or invalid' }
  }

  const secureAccount = secureAccountData as WrappedEVMAccount
  const sourceFundsAccount = wrappedStates.get(secureAccount.operatorAccountInfo.SourceFundsAddress) as WrappedEVMAccount
  const recipientFundsAccount = wrappedStates.get(secureAccount.operatorAccountInfo.RecipientFundsAddress) as WrappedEVMAccount

  if (!sourceFundsAccount || !recipientFundsAccount) {
    return { isValid: false, reason: 'Source or recipient account not found' }
  }

  const transferAmount = BigInt(tx.amount)
  const sourceBalance = BigInt(sourceFundsAccount.account.balance)

  if (sourceBalance < transferAmount) {
    return { isValid: false, reason: 'Insufficient balance in source account' }
  }

  if (tx.nonce !== Number(secureAccount.account.nonce)) {
    return { isValid: false, reason: 'Invalid nonce' }
  }

  const currentTime = Date.now()
  if (currentTime < secureAccount.account.nextTransferTime) {
    return { isValid: false, reason: 'Transfer not allowed yet, time restriction' }
  }

  if (transferAmount > secureAccount.nextTransferAmount) {
    return { isValid: false, reason: 'Transfer amount exceeds allowed limit' }
  }

  return { isValid: true, reason: 'Valid transaction' }
}

export async function apply(
  tx: TransferFromSecureAccount,
  wrappedStates: AccountMap,
  appData: any,
  shardus: Shardus,
  applyResponse: ShardusTypes.ApplyResponse
): Promise<void> {
  const crackedData = appData.crackedData;
  if (!crackedData) {
    throw new Error('Cracked data not found in appData');
  }

  const sourceEOA = wrappedStates[crackedData.involvedAccounts.sourceFunds] as WrappedEVMAccount;
  const destEOA = wrappedStates[crackedData.involvedAccounts.recipientFunds] as WrappedEVMAccount;
  const secureAccount = wrappedStates[crackedData.involvedAccounts.secureAccount] as SecureAccount;

  if (!sourceEOA || !destEOA || !secureAccount) {
    throw new Error('One or more required accounts not found');
  }

  const amount = BigInt(tx.amount);

  if (BigInt(sourceEOA.account.balance) < amount) {
    throw new Error('Insufficient balance in source account');
  }

  sourceEOA.account.balance = sourceEOA.account.balance - amount;
  destEOA.account.balance = destEOA.account.balance + amount;

  secureAccount.nonce += 1;
  
  updateEthAccountHash(sourceEOA);
  updateEthAccountHash(destEOA);
  updateEthAccountHash(secureAccount);

  const wrappedSourceEOA = _shardusWrappedAccount(sourceEOA);
  const wrappedDestEOA = _shardusWrappedAccount(destEOA);
  const wrappedSecureAccount = _shardusWrappedAccount(secureAccount);

  shardus.applyResponseAddChangedAccount(
    applyResponse,
    crackedData.involvedAccounts.sourceFunds,
    wrappedSourceEOA as ShardusTypes.WrappedResponse,
    crackedData.txId,
    applyResponse.txTimestamp
  );
  shardus.applyResponseAddChangedAccount(
    applyResponse,
    crackedData.involvedAccounts.recipientFunds,
    wrappedDestEOA as ShardusTypes.WrappedResponse,
    crackedData.txId,
    applyResponse.txTimestamp
  );
  shardus.applyResponseAddChangedAccount(
    applyResponse,
    crackedData.involvedAccounts.secureAccount,
    wrappedSecureAccount as ShardusTypes.WrappedResponse,
    crackedData.txId,
    applyResponse.txTimestamp
  );

  // Create the receipt data
  const readableReceipt: ReadableReceipt = {
    status: 1, 
    transactionHash: crackedData.txId,
    transactionIndex: '0x0',
    blockHash: '', 
    blockNumber: '0x0',
    from: crackedData.involvedAccounts.sourceFunds,
    to: crackedData.involvedAccounts.recipientFunds,
    contractAddress: null,
    cumulativeGasUsed: '0x0',
    gasUsed: '0x0',
    logs: [],
    logsBloom: '0x',
    type: '0x0',
    // Additional fields for TransferFromSecureAccount
    value: tx.amount,
    nonce: `0x${tx.nonce.toString(16)}`, 
    gasRefund: '0x0',
    data: '', 
  };

  const wrappedReceiptAccount: WrappedEVMAccount = {
    timestamp: applyResponse.txTimestamp,
    ethAddress: crackedData.txId, // Using txId as ethAddress for the receipt
    hash: '',
    readableReceipt,
    amountSpent: '0x0',
    txId: crackedData.txId,
    accountType: AccountType.SecureAccount,
    txFrom: crackedData.involvedAccounts.sourceFunds,
  };

  const receiptShardusAccount = _shardusWrappedAccount(wrappedReceiptAccount);
  
  shardus.applyResponseAddReceiptData(
    applyResponse,
    receiptShardusAccount,
    crypto.hashObj(receiptShardusAccount)
  );
}
