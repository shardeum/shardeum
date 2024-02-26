import * as crypto from '@shardus/crypto-utils'
import { daoAccountAddress, daoConfig } from '../config/dao'
import { Shardus } from '@shardus/core'
import { UserAccount } from './accounts/userAccount'
import { DaoGlobalAccount } from './accounts/networkAccount'
import { IssueAccount } from './accounts/issueAccount'
import { DevIssueAccount } from './accounts/devIssueAccount'
import { DeveloperPayment } from './types'
import { TimestampReceipt } from '@shardus/core/dist/shardus/shardus-types'
import { NetworkIssue } from './tx/network_issue'
import { AccessListEIP2930Transaction, LegacyTransaction } from '@ethereumjs/tx'
import { bigIntToHex, bytesToHex, fromAscii, hexToBytes, toAscii, toBytes } from '@ethereumjs/util'
import { logFlags } from '..'
import { PlainDaoTx } from './tx'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { Common } from '@ethereumjs/common'
import { DevIssue } from './tx/dev_issue'

export const maintenanceAmount = (
  timestamp: number,
  account: UserAccount,
  network: DaoGlobalAccount
): number => {
  let amount: number
  if (timestamp - account.lastMaintenance < network.current.maintenanceInterval) {
    amount = 0
  } else {
    amount =
      account.data.balance *
      (1 -
        Math.pow(
          1 - network.current.maintenanceFee,
          (timestamp - account.lastMaintenance) / network.current.maintenanceInterval
        ))
    account.lastMaintenance = timestamp
  }
  if (typeof amount === 'number') return amount
  else return 0
}

// HELPER METHOD TO WAIT
export async function _sleep(ms = 0): Promise<NodeJS.Timeout> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// NODE_REWARD TRANSACTION FUNCTION
export function nodeReward(address: string, nodeId: string, dapp: Shardus): void {
  const tx = {
    type: 'node_reward',
    nodeId: nodeId,
    from: address,
    to: process.env.PAY_ADDRESS || address,
    timestamp: Date.now(),
  }
  dapp.put(tx)
  dapp.log('GENERATED_NODE_REWARD: ', nodeId)
}

// ISSUE TRANSACTION FUNCTION
export async function generateNetworkIssue(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  const account = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccountAddress)
  const network = account.data as DaoGlobalAccount
  const tx = {
    type: 'issue',
    nodeId,
    from: address,
    issue: crypto.hash(`issue-${network.issue}`),
    proposal: crypto.hash(`issue-${network.issue}-proposal-1`),
    timestamp: Date.now(),
  }
  dapp.put({raw: encodeDaoTxToEVMTx(tx, dapp)})
  dapp.log('GENERATED_ISSUE: ', nodeId)
}

// DEV_ISSUE TRANSACTION FUNCTION
export async function generateDevIssue(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  const account = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccountAddress)
  const network = account.data as DaoGlobalAccount
  const tx = {
    type: 'dev_issue',
    nodeId,
    from: address,
    devIssue: crypto.hash(`dev-issue-${network.devIssue}`),
    timestamp: Date.now(),
  }
  dapp.put({raw: encodeDaoTxToEVMTx(tx, dapp)})
  dapp.log('GENERATED_DEV_ISSUE: ', nodeId)
}

// TALLY TRANSACTION FUNCTION
export async function tallyVotes(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  console.log(`GOT TO TALLY_VOTES FN ${address} ${nodeId}`)
  try {
    const network = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccountAddress)
    const networkAccount = network.data as DaoGlobalAccount
    const account = await dapp.getLocalOrRemoteAccount(crypto.hash(`issue-${networkAccount.issue}`))
    if (!account) {
      await _sleep(500)
      return tallyVotes(address, nodeId, dapp)
    }
    const issue = account.data as IssueAccount
    const tx = {
      type: 'tally',
      nodeId,
      from: address,
      issue: issue.id,
      proposals: issue.proposals,
      timestamp: Date.now(),
    }
    dapp.put({raw: encodeDaoTxToEVMTx(tx, dapp)})
    dapp.log('GENERATED_TALLY: ', nodeId)
  } catch (err) {
    dapp.log('ERR: ', err)
    await _sleep(1000)
    return tallyVotes(address, nodeId, dapp)
  }
}

// DEV_TALLY TRANSACTION FUNCTION
export async function tallyDevVotes(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  try {
    const network = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccountAddress)
    const networkAccount = network.data as DaoGlobalAccount
    const account = await dapp.getLocalOrRemoteAccount(crypto.hash(`dev-issue-${networkAccount.devIssue}`))
    if (!account) {
      await _sleep(500)
      return tallyDevVotes(address, nodeId, dapp)
    }
    const devIssue = account.data as DevIssueAccount
    const tx = {
      type: 'dev_tally',
      nodeId,
      from: address,
      devIssue: devIssue.id,
      devProposals: devIssue.devProposals,
      timestamp: Date.now(),
    }
    dapp.put({raw: encodeDaoTxToEVMTx(tx, dapp)})
    dapp.log('GENERATED_DEV_TALLY: ', nodeId)
  } catch (err) {
    dapp.log('ERR: ', err)
    await _sleep(1000)
    return tallyDevVotes(address, nodeId, dapp)
  }
}

