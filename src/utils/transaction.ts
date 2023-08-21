import {hashSignedObj, isDebugTx, isInternalTx,} from '../setup/helpers'


export function generateTxId(tx): string {
  if (tx.raw) {
    // if it is an evm tx, do not involve attached timestamp in txId calculation
    return hashSignedObj({raw: tx.raw})
  }
  // simply hash the tx obj for other types of txs: internal, debug and global
  return hashSignedObj(tx)
}
