import { Transaction, TransactionType } from '@ethereumjs/tx'
import {hashSignedObj, isDebugTx, isInternalTx,} from '../setup/helpers'
import { ShardeumFlags } from '../shardeum/shardeumFlags'


export function generateTxId(tx): string {
  if (tx.raw) {
    // if it is an evm tx, do not involve attached timestamp in txId calculation
    return hashSignedObj({raw: tx.raw})
  }
  // simply hash the tx obj for other types of txs: internal, debug and global
  return hashSignedObj(tx)
}

export function isStakingEVMTx(
  transaction: Transaction[TransactionType.Legacy] | Transaction[TransactionType.AccessListEIP2930]
): boolean {
  return transaction.to && transaction.to.toString() === ShardeumFlags.stakeTargetAddress
}
