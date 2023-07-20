import { debug as createDebugLogger } from 'debug'
import { Address, BN, KECCAK256_NULL, toBuffer } from 'ethereumjs-util'
import { Block } from '@ethereumjs/block'
import { ConsensusType } from '@ethereumjs/common'
import {
  AccessList,
  AccessListItem,
  AccessListEIP2930Transaction,
  FeeMarketEIP1559Transaction,
  Transaction,
  TypedTransaction,
  Capability,
} from '@ethereumjs/tx'
import VM from '@ethereumjs/vm'
import Bloom from './bloom'
import { default as EVM, EVMResult } from './evm/evm'
import { short } from './evm/opcodes/util'
import Message from './evm/message'
import TxContext from './evm/txContext'
import { EIP2929StateManager } from './state/interface'
import type {
  TxReceipt,
  BaseTxReceipt,
  PreByzantiumTxReceipt,
  PostByzantiumTxReceipt,
} from '@ethereumjs/vm/src/types'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { NetworkAccount } from '../shardeum/shardeumTypes'
import { calculateGasPrice, scaleByStabilityFactor } from '../utils'
import { Log } from './evm/types'

const debug = createDebugLogger('vm:tx')
const debugGas = createDebugLogger('vm:tx:gas')
const { chargeConstantTxFee, constantTxFeeUsd, baselineTxGasUsage, baselineTxFee } = ShardeumFlags

/**
 * Options for the `runTx` method.
 */
export interface RunTxOpts {
  /**
   * The `@ethereumjs/block` the `tx` belongs to.
   * If omitted, a default blank block will be used.
   */
  block?: Block
  /**
   * An `@ethereumjs/tx` to run
   */
  tx: TypedTransaction
  /**
   * If true, skips the nonce check
   */
  skipNonce?: boolean
  /**
   * If true, skips the balance check
   */
  skipBalance?: boolean

  networkAccount?: NetworkAccount

  /**
   * If true, skips the validation of the tx's gas limit
   * against the block's gas limit.
   */
  skipBlockGasLimitValidation?: boolean

  /**
   * If true, adds a generated EIP-2930 access list
   * to the `RunTxResult` returned.
   *
   * Option works with all tx types. EIP-2929 needs to
   * be activated (included in `berlin` HF).
   *
   * Note: if this option is used with a custom {@link StateManager} implementation
   * {@link StateManager.generateAccessList} must be implemented.
   */
  reportAccessList?: boolean

  /**
   * To obtain an accurate tx receipt input the block gas used up until this tx.
   */
  blockGasUsed?: BN
}

/**
 * Execution result of a transaction
 */
export interface RunTxResult extends EVMResult {
  /**
   * Bloom filter resulted from transaction
   */
  bloom: Bloom

  /**
   * The amount of ether used by this transaction
   */
  amountSpent: BN

  /**
   * The tx receipt
   */
  receipt: TxReceipt

  /**
   * The amount of gas as that was refunded during the transaction (i.e. `gasUsed = totalGasConsumed - gasRefund`)
   */
  gasRefund?: BN

  /**
   * EIP-2930 access list generated for the tx (see `reportAccessList` option)
   */
  accessList?: AccessList
}

