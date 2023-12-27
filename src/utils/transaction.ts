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

function toHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray, (byte) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2)
  }).join('')
}

export function getTxValiditySenderAddress(tx: TypedTransaction): { address: Address, isValid: boolean } {
  try {
    const rawTx = '0x' + toHexString(tx.serialize())
    const { address, isValid } = getSenderAddress(rawTx)
    if (logFlags.dapp_verbose) console.log('Sender address retrieved from signed txn', address)
    return { address: Address.fromString(address), isValid }
  } catch (e) {
    if (logFlags.dapp_verbose) console.error('Error getting sender address from tx', e)
    return null
  }
}

export function isTxValid(tx: TypedTransaction): boolean {
  try {
    getTxValiditySenderAddress(tx)
    return true
  } catch (e) {
    if (logFlags.dapp_verbose) console.error('Error verifying signature', e)
    return false
  }
}
