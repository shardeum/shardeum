import { Log } from './evm/types'

export type TxReceipt = PreByzantiumTxReceipt | PostByzantiumTxReceipt | EIP2930Receipt

/**
 * Abstract interface with common transaction receipt fields
 */
export interface BaseTxReceipt {
  /**
   * Cumulative gas used in the block including this tx
   */
  gasUsed: Buffer
  /**
   * Bloom bitvector
   */
  bitvector: Buffer
  /**
   * Logs emitted
   */
  logs: Log[]
}

/**
 * Pre-Byzantium receipt type with a field
 * for the intermediary state root
 */
export interface PreByzantiumTxReceipt extends BaseTxReceipt {
  /**
   * Intermediary state root
   */
  stateRoot: Buffer
}

/**
 * Receipt type for Byzantium and beyond replacing the intermediary
 * state root field with a status code field (EIP-658)
 */
export interface PostByzantiumTxReceipt extends BaseTxReceipt {
  /**
   * Status of transaction, `1` if successful, `0` if an exception occured
   */
  status: 0 | 1
}

/**
 * EIP2930Receipt, which has the same fields as PostByzantiumTxReceipt
 *
 * @deprecated Please use PostByzantiumTxReceipt instead
 */
export interface EIP2930Receipt extends PostByzantiumTxReceipt {}

/**
 * EIP1559Receipt, which has the same fields as PostByzantiumTxReceipt
 *
 * @deprecated Please use PostByzantiumTxReceipt instead
 */
export interface EIP1559Receipt extends PostByzantiumTxReceipt {}
