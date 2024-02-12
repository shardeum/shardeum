import { Shardus } from '@shardus/core'
import shardus from '@shardus/core/dist/shardus'
import { ApplyResponse, OpaqueTransaction, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { createInternalTxReceipt, logFlags, shardeumGetTime } from '..'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  InternalTXType,
  InternalTx,
  NetworkAccount,
  WrappedStates,
  TransactionKeys,
} from '../shardeum/shardeumTypes'
import { DaoGlobalAccount } from './accounts/networkAccount'
import {
  applyDevParameters,
  applyParameters,
  decodeDaoTxFromEVMTx,
  generateDevIssue,
  generateIssue,
  tallyDevVotes,
  tallyVotes,
} from './utils'
import { DaoTx } from './tx'
import { getTransactionObj } from '../setup/helpers'
import * as AccountsStorage from '../storage/accountStorage'
import { daoAccountAddress } from '../config/dao'
import { OtherInternalTx } from '../shardeum/internalTxs'
import { inspect } from 'util'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import { WindowRange } from './types'

export function setupDaoAccount(shardus: Shardus, when: number): void {
  if (ShardeumFlags.EnableDaoFeatures) {
    const daoValue = {
      isInternalTx: true,
      internalTXType: InternalTXType.InitDao,
      timestamp: when,
    }
    shardus.setGlobal(daoAccountAddress, daoValue, when, daoAccountAddress)
  }
}

export async function getDaoAccountObj(shardus: Shardus): Promise<DaoGlobalAccount | null> {
  const account = await shardus.getLocalOrRemoteAccount(daoAccountAddress)
  return account?.data as DaoGlobalAccount
}

export function applyInitDaoTx(
  shardus: Shardus,
  wrappedStates: WrappedStates,
  applyResponse: ApplyResponse,
  internalTx: InternalTx,
  txTimestamp: number,
  txId: string
): void {
  // eslint-disable-next-line security/detect-object-injection
  const daoWrittenAccount = wrappedStates[daoAccountAddress]
  const daoAccount: DaoGlobalAccount = daoWrittenAccount.data
  daoAccount.timestamp = txTimestamp

  if (ShardeumFlags.useAccountWrites) {
    shardus.applyResponseAddChangedAccount(
      applyResponse,
      daoAccountAddress,
      WrappedEVMAccountFunctions._shardusWrappedAccount(daoAccount) as WrappedResponse,
      txId,
      txTimestamp
    )
  }

  if (ShardeumFlags.supportInternalTxReceipt) {
    createInternalTxReceipt(
      shardus,
      applyResponse,
      internalTx,
      daoAccountAddress,
      daoAccountAddress,
      txTimestamp,
      txId
    )
  }
}

export function getRelevantDataInitDao(accountId: string): DaoGlobalAccount | undefined {
  if (accountId === daoAccountAddress) {
    return new DaoGlobalAccount(daoAccountAddress)
  }
}

export function isDaoTx<A>(tx: OpaqueTransaction | DaoTx<A>): boolean {
  // EVM txs come in as serialized hexstrings
  let transaction = null
  if ('raw' in tx && typeof tx.raw === 'string') {
    transaction = getTransactionObj(tx as { raw: string })
  }
  return tx instanceof DaoTx || transaction?.to?.toString() === ShardeumFlags.daoTargetAddress
}

/**
 * Liberus txs export a `keys` fn that gets called here
 */
export function handleDaoTxCrack(tx: OpaqueTransaction, result: TransactionKeys): void {
  // Unserialize tx
  const unserializedTx = getTransactionObj(tx)
  // Decode data field of EVM tx to get type of DAO tx
  if ('data' in unserializedTx) {
    const plainTx = decodeDaoTxFromEVMTx(unserializedTx)
    const daoTx = DaoTx.fromTxObject(plainTx)
    if (daoTx != null) {
      // Call the keys function of the dao tx type
      const changes = daoTx.keys({} as TransactionKeys)
      // Combine changes with existing keys
      result.sourceKeys = result.sourceKeys.concat(changes.sourceKeys)
      result.targetKeys = result.targetKeys.concat(changes.targetKeys)
      result.allKeys = result.allKeys.concat(changes.allKeys)
    }
  }
}

/**
 * Liberus txs export a `createRelevantAccount` fn that gets called here
 */
export async function handleDaoTxGetRelevantData(
  accountId: string,
  tx: OpaqueTransaction,
  shardus: Shardus
): Promise<{
  accountId: string
  accountCreated: boolean
  isPartial: boolean
  stateId: unknown
  timestamp: number
  data: unknown
} | null> {
  // Unserialize the EVM tx
  const unserializedTx = getTransactionObj(tx)
  // Decode data field of EVM tx to get type of DAO tx
  if ('data' in unserializedTx) {
    const plainTx = decodeDaoTxFromEVMTx(unserializedTx)
    const daoTx = DaoTx.fromTxObject(plainTx)
    if (daoTx != null) {
      // Try to get the account
      const existingAccount = await AccountsStorage.getAccount(accountId)
      // Return the wrappedResponse obj created by createRelevantAccount function of the dao tx type
      return daoTx.createRelevantAccount(shardus, existingAccount, accountId, false)
    }
  }
  return null
}

/**
 * Liberus txs export a `apply` fn that gets called here
 */
