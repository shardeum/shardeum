import { Blockchain } from '@ethereumjs/blockchain'
import { Chain, Common } from '@ethereumjs/common'
import { EVM, getActivePrecompiles } from '../evm_v2'
// import { EVM, getActivePrecompiles } from '@ethereumjs/evm'
import { DefaultStateManager } from '@ethereumjs/statemanager'
import { Account, Address, AsyncEventEmitter, unprefixedHexToBytes } from '@ethereumjs/util'

import { buildBlock } from './buildBlock.js'
import { runBlock } from './runBlock.js'
import { runTx } from './runTx.js'

import type { BlockBuilder } from './buildBlock.js'
import type {
  BuildBlockOpts,
  RunBlockOpts,
  RunBlockResult,
  RunTxOpts,
  RunTxResult,
  VMEvents,
  VMOpts,
} from './types.js'
import type { BlockchainInterface } from '@ethereumjs/blockchain'
import type { EVMStateManagerInterface } from '@ethereumjs/common'
import type { EVMInterface } from '@ethereumjs/evm'
import type { BigIntLike, GenesisState } from '@ethereumjs/util'

/**
 * Execution engine which can be used to run a blockchain, individual
 * blocks, individual transactions, or snippets of EVM bytecode.
 *
 * This class is an AsyncEventEmitter, please consult the README to learn how to use it.
 */
export class VM {
  /**
   * The StateManager used by the VM
   */
  readonly stateManager: EVMStateManagerInterface

  /**
   * The blockchain the VM operates on
   */
  readonly blockchain: BlockchainInterface

  readonly common: Common

  readonly events: AsyncEventEmitter<VMEvents>
  /**
   * The EVM used for bytecode execution
   */
  readonly evm: any

  protected readonly _opts: VMOpts
  protected _isInitialized = false

  protected readonly _setHardfork: boolean | BigIntLike

  /**
   * Cached emit() function, not for public usage
   * set to public due to implementation internals
   * @hidden
   */
  public readonly _emit: (topic: string, data: any) => Promise<void>

  /**
   * VM is run in DEBUG mode (default: false)
   * Taken from DEBUG environment variable
   *
   * Safeguards on debug() calls are added for
   * performance reasons to avoid string literal evaluation
   * @hidden
   */
  readonly DEBUG: boolean = false

  /**
   * VM async constructor. Creates engine instance and initializes it.
   *
   * @param opts VM engine constructor options
   */
  static async create(opts: VMOpts = {}): Promise<VM> {
    const vm = new this(opts)
    const genesisStateOpts =
      opts.stateManager === undefined && opts.genesisState === undefined
        ? { genesisState: {} }
        : undefined
    await vm.init({ ...genesisStateOpts, ...opts })
    return vm
  }

  /**
   * Instantiates a new {@link VM} Object.
   *
   * @deprecated The direct usage of this constructor is discouraged since
   * non-finalized async initialization might lead to side effects. Please
   * use the async {@link VM.create} constructor instead (same API).
   * @param opts
   */
  protected constructor(opts: VMOpts = {}) {
    this.events = new AsyncEventEmitter<VMEvents>()

    this._opts = opts

    if (opts.common) {
      this.common = opts.common
    } else {
      const DEFAULT_CHAIN = Chain.Mainnet
      this.common = new Common({ chain: DEFAULT_CHAIN })
    }

    if (opts.stateManager) {
      this.stateManager = opts.stateManager
    } else {
      this.stateManager = new DefaultStateManager({ common: this.common })
    }

    this.blockchain = opts.blockchain ?? new (Blockchain as any)({ common: this.common })

    // TODO tests
    if (opts.evm) {
      this.evm = opts.evm
    } else {
      this.evm = new EVM({
        common: this.common,
        stateManager: this.stateManager,
        blockchain: this.blockchain,
      })
    }

    this._setHardfork = opts.setHardfork ?? false

    this._emit = async (topic: string, data: any): Promise<void> => {
      return new Promise((resolve) => this.events.emit(topic as keyof VMEvents, data, resolve))
    }

    // Skip DEBUG calls unless 'ethjs' included in environmental DEBUG variables
    // Additional window check is to prevent vite browser bundling (and potentially other) to break
    this.DEBUG =
      typeof window === 'undefined' ? process?.env?.DEBUG?.includes('ethjs') ?? false : false
  }

