import { AccessListEIP2930Transaction, LegacyTransaction } from '@ethereumjs/tx'
import { Account, Address } from '@ethereumjs/util'
import { ShardeumState } from '../state'
import { evmCommon, networkAccount } from '../evmSetup'
import { EVM as EthereumVirtualMachine } from '../../evm_v2'
import { getOrCreateBlockFromTimestamp } from '../block/blockchain'
import { AccountType, WrappedEVMAccount } from '../../shardeum/shardeumTypes'
import { fixDeserializedWrappedEVMAccount, predictContractAddress } from '../utils/wrappedEVMAccountFunctions'
import * as AccountsStorage from '../db'
import { toShardusAddress } from '../utils/evmAddress'
import { createAccount } from '../replayTX'
import { getTxSenderAddress } from '../../utils'

export const oneSHM = BigInt(10) ** BigInt(18)

function wrapTransaction(transaction: LegacyTransaction, impl: () => Address): LegacyTransaction {
  return new Proxy(transaction, {
    get: function (target, prop, receiver): any {
      if (prop === 'getSenderAddress') {
        return impl
      }
      return Reflect.get(target, prop, receiver)
    },
  })
}

export async function estimateGas(
  txData,
  preRunTxState: ShardeumState,
  wrappedStates: Map<string, WrappedEVMAccount>,
  EVM
): Promise<void> {
  let transaction: LegacyTransaction | AccessListEIP2930Transaction = LegacyTransaction.fromTxData(txData)
  const senderAddress = getTxSenderAddress(transaction).address
  const from = txData.from !== undefined ? Address.fromString(txData.from) : Address.zero()
  transaction = wrapTransaction(transaction, (): Address => {
    return from
  })

  for (const accountId in wrappedStates) {
    // eslint-disable-next-line security/detect-object-injection
    const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[accountId] as WrappedEVMAccount
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
    let address
    if (wrappedEVMAccount.accountType === AccountType.ContractCode)
      address = Address.fromString(wrappedEVMAccount.contractAddress)
    else address = Address.fromString(wrappedEVMAccount.ethAddress)

    if (wrappedEVMAccount.accountType === AccountType.Account) {
      preRunTxState._transactionState.insertFirstAccountReads(address, wrappedEVMAccount.account)
    } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
      preRunTxState._transactionState.insertFirstContractBytesReads(address, wrappedEVMAccount.codeByte)
    } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
      preRunTxState._transactionState.insertFirstContractStorageReads(
        address,
        wrappedEVMAccount.key,
        wrappedEVMAccount.value
      )
    }
  }

  if (transaction.to == null) {
    // console.log(JSON.stringify({ status: true, message: `creating new account`, wrappedStates }))
    const senderEvmAddress = senderAddress.toString()
    const senderShardusAddress = toShardusAddress(senderEvmAddress, AccountType.Account)
    const senderWrappedEVMAccount = AccountsStorage.getAccount(senderShardusAddress) as WrappedEVMAccount
    if (senderWrappedEVMAccount) {
      fixDeserializedWrappedEVMAccount(senderWrappedEVMAccount)
      const predictedContractAddressString =
        '0x' + predictContractAddress(senderWrappedEVMAccount).toString('hex')
      const createdAccount: WrappedEVMAccount = await createAccount(predictedContractAddressString)
      AccountsStorage.addCreatedAccount(predictedContractAddressString, createdAccount)
      preRunTxState._transactionState.insertFirstAccountReads(
        Address.fromString(predictedContractAddressString),
        createdAccount.account
      )
    }
  }

  const callerEVMAddress = senderAddress.toString()
  const callerAccount = await AccountsStorage.getAccount(callerEVMAddress)

  const fakeAccountData = {
    nonce: 0,
    balance: oneSHM * BigInt(100), // 100 SHM.  This is a temporary account that will never exist.
  }
  const fakeAccount = Account.fromAccountData(fakeAccountData)
  preRunTxState._transactionState.insertFirstAccountReads(
    senderAddress,
    callerAccount ? callerAccount.account : fakeAccount
  )

  const customEVM = new EthereumVirtualMachine({
    common: evmCommon,
    stateManager: preRunTxState,
  })

  EVM.stateManager = null
  // EVM.evm.stateManager = null
  // EVM.evm.journal.stateManager = null

  EVM.stateManager = preRunTxState
  // EVM.evm.stateManager = preRunTxState
  // EVM.evm.journal.stateManager = preRunTxState

  const blockForTx = getOrCreateBlockFromTimestamp(0)

  const runTxResult = await EVM.runTx(
    {
      block: blockForTx,
      tx: transaction,
      skipNonce: true,
      skipBalance: true,
      networkAccount: networkAccount.data,
    },
    customEVM
  )
  let estimatedGasRequired = BigInt(runTxResult.totalGasSpent)
  const gasRefund = runTxResult.execResult.gasRefund ? BigInt(runTxResult.execResult.gasRefund) : BigInt(0)
  // Add gasRefund to estimatedGasRequired
  estimatedGasRequired += gasRefund
  console.log(`0x${estimatedGasRequired.toString(16)}`)
}
