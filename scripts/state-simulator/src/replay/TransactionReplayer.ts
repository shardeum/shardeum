import ShardeumState from '../../../../dist/src/state/shardeumState'
import TransactionState from '../../../../dist/src/state/transactionState'
import { Address, Account } from '@ethereumjs/util'
import { DatabaseInterface } from '../database/DatabaseInterface'
import { TransactionData, ReceiptData, AccountData } from '../types'
import { fixDeserializedWrappedEVMAccount } from '../../../../dist/src/shardeum/wrappedEVMAccountFunctions'
import { AccountType, WrappedEVMAccount, NetworkAccount } from '../../../../dist/src/shardeum/shardeumTypes'
import { calculateGasPrice, scaleByStabilityFactor } from '../../../../dist/src/utils'
import { ShardeumFlags } from '../../../../dist/src/shardeum/shardeumFlags'
import chalk from 'chalk'

export interface ReplayResult {
  transactionId: string
  success: boolean
  gasUsed: bigint
  gasRefund: bigint
  totalGasSpent: bigint
  txCost: bigint
  minerReward: bigint
  stateChanges: Map<string, StateChange>
  error?: string
}

export interface StateChange {
  accountId: string
  ethAddress: string
  balanceBefore: bigint
  balanceAfter: bigint
  balanceChange: bigint
  nonceBefore: bigint
  nonceAfter: bigint
}

export class TransactionReplayer {
  private state: ShardeumState
  private transactionState: TransactionState
  private networkAccount: NetworkAccount | null = null

  constructor(private db: DatabaseInterface) {
    // Initialize with empty state - we'll load accounts as needed
    this.state = new ShardeumState()
    this.transactionState = new TransactionState()

    // Initialize TransactionState with required callbacks
    const callbacks = {
      storageMiss: async () => false,
      contractStorageMiss: async () => false,
      accountInvolved: () => true,
      contractStorageInvolved: () => true,
      tryGetRemoteAccountCB: async () => null,
      monitorEventCB: () => {},
    }

    this.transactionState.initData(this.state, callbacks, 'simulation-tx-' + Date.now(), new Map(), new Map())

    // CRITICAL: ShardeumState requires a TransactionState to be set for account operations
    this.state.setTransactionState(this.transactionState)
    console.log(chalk.gray('Initialized ShardeumState with properly configured TransactionState'))
  }

  /**
   * Set the network account for gas price calculations
   */
  setNetworkAccount(networkAccount: NetworkAccount): void {
    this.networkAccount = networkAccount
  }

