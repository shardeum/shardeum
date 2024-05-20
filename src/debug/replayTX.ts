import fs from 'fs'
import { getInjectedOrGeneratedTimestamp, getTransactionObj, hashSignedObj } from '../setup/helpers'
import { AccessListEIP2930Transaction, LegacyTransaction } from '@ethereumjs/tx'
import type { InterpreterStep } from '@ethereumjs/evm'
import { Address, bytesToHex, Account } from '@ethereumjs/util'
import { toShardusAddressWithKey, toShardusAddress } from './utils/evmAddress'
import { AccountType, OperatorAccountInfo, WrappedEVMAccount } from '../shardeum/shardeumTypes'
import { ShardeumState, TransactionState } from './state'
import { shardeumStateTXMap, evmCommon, initEVMSingletons, EVM, networkAccount } from '../debug/evmSetup'
import { loadStatesFromJson, accounts, hasAccount, getKey } from './db'
import { fixDeserializedWrappedEVMAccount, predictContractAddress } from './utils/wrappedEVMAccountFunctions'
import { getOrCreateBlockFromTimestamp } from './block/blockchain'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { TraceStorageMap } from './trace/traceStorageMap'
import { TraceDataFactory, ITraceData } from './trace/traceDataFactory'
import * as AccountsStorage from './db'
import * as WrappedEVMAccountFunctions from './utils/wrappedEVMAccountFunctions'
import { estimateGas } from './estimateGas/estimateGas'
import { EVM as EthereumVirtualMachine } from '../evm_v2'
import { getTxSenderAddress } from '../utils'
import { Utils } from '@shardus/types'

export async function createAccount(addressStr: string, balance = BigInt(0)): Promise<WrappedEVMAccount> {
  // if (ShardeumFlags.VerboseLogs) console.log('Creating new account', addressStr)

  const acctData = {
    nonce: 0,
    balance: balance, // 100 SHM in debug mode.  0 SHM in release mode
  }
  const account = Account.fromAccountData(acctData)
  // await stateManager.putAccount(accountAddress, account)
  // const updatedAccount = await stateManager.getAccount(accountAddress)

  const wrappedEVMAccount = {
    timestamp: 0,
    account: account,
    ethAddress: addressStr,
    hash: '',
    accountType: AccountType.Account,
  }
  WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
  return wrappedEVMAccount
}

function getApplyTXState(txId: string, estimateOnly: boolean): ShardeumState {
  let shardeumState = shardeumStateTXMap.get(txId)
  if (shardeumState == null) {
    shardeumState = new ShardeumState({ common: evmCommon })
    const transactionState = new TransactionState()
    transactionState.initData(
      shardeumState,
      {
        storageMiss: async () => {
          // Only missing contractBytes will reach here
          // console.log(
          //   Utils. safeStringify({
          //     status: 'error',
          //     type: AccountType.ContractCode,
          //     address,
          //   })
          // ) The correct shardus key for missing CB should be printed by tryGetRemoteAccountCB before this
          return true
        },
        contractStorageMiss: async () => {
          return false
        },
        accountInvolved: (txState: TransactionState, address: string) => {
          // Missing EOA/CA (Type 0) will halt here
          const { found, shardusKey } = hasAccount(address)
          if (!found) {
            console.log(
              Utils.safeStringify({
                status: 'error',
                type: AccountType.Account,
                shardusKey,
              })
            )
            return false
          }
          return true
        },
        contractStorageInvolved: (txState: TransactionState, address: string, key: string) => {
          const { account, shardusKey } = getKey(address, key, AccountType.ContractStorage)
          if (!account) {
            if (estimateOnly) {
              console.log(
                Utils.safeStringify({
                  status: 'error',
                  type: AccountType.ContractStorage,
                  address,
                  key,
                  shardusKey,
                })
              )
              return false
            }
            return true // Always return true so that blank accounts are created for missing accounts
          }
          return true
        },
        tryGetRemoteAccountCB: async (
          transactionState: TransactionState,
          type: AccountType,
          address: string,
          key: string
        ) => {
          const { account, shardusKey } = getKey(address, key, type)
          if (!account && type != AccountType.ContractStorage) {
            console.log(
              Utils.safeStringify({
                status: 'error',
                type,
                address,
                key,
                shardusKey,
              })
            )
          }
          return account
        },
        monitorEventCB: () => {
          console.log('Inside monitorEventCB callback')
          return undefined
        },
      },
      txId,
      undefined,
      undefined
    )
    shardeumState.setTransactionState(transactionState)
    shardeumStateTXMap.set(txId, shardeumState)
  }
  return shardeumState
}

