import { debug as createDebugLogger } from 'debug'
import { Account, Address, BN, MAX_UINT64 } from 'ethereumjs-util'
import { Block } from '@ethereumjs/block'
import Blockchain from '@ethereumjs/blockchain'
import Common, { ConsensusAlgorithm } from '@ethereumjs/common'
import { StateManager } from '../state/index'
import { VmError, ERROR } from '../exceptions'
import Message from './message'
import EVM, { EVMResult } from './evm'
import { Log } from './types'

const debugGas = createDebugLogger('vm:eei:gas')

function trap(err: ERROR) {
  throw new VmError(err)
}

const MASK_160 = new BN(1).shln(160).subn(1)
function addressToBuffer(address: BN) {
  if (Buffer.isBuffer(address)) return address
  return address.and(MASK_160).toArrayLike(Buffer, 'be', 20)
}

/**
 * Environment data which is made available to EVM bytecode.
 */
export interface Env {
  blockchain: Blockchain
  address: Address
  caller: Address
  callData: Buffer
  callValue: BN
  code: Buffer
  isStatic: boolean
  depth: number
  gasPrice: BN
  origin: Address
  block: Block
  contract: Account
  // Different than address for DELEGATECALL and CALLCODE
  codeAddress: Address
}

/**
 * Immediate (unprocessed) result of running an EVM bytecode.
 */
export interface RunResult {
  logs: Log[]
  returnValue?: Buffer
  /**
   * A map from the accounts that have self-destructed to the addresses to send their funds to
   */
  selfdestruct: { [k: string]: Buffer }
}

/**
 * External interface made available to EVM bytecode. Modeled after
 * the ewasm EEI [spec](https://github.com/ewasm/design/blob/master/eth_interface.md).
 * It includes methods for accessing/modifying state, calling or creating contracts, access
 * to environment data among other things.
 * The EEI instance also keeps artifacts produced by the bytecode such as logs
 * and to-be-selfdestructed addresses.
 */
export default class EEI {
  _env: Env
  _result: RunResult
  _state: StateManager
  _evm: EVM
  _lastReturned: Buffer
  _common: Common
  _gasLeft: BN

  constructor(env: Env, state: StateManager, evm: EVM, common: Common, gasLeft: BN) {
    this._env = env
    this._state = state
    this._evm = evm
    this._lastReturned = Buffer.alloc(0)
    this._common = common
    this._gasLeft = gasLeft
    this._result = {
      logs: [],
      returnValue: undefined,
      selfdestruct: {},
    }
  }

  /**
   * Subtracts an amount from the gas counter.
   * @param amount - Amount of gas to consume
   * @param context - Usage context for debugging
   * @throws if out of gas
   */
  useGas(amount: BN, context?: string): void {
    this._gasLeft.isub(amount)
    if (this._evm._vm.DEBUG) {
      debugGas(`${context ? context + ': ' : ''}used ${amount} gas (-> ${this._gasLeft})`)
    }
    if (this._gasLeft.ltn(0)) {
      this._gasLeft = new BN(0)
      trap(ERROR.OUT_OF_GAS)
    }
  }

  /**
   * Adds a positive amount to the gas counter.
   * @param amount - Amount of gas refunded
   * @param context - Usage context for debugging
   */
  refundGas(amount: BN, context?: string): void {
    if (this._evm._vm.DEBUG) {
      debugGas(`${context ? context + ': ' : ''}refund ${amount} gas (-> ${this._evm._refund})`)
    }
    this._evm._refund.iadd(amount)
  }

  /**
   * Reduces amount of gas to be refunded by a positive value.
   * @param amount - Amount to subtract from gas refunds
   * @param context - Usage context for debugging
   */
  subRefund(amount: BN, context?: string): void {
    if (this._evm._vm.DEBUG) {
      debugGas(`${context ? context + ': ' : ''}sub gas refund ${amount} (-> ${this._evm._refund})`)
    }
    this._evm._refund.isub(amount)
    if (this._evm._refund.ltn(0)) {
      this._evm._refund = new BN(0)
      trap(ERROR.REFUND_EXHAUSTED)
    }
  }

  /**
   * Increments the internal gasLeft counter. Used for adding callStipend.
   * @param amount - Amount to add
   */
  addStipend(amount: BN): void {
    if (this._evm._vm.DEBUG) {
      debugGas(`add stipend ${amount} (-> ${this._gasLeft})`)
    }
    this._gasLeft.iadd(amount)
  }

  /**
   * Returns address of currently executing account.
   */
  getAddress(): Address {
    return this._env.address
  }

  /**
   * Returns balance of the given account.
   * @param address - Address of account
   */
  async getExternalBalance(address: Address): Promise<BN> {
    // shortcut if current account
    if (address.equals(this._env.address)) {
      return this._env.contract.balance
    }

    // otherwise load account then return balance
    const account = await this._state.getAccount(address)
    return account.balance
  }

