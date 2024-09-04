import {Transaction, TransactionType, TypedTransaction} from '@ethereumjs/tx'
import { Address } from '@ethereumjs/util'
import { getSenderAddress } from '@shardus/net'
import { hashSignedObj } from '../setup/helpers'
import { logFlags } from '..'
import {ShardeumFlags} from "../shardeum/shardeumFlags";

type GetTxSenderAddressResult = { address: Address; isValid: boolean; gasValid: boolean }

const txSenderCache: Map<string, GetTxSenderAddressResult> = new Map()
let simpleTTL = 0
const cacheMaxSize = 20000

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

export function getTxSenderAddress(
  tx: TypedTransaction,
  txid: string = undefined,
  overrideSender: Address = undefined
): GetTxSenderAddressResult {
  try {
    if (overrideSender != null) {
      const res = { address: overrideSender, isValid: true, gasValid: true }
      if (txid != null) {
        txSenderCache.set(txid, res)
      }
      return res
    }

    if (txid != null) {
      const cached = txSenderCache.get(txid)
      if (cached != null) {
        return cached
      }
    }

    const rawTx = '0x' + toHexString(tx.serialize())
    const { address, isValid, gasValid } = getSenderAddress(rawTx)
    if (logFlags.dapp_verbose) console.log('Sender address retrieved from signed txn', address)
    const res = { address: Address.fromString(address), isValid, gasValid }
    if (txid != null) {
      simpleTTL++
      if (simpleTTL > cacheMaxSize) {
        simpleTTL = cacheMaxSize
        txSenderCache.clear()
      }
      txSenderCache.set(txid, res)
    }
    return res
  } catch (e) {
    if (logFlags.dapp_verbose) console.error('Error getting sender address from tx', e)
    const res = { address: null, isValid: false, gasValid: false }
    if (txid != null) {
      txSenderCache.set(txid, res)
    }
    return res
  }
}

export function isInSenderCache(txid: string): boolean {
  return txSenderCache.has(txid)
}

export function removeTxFromSenderCache(txid: string): void {
  txSenderCache.delete(txid)
}

export function isStakingEVMTx(
  transaction: Transaction[TransactionType.Legacy] | Transaction[TransactionType.AccessListEIP2930]
): boolean {
  return transaction.to && transaction.to.toString() === ShardeumFlags.stakeTargetAddress
}

