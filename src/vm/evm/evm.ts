import { debug as createDebugLogger } from 'debug'
import {
  Account,
  Address,
  BN,
  generateAddress,
  generateAddress2,
  KECCAK256_NULL,
  MAX_INTEGER,
} from 'ethereumjs-util'
import { Block } from '@ethereumjs/block'
import { ERROR, VmError } from '../exceptions'
import { StateManager } from '../state/index'
import { getPrecompile, PrecompileFunc } from './precompiles'
import TxContext from './txContext'
import Message from './message'
import EEI from './eei'
// eslint-disable-next-line
import { short } from './opcodes/util'
import * as eof from './opcodes/eof'
import { Log } from './types'
import { default as Interpreter, InterpreterOpts, RunState } from './interpreter'

const debug = createDebugLogger('vm:evm')
const debugGas = createDebugLogger('vm:evm:gas')

/**
 * Result of executing a message via the {@link EVM}.
 */
export interface EVMResult {
  /**
   * Amount of gas used by the transaction
   */
  gasUsed: BN
  /**
   * Address of created account durint transaction, if any
   */
  createdAddress?: Address
  /**
   * Contains the results from running the code, if any, as described in {@link runCode}
   */
  execResult: ExecResult
}

/**
 * Result of executing a call via the {@link EVM}.
 */
export interface ExecResult {
  runState?: RunState
  /**
   * Description of the exception, if any occured
   */
  exceptionError?: VmError
  /**
   * Amount of gas left
   */
  gas?: BN
  /**
   * Amount of gas the code used to run
   */
  gasUsed: BN
  /**
   * Return value from the contract
   */
  returnValue: Buffer
  /**
   * Array of logs that the contract emitted
   */
  logs?: Log[]
  /**
   * A map from the accounts that have self-destructed to the addresses to send their funds to
   */
  selfdestruct?: { [k: string]: Buffer }
  /**
   * Total amount of gas to be refunded from all nested calls.
   */
  gasRefund?: BN
}

export interface NewContractEvent {
  address: Address
  // The deployment code
  code: Buffer
}

export function OOGResult(gasLimit: BN): ExecResult {
  return {
    returnValue: Buffer.alloc(0),
    gasUsed: gasLimit,
    exceptionError: new VmError(ERROR.OUT_OF_GAS),
  }
}
// CodeDeposit OOG Result
export function COOGResult(gasUsedCreateCode: BN): ExecResult {
  return {
    returnValue: Buffer.alloc(0),
    gasUsed: gasUsedCreateCode,
    exceptionError: new VmError(ERROR.CODESTORE_OUT_OF_GAS),
  }
}

export function INVALID_BYTECODE_RESULT(gasLimit: BN): ExecResult {
  return {
    returnValue: Buffer.alloc(0),
    gasUsed: gasLimit,
    exceptionError: new VmError(ERROR.INVALID_BYTECODE_RESULT),
  }
}

export function INVALID_EOF_RESULT(gasLimit: BN): ExecResult {
  return {
    returnValue: Buffer.alloc(0),
    gasUsed: gasLimit,
    exceptionError: new VmError(ERROR.INVALID_EOF_FORMAT),
  }
}

export function VmErrorResult(error: VmError, gasUsed: BN): ExecResult {
  return {
    returnValue: Buffer.alloc(0),
    gasUsed: gasUsed,
    exceptionError: error,
  }
}

/**
 * EVM is responsible for executing an EVM message fully
 * (including any nested calls and creates), processing the results
 * and storing them to state (or discarding changes in case of exceptions).
 * @ignore
 */
export default class EVM {
  _vm: any
  _state: StateManager
  _tx: TxContext
  _block: Block
  /**
   * Amount of gas to refund from deleting storage values
   */
  _refund: BN

  constructor(vm: any, txContext: TxContext, block: Block) {
    this._vm = vm
    this._state = this._vm.stateManager
    this._tx = txContext
    this._block = block
    this._refund = new BN(0)
  }