  /**
   * Returns balance of self.
   */
  getSelfBalance(): BN {
    return this._env.contract.balance
  }

  /**
   * Returns caller address. This is the address of the account
   * that is directly responsible for this execution.
   */
  getCaller(): BN {
    return new BN(this._env.caller.buf)
  }

  /**
   * Returns the deposited value by the instruction/transaction
   * responsible for this execution.
   */
  getCallValue(): BN {
    return new BN(this._env.callValue)
  }

  /**
   * Returns input data in current environment. This pertains to the input
   * data passed with the message call instruction or transaction.
   */
  getCallData(): Buffer {
    return this._env.callData
  }

  /**
   * Returns size of input data in current environment. This pertains to the
   * input data passed with the message call instruction or transaction.
   */
  getCallDataSize(): BN {
    return new BN(this._env.callData.length)
  }

  /**
   * Returns the size of code running in current environment.
   */
  getCodeSize(): BN {
    return new BN(this._env.code.length)
  }

  /**
   * Returns the code running in current environment.
   */
  getCode(): Buffer {
    return this._env.code
  }

  /**
   * Returns true if the current call must be executed statically.
   */
  isStatic(): boolean {
    return this._env.isStatic
  }

  /**
   * Get size of an account’s code.
   * @param address - Address of account
   */
  async getExternalCodeSize(address: BN): Promise<BN> {
    const addr = new Address(addressToBuffer(address))
    const code = await this._state.getContractCode(addr)
    return new BN(code.length)
  }

  /**
   * Returns code of an account.
   * @param address - Address of account
   */
  async getExternalCode(address: BN): Promise<Buffer> {
    const addr = new Address(addressToBuffer(address))
    return this._state.getContractCode(addr)
  }

  /**
   * Returns size of current return data buffer. This contains the return data
   * from the last executed call, callCode, callDelegate, callStatic or create.
   * Note: create only fills the return data buffer in case of a failure.
   */
  getReturnDataSize(): BN {
    return new BN(this._lastReturned.length)
  }

  /**
   * Returns the current return data buffer. This contains the return data
   * from last executed call, callCode, callDelegate, callStatic or create.
   * Note: create only fills the return data buffer in case of a failure.
   */
  getReturnData(): Buffer {
    return this._lastReturned
  }

  /**
   * Returns price of gas in current environment.
   */
  getTxGasPrice(): BN {
    return this._env.gasPrice
  }

  /**
   * Returns the execution's origination address. This is the
   * sender of original transaction; it is never an account with
   * non-empty associated code.
   */
  getTxOrigin(): BN {
    return new BN(this._env.origin.buf)
  }

  /**
   * Returns the block’s number.
   */
  getBlockNumber(): BN {
    return this._env.block.header.number
  }

  /**
   * Returns the block's beneficiary address.
   */
  getBlockCoinbase(): BN {
    let coinbase: Address
    if (this._common.consensusAlgorithm() === ConsensusAlgorithm.Clique) {
      // Backwards-compatibilty check
      // TODO: can be removed along VM v5 release
      if ('cliqueSigner' in this._env.block.header) {
        coinbase = this._env.block.header.cliqueSigner()
      } else {
        coinbase = Address.zero()
      }
    } else {
      coinbase = this._env.block.header.coinbase
    }
    return new BN(coinbase.toBuffer())
  }

  /**
   * Returns the block's timestamp.
   */
  getBlockTimestamp(): BN {
    return this._env.block.header.timestamp
  }

  /**
   * Returns the block's difficulty.
   */
  getBlockDifficulty(): BN {
    return this._env.block.header.difficulty
  }

  /**
   * Returns the block's prevRandao field.
   */
  getBlockPrevRandao(): BN {
    return new BN(this._env.block.header.prevRandao)
  }

  /**
   * Returns the block's gas limit.
   */
  getBlockGasLimit(): BN {
    return this._env.block.header.gasLimit
  }

  /**
   * Returns the chain ID for current chain. Introduced for the
   * CHAINID opcode proposed in [EIP-1344](https://eips.ethereum.org/EIPS/eip-1344).
   */
  getChainId(): BN {
    return this._common.chainIdBN()
  }

  /**
   * Returns the Base Fee of the block as proposed in [EIP-3198](https;//eips.etheruem.org/EIPS/eip-3198)
   */
  getBlockBaseFee(): BN {
    const baseFee = this._env.block.header.baseFeePerGas
    if (baseFee === undefined) {
      // Sanity check
      throw new Error('Block has no Base Fee')
    }
    return baseFee
  }