export interface AfterTxEvent extends RunTxResult {
  /**
   * The transaction which just got finished
   */
  transaction: TypedTransaction
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

/**
 * @method txLogsBloom
 * @private
 */
function txLogsBloom(logs?: Log[]): Bloom {
  const bloom = new Bloom()
  if (logs) {
    for (let i = 0; i < logs.length; i++) {
      /* eslint-disable security/detect-object-injection */
      const log = logs[i]
      // add the address
      bloom.add(log[0])
      // add the topics
      const topics = log[1]
      for (let q = 0; q < topics.length; q++) {
        bloom.add(topics[q])
      }
      /* eslint-enable security/detect-object-injection */
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
 */
export async function generateTxReceipt(
  this: VM,
  tx: TypedTransaction,
  txResult: RunTxResult,
  cumulativeGasUsed: BN
): Promise<TxReceipt> {
  const baseReceipt: BaseTxReceipt = {
    gasUsed: cumulativeGasUsed.toArrayLike(Buffer),
    bitvector: txResult.bloom.bitvector,
    logs: txResult.execResult.logs ?? [],
  }

  let receipt
  if (this.DEBUG) {
    debug(
      `Generate tx receipt transactionType=${tx.type} gasUsed=${cumulativeGasUsed} bitvector=${short(
        baseReceipt.bitvector
      )} (${baseReceipt.bitvector.length} bytes) logs=${baseReceipt.logs.length}`
    )
  }

  if (!tx.supports(Capability.EIP2718TypedTransaction)) {
    // Legacy transaction
    if (this._common.gteHardfork('byzantium')) {
      // Post-Byzantium
      receipt = {
        status: txResult.execResult.exceptionError ? 0 : 1, // Receipts have a 0 as status on error
        ...baseReceipt,
      } as PostByzantiumTxReceipt
    } else {
      // Pre-Byzantium
      const stateRoot = await this.stateManager.getStateRoot(true)
      receipt = {
        stateRoot: stateRoot,
        ...baseReceipt,
      } as PreByzantiumTxReceipt
    }
  } else {
    // Typed EIP-2718 Transaction
    receipt = {
      status: txResult.execResult.exceptionError ? 0 : 1,
      ...baseReceipt,
    } as PostByzantiumTxReceipt
  }

  return receipt
}

async function _runTx(this: VM, opts: RunTxOpts): Promise<RunTxResult> {
  // Have to cast as `EIP2929StateManager` to access the EIP2929 methods
  const state = this.stateManager as EIP2929StateManager

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

  const caller = tx.getSenderAddress()
  if (this.DEBUG) {
    debug(
      `New tx run hash=${opts.tx.isSigned() ? opts.tx.hash().toString('hex') : 'unsigned'} sender=${caller}`
    )
  }

  if (this._common.isActivatedEIP(2929)) {
    state.addWarmedAddress(caller.buf)
    if (tx.to) {
      // Note: in case we create a contract, we do this in EVMs `_executeCreate` (this is also correct in inner calls, per the EIP)
      state.addWarmedAddress(tx.to.buf)
    }
  }

  // Validate gas limit against tx base fee (DataFee + TxFee + Creation Fee)
  const txBaseFee = tx.getBaseFee()
  const gasLimit = tx.gasLimit.clone()
  if (gasLimit.lt(txBaseFee)) {
    const msg = _errorMsg('base fee exceeds gas limit', this, block, tx)
    throw new Error(msg)
  }
  gasLimit.isub(txBaseFee)
  if (this.DEBUG) {
    debugGas(`Subtracting base fee (${txBaseFee}) from gasLimit (-> ${gasLimit})`)
  }

  if (this._common.isActivatedEIP(1559)) {
    // EIP-1559 spec:
    // Ensure that the user was willing to at least pay the base fee
    // assert transaction.max_fee_per_gas >= block.base_fee_per_gas
    const maxFeePerGas = 'maxFeePerGas' in tx ? tx.maxFeePerGas : tx.gasPrice
    const baseFeePerGas = block.header.baseFeePerGas!
    if (maxFeePerGas.lt(baseFeePerGas)) {
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
  const { nonce, balance } = fromAccount

  // EIP-3607: Reject transactions from senders with deployed code
  if (this._common.isActivatedEIP(3607) && !fromAccount.codeHash.equals(KECCAK256_NULL)) {
    const msg = _errorMsg('invalid sender address, address is not EOA (EIP-3607)', this, block, tx)
    throw new Error(msg)
  }

  if (!opts.skipBalance) {
    const cost = tx.getUpfrontCost(block.header.baseFeePerGas)
    if (balance.lt(cost)) {
      const msg = _errorMsg(
        `sender doesn't have enough funds to send tx. The upfront cost is: ${cost} and the sender's account (${caller}) only has: ${balance}`,
        this,
        block,
        tx
      )
      throw new Error(msg)
    }
    if (tx.supports(Capability.EIP1559FeeMarket)) {
      // EIP-1559 spec:
      // The signer must be able to afford the transaction
      // `assert balance >= gas_limit * max_fee_per_gas`
      const cost = tx.gasLimit.mul((tx as FeeMarketEIP1559Transaction).maxFeePerGas).add(tx.value)
      if (balance.lt(cost)) {
        const msg = _errorMsg(
          `sender doesn't have enough funds to send tx. The max cost is: ${cost} and the sender's account (${caller}) only has: ${balance}`,
          this,
          block,
          tx
        )
        throw new Error(msg)
      }
    }
  }
  if (!opts.skipNonce) {
    if (!nonce.eq(tx.nonce)) {
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
  let inclusionFeePerGas
  // EIP-1559 tx
  if (tx.supports(Capability.EIP1559FeeMarket)) {
    const baseFee = block.header.baseFeePerGas!
    inclusionFeePerGas = BN.min(
      (tx as FeeMarketEIP1559Transaction).maxPriorityFeePerGas,
      (tx as FeeMarketEIP1559Transaction).maxFeePerGas.sub(baseFee)
    )
    gasPrice = inclusionFeePerGas.add(baseFee)
  } else {
    // Have to cast as legacy tx since EIP1559 tx does not have gas price
    // gasPrice = (tx as Transaction).gasPrice
    if (this._common.isActivatedEIP(1559)) {
      const baseFee = block.header.baseFeePerGas!
      inclusionFeePerGas = (tx as Transaction).gasPrice.sub(baseFee)
    }
  }

  // Update from account's nonce and balance
  fromAccount.nonce.iaddn(1)
  let txCost
  if (chargeConstantTxFee) {
    const baseTxCost = new BN(constantTxFeeUsd)
    txCost = scaleByStabilityFactor(baseTxCost, opts.networkAccount)
  } else {
    txCost = tx.gasLimit.mul(gasPrice)
  }
  fromAccount.balance.isub(txCost)
  await state.putAccount(caller, fromAccount)
  if (this.DEBUG) {
    debug(
      `Update fromAccount (caller) nonce (-> ${fromAccount.nonce}) and balance(-> ${fromAccount.balance})`
    )
  }

  /*
   * Execute message
   */
  const txContext = new TxContext(gasPrice, caller)
  const { value, data, to } = tx
  const message = new Message({
    caller,
    gasLimit,
    to,
    value,
    data,
  })
  const evm = new EVM(this, txContext, block)
  if (this.DEBUG) {
    debug(
      `Running tx=0x${
        tx.isSigned() ? tx.hash().toString('hex') : 'unsigned'
      } with caller=${caller} gasLimit=${gasLimit} to=${
        to?.toString() ?? 'none'
      } value=${value} data=0x${short(data)}`
    )
  }

  const results = (await evm.executeMessage(message)) as RunTxResult
  if (this.DEBUG) {
    const { gasUsed, exceptionError, returnValue, gasRefund } = results.execResult
    debug('-'.repeat(100))
    debug(
      `Received tx execResult: [ gasUsed=${gasUsed} exceptionError=${
        exceptionError ? `'${exceptionError.error}'` : 'none'
      } returnValue=0x${short(returnValue)} gasRefund=${gasRefund ?? 0} ]`
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
  results.gasUsed.iadd(txBaseFee)
  if (this.DEBUG) {
    debugGas(`tx add baseFee ${txBaseFee} to gasUsed (-> ${results.gasUsed})`)
    debugGas(`tx add baseFee ${txBaseFee} to gasUsed (-> ${results.gasUsed})`)
  }

  // Process any gas refund
  let gasRefund = results.execResult.gasRefund ?? new BN(0)
  const maxRefundQuotient = this._common.param('gasConfig', 'maxRefundQuotient')
  if (!gasRefund.isZero()) {
    const maxRefund = results.gasUsed.divn(maxRefundQuotient)
    gasRefund = BN.min(gasRefund, maxRefund)
    results.gasUsed.isub(gasRefund)
    if (this.DEBUG) {
      debug(`Subtract tx gasRefund (${gasRefund}) from gasUsed (-> ${results.gasUsed})`)
    }
  } else {
    if (this.DEBUG) {
      debug(`No tx gasRefund`)
    }
  }
  let actualTxCost
  if (chargeConstantTxFee) {
    const baseTxCost = new BN(constantTxFeeUsd)
    actualTxCost = scaleByStabilityFactor(baseTxCost, opts.networkAccount)
  } else {
    actualTxCost = results.gasUsed.mul(gasPrice)
  }

  results.amountSpent = actualTxCost

  // Update sender's balance
  fromAccount = await state.getAccount(caller)
  const txCostDiff = txCost.sub(actualTxCost)
  fromAccount.balance.iadd(txCostDiff)
  await state.putAccount(caller, fromAccount)
  if (this.DEBUG) {
    debug(`Refunded txCostDiff (${txCostDiff}) to fromAccount (caller) balance (-> ${fromAccount.balance})`)
  }

  // Update miner's balance
  let miner
  if (this._common.consensusType() === ConsensusType.ProofOfAuthority) {
    // Backwards-compatibility check
    // TODO: can be removed along VM v6 release
    if ('cliqueSigner' in block.header) {
      miner = block.header.cliqueSigner()
    } else {
      miner = Address.zero()
    }
  } else {
    miner = block.header.coinbase
  }

  const minerAccount = await state.getAccount(miner)
  // add the amount spent on gas to the miner's account
  if (this._common.isActivatedEIP(1559)) {
    minerAccount.balance.iadd(results.gasUsed.mul(inclusionFeePerGas as BN))
  } else {
    minerAccount.balance.iadd(results.amountSpent)
  }

  // Put the miner account into the state. If the balance of the miner account remains zero, note that
  // the state.putAccount function puts this into the "touched" accounts. This will thus be removed when
  // we clean the touched accounts below in case we are in a fork >= SpuriousDragon
  await state.putAccount(miner, minerAccount)
  if (this.DEBUG) {
    debug(`tx update miner account (${miner}) balance (-> ${minerAccount.balance})`)
  }

  /*
   * Cleanup accounts
   */
  if (results.execResult.selfdestruct) {
    const keys = Object.keys(results.execResult.selfdestruct)
    for (const k of keys) {
      const address = new Address(Buffer.from(k, 'hex'))
      await state.deleteAccount(address)
      if (this.DEBUG) {
        debug(`tx selfdestruct on address=${address}`)
      }
    }
  }
  await state.cleanupTouchedAccounts()
  state.clearOriginalStorageCache()

  // Generate the tx receipt
  const cumulativeGasUsed = (opts.blockGasUsed ?? block.header.gasUsed).add(results.gasUsed)
  results.receipt = await generateTxReceipt.bind(this)(tx, results, cumulativeGasUsed)

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
      `tx run finished hash=${
        opts.tx.isSigned() ? opts.tx.hash().toString('hex') : 'unsigned'
      } sender=${caller}`
    )
  }

  return results
}

/**
 * @ignore
 */
export default async function runTx(this: VM, opts: RunTxOpts): Promise<RunTxResult> {
  // tx is required
  if (!opts.tx) {
    throw new Error('invalid input, tx is required')
  }

  // create a reasonable default if no block is given
  opts.block = opts.block ?? Block.fromBlockData({}, { common: opts.tx.common })

  if (opts.skipBlockGasLimitValidation !== true && opts.block.header.gasLimit.lt(opts.tx.gasLimit)) {
    const msg = _errorMsg('tx has a higher gas limit than the block', this, opts.block, opts.tx)
    throw new Error(msg)
  }

  // Have to cast as `EIP2929StateManager` to access clearWarmedAccounts
  const state = this.stateManager as EIP2929StateManager

  if (opts.reportAccessList && !('generateAccessList' in state)) {
    const msg = _errorMsg(
      'reportAccessList needs a StateManager implementing the generateAccessList() method',
      this,
      opts.block,
      opts.tx
    )
    throw new Error(msg)
  }

  // Ensure we start with a clear warmed accounts Map
  if (this._common.isActivatedEIP(2929)) {
    state.clearWarmedAccounts()
  }

  await state.checkpoint()
  if (this.DEBUG) {
    debug('-'.repeat(100))
    debug(`tx checkpoint`)
  }

  // Typed transaction specific setup tasks
  if (opts.tx.supports(Capability.EIP2718TypedTransaction) && this._common.isActivatedEIP(2718)) {
    // Is it an Access List transaction?
    if (!this._common.isActivatedEIP(2930)) {
      await state.revert()
      const msg = _errorMsg('Cannot run transaction: EIP 2930 is not activated.', this, opts.block, opts.tx)
      throw new Error(msg)
    }
    if (opts.reportAccessList && !('generateAccessList' in state)) {
      await state.revert()
      const msg = _errorMsg(
        'StateManager needs to implement generateAccessList() when running with reportAccessList option',
        this,
        opts.block,
        opts.tx
      )
      throw new Error(msg)
    }
    if (opts.tx.supports(Capability.EIP1559FeeMarket) && !this._common.isActivatedEIP(1559)) {
      await state.revert()
      const msg = _errorMsg('Cannot run transaction: EIP 1559 is not activated.', this, opts.block, opts.tx)
      throw new Error(msg)
    }

    const castedTx = opts.tx as AccessListEIP2930Transaction

    castedTx.AccessListJSON.forEach((accessListItem: AccessListItem) => {
      const address = toBuffer(accessListItem.address)
      state.addWarmedAddress(address)
      accessListItem.storageKeys.forEach((storageKey: string) => {
        state.addWarmedStorage(address, toBuffer(storageKey))
      })
    })
  }

  try {
    const result = await _runTx.bind(this)(opts)
    await state.commit()
    if (this.DEBUG) {
      debug(`tx checkpoint committed`)
    }
    if (this._common.isActivatedEIP(2929) && opts.reportAccessList) {
      const { tx } = opts
      // Do not include sender address in access list
      const removed = [tx.getSenderAddress()]
      // Only include to address on present storage slot accesses
      const onlyStorage = tx.to ? [tx.to] : []
      result.accessList = state.generateAccessList!(removed, onlyStorage)
    }
    return result
  } catch (e: unknown) {
    await state.revert()
    if (this.DEBUG) {
      debug(`tx checkpoint reverted`)
    }
    throw e
  } finally {
    if (this._common.isActivatedEIP(2929)) {
      state.clearWarmedAccounts()
    }
  }
}