  /**
   * Executes an EVM message, determining whether it's a call or create
   * based on the `to` address. It checkpoints the state and reverts changes
   * if an exception happens during the message execution.
   */
  async executeMessage(message: Message): Promise<EVMResult> {
    await this._vm._emit('beforeMessage', message)

    if (!message.to && this._vm._common.isActivatedEIP(2929)) {
      message.code = message.data
      ;(<any>this._state).addWarmedAddress((await this._generateAddress(message)).buf)
    }

    const oldRefund = this._refund.clone()

    await this._state.checkpoint()
    if (this._vm.DEBUG) {
      debug('-'.repeat(100))
      debug(`message checkpoint`)
    }

    let result
    if (this._vm.DEBUG) {
      const { caller, gasLimit, to, value, delegatecall } = message
      debug(
        `New message caller=${caller} gasLimit=${gasLimit} to=${
          to?.toString() ?? 'none'
        } value=${value} delegatecall=${delegatecall ? 'yes' : 'no'}`
      )
    }
    if (message.to) {
      if (this._vm.DEBUG) {
        debug(`Message CALL execution (to: ${message.to})`)
      }
      result = await this._executeCall(message)
    } else {
      if (this._vm.DEBUG) {
        debug(`Message CREATE execution (to undefined)`)
      }
      result = await this._executeCreate(message)
    }
    if (this._vm.DEBUG) {
      const { gasUsed, exceptionError, returnValue, gasRefund } = result.execResult
      debug(
        `Received message execResult: [ gasUsed=${gasUsed} exceptionError=${
          exceptionError ? `'${exceptionError.error}'` : 'none'
        } returnValue=0x${short(returnValue)} gasRefund=${gasRefund ?? 0} ]`
      )
    }
    const err = result.execResult.exceptionError

    // This clause captures any error which happened during execution
    // If that is the case, then set the _refund tracker to the old refund value
    if (err) {
      // TODO: Move `gasRefund` to a tx-level result object
      // instead of `ExecResult`.
      this._refund = oldRefund
      result.execResult.selfdestruct = {}
    }
    result.execResult.gasRefund = this._refund.clone()

    if (err) {
      if (this._vm._common.gteHardfork('homestead') || err.error != ERROR.CODESTORE_OUT_OF_GAS) {
        result.execResult.logs = []
        await this._state.revert()
        if (this._vm.DEBUG) {
          debug(`message checkpoint reverted`)
        }
      } else {
        // we are in chainstart and the error was the code deposit error
        // we do like nothing happened.
        await this._state.commit()
        if (this._vm.DEBUG) {
          debug(`message checkpoint committed`)
        }
      }
    } else {
      await this._state.commit()
      if (this._vm.DEBUG) {
        debug(`message checkpoint committed`)
      }
    }

    await this._vm._emit('afterMessage', result)

    return result
  }

  async _executeCall(message: Message): Promise<EVMResult> {
    const account = await this._state.getAccount(message.caller)
    // Reduce tx value from sender
    if (!message.delegatecall) {
      await this._reduceSenderBalance(account, message)
    }
    // Load `to` account
    const toAccount = await this._state.getAccount(message.to)
    // Add tx value to the `to` account
    let errorMessage
    if (!message.delegatecall) {
      try {
        await this._addToBalance(toAccount, message)
      } catch (e: any) {
        errorMessage = e
      }
    }

    // Load code
    await this._loadCode(message)
    let exit = false
    if (!message.code || message.code.length === 0) {
      exit = true
      if (this._vm.DEBUG) {
        debug(`Exit early on no code`)
      }
    }
    if (errorMessage) {
      exit = true
      if (this._vm.DEBUG) {
        debug(`Exit early on value transfer overflowed`)
      }
    }
    if (exit) {
      return {
        gasUsed: new BN(0),
        execResult: {
          gasUsed: new BN(0),
          exceptionError: errorMessage, // Only defined if addToBalance failed
          returnValue: Buffer.alloc(0),
        },
      }
    }

    let result: ExecResult
    if (message.isCompiled) {
      if (this._vm.DEBUG) {
        debug(`Run precompile`)
      }
      result = await this.runPrecompile(
        message.code as PrecompileFunc,
        message.data,
        message.gasLimit
      )
    } else {
      if (this._vm.DEBUG) {
        debug(`Start bytecode processing...`)
      }
      result = await this.runInterpreter(message)
    }

    return {
      gasUsed: result.gasUsed,
      execResult: result,
    }
  }