  async init({ genesisState }: { genesisState?: GenesisState } = {}): Promise<void> {
    if (this._isInitialized) return

    if (genesisState !== undefined) {
      await this.stateManager.generateCanonicalGenesis(genesisState)
    } else if (this._opts.stateManager === undefined) {
      throw Error('genesisState state required to set genesis for stateManager')
    }

    if (typeof (<any>this.blockchain)._init === 'function') {
      await (this.blockchain as any)._init({ genesisState })
    }

    if (this._opts.activatePrecompiles === true && typeof this._opts.stateManager === 'undefined') {
      await this.evm.journal.checkpoint()
      // put 1 wei in each of the precompiles in order to make the accounts non-empty and thus not have them deduct `callNewAccount` gas.
      for (const [addressStr] of getActivePrecompiles(this.common)) {
        const address = new Address(unprefixedHexToBytes(addressStr))
        let account = await this.stateManager.getAccount(address)
        // Only do this if it is not overridden in genesis
        // Note: in the case that custom genesis has storage fields, this is preserved
        if (account === undefined) {
          account = new Account()
          const newAccount = Account.fromAccountData({
            balance: 1,
            storageRoot: account.storageRoot,
          })
          await this.stateManager.putAccount(address, newAccount)
        }
      }
      await this.evm.journal.commit()
    }
    this._isInitialized = true
  }

  /**
   * Processes the `block` running all of the transactions it contains and updating the miner's account
   *
   * This method modifies the state. If `generate` is `true`, the state modifications will be
   * reverted if an exception is raised. If it's `false`, it won't revert if the block's header is
   * invalid. If an error is thrown from an event handler, the state may or may not be reverted.
   *
   * @param {RunBlockOpts} opts - Default values for options:
   *  - `generate`: false
   */
  async runBlock(opts: RunBlockOpts): Promise<RunBlockResult> {
    return runBlock.bind(this)(opts)
  }

  /**
   * Process a transaction. Run the vm. Transfers eth. Checks balances.
   *
   * This method modifies the state. If an error is thrown, the modifications are reverted, except
   * when the error is thrown from an event handler. In the latter case the state may or may not be
   * reverted.
   *
   * @param {RunTxOpts} opts
   */
  async runTx(opts: RunTxOpts, evm: any = null, txid: string = null): Promise<RunTxResult> {
    return runTx.bind(this)(opts, evm, txid)
  }

  /**
   * Build a block on top of the current state
   * by adding one transaction at a time.
   *
   * Creates a checkpoint on the StateManager and modifies the state
   * as transactions are run. The checkpoint is committed on {@link BlockBuilder.build}
   * or discarded with {@link BlockBuilder.revert}.
   *
   * @param {BuildBlockOpts} opts
   * @returns An instance of {@link BlockBuilder} with methods:
   * - {@link BlockBuilder.addTransaction}
   * - {@link BlockBuilder.build}
   * - {@link BlockBuilder.revert}
   */
  async buildBlock(opts: BuildBlockOpts): Promise<BlockBuilder> {
    return buildBlock.bind(this)(opts)
  }

  /**
   * Returns a copy of the {@link VM} instance.
   *
   * Note that the returned copy will share the same db as the original for the blockchain and the statemanager
   */
  async shallowCopy(): Promise<VM> {
    const common = this.common.copy()
    common.setHardfork(this.common.hardfork())
    const blockchain = this.blockchain.shallowCopy()
    const stateManager = this.stateManager.shallowCopy()
    const evmOpts = {
      ...(this.evm as any)._optsCached,
      common,
      blockchain,
      stateManager,
    }
    const evmCopy = new EVM(evmOpts) // TODO fixme (should copy the EVMInterface, not default EVM)
    return VM.create({
      stateManager,
      blockchain: this.blockchain,
      common,
      evm: evmCopy,
      setHardfork: this._setHardfork,
    })
  }

  /**
   * Return a compact error string representation of the object
   */
  errorStr(): string {
    let hf = ''
    try {
      hf = this.common.hardfork()
    } catch (e: any) {
      hf = 'error'
    }
    const errorStr = `vm hf=${hf}`
    return errorStr
  }
}
