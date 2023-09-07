import { AccessListEIP2930Transaction, Transaction } from '@ethereumjs/tx'
import { Account, Address, BN } from 'ethereumjs-util'
import { oneSHM } from '../../shardeum/shardeumConstants'
import { ShardeumState } from '../state'
import { networkAccount } from '../evmSetup'
import { getOrCreateBlockFromTimestamp } from '../block/blockchain'
import { AccountType, WrappedEVMAccount } from '../../shardeum/shardeumTypes'
import { fixDeserializedWrappedEVMAccount } from '../../shardeum/wrappedEVMAccountFunctions'
import * as AccountsStorage from '../db'

function wrapTransaction(transaction: Transaction, impl: () => Address): Transaction {
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
  let transaction: Transaction | AccessListEIP2930Transaction = Transaction.fromTxData(txData)
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

  const callerEVMAddress = transaction.getSenderAddress().toString()
  const callerAccount = await AccountsStorage.getAccount(callerEVMAddress)

  const fakeAccountData = {
    nonce: 0,
    balance: oneSHM.mul(new BN(100)), // 100 SHM.  This is a temporary account that will never exist.
  }
  const fakeAccount = Account.fromAccountData(fakeAccountData)
  preRunTxState._transactionState.insertFirstAccountReads(
    transaction.getSenderAddress(),
    callerAccount ? callerAccount.account : fakeAccount
  )

  EVM.stateManager = null
  EVM.stateManager = preRunTxState

  const blockForTx = getOrCreateBlockFromTimestamp(0)

  const runTxResult = await EVM.runTx({
    block: blockForTx,
    tx: transaction,
    skipNonce: true,
    networkAccount: networkAccount.data,
  })
  const estimatedGasRequired = new BN(runTxResult.gasUsed)
  if (runTxResult.execResult.gasRefund) {
    estimatedGasRequired.iadd(runTxResult.execResult.gasRefund)
  }
  // Add 5% buffer to the gas estimate
  estimatedGasRequired.imuln(1.05)
  console.log(`0x${estimatedGasRequired.toString(16)}`)
}