  async _executeCreate(message: Message): Promise<EVMResult> {
    const account = await this._state.getAccount(message.caller)
    // Reduce tx value from sender
    await this._reduceSenderBalance(account, message)

    if (this._vm._common.isActivatedEIP(3860)) {
      if (message.data.length > this._vm._common.param('vm', 'maxInitCodeSize')) {
        return {
          gasUsed: message.gasLimit,
          createdAddress: message.to,
          execResult: {
            returnValue: Buffer.alloc(0),
            exceptionError: new VmError(ERROR.INITCODE_SIZE_VIOLATION),
            gasUsed: message.gasLimit,
          },
        }
      }
    }

    message.code = message.data
    message.data = Buffer.alloc(0)
    message.to = await this._generateAddress(message)
    if (this._vm.DEBUG) {
      debug(`Generated CREATE contract address ${message.to}`)
    }
    let toAccount = await this._state.getAccount(message.to)

    // Check for collision
    if ((toAccount.nonce && toAccount.nonce.gtn(0)) || !toAccount.codeHash.equals(KECCAK256_NULL)) {
      if (this._vm.DEBUG) {
        debug(`Returning on address collision`)
      }
      return {
        gasUsed: message.gasLimit,
        createdAddress: message.to,
        execResult: {
          returnValue: Buffer.alloc(0),
          exceptionError: new VmError(ERROR.CREATE_COLLISION),
          gasUsed: message.gasLimit,
        },
      }
    }

    await this._state.clearContractStorage(message.to)

    const newContractEvent: NewContractEvent = {
      address: message.to,
      code: message.code,
    }

    await this._vm._emit('newContract', newContractEvent)

    toAccount = await this._state.getAccount(message.to)
    // EIP-161 on account creation and CREATE execution
    if (this._vm._common.gteHardfork('spuriousDragon')) {
      toAccount.nonce.iaddn(1)
    }

    // Add tx value to the `to` account
    let errorMessage
    try {
      await this._addToBalance(toAccount, message)
    } catch (e: any) {
      errorMessage = e
    }

    let exit = false
    if (!message.code || message.code.length === 0) {
      exit = true
      if (this._vm.DEBUG) {
        debug(`Exit early on no code`)
      }
    }
    if (errorMessage) {
      exit = true
      if (this._vm.DEBUG) {
        debug(`Exit early on value transfer overflowed`)
      }
    }
    if (exit) {
      return {
        gasUsed: new BN(0),
        createdAddress: message.to,
        execResult: {
          gasUsed: new BN(0),
          exceptionError: errorMessage, // only defined if addToBalance failed
          returnValue: Buffer.alloc(0),
        },
      }
    }

    if (this._vm.DEBUG) {
      debug(`Start bytecode processing...`)
    }

    let result = await this.runInterpreter(message)
    // fee for size of the return value
    let totalGas = result.gasUsed
    let returnFee = new BN(0)
    if (!result.exceptionError) {
      returnFee = new BN(result.returnValue.length).imuln(
        this._vm._common.param('gasPrices', 'createData')
      )
      totalGas = totalGas.add(returnFee)
      if (this._vm.DEBUG) {
        debugGas(`Add return value size fee (${returnFee} to gas used (-> ${totalGas}))`)
      }
    }

    // Check for SpuriousDragon EIP-170 code size limit
    let allowedCodeSize = true
    if (
      !result.exceptionError &&
      this._vm._common.gteHardfork('spuriousDragon') &&
      result.returnValue.length > this._vm._common.param('vm', 'maxCodeSize')
    ) {
      allowedCodeSize = false
    }

    // If enough gas and allowed code size
    let CodestoreOOG = false
    if (
      totalGas.lte(message.gasLimit) &&
      (this._vm._allowUnlimitedContractSize || allowedCodeSize)
    ) {
      if (this._vm._common.isActivatedEIP(3541) && result.returnValue[0] === eof.FORMAT) {
        if (!this._vm._common.isActivatedEIP(3540)) {
          result = { ...result, ...INVALID_BYTECODE_RESULT(message.gasLimit) }
        }
        // Begin EOF1 contract code checks
        // EIP-3540 EOF1 header check
        const eof1CodeAnalysisResults = eof.codeAnalysis(result.returnValue)
        if (!eof1CodeAnalysisResults?.code) {
          result = {
            ...result,
            ...INVALID_EOF_RESULT(message.gasLimit),
          }
        } else if (this._vm._common.isActivatedEIP(3670)) {
          // EIP-3670 EOF1 opcode check
          const codeStart = eof1CodeAnalysisResults.data > 0 ? 10 : 7
          // The start of the code section of an EOF1 compliant contract will either be
          // index 7 (if no data section is present) or index 10 (if a data section is present)
          // in the bytecode of the contract
          if (
            !eof.validOpcodes(
              result.returnValue.slice(codeStart, codeStart + eof1CodeAnalysisResults.code)
            )
          ) {
            result = {
              ...result,
              ...INVALID_EOF_RESULT(message.gasLimit),
            }
          } else {
            result.gasUsed = totalGas
          }
        }
      } else {
        result.gasUsed = totalGas
      }
    } else {
      if (this._vm._common.gteHardfork('homestead')) {
        if (this._vm.DEBUG) {
          debug(`Not enough gas or code size not allowed (>= Homestead)`)
        }
        result = { ...result, ...OOGResult(message.gasLimit) }
      } else {
        // we are in Frontier
        if (this._vm.DEBUG) {
          debug(`Not enough gas or code size not allowed (Frontier)`)
        }
        if (totalGas.sub(returnFee).lte(message.gasLimit)) {
          // we cannot pay the code deposit fee (but the deposit code actually did run)
          result = { ...result, ...COOGResult(totalGas.sub(returnFee)) }
          CodestoreOOG = true
        } else {
          result = { ...result, ...OOGResult(message.gasLimit) }
        }
      }
    }

    // Save code if a new contract was created
    if (!result.exceptionError && result.returnValue && result.returnValue.toString() !== '') {
      await this._state.putContractCode(message.to, result.returnValue)
      if (this._vm.DEBUG) {
        debug(`Code saved on new contract creation`)
      }
    } else if (CodestoreOOG) {
      // This only happens at Frontier. But, let's do a sanity check;
      if (!this._vm._common.gteHardfork('homestead')) {
        // Pre-Homestead behavior; put an empty contract.
        // This contract would be considered "DEAD" in later hard forks.
        // It is thus an unecessary default item, which we have to save to dik
        // It does change the state root, but it only wastes storage.
        //await this._state.putContractCode(message.to, result.returnValue)
        const account = await this._state.getAccount(message.to)
        await this._state.putAccount(message.to, account)
      }
    }

    return {
      gasUsed: result.gasUsed,
      createdAddress: message.to,
      execResult: result,
    }
  }

