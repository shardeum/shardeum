//TODO look into deprecating/removing this code as it is not used by shardeum

import { Block } from '@ethereumjs/block'
import { ConsensusType } from '@ethereumjs/common'
import { RLP } from '@ethereumjs/rlp'
import { Trie } from '@ethereumjs/trie'
import { BlobEIP4844Transaction } from '@ethereumjs/tx'
import {
  Address,
  GWEI_TO_WEI,
  TypeOutput,
  Withdrawal,
  toBytes,
  toType,
  zeros,
} from '@ethereumjs/util'

import { Bloom } from './bloom/index.js'
import {
  accumulateParentBeaconBlockRoot,
  calculateMinerReward,
  encodeReceipt,
  rewardAccount,
} from './runBlock.js'

import type {
  BuildBlockOpts,
  BuilderOpts, EIP4844BlobTxReceipt,
  PostByzantiumTxReceipt,
  PreByzantiumTxReceipt,
  RunTxResult,
  SealBlockOpts
} from './types.js'
import type { VM } from './vm.js'
import type { HeaderData } from '@ethereumjs/block'
import type { TypedTransaction } from '@ethereumjs/tx'

export enum BuildStatus {
  Reverted = 'reverted',
  Build = 'build',
  Pending = 'pending',
}

type BlockStatus =
  | { status: BuildStatus.Pending | BuildStatus.Reverted }
  | { status: BuildStatus.Build; block: Block }

export class BlockBuilder {
  /**
   * The cumulative gas used by the transactions added to the block.
   */
  gasUsed = BigInt(0)
  /**
   *  The cumulative blob gas used by the blobs in a block
   */
  blobGasUsed = BigInt(0)
  /**
   * Value of the block, represented by the final transaction fees
   * acruing to the miner.
   */
  private _minerValue = BigInt(0)

  private readonly vm: VM
  private blockOpts: BuilderOpts
  private headerData: HeaderData
  private transactions: TypedTransaction[] = []
  private transactionResults: RunTxResult[] = []
  private withdrawals?: Withdrawal[]
  private checkpointed = false
  private blockStatus: BlockStatus = { status: BuildStatus.Pending }

  get transactionReceipts(): (PreByzantiumTxReceipt | PostByzantiumTxReceipt | EIP4844BlobTxReceipt)[] {
    return this.transactionResults.map((result) => result.receipt)
  }

  get minerValue(): bigint {
    return this._minerValue
  }

  constructor(vm: VM, opts: BuildBlockOpts) {
    this.vm = vm
    this.blockOpts = { putBlockIntoBlockchain: true, ...opts.blockOpts, common: this.vm.common }

    this.headerData = {
      ...opts.headerData,
      parentHash: opts.parentBlock.hash(),
      number: opts.headerData?.number ?? opts.parentBlock.header.number + BigInt(1),
      gasLimit: opts.headerData?.gasLimit ?? opts.parentBlock.header.gasLimit,
      timestamp: opts.headerData?.timestamp ?? Math.round(Date.now() / 1000),
    }
    this.withdrawals = opts.withdrawals?.map(Withdrawal.fromWithdrawalData)

    if (
      this.vm.common.isActivatedEIP(1559) === true &&
      typeof this.headerData.baseFeePerGas === 'undefined'
    ) {
      this.headerData.baseFeePerGas = opts.parentBlock.header.calcNextBaseFee()
    }

    if (
      this.vm.common.isActivatedEIP(4844) === true &&
      typeof this.headerData.excessBlobGas === 'undefined'
    ) {
      this.headerData.excessBlobGas = opts.parentBlock.header.calcNextExcessBlobGas()
    }
  }

  /**
   * Throws if the block has already been built or reverted.
   */
  private checkStatus(): void {
    if (this.blockStatus.status === BuildStatus.Build) {
      throw new Error('Block has already been built')
    }
    if (this.blockStatus.status === BuildStatus.Reverted) {
      throw new Error('State has already been reverted')
    }
  }

  public getStatus(): BlockStatus {
    return this.blockStatus
  }

  /**
   * Calculates and returns the transactionsTrie for the block.
   */
  public async transactionsTrie(): Promise<Uint8Array> {
    return Block.genTransactionsTrieRoot(this.transactions)
  }

