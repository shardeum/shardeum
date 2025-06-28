import { ShardusTypes } from '@shardeum-foundation/core'
import { getInjectedOrGeneratedTimestamp, isInternalTx, isDebugTx } from './setup/helpers'
import { fixBigIntLiteralsToBigInt, generateTxId, getTxSenderAddress, _readableSHM, _base16BNParser, scaleByStabilityFactor, isStakingEVMTx, calculateGasPrice } from './utils'
import { SafeBalance } from './utils/safeMath'
import { Utils } from '@shardeum-foundation/lib-types'
import { emptyCodeHash, zeroAddressStr } from './utils'
import { ShardeumFlags, shardus, shardeumGetTime, logFlags, EVM, getApplyTXState, deleteApplyTXState, shardeumStateTXMap, shardusAddressToEVMAccountInfo, networkAccount, isDebugMode, shardusConfig, profilerInstance, createAccount, debugAppdata, shardeumBlock, evmCommon, getTransactionObj, getCallTXState, verifyPayload, getNetworkAccount, fetchNetworkAccountFromArchiver, _transactionReceiptPass, shardusTxIdToEthTxId, appliedTxs, blocks, createBlock, blocksByHash, latestBlock, crypto, DebugComplete, version, getStakeTxBlobFromEVMTx } from './index'
import { applyInternalTx, applyDebugTx } from './internal'
import { DebugTx, InternalTXType, AccountType, StakeCoinsTX, WrappedEVMAccount, NetworkAccount, OurAppDefinedData, UnstakeCoinsTX, StakeInfo, OperatorAccountInfo, WrappedAccount, InternalTx, ReadableReceipt, NodeAccount2 } from './shardeum/shardeumTypes'
import { bytesToHex, bigIntToHex, hexToBytes, toBytes, Account, Address } from '@ethereumjs/util'
import { AccessListEIP2930Transaction } from '@ethereumjs/tx'
import { toShardusAddressWithKey, toShardusAddress, getAccountShardusAddress } from './shardeum/evmAddress'
import { nestedCountersInstance } from '@shardeum-foundation/core'
import { verifyStakeTx, verifyUnstakeTx } from './tx/staking/verifyStake'
import * as AccountsStorage from './storage/accountStorage'
import { fixDeserializedWrappedEVMAccount, predictContractAddressDirect } from './shardeum/wrappedEVMAccountFunctions'
import * as WrappedEVMAccountFunctions from './shardeum/wrappedEVMAccountFunctions'
import { runTx } from './vm_v7/runTx'
import { RunTxResult } from './vm_v7'
import { EVM as EthereumVirtualMachine } from './evm_v2'
import { ContractByteWrite } from './state/transactionState'
import { setGlobalCodeByteUpdate } from './index'
import { __ShardFunctions } from '@shardeum-foundation/core'
import { getOrCreateBlockFromTimestamp } from './index'
import { readableBlocks } from './index'
import { fetchAndCacheAccountData } from './index'
// TODO: These modules need to be created or the functionality moved elsewhere
// import { updateNonceAndChargeBalanceForStakeTx } from './tx/staking/applyStakeTx'
// import { updateNonceAndChargeBalanceForUnstakeTx } from './tx/staking/applyUnstakeTx'
import { safeStringify } from '@shardeum-foundation/lib-types/build/src/utils/functions/stringify'
import { updateServicePoints } from './shardeum/shardeumFlags'
// TODO: This module needs to be created or the functionality moved elsewhere
// import { updateGlobalNetworkAccount } from './shardeum/shardeumUtils'
// TODO: This function needs to be exported from queryCertificate or functionality moved elsewhere
// import { getNodeInfoAppData } from './handlers/queryCertificate'
import { CertSignaturesResult } from './handlers/queryCertificate'
import { isWithinRange } from './utils'
import config from './config'
import { validateTransaction } from './setup'
import { crack as crackTransferFromSecureAccount, verify as verifyTransferFromSecureAccount } from './shardeum/secureAccounts'
import { filterObjectByWhitelistedProps } from './types/ajv/Helpers'
import { isSetCertTimeTx } from './tx/setCertTime'
import { generateAccessList } from './accesslist'

