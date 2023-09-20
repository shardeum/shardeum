import { zeros } from '@ethereumjs/util'

import type { EvmError } from './exceptions.js'
import type { InterpreterStep, RunState } from './interpreter.js'
import type { Message } from './message.js'
import type { AsyncDynamicGasHandler, SyncDynamicGasHandler } from './opcodes/gas.js'
import type { OpHandler } from './opcodes/index.js'
import type { CustomPrecompile } from './precompiles/index.js'
import type { PrecompileFunc } from './precompiles/types.js'
import type { Common, EVMStateManagerInterface } from '@ethereumjs/common'
import type { Account, Address, AsyncEventEmitter } from '@ethereumjs/util'

export type DeleteOpcode = {
  opcode: number
}

export type AddOpcode = {
  opcode: number
  opcodeName: string
  baseFee: number
  gasFunction?: AsyncDynamicGasHandler | SyncDynamicGasHandler
  logicFunction: OpHandler
}

export type CustomOpcode = AddOpcode | DeleteOpcode

/**
 * Base options for the `EVM.runCode()` / `EVM.runCall()` method.
 */
interface EVMRunOpts {
  /**
   * The `block` the `tx` belongs to. If omitted a default blank block will be used.
   */
  block?: Block
  /**
   * The gas price for the call. Defaults to `0`
   */
  gasPrice?: bigint
  /**
   * The address where the call originated from. Defaults to the zero address.
   */
  origin?: Address
  /**
   * The address that ran this code (`msg.sender`). Defaults to the zero address.
   */
  caller?: Address
  /**
   * The EVM code to run.
   */
  code?: Uint8Array
  /**
   * The input data.
   */
  data?: Uint8Array
  /**
   * The gas limit for the call. Defaults to `16777215` (`0xffffff`)
   */
  gasLimit?: bigint
  /**
   * The value in ether that is being sent to `opts.address`. Defaults to `0`
   */
  value?: bigint
  /**
   * The call depth. Defaults to `0`
   */
  depth?: number
  /**
   * If the call should be executed statically. Defaults to false.
   */
  isStatic?: boolean
  /**
   * Addresses to selfdestruct. Defaults to the empty set.
   */
  selfdestruct?: Set<string>
  /**
   * The address of the account that is executing this code (`address(this)`). Defaults to the zero address.
   */
  to?: Address
  /**
   * Versioned hashes for each blob in a blob transaction
   */
  versionedHashes?: Uint8Array[]
}

export interface EVMRunCodeOpts extends EVMRunOpts {
  /*
   * The initial program counter. Defaults to `0`
   */
  pc?: number
}

/**
 * Options for running a call (or create) operation with `EVM.runCall()`
 */
export interface EVMRunCallOpts extends EVMRunOpts {
  /**
   * If the code location is a precompile.
   */
  isCompiled?: boolean
  /**
   * An optional salt to pass to CREATE2.
   */
  salt?: Uint8Array
  /**
   * Created addresses in current context. Used in EIP 6780
   */
  createdAddresses?: Set<string>
  /**
   * Skip balance checks if true. If caller balance is less than message value,
   * sets balance to message value to ensure execution doesn't fail.
   */
  skipBalance?: boolean
  /**
   * If the call is a DELEGATECALL. Defaults to false.
   */
  delegatecall?: boolean
  /**
   * Refund counter. Defaults to `0`
   */
  gasRefund?: bigint
  /**
   * Optionally pass in an already-built message.
   */
  message?: Message
}

interface NewContractEvent {
  address: Address
  // The deployment code
  code: Uint8Array
}

export type EVMEvents = {
  newContract: (data: NewContractEvent, resolve?: (result?: any) => void) => void
  beforeMessage: (data: Message, resolve?: (result?: any) => void) => void
  afterMessage: (data: EVMResult, resolve?: (result?: any) => void) => void
  step: (data: InterpreterStep, resolve?: (result?: any) => void) => void
}