  /**
   * Calculates and returns the logs bloom for the block.
   */
  public logsBloom(): Uint8Array {
    const bloom = new Bloom()
    for (const txResult of this.transactionResults) {
      // Combine blooms via bitwise OR
      bloom.or(txResult.bloom)
    }
    return bloom.bitvector
  }

  /**
   * Calculates and returns the receiptTrie for the block.
   */
  public async receiptTrie(): Promise<Uint8Array> {
    const receiptTrie = new Trie()
    for (const [i, txResult] of this.transactionResults.entries()) {
      const tx = this.transactions[i]
      const encodedReceipt = encodeReceipt(txResult.receipt, tx.type)
      await receiptTrie.put(RLP.encode(i), encodedReceipt)
    }
    return receiptTrie.root()
  }

  /**
   * Adds the block miner reward to the coinbase account.
   */
  private async rewardMiner(): Promise<void> {
    const minerReward = this.vm.common.param('pow', 'minerReward')
    const reward = calculateMinerReward(minerReward, 0)
    const coinbase =
      this.headerData.coinbase !== undefined
        ? new Address(toBytes(this.headerData.coinbase))
        : Address.zero()
    await rewardAccount(this.vm.evm, coinbase, reward)
  }

  /**
   * Adds the withdrawal amount to the withdrawal address
   */
  private async processWithdrawals(): Promise<void> {
    for (const withdrawal of this.withdrawals ?? []) {
      const { address, amount } = withdrawal
      // If there is no amount to add, skip touching the account
      // as per the implementation of other clients geth/nethermind
      // although this should never happen as no withdrawals with 0
      // amount should ever land up here.
      if (amount === BigInt(0)) continue
      // Withdrawal amount is represented in Gwei so needs to be
      // converted to wei
      await rewardAccount(this.vm.evm, address, amount * GWEI_TO_WEI)
    }
  }

  /**
   * Run and add a transaction to the block being built.
   * Please note that this modifies the state of the VM.
   * Throws if the transaction's gasLimit is greater than
   * the remaining gas in the block.
   */
  async addTransaction(
    tx: TypedTransaction,
    { skipHardForkValidation }: { skipHardForkValidation?: boolean } = {}
  ): Promise<RunTxResult> {
    this.checkStatus()

    if (!this.checkpointed) {
      await this.vm.evm.journal.checkpoint()
      this.checkpointed = true
    }

    // According to the Yellow Paper, a transaction's gas limit
    // cannot be greater than the remaining gas in the block
    const blockGasLimit = toType(this.headerData.gasLimit, TypeOutput.BigInt)

    const blobGasLimit = this.vm.common.param('gasConfig', 'maxblobGasPerBlock')
    const blobGasPerBlob = this.vm.common.param('gasConfig', 'blobGasPerBlob')

    const blockGasRemaining = blockGasLimit - this.gasUsed
    if (tx.gasLimit > blockGasRemaining) {
      throw new Error('tx has a higher gas limit than the remaining gas in the block')
    }
    let blobGasUsed = undefined
    if (tx instanceof BlobEIP4844Transaction) {
      if (this.blockOpts.common?.isActivatedEIP(4844) !== true) {
        throw Error('eip4844 not activated yet for adding a blob transaction')
      }
      const blobTx = tx as BlobEIP4844Transaction

      // Guard against the case if a tx came into the pool without blobs i.e. network wrapper payload
      if (blobTx.blobs === undefined) {
        throw new Error('blobs missing for 4844 transaction')
      }

      if (this.blobGasUsed + BigInt(blobTx.numBlobs()) * blobGasPerBlob > blobGasLimit) {
        throw new Error('block blob gas limit reached')
      }

      blobGasUsed = this.blobGasUsed
    }
    const header = {
      ...this.headerData,
      gasUsed: this.gasUsed,
      // correct excessBlobGas should already part of headerData used above
      blobGasUsed,
    }

    const blockData = { header, transactions: this.transactions }
    const block = Block.fromBlockData(blockData, this.blockOpts)

    const result = await this.vm.runTx({ tx, block, skipHardForkValidation })

    // If tx is a blob transaction, remove blobs/kzg commitments before adding to block per EIP-4844
    if (tx instanceof BlobEIP4844Transaction) {
      const txData = tx as BlobEIP4844Transaction
      this.blobGasUsed += BigInt(txData.versionedHashes.length) * blobGasPerBlob
      tx = BlobEIP4844Transaction.minimalFromNetworkWrapper(txData, {
        common: this.blockOpts.common,
      })
    }
    this.transactions.push(tx)
    this.transactionResults.push(result)
    this.gasUsed += result.totalGasSpent
    this._minerValue += result.minerValue

    return result
  }

