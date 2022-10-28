/*

This is the core of the Ethereum Virtual Machine (EVM or just VM).

NOTES:

1. Stack items are lazily duplicated, so you must never directly change a buffer
from the stack, instead you should `copy` it first.

2. Not all stack items are 32 bytes, so if the operation relies on the stack
item length then you must use `utils.pad(<item>, 32)` first.

*/
import { Address, BN } from 'ethereumjs-util'
import { Block } from '@ethereumjs/block'
import VM from './index'
import TxContext from './evm/txContext'
import Message from './evm/message'
import { default as EVM, ExecResult } from './evm/evm'

/**
 * Options for the {@link runCode} method.
 */
export interface RunCodeOpts {
  /**
   * The `@ethereumjs/block` the `tx` belongs to. If omitted a default blank block will be used.
   */
  block?: Block
  evm?: EVM
  txContext?: TxContext
  gasPrice?: BN
  /**
   * The address where the call originated from. Defaults to the zero address.
   */
  origin?: Address
  message?: Message
  /**
   * The address that ran this code (`msg.sender`). Defaults to the zero address.
   */
  caller?: Address
  /**
   * The EVM code to run
   */
  code?: Buffer
  /**
   * The input data
   */
  data?: Buffer
  /**
   * Gas limit
   */
  gasLimit?: BN
  /**
   * The value in ether that is being sent to `opt.address`. Defaults to `0`
   */
  value?: BN
  depth?: number
  isStatic?: boolean
  selfdestruct?: { [k: string]: boolean }
  /**
   * The address of the account that is executing this code (`address(this)`). Defaults to the zero address.
   */
  address?: Address
  /**
   * The initial program counter. Defaults to `0`
   */
  pc?: number
}

/**
 * @ignore
 */
export default function runCode(this: VM, opts: RunCodeOpts): Promise<ExecResult> {
  const block = opts.block ?? Block.fromBlockData({}, { common: this._common })

  // Backwards compatibility
  const txContext =
    opts.txContext ??
    new TxContext(opts.gasPrice ?? new BN(0), opts.origin ?? opts.caller ?? Address.zero())

  const message =
    opts.message ??
    new Message({
      code: opts.code,
      data: opts.data,
      gasLimit: opts.gasLimit,
      to: opts.address ?? Address.zero(),
      caller: opts.caller,
      value: opts.value,
      depth: opts.depth ?? 0,
      selfdestruct: opts.selfdestruct ?? {},
      isStatic: opts.isStatic ?? false,
    })

  const evm = opts.evm ?? new EVM(this, txContext, block)

  return evm.runInterpreter(message, { pc: opts.pc })
}