const runTransaction = async (
  txJson,
  wrappedStates: Map<string, WrappedEVMAccount>,
  execOptions: { structLogs: boolean; gasEstimate: boolean },
  estimateOnly: boolean
): Promise<void> => {
  if (estimateOnly) {
    const preRunState = getApplyTXState('0', estimateOnly)
    await estimateGas(txJson, preRunState, wrappedStates, EVM)
    return
  }
  const tx = txJson
  const txTimestamp = getInjectedOrGeneratedTimestamp({ tx: tx })
  const transaction: LegacyTransaction | AccessListEIP2930Transaction = getTransactionObj(tx)
  const senderAddress = getTxSenderAddress(transaction).address
  const ethTxId = bytesToHex(transaction.hash())
  const shardusReceiptAddress = toShardusAddressWithKey(ethTxId, '', AccountType.Receipt)
  const txId = hashSignedObj(tx)
  const shardeumState = getApplyTXState(txId, estimateOnly)
  // TODO: Do I set appData in above shardeumState?

  const validatorStakedAccounts: Map<string, OperatorAccountInfo> = new Map()
  for (const accountId in wrappedStates) {
    if (shardusReceiptAddress === accountId) {
      //have to skip the created receipt account
      continue
    }

    // eslint-disable-next-line security/detect-object-injection
    const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[accountId] as WrappedEVMAccount
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
    let address
    if (wrappedEVMAccount.accountType === AccountType.ContractCode)
      address = Address.fromString(wrappedEVMAccount.contractAddress)
    else address = Address.fromString(wrappedEVMAccount.ethAddress)

    if (wrappedEVMAccount.accountType === AccountType.Account) {
      shardeumState._transactionState.insertFirstAccountReads(address, wrappedEVMAccount.account)
      if (wrappedEVMAccount.operatorAccountInfo) {
        validatorStakedAccounts.set(wrappedEVMAccount.ethAddress, wrappedEVMAccount.operatorAccountInfo)
      }
    } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
      shardeumState._transactionState.insertFirstContractBytesReads(address, wrappedEVMAccount.codeByte)
    } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
      shardeumState._transactionState.insertFirstContractStorageReads(
        address,
        wrappedEVMAccount.key,
        wrappedEVMAccount.value
      )
    }
  }

  // Create new CA account if it is a contract deploy tx
  if (transaction.to == null) {
    const senderEvmAddress = senderAddress.toString()
    const senderShardusAddress = toShardusAddress(senderEvmAddress, AccountType.Account)
    const senderWrappedEVMAccount = AccountsStorage.getAccount(senderShardusAddress) as WrappedEVMAccount
    if (senderWrappedEVMAccount) {
      fixDeserializedWrappedEVMAccount(senderWrappedEVMAccount)
      const predictedContractAddressString =
        '0x' + predictContractAddress(senderWrappedEVMAccount).toString('hex')
      const createdAccount: WrappedEVMAccount = await createAccount(predictedContractAddressString)
      shardeumState._transactionState.insertFirstAccountReads(
        Address.fromString(predictedContractAddressString),
        createdAccount.account
      )
      AccountsStorage.addCreatedAccount(predictedContractAddressString, createdAccount)
    }
  }

  const blockForTx = getOrCreateBlockFromTimestamp(txTimestamp)

  const customEVM = new EthereumVirtualMachine({
    common: evmCommon,
    stateManager: shardeumState,
  })

  EVM.stateManager = null
  // EVM.evm.stateManager = null
  // EVM.evm.journal.stateManager = null

  EVM.stateManager = shardeumState
  // EVM.evm.stateManager = shardeumState
  // EVM.evm.journal.stateManager = shardeumState

  let gas = BigInt(0)
  const structLogs = []
  const TraceData = TraceDataFactory()
  const options = {
    disableMemory: false,
    disableStack: false,
    disableStorage: false,
  }
  let currentDepth = -1
  const storageStack: TraceStorageMap[] = []

  const stepListener = async (
    event: InterpreterStep,
    next: (error?: Error | null, cb?: () => void) => void
  ): Promise<void> => {
    try {
      const totalGasUsedAfterThisStep = transaction.gasLimit - event.gasLeft
      const gasUsedPreviousStep = totalGasUsedAfterThisStep - gas
      gas += gasUsedPreviousStep

      const memory: ITraceData[] = []
      if (options.disableMemory !== true) {
        // We get the memory as one large array.
        // Let's cut it up into 32 byte chunks as required by the spec.
        let index = 0
        while (index < event.memory.length) {
          const slice = event.memory.slice(index, index + 32)
          memory.push(TraceData.from(Buffer.from(slice)))
          index += 32
        }
      }

      const stack: ITraceData[] = []
      if (options.disableStack !== true) {
        for (const stackItem of event.stack) {
          const traceData = TraceData.from(Buffer.from(stackItem.toString(16), 'hex'))
          stack.push(traceData)
        }
      }

      const structLog = {
        depth: event.depth + 1,
        error: '',
        gas: event.gasLeft,
        gasCost: 0,
        memory,
        op: event.opcode.name,
        pc: event.pc,
        stack,
        storage: null,
      }

      // The gas difference calculated for each step is indicative of gas consumed in
      // the previous step. Gas consumption in the final step will always be zero.
      if (structLogs.length) {
        structLogs[structLogs.length - 1].gasCost = gasUsedPreviousStep
      }

      if (options.disableStorage === true) {
        // Add the struct log as is - nothing more to do.
        structLogs.push(structLog)
        next()
      } else {
        const { depth: eventDepth } = event
        if (currentDepth > eventDepth) {
          storageStack.pop()
        } else if (currentDepth < eventDepth) {
          storageStack.push(new TraceStorageMap())
        }

        currentDepth = eventDepth

        switch (event.opcode.name) {
          case 'SSTORE': {
            const key = stack[stack.length - 1]
            const value = stack[stack.length - 2]

            // new TraceStorageMap() here creates a shallow clone, to prevent other steps from overwriting
            // eslint-disable-next-line security/detect-object-injection
            structLog.storage = new TraceStorageMap(storageStack[eventDepth])

            // Tell vm to move on to the next instruction. See below.
            structLogs.push(structLog)
            next()

            // assign after callback because this storage change actually takes
            // effect _after_ this opcode executes
            // eslint-disable-next-line security/detect-object-injection
            storageStack[eventDepth].set(key, value)
            break
          }
          case 'SLOAD': {
            const key = stack[stack.length - 1]
            const result = await EVM.stateManager.getContractStorage(event.address, key.toBuffer())
            const value = TraceData.from(result)
            // eslint-disable-next-line security/detect-object-injection
            storageStack[eventDepth].set(key, value)

            // new TraceStorageMap() here creates a shallow clone, to prevent other steps from overwriting
            // eslint-disable-next-line security/detect-object-injection
            structLog.storage = new TraceStorageMap(storageStack[eventDepth])
            structLogs.push(structLog)
            next()
            break
          }
          default:
            // new TraceStorageMap() here creates a shallow clone, to prevent other steps from overwriting
            // eslint-disable-next-line security/detect-object-injection
            structLog.storage = new TraceStorageMap(storageStack[eventDepth])
            structLogs.push(structLog)
            next()
        }
      }
    } catch (e) {
      console.log('Error in stepListener', e)
    }
  }

  customEVM.events.on('step', stepListener)
  await EVM.runTx(
    {
      block: blockForTx,
      tx: transaction,
      skipNonce: true,
      networkAccount: networkAccount.data,
    },
    customEVM
  )
  if (execOptions.structLogs) {
    console.log(Utils.safeStringify(structLogs))
  }
}

const parseCommandLineArgs = (): { file: string; options: { structLogs: boolean; gasEstimate: boolean } } => {
  const args = process.argv.slice(2) // Remove 'node' and the script name

  const options = {
    structLogs: false,
    gasEstimate: false,
  }

  const fileName = args.filter((arg) => !arg.startsWith('-'))
  if (fileName.length !== 1) {
    console.log('Please provide a file to replay')
    process.exit(1)
  }
  const file = fileName[0]

  const flags = args.filter((arg) => arg.startsWith('-'))

  for (let i = 0; i < flags.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const arg = flags[i]
    switch (arg) {
      case '--struct-logs':
      case '-s':
        options.structLogs = true
        break
      case '--gas-estimate':
      case '-g':
        options.gasEstimate = true
        break
      default:
        // Handle unrecognized arguments or provide usage instructions
        console.log(`Unrecognized argument: ${arg}`)
        break
    }
  }

  return { file, options }
}

const { file, options } = parseCommandLineArgs()
ShardeumFlags.VerboseLogs = process.env.VERBOSE_LOGS === 'true'
if (!file) {
  console.log('Please provide a file to replay')
  process.exit(1)
} else {
  initEVMSingletons()
    .then(() => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (!fs.existsSync(file)) {
        throw new Error('File not found')
      }
      const estimateOnly = loadStatesFromJson(file)
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const txJson = Utils.safeJsonParse(fs.readFileSync(file, 'utf8'))
      const transaction = estimateOnly ? txJson.txData : txJson.tx.originalTxData
      return runTransaction(transaction, accounts, options, estimateOnly)
    })
    .then(() => {
      // TODO: Utilize the original TX account data to verify
      // if the TX run was successful and throw a return code accordingly
      if (!options.structLogs) console.log('Done')
    })
    .catch((err) => {
      console.error('Error', err)
      process.exit(1)
    })
}