export function handleDaoTxApply(
  tx: OpaqueTransaction,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  dapp: Shardus
): void {
  // Unserialize the EVM tx
  const unserializedTx = getTransactionObj(tx)

  // Decode data field of EVM tx to get type of DAO tx
  if ('data' in unserializedTx) {
    const plainTx = decodeDaoTxFromEVMTx(unserializedTx)
    const daoTx = DaoTx.fromTxObject(plainTx)

    // daoTx will be null if the tx is not a dao tx
    if (daoTx != null) {
      // if it's not null, run its apply function
      daoTx.apply(txTimestamp, null, wrappedStates, dapp)
    }
  }
}

/**
 * This function initiates the DAO maintenance cycle and serves as a closure to
 * hold long-lived variables needed for it.
 */
export function startDaoMaintenanceCycle(interval: number, shardus: Shardus): void {
  /**
   * This diagram explains how expected, drift, and cycleInterval are used to
   * consistently realign the daoMaintenance fn to run in sync with some
   * expected interval (cycleInterval in this case)
   *
   * now             expected        expected_2      expected_3      expected_4
   * |               |               |               |               |
   * | cycleInterval | cycleInterval | cycleInterval | cycleInterval |
   * |---------------|---------------|---------------|---------------|
   * |               |
   * |               |       actual
   * |               |       |
   * |               | drift | cycleInterval |
   * |---------------|-------|-------|-------|
   * |                       |       |
   * |                       |       | drift |
   * |                       |       |-------|
   * |                       |       |
   * |                       |       setTimeout(..., cycleInterval - drift)
   * |                       |       |
   * |                       |       |         actual_2
   * |                       |       | drift_2 |
   * |-----------------------|-------|---------|
   */
  let expected = shardeumGetTime() + interval
  let drift: number
  let currentTime: number

  // Variables to track generation of issue/tally/apply for this interval
  let issueGenerated = false
  let tallyGenerated = false
  let applyGenerated = false
  let devIssueGenerated = false
  let devTallyGenerated = false
  let devApplyGenerated = false

  /**
   * The function is called every interval to run DAO maintenance
   */
  async function daoMaintenance(): Promise<void> {
    drift = shardeumGetTime() - expected
    currentTime = shardeumGetTime()

    try {
      // Get the dao account and node data needed for issue creation
      const daoAccountObj = await getDaoAccountObj(shardus)
      if (!daoAccountObj) {
        throw new Error(
          `couldn't find dao account: ${inspect(daoAccountObj)}; can't continue with daoMaintenance`
        )
      }

      const [cycleData] = shardus.getLatestCycles()
      if (!cycleData) {
        throw new Error("no cycleData; can't continue with daoMaintenance")
      }

      const luckyNodes = shardus.getClosestNodes(cycleData.previous, 3)
      const nodeId = shardus.getNodeId()
      const node = shardus.getNode(nodeId)
      const nodeAddress = node.address

      // ISSUE
      if (
        WindowRange.fromObj(daoAccountObj.windows.proposalWindow).includes(currentTime) &&
        !issueGenerated &&
        daoAccountObj.issue > 1
      ) {
        if (luckyNodes.includes(nodeId)) {
          await generateIssue(nodeAddress, nodeId, shardus)
        }
        issueGenerated = true
        tallyGenerated = false
        applyGenerated = false
      }

      // DEV_ISSUE
      if (
        WindowRange.fromObj(daoAccountObj.devWindows.proposalWindow).includes(currentTime) &&
        !devIssueGenerated &&
        daoAccountObj.issue > 1
      ) {
        if (luckyNodes.includes(nodeId)) {
          await generateDevIssue(nodeAddress, nodeId, shardus)
        }
        devIssueGenerated = true
        devTallyGenerated = false
        devApplyGenerated = false
      }

      // TALLY
      if (WindowRange.fromObj(daoAccountObj.windows.graceWindow).includes(currentTime) && !tallyGenerated) {
        if (luckyNodes.includes(nodeId)) {
          await tallyVotes(nodeAddress, nodeId, shardus)
        }
        issueGenerated = false
        tallyGenerated = true
        applyGenerated = false
      }

      // APPLY
      if (WindowRange.fromObj(daoAccountObj.windows.applyWindow).includes(currentTime) && !applyGenerated) {
        if (luckyNodes.includes(nodeId)) {
          await applyParameters(nodeAddress, nodeId, shardus)
        }
        issueGenerated = false
        tallyGenerated = false
        applyGenerated = true
      }

      // DEV_TALLY
      if (
        WindowRange.fromObj(daoAccountObj.devWindows.graceWindow).includes(currentTime) &&
        !devTallyGenerated
      ) {
        if (luckyNodes.includes(nodeId)) {
          await tallyDevVotes(nodeAddress, nodeId, shardus)
        }
        devIssueGenerated = false
        devTallyGenerated = true
        devApplyGenerated = false
      }

      // DEV_APPLY
      if (
        WindowRange.fromObj(daoAccountObj.devWindows.applyWindow).includes(currentTime) &&
        !devApplyGenerated
      ) {
        if (luckyNodes.includes(nodeId)) {
          await applyDevParameters(nodeAddress, nodeId, shardus)
        }
        devIssueGenerated = false
        devTallyGenerated = false
        devApplyGenerated = true
      }
    } catch (err) {
      /* prettier-ignore */ if (logFlags.error) shardus.log('daoMaintenance ERR: ', err)
      /* prettier-ignore */ if (logFlags.error) console.log('daoMaintenance ERR: ', err)
    }

    expected += interval
    setTimeout(daoMaintenance, Math.max(100, interval - drift))
  }

  setTimeout(daoMaintenance, interval)
}
