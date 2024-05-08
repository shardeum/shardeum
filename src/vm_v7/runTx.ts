import { Block } from '@ethereumjs/block'
import { ConsensusType, Hardfork } from '@ethereumjs/common'
import { BlobEIP4844Transaction, Capability, isBlobEIP4844Tx } from '@ethereumjs/tx'
import {
  Account,
  Address,
  KECCAK256_NULL,
  bytesToHex,
  bytesToUnprefixedHex,
  equalsBytes,
  hexToBytes,
  short,
} from '@ethereumjs/util'
import debugDefault from 'debug'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
const { chargeConstantTxFee, constantTxFeeUsd, baselineTxGasUsage, baselineTxFee } = ShardeumFlags
import { EVM as EthereumVirtualMachine, EVMInterface, getActivePrecompiles } from '../evm_v2'

import { Bloom } from './bloom/index.js'

import type {
  AfterTxEvent,
  BaseTxReceipt,
  EIP4844BlobTxReceipt,
  PostByzantiumTxReceipt,
  PreByzantiumTxReceipt,
  RunTxOpts,
  RunTxResult,
  TxReceipt,
} from './types.js'
import type { VM } from './vm.js'
import type { AccessList, AccessListItem } from '@ethereumjs/common'
import type {
  AccessListEIP2930Transaction,
  FeeMarketEIP1559Transaction,
  LegacyTransaction,
  TypedTransaction,
} from '@ethereumjs/tx'
import { calculateGasPrice, getTxSenderAddress, scaleByStabilityFactor } from '../utils'
const { debug: createDebugLogger } = debugDefault

const debug = createDebugLogger('vm:tx')
const debugGas = createDebugLogger('vm:tx:gas')

/**
 * Returns the hardfork excluding the merge hf which has
 * no effect on the vm execution capabilities.
 *
 * This is particularly useful in executing/evaluating the transaction
 * when chain td is not available at many places to correctly set the
 * hardfork in for e.g. vm or txs or when the chain is not fully synced yet.
 *
 * @returns Hardfork name
 */
function execHardfork(hardfork: Hardfork | string, preMergeHf: Hardfork | string): string | Hardfork {
  return hardfork !== Hardfork.Paris ? hardfork : preMergeHf
}

/**
 * @ignore
 */
export async function runTx(this: VM, opts: RunTxOpts, evm: EthereumVirtualMachine, txid: string): Promise<RunTxResult> {
  if (evm == null) evm = this.evm
  // create a reasonable default if no block is given
  opts.block = opts.block ?? Block.fromBlockData({}, { common: this.common })

  if (opts.skipHardForkValidation !== true) {
    // Find and set preMerge hf for easy access later
    const hfs = this.common.hardforks()
    const preMergeIndex = hfs.findIndex((hf) => hf.ttd !== null && hf.ttd !== undefined) - 1
    // If no pre merge hf found, set it to first hf even if its merge
    const preMergeHf = preMergeIndex >= 0 ? hfs[preMergeIndex].name : hfs[0].name

    // If block and tx don't have a same hardfork, set tx hardfork to block
    if (
      execHardfork(opts.tx.common.hardfork(), preMergeHf) !==
      execHardfork(opts.block.common.hardfork(), preMergeHf)
    ) {
      opts.tx.common.setHardfork(opts.block.common.hardfork())
    }
    if (
      execHardfork(opts.block.common.hardfork(), preMergeHf) !==
      execHardfork(this.common.hardfork(), preMergeHf)
    ) {
      // Block and VM's hardfork should match as well
      const msg = _errorMsg('block has a different hardfork than the vm', this, opts.block, opts.tx)
      throw new Error(msg)
    }
  }

  if (opts.skipBlockGasLimitValidation !== true && opts.block.header.gasLimit < opts.tx.gasLimit) {
    const msg = _errorMsg('tx has a higher gas limit than the block', this, opts.block, opts.tx)
    throw new Error(msg)
  }

  // Ensure we start with a clear warmed accounts Map
  await evm.journal.cleanup()

  if (opts.reportAccessList === true) {
    evm.journal.startReportingAccessList()
  }

  await evm.journal.checkpoint()
  if (this.DEBUG) {
    debug('-'.repeat(100))
    debug(`tx checkpoint`)
  }

  // Typed transaction specific setup tasks
  if (opts.tx.supports(Capability.EIP2718TypedTransaction) && this.common.isActivatedEIP(2718) === true) {
    // Is it an Access List transaction?
    if (this.common.isActivatedEIP(2930) === false) {
      await evm.journal.revert()
      const msg = _errorMsg('Cannot run transaction: EIP 2930 is not activated.', this, opts.block, opts.tx)
      throw new Error(msg)
    }
    if (opts.tx.supports(Capability.EIP1559FeeMarket) && this.common.isActivatedEIP(1559) === false) {
      await evm.journal.revert()
      const msg = _errorMsg('Cannot run transaction: EIP 1559 is not activated.', this, opts.block, opts.tx)
      throw new Error(msg)
    }

    const castedTx = <AccessListEIP2930Transaction>opts.tx

    for (const accessListItem of castedTx.AccessListJSON) {
      evm.journal.addAlwaysWarmAddress(accessListItem.address, true)
      for (const storageKey of accessListItem.storageKeys) {
        evm.journal.addAlwaysWarmSlot(accessListItem.address, storageKey, true)
      }
    }
  }

  try {
    const result = await _runTx.bind(this)(opts, evm, txid)
    await evm.journal.commit()
    if (this.DEBUG) {
      debug(`tx checkpoint committed`)
    }
    return result
  } catch (e: any) {
    await evm.journal.revert()
    if (this.DEBUG) {
      debug(`tx checkpoint reverted`)
    }
    throw e
  } finally {
    if (this.common.isActivatedEIP(2929) === true) {
      evm.journal.cleanJournal()
    }
    evm.stateManager.originalStorageCache.clear()
  }
}

