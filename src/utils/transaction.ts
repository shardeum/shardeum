import { TypedTransaction } from '@ethereumjs/tx'
import { Address } from '@ethereumjs/util'
import { getSenderAddress } from '@shardus/net'
import { hashSignedObj } from '../setup/helpers'
import { logFlags } from '..'

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

export function getTxSenderAddress(tx: TypedTransaction): Address {
  try {
    console.log('getTxSenderAddress', getSenderAddress(tx.raw.toString()), tx.raw)
    return Address.fromString(getSenderAddress(tx.raw.toString()))
  } catch (e) {
    if (logFlags.dapp_verbose) console.error('Error getting sender address from tx', e)
    return null
  }
}