  /**
   * Starts the actual bytecode processing for a CALL or CREATE, providing
   * it with the {@link EEI}.
   */
  async runInterpreter(message: Message, opts: InterpreterOpts = {}): Promise<ExecResult> {
    const env = {
      blockchain: this._vm.blockchain, // Only used in BLOCKHASH
      address: message.to || Address.zero(),
      caller: message.caller || Address.zero(),
      callData: message.data || Buffer.from([0]),
      callValue: message.value || new BN(0),
      code: message.code as Buffer,
      isStatic: message.isStatic || false,
      depth: message.depth || 0,
      gasPrice: this._tx.gasPrice,
      origin: this._tx.origin || message.caller || Address.zero(),
      block: this._block || new Block(),
      contract: await this._state.getAccount(message.to || Address.zero()),
      codeAddress: message.codeAddress,
    }
    const eei = new EEI(env, this._state, this, this._vm._common, message.gasLimit.clone())
    if (message.selfdestruct) {
      eei._result.selfdestruct = message.selfdestruct
    }

    const interpreter = new Interpreter(this._vm, eei)
    const interpreterRes = await interpreter.run(message.code as Buffer, opts)

    let result = eei._result
    let gasUsed = message.gasLimit.sub(eei._gasLeft)
    if (interpreterRes.exceptionError) {
      if (
        interpreterRes.exceptionError.error !== ERROR.REVERT &&
        interpreterRes.exceptionError.error !== ERROR.INVALID_EOF_FORMAT
      ) {
        gasUsed = message.gasLimit
      }

      // Clear the result on error
      result = {
        ...result,
        logs: [],
        selfdestruct: {},
      }
    }

    return {
      ...result,
      runState: {
        ...interpreterRes.runState!,
        ...result,
        ...eei._env,
      },
      exceptionError: interpreterRes.exceptionError,
      gas: eei._gasLeft,
      gasUsed,
      returnValue: result.returnValue ? result.returnValue : Buffer.alloc(0),
    }
  }