  /**
   * Reverts the checkpoint on the StateManager to reset the state from any transactions that have been run.
   */
  async revert(): Promise<void> {
    if (this.checkpointed) {
      await this.vm.evm.journal.revert()
      this.checkpointed = false
    }
    this.blockStatus = { status: BuildStatus.Reverted }
  }

  /**
   * This method returns the finalized block.
   * It also:
   *  - Assigns the reward for miner (PoW)
   *  - Commits the checkpoint on the StateManager
   *  - Sets the tip of the VM's blockchain to this block
   * For PoW, optionally seals the block with params `nonce` and `mixHash`,
   * which is validated along with the block number and difficulty by ethash.
   * For PoA, please pass `blockOption.cliqueSigner` into the buildBlock constructor,
   * as the signer will be awarded the txs amount spent on gas as they are added.
   */
  async build(sealOpts?: SealBlockOpts): Promise<Block> {
    this.checkStatus()
    const blockOpts = this.blockOpts
    const consensusType = this.vm.common.consensusType()

    if (consensusType === ConsensusType.ProofOfWork) {
      await this.rewardMiner()
    }
    await this.processWithdrawals()

    const stateRoot = await this.vm.stateManager.getStateRoot()
    const transactionsTrie = await this.transactionsTrie()
    const withdrawalsRoot = this.withdrawals
      ? await Block.genWithdrawalsTrieRoot(this.withdrawals)
      : undefined
    const receiptTrie = await this.receiptTrie()
    const logsBloom = this.logsBloom()
    const gasUsed = this.gasUsed
    // timestamp should already be set in constructor
    const timestamp = this.headerData.timestamp ?? BigInt(0)

    let blobGasUsed = undefined
    if (this.vm.common.isActivatedEIP(4844) === true) {
      blobGasUsed = this.blobGasUsed
    }

    const headerData = {
      ...this.headerData,
      stateRoot,
      transactionsTrie,
      withdrawalsRoot,
      receiptTrie,
      logsBloom,
      gasUsed,
      timestamp,
      // correct excessBlobGas should already be part of headerData used above
      blobGasUsed,
    }

    if (consensusType === ConsensusType.ProofOfWork) {
      headerData.nonce = sealOpts?.nonce ?? headerData.nonce
      headerData.mixHash = sealOpts?.mixHash ?? headerData.mixHash
    }

    const blockData = {
      header: headerData,
      transactions: this.transactions,
      withdrawals: this.withdrawals,
    }
    const block = Block.fromBlockData(blockData, blockOpts)

    if (this.blockOpts.putBlockIntoBlockchain === true) {
      await this.vm.blockchain.putBlock(block)
    }

    this.blockStatus = { status: BuildStatus.Build, block }
    if (this.checkpointed) {
      await this.vm.evm.journal.commit()
      this.checkpointed = false
    }

    return block
  }

  async initState(): Promise<void> {
    if (this.vm.common.isActivatedEIP(4788)) {
      if (!this.checkpointed) {
        await this.vm.evm.journal.checkpoint()
        this.checkpointed = true
      }

      const { parentBeaconBlockRoot, timestamp } = this.headerData
      // timestamp should already be set in constructor
      const timestampBigInt = toType(timestamp ?? 0, TypeOutput.BigInt)
      const parentBeaconBlockRootBuf =
        toType(parentBeaconBlockRoot!, TypeOutput.Uint8Array) ?? zeros(32)

      await accumulateParentBeaconBlockRoot.bind(this.vm)(parentBeaconBlockRootBuf, timestampBigInt)
    }
  }
}

export async function buildBlock(this: VM, opts: BuildBlockOpts): Promise<BlockBuilder> {
  const blockBuilder = new BlockBuilder(this, opts)
  await blockBuilder.initState()
  return blockBuilder
}