  /**
   * Returns Gets the hash of one of the 256 most recent complete blocks.
   * @param num - Number of block
   */
  async getBlockHash(num: BN): Promise<BN> {
    const block = await this._env.blockchain.getBlock(num)
    return new BN(block.hash())
  }

  /**
   * Store 256-bit a value in memory to persistent storage.
   */
  async storageStore(key: Buffer, value: Buffer): Promise<void> {
    await this._state.putContractStorage(this._env.address, key, value)
    const account = await this._state.getAccount(this._env.address)
    this._env.contract = account
  }

  /**
   * Loads a 256-bit value to memory from persistent storage.
   * @param key - Storage key
   * @param original - If true, return the original storage value (default: false)
   */
  async storageLoad(key: Buffer, original = false): Promise<Buffer> {
    if (original) {
      return this._state.getOriginalContractStorage(this._env.address, key)
    } else {
      return this._state.getContractStorage(this._env.address, key)
    }
  }

  /**
   * Returns the current gasCounter.
   */
  getGasLeft(): BN {
    return this._gasLeft.clone()
  }

  /**
   * Set the returning output data for the execution.
   * @param returnData - Output data to return
   */
  finish(returnData: Buffer): void {
    this._result.returnValue = returnData
    trap(ERROR.STOP)
  }

  /**
   * Set the returning output data for the execution. This will halt the
   * execution immediately and set the execution result to "reverted".
   * @param returnData - Output data to return
   */
  revert(returnData: Buffer): void {
    this._result.returnValue = returnData
    trap(ERROR.REVERT)
  }

  /**
   * Mark account for later deletion and give the remaining balance to the
   * specified beneficiary address. This will cause a trap and the
   * execution will be aborted immediately.
   * @param toAddress - Beneficiary address
   */
  async selfDestruct(toAddress: Address): Promise<void> {
    return this._selfDestruct(toAddress)
  }

  async _selfDestruct(toAddress: Address): Promise<void> {
    // only add to refund if this is the first selfdestruct for the address
    if (!this._result.selfdestruct[this._env.address.buf.toString('hex')]) {
      this.refundGas(new BN(this._common.param('gasPrices', 'selfdestructRefund')))
    }

    this._result.selfdestruct[this._env.address.buf.toString('hex')] = toAddress.buf

    // Add to beneficiary balance
    const toAccount = await this._state.getAccount(toAddress)
    toAccount.balance.iadd(this._env.contract.balance)
    await this._state.putAccount(toAddress, toAccount)

    // Subtract from contract balance
    const account = await this._state.getAccount(this._env.address)
    account.balance = new BN(0)
    await this._state.putAccount(this._env.address, account)

    trap(ERROR.STOP)
  }

  /**
   * Creates a new log in the current environment.
   */
  log(data: Buffer, numberOfTopics: number, topics: Buffer[]): void {
    if (numberOfTopics < 0 || numberOfTopics > 4) {
      trap(ERROR.OUT_OF_RANGE)
    }

    if (topics.length !== numberOfTopics) {
      trap(ERROR.INTERNAL_ERROR)
    }

    const log: Log = [this._env.address.buf, topics, data]
    this._result.logs.push(log)
  }

  /**
   * Sends a message with arbitrary data to a given address path.
   */
  async call(gasLimit: BN, address: Address, value: BN, data: Buffer): Promise<BN> {
    const msg = new Message({
      caller: this._env.address,
      gasLimit,
      to: address,
      value,
      data,
      isStatic: this._env.isStatic,
      depth: this._env.depth + 1,
    })

    return this._baseCall(msg)
  }

  /**
   * Message-call into this account with an alternative account's code.
   */
  async callCode(gasLimit: BN, address: Address, value: BN, data: Buffer): Promise<BN> {
    const msg = new Message({
      caller: this._env.address,
      gasLimit,
      to: this._env.address,
      codeAddress: address,
      value,
      data,
      isStatic: this._env.isStatic,
      depth: this._env.depth + 1,
    })

    return this._baseCall(msg)
  }

  /**
   * Sends a message with arbitrary data to a given address path, but disallow
   * state modifications. This includes log, create, selfdestruct and call with
   * a non-zero value.
   */
  async callStatic(gasLimit: BN, address: Address, value: BN, data: Buffer): Promise<BN> {
    const msg = new Message({
      caller: this._env.address,
      gasLimit,
      to: address,
      value,
      data,
      isStatic: true,
      depth: this._env.depth + 1,
    })

    return this._baseCall(msg)
  }

  /**
   * Message-call into this account with an alternative account’s code, but
   * persisting the current values for sender and value.
   */
  async callDelegate(gasLimit: BN, address: Address, value: BN, data: Buffer): Promise<BN> {
    const msg = new Message({
      caller: this._env.caller,
      gasLimit,
      to: this._env.address,
      codeAddress: address,
      value,
      data,
      isStatic: this._env.isStatic,
      delegatecall: true,
      depth: this._env.depth + 1,
    })

    return this._baseCall(msg)
  }