  /**
   * Initialize state with accounts from a specific cycle
   */
  async initializeStateFromCycle(cycle: number): Promise<void> {
    console.log(chalk.blue(`Initializing state from cycle ${cycle}...`))

    const accounts = this.db.getAccountsByCycle(cycle)
    let loadedCount = 0

    for (const accountData of accounts) {
      try {
        const wrappedAccount = JSON.parse(accountData.data) as WrappedEVMAccount

        // Pre-process custom serialization BEFORE calling fixDeserializedWrappedEVMAccount
        if (wrappedAccount.accountType === AccountType.Account && wrappedAccount.account) {
          // Handle custom BigInt serialization format
          if (
            wrappedAccount.account.nonce &&
            typeof wrappedAccount.account.nonce === 'object' &&
            (wrappedAccount.account.nonce as any).dataType === 'bi'
          ) {
            ;(wrappedAccount.account as any).nonce = '0x' + (wrappedAccount.account.nonce as any).value
          }
          if (
            wrappedAccount.account.balance &&
            typeof wrappedAccount.account.balance === 'object' &&
            (wrappedAccount.account.balance as any).dataType === 'bi'
          ) {
            ;(wrappedAccount.account as any).balance = '0x' + (wrappedAccount.account.balance as any).value
          }

          // Handle Uint8Array base64 serialization
          if (
            wrappedAccount.account.codeHash &&
            typeof wrappedAccount.account.codeHash === 'object' &&
            (wrappedAccount.account.codeHash as any).dataType === 'u8ab'
          ) {
            ;(wrappedAccount.account as any).codeHash = Buffer.from(
              (wrappedAccount.account.codeHash as any).value,
              'base64'
            )
          }
          if (
            wrappedAccount.account.storageRoot &&
            typeof wrappedAccount.account.storageRoot === 'object' &&
            (wrappedAccount.account.storageRoot as any).dataType === 'u8ab'
          ) {
            ;(wrappedAccount.account as any).storageRoot = Buffer.from(
              (wrappedAccount.account.storageRoot as any).value,
              'base64'
            )
          }
        }

        fixDeserializedWrappedEVMAccount(wrappedAccount)

        if (wrappedAccount.accountType === AccountType.Account && wrappedAccount.account) {
          const address = Address.fromString(wrappedAccount.ethAddress)
          await this.state.putAccount(address, wrappedAccount.account as any)

          // Immediately verify the account can be retrieved
          const retrievedAccount = await this.state.getAccount(address)
          const verifyStatus = retrievedAccount ? 'verified' : 'FAILED_TO_RETRIEVE'
          console.log(chalk.gray(`    Stored account ${wrappedAccount.ethAddress} in state: ${verifyStatus}`))

          if (retrievedAccount) {
            console.log(chalk.gray(`      Balance: ${retrievedAccount.balance?.toString()}`))
            console.log(chalk.gray(`      Nonce: ${retrievedAccount.nonce?.toString()}`))
            loadedCount++
          } else {
            console.log(chalk.red(`      CRITICAL ERROR: Cannot retrieve account immediately after storing!`))
          }
        }
      } catch (error) {
        // Add more specific error information for debugging
        if (error.message === 'invalid type') {
          console.error(chalk.red(`Failed to load account ${accountData.accountId}: ${error.message}`))
          console.error(chalk.yellow(`  Error stack: ${error.stack}`))
        } else {
          console.error(chalk.red(`Failed to load account ${accountData.accountId}: ${error.message}`))
        }
      }
    }

    console.log(chalk.green(`Loaded ${loadedCount} accounts into state`))
  }

  /**
   * Load specific account into state
   */
  async loadAccount(accountId: string): Promise<boolean> {
    const accountData = this.db.getAccount(accountId)
    if (!accountData) return false

    try {
      const wrappedAccount = JSON.parse(accountData.data) as WrappedEVMAccount

      // Pre-process custom serialization BEFORE calling fixDeserializedWrappedEVMAccount
      if (wrappedAccount.accountType === AccountType.Account && wrappedAccount.account) {
        // Handle custom BigInt serialization format
        if (
          wrappedAccount.account.nonce &&
          typeof wrappedAccount.account.nonce === 'object' &&
          (wrappedAccount.account.nonce as any).dataType === 'bi'
        ) {
          ;(wrappedAccount.account as any).nonce = '0x' + (wrappedAccount.account.nonce as any).value
        }
        if (
          wrappedAccount.account.balance &&
          typeof wrappedAccount.account.balance === 'object' &&
          (wrappedAccount.account.balance as any).dataType === 'bi'
        ) {
          ;(wrappedAccount.account as any).balance = '0x' + (wrappedAccount.account.balance as any).value
        }

        // Handle Uint8Array base64 serialization
        if (
          wrappedAccount.account.codeHash &&
          typeof wrappedAccount.account.codeHash === 'object' &&
          (wrappedAccount.account.codeHash as any).dataType === 'u8ab'
        ) {
          ;(wrappedAccount.account as any).codeHash = Buffer.from(
            (wrappedAccount.account.codeHash as any).value,
            'base64'
          )
        }
        if (
          wrappedAccount.account.storageRoot &&
          typeof wrappedAccount.account.storageRoot === 'object' &&
          (wrappedAccount.account.storageRoot as any).dataType === 'u8ab'
        ) {
          ;(wrappedAccount.account as any).storageRoot = Buffer.from(
            (wrappedAccount.account.storageRoot as any).value,
            'base64'
          )
        }
      }

      fixDeserializedWrappedEVMAccount(wrappedAccount)

      if (wrappedAccount.accountType === AccountType.Account && wrappedAccount.account) {
        const address = Address.fromString(wrappedAccount.ethAddress)
        await this.state.putAccount(address, wrappedAccount.account as any)

        // Immediately verify the account can be retrieved
        const retrievedAccount = await this.state.getAccount(address)
        const verifyStatus = retrievedAccount ? 'verified' : 'FAILED_TO_RETRIEVE'
        console.log(chalk.gray(`    Stored account ${wrappedAccount.ethAddress} in state: ${verifyStatus}`))

        if (retrievedAccount) {
          console.log(chalk.gray(`      Balance: ${retrievedAccount.balance?.toString()}`))
          console.log(chalk.gray(`      Nonce: ${retrievedAccount.nonce?.toString()}`))
          return true
        } else {
          console.log(chalk.red(`      CRITICAL ERROR: Cannot retrieve account immediately after storing!`))
          return false
        }
      }
    } catch (error) {
      // Add more specific error information for debugging
      if (error.message === 'invalid type') {
        console.error(chalk.red(`Failed to load account ${accountId}: ${error.message}`))
        console.error(chalk.yellow(`  Error stack: ${error.stack}`))
      } else {
        console.error(chalk.red(`Failed to load account ${accountId}: ${error.message}`))
      }
    }
    return false
  }