export const txFunctions = {
    async apply(timestampedTx: ShardusTypes.OpaqueTransaction, wrappedStates, originalAppData) {
      //@ts-ignore
      const { tx } = timestampedTx
      const txTimestamp = getInjectedOrGeneratedTimestamp(timestampedTx)
      const appData = fixBigIntLiteralsToBigInt(originalAppData)
      // Validate the tx
      const { result, reason } = this.validateTransaction(tx)
      if (result !== 'pass') {
        throw new Error(`invalid transaction, reason: ${reason}. tx: ${Utils.safeStringify(tx)}`)
      }

      if (isInternalTx(tx)) {
        return applyInternalTx(tx, wrappedStates, txTimestamp)
      }

      if (isDebugTx(tx)) {
        if (!ShardeumFlags.debugTxEnabled) {
          throw new Error(`invalid transaction, reason: Debug tx are not enabled. tx: ${Utils.safeStringify(tx)}`)
        }
        const debugTx = tx as DebugTx
        return applyDebugTx(debugTx, wrappedStates, txTimestamp)
      }

      // it is an EVM tx
      const rawSerializedTx = tx.raw
      if (rawSerializedTx == null) {
        throw new Error(
          `Invalid evm transaction, reason: unable to extract raw tx from the transaction object, tx: ${Utils.safeStringify(
            tx
          )}`
        )
      }

      const txId = generateTxId(tx)
      const transaction = getTransactionObj(tx)
      const senderAddress = getTxSenderAddress(transaction, txId).address
      const ethTxId = bytesToHex(transaction.hash())
      const shardusReceiptAddress = toShardusAddressWithKey(ethTxId, '', AccountType.Receipt)
      // Create an applyResponse which will be used to tell Shardus that the tx has been applied
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('DBG', new Date(), 'attempting to apply tx', txId, ethTxId, tx, wrappedStates, appData)
      const applyResponse = shardus.createApplyResponse(txId, txTimestamp)
      let accountType: AccountType

      // Verify Stake and Unstake transactions. If failed, the verify functions return false
      let verifyResult = {
        success: true,
        reason: '',
      }
      try {
        if (appData.internalTx && appData.internalTXType === InternalTXType.Stake) {
          accountType = AccountType.StakeReceipt
          appData.internalTx = getStakeTxBlobFromEVMTx(transaction)
          appData.internalTx.stake = BigInt(appData.internalTx.stake)
          verifyResult = verifyStakeTx(appData.internalTx, senderAddress, wrappedStates)
        }
        if (appData.internalTx && appData.internalTXType === InternalTXType.Unstake) {
          accountType = AccountType.UnstakeReceipt
          appData.internalTx = getStakeTxBlobFromEVMTx(transaction)
          verifyResult = verifyUnstakeTx(appData.internalTx, senderAddress, wrappedStates, shardus)
        }
        if (appData.internalTx && appData.internalTXType === InternalTXType.TransferFromSecureAccount) {
          accountType = AccountType.SecureAccount
          verifyResult = verifyTransferFromSecureAccount(appData.internalTx, wrappedStates, shardus)
        }
        if (verifyResult == null) {
          verifyResult = {
            success: false,
            reason: 'verify result undefined',
          }
        }
      } catch (error) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Stake/Unstake tx verification failed, reason: ${error}`)
        verifyResult = {
          success: false,
          reason: error,
        }
      }

      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`[apply] verifyResult: ${JSON.stringify(verifyResult)}`)

      //Note this currently only applies to stake and unstake, if you expand to deal with other
      //TX types please take care that the code in this block below is still correct.
      //for example a counter assumes this will be related to stake/unstake
      if (!verifyResult.success) {
        if (ShardeumFlags.failedStakeReceipt) {
          const blockForReceipt = getOrCreateBlockFromTimestamp(txTimestamp)
          const blockNumberForTx = blockForReceipt.header.number.toString()
          // generate a failed receipt for stake/unstake tx
          const readableReceipt: ReadableReceipt = {
            status: 0, //FAILED
            transactionHash: ethTxId,
            transactionIndex: '0x1',
            // eslint-disable-next-line security/detect-object-injection
            blockNumber: bigIntToHex(blocks[blockForReceipt.header.number.toString()].header.number),
            nonce: bigIntToHex(transaction.nonce),
            blockHash: readableBlocks[blockNumberForTx].hash, // eslint-disable-line security/detect-object-injection
            cumulativeGasUsed: '0x0', // NO GAS USED
            gasUsed: '0x0',
            gasRefund: '0x0',
            gasPrice: bigIntToHex(transaction.gasPrice),
            gasLimit: bigIntToHex(transaction.gasLimit),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            logs: [],
            logsBloom: '',
            contractAddress: null,
            from: senderAddress.toString(),
            to: transaction.to ? transaction.to.toString() : null,
            chainId: '0x' + ShardeumFlags.ChainID.toString(16),
            reason: verifyResult.reason,
            value: bigIntToHex(transaction.value),
            type: '0x' + transaction.type.toString(16),
            data: bytesToHex(transaction.data),
            v: bigIntToHex(transaction.v),
            r: bigIntToHex(transaction.r),
            s: bigIntToHex(transaction.s),
          }

          const wrappedReceiptAccount: WrappedEVMAccount = {
            timestamp: txTimestamp,
            ethAddress: ethTxId,
            hash: '',
            readableReceipt,
            amountSpent: '0x0',
            txId,
            accountType: config.server.p2p.fixApplyReceiptType ? accountType : AccountType.StakeReceipt,
            txFrom: appData.internalTx.nominator,
          }

          const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
          shardus.applyResponseAddReceiptData(
            applyResponse,
            receiptShardusAccount,
            crypto.hashObj(receiptShardusAccount)
          )

          nestedCountersInstance.countEvent(
            'shardeum-staking',
            `failed type:${appData.internalTXType} ${verifyResult.reason}`
          )

          return applyResponse
        } else {
          throw new Error(`Stake/Unstake transaction failed, reason: ${verifyResult.reason}`)
        }
      }

      //Now we need to get a transaction state object.  For single sharded networks this will be a new object.
      //When we have multiple shards we could have some blob data that wrapped up read accounts.  We will read these accounts
      //Into the transaction state init at some point (possibly not here).  This will allow the EVM to run and not have
      //A storage miss for accounts that were read on previous shard attempts to execute this TX
      // let transactionState = transactionStateMap.get(txId)
      // if (transactionState == null) {
      //   transactionState = new TransactionState()
      //   transactionState.initData(
      //     shardeumStateManager,
      //     {
      //       storageMiss: accountMiss,
      //       contractStorageMiss,
      //       accountInvolved,
      //       contractStorageInvolved,
      //       tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp
      //     },
      //     txId,
      //     undefined,
      //     undefined
      //   )
      //   transactionStateMap.set(txId, transactionState)
      // } else {
      //   //TODO possibly need a blob to re-init with, but that may happen somewhere else.  Will require a slight interface change
      //   //to allow shardus to pass in this extra data blob (unless we find a way to run it through wrapped states??)
      // }

      let shardeumState = getApplyTXState(txId)
      if (shardeumState.usedByApply === true) {
        if (ShardeumFlags.cleanStaleShardeumStateMap) {
          //if this TX state was used before it is critical to start clean
          //this is because our map is based on TXID
          //and the same TXID can pass through the system twice in certain cases
          /* prettier-ignore */ if (logFlags.error) console.error( `shardeumState.usedByApply === true clearing shardeumState! ${txId}` )
          deleteApplyTXState(txId, 'apply')
          shardeumState = getApplyTXState(txId)
        } else {
          // logging to know if we could have prevented a problem, however we need to wait for full rotation to turn on the fix
          /* prettier-ignore */ if (logFlags.error) console.error( `shardeumState.usedByApply === true fix not enabled. using stale state. shardeumState! ${txId}` )
        }
      }
      shardeumState.usedByApply = true //mark this as used by our apply function

      shardeumState._transactionState.appData = appData

      if (appData.internalTx && appData.internalTXType === InternalTXType.Stake) {
        if (ShardeumFlags.VerboseLogs) console.log('applying stake tx', wrappedStates, appData)

        // get stake tx from appData.internalTx
        const stakeCoinsTx: StakeCoinsTX = appData.internalTx
        const operatorShardusAddress = toShardusAddress(stakeCoinsTx.nominator, AccountType.Account)
        // eslint-disable-next-line security/detect-object-injection
        const operatorEVMAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress].data as WrappedEVMAccount

        // validate tx timestamp, compare timestamp against account's timestamp
        if (stakeCoinsTx.timestamp < operatorEVMAccount.timestamp) {
          throw new Error('Stake transaction timestamp is too old')
        }

        // // Validate tx timestamp against certExp (I thin)
        // if (operatorEVMAccount.operatorAccountInfo && operatorEVMAccount.operatorAccountInfo.certExp > 0) {
        //   if (stakeCoinsTx.timestamp > operatorEVMAccount.operatorAccountInfo.certExp) {
        //     throw new Error('Operator certExp is already set and expired compared to stake transaction')
        //   }
        // }

        // set stake value, nominee, cert in OperatorAcc (if not set yet)
        const nomineeNodeAccount2Address = stakeCoinsTx.nominee
        operatorEVMAccount.timestamp = txTimestamp

        // todo: operatorAccountInfo field may not exist in the operatorEVMAccount yet
        if (operatorEVMAccount.operatorAccountInfo == null) {
          operatorEVMAccount.operatorAccountInfo = {
            stake: BigInt(0),
            nominee: '',
            certExp: null,
            lastStakeTimestamp: txTimestamp, // last timestamp this account made a staking transaction
            operatorStats: {
              totalNodeReward: BigInt(0),
              totalNodePenalty: BigInt(0),
              totalNodeTime: 0,
              history: [],
              totalUnstakeReward: BigInt(0),
              unstakeCount: 0,
              isShardeumRun: false,
              lastStakedNodeKey: '',
            },
          }
        } else {
          operatorEVMAccount.operatorAccountInfo = fixBigIntLiteralsToBigInt(operatorEVMAccount.operatorAccountInfo)
        }

        const gasPrice = calculateGasPrice(
          ShardeumFlags.baselineTxFee,
          ShardeumFlags.baselineTxGasUsage,
          AccountsStorage.cachedNetworkAccount
        )
        const baseFee = transaction.getBaseFee()
        const txFee = gasPrice * baseFee
        const totalAmountToDeduct = stakeCoinsTx.stake + txFee
        if (operatorEVMAccount.account.balance < totalAmountToDeduct) {
          throw new Error('Operator account does not have enough balance to stake')
        }
        operatorEVMAccount.operatorAccountInfo.stake += stakeCoinsTx.stake
        operatorEVMAccount.operatorAccountInfo.nominee = stakeCoinsTx.nominee
        operatorEVMAccount.operatorAccountInfo.lastStakeTimestamp = txTimestamp
        if (operatorEVMAccount.operatorAccountInfo.certExp == null) operatorEVMAccount.operatorAccountInfo.certExp = 0
        fixDeserializedWrappedEVMAccount(operatorEVMAccount)

        operatorEVMAccount.account.balance = SafeBalance.subtractBigintBalance(
          operatorEVMAccount.account.balance,
          totalAmountToDeduct
        )
        operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce + BigInt(1)

        const operatorEVMAddress: Address = Address.fromString(stakeCoinsTx.nominator)
        shardus.setDebugSetLastAppAwait(`apply():checkpoint_putAccount_commit 1`)
        await shardeumState.checkpoint()
        await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
        await shardeumState.commit()
        shardus.setDebugSetLastAppAwait(`apply():checkpoint_putAccount_commit 1`, DebugComplete.Completed)

        // eslint-disable-next-line security/detect-object-injection
        const nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2
        if (typeof nodeAccount2.stakeLock === 'string') {
          nodeAccount2.stakeLock = BigInt('0x' + nodeAccount2.stakeLock)
        }

        nodeAccount2.stakeTimestamp = txTimestamp
        nodeAccount2.nominator = stakeCoinsTx.nominator
        nodeAccount2.stakeLock += stakeCoinsTx.stake
        nodeAccount2.timestamp = txTimestamp

        if (ShardeumFlags.useAccountWrites) {
          // for operator evm account
          const { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('\nAccount Writes: ', accountWrites)
          for (const account of accountWrites.entries()) {
            const addressStr = account[0]
            if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
              continue
            }
            const accountObj = Account.fromRlpSerializedAccount(account[1])
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('\nWritten Account Object: ', accountObj)

            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('written account Obj', accountObj)

            const wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }

            const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }

          const wrappedChangedNodeAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
            wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2
          )
          // for nominee node account
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            nomineeNodeAccount2Address,
            wrappedChangedNodeAccount as ShardusTypes.WrappedResponse,
            txId,
            txTimestamp
          )
        }

        const blockForReceipt = getOrCreateBlockFromTimestamp(txTimestamp)
        let blockNumberForTx = blockForReceipt.header.number.toString()

        if (ShardeumFlags.supportInternalTxReceipt === false) {
          blockNumberForTx = `${latestBlock}`
        }

        // generate a proper receipt for stake tx
        const readableReceipt: ReadableReceipt = {
          status: 1,
          transactionHash: ethTxId,
          transactionIndex: '0x1',
          // eslint-disable-next-line security/detect-object-injection
          blockNumber: bigIntToHex(blocks[blockNumberForTx].header.number),
          nonce: bigIntToHex(transaction.nonce),
          blockHash: readableBlocks[blockNumberForTx].hash, // eslint-disable-line security/detect-object-injection
          cumulativeGasUsed: bigIntToHex(baseFee),
          gasUsed: bigIntToHex(baseFee),
          gasRefund: '0x0',
          gasPrice: bigIntToHex(gasPrice),
          gasLimit: bigIntToHex(transaction.gasLimit),
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          logs: [],
          logsBloom: '',
          contractAddress: null,
          from: senderAddress.toString(),
          to: transaction.to ? transaction.to.toString() : null,
          chainId: '0x' + ShardeumFlags.ChainID.toString(16),
          stakeInfo: {
            nominee: nomineeNodeAccount2Address,
            stake: stakeCoinsTx.stake,
            totalStakeAmount: operatorEVMAccount.operatorAccountInfo.stake,
          },
          value: bigIntToHex(transaction.value),
          type: '0x' + transaction.type.toString(16),
          data: bytesToHex(transaction.data),
          v: bigIntToHex(transaction.v),
          r: bigIntToHex(transaction.r),
          s: bigIntToHex(transaction.s),
        }

        const wrappedReceiptAccount: WrappedEVMAccount = {
          timestamp: txTimestamp,
          ethAddress: ethTxId,
          hash: '',
          readableReceipt,
          amountSpent: bigIntToHex(txFee),
          txId,
          accountType: AccountType.StakeReceipt,
          txFrom: stakeCoinsTx.nominator,
        }
        /* prettier-ignore */
        if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)

        if (ShardeumFlags.EVMReceiptsAsAccounts) {
          if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx ${txId}`)
          if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx eth ${ethTxId}`)
          const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
          if (shardus.applyResponseAddChangedAccount != null) {
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }
        } else {
          const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
          shardus.applyResponseAddReceiptData(
            applyResponse,
            receiptShardusAccount,
            crypto.hashObj(receiptShardusAccount)
          )
        }
        return applyResponse
      }

      if (appData.internalTx && appData.internalTXType === InternalTXType.Unstake) {
        nestedCountersInstance.countEvent('shardeum-unstaking', 'applying unstake transaction')
        if (ShardeumFlags.VerboseLogs) console.log('applying unstake tx', wrappedStates, appData)

        // get unstake tx from appData.internalTx
        const unstakeCoinsTX: UnstakeCoinsTX = appData.internalTx

        // todo: validate tx timestamp, compare timestamp against account's timestamp

        // set stake value, nominee, cert in OperatorAcc (if not set yet)
        const operatorShardusAddress = toShardusAddress(unstakeCoinsTX.nominator, AccountType.Account)
        const nomineeNodeAccount2Address = unstakeCoinsTX.nominee
        // eslint-disable-next-line security/detect-object-injection
        const operatorEVMAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress].data as WrappedEVMAccount
        operatorEVMAccount.timestamp = txTimestamp

        if (operatorEVMAccount.operatorAccountInfo == null) {
          nestedCountersInstance.countEvent(
            'shardeum-unstaking',
            'unable to apply unstake tx, operator account info does not exist'
          )
          throw new Error(
            `Unable to apply Unstake tx because operator account info does not exist for ${unstakeCoinsTX.nominator}`
          )
        } else {
          operatorEVMAccount.operatorAccountInfo = fixBigIntLiteralsToBigInt(operatorEVMAccount.operatorAccountInfo)
        }
        fixDeserializedWrappedEVMAccount(operatorEVMAccount)

        if (operatorEVMAccount.operatorAccountInfo.certExp > txTimestamp && ShardeumFlags.unstakeCertCheckFix) {
          throw new Error(
            `Unable to apply Unstake tx because stake cert has not yet expired. Expiry timestamp ${operatorEVMAccount.operatorAccountInfo.certExp}`
          )
        }

        // eslint-disable-next-line security/detect-object-injection
        const nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2

        const currentBalance = operatorEVMAccount.account.balance
        const stake = BigInt(operatorEVMAccount.operatorAccountInfo.stake)
        let reward = BigInt(nodeAccount2.reward)
        const penalty = BigInt(nodeAccount2.penalty)

        const gasPrice = calculateGasPrice(
          ShardeumFlags.baselineTxFee,
          ShardeumFlags.baselineTxGasUsage,
          AccountsStorage.cachedNetworkAccount
        )
        const baseFee = transaction.getBaseFee()
        const txFee = gasPrice * baseFee
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('calculating new balance after unstake', currentBalance, stake, reward, penalty, txFee)
        if (nodeAccount2.rewardEndTime === 0 && nodeAccount2.rewardStartTime > 0) {
          // This block will only be reached if the node is inactive and the force unstake flag has been set
          reward = BigInt(0)

          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('discarding staking rewards due to zero rewardEndTime')
        }
        const newBalance = SafeBalance.addBigintBalance(currentBalance, stake + reward - txFee)
        operatorEVMAccount.account.balance = newBalance
        operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce + BigInt(1)

        operatorEVMAccount.operatorAccountInfo.stake = BigInt(0)
        operatorEVMAccount.operatorAccountInfo.nominee = null
        operatorEVMAccount.operatorAccountInfo.certExp = null
        operatorEVMAccount.operatorAccountInfo.lastStakeTimestamp = txTimestamp

        // update the operator historical stats
        operatorEVMAccount.operatorAccountInfo.operatorStats.totalUnstakeReward =
          _base16BNParser(operatorEVMAccount.operatorAccountInfo.operatorStats.totalUnstakeReward) + reward
        operatorEVMAccount.operatorAccountInfo.operatorStats.unstakeCount += 1
        operatorEVMAccount.operatorAccountInfo.operatorStats.lastStakedNodeKey = nomineeNodeAccount2Address

        const operatorEVMAddress: Address = Address.fromString(unstakeCoinsTX.nominator)
        shardus.setDebugSetLastAppAwait(`apply():checkpoint_putAccount_commit 2`)
        await shardeumState.checkpoint()
        await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
        await shardeumState.commit()
        shardus.setDebugSetLastAppAwait(`apply():checkpoint_putAccount_commit 2`, DebugComplete.Completed)

        let stakeInfo: StakeInfo
        if (ShardeumFlags.totalUnstakeAmount) {
          // I think rewardStartTime and rewardEndTime can be omitted now, since it's only for the last time the node was participated
          stakeInfo = {
            nominee: nomineeNodeAccount2Address,
            // rewardStartTime: nodeAccount2.rewardStartTime,
            // rewardEndTime: nodeAccount2.rewardEndTime,
            stake,
            reward,
            penalty,
            totalUnstakeAmount: stake + reward,
          }
        } else {
          stakeInfo = {
            nominee: nomineeNodeAccount2Address,
            rewardStartTime: nodeAccount2.rewardStartTime,
            rewardEndTime: nodeAccount2.rewardEndTime,
            reward,
            penalty,
          }
        }

        nodeAccount2.nominator = null
        nodeAccount2.stakeLock = BigInt(0)
        nodeAccount2.timestamp = txTimestamp
        nodeAccount2.penalty = BigInt(0)
        nodeAccount2.reward = BigInt(0)
        nodeAccount2.rewardStartTime = 0
        nodeAccount2.rewardEndTime = 0
        nodeAccount2.rewarded = false

        if (ShardeumFlags.useAccountWrites) {
          // for operator evm account
          const { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('\nAccount Writes: ', accountWrites)
          for (const account of accountWrites.entries()) {
            const addressStr = account[0]
            if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
              continue
            }
            const accountObj = Account.fromRlpSerializedAccount(account[1])
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('\nWritten Account Object: ', accountObj)

            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('written account Obj', accountObj)

            const wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }
            const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }

          const wrappedChangedNodeAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
            wrappedStates[nomineeNodeAccount2Address].data as NodeAccount2
          )
          // for nominee node account
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            nomineeNodeAccount2Address,
            // eslint-disable-next-line security/detect-object-injection
            wrappedChangedNodeAccount as ShardusTypes.WrappedResponse,
            txId,
            txTimestamp
          )
        }

        const blockForReceipt = getOrCreateBlockFromTimestamp(txTimestamp)
        let blockNumberForTx = blockForReceipt.header.number.toString()

        if (ShardeumFlags.supportInternalTxReceipt === false) {
          blockNumberForTx = `${latestBlock}`
        }

        // generate a proper receipt for unstake tx
        const readableReceipt: ReadableReceipt = {
          status: 1,
          transactionHash: ethTxId,
          transactionIndex: '0x1',
          // eslint-disable-next-line security/detect-object-injection
          blockNumber: bigIntToHex(blocks[blockNumberForTx].header.number),
          nonce: bigIntToHex(transaction.nonce),
          // eslint-disable-next-line security/detect-object-injection
          blockHash: readableBlocks[blockNumberForTx].hash,
          cumulativeGasUsed: bigIntToHex(baseFee),
          gasUsed: bigIntToHex(baseFee),
          gasRefund: '0x0',
          gasPrice: bigIntToHex(gasPrice),
          gasLimit: bigIntToHex(transaction.gasLimit),
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          logs: [],
          logsBloom: '',
          contractAddress: null,
          from: senderAddress.toString(),
          to: transaction.to ? transaction.to.toString() : null,
          chainId: '0x' + ShardeumFlags.ChainID.toString(16),
          stakeInfo,
          value: bigIntToHex(transaction.value),
          type: '0x' + transaction.type.toString(16),
          data: bytesToHex(transaction.data),
          v: bigIntToHex(transaction.v),
          r: bigIntToHex(transaction.r),
          s: bigIntToHex(transaction.s),
        }

        const wrappedReceiptAccount = {
          timestamp: txTimestamp,
          ethAddress: ethTxId,
          hash: '',
          readableReceipt,
          amountSpent: bigIntToHex(txFee),
          txId,
          accountType: AccountType.UnstakeReceipt,
          txFrom: unstakeCoinsTX.nominator,
        }
        /* prettier-ignore */
        if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)

        if (ShardeumFlags.EVMReceiptsAsAccounts) {
          if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx ${txId}`)
          if (ShardeumFlags.VerboseLogs) console.log(`Applied stake tx eth ${ethTxId}`)
          const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
          if (shardus.applyResponseAddChangedAccount != null) {
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }
        } else {
          const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
          shardus.applyResponseAddReceiptData(
            applyResponse,
            receiptShardusAccount,
            crypto.hashObj(receiptShardusAccount)
          )
        }
        return applyResponse
      }

      const validatorStakedAccounts: Map<string, OperatorAccountInfo> = new Map()

      //ah shoot this binding will not be "thread safe" may need to make it part of the EEI for this tx? idk.
      //shardeumStateManager.setTransactionState(transactionState)

      // loop through the wrappedStates an insert them into the transactionState as first*Reads
      for (const accountId in wrappedStates) {
        if (shardusReceiptAddress === accountId) {
          //have to skip the created receipt account
          continue
        }

        // eslint-disable-next-line security/detect-object-injection
        const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[accountId].data as WrappedEVMAccount
        fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
        let address
        if (wrappedEVMAccount.accountType === AccountType.ContractCode)
          address = Address.fromString(wrappedEVMAccount.contractAddress)
        else address = Address.fromString(wrappedEVMAccount.ethAddress)

        if (ShardeumFlags.VerboseLogs) {
          const ourNodeShardData = shardus.stateManager.currentCycleShardData.nodeShardData
          const minP = ourNodeShardData.consensusStartPartition
          const maxP = ourNodeShardData.consensusEndPartition
          const shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
          const { homePartition } = __ShardFunctions.addressToPartition(
            shardus.stateManager.currentCycleShardData.shardGlobals,
            shardusAddress
          )
          const accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false

          /* prettier-ignore */ console.log('DBG', 'tx insert data', txId, `accountIsRemote: ${accountIsRemote} acc:${address} key:${wrappedEVMAccount.key} type:${wrappedEVMAccount.accountType}`)
        }

        if (wrappedEVMAccount.accountType === AccountType.Account) {
          shardeumState._transactionState.insertFirstAccountReads(address, wrappedEVMAccount.account)
          if (wrappedEVMAccount.operatorAccountInfo) {
            validatorStakedAccounts.set(wrappedEVMAccount.ethAddress, wrappedEVMAccount.operatorAccountInfo)
          }
        } else if (wrappedEVMAccount.accountType === AccountType.ContractCode) {
          shardeumState._transactionState.insertFirstContractBytesReads(address, wrappedEVMAccount.codeByte)
        } else if (wrappedEVMAccount.accountType === AccountType.ContractStorage) {
          shardeumState._transactionState.insertFirstContractStorageReads(
            address,
            wrappedEVMAccount.key,
            wrappedEVMAccount.value
          )
        }
      }

      // this code's got bug
      // if(ShardeumFlags.CheckNonce === true){
      //   let senderEVMAddrStr = senderAddress.toString()
      //   let shardusAddress = toShardusAddress(senderEVMAddrStr,  AccountType.Account)
      //   let senderAccount:WrappedEVMAccount = wrappedStates[shardusAddress]
      //  bug here seem like nonce is undefined even though type def indicate, it does.
      //   if(senderAccount.account.nonce >= transaction.nonce ){
      //     throw new Error(`invalid transaction, reason: nonce fail. tx: ${Utils.safeStringify(tx)}`)
      //   }
      // }

      // Apply the tx
      const blockForTx = getOrCreateBlockFromTimestamp(txTimestamp)
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Block for tx ${ethTxId}`, blockForTx.header.number.toString(10))
      let runTxResult: RunTxResult
      let wrappedReceiptAccount: WrappedEVMAccount
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`apply():getLocalOrRemoteAccount(${networkAccount})`)
      const wrappedNetworkAccount: ShardusTypes.WrappedData = await shardus.getLocalOrRemoteAccount(networkAccount)
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`apply():getLocalOrRemoteAccount(${networkAccount})`, DebugComplete.Completed)
      try {
        const customEVM = new EthereumVirtualMachine({
          common: evmCommon,
          stateManager: shardeumState,
        })
        // if checkNonce is true, we're not gonna skip the nonce
        EVM.stateManager = null
        EVM.stateManager = shardeumState
        shardus.setDebugSetLastAppAwait(`apply():runTx`)

        try {
          runTxResult = await EVM.runTx(
            {
              block: blockForTx,
              tx: transaction,
              skipNonce: !ShardeumFlags.CheckNonce,
              networkAccount: wrappedNetworkAccount.data,
            },
            customEVM,
            txId
          )
        } finally {
          customEVM.cleanUp()
        }

        shardus.setDebugSetLastAppAwait(`apply():runTx`, DebugComplete.Completed)
        if (ShardeumFlags.VerboseLogs) console.log('runTxResult', txId, runTxResult)

        if (ShardeumFlags.labTest) {
          if (shardus.testFailChance(0.01, 'labTest: loop-lock1', txId, '', true)) {
            await shardus.debugForeverLoop('labTest: loop-lock1')
          }
        }
      } catch (e) {
        // if (!transactionFailHashMap[ethTxId]) {
        let caAddr = null
        if (!transaction.to) {
          const txSenderEvmAddr = senderAddress.toString()

          const hack0Nonce = BigInt(0)
          const caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, hack0Nonce)

          caAddr = '0x' + caAddrBuf.toString('hex')

          const shardusAddr = toShardusAddress(caAddr, AccountType.Account)
          // otherAccountKeys.push(shardusAddr)
          // shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })

          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Predicting contract account address:', caAddr, shardusAddr)
        }
        const readableReceipt: ReadableReceipt = {
          status: 0,
          transactionHash: ethTxId,
          transactionIndex: '0x1',
          blockNumber: readableBlocks[blockForTx.header.number.toString(10)].number,
          nonce: bigIntToHex(transaction.nonce),
          blockHash: readableBlocks[blockForTx.header.number.toString(10)].hash,
          cumulativeGasUsed: '0x',
          logs: null,
          logsBloom: null,
          gasUsed: '0x',
          gasRefund: '0x0',
          gasPrice: bigIntToHex(transaction.gasPrice),
          gasLimit: bigIntToHex(transaction.gasLimit),
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          contractAddress: caAddr,
          from: senderAddress.toString(),
          to: transaction.to ? transaction.to.toString() : null,
          chainId: '0x' + ShardeumFlags.ChainID.toString(16),
          value: bigIntToHex(transaction.value),
          type: '0x' + transaction.type.toString(16),
          data: '0x',
          reason: e.toString(),
          v: bigIntToHex(transaction.v),
          r: bigIntToHex(transaction.r),
          s: bigIntToHex(transaction.s),
        }
        wrappedReceiptAccount = {
          timestamp: txTimestamp,
          ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
          hash: '',
          // receipt: runTxResult.receipt,
          readableReceipt,
          amountSpent: bigIntToHex(BigInt(0)),
          txId,
          accountType: AccountType.Receipt,
          txFrom: senderAddress.toString(),
        }
        
        // Add the failure receipt to the applyResponse
        if (ShardeumFlags.EVMReceiptsAsAccounts) {
          const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
          if (shardus.applyResponseAddChangedAccount != null) {
            shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount as ShardusTypes.WrappedResponse, txId, wrappedChangedAccount.timestamp)
          }
        } else {
          const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
          shardus.applyResponseAddReceiptData(applyResponse, receiptShardusAccount, crypto.hashObj(receiptShardusAccount))
        }
        
        // Mark the transaction as failed
        shardus.applyResponseSetFailed(applyResponse, e.toString())
        
        /* prettier-ignore */ if (logFlags.error) shardus.log('Unable to apply transaction', e)
        //if (logFlags.dapp_verbose ) console.log('Unable to apply transaction', txId, e)
        
        // Return the applyResponse instead of throwing
        return applyResponse
      }
      if (ShardeumFlags.VerboseLogs) console.log('DBG', 'applied tx', txId, runTxResult)
      if (ShardeumFlags.VerboseLogs) console.log('DBG', 'applied tx eth', ethTxId, runTxResult)

      if (ShardeumFlags.AppliedTxsMaps) {
        // eslint-disable-next-line security/detect-object-injection
        shardusTxIdToEthTxId[txId] = ethTxId // todo: fix that this is getting set too early, should wait untill after TX consensus

        // this is to expose tx data for json rpc server
        // eslint-disable-next-line security/detect-object-injection
        appliedTxs[ethTxId] = {
          txId: ethTxId,
          injected: tx,
          receipt: { ...runTxResult, nonce: bigIntToHex(transaction.nonce), status: 1 },
        }
      }

      //get a list of accounts or CA keys that have been written to
      //This is important because the EVM could change many accounts or keys that we are not aware of
      //the transactionState is what accumulates the writes that we need
      const {
        accounts: accountWrites,
        contractStorages: contractStorageWrites,
        contractBytes: contractBytesWrites,
      } = shardeumState._transactionState.getWrittenAccounts()

      if (ShardeumFlags.VerboseLogs) console.log(`DBG: all contractStorages writes`, contractStorageWrites)

      for (const contractStorageEntry of contractStorageWrites.entries()) {
        //1. wrap and save/update this to shardeum accounts[] map
        const addressStr = contractStorageEntry[0]
        const contractStorageWrites = contractStorageEntry[1]
        for (const [key, value] of contractStorageWrites) {
          // do we need .entries()?
          const wrappedEVMAccount: WrappedEVMAccount = {
            timestamp: txTimestamp,
            key,
            value,
            ethAddress: addressStr, //this is confusing but I think we may want to use key here
            hash: '',
            accountType: AccountType.ContractStorage,
          }
          //for now the CA shardus address will be based off of key rather than the CA address
          //eventually we may use both with most significant hex of the CA address prepended
          //to the CA storage key (or a hash of the key)

          const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          //attach to applyResponse
          if (shardus.applyResponseAddChangedAccount != null) {
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }
        }
      }

      //Keep a map of CA addresses to codeHash
      //use this later in the loop of account updates to set the correct account code hash values
      const accountToCodeHash: Map<string, Uint8Array> = new Map()

      if (ShardeumFlags.VerboseLogs) console.log(`DBG: all contractBytes writes`, contractBytesWrites)

      for (const contractBytesEntry of contractBytesWrites.entries()) {
        //1. wrap and save/update this to shardeum accounts[] map
        const contractByteWrite: ContractByteWrite = contractBytesEntry[1]
        const codeHashStr = bytesToHex(contractByteWrite.codeHash)
        const wrappedEVMAccount: WrappedEVMAccount = {
          timestamp: txTimestamp,
          codeHash: contractByteWrite.codeHash,
          codeByte: contractByteWrite.contractByte,
          ethAddress: codeHashStr,
          contractAddress: contractByteWrite.contractAddress.toString(),
          hash: '',
          accountType: AccountType.ContractCode,
        }

        //add our codehash to the map entry for the CA address
        accountToCodeHash.set(contractByteWrite.contractAddress.toString(), contractByteWrite.codeHash)

        if (ShardeumFlags.globalCodeBytes === true) {
          //set this globally instead!
          setGlobalCodeByteUpdate(txTimestamp, wrappedEVMAccount, applyResponse)
        } else {
          const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          //attach to applyResponse
          if (shardus.applyResponseAddChangedAccount != null) {
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedChangedAccount.accountId,
              wrappedChangedAccount as ShardusTypes.WrappedResponse,
              txId,
              wrappedChangedAccount.timestamp
            )
          }
        }
      }
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('DBG: accountsToCodeHash', accountToCodeHash)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('DBG: all account writes', shardeumState._transactionState.logAccountWrites(accountWrites))

      // Handle Account type last, because CAs may depend on CA:Storage or CA:Bytecode updates
      //wrap these accounts and keys up and add them to the applyResponse as additional involved accounts
      for (const account of accountWrites.entries()) {
        //1. wrap and save/update this to shardeum accounts[] map
        const addressStr = account[0]
        if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
          //do not inform shardus about the 0 address account
          continue
        }
        const accountObj = Account.fromRlpSerializedAccount(account[1])

        const wrappedEVMAccount: WrappedEVMAccount = {
          timestamp: txTimestamp,
          account: accountObj,
          ethAddress: addressStr,
          hash: '',
          accountType: AccountType.Account,
        }
        if (validatorStakedAccounts.has(addressStr))
          wrappedEVMAccount.operatorAccountInfo = validatorStakedAccounts.get(addressStr)
        //If this account has an entry in the map use it to set the codeHash.
        // the ContractCode "account" will get pushed later as a global TX
        if (accountToCodeHash.has(addressStr)) {
          accountObj.codeHash = accountToCodeHash.get(addressStr)
        }

        // I think data is unwrapped too much and we should be using wrappedEVMAccount directly as data
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)

        // and the added it to the apply response (not implemented yet)
        //Attach the written account data to the apply response.  This will allow it to be shared with other shards if needed.
        if (shardus.applyResponseAddChangedAccount != null) {
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount as ShardusTypes.WrappedResponse,
            txId,
            wrappedChangedAccount.timestamp
          )
        }
      }

      if (accountWrites.size === 0) {
        // it means SHM transfer fail
        // loop through original wrappedStates and add them to the applyResponse
        for (const accountId in wrappedStates) {
          if (wrappedStates[accountId].timestamp === 0) continue
          const wrappedData: ShardusTypes.WrappedData = wrappedStates[accountId]
          if (shardus.applyResponseAddChangedAccount != null) {
            shardus.applyResponseAddChangedAccount(
              applyResponse,
              wrappedData.accountId,
              wrappedData as ShardusTypes.WrappedResponse,
              txId,
              wrappedData.timestamp
            )
          }
        }
      }

      //TODO also create an account for the receipt (nested in the returned runTxResult should be a receipt with a list of logs)
      // We are ready to loop over the receipts and add them
      if (runTxResult) {
        const runState: any = runTxResult.execResult.runState
        let logs = []
        if (runState == null) {
          if (ShardeumFlags.VerboseLogs) console.log(`No runState found in the receipt for ${txId}`)
        } else {
          logs = runState.logs.map((l: [Buffer, Buffer[], Buffer], index) => {
            return {
              logIndex: ShardeumFlags.receiptLogIndexFix ? '0x' + index.toString(16) : '0x1',
              blockNumber: readableBlocks[blockForTx.header.number.toString(10)].number,
              blockHash: readableBlocks[blockForTx.header.number.toString(10)].hash,
              transactionHash: ethTxId,
              transactionIndex: '0x1',
              address: bytesToHex(l[0]),
              topics: l[1].map((i) => bytesToHex(i)),
              data: bytesToHex(l[2]),
            }
          })
        }
        const readableReceipt: ReadableReceipt = {
          status: runTxResult.receipt['status'],
          transactionHash: ethTxId,
          transactionIndex: '0x1',
          blockNumber: readableBlocks[blockForTx.header.number.toString()].number,
          nonce: bigIntToHex(transaction.nonce),
          blockHash: readableBlocks[blockForTx.header.number.toString()].hash,
          cumulativeGasUsed: bigIntToHex(runTxResult.receipt.cumulativeBlockGasUsed),
          gasUsed: bigIntToHex(runTxResult.totalGasSpent),
          gasRefund: bigIntToHex(runTxResult.execResult.gasRefund ?? BigInt(0)),
          gasPrice: bigIntToHex(runTxResult.amountSpent / runTxResult.totalGasSpent),
          gasLimit: bigIntToHex(transaction.gasLimit),
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined,
          logs: logs,
          logsBloom: bytesToHex(runTxResult.receipt.bitvector),
          contractAddress: runTxResult.createdAddress ? runTxResult.createdAddress.toString() : null,
          from: senderAddress.toString(),
          to: transaction.to ? transaction.to.toString() : null,
          chainId: '0x' + ShardeumFlags.ChainID.toString(16),
          value: bigIntToHex(transaction.value),
          type: '0x' + transaction.type.toString(16),
          data: bytesToHex(transaction.data),
          v: bigIntToHex(transaction.v),
          r: bigIntToHex(transaction.r),
          s: bigIntToHex(transaction.s),
        }
        if (runTxResult.execResult.exceptionError) {
          readableReceipt.reason = runTxResult.execResult.exceptionError.error
        }
        wrappedReceiptAccount = {
          timestamp: txTimestamp,
          ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
          hash: '',
          receipt: runTxResult.receipt as any,
          readableReceipt,
          amountSpent: bigIntToHex(runTxResult.amountSpent),
          txId,
          accountType: AccountType.Receipt,
          txFrom: senderAddress.toString(),
        }
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)
      }

      if (ShardeumFlags.EVMReceiptsAsAccounts) {
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
        if (shardus.applyResponseAddChangedAccount != null) {
          shardus.applyResponseAddChangedAccount(
            applyResponse,
            wrappedChangedAccount.accountId,
            wrappedChangedAccount as ShardusTypes.WrappedResponse,
            txId,
            wrappedChangedAccount.timestamp
          )
        }
      } else {
        const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
        //put this in the apply response
        shardus.applyResponseAddReceiptData(applyResponse, receiptShardusAccount, crypto.hashObj(receiptShardusAccount))
      }
      if (ShardeumFlags.VerboseLogs) console.log('Applied txId', txId, txTimestamp)

      // not sure what to do here.
      // shardus.applyResponseAddReceiptData(applyResponse, readableReceipt, crypto.hashObj(readableReceipt))
      // shardus.applyResponseSetFailed(applyResponse, reason)
      // return applyResponse //return rather than throw exception

      //TODO need to detect if an execption here is a result of jumping the TX to another thread!
      // shardus must be made to handle that

      // todo can set a jummped value that we return!

      //shardeumStateManager.unsetTransactionState(txId)

      return applyResponse
    },
    async txPreCrackData(tx, appData): Promise<{ status: boolean; reason: string }> {
      if (ShardeumFlags.UseTXPreCrack === false) {
        return { status: true, reason: 'UseTXPreCrack is false' }
      }

      if (ShardeumFlags.internalTxTimestampFix === false) appData.requestNewTimestamp = true // force all txs to generate a new timestamp
      // Check if we are active

      if (isDebugTx(tx) && !ShardeumFlags.debugTxEnabled) {
        return { status: false, reason: `Debug TX have been disabled.` }
      }

      if (isInternalTx(tx) === false && isDebugTx(tx) === false) {
        const shardusTxId = generateTxId(tx)
        const transaction = getTransactionObj(tx)
        const senderAddress = getTxSenderAddress(transaction, shardusTxId).address
        const ethTxId = bytesToHex(transaction.hash())
        if (ShardeumFlags.VerboseLogs) {
          console.log(`EVM tx ${ethTxId} is mapped to shardus tx ${shardusTxId}`)
          console.log(`Shardus tx ${shardusTxId} is mapped to EVM tx ${ethTxId}`)
        }

        const isStakeRelatedTx: boolean = isStakingEVMTx(transaction)

        let isSimpleTransfer = false
        let remoteShardusAccount
        let remoteTargetAccount
        appData.requestNewTimestamp = true // force all evm txs to generate a new timestamp

        const isEIP2930 = transaction instanceof AccessListEIP2930Transaction && transaction.AccessListJSON != null
        if (isEIP2930) {
          const eip2930Tx = transaction as AccessListEIP2930Transaction

          const tooManyAddresses = eip2930Tx.AccessListJSON?.length > ShardeumFlags.accessListSizeLimit
          if (tooManyAddresses) {
            return {
              status: false,
              reason: `EIP2930 tx blocked for having > ${ShardeumFlags.accessListSizeLimit} addresses in accessList`,
            }
          }

          const tooManyStorageKeys = eip2930Tx.AccessListJSON?.some(
            (accessListItem) => accessListItem.storageKeys?.length > ShardeumFlags.accessListSizeLimit
          )
          if (tooManyStorageKeys) {
            return {
              status: false,
              reason: `EIP2930 tx blocked for having > ${ShardeumFlags.accessListSizeLimit} storage keys for at least one address`,
            }
          }
        }

        //if the TX is a contract deploy, predict the new contract address correctly (needs sender's nonce)
        //remote fetch of sender EOA also allows fast balance and nonce checking (assuming we get some queue hints as well from shardus core)
        if (
          ShardeumFlags.txNoncePreCheck ||
          ShardeumFlags.txBalancePreCheck ||
          (transaction.to == null && isEIP2930 === false)
        ) {
          let foundNonce = false
          let foundSender = false
          let nonce = BigInt(0)
          let balance = BigInt(0)
          const txSenderEvmAddr = senderAddress.toString()
          const transformedSourceKey = toShardusAddress(txSenderEvmAddr, AccountType.Account)

          let queueCountResult = undefined
          const maxRetry = 3
          let retry = 0
          if (ShardeumFlags.txNoncePreCheck) {
            while ((!queueCountResult || queueCountResult?.count === -1) && retry < maxRetry) {
              retry++
              queueCountResult = await shardus.getLocalOrRemoteAccountQueueCount(transformedSourceKey)
            }
            if (!queueCountResult || queueCountResult?.count === -1) {
              nestedCountersInstance.countEvent('shardeum', 'Fetching queue count failed')
            }
          }
          retry = 0
          while (remoteShardusAccount == null && retry < maxRetry) {
            if (ShardeumFlags.VerboseLogs)
              if (ShardeumFlags.VerboseLogs)
                console.log(`txPreCrackData: fetching remote account for ${txSenderEvmAddr}, retry: ${retry}`)
            retry++
            // remoteShardusAccount = await shardus
            //   .getLocalOrRemoteAccount(transformedSourceKey)
            //   .then((account) => account.data)
            //   .catch((e) => {
            //     console.error(`txPreCrackData: error fetching remote account for ${txSenderEvmAddr}, retry: ${retry}`, e)
            //   });

            try {
              const account = await shardus.getLocalOrRemoteAccount(transformedSourceKey)
              if (account) {
                remoteShardusAccount = account.data
              }
            } catch (e) {
              console.error(`txPreCrackData: error fetching remote account for ${txSenderEvmAddr}, retry: ${retry}`, e)
            }
          }
          if (remoteShardusAccount == null) {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData: found no local or remote account for address: ${txSenderEvmAddr}, key: ${transformedSourceKey}.`)
            nestedCountersInstance.countEvent('shardeum', 'remoteShardusAccount was empty')
          }

          if (transaction.to) {
            const txTargetEvmAddr = transaction.to.toString()
            const transformedTargetKey = toShardusAddress(txTargetEvmAddr, AccountType.Account)
            remoteTargetAccount = await shardus.getLocalOrRemoteAccount(transformedTargetKey)
          }
          if (ShardeumFlags.txNoncePreCheck) {
            if (ShardeumFlags.VerboseLogs) console.log('queueCountResult:', queueCountResult)
            if (queueCountResult.account) {
              if (ShardeumFlags.VerboseLogs) console.log(queueCountResult.account)
              remoteShardusAccount = queueCountResult.account
            }
          }

          if (remoteShardusAccount == null && isDebugMode() === false) {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData: found no local or remote account for address: ${txSenderEvmAddr}, key: ${transformedSourceKey}. using nonce=0`)
            return {
              status: false,
              reason: `Couldn't find local or remote account for address: ${txSenderEvmAddr}`,
            }
          } else {
            foundSender = true
            const wrappedEVMAccount = remoteShardusAccount as WrappedEVMAccount
            if (wrappedEVMAccount && wrappedEVMAccount.account) {
              fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
              nonce = wrappedEVMAccount.account.nonce
              balance = wrappedEVMAccount.account.balance
              foundNonce = true
            } else {
              if (isDebugMode() === false)
                return { status: false, reason: `Couldn't find account data for address: ${txSenderEvmAddr}` }
            }
          }

          if (remoteTargetAccount == null) {
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData: target account not found`)
          } else {
            const wrappedEVMAccount = remoteTargetAccount.data as WrappedEVMAccount
            if (wrappedEVMAccount && wrappedEVMAccount.account) {
              fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
              const codeHashString = bytesToHex(wrappedEVMAccount.account.codeHash)
              if (codeHashString && codeHashString === emptyCodeHash) {
                isSimpleTransfer = true
              }
            }
          }

          //Predict the new CA address if not eip2930.  is this correct though?
          if (transaction.to == null && isEIP2930 === false) {
            const caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, nonce)
            const caAddr = '0x' + caAddrBuf.toString('hex')
            appData.newCAAddr = caAddr
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData found nonce:${foundNonce} found sender:${foundSender} for ${txSenderEvmAddr} nonce:${nonce.toString()} ca:${caAddr}`)
          }

          // Attach nonce, queueCount and txNonce to appData
          if (ShardeumFlags.txNoncePreCheck) {
            if (queueCountResult.count === -1) {
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData uanble to get queueCountResult for ${txSenderEvmAddr} queueCountResult:${queueCountResult}`)
              return { status: false, reason: `Unable to get queueCountResult for ${txSenderEvmAddr}` }
            } else {
              appData.queueCount = queueCountResult.count
              appData.nonce = parseInt(nonce.toString())
              if (queueCountResult.committingAppData?.length > 0) {
                const highestCommittingNonce = queueCountResult.committingAppData
                  .map((appData) => appData.txNonce)
                  .sort()[0]
                const expectedAccountNonce = highestCommittingNonce + 1
                if (appData.nonce < expectedAccountNonce) appData.nonce = expectedAccountNonce
              }
              appData.txNonce = parseInt(transaction.nonce.toString(10))
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`txPreCrackData found nonce:${foundNonce} found sender:${foundSender} for ${txSenderEvmAddr} nonce:${nonce.toString()} queueCount:${queueCountResult.count.toString()}`)
            }
          }

          // Attach balance to appData
          if (ShardeumFlags.txBalancePreCheck) {
            appData.balance = balance
          }

          //force all EVM transactions including simple ones to generate a timestamp
        }
        let shouldGenerateAccesslist = true
        if (ShardeumFlags.autoGenerateAccessList === false) shouldGenerateAccesslist = false
        else if (isStakeRelatedTx) shouldGenerateAccesslist = false
        else if (isSimpleTransfer) shouldGenerateAccesslist = false
        //else if (remoteShardusAccount == null && appData.newCAAddr == null) shouldGenerateAccesslist = false //resolve which is correct from merge!
        else if (remoteTargetAccount == null && appData.newCAAddr == null) shouldGenerateAccesslist = false

        // dappFeature1enabled is our coin-transfer-only mode. Crack if it calls EVM
        const isCoinTransfer = isSimpleTransfer || (remoteTargetAccount == null && appData.newCAAddr == null)
        if(isCoinTransfer){
          appData.isCoinTransfer = true
        }
        if (shardusConfig.features.dappFeature1enabled && !isStakeRelatedTx && !isCoinTransfer) {
          nestedCountersInstance.countEvent('shardeum', 'precrack - coin-transfer-only')
          return {
            status: false,
            reason: `coin-transfer-only mode enabled. Only simple transfers are allowed.`,
          }
        }

        //also run access list generation if needed
        if (shouldGenerateAccesslist) {
          let success = true
          //early pass on balance check to avoid expensive access list generation.
          if (ShardeumFlags.txBalancePreCheck && appData != null) {
            let minBalance: bigint // Calculate the minimun balance with the transaction value added in
            if (ShardeumFlags.chargeConstantTxFee) {
              const minBalanceUsd = BigInt(ShardeumFlags.constantTxFeeUsd)
              minBalance =
                scaleByStabilityFactor(minBalanceUsd, AccountsStorage.cachedNetworkAccount) + transaction.value
            } else minBalance = transaction.getUpfrontCost() // tx.gasLimit * tx.gasPrice + tx.value
            const accountBalance = appData.balance
            if (accountBalance < minBalance) {
              success = false
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack balance fail: sender ${senderAddress.toString()} does not have enough balance. Min balance: ${minBalance.toString()}, Account balance: ${accountBalance.toString()}`)
              nestedCountersInstance.countEvent('shardeum', 'precrack - insufficient balance')
              return {
                status: false,
                reason: `Sender Insufficient Balance. Sender: ${senderAddress.toString()}, MinBalance: ${minBalance.toString()}, Account balance: ${accountBalance.toString()}, Difference: ${(
                  minBalance - accountBalance
                ).toString()}`,
              }
            } else {
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack balance pass: sender ${senderAddress.toString()} has balance of ${accountBalance.toString()}`)
            }
          }

          if (ShardeumFlags.txNoncePreCheck && appData != null) {
            const txNonce = parseInt(transaction.nonce.toString(16), 16)
            const perfectCount = appData.nonce + appData.queueCount
            const exactCount = appData.nonce

            if (ShardeumFlags.looseNonceCheck) {
              if (isWithinRange(txNonce, perfectCount, ShardeumFlags.nonceCheckRange)) {
                /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce pass: txNonce:${txNonce} is within +/- ${ShardeumFlags.nonceCheckRange} of perfect nonce ${perfectCount}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${transaction.hash().toString()} `)
              } else {
                success = false
                /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce fail: txNonce:${txNonce} is not within +/- ${ShardeumFlags.nonceCheckRange} of perfect nonce ${perfectCount}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${transaction.hash().toString()} `)
                if (appData.nonce === 0) nestedCountersInstance.countEvent('shardeum', 'precrack - nonce fail')
                return {
                  status: false,
                  reason: `TX Nonce ${txNonce} is not within +/- ${ShardeumFlags.nonceCheckRange} of perfect nonce ${perfectCount}`,
                }
              }
            } else {
              if (txNonce != perfectCount) {
                success = false
                /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack nonce fail: perfectCount:${perfectCount} != ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${transaction.hash().toString()} `)
                return {
                  status: false,
                  reason: `TX Nonce ${txNonce} is not equal to perfect nonce ${perfectCount}`,
                }
              }
            }

            // Exact nonce check
            if (ShardeumFlags.exactNonceCheck) {
              if (txNonce != exactCount) {
                nestedCountersInstance.countEvent('shardeum', 'precrack - exact nonce check fail')
                success = false
                /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`precrack exact nonce check fail: exactCount:${exactCount} != ${txNonce}. current nonce:${appData.nonce} txHash: ${transaction.hash().toString()} `)
                return {
                  status: false,
                  reason: `TX Nonce ${txNonce} is not equal to exact nonce ${exactCount}`,
                }
              }
            }
          }

          if (success === true) {
            const aalgStart = Date.now()
            profilerInstance.scopedProfileSectionStart('accesslist-generate')
            const {
              shardusMemoryPatterns,
              failedAccessList,
              accessList: generatedAccessList,
              codeHashes,
            } = await generateAccessList(tx, appData?.warmupList, 'txPrecrackData')
            profilerInstance.scopedProfileSectionEnd('accesslist-generate')

            console.log(
              `Accesslist Result for tx: ${ethTxId}`,
              generatedAccessList,
              shardusMemoryPatterns,
              codeHashes,
              failedAccessList
            )

            appData.accessList = generatedAccessList ? generatedAccessList : null
            appData.requestNewTimestamp = true
            appData.shardusMemoryPatterns = shardusMemoryPatterns
            appData.codeHashes = codeHashes
            if (failedAccessList) {
              return { status: false, reason: `Failed to generate access list ${Date.now() - aalgStart}` }
            }

            if (appData.accessList && appData.accessList.length > 0) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum', 'precrack' + ' -' + ' generateAccessList success: true')
            } else {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum', 'precrack' + ' -' + ' generateAccessList success: false')
              return { status: false, reason: `Failed to generate access list2 ${Date.now() - aalgStart}` }
            }
          }
        }

        // crack stake related info and attach to appData
        if (isStakeRelatedTx === true) {
          try {
            const networkAccountData: WrappedAccount = await shardus.getLocalOrRemoteAccount(networkAccount)
            appData.internalTx = getStakeTxBlobFromEVMTx(transaction)
            appData.internalTXType = appData.internalTx.internalTXType
            appData.networkAccount = networkAccountData.data
            if (appData.internalTx.stake) appData.internalTx.stake = BigInt(appData.internalTx.stake)
            const nominee = appData.internalTx.nominee
            const nodeAccount: WrappedAccount = await shardus.getLocalOrRemoteAccount(nominee)
            if (nodeAccount) appData.nomineeAccount = nodeAccount.data
            appData.nominatorAccount = remoteShardusAccount
          } catch (e) {
            /* prettier-ignore */ if (logFlags.error) console.log('Error: while doing preCrack for stake related tx', e)
          }
        }
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log( `txPreCrackData final result: txNonce: ${appData.txNonce}, currentNonce: ${ appData.nonce }, queueCount: ${appData.queueCount}, appData ${Utils.safeStringify(appData)}` )
      }
      return { status: true, reason: 'Passed' }
    },

    //@ts-ignore
    crack(timestampedTx, passedAppData) {
      const appData: any = filterObjectByWhitelistedProps(passedAppData, [
        {
          name: 'internalTx',
          type: 'object',
        },
        {
          name: 'internalTXType',
          type: 'number',
        },
        {
          name: 'networkAccount',
          type: 'object',
        },
        {
          name: 'nomineeAccount',
          type: 'object',
        },
        {
          name: 'nominatorAccount',
          type: 'object',
        },
        {
          name: 'shardusMemoryPatterns',
          type: 'object',
        },
        {
          name: 'codeHashes',
          type: 'object',
        },
        {
          name: 'accessList',
          type: 'object',
        },
        {
          name: 'newCAAddr',
          type: 'string',
        },
      ])

      if (ShardeumFlags.VerboseLogs) console.log('Running getKeyFromTransaction', timestampedTx)
      //@ts-ignore
      const { tx } = timestampedTx

      const timestamp: number = getInjectedOrGeneratedTimestamp(timestampedTx)

      if (isInternalTx(tx)) {
        const customTXhash = null
        const internalTx = tx as InternalTx
        const keys = {
          sourceKeys: [],
          targetKeys: [],
          storageKeys: [],
          allKeys: [],
          timestamp: timestamp,
        }
        if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
          keys.sourceKeys = [internalTx.from]
        } else if (internalTx.internalTXType === InternalTXType.InitNetwork) {
          keys.targetKeys = [networkAccount]
        } else if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
          keys.sourceKeys = [tx.from]
          keys.targetKeys = [networkAccount]
        } else if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
          keys.targetKeys = [networkAccount]
        } else if (internalTx.internalTXType === InternalTXType.ChangeNetworkParam) {
          keys.sourceKeys = [tx.from]
          keys.targetKeys = [networkAccount]
        } else if (internalTx.internalTXType === InternalTXType.ApplyNetworkParam) {
          keys.targetKeys = [networkAccount]
        } else if (isSetCertTimeTx(internalTx)) {
          keys.sourceKeys = [tx.nominee]
          keys.targetKeys = [toShardusAddress(tx.nominator, AccountType.Account), networkAccount]
        } else if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
          keys.sourceKeys = [tx.nominee]
          keys.targetKeys = [networkAccount]

          // //force all TXs for the same reward to have the same hash
          // let tempTimestamp = tx.timestamp
          // tx.timestamp = tx.nodeActivatedTime
          // customTXhash = crypto.hashObj(tx, true)
          // //restore timestamp?
          // tx.timestamp = tempTimestamp

          // let tempTimestamp = tx.timestamp
          // delete tx.timestamp
          // customTXhash = crypto.hashObj(tx, true)
          // tx.timestamp = tempTimestamp

          //this was the best one so far
          // let now = shardeumGetTime()
          // //calculate a time closes to now but rounded to 3 seconds
          // let roundedNow = Math.round(now / 3000) * 3000
          // tx.timestamp = roundedNow
          // customTXhash = hashSignedObj(tx)
        } else if (internalTx.internalTXType === InternalTXType.ClaimReward) {
          keys.sourceKeys = [tx.nominee]
          keys.targetKeys = [toShardusAddress(tx.nominator, AccountType.Account), networkAccount]

          // //force all TXs for the same reward to have the same hash
          // let tempTimestamp = tx.timestamp
          // tx.timestamp = tx.nodeActivatedTime
          // customTXhash = crypto.hashObj(tx, true)
          // //restore timestamp?
          // tx.timestamp = tempTimestamp

          // let tempTimestamp = tx.timestamp
          // delete tx.timestamp
          // customTXhash = crypto.hashObj(tx, true)
          // tx.timestamp = tempTimestamp

          //walk the timestamp close to our window for injecting??

          //this was the best one so far
          // let now = shardeumGetTime()
          // //calculate a time closes to now but rounded to 3 seconds
          // let roundedNow = Math.round(now / 3000) * 3000
          // tx.timestamp = roundedNow
          // customTXhash = crypto.hashObj(tx, true)
        } else if (internalTx.internalTXType === InternalTXType.Penalty) {
          keys.sourceKeys = [tx.reportedNodePublickKey]
          keys.targetKeys = [toShardusAddress(tx.operatorEVMAddress, AccountType.Account), networkAccount]
        } else if (internalTx.internalTXType === InternalTXType.TransferFromSecureAccount) {
          const { sourceKeys, targetKeys } = crackTransferFromSecureAccount(tx)
          keys.sourceKeys = sourceKeys
          keys.targetKeys = targetKeys
        }
        keys.allKeys = keys.allKeys.concat(keys.sourceKeys, keys.targetKeys, keys.storageKeys)
        // temporary hack for creating a receipt of node reward tx
        // if (internalTx.internalTXType === InternalTXType.NodeReward) {
        //   if (ShardeumFlags.EVMReceiptsAsAccounts) {
        //     const txId = crypto.hashObj(tx)
        //     keys.allKeys = keys.allKeys.concat([txId]) // For Node Reward Receipt
        //   }
        // }

        const txId = generateTxId(tx)
        if (ShardeumFlags.VerboseLogs) console.log('crack', { timestamp, keys, id: txId })
        return {
          timestamp,
          keys,
          id: customTXhash ?? txId,
          shardusMemoryPatterns: null,
        }
      }
      if (isDebugTx(tx)) {
        if (!ShardeumFlags.debugTxEnabled) {
          throw new Error(`Unable to crack debug transaction. Debug tx are disabled ${Utils.safeStringify(tx)}`)
        }
        const debugTx = tx as DebugTx
        const txId = generateTxId(tx)
        const keys = {
          sourceKeys: [],
          targetKeys: [],
          storageKeys: [],
          allKeys: [],
          timestamp: timestamp,
        }

        const transformedSourceKey = toShardusAddress(debugTx.from, AccountType.Debug)
        const transformedTargetKey = debugTx.to ? toShardusAddress(debugTx.to, AccountType.Debug) : ''
        keys.sourceKeys.push(transformedSourceKey)
        shardusAddressToEVMAccountInfo.set(transformedSourceKey, {
          evmAddress: debugTx.from,
          type: AccountType.Debug,
        })
        if (debugTx.to) {
          keys.targetKeys.push(transformedTargetKey)
          shardusAddressToEVMAccountInfo.set(transformedTargetKey, {
            evmAddress: debugTx.to,
            type: AccountType.Debug,
          })
        }

        keys.allKeys = keys.allKeys.concat(keys.sourceKeys, keys.targetKeys, keys.storageKeys)
        return {
          timestamp,
          keys,
          id: txId,
          shardusMemoryPatterns: null,
        }
      }
      // isDaoTX() { get addresses and return }

      // it is an EVM transaction
      const rawSerializedTx = tx.raw
      if (rawSerializedTx == null) {
        throw new Error(`Unable to crack EVM transaction. ${Utils.safeStringify(tx)}`)
      }
      const txId = generateTxId(tx)

      const transaction = getTransactionObj(tx)
      const senderAddress = getTxSenderAddress(transaction, txId).address
      const shardusMemoryPatterns = appData.shardusMemoryPatterns || null
      const result = {
        sourceKeys: [],
        targetKeys: [],
        storageKeys: [],
        codeHashKeys: [],
        allKeys: [],
        timestamp: timestamp,
      }
      try {
        const otherAccountKeys = []
        const txSenderEvmAddr = senderAddress.toString()
        const txToEvmAddr = transaction.to ? transaction.to.toString() : undefined
        const transformedSourceKey = toShardusAddress(txSenderEvmAddr, AccountType.Account)
        const transformedTargetKey = transaction.to ? toShardusAddress(txToEvmAddr, AccountType.Account) : ''

        result.sourceKeys.push(transformedSourceKey)
        shardusAddressToEVMAccountInfo.set(transformedSourceKey, {
          evmAddress: txSenderEvmAddr,
          type: AccountType.Account,
        })

        // add nominee (NodeAcc) to targetKeys
        if (
          appData.internalTx &&
          (appData.internalTXType === InternalTXType.Stake || appData.internalTXType === InternalTXType.Unstake)
        ) {
          appData.internalTx = getStakeTxBlobFromEVMTx(transaction)
          if (appData.internalTx.stake) appData.internalTx.stake = BigInt(appData.internalTx.stake)
          const transformedTargetKey = appData.internalTx.nominee // no need to convert to shardus address
          result.targetKeys.push(transformedTargetKey)
          result.sourceKeys.push(networkAccount)
        }

        if (transaction.to && transaction.to.toString() !== ShardeumFlags.stakeTargetAddress) {
          result.targetKeys.push(transformedTargetKey)
          shardusAddressToEVMAccountInfo.set(transformedTargetKey, {
            evmAddress: txToEvmAddr,
            type: AccountType.Account,
          })
        } else {
          if (ShardeumFlags.UseTXPreCrack === false) {
            //This is a contract create!!
            //only will work with first deploy, since we do not have a way to get nonce that works with sharding
            const hack0Nonce = BigInt(0)
            const caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, hack0Nonce)
            const caAddr = '0x' + caAddrBuf.toString('hex')
            const shardusAddr = toShardusAddress(caAddr, AccountType.Account)
            otherAccountKeys.push(shardusAddr)
            shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Predicting new contract account address:', caAddr, shardusAddr)
          } else {
            //use app data!
            if (appData && appData.newCAAddr) {
              const caAddr = appData.newCAAddr
              const shardusAddr = toShardusAddress(caAddr, AccountType.Account)
              otherAccountKeys.push(shardusAddr)
              shardusAddressToEVMAccountInfo.set(shardusAddr, {
                evmAddress: caAddr,
                type: AccountType.Account,
              })
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Appdata provided new contract account address:', caAddr, shardusAddr)
            }
          }
        }

        /***
         DO NOT REMOVE - BEGIN
         ***/
        // Note: The below code is being removed because usage of appData properties should only be used for staking
        //       data at this time. Also, for security reasons, only appData properties internalTx, internalTxType,
        //       networkAccount, monimeeAccount, and nominatorAccount should be used in this function.
        // if (transaction instanceof AccessListEIP2930Transaction && transaction.AccessListJSON != null) {
        //   for (const accessList of transaction.AccessListJSON) {
        //     const address = accessList.address
        //     if (address) {
        //       const shardusAddr = toShardusAddress(address, AccountType.Account)
        //       shardusAddressToEVMAccountInfo.set(shardusAddr, {
        //         evmAddress: address,
        //         type: AccountType.Account,
        //       })
        //       otherAccountKeys.push(shardusAddr)
        //
        //       //TODO: we need some new logic that can check each account to try loading each CA "early"
        //       //and figure so we will at least know the code hash to load
        //       //probably should also do some work with memory access patterns too.
        //     }
        //     //let storageKeys = accessList.storageKeys.map(key => toShardusAddress(key, AccountType.ContractStorage))
        //     const storageKeys = []
        //     for (const storageKey of accessList.storageKeys) {
        //       //let shardusAddr = toShardusAddress(storageKey, AccountType.ContractStorage)
        //       const shardusAddr = toShardusAddressWithKey(address, storageKey, AccountType.ContractStorage)
        //
        //       shardusAddressToEVMAccountInfo.set(shardusAddr, {
        //         evmAddress: shardusAddr,
        //         contractAddress: address,
        //         type: AccountType.ContractStorage,
        //       })
        //       storageKeys.push(shardusAddr)
        //     }
        //     result.storageKeys = result.storageKeys.concat(storageKeys)
        //   }
        // } else {
        //   if (ShardeumFlags.autoGenerateAccessList && appData.accessList) {
        //     shardusMemoryPatterns = appData.shardusMemoryPatterns
        //     // we have pre-generated accessList
        //     for (const accessListItem of appData.accessList) {
        //       const address = accessListItem[0]
        //       if (address) {
        //         const shardusAddr = toShardusAddress(address, AccountType.Account)
        //         shardusAddressToEVMAccountInfo.set(shardusAddr, {
        //           evmAddress: address,
        //           type: AccountType.Account,
        //         })
        //         otherAccountKeys.push(shardusAddr)
        //       }
        //       //let storageKeys = accessListItem.storageKeys.map(key => toShardusAddress(key, AccountType.ContractStorage))
        //       const storageKeys = []
        //       for (const storageKey of accessListItem[1]) {
        //         //let shardusAddr = toShardusAddress(storageKey, AccountType.ContractStorage)
        //         const shardusAddr = toShardusAddressWithKey(address, storageKey, AccountType.ContractStorage)
        //
        //         shardusAddressToEVMAccountInfo.set(shardusAddr, {
        //           evmAddress: storageKey,
        //           contractAddress: address,
        //           type: AccountType.ContractStorage,
        //         })
        //         storageKeys.push(shardusAddr)
        //       }
        //       result.storageKeys = result.storageKeys.concat(storageKeys)
        //     }
        //   }
        // }
        /***
         DO NOT REMOVE - END
         ***/

        //set keys for code hashes if we have them on app data
        if (appData.codeHashes != null && appData.codeHashes.length > 0) {
          //setting this may be useless seems like we never needed to do anything with codebytes in
          //getRelevantData before
          for (const codeHashObj of appData.codeHashes) {
            const shardusAddr = toShardusAddressWithKey(
              codeHashObj.contractAddress,
              codeHashObj.codeHash,
              AccountType.ContractCode
            )
            result.codeHashKeys.push(shardusAddr)
            shardusAddressToEVMAccountInfo.set(shardusAddr, {
              evmAddress: codeHashObj.codeHash,
              contractAddress: codeHashObj.contractAddress,
              type: AccountType.ContractCode,
            })
          }
        }

        // make sure the receipt address is in the get keys from transaction..
        // This will technically cause an empty account to get created but this will get overriden with the
        // correct values as a result of apply().  There are several ways we could optimize this in the future
        // If a transactions knows a key is for an account that will be created than it does not need to attempt to aquire and share the data
        const additionalAccounts = []
        if (ShardeumFlags.EVMReceiptsAsAccounts) {
          const txHash = bytesToHex(transaction.hash())
          const shardusReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`getKeyFromTransaction: adding tx receipt key: ${shardusReceiptAddress} ts:${(tx as any).timestamp}`)
          additionalAccounts.push(shardusReceiptAddress)
        }

        // insert target keys first. first key in allkeys list will define the execution shard
        // for smart contract calls the contract will be the target.  For simple coin transfers it wont matter
        // insert otherAccountKeys second, because we need the CA addres at the front of the list for contract deploy
        // There wont be a target key in when we deploy a contract

        // update: looks like POQ-LS work switched source key to be first, and thus the execution group
        // center.
        // TODO ARCH-6.  as mentioned in other post we should move to an explicit key for picking the execution group
        result.allKeys = result.allKeys.concat(
          result.sourceKeys,
          result.targetKeys,
          otherAccountKeys,
          result.storageKeys,
          additionalAccounts,
          result.codeHashKeys
        )
        if (ShardeumFlags.VerboseLogs) console.log('running getKeyFromTransaction', txId, result)
      } catch (e) {
        if (ShardeumFlags.VerboseLogs) console.log('getKeyFromTransaction: Unable to get keys from tx', e)
      }
      return {
        keys: result,
        timestamp,
        id: txId,
        shardusMemoryPatterns,
      }
    },
    
}