  async _baseCall(msg: Message): Promise<BN> {
    const selfdestruct = { ...this._result.selfdestruct }
    msg.selfdestruct = selfdestruct

    // empty the return data buffer
    this._lastReturned = Buffer.alloc(0)

    // Check if account has enough ether and max depth not exceeded
    if (
      this._env.depth >= this._common.param('vm', 'stackLimit') ||
      (msg.delegatecall !== true && this._env.contract.balance.lt(msg.value))
    ) {
      return new BN(0)
    }

    const results = await this._evm.executeMessage(msg)

    if (results.execResult.logs) {
      this._result.logs = this._result.logs.concat(results.execResult.logs)
    }

    // this should always be safe
    this.useGas(results.gasUsed, 'CALL, STATICCALL, DELEGATECALL, CALLCODE')

    // Set return value
    if (
      results.execResult.returnValue &&
      (!results.execResult.exceptionError ||
        results.execResult.exceptionError.error === ERROR.REVERT)
    ) {
      this._lastReturned = results.execResult.returnValue
    }

    if (!results.execResult.exceptionError) {
      Object.assign(this._result.selfdestruct, selfdestruct)
      // update stateRoot on current contract
      const account = await this._state.getAccount(this._env.address)
      this._env.contract = account
    }

    return this._getReturnCode(results)
  }

  /**
   * Creates a new contract with a given value.
   */
  async create(gasLimit: BN, value: BN, data: Buffer, salt: Buffer | null = null): Promise<BN> {
    const selfdestruct = { ...this._result.selfdestruct }
    const msg = new Message({
      caller: this._env.address,
      gasLimit,
      value,
      data,
      salt,
      depth: this._env.depth + 1,
      selfdestruct,
    })

    // empty the return data buffer
    this._lastReturned = Buffer.alloc(0)

    // Check if account has enough ether and max depth not exceeded
    if (
      this._env.depth >= this._common.param('vm', 'stackLimit') ||
      (msg.delegatecall !== true && this._env.contract.balance.lt(msg.value))
    ) {
      return new BN(0)
    }

    // EIP-2681 check
    if (this._env.contract.nonce.gte(MAX_UINT64)) {
      return new BN(0)
    }

    this._env.contract.nonce.iaddn(1)
    await this._state.putAccount(this._env.address, this._env.contract)

    if (this._common.isActivatedEIP(3860)) {
      if (msg.data.length > this._common.param('vm', 'maxInitCodeSize')) {
        return new BN(0)
      }
    }

    const results = await this._evm.executeMessage(msg)

    if (results.execResult.logs) {
      this._result.logs = this._result.logs.concat(results.execResult.logs)
    }

    // this should always be safe
    this.useGas(results.gasUsed, 'CREATE')

    // Set return buffer in case revert happened
    if (
      results.execResult.exceptionError &&
      results.execResult.exceptionError.error === ERROR.REVERT
    ) {
      this._lastReturned = results.execResult.returnValue
    }

    if (
      !results.execResult.exceptionError ||
      results.execResult.exceptionError.error === ERROR.CODESTORE_OUT_OF_GAS
    ) {
      Object.assign(this._result.selfdestruct, selfdestruct)
      // update stateRoot on current contract
      const account = await this._state.getAccount(this._env.address)
      this._env.contract = account
      if (results.createdAddress) {
        // push the created address to the stack
        return new BN(results.createdAddress.buf)
      }
    }

    return this._getReturnCode(results)
  }

  /**
   * Creates a new contract with a given value. Generates
   * a deterministic address via CREATE2 rules.
   */
  async create2(gasLimit: BN, value: BN, data: Buffer, salt: Buffer): Promise<BN> {
    return this.create(gasLimit, value, data, salt)
  }

  /**
   * Returns true if account is empty or non-existent (according to EIP-161).
   * @param address - Address of account
   */
  async isAccountEmpty(address: Address): Promise<boolean> {
    return this._state.accountIsEmpty(address)
  }

  /**
   * Returns true if account exists in the state trie (it can be empty). Returns false if the account is `null`.
   * @param address - Address of account
   */
  async accountExists(address: Address): Promise<boolean> {
    return this._state.accountExists(address)
  }

  private _getReturnCode(results: EVMResult) {
    // This preserves the previous logic, but seems to contradict the EEI spec
    // https://github.com/ewasm/design/blob/38eeded28765f3e193e12881ea72a6ab807a3371/eth_interface.md
    if (results.execResult.exceptionError) {
      return new BN(0)
    } else {
      return new BN(1)
    }
  }
}