export interface EVMInterface {
  journal: {
    commit(): Promise<void>
    revert(): Promise<void>
    checkpoint(): Promise<void>
    cleanJournal(): void
    cleanup(): Promise<void>
    putAccount(address: Address, account: Account): Promise<void>
    deleteAccount(address: Address): Promise<void>
    accessList?: Map<string, Set<string>>
    addAlwaysWarmAddress(address: string, addToAccessList?: boolean): void
    addAlwaysWarmSlot(address: string, slot: string, addToAccessList?: boolean): void
    startReportingAccessList(): void
  }
  stateManager: EVMStateManagerInterface
  precompiles: Map<string, PrecompileFunc>
  runCall(opts: EVMRunCallOpts): Promise<EVMResult>
  runCode(opts: EVMRunCodeOpts): Promise<ExecResult>
  events?: AsyncEventEmitter<EVMEvents>
}

/**
 * Options for instantiating a {@link EVM}.
 */
export interface EVMOpts {
  /**
   * Use a {@link Common} instance for EVM instantiation.
   *
   * ### Supported EIPs
   *
   * - [EIP-1153](https://eips.ethereum.org/EIPS/eip-1153) - Transient storage opcodes (Cancun)
   * - [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) - Fee market change for ETH 1.0 chain
   * - [EIP-2315](https://eips.ethereum.org/EIPS/eip-2315) - Simple subroutines for the EVM (`outdated`)
   * - [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS precompiles (removed in v4.0.0, see latest v3 release)
   * - [EIP-2565](https://eips.ethereum.org/EIPS/eip-2565) - ModExp gas cost
   * - [EIP-2718](https://eips.ethereum.org/EIPS/eip-2565) - Transaction Types
   * - [EIP-2929](https://eips.ethereum.org/EIPS/eip-2929) - gas cost increases for state access opcodes
   * - [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) - Optional access list tx type
   * - [EIP-3074](https://eips.ethereum.org/EIPS/eip-3074) - AUTH and AUTHCALL opcodes
   * - [EIP-3198](https://eips.ethereum.org/EIPS/eip-3198) - Base fee Opcode
   * - [EIP-3529](https://eips.ethereum.org/EIPS/eip-3529) - Reduction in refunds
   * - [EIP-3540](https://eips.ethereum.org/EIPS/eip-3541) - EVM Object Format (EOF) v1 (`outdated`)
   * - [EIP-3541](https://eips.ethereum.org/EIPS/eip-3541) - Reject new contracts starting with the 0xEF byte
   * - [EIP-3554](https://eips.ethereum.org/EIPS/eip-3554) - Difficulty Bomb Delay to December 2021 (only PoW networks)
   * - [EIP-3607](https://eips.ethereum.org/EIPS/eip-3607) - Reject transactions from senders with deployed code
   * - [EIP-3651](https://eips.ethereum.org/EIPS/eip-3651) - Warm COINBASE (Shanghai)
   * - [EIP-3670](https://eips.ethereum.org/EIPS/eip-3670) - EOF - Code Validation (`outdated`)
   * - [EIP-3675](https://eips.ethereum.org/EIPS/eip-3675) - Upgrade consensus to Proof-of-Stake
   * - [EIP-3855](https://eips.ethereum.org/EIPS/eip-3855) - Push0 opcode (Shanghai)
   * - [EIP-3860](https://eips.ethereum.org/EIPS/eip-3860) - Limit and meter initcode (Shanghai)
   * - [EIP-4345](https://eips.ethereum.org/EIPS/eip-4345) - Difficulty Bomb Delay to June 2022
   * - [EIP-4399](https://eips.ethereum.org/EIPS/eip-4399) - Supplant DIFFICULTY opcode with PREVRANDAO (Merge)
   * - [EIP-4788](https://eips.ethereum.org/EIPS/eip-4788) - Beacon block root in the EVM (Cancun)
   * - [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) - Shard Blob Transactions (Cancun) (`experimental`)
   * - [EIP-4895](https://eips.ethereum.org/EIPS/eip-4895) - Beacon chain push withdrawals as operations (Shanghai)
   * - [EIP-5656](https://eips.ethereum.org/EIPS/eip-5656) - MCOPY - Memory copying instruction (Cancun)
   * - [EIP-6780](https://eips.ethereum.org/EIPS/eip-6780) - SELFDESTRUCT only in same transaction (Cancun)
   *
   * *Annotations:*
   *
   * - `experimental`: behaviour can change on patch versions
   */
  common?: Common