async function _runTx(this: VM, opts: RunTxOpts, evm: any, txid: string): Promise<RunTxResult> {
  const state = this.stateManager
  if (evm == null) evm = this.evm

  const { tx, block } = opts

  if (!block) {
    throw new Error('block required')
  }

  /**
   * The `beforeTx` event
   *
   * @event Event: beforeTx
   * @type {Object}
   * @property {Transaction} tx emits the Transaction that is about to be processed
   */
  await this._emit('beforeTx', tx)

  //txid may be null but getTxSenderAddress can handle that
  //txid is calculated by shardeum and used to assit caching getTxSenderAddress
  //which can be very expensive
  const caller = getTxSenderAddress(tx, txid).address
  if (this.DEBUG) {
    debug(`New tx run hash=${opts.tx.isSigned() ? bytesToHex(opts.tx.hash()) : 'unsigned'} sender=${caller}`)
  }

  if (this.common.isActivatedEIP(2929) === true) {
    // Add origin and precompiles to warm addresses
    const activePrecompiles = evm.precompiles
    for (const [addressStr] of activePrecompiles.entries()) {
      evm.journal.addAlwaysWarmAddress(addressStr)
    }
    evm.journal.addAlwaysWarmAddress(caller.toString())
    if (tx.to !== undefined) {
      // Note: in case we create a contract, we do this in EVMs `_executeCreate` (this is also correct in inner calls, per the EIP)
      evm.journal.addAlwaysWarmAddress(bytesToUnprefixedHex(tx.to.bytes))
    }
    if (this.common.isActivatedEIP(3651) === true) {
      evm.journal.addAlwaysWarmAddress(bytesToUnprefixedHex(block.header.coinbase.bytes))
    }
  }

  // Validate gas limit against tx base fee (DataFee + TxFee + Creation Fee)
  const txBaseFee = tx.getBaseFee()
  let gasLimit = tx.gasLimit
  if (gasLimit < txBaseFee) {
    const msg = _errorMsg('base fee exceeds gas limit', this, block, tx)
    throw new Error(msg)
  }
  gasLimit -= txBaseFee
  if (this.DEBUG) {
    debugGas(`Subtracting base fee (${txBaseFee}) from gasLimit (-> ${gasLimit})`)
  }

  if (this.common.isActivatedEIP(1559) === true) {
    // EIP-1559 spec:
    // Ensure that the user was willing to at least pay the base fee
    // assert transaction.max_fee_per_gas >= block.base_fee_per_gas
    const maxFeePerGas = 'maxFeePerGas' in tx ? tx.maxFeePerGas : tx.gasPrice
    const baseFeePerGas = block.header.baseFeePerGas!
    if (maxFeePerGas < baseFeePerGas) {
      const msg = _errorMsg(
        `Transaction's maxFeePerGas (${maxFeePerGas}) is less than the block's baseFeePerGas (${baseFeePerGas})`,
        this,
        block,
        tx
      )
      throw new Error(msg)
    }
  }

  // Check from account's balance and nonce
  let fromAccount = await state.getAccount(caller)
  if (fromAccount === undefined) {
    fromAccount = new Account()
  }
  const { nonce, balance } = fromAccount
  if (this.DEBUG) {
    debug(`Sender's pre-tx balance is ${balance}`)
  }
  // EIP-3607: Reject transactions from senders with deployed code
  if (this.common.isActivatedEIP(3607) === true && !equalsBytes(fromAccount.codeHash, KECCAK256_NULL)) {
    const msg = _errorMsg('invalid sender address, address is not EOA (EIP-3607)', this, block, tx)
    throw new Error(msg)
  }

  // Check balance against upfront tx cost
  const upFrontCost = tx.getUpfrontCost(block.header.baseFeePerGas)
  if (balance < upFrontCost) {
    if (opts.skipBalance === true && fromAccount.balance < upFrontCost) {
      if (tx.supports(Capability.EIP1559FeeMarket) === false) {
        // if skipBalance and not EIP1559 transaction, ensure caller balance is enough to run transaction
        fromAccount.balance = upFrontCost
        await evm.journal.putAccount(caller, fromAccount)
      }
    } else {
      // todo: research to prevent replay attacks when the account has enough balance
      // probably charge the gas and increase the nonce
      const msg = _errorMsg(
        `sender doesn't have enough funds to send tx. The upfront cost is: ${upFrontCost} and the sender's account (${caller}) only has: ${balance}`,
        this,
        block,
        tx
      )
      throw new Error(msg)
    }
  }

  // Check balance against max potential cost (for EIP 1559 and 4844)
  let maxCost = tx.value
  let blobGasPrice = BigInt(0)
  let totalblobGas = BigInt(0)
  if (tx.supports(Capability.EIP1559FeeMarket)) {
    // EIP-1559 spec:
    // The signer must be able to afford the transaction
    // `assert balance >= gas_limit * max_fee_per_gas`
    maxCost += tx.gasLimit * (tx as FeeMarketEIP1559Transaction).maxFeePerGas
  }

  if (tx instanceof BlobEIP4844Transaction) {
    if (!this.common.isActivatedEIP(4844)) {
      const msg = _errorMsg('blob transactions are only valid with EIP4844 active', this, block, tx)
      throw new Error(msg)
    }
    // EIP-4844 spec
    // the signer must be able to afford the transaction
    // assert signer(tx).balance >= tx.message.gas * tx.message.max_fee_per_gas + get_total_data_gas(tx) * tx.message.max_fee_per_data_gas
    const castTx = tx as BlobEIP4844Transaction
    totalblobGas = castTx.common.param('gasConfig', 'blobGasPerBlob') * BigInt(castTx.numBlobs())
    maxCost += totalblobGas * castTx.maxFeePerBlobGas

    // 4844 minimum blobGas price check
    if (opts.block === undefined) {
      const msg = _errorMsg(`Block option must be supplied to compute blob gas price`, this, block, tx)
      throw new Error(msg)
    }
    blobGasPrice = opts.block.header.getBlobGasPrice()
    if (castTx.maxFeePerBlobGas < blobGasPrice) {
      const msg = _errorMsg(
        `Transaction's maxFeePerBlobGas ${castTx.maxFeePerBlobGas}) is less than block blobGasPrice (${blobGasPrice}).`,
        this,
        block,
        tx
      )
      throw new Error(msg)
    }
  }

  if (fromAccount.balance < maxCost) {
    if (opts.skipBalance === true && fromAccount.balance < maxCost) {
      // if skipBalance, ensure caller balance is enough to run transaction
      fromAccount.balance = maxCost
      await evm.journal.putAccount(caller, fromAccount)
    } else {
      const msg = _errorMsg(
        `sender doesn't have enough funds to send tx. The max cost is: ${maxCost} and the sender's account (${caller}) only has: ${balance}`,
        this,
        block,
        tx
      )
      throw new Error(msg)
    }
  }

  if (opts.skipNonce !== true) {
    if (nonce !== tx.nonce) {
      const msg = _errorMsg(
        `the tx doesn't have the correct nonce. account has nonce of: ${nonce} tx has nonce of: ${tx.nonce}`,
        this,
        block,
        tx
      )
      throw new Error(msg)
    }
  }

  let gasPrice = calculateGasPrice(baselineTxFee, baselineTxGasUsage, opts.networkAccount)
  let inclusionFeePerGas: bigint
  // EIP-1559 tx
  if (tx.supports(Capability.EIP1559FeeMarket)) {
    const baseFee = block.header.baseFeePerGas!
    inclusionFeePerGas =
      (tx as FeeMarketEIP1559Transaction).maxPriorityFeePerGas <
      (tx as FeeMarketEIP1559Transaction).maxFeePerGas - baseFee
        ? (tx as FeeMarketEIP1559Transaction).maxPriorityFeePerGas
        : (tx as FeeMarketEIP1559Transaction).maxFeePerGas - baseFee

    gasPrice = inclusionFeePerGas + baseFee
  } else {
    // Have to cast as legacy tx since EIP1559 tx does not have gas price
    // gasPrice = (<LegacyTransaction>tx).gasPrice
    if (this.common.isActivatedEIP(1559) === true) {
      const baseFee = block.header.baseFeePerGas!
      inclusionFeePerGas = (<LegacyTransaction>tx).gasPrice - baseFee
    }
  }

  // EIP-4844 tx
  let versionedHashes
  if (tx instanceof BlobEIP4844Transaction) {
    versionedHashes = (tx as BlobEIP4844Transaction).versionedHashes
  }

  // Update from account's balance
  let txCost: bigint
  if (chargeConstantTxFee) {
    const baseTxCost = BigInt(constantTxFeeUsd)
    txCost = scaleByStabilityFactor(baseTxCost, opts.networkAccount)
  } else {
    txCost = tx.gasLimit * gasPrice
  }
  const blobGasCost = totalblobGas * blobGasPrice
  fromAccount.balance -= txCost
  fromAccount.balance -= blobGasCost
  if (opts.skipBalance === true && fromAccount.balance < BigInt(0)) {
    fromAccount.balance = BigInt(0)
  }
  await evm.journal.putAccount(caller, fromAccount)
  if (this.DEBUG) {
    debug(`Update fromAccount (caller) balance (-> ${fromAccount.balance}))`)
  }

  /*
   * Execute message
   */
  const { value, data, to } = tx

  if (this.DEBUG) {
    debug(
      `Running tx=${
        tx.isSigned() ? bytesToHex(tx.hash()) : 'unsigned'
      } with caller=${caller} gasLimit=${gasLimit} to=${to?.toString() ?? 'none'} value=${value} data=${short(
        data
      )}`
    )
  }

  const results = (await evm.runCall({
    block,
    gasPrice,
    caller,
    gasLimit,
    to,
    value,
    data,
    versionedHashes,
  })) as RunTxResult

  if (this.DEBUG) {
    debug(`Update fromAccount (caller) nonce (-> ${fromAccount.nonce})`)
  }

  if (this.DEBUG) {
    const { executionGasUsed, exceptionError, returnValue } = results.execResult
    debug('-'.repeat(100))
    debug(
      `Received tx execResult: [ executionGasUsed=${executionGasUsed} exceptionError=${
        exceptionError !== undefined ? `'${exceptionError.error}'` : 'none'
      } returnValue=${short(returnValue)} gasRefund=${results.gasRefund ?? 0} ]`
    )
  }

  /*
   * Parse results
   */
  // Generate the bloom for the tx
  results.bloom = txLogsBloom(results.execResult.logs)
  if (this.DEBUG) {
    debug(`Generated tx bloom with logs=${results.execResult.logs?.length}`)
  }

  // Calculate the total gas used
  results.totalGasSpent = results.execResult.executionGasUsed + txBaseFee
  if (this.DEBUG) {
    debugGas(`tx add baseFee ${txBaseFee} to totalGasSpent (-> ${results.totalGasSpent})`)
  }

  // Add blob gas used to result
  if (isBlobEIP4844Tx(tx)) {
    results.blobGasUsed = totalblobGas
  }

  // Process any gas refund
  let gasRefund = results.execResult.gasRefund ?? BigInt(0)
  results.gasRefund = gasRefund
  const maxRefundQuotient = this.common.param('gasConfig', 'maxRefundQuotient')
  if (gasRefund !== BigInt(0)) {
    const maxRefund = results.totalGasSpent / maxRefundQuotient
    gasRefund = gasRefund < maxRefund ? gasRefund : maxRefund
    results.totalGasSpent -= gasRefund
    if (this.DEBUG) {
      debug(`Subtract tx gasRefund (${gasRefund}) from totalGasSpent (-> ${results.totalGasSpent})`)
    }
  } else {
    if (this.DEBUG) {
      debug(`No tx gasRefund`)
    }
  }
  let actualTxCost: bigint
  if (chargeConstantTxFee) {
    const baseTxCost = BigInt(constantTxFeeUsd)
    actualTxCost = scaleByStabilityFactor(baseTxCost, opts.networkAccount)
  } else {
    actualTxCost = results.totalGasSpent * gasPrice
  }

  results.amountSpent = actualTxCost

  // Update sender's balance
  fromAccount = await state.getAccount(caller)
  if (fromAccount === undefined) {
    fromAccount = new Account()
  }
  const txCostDiff = txCost - actualTxCost
  fromAccount.balance += txCostDiff
  await evm.journal.putAccount(caller, fromAccount)
  if (this.DEBUG) {
    debug(`Refunded txCostDiff (${txCostDiff}) to fromAccount (caller) balance (-> ${fromAccount.balance})`)
  }

  // Update miner's balance
  let miner
  if (this.common.consensusType() === ConsensusType.ProofOfAuthority) {
    miner = block.header.cliqueSigner()
  } else {
    miner = block.header.coinbase
  }

  let minerAccount = await state.getAccount(miner)
  if (minerAccount === undefined) {
    minerAccount = new Account()
  }
  // add the amount spent on gas to the miner's account
  results.minerValue =
    this.common.isActivatedEIP(1559) === true
      ? results.totalGasSpent * inclusionFeePerGas!
      : results.amountSpent
  minerAccount.balance += results.minerValue

  // Put the miner account into the state. If the balance of the miner account remains zero, note that
  // the state.putAccount function puts this into the "touched" accounts. This will thus be removed when
  // we clean the touched accounts below in case we are in a fork >= SpuriousDragon
  await evm.journal.putAccount(miner, minerAccount)
  if (this.DEBUG) {
    debug(`tx update miner account (${miner}) balance (-> ${minerAccount.balance})`)
  }

  /*
   * Cleanup accounts
   */
  if (results.execResult.selfdestruct !== undefined) {
    for (const addressToSelfdestructHex of results.execResult.selfdestruct) {
      const address = new Address(hexToBytes(addressToSelfdestructHex))
      if (this.common.isActivatedEIP(6780)) {
        // skip cleanup of addresses not in createdAddresses
        if (!results.execResult.createdAddresses!.has(address.toString())) {
          continue
        }
      }
      await evm.journal.deleteAccount(address)
      if (this.DEBUG) {
        debug(`tx selfdestruct on address=${address}`)
      }
    }
  }

  if (opts.reportAccessList === true && this.common.isActivatedEIP(2930)) {
    // Convert the Map to the desired type
    const accessList: AccessList = []
    for (const [address, set] of evm.journal.accessList!) {
      const addressPrefixed = '0x' + address
      const item: AccessListItem = {
        address: addressPrefixed,
        storageKeys: [],
      }
      for (const slot of set) {
        const slotPrefixed = '0x' + slot
        item.storageKeys.push(slotPrefixed)
      }
      accessList.push(item)
    }

    results.accessList = accessList
  }

  await evm.journal.cleanup()
  state.originalStorageCache.clear()

  // Generate the tx receipt
  const gasUsed = opts.blockGasUsed !== undefined ? opts.blockGasUsed : block.header.gasUsed
  const cumulativeGasUsed = gasUsed + results.totalGasSpent
  results.receipt = await generateTxReceipt.bind(this)(
    tx,
    results,
    cumulativeGasUsed,
    totalblobGas,
    blobGasPrice
  )

  /**
   * The `afterTx` event
   *
   * @event Event: afterTx
   * @type {Object}
   * @property {Object} result result of the transaction
   */
  const event: AfterTxEvent = { transaction: tx, ...results }
  await this._emit('afterTx', event)
  if (this.DEBUG) {
    debug(
      `tx run finished hash=${opts.tx.isSigned() ? bytesToHex(opts.tx.hash()) : 'unsigned'} sender=${caller}`
    )
  }

  return results
}

