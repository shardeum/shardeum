import { hashSignedObj, isDebugTx, isInternalTx } from '../setup/helpers'

export function generateTxId(tx): string {
  if (tx.raw) {
    // if it is an evm tx, do not involve attached timestamp in txId calculation
    return hashSignedObj({ raw: tx.raw })
  }

  // Certain TXs are submitted by more than once node.  It is important
  // that we do not count the signature as part of the hash. otherwise,
  // These TXs will be unique and 4 our of 5 will fail.
  // some examples, but there could be more:
  // InternalTXType.ClaimReward
  // InternalTXType.InitRewardTimes
  // InternalTXType.Penalty

  // simply hash the tx obj for other types of txs: internal, debug and global
  // This removes the signature when creating the hash
  return hashSignedObj(tx)
}