// APPLY_PARAMETERS TRANSACTION FUNCTION
export async function applyParameters(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  const account = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccountAddress)
  const network = account.data as DaoGlobalAccount
  const tx = {
    type: 'parameters',
    nodeId,
    from: address,
    issue: crypto.hash(`issue-${network.issue}`),
    timestamp: Date.now(),
  }
  dapp.put({raw: encodeDaoTxToEVMTx(tx, dapp)})
  dapp.log('GENERATED_APPLY: ', nodeId)
}

// APPLY_DEV_PARAMETERS TRANSACTION FUNCTION
export async function applyDevParameters(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  const account = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccountAddress)
  const network = account.data as DaoGlobalAccount
  const tx = {
    type: 'dev_parameters',
    nodeId,
    from: address,
    devIssue: crypto.hash(`dev-issue-${network.devIssue}`),
    timestamp: Date.now(),
  }
  dapp.put({raw: encodeDaoTxToEVMTx(tx, dapp)})
  dapp.log('GENERATED_DEV_APPLY: ', nodeId)
}

// RELEASE DEVELOPER FUNDS FOR A PAYMENT
export function releaseDeveloperFunds(
  payment: DeveloperPayment,
  address: string,
  nodeId: string,
  dapp: Shardus
): void {
  const tx = {
    type: 'developer_payment',
    nodeId,
    from: address,
    developer: payment.address,
    payment: payment,
    timestamp: Date.now(),
  }
  dapp.put(tx)
  dapp.log('GENERATED_DEV_PAYMENT: ', nodeId)
}

export function getAccountType(data: unknown): string {
  if (data == null || typeof data !== 'object') {
    return 'undetermined'
  } else if ('type' in data && data.type != null) {
    return data.type as string
  }

  //make sure this works on old accounts with no type
  else if ('alias' in data) {
    return 'UserAccount'
  } else if ('nodeRewardTime' in data) {
    return 'NodeAccount'
  } else if ('inbox' in data) {
    return 'AliasAccount'
  } else if ('devProposals' in data) {
    return 'DevIssueAccount'
  } else if ('proposals' in data) {
    return 'IssueAccount'
  } else if ('devWindows' in data) {
    return 'NetworkAccount'
  } else if ('totalVotes' in data) {
    if ('power' in data) {
      return 'ProposalAccount'
    } else if ('payAddress' in data) {
      return 'DevProposalAccount'
    }
  }
  return 'undetermined'
}

interface TimestampedTx {
  tx: {
    timestamp?: number
  }
  timestampReceipt: TimestampReceipt
}
export function getInjectedOrGeneratedTimestamp(timestampedTx: TimestampedTx, dapp: Shardus): number {
  const { tx, timestampReceipt } = timestampedTx
  let txnTimestamp = 0

  if (tx.timestamp) {
    txnTimestamp = tx.timestamp
    dapp.log(`Timestamp ${txnTimestamp} is extracted from the injected tx.`)
  } else if (timestampReceipt && timestampReceipt.timestamp) {
    txnTimestamp = timestampReceipt.timestamp
    dapp.log(`Timestamp ${txnTimestamp} is generated by the network nodes.`)
  }
  return txnTimestamp
}

export function decodeDaoTxFromEVMTx(
  transaction: LegacyTransaction | AccessListEIP2930Transaction
): PlainDaoTx {
  const daoTxString = toAscii(bytesToHex(transaction.data))
  /* prettier-ignore */ if (logFlags.verbose) console.log(`daoTxString`, daoTxString)
  return JSON.parse(daoTxString)
}

export function encodeDaoTxToEVMTx(daoTx: { type: string }, shardus: Shardus): string {
  if (daoTx?.type == null || daoTx?.type === '') throw new Error(`Invalid DaoTx: ${daoTx}`)
  // Encode the DaoTx as a hexstring
  const daoTxString = fromAscii(JSON.stringify(daoTx))

  // Create parameters for the EVM transaction that will encapsulate the DaoTx
  const txParams = {
    to: ShardeumFlags.daoTargetAddress,
    gasLimit: bigIntToHex(BigInt(30000000)),
    value: bigIntToHex(BigInt(0)),
    data: daoTxString,
    nonce: bigIntToHex(BigInt(0)),
  }

  // Create the EVM transaction and add the proper ChainID
  const tx = LegacyTransaction.fromTxData(txParams, {
    common: Common.custom({ chainId: ShardeumFlags.ChainID }),
  })

  // Sign the transaction with the shardus layers secret key
  const secretKey = shardus.crypto.keypair.secretKey
  const pk = secretKey.substring(0, 2) === '0x' ? secretKey : '0x' + secretKey
  const signedTx = tx.sign(hexToBytes(pk))

  // Serialize the transaction
  const serializedTx = bytesToHex(signedTx.serialize())
  return serializedTx
}
