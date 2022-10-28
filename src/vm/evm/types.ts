import { OpHandler } from './opcodes'
import { AsyncDynamicGasHandler, SyncDynamicGasHandler } from './opcodes/gas'

/**
 * Log that the contract emitted.
 */
export type Log = [address: Buffer, topics: Buffer[], data: Buffer]

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