  /**
   * Allows unlimited contract sizes while debugging. By setting this to `true`, the check for
   * contract size limit of 24KB (see [EIP-170](https://git.io/vxZkK)) is bypassed.
   *
   * Default: `false` [ONLY set to `true` during debugging]
   */
  allowUnlimitedContractSize?: boolean

  /**
   * Allows unlimited contract code-size init while debugging. This (partially) disables EIP-3860.
   * Gas cost for initcode size analysis will still be charged. Use with caution.
   */
  allowUnlimitedInitCodeSize?: boolean

  /**
   * Override or add custom opcodes to the EVM instruction set
   * These custom opcodes are EIP-agnostic and are always statically added
   * To delete an opcode, add an entry of format `{opcode: number}`. This will delete that opcode from the EVM.
   * If this opcode is then used in the EVM, the `INVALID` opcode would instead be used.
   * To add an opcode, add an entry of the following format:
   * {
   *    // The opcode number which will invoke the custom opcode logic
   *    opcode: number
   *    // The name of the opcode (as seen in the `step` event)
   *    opcodeName: string
   *    // The base fee of the opcode
   *    baseFee: number
   *    // If the opcode charges dynamic gas, add this here. To charge the gas, use the `i` methods of the BN, to update the charged gas
   *    gasFunction?: function(runState: RunState, gas: BN, common: Common)
   *    // The logic of the opcode which holds the logic of changing the current state
   *    logicFunction: function(runState: RunState)
   * }
   * Note: gasFunction and logicFunction can both be async or synchronous functions
   */
  customOpcodes?: CustomOpcode[]

  /*
   * Adds custom precompiles. This is hardfork-agnostic: these precompiles are always activated
   * If only an address is given, the precompile is deleted
   * If an address and a `PrecompileFunc` is given, this precompile is inserted or overridden
   * Please ensure `PrecompileFunc` has exactly one parameter `input: PrecompileInput`
   */
  customPrecompiles?: CustomPrecompile[]

  /*
   * The StateManager which is used to update the trie
   */
  stateManager?: EVMStateManagerInterface

  /**
   *
   */
  blockchain?: Blockchain
}

/**
 * Result of executing a message via the {@link EVM}.
 */
export interface EVMResult {
  /**
   * Address of created account during transaction, if any
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
   * Description of the exception, if any occurred
   */
  exceptionError?: EvmError
  /**
   * Amount of gas left
   */
  gas?: bigint
  /**
   * Amount of gas the code used to run
   */
  executionGasUsed: bigint
  /**
   * Return value from the contract
   */
  returnValue: Uint8Array
  /**
   * Array of logs that the contract emitted
   */
  logs?: Log[]
  /**
   * A set of accounts to selfdestruct
   */
  selfdestruct?: Set<string>
  /**
   * Map of addresses which were created (used in EIP 6780)
   */
  createdAddresses?: Set<string>
  /**
   * The gas refund counter
   */
  gasRefund?: bigint
  /**
   * Amount of blob gas consumed by the transaction
   */
  blobGasUsed?: bigint
}

/**
 * Log that the contract emits.
 */
export type Log = [address: Uint8Array, topics: Uint8Array[], data: Uint8Array]

export type Block = {
  header: {
    number: bigint
    cliqueSigner(): Address
    coinbase: Address
    timestamp: bigint
    difficulty: bigint
    prevRandao: Uint8Array
    gasLimit: bigint
    baseFeePerGas?: bigint
  }
}

export interface TransientStorageInterface {
  get(addr: Address, key: Uint8Array): Uint8Array
  put(addr: Address, key: Uint8Array, value: Uint8Array): void
  commit(): void
  checkpoint(): void
  revert(): void
  toJSON(): { [address: string]: { [key: string]: string } }
  clear(): void
}

type MockBlock = {
  hash(): Uint8Array
}

export interface Blockchain {
  getBlock(blockId: number): Promise<MockBlock>
  shallowCopy(): Blockchain
}

export class DefaultBlockchain implements Blockchain {
  async getBlock(): Promise<MockBlock> {
    return {
      hash(): Uint8Array {
        return zeros(32)
      },
    }
  }
  shallowCopy(): this {
    return this
  }
}