  /**
   * Returns code for precompile at the given address, or undefined
   * if no such precompile exists.
   */
  getPrecompile(address: Address): PrecompileFunc {
    return getPrecompile(address, this._vm._common)
  }

  /**
   * Executes a precompiled contract with given data and gas limit.
   */
  runPrecompile(
    code: PrecompileFunc,
    data: Buffer,
    gasLimit: BN
  ): Promise<ExecResult> | ExecResult {
    if (typeof code !== 'function') {
      throw new Error('Invalid precompile')
    }

    const opts = {
      data,
      gasLimit,
      _common: this._vm._common,
      _VM: this._vm,
    }

    return code(opts)
  }

  async _loadCode(message: Message): Promise<void> {
    if (!message.code) {
      const precompile = this.getPrecompile(message.codeAddress)
      if (precompile) {
        message.code = precompile
        message.isCompiled = true
      } else {
        message.code = await this._state.getContractCode(message.codeAddress)
        message.isCompiled = false
      }
    }
  }

  async _generateAddress(message: Message): Promise<Address> {
    let addr
    if (message.salt) {
      addr = generateAddress2(message.caller.buf, message.salt, message.code as Buffer)
    } else {
      const acc = await this._state.getAccount(message.caller)
      const newNonce = acc.nonce.subn(1)
      addr = generateAddress(message.caller.buf, newNonce.toArrayLike(Buffer))
    }
    return new Address(addr)
  }

  async _reduceSenderBalance(account: Account, message: Message): Promise<void> {
    account.balance.isub(message.value)
    const result = this._state.putAccount(message.caller, account)
    if (this._vm.DEBUG) {
      debug(`Reduced sender (${message.caller}) balance (-> ${account.balance})`)
    }
    return result
  }

  async _addToBalance(toAccount: Account, message: Message): Promise<void> {
    const newBalance = toAccount.balance.add(message.value)
    if (newBalance.gt(MAX_INTEGER)) {
      throw new VmError(ERROR.VALUE_OVERFLOW)
    }
    toAccount.balance = newBalance
    // putAccount as the nonce may have changed for contract creation
    const result = this._state.putAccount(message.to, toAccount)
    if (this._vm.DEBUG) {
      debug(`Added toAccount (${message.to}) balance (-> ${toAccount.balance})`)
    }
    return result
  }

  async _touchAccount(address: Address): Promise<void> {
    const account = await this._state.getAccount(address)
    return this._state.putAccount(address, account)
  }
}