/**
 * @method txLogsBloom
 * @private
 */
function txLogsBloom(logs?: any[]): Bloom {
  const bloom = new Bloom()
  if (logs) {
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]
      // add the address
      bloom.add(log[0])
      // add the topics
      const topics = log[1]
      for (let q = 0; q < topics.length; q++) {
        bloom.add(topics[q])
      }
    }
  }
  return bloom
}

/**
 * Returns the tx receipt.
 * @param this The vm instance
 * @param tx The transaction
 * @param txResult The tx result
 * @param cumulativeGasUsed The gas used in the block including this tx
 * @param blobGasUsed The blob gas used in the tx
 * @param blobGasPrice The blob gas price for the block including this tx
 */
export async function generateTxReceipt(
  this: VM,
  tx: TypedTransaction,
  txResult: RunTxResult,
  cumulativeGasUsed: bigint,
  blobGasUsed?: bigint,
  blobGasPrice?: bigint
): Promise<TxReceipt> {
  const baseReceipt: BaseTxReceipt = {
    cumulativeBlockGasUsed: cumulativeGasUsed,
    bitvector: txResult.bloom.bitvector,
    logs: txResult.execResult.logs ?? [],
  }

  let receipt
  if (this.DEBUG) {
    debug(
      `Generate tx receipt transactionType=${
        tx.type
      } cumulativeBlockGasUsed=${cumulativeGasUsed} bitvector=${short(baseReceipt.bitvector)} (${
        baseReceipt.bitvector.length
      } bytes) logs=${baseReceipt.logs.length}`
    )
  }

  if (!tx.supports(Capability.EIP2718TypedTransaction)) {
    // Legacy transaction
    if (this.common.gteHardfork(Hardfork.Byzantium) === true) {
      // Post-Byzantium
      receipt = {
        status: txResult.execResult.exceptionError !== undefined ? 0 : 1, // Receipts have a 0 as status on error
        ...baseReceipt,
      } as PostByzantiumTxReceipt
    } else {
      // Pre-Byzantium
      const stateRoot = await this.stateManager.getStateRoot()
      receipt = {
        stateRoot,
        ...baseReceipt,
      } as PreByzantiumTxReceipt
    }
  } else {
    // Typed EIP-2718 Transaction
    if (isBlobEIP4844Tx(tx)) {
      receipt = {
        blobGasUsed,
        blobGasPrice,
        status: txResult.execResult.exceptionError ? 0 : 1,
        ...baseReceipt,
      } as EIP4844BlobTxReceipt
    } else {
      receipt = {
        status: txResult.execResult.exceptionError ? 0 : 1,
        ...baseReceipt,
      } as PostByzantiumTxReceipt
    }
  }
  return receipt
}

/**
 * Internal helper function to create an annotated error message
 *
 * @param msg Base error message
 * @hidden
 */
function _errorMsg(msg: string, vm: VM, block: Block, tx: TypedTransaction): string {
  const blockErrorStr = 'errorStr' in block ? block.errorStr() : 'block'
  const txErrorStr = 'errorStr' in tx ? tx.errorStr() : 'tx'

  const errorMsg = `${msg} (${vm.errorStr()} -> ${blockErrorStr} -> ${txErrorStr})`
  return errorMsg
}