  async replayTransaction(
    txId: string,
    forceSuccess: boolean = false,
    affectedAccounts?: string[]
  ): Promise<ReplayResult> {
    const transaction = this.db.getTransaction(txId)
    const receipt = this.db.getReceipt(txId)

    if (!transaction || !receipt) {
      return {
        transactionId: txId,
        success: false,
        gasUsed: BigInt(0),
        gasRefund: BigInt(0),
        totalGasSpent: BigInt(0),
        txCost: BigInt(0),
        minerReward: BigInt(0),
        stateChanges: new Map(),
        error: 'Transaction or receipt not found',
      }
    }

    const txData = JSON.parse(transaction.data)
    const signedReceipt = JSON.parse(receipt.signedReceipt)
    const originalStatus = signedReceipt.readableReceipt?.status || 0

    console.log(chalk.cyan(`\nReplaying transaction ${txId}:`))
    console.log(chalk.gray(`  Original status: ${originalStatus === 1 ? 'Success' : 'Failed'}`))
    console.log(chalk.gray(`  Force success: ${forceSuccess}`))

    // Track state changes
    const stateChanges = new Map<string, StateChange>()

    try {
      let fromAddress: Address | null = null
      let toAddress: Address | null = null
      let fromAddressStr: string | null = null
      let toAddressStr: string | null = null

      if (txData.from) {
        fromAddressStr = txData.from
        fromAddress = Address.fromString(txData.from)
      } else if (txData.readableReceipt?.from) {
        fromAddressStr = txData.readableReceipt.from
        fromAddress = Address.fromString(txData.readableReceipt.from)
      }

      if (txData.to) {
        toAddressStr = txData.to
        toAddress = Address.fromString(txData.to)
      } else if (txData.readableReceipt?.to) {
        toAddressStr = txData.readableReceipt.to
        toAddress = Address.fromString(txData.readableReceipt.to)
      }

      console.log(chalk.gray(`  From: ${fromAddress?.toString() || 'null'}`))
      console.log(chalk.gray(`  To: ${toAddress?.toString() || 'null'}`))

      const findAccount = async (address: Address, rawAddressStr: string) => {
        const account = await this.state.getAccount(address)
        console.log(chalk.gray(`    Looking up ${address.toString()}: ${account ? 'found' : 'not found'}`))
        return account
      }

      if (fromAddress && fromAddressStr) {
        const fromAccount = await findAccount(fromAddress, fromAddressStr)
        console.log(chalk.gray(`  From account: ${fromAccount ? 'found' : 'null/undefined'}`))
        if (fromAccount) {
          console.log(chalk.gray(`    Balance: ${fromAccount.balance?.toString() || 'undefined'}`))
          console.log(chalk.gray(`    Nonce: ${fromAccount.nonce?.toString() || 'undefined'}`))
        }

        if (fromAccount?.balance !== undefined) {
          const accountId = `${fromAddress.toString()}_0`
          stateChanges.set(accountId, {
            accountId,
            ethAddress: fromAddress.toString(),
            balanceBefore: fromAccount.balance,
            balanceAfter: fromAccount.balance,
            balanceChange: BigInt(0),
            nonceBefore: fromAccount.nonce,
            nonceAfter: fromAccount.nonce,
          })
        } else {
          console.log(chalk.yellow(`  Warning: From account not found in state`))
        }
      }

      if (toAddress && toAddressStr) {
        const toAccount = await findAccount(toAddress, toAddressStr)
        console.log(chalk.gray(`  To account: ${toAccount ? 'found' : 'null/undefined'}`))
        if (toAccount) {
          const accountId = `${toAddress.toString()}_0`
          stateChanges.set(accountId, {
            accountId,
            ethAddress: toAddress.toString(),
            balanceBefore: toAccount.balance,
            balanceAfter: toAccount.balance,
            balanceChange: BigInt(0),
            nonceBefore: toAccount.nonce,
            nonceAfter: toAccount.nonce,
          })
        }
      }

      const value = BigInt(txData.value || txData.readableReceipt?.value || '0')
      const gasLimit = BigInt(txData.gas || txData.gasLimit || txData.readableReceipt?.gasLimit || '21000')

      let gasPrice: bigint
      if (this.networkAccount && ShardeumFlags.baselineTxFee && ShardeumFlags.baselineTxGasUsage) {
        gasPrice = calculateGasPrice(ShardeumFlags.baselineTxFee, ShardeumFlags.baselineTxGasUsage, this.networkAccount)
      } else {
        gasPrice = BigInt(txData.gasPrice || txData.maxFeePerGas || txData.readableReceipt?.gasPrice || '0')
      }

      const txBaseFee = BigInt(21000)

      let gasUsed = txBaseFee
      let gasRefund = BigInt(0)
      let success = forceSuccess || originalStatus === 1

      let txCost: bigint
      if (ShardeumFlags.chargeConstantTxFee && this.networkAccount) {
        const baseTxCost = BigInt(ShardeumFlags.constantTxFeeUsd)
        txCost = scaleByStabilityFactor(baseTxCost, this.networkAccount)
      } else {
        txCost = gasLimit * gasPrice
      }

      if (fromAddress && fromAddressStr) {
        const fromAccount = await findAccount(fromAddress, fromAddressStr)
        if (fromAccount) {
          const upfrontCost = value + txCost

          console.log(chalk.gray(`  Value: ${value.toString()}`))
          console.log(chalk.gray(`  Gas cost: ${txCost.toString()}`))
          console.log(chalk.gray(`  From balance: ${fromAccount.balance.toString()}`))
          console.log(chalk.gray(`  Required: ${upfrontCost.toString()}`))

          if (fromAccount.balance < upfrontCost) {
            if (!forceSuccess) {
              success = false
              console.log(chalk.yellow(`  Insufficient balance for transfer`))
            } else {
              console.log(chalk.yellow(`  Insufficient balance but forcing success`))
            }
          }
        } else {
          console.log(chalk.yellow(`  Cannot check balance - from account not found`))
          if (!forceSuccess) {
            success = false
          }
        }
      }

      if (success && fromAddress && fromAddressStr) {
        const fromAccount = await findAccount(fromAddress, fromAddressStr)

        if (fromAccount) {
          await this.state.putAccount(
            fromAddress,
            Account.fromAccountData({
              ...fromAccount,
              balance: fromAccount.balance - txCost - value,
              nonce: fromAccount.nonce + BigInt(1),
            })
          )

          if (toAddress && toAddressStr && value > BigInt(0)) {
            const toAccount = await findAccount(toAddress, toAddressStr)
            if (toAccount) {
              await this.state.putAccount(
                toAddress,
                Account.fromAccountData({
                  ...toAccount,
                  balance: toAccount.balance + value,
                })
              )
            }
          }
        }

        const totalGasSpent = gasUsed

        let actualTxCost: bigint
        if (ShardeumFlags.chargeConstantTxFee && this.networkAccount) {
          actualTxCost = txCost // No refund in constant fee mode
        } else {
          actualTxCost = totalGasSpent * gasPrice
          const refund = txCost - actualTxCost
          if (refund > BigInt(0)) {
            const updatedFromAccount = await findAccount(fromAddress, fromAddressStr)
            if (updatedFromAccount) {
              await this.state.putAccount(
                fromAddress,
                Account.fromAccountData({
                  ...updatedFromAccount,
                  balance: updatedFromAccount.balance + refund,
                })
              )
              gasRefund = refund
            }
          }
        }

        const minerReward = actualTxCost

        gasUsed = totalGasSpent
      }

      if (fromAddress && fromAddressStr) {
        const fromAccount = await findAccount(fromAddress, fromAddressStr)
        const change = stateChanges.get(`${fromAddress.toString()}_0`)
        if (change && fromAccount) {
          change.balanceAfter = fromAccount.balance
          change.balanceChange = change.balanceAfter - change.balanceBefore
          change.nonceAfter = fromAccount.nonce
        }
      }

      if (toAddress && toAddressStr) {
        const toAccount = await findAccount(toAddress, toAddressStr)
        const change = stateChanges.get(`${toAddress.toString()}_0`)
        if (change && toAccount) {
          change.balanceAfter = toAccount.balance
          change.balanceChange = change.balanceAfter - change.balanceBefore
          change.nonceAfter = toAccount.nonce
        }
      }

      console.log(chalk.green(`  Replay ${success ? 'successful' : 'failed'}`))
      console.log(chalk.gray(`  Gas used: ${gasUsed.toString()}`))

      let hasChanges = false
      console.log(chalk.gray(`  State changes map size: ${stateChanges.size}`))
      for (const [key, change] of stateChanges) {
        console.log(
          chalk.gray(
            `  Account ${key}: before=${change.balanceBefore}, after=${change.balanceAfter}, change=${change.balanceChange}`
          )
        )
        if (change.balanceChange !== BigInt(0)) {
          hasChanges = true
          console.log(
            chalk.gray(
              `  ${change.ethAddress}: ${change.balanceChange > 0 ? '+' : ''}${change.balanceChange.toString()}`
            )
          )
        }
      }
      if (!hasChanges) {
        console.log(chalk.gray(`  No balance changes detected`))
      }

      return {
        transactionId: txId,
        success,
        gasUsed,
        gasRefund,
        totalGasSpent: gasUsed,
        txCost,
        minerReward: txCost,
        stateChanges,
      }
    } catch (error) {
      console.error(chalk.red(`Error replaying transaction:`, error))
      return {
        transactionId: txId,
        success: false,
        gasUsed: BigInt(0),
        gasRefund: BigInt(0),
        totalGasSpent: BigInt(0),
        txCost: BigInt(0),
        minerReward: BigInt(0),
        stateChanges,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async replayTransactionBatch(txIds: string[], statusOverrides?: Map<string, boolean>): Promise<ReplayResult[]> {
    const results: ReplayResult[] = []

    for (const txId of txIds) {
      const forceSuccess = statusOverrides?.get(txId) ?? false
      const result = await this.replayTransaction(txId, forceSuccess)
      results.push(result)
    }

    return results
  }

  async getStateSnapshot(): Promise<Map<string, { balance: bigint; nonce: bigint }>> {
    const snapshot = new Map<string, { balance: bigint; nonce: bigint }>()

    return snapshot
  }
}