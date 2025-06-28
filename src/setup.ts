import { txFunctions } from './transaction'
import { joinFunctions } from './join'
import { validateTransaction } from './setup/validateTransaction'
import { validateTxnFields } from './setup/validateTxnFields'
import { sync } from './setup/sync'
import { isDestLimitTx, isInternalTx, isDebugTx } from './setup/helpers'
import { ShardeumFlags } from './shardeum/shardeumFlags'
import { 
  shardus,
  evmCommon,
  debugAppdata,
  logFlags,
  generateTxId,
  createNetworkAccount,
  getTransactionObj,
  isStakingEVMTx,
  getApplyTXState,
  createAccount,
  createNodeAccount2,
  toShardusAddress,
  toShardusAddressWithKey,
  bytesToHex,
  hexToBytes,
  Address,
  shardusAddressToEVMAccountInfo,
  shardeumStateTXMap,
  deleteApplyTXState,
  networkAccount,
  shardeumGetTime,
  _base16BNParser,
  scaleByStabilityFactor,
  fixBigIntLiteralsToBigInt,
  meetsMinimumVersion,
  isWithinMaximumVersion,
  isLowStake,
  isNodeAccount2,
  VersionValidationResult,
  verifyMultiSigs,
  verifyPayload,
  getTxSenderAddress,
  fetchNetworkAccountFromArchiver,
  appStartupTimestamp,
  InjectTxToConsensor,
  _transactionReceiptPass,
  config,
  nestedCountersInstance,
  formatErrorMessage,
  shardusConfig,
  getNetworkAccount,
  isServiceMode,
  version,
  operatorCLIVersion,
  operatorGUIVersion
} from './index'
import { ONE_SECOND } from './shardeum/shardeumConstants'
import * as AccountsStorage from './storage/accountStorage'
import * as WrappedEVMAccountFunctions from './shardeum/wrappedEVMAccountFunctions'
import { fixDeserializedWrappedEVMAccount } from './shardeum/wrappedEVMAccountFunctions'
import { getAccountShardusAddress } from './shardeum/evmAddress'
import { Utils } from '@shardeum-foundation/lib-types'
import { isSetCertTimeTx } from './tx/setCertTime'
import { ShardusTypes, DebugComplete, Shardus } from '@shardeum-foundation/core'
import {
  AccountType,
  InternalTXType,
  InternalTx,
  NetworkAccount,
  WrappedEVMAccount,
  NodeAccount2,
  StakeCoinsTX,
  DebugTx,
  DebugTXType,
  NodeInitTxData,
  NodeRewardTxData,
  LeftNetworkEarlyViolationData,
  SyncingTimeoutViolationData,
  NodeRefutedViolationData,
  WrappedAccount,
  SecureAccount,
  OperatorAccountInfo,
  NodeInfoAppData,
} from './shardeum/shardeumTypes'
import { StakeCert, RemoveNodeCert } from './handlers/queryCertificate'
import { shardusTxIdToEthTxId, appliedTxs } from './index'
import { accountSerializer, accountDeserializer } from './types/Helpers'
import * as InitRewardTimesTx from './tx/initRewardTimes'
import * as PenaltyTx from './tx/penalty/transaction'
import { injectClaimRewardTx } from './tx/claimReward'
import { safeStringify } from '@shardeum-foundation/lib-types/build/src/utils/functions/stringify'
import { AJVSchemaEnum } from './types/enum/AJVSchemaEnum'
import { DevSecurityLevel, Sign, OpaqueTransaction } from '@shardeum-foundation/core/dist/shardus/shardus-types'
import { getCachedRIAccount, setCachedRIAccount } from './storage/riAccountsCache'
import { AccountsEntry } from './storage/storage'
import { sleep } from './utils'
import { onActiveVersionChange } from './versioning'

// Re-export for index.ts imports
export { sync, validateTransaction, validateTxnFields }

export const setupConfig = {
    sync: null as any, // Will be initialized in shardusSetup()
    //validateTransaction is not a standard sharus function.  When we cleanup index.ts we need to move it out of here
    //also appdata and wrapped accounts should be passed in?
    validateTransaction: null as any, // Will be initialized in shardusSetup()
    validateTxnFields: null as any, // Will be initialized in shardusSetup()
    isDestLimitTx,
    isInternalTx,
    validate(timestampedTx: ShardusTypes.OpaqueTransaction, appData): {success: boolean, reason: string, status: number} {
      // TODO: Implement proper validation - for now return valid
      return { success: true, reason: '', status: 0 }
    },
    isMultiSigFoundationTx(tx: ShardusTypes.OpaqueTransaction): boolean {
      // TODO: Implement if needed
      return false
    },
    async resetAccountData() {
      // Reset logic here if needed
    },
    getTimestampFromTransaction(tx, appData) {
      if (ShardeumFlags.VerboseLogs) console.log('Running getTimestampFromTransaction', tx, appData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (appData && (appData as any).requestNewTimestamp) {
        if (ShardeumFlags.VerboseLogs) console.log('Requesting new timestamp', appData)
        return -1
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else return Object.prototype.hasOwnProperty.call(tx, 'timestamp') ? (tx as any).timestamp : 0
    },
    calculateTxId(tx: ShardusTypes.OpaqueTransaction) {
      return generateTxId(tx)
    },

    //TODO: looks like this is never used in shardus now!, consider if we can axe it
    async getStateId(accountAddress) {
      // let wrappedEVMAccount = accounts[accountAddress]
      // return WrappedEVMAccountFunctions._calculateAccountHash(wrappedEVMAccount)

      //TODO consider if this can be table lookup rather than a recalculation
      const wrappedEVMAccount = await AccountsStorage.getAccount(accountAddress)

      //looks like this wont change much as this is an unused function
      fixDeserializedWrappedEVMAccount(wrappedEVMAccount)

      return WrappedEVMAccountFunctions._calculateAccountHash(wrappedEVMAccount)
    },

    async deleteLocalAccountData() {
      //accounts = {}
      if (!isServiceMode()) await AccountsStorage.clearAccounts()
    },

    async setAccountData(accountRecords) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Running setAccountData`, accountRecords)
      // update our in memory accounts map
      for (const account of accountRecords) {
        const wrappedEVMAccount = account as WrappedEVMAccount

        const shardusAddress = getAccountShardusAddress(wrappedEVMAccount)

        if (
          wrappedEVMAccount.accountType !== AccountType.NetworkAccount &&
          wrappedEVMAccount.accountType !== AccountType.NodeAccount &&
          wrappedEVMAccount.accountType !== AccountType.NodeAccount2 &&
          wrappedEVMAccount.accountType !== AccountType.SecureAccount &&
          wrappedEVMAccount.accountType !== AccountType.NodeRewardReceipt &&
          wrappedEVMAccount.accountType !== AccountType.DevAccount
        )
          WrappedEVMAccountFunctions.fixDeserializedWrappedEVMAccount(wrappedEVMAccount)

        //accounts[shardusAddress] = wrappedEVMAccount
        shardus.setDebugSetLastAppAwait(`setAccountData.setAccount(${shardusAddress})`)
        await AccountsStorage.setAccount(shardusAddress, wrappedEVMAccount)
        shardus.setDebugSetLastAppAwait(`setAccountData.setAccount(${shardusAddress})`, DebugComplete.Completed)
      }
    },
    async getRelevantData(accountId, timestampedTx, appData) {
      if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', accountId, timestampedTx, appData)
      //@ts-ignore
      const { tx } = timestampedTx

      if (isInternalTx(tx)) {
        const internalTx = tx as InternalTx

        let accountCreated = false
        //let wrappedEVMAccount = accounts[accountId]
        shardus.setDebugSetLastAppAwait('getRelevantData.AccountsStorage.getAccount 4')
        let wrappedEVMAccount: NetworkAccount | WrappedEVMAccount = await AccountsStorage.getAccount(accountId)
        shardus.setDebugSetLastAppAwait('getRelevantData.AccountsStorage.getAccount 4', DebugComplete.Completed)
        if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
          if (wrappedEVMAccount == null) {
            accountCreated = true
          }
          if (internalTx.accountData) {
            wrappedEVMAccount = internalTx.accountData
          }
        }
        if (internalTx.internalTXType === InternalTXType.InitNetwork) {
          if (!wrappedEVMAccount) {
            if (accountId === networkAccount) {
              wrappedEVMAccount = await createNetworkAccount(accountId, config, shardus.p2p.isFirstSeed)
            } else {
              //wrappedEVMAccount = createNodeAccount(accountId) as any
            }
            accountCreated = true
          } else {
            throw Error(`Dev Account already exists`)
          }
        }
        if (
          internalTx.internalTXType === InternalTXType.ChangeConfig ||
          internalTx.internalTXType === InternalTXType.ChangeNetworkParam
        ) {
          // Not sure if this is even relevant.  I think the from account should be one of our dev accounts and
          // and should already exist (hit the faucet)
          // probably an array of dev public keys

          if (!wrappedEVMAccount) {
            // This is the 0000x00000 account
            if (accountId === networkAccount) {
              throw Error(`Network Account is not allowed to sign this ${accountId}`)
            } else if (shardus.getDevPublicKey(accountId)) {
              wrappedEVMAccount = await createNetworkAccount(accountId, config, shardus.p2p.isFirstSeed)
              accountCreated = true
            }
            // I think we don't need it now, the dev Key is checked on the validateTxnFields
            // else {
            //   //If the id is not the network account then it must be our dev user account.
            //   // we shouldn't try to create that either.
            //   // Dev account is a developers public key on a test account they control
            //   throw Error(`Dev Account is not found ${accountId}`)
            //   // wrappedEVMAccount = createNodeAccount(accountId) as any
            //   // accountCreated = true
            // }
          }
        }
        if (
          internalTx.internalTXType === InternalTXType.ApplyChangeConfig ||
          internalTx.internalTXType === InternalTXType.ApplyNetworkParam
        ) {
          if (!wrappedEVMAccount) {
            throw Error(`Network Account is not found ${accountId}`)
          }
        }
        if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
          if (!wrappedEVMAccount) {
            // Node Account has to be already created at this point.
            if (accountId === internalTx.nominee) {
              throw Error(`Node Account <nominee> is not found ${accountId}`)
            }
          }
        }
        if (internalTx.internalTXType === InternalTXType.ClaimReward) {
          if (!wrappedEVMAccount) {
            // Node Account has to be already created at this point.
            if (accountId === internalTx.nominee) {
              throw Error(`Node Account <nominee> is not found ${accountId}`)
            }
          }
        }
        if (isSetCertTimeTx(internalTx)) {
          if (!wrappedEVMAccount) {
            // Node Account or EVM Account(Nominator) has to be already created at this point.
            if (accountId === internalTx.nominee) {
              throw Error(`Node Account <nominee> is not found ${accountId}, tx: ${Utils.safeStringify(internalTx)}`)
            } else if (accountId === internalTx.nominator) {
              throw Error(`EVM Account <nominator> is not found ${accountId}`)
            }
          }
        }
        if (!wrappedEVMAccount) {
          throw Error(`Account not found ${accountId}`)
        }
        if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', wrappedEVMAccount)
        return shardus.createWrappedResponse(
          accountId,
          accountCreated,
          wrappedEVMAccount.hash,
          wrappedEVMAccount.timestamp,
          wrappedEVMAccount
        )
      }
      if (isDebugTx(tx)) {
        if (!ShardeumFlags.debugTxEnabled) {
          throw new Error(`Unable to get relevant data. Debug tx are disabled ${Utils.safeStringify(tx)}`)
        }
        let accountCreated = false
        //let wrappedEVMAccount = accounts[accountId]
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 1`)
        let wrappedEVMAccount = await AccountsStorage.getAccount(accountId)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 1`, DebugComplete.Completed)
        if (wrappedEVMAccount == null) {
          const evmAccountInfo = shardusAddressToEVMAccountInfo.get(accountId)
          let evmAccountID = null
          if (evmAccountInfo != null) {
            evmAccountID = evmAccountInfo.evmAddress
          }

          wrappedEVMAccount = {
            timestamp: 0,
            balance: 100,
            ethAddress: evmAccountID,
            hash: '',
            accountType: AccountType.Debug, //see above, it may be wrong to assume this type in the future
          } as WrappedEVMAccount
          WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
          //accounts[accountId] = wrappedEVMAccount  //getRelevantData must never modify accounts[]
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Created new debug account', wrappedEVMAccount)
          accountCreated = true
        }

        return shardus.createWrappedResponse(
          accountId,
          accountCreated,
          wrappedEVMAccount.hash,
          wrappedEVMAccount.timestamp,
          wrappedEVMAccount
        )
      }

      if (!Object.prototype.hasOwnProperty.call(tx, 'raw')) throw new Error('getRelevantData: No raw tx')

      // todo: create new accounts for staking

      // check if it a stake tx
      const transaction = getTransactionObj(tx)
      const isStakeRelatedTx: boolean = isStakingEVMTx(transaction)

      if (isStakeRelatedTx) {
        nestedCountersInstance.countEvent('shardeum-staking', 'getRelevantData: isStakeRelatedTx === true')
        const stakeTxBlob: StakeCoinsTX = appData.internalTx
        const txHash = bytesToHex(transaction.hash())

        let accountCreated = false
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 2`)
        const wrappedEVMAccount = await AccountsStorage.getAccount(accountId)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 2`, DebugComplete.Completed)
        if (appData.internalTXType === InternalTXType.Stake) {
          nestedCountersInstance.countEvent('shardeum-staking', 'internalTXType === Stake')
          if (!wrappedEVMAccount) {
            const stakeReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.StakeReceipt)

            // if it is nominee and a stake tx, create 'NodeAccount' if it doesn't exist
            if (accountId === stakeTxBlob.nominee) {
              const nodeAccount: NodeAccount2 = createNodeAccount2(accountId)
              accountCreated = true
              nestedCountersInstance.countEvent('shardeum-staking', 'created new node account')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Created new node account', nodeAccount)
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData for stake/unstake tx', nodeAccount)
              return shardus.createWrappedResponse(
                accountId,
                accountCreated,
                nodeAccount.hash,
                nodeAccount.timestamp,
                nodeAccount
              )
            } else if (stakeReceiptAddress === accountId) {
              const stakeReceipt = {
                timestamp: 0,
                ethAddress: stakeReceiptAddress,
                hash: '',
                accountType: AccountType.StakeReceipt,
              }
              accountCreated = true
              WrappedEVMAccountFunctions.updateEthAccountHash(stakeReceipt)
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData for stake/unstake tx', stakeReceipt)
              return shardus.createWrappedResponse(
                accountId,
                accountCreated,
                stakeReceipt.hash,
                stakeReceipt.timestamp,
                stakeReceipt
              )
            }
          }
        } else if (appData.internalTXType === InternalTXType.Unstake) {
          if (!wrappedEVMAccount) {
            const unStakeReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.UnstakeReceipt)
            if (accountId === stakeTxBlob.nominee) {
              nestedCountersInstance.countEvent('shardeum-staking', 'node account nominee not found')
              throw new Error(`Node Account <nominee> is not found ${accountId}`)
            } else if (unStakeReceiptAddress === accountId) {
              const unstakeReceipt = {
                timestamp: 0,
                ethAddress: unStakeReceiptAddress,
                hash: '',
                accountType: AccountType.UnstakeReceipt,
              }
              accountCreated = true
              WrappedEVMAccountFunctions.updateEthAccountHash(unstakeReceipt)
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData for stake/unstake tx', unstakeReceipt)
              return shardus.createWrappedResponse(
                accountId,
                accountCreated,
                unstakeReceipt.hash,
                unstakeReceipt.timestamp,
                unstakeReceipt
              )
            }
          }
        }
      }

      //let wrappedEVMAccount = accounts[accountId]
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 3`)
      let wrappedEVMAccount = await AccountsStorage.getAccount(accountId)
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.AccountsStorage.getAccount(${accountId}) 3`, DebugComplete.Completed)
      let accountCreated = false

      const txId = generateTxId(tx)
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

      const shardeumState = getApplyTXState(txId)

      // Create the account if it doesn't exist
      if (typeof wrappedEVMAccount === 'undefined' || wrappedEVMAccount == null) {
        // oops! this is a problem..  maybe we should not have a fromShardusAddress
        // when we support sharding I dont think we can assume this is an AccountType.Account
        // the TX is specified at least so it might require digging into that to check if something matches the from/to field,
        // or perhaps a storage key in an access list..
        //let evmAccountID = fromShardusAddress(accountId, AccountType.Account) // accountId is a shardus address

        //need a recent map shardus ID to account type and eth address
        //EIP 2930 needs to write to this map as hints

        //codeHashKeys

        const evmAccountInfo = shardusAddressToEVMAccountInfo.get(accountId)
        let evmAccountID = null
        let accountType = AccountType.Account //assume account ok?
        if (evmAccountInfo != null) {
          evmAccountID = evmAccountInfo.evmAddress
          accountType = evmAccountInfo.type
        }

        const transaction = getTransactionObj(tx)
        const txHash = bytesToHex(transaction.hash())
        const shardusReceiptAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
        if (shardusReceiptAddress === accountId) {
          wrappedEVMAccount = {
            timestamp: 0,
            ethAddress: shardusReceiptAddress,
            hash: '',
            accountType: AccountType.Receipt,
          }
          //this is needed, but also kind of a waste.  Would be nice if shardus could be told to ignore creating certain accounts
        } else if (accountType === AccountType.Account) {
          //some of this feels a bit redundant, will need to think more on the cleanup
          /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.createAccount(${evmAccountID})`)
          await createAccount(evmAccountID, shardeumState)
          /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.createAccount(${evmAccountID})`, DebugComplete.Completed)

          const address = Address.fromString(evmAccountID)
          /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.shardeumState.getAccount(${evmAccountID})`)
          const account = await shardeumState.getAccount(address)
          /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getRelevantData.shardeumState.getAccount(${evmAccountID})`, DebugComplete.Completed)
          wrappedEVMAccount = {
            timestamp: 0,
            account,
            ethAddress: evmAccountID,
            hash: '',
            accountType: AccountType.Account, //see above, it may be wrong to assume this type in the future
          }

          // attach OperatorAccountInfo if it is a staking tx
          if (isStakeRelatedTx) {
            const stakeCoinsTx: StakeCoinsTX = appData.internalTx
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Adding operator account info to wrappedEVMAccount', evmAccountID, stakeCoinsTx.nominator)
            if (evmAccountID === stakeCoinsTx.nominator) {
              wrappedEVMAccount.operatorAccountInfo = {
                stake: BigInt(0),
                nominee: '',
                certExp: 0,
                lastStakeTimestamp: 0,
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
            }
          }
        } else if (accountType === AccountType.ContractStorage) {
          wrappedEVMAccount = {
            timestamp: 0,
            key: evmAccountID,
            value: Buffer.from([]),
            ethAddress: evmAccountInfo.contractAddress, // storage key
            hash: '',
            accountType: AccountType.ContractStorage,
          }
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Creating new contract storage account key:${evmAccountID} in contract address ${wrappedEVMAccount.ethAddress}`)
        } else if (accountType === AccountType.ContractCode) {
          wrappedEVMAccount = {
            timestamp: 0,
            codeHash: hexToBytes('0x' + evmAccountInfo.evmAddress),
            codeByte: Buffer.from([]),
            ethAddress: evmAccountInfo.evmAddress, // storage key
            contractAddress: evmAccountInfo.contractAddress, // storage key
            hash: '',
            accountType: AccountType.ContractCode,
          }
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Creating new contract bytes account key:${evmAccountID} in contract address ${wrappedEVMAccount.ethAddress}`)
        } else {
          throw new Error(`getRelevantData: invalid account type ${accountType}`)
        }
        WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)
        // accounts[accountId] = wrappedEVMAccount //getRelevantData must never modify accounts[]
        accountCreated = true
      }
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData final result for EOA', wrappedEVMAccount)
      // Wrap it for Shardus
      return shardus.createWrappedResponse(
        accountId,
        accountCreated,
        wrappedEVMAccount.hash,
        wrappedEVMAccount.timestamp,
        wrappedEVMAccount
      ) //readableAccount)
    },
    async getAccountData(accountStart, accountEnd, maxRecords): Promise<ShardusTypes.WrappedData[]> {
      const results = []
      const start = parseInt(accountStart, 16)
      const end = parseInt(accountEnd, 16)

      if (ShardeumFlags.UseDBForAccounts === true) {
        //direct DB query
        const wrappedResults = []
        const dbResults = await AccountsStorage.queryAccountsEntryByRanges(accountStart, accountEnd, maxRecords)

        for (const wrappedEVMAccount of dbResults) {
          const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          wrappedResults.push(wrapped)
        }
        return wrappedResults
      }

      const accounts = AccountsStorage.accounts

      // Loop all accounts
      for (const addressStr in accounts) {
        const wrappedEVMAccount = accounts[addressStr] // eslint-disable-line security/detect-object-injection
        // Skip if not in account id range
        const id = parseInt(addressStr, 16)
        if (id < start || id > end) continue

        // Add to results (wrapping is redundant?)
        const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        results.push(wrapped)

        // Return results early if maxRecords reached
        if (results.length >= maxRecords) return results
      }
      return results
    },
    async updateAccountFull(wrappedData, localCache, applyResponse: ShardusTypes.ApplyResponse) {
      const accountId = wrappedData.accountId
      const accountCreated = wrappedData.accountCreated
      const updatedEVMAccount: WrappedEVMAccount = wrappedData.data as WrappedEVMAccount
      const prevStateId = wrappedData.prevStateId

      if (ShardeumFlags.VerboseLogs) console.log('updatedEVMAccount before hashUpdate', updatedEVMAccount)

      // oof, we dont have the TXID!!!
      const txId = applyResponse?.txId
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
      //   //TODO possibly need a blob to re-init with?
      // }

      let shardeumState
      if (
        updatedEVMAccount.accountType !== AccountType.Debug &&
        updatedEVMAccount.accountType !== AccountType.NetworkAccount &&
        updatedEVMAccount.accountType !== AccountType.NodeAccount &&
        updatedEVMAccount.accountType !== AccountType.NodeAccount2 &&
        updatedEVMAccount.accountType !== AccountType.SecureAccount &&
        updatedEVMAccount.accountType !== AccountType.NodeRewardReceipt &&
        updatedEVMAccount.accountType !== AccountType.DevAccount
      ) {
        //fix any issues from seralization
        fixDeserializedWrappedEVMAccount(updatedEVMAccount)
        shardeumState = getApplyTXState(txId)
      }

      if (updatedEVMAccount.accountType === AccountType.Account) {
        //if account?
        const addressStr = updatedEVMAccount.ethAddress
        const ethAccount = updatedEVMAccount.account
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitAccount(${addressStr})`)
        await shardeumState._transactionState.commitAccount(addressStr, ethAccount) //yikes this wants an await.
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitAccount(${addressStr})`, DebugComplete.Completed)
      } else if (updatedEVMAccount.accountType === AccountType.ContractStorage) {
        //if ContractAccount?
        const addressStr = updatedEVMAccount.ethAddress
        const key = updatedEVMAccount.key
        const bufferValue = updatedEVMAccount.value
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitContractStorage(${addressStr})`)
        await shardeumState._transactionState.commitContractStorage(addressStr, key, bufferValue)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitContractStorage(${addressStr})`, DebugComplete.Completed)
      } else if (updatedEVMAccount.accountType === AccountType.ContractCode) {
        const contractAddress = updatedEVMAccount.contractAddress
        const codeHash = updatedEVMAccount.codeHash
        const codeByte = updatedEVMAccount.codeByte
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitContractBytes(${contractAddress})`)
        await shardeumState._transactionState.commitContractBytes(contractAddress, codeHash, codeByte)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`shardeumState._transactionState.commitContractBytes(${contractAddress})`, DebugComplete.Completed)
      } else if (updatedEVMAccount.accountType === AccountType.Receipt) {
        //TODO we can add the code that processes a receipt now.
        //  This will not call back into transactionState
        //  it will get added to the accounts[] map below just like all types,
        //  but I think we may look the data here an basically call
        //   appliedTxs[txId] = ...  the data we get...  in a way that matches the temp solution in apply()
        //   but note we will keep the temp solution in apply() for now
        //   may have to store txId on the WrappedEVMAccount variant type.
        //
        // appliedTxs[txId] = {
        //   txId: updatedEVMAccount.txId,
        //   receipt: updatedEVMAccount.receipt
        // }
      }

      const hashBefore = prevStateId
      WrappedEVMAccountFunctions.updateEthAccountHash(updatedEVMAccount)
      const hashAfter = updatedEVMAccount.hash

      if (ShardeumFlags.VerboseLogs) console.log('updatedEVMAccount after hashUpdate', updatedEVMAccount)

      // Save updatedAccount to db / persistent storage
      //accounts[accountId] = updatedEVMAccount
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`updateAccountFull.AccountsStorage.setAccount(${accountId})`)
      await AccountsStorage.setAccount(accountId, updatedEVMAccount)
      /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`updateAccountFull.AccountsStorage.setAccount(${accountId})`, DebugComplete.Completed)

      if (ShardeumFlags.AppliedTxsMaps) {
        /* eslint-disable security/detect-object-injection */
        const ethTxId = shardusTxIdToEthTxId[txId]

        //we will only have an ethTxId if this was an EVM tx.  internalTX will not have one
        if (ethTxId != null) {
          const appliedTx = appliedTxs[ethTxId]
          appliedTx.status = 1
        }
        /* eslint-enable security/detect-object-injection */
      }
      // TODO: the account we passed to shardus is not the final committed data for contract code and contract storage
      //  accounts

      // Add data to our required response object
      shardus.applyResponseAddState(
        applyResponse,
        updatedEVMAccount,
        updatedEVMAccount,
        accountId,
        applyResponse.txId,
        applyResponse.txTimestamp,
        hashBefore,
        hashAfter,
        accountCreated
      )
    },
    async updateAccountPartial(wrappedData, localCache, applyResponse) {
      //I think we may need to utilize this so that shardus is not oblicated to make temporary copies of large CAs
      //
      await this.updateAccountFull(wrappedData, localCache, applyResponse)
    },
    async getAccountDataByRange(
      accountStart,
      accountEnd,
      tsStart,
      tsEnd,
      maxRecords,
      offset = 0,
      accountOffset = ''
    ): Promise<ShardusTypes.WrappedData[]> {
      const results: WrappedEVMAccount[] = []
      const start = parseInt(accountStart, 16)
      const end = parseInt(accountEnd, 16)

      const finalResults: ShardusTypes.WrappedData[] = []

      if (ShardeumFlags.UseDBForAccounts === true) {
        //direct DB query
        const dbResults = await AccountsStorage.queryAccountsEntryByRanges2(
          accountStart,
          accountEnd,
          tsStart,
          tsEnd,
          maxRecords,
          offset,
          accountOffset
        )

        for (const wrappedEVMAccount of dbResults) {
          // Process and add to finalResults
          const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          finalResults.push(wrapped)
        }
        return finalResults
      }

      const accounts = AccountsStorage.accounts
      // Loop all accounts
      for (const addressStr in accounts) {
        const wrappedEVMAccount = accounts[addressStr] // eslint-disable-line security/detect-object-injection
        // Skip if not in account id range
        const id = parseInt(addressStr, 16)
        if (id < start || id > end) continue
        // Skip if not in timestamp range
        const timestamp = wrappedEVMAccount.timestamp
        if (timestamp < tsStart || timestamp > tsEnd) continue

        // // Add to results
        // const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        // results.push(wrapped)
        // Add to results
        results.push(wrappedEVMAccount)
        // we can't exit early. this is hard on perf
        // This data needs to eventually live in a DB and then the sort and max records will be natural.

        // Return results early if maxRecords reached
        // if (results.length >= maxRecords) return results
      }
      //critical to sort by timestamp before we cull max records
      results.sort((a, b) => a.timestamp - b.timestamp)

      // let sortByTsThenAddress = function (a,b){
      //   if(a.timestamp === b.timestamp){
      //     if(a.ethAddress > b.ethAddress){
      //       return 1
      //     }if(a.ethAddress < b.ethAddress){
      //       return -1
      //     } else {
      //       return 0
      //     }
      //   }
      //   if(a.timestamp > b.timestamp){
      //     return 1
      //   }
      //   return -1
      // }
      // results.sort(sortByTsThenAddress)

      //let cappedResults = results.slice(0, maxRecords)

      const cappedResults = []
      let count = 0
      const extra = 0
      // let startTS = results[0].timestamp
      // let sameTS = true

      if (results.length > 0) {
        //start at offset!
        for (let i = offset; i < results.length; i++) {
          const wrappedEVMAccount = results[i] // eslint-disable-line security/detect-object-injection
          // if(startTS === wrappedEVMAccount.timestamp){
          //   sameTS = true
          // }
          // if(sameTS){
          //   if(startTS != wrappedEVMAccount.timestamp){
          //     sameTS = false
          //   }
          // } else {
          //   if(count > maxRecords){
          //     break
          //   }
          // }
          if (count > maxRecords) {
            // if(lastTS != wrappedEVMAccount.timestamp){
            //   break
            // } else {
            //   extra++
            // }

            break //no extras allowed
          }
          count++
          cappedResults.push(wrappedEVMAccount)
        }
      }

      /* prettier-ignore */ if (logFlags.dapp_verbose) shardus.log( `getAccountDataByRange: extra:${extra} ${Utils.safeStringify({ accountStart, accountEnd, tsStart, tsEnd, maxRecords, offset, })}` )

      for (const wrappedEVMAccount of cappedResults) {
        // Process and add to finalResults
        const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        finalResults.push(wrapped)
      }

      return finalResults
    },
    calculateAccountHash(wrappedEVMAccount: WrappedEVMAccount) {
      //this could be slow, would be nice to have a smart version
      fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
      return WrappedEVMAccountFunctions._calculateAccountHash(wrappedEVMAccount)
    },
    // should rely on set account data
    // resetAccountData(accountBackupCopies) {
    //   for (let recordData of accountBackupCopies) {
    //     let wrappedEVMAccount = recordData.data as WrappedEVMAccount
    //     let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
    //     accounts[shardusAddress] = wrappedEVMAccount

    //     //TODO need to also update shardeumState! probably can do that in a batch outside of this loop
    //     // a wrappedEVMAccount could be an EVM Account or a CA key value pair
    //     // maybe could just refactor the loop in setAccountData??
    //   }
    // },

    //TODO this seems to be unused, can we ditch it?
    async deleteAccountData() {
      // UNUSED!! ??
      // for (const address of addressList) {
      //   delete accounts[address]
      // }
    },
    async getAccountDataByList(addressList) {
      const results = []
      for (const address of addressList) {
        //const wrappedEVMAccount = accounts[address]
        // TODO perf: could replace with a single query
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getAccountDataByList.AccountsStorage.getAccount(${address})`)
        const wrappedEVMAccount = await AccountsStorage.getAccount(address)
        /* prettier-ignore */ shardus.setDebugSetLastAppAwait(`getAccountDataByList.AccountsStorage.getAccount(${address})`, DebugComplete.Completed)
        if (wrappedEVMAccount) {
          const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          results.push(wrapped)
        }
      }
      return results
    },
    async getCachedRIAccountData(addressList) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('getCachedRIAccountData', addressList)
      /* prettier-ignore */ nestedCountersInstance.countEvent('cache', 'getCachedRIAccountData')

      const results = []
      for (const address of addressList) {
        const wrappedEVMAccount = await getCachedRIAccount(address)
        if (wrappedEVMAccount) {
          const wrapped = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
          results.push(wrapped)
          /* prettier-ignore */ nestedCountersInstance.countEvent('cache', 'getCachedRIAccountData-hit')
        }
      }
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('getCachedRIAccountData results', Utils. safeStringify(results))
      return results
    },
    async setCachedRIAccountData(accountRecords) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('setCachedRIAccountData', accountRecords)

      for (const account of accountRecords) {
        const decodedAccount = account as AccountsEntry
        shardus.setDebugSetLastAppAwait(`setCachedRIAccountData(${decodedAccount.accountId})`)
        setCachedRIAccount(decodedAccount)
        shardus.setDebugSetLastAppAwait(`setCachedRIAccountData(${decodedAccount.accountId})`, DebugComplete.Completed)
      }
    },
    getNetworkAccount,
    async signAppData(
      type: string,
      hash: string,
      nodesToSign: number,
      originalAppData: any
    ): Promise<ShardusTypes.SignAppDataResult> {
      nestedCountersInstance.countEvent('shardeum-staking', 'calling signAppData')
      const appData = fixBigIntLiteralsToBigInt(originalAppData)
      const fail: ShardusTypes.SignAppDataResult = { success: false, signature: null }
      try {
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Running signAppData', type, hash, nodesToSign, appData)

        if (type === 'sign-stake-cert') {
          if (nodesToSign != 5) return fail
          const stakeCert = appData as StakeCert
          const errors = verifyPayload(AJVSchemaEnum.StakeCert, stakeCert)
          if (errors) {
            nestedCountersInstance.countEvent('shardeum-staking', 'signAppData ajv verification failed')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData ajv verification failed - type: ${type} stakeCert: ${Utils.safeStringify(stakeCert)} errors: ${Utils.safeStringify(errors)}`)
            return fail
          }
          const currentTimestamp = shardeumGetTime()
          if (stakeCert.certExp < currentTimestamp) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData cert expired')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData cert expired ${type} ${Utils.safeStringify(stakeCert)} `)
            return fail
          }
          let minStakeRequiredUsd: bigint
          let minStakeRequired: bigint
          let stakeAmount: bigint
          try {
            minStakeRequiredUsd = _base16BNParser(AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd)
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData' +
            ' stakeRequiredUsd parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequiredUsd parse error ${type} ${Utils.safeStringify(stakeCert)}, cachedNetworkAccount: ${Utils.safeStringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }
          try {
            minStakeRequired = scaleByStabilityFactor(minStakeRequiredUsd, AccountsStorage.cachedNetworkAccount)
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData' +
            ' minStakeRequired parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequired parse error ${type} ${Utils.safeStringify(stakeCert)}, cachedNetworkAccount: ${Utils.safeStringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }
          try {
            stakeAmount = _base16BNParser(stakeCert.stake)
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData' +
            ' stakeAmount parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData stakeAmount parse error ${type} ${Utils.safeStringify(stakeCert)}`)
            return fail
          }
          if (stakeAmount < minStakeRequired) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'signAppData stake amount lower than required')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData stake amount lower than required ${type} ${Utils.safeStringify(stakeCert)} `)
            return fail
          }
          if (ShardeumFlags.FullCertChecksEnabled) {
            const nominatorAddress = toShardusAddress(stakeCert.nominator, AccountType.Account)
            const nominatorAccount = await shardus.getLocalOrRemoteAccount(nominatorAddress)
            if (!nominatorAccount) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'could not find nominator account')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`could not find nominator account ${type} ${Utils.safeStringify(stakeCert)} `)
              return fail
            }
            const nominatorEVMAccount = nominatorAccount.data as WrappedEVMAccount
            fixDeserializedWrappedEVMAccount(nominatorEVMAccount)
            nominatorEVMAccount.operatorAccountInfo = fixBigIntLiteralsToBigInt(nominatorEVMAccount.operatorAccountInfo)
            if (!nominatorEVMAccount.operatorAccountInfo) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'operatorAccountInfo missing from nominator')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`operatorAccountInfo missing from nominator ${type} ${Utils.safeStringify(stakeCert)} `)
              return fail
            }
            if (stakeCert.stake != nominatorEVMAccount.operatorAccountInfo.stake) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'operatorAccountInfo missing from nominator')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`stake amount in cert and operator account does not match ${type} ${Utils.safeStringify(stakeCert)} ${Utils.safeStringify(nominatorEVMAccount)} `)
              return fail
            }
            if (stakeCert.nominee != nominatorEVMAccount.operatorAccountInfo.nominee) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'nominee in cert and operator account does not match')
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`nominee in cert and operator account does not match ${type} ${Utils.safeStringify(stakeCert)} ${Utils.safeStringify(nominatorEVMAccount)} `)
              return fail
            }
          }
          delete stakeCert.sign
          delete stakeCert.signs
          const signedCert: StakeCert = shardus.signAsNode(stakeCert)
          const result: ShardusTypes.SignAppDataResult = { success: true, signature: signedCert.sign }
          if (ShardeumFlags.VerboseLogs) console.log(`signAppData passed ${type} ${Utils.safeStringify(stakeCert)}`)
          nestedCountersInstance.countEvent('shardeum-staking', 'sign-stake-cert - passed')
          return result
        } else if (type === 'sign-remove-node-cert') {
          if (nodesToSign != 5) return fail
          const removeNodeCert = appData as RemoveNodeCert
          const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, removeNodeCert)
          if (errors) {
            nestedCountersInstance.countEvent('shardeum-remove-node', 'signAppData ajv verification failed')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData ajv verification failed - type: ${type} removeNodeCert: ${Utils.safeStringify(removeNodeCert)} errors: ${Utils.safeStringify(errors)}`)
            return fail
          }
          const latestCycles = shardus.getLatestCycles()
          const currentCycle = latestCycles[0]
          if (!currentCycle) {
            /* prettier-ignore */ if (logFlags.error) console.log('No cycle records found', latestCycles)
            return fail
          }
          if (removeNodeCert.cycle !== currentCycle.counter) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'cycle in cert does not match current cycle')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`cycle in cert does not match current cycle ${type} ${Utils.safeStringify(removeNodeCert)}, current: ${currentCycle.counter}`)
            return fail
          }
          let minStakeRequiredUsd: bigint
          let minStakeRequired: bigint
          let stakeAmount: bigint
          try {
            minStakeRequiredUsd = _base16BNParser(AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd)
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'signAppData' +
              ' stakeRequiredUsd parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequiredUsd parse error ${type} ${Utils.safeStringify(removeNodeCert)}, cachedNetworkAccount: ${Utils.safeStringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }
          try {
            minStakeRequired = scaleByStabilityFactor(minStakeRequiredUsd, AccountsStorage.cachedNetworkAccount)
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'signAppData' +
              ' minStakeRequired parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequired parse error ${type} ${Utils.safeStringify(removeNodeCert)}, cachedNetworkAccount: ${Utils.safeStringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }

          let remoteShardusAccount
          try {
            remoteShardusAccount = await shardus.getLocalOrRemoteAccount(removeNodeCert.nodePublicKey)
            if (!isNodeAccount2(remoteShardusAccount.data)) {
              /* prettier-ignore */
              nestedCountersInstance.countEvent('shardeum-remove-node', 'nodePublicKey is not a node account')
              /* prettier-ignore */
              if (ShardeumFlags.VerboseLogs) console.log(`nodePublicKey is not a node account ${type} ${Utils.safeStringify(removeNodeCert)}, cachedNetworkAccount: ${Utils.safeStringify(AccountsStorage.cachedNetworkAccount)} `)
              return fail
            }
          } catch (e) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'signAppData' +
              ' minStakeRequired parse error')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData minStakeRequired parse error ${type} ${Utils.safeStringify(removeNodeCert)}, cachedNetworkAccount: ${Utils.safeStringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }
          const nodeAccount = remoteShardusAccount.data as NodeAccount2
          if (isLowStake(nodeAccount) === false) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-remove-node', 'node locked stake is not below minStakeRequired')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`node locked stake is not below minStakeRequired ${type} ${Utils.safeStringify(removeNodeCert)}, cachedNetworkAccount: ${Utils.safeStringify(AccountsStorage.cachedNetworkAccount)} `)
            return fail
          }

          const signedCert: RemoveNodeCert = shardus.signAsNode(removeNodeCert)
          const result: ShardusTypes.SignAppDataResult = { success: true, signature: signedCert.sign }
          if (ShardeumFlags.VerboseLogs)
            console.log(`signAppData passed ${type} ${Utils.safeStringify(removeNodeCert)}`)
          nestedCountersInstance.countEvent('shardeum-staking', 'sign-stake-cert - passed')
          return result
        }
      } catch (e) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`signAppData failed: ${type} ${Utils.safeStringify(appData)}, error: ${Utils.safeStringify(e)}`)
        nestedCountersInstance.countEvent('shardeum-staking', 'sign-stake-cert - fail uncaught')
      }
      return fail
    },
    getAccountDebugValue(wrappedAccount) {
      return `${Utils.safeStringify(wrappedAccount)}`
    },
    getSimpleTxDebugValue(timestampedTx) {
      //console.log(`getSimpleTxDebugValue: ${Utils.safeStringify(tx)}`)

      if (timestampedTx == null) {
        return 'null'
      }

      try {
        //@ts-ignore
        const tx = timestampedTx?.tx
        if (isInternalTx(tx)) {
          const internalTx = tx as InternalTx
          return `internalTX: ${InternalTXType[internalTx.internalTXType]} `
        }
        if (isDebugTx(tx)) {
          const debugTx = tx as DebugTx
          return `debugTX: ${DebugTXType[debugTx.debugTXType]}`
        }
        const transaction = getTransactionObj(tx)
        if (transaction && isStakingEVMTx(transaction)) {
          return `stakingEVMtx`
        }
        if (transaction) {
          return `EVMtx`
        }
      } catch (e) {
        //@ts-ignore
        const tx = timestampedTx?.tx
        /* prettier-ignore */ if (logFlags.error) console.log(`getSimpleTxDebugValue failed: ${formatErrorMessage(e)}  tx:${Utils.safeStringify(tx)}`)
        return `error: ${e.message}`
      }
    },
    close: async (): Promise<void> => {
      if (ShardeumFlags.VerboseLogs) console.log('Shutting down...')
    },
    getTimestampAndHashFromAccount(account) {
      if (account != null && account.hash) {
        const wrappedEVMAccount = account as WrappedEVMAccount
        return {
          timestamp: wrappedEVMAccount.timestamp,
          hash: wrappedEVMAccount.hash,
        }
      } else if (account !== null && account.stateId) {
        return {
          timestamp: account.timestamp,
          hash: account.stateId,
        }
      }
      return {
        timestamp: 0,
        hash: 'invalid account data',
      }
    },
    transactionReceiptPass(
      timestampedTx: ShardusTypes.OpaqueTransaction,
      wrappedStates: { [id: string]: WrappedAccount },
      applyResponse: ShardusTypes.ApplyResponse,
      isExecutionGroup: boolean
    ) {
      //@ts-ignore
      const { tx } = timestampedTx
      const txId: string = generateTxId(tx)

      if (isExecutionGroup) {
        //This next log is usefull but very heavy on the output lines:
        //Updating to be on only with verbose logs
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('running transactionReceiptPass', txId, tx, wrappedStates, applyResponse)
        _transactionReceiptPass(tx, txId, wrappedStates, applyResponse)
      }

      //clear this out of the shardeum state map
      if (shardeumStateTXMap.has(txId)) {
        deleteApplyTXState(txId, 'receiptPass')
      }
    },
    transactionReceiptFail(
      timestampedTx: ShardusTypes.OpaqueTransaction,
      wrappedStates: { [id: string]: WrappedAccount },
      applyResponse?: ShardusTypes.ApplyResponse
    ) {
      if (ShardeumFlags.expiredTransactionStateFix === false) return
      if (ShardeumFlags.VerboseLogs)
        console.log('running transactionReceiptFail', timestampedTx, wrappedStates, applyResponse)
      //@ts-ignore
      const { tx } = timestampedTx
      const txId: string = generateTxId(tx)

      //clear this out of the shardeum state map
      if (shardeumStateTXMap.has(txId)) {
        if (ShardeumFlags.VerboseLogs)
          console.log('transactionReceiptFail: deleting txId from shardeumStateTXMap', txId)
        deleteApplyTXState(txId, 'receiptFail')
      }
    },

    getNodeInfoAppData() {
      let minVersion = ''
      let activeVersion = ''
      let latestVersion = ''
      const cachedNetworkAccount = AccountsStorage.cachedNetworkAccount
      if (cachedNetworkAccount) {
        minVersion = cachedNetworkAccount.current.minVersion
        activeVersion = cachedNetworkAccount.current.activeVersion
        latestVersion = cachedNetworkAccount.current.latestVersion
      }
      const shardeumNodeInfo: NodeInfoAppData = {
        shardeumVersion: version,
        minVersion,
        activeVersion,
        latestVersion,
        operatorCLIVersion,
        operatorGUIVersion,
        appStartupTimestamp,
      }
      return shardeumNodeInfo
    },
    async eventNotify(data: ShardusTypes.ShardusEvent) {
      try {
        if (ShardeumFlags.StakingEnabled === false) return
        if (ShardeumFlags.VerboseLogs) console.log(`Running eventNotify`, data)

        const nodeId = shardus.getNodeId()
        const node = shardus.getNode(nodeId)

        console.log('eventNotify', data.type, data.publicKey)
        // skip for own node
        if (!shardus.p2p.isFirstSeed && data.nodeId === nodeId && data.type !== 'node-activated') {
          console.log('eventNotify', 'skipping for own node', data.type, data.publicKey)
          return
        }

        if (node == null) {
          if (ShardeumFlags.VerboseLogs) console.log(`node is null`, data.publicKey)
          console.log('eventNotify', 'node is null', data.publicKey)
          return
        }

        if (node.status !== 'active' && data.type !== 'node-activated') {
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('This node is not active yet')
          console.log('eventNotify', 'This node is not active yet', data.publicKey)
          return
        }

        const eventType = data.type
        nestedCountersInstance.countEvent('eventNotify', `eventType: ${eventType}`)

        // Waiting a bit here to make sure that shardus.getLatestCycles gives the latest cycle
        await sleep(1000)
        const latestCycles: ShardusTypes.Cycle[] = shardus.getLatestCycles(10)
        const currentCycle = latestCycles[0]
        if (!currentCycle) {
          /* prettier-ignore */ if (logFlags.error) console.log('No cycle records found', latestCycles)
          console.log('eventNotify', 'No cycle records found', latestCycles, eventType, data.publicKey)
          return
        }

        // TODO: see if it's fine; what if getClosestNodes gives only recently activatd nodes
        // skip if this node is also activated in the same cycle
        const currentlyActivatedNode = currentCycle.activated.includes(nodeId)
        if (currentlyActivatedNode) {
          console.log('eventNotify', 'skipping for currentlyActivatedNode', data.publicKey, eventType)
          return
        }

        if (eventType === 'node-activated') {
          const closestNodes = shardus.getClosestNodes(data.publicKey, 5)
          const ourId = shardus.getNodeId()
          for (const id of closestNodes) {
            if (id === ourId) {
              nestedCountersInstance.countEvent('shardeum-staking', `${eventType}: injectInitRewardTimesTx`)
              const txData = {
                startTime: data.time,
                publicKey: data.publicKey,
                nodeId: data.nodeId,
              } as NodeInitTxData
              console.log('node-activated', 'injectInitRewardTimesTx', data.publicKey, txData)
              shardus.serviceQueue.addNetworkTx('nodeInitReward', shardus.signAsNode(txData), data.publicKey)
            }
          }
        } else if (eventType === 'node-deactivated') {
          // todo: aamir check the timestamp and cycle the first time we see this event
          // Limit the nodes that send this to the 5 closest to the node id
          const closestNodes = shardus.getClosestNodes(data.publicKey, 5)
          const ourId = shardus.getNodeId()
          for (const id of closestNodes) {
            if (id === ourId) {
              nestedCountersInstance.countEvent('shardeum-staking', `${eventType}: injectClaimRewardTx`)
              const txData = {
                endTime: data.time,
                publicKey: data.publicKey,
                nodeId: data.nodeId,
              } as NodeRewardTxData
              console.log('node-deactivates', 'injectClaimRewardTx', data.publicKey, txData)
              shardus.serviceQueue.addNetworkTx('nodeReward', shardus.signAsNode(txData), data.publicKey)
            }
          }
        } else if (
          eventType === 'node-left-early' &&
          AccountsStorage.cachedNetworkAccount.current.enableNodeSlashing === true &&
          AccountsStorage.cachedNetworkAccount.current.slashing.enableLeftNetworkEarlySlashing
        ) {
          let nodeLostCycle
          let nodeDroppedCycle
          for (let i = 0; i < latestCycles.length; i++) {
            const cycle = latestCycles[i]
            if (cycle == null) continue
            if (cycle.apoptosized.includes(data.nodeId)) {
              nodeDroppedCycle = cycle.counter
            } else if (cycle.lost.includes(data.nodeId)) {
              nodeLostCycle = cycle.counter
            }
          }
          if (nodeLostCycle && nodeDroppedCycle && nodeLostCycle < nodeDroppedCycle) {
            const violationData: LeftNetworkEarlyViolationData = {
              nodeLostCycle,
              nodeDroppedCycle,
              nodeDroppedTime: data.time,
            }
            nestedCountersInstance.countEvent('shardeum-staking', `node-left-early: injectPenaltyTx`)

            await PenaltyTx.injectPenaltyTX(shardus, data, violationData)
          } else {
            nestedCountersInstance.countEvent('shardeum-staking', `node-left-early: event skipped`)
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Shardeum node-left-early event skipped`, data, nodeLostCycle, nodeDroppedCycle)
          }
        } else if (
          eventType === 'node-sync-timeout' &&
          AccountsStorage.cachedNetworkAccount.current.enableNodeSlashing === true &&
          AccountsStorage.cachedNetworkAccount.current.slashing.enableSyncTimeoutSlashing
        ) {
          let violationData: SyncingTimeoutViolationData
          for (let i = 0; i < latestCycles.length; i++) {
            const cycle = latestCycles[i]
            if (cycle == null) continue
            if (cycle.lostSyncing.includes(data.nodeId) && cycle.counter === data.cycleNumber) {
              violationData = {
                nodeLostCycle: data.cycleNumber,
                nodeDroppedTime: data.time,
              }
              nestedCountersInstance.countEvent('shardeum-staking', `node-sync-timeout: injectPenaltyTx`)

              await PenaltyTx.injectPenaltyTX(shardus, data, violationData)
            }
          }
          if (!violationData) {
            console.log(`node-sync-timeout validation failed: Node-ID: (${data.nodeId}) not found in lostSyncing`)
            return
          }
        } else if (
          eventType === 'node-refuted' &&
          AccountsStorage.cachedNetworkAccount.current.enableNodeSlashing === true &&
          AccountsStorage.cachedNetworkAccount.current.slashing.enableNodeRefutedSlashing
        ) {
          let nodeRefutedCycle
          for (let i = 0; i < latestCycles.length; i++) {
            const cycle = latestCycles[i]
            if (cycle == null) continue
            if (cycle.refuted.includes(data.nodeId)) {
              nodeRefutedCycle = cycle.counter
            }
          }
          if (nodeRefutedCycle === data.cycleNumber) {
            const violationData: NodeRefutedViolationData = {
              nodeRefutedCycle: nodeRefutedCycle,
              nodeRefutedTime: data.time,
            }
            nestedCountersInstance.countEvent('shardeum-staking', `node-refuted: injectPenaltyTx`)

            await PenaltyTx.injectPenaltyTX(shardus, data, violationData)
          } else {
            nestedCountersInstance.countEvent('shardeum-staking', `node-refuted: event skipped`)
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Shardeum node-refuted event skipped`, data, nodeRefutedCycle)
          }
        } else if (eventType === 'try-network-transaction') {
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('shardeum-event', `try-network-transaction`, safeStringify(data))
          nestedCountersInstance.countEvent('shardeum-event', `try-network-transaction`)
          if (data?.additionalData.type === 'nodeReward') {
            console.log('shardeum-event', `running injectClaimrewardTxWithRetry nodeReward`, safeStringify(data))
            console.log('nodereward tx data 1', data.additionalData.hash)
            if (shardus.fastIsPicked(1)) {
              console.log('nodereward tx data 2', data.additionalData.hash)
              const result = await injectClaimRewardTx(shardus, data)
              /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('INJECTED_CLAIM_REWARD_TX',result)
            }
          } else if (data?.additionalData.type === 'nodeInitReward') {
            /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('shardeum-event', `running injectInitRewardTimesTx nodeInitReward`, safeStringify(data))
            if (shardus.fastIsPicked(1)) {
              console.log('nodeInitReward tx data 2', data.additionalData.hash)
              const result = await InitRewardTimesTx.injectInitRewardTimesTx(shardus, data)
              /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('INJECTED_INIT_REWARD_TIMES_TX', result)
            }
          }
        }
      } catch (e) {
        /* prettier-ignore */ if (logFlags.error) console.log(`eventNotify exception: ${formatErrorMessage(e)}`)
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum', `eventNotify ${data?.type} ${e.message}`)
      }
    },
    // Note: this logic is added to the archive server; any changes here should have to be done in the archive server as well
    async updateNetworkChangeQueue(account: WrappedAccount, appData: any) {
      /* eslint-disable security/detect-object-injection */
      if (account.accountId === networkAccount) {
        const networkAccount: NetworkAccount = account.data
        await this.patchAndUpdate(networkAccount.current, appData)
        // TODO: look into updating the timestamp also
        // Increase the timestamp by 1 second
        // networkAccount.timestamp += ONE_SECOND ( this has issue when a newly joined node updates its config )
        networkAccount.hash = WrappedEVMAccountFunctions._calculateAccountHash(networkAccount)
        account.stateId = networkAccount.hash
        account.timestamp = networkAccount.timestamp
        return [account]
      }
      /* eslint-enable security/detect-object-injection */
    },
    async patchAndUpdate(existingObject: any, changeObj: any, parentPath = '') {
      /* eslint-disable security/detect-object-injection */
      for (const [key, value] of Object.entries(changeObj)) {
        if (existingObject[key] != null) {
          if (typeof value === 'object') {
            await this.patchAndUpdate(existingObject[key], value, parentPath === '' ? key : parentPath + '.' + key)
          } else {
            if (key === 'activeVersion') {
              await onActiveVersionChange(value as string)
            }
            existingObject[key] = value
          }
        }
      }
      /* eslint-enable security/detect-object-injection */
    },
    // Note: this logic is added to the archive server; any changes here should have to be done in the archive server as well
    async pruneNetworkChangeQueue(account: WrappedAccount, currentCycle: number) {
      if (account.accountId === networkAccount) {
        /* eslint-disable security/detect-object-injection */
        const networkAccount: NetworkAccount = account.data
        const listOfChanges = account.data.listOfChanges

        const configsMap = new Map()
        const keepAliveCount = shardusConfig.stateManager.configChangeMaxChangesToKeep
        for (let i = listOfChanges.length - 1; i >= 0; i--) {
          const thisChange = listOfChanges[i]
          let keepAlive = false

          let shardeumConfigs = []
          if (thisChange.appData) {
            shardeumConfigs = this.generatePathKeys(thisChange.appData, 'appdata.')
          }
          const shardusConfigs: string[] = this.generatePathKeys(thisChange.change)

          const allConfigs = shardeumConfigs.concat(shardusConfigs)

          for (const config of allConfigs) {
            if (!configsMap.has(config)) {
              configsMap.set(config, 1)
              keepAlive = true
            } else if (configsMap.get(config) < keepAliveCount) {
              configsMap.set(config, configsMap.get(config) + 1)
              keepAlive = true
            }
          }

          if (currentCycle - thisChange.cycle <= shardusConfig.stateManager.configChangeMaxCyclesToKeep) {
            keepAlive = true
          }

          if (keepAlive == false) {
            listOfChanges.splice(i, 1)
          }
        }
        // TODO: look into updating the timestamp also
        // Increase the timestamp by 1 second
        // networkAccount.timestamp += ONE_SECOND ( this has issue when a newly joined node updates its config )
        networkAccount.hash = WrappedEVMAccountFunctions._calculateAccountHash(networkAccount)
        account.stateId = networkAccount.hash
        account.timestamp = networkAccount.timestamp
        return [account]
        /* eslint-enable security/detect-object-injection */
      }
    },
    generatePathKeys(obj: any, prefix = ''): string[] {
      /* eslint-disable security/detect-object-injection */
      let paths: string[] = []

      // Loop over each key in the object
      for (const key of Object.keys(obj)) {
        // If the value corresponding to this key is an object (and not an array or null),
        // then recurse into it.
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          paths = paths.concat(this.generatePathKeys(obj[key], prefix + key + '.'))
        } else {
          // Otherwise, just append this key to the path.
          paths.push(prefix + key)
        }
      }
      return paths
      /* eslint-enable security/detect-object-injection */
    },
    beforeStateAccountFilter(account: WrappedAccount) {
      if (account.data.accountType === 1) {
        return (account.data as WrappedEVMAccount).value?.length === 0 ? false : true
      } else {
        return false
      }
    },

    //@ts-ignore
    canStayOnStandby(joinInfo: any): { canStay: boolean; reason: string } {
      if (joinInfo) {
        const appJoinData = joinInfo?.appJoinData

        if (AccountsStorage.cachedNetworkAccount == null) {
          //We need to enhance the early config getting to also get other values of the global account
          //so we know what versions the network is.  this is a stopgap!
          return { canStay: true, reason: 'dont have network account yet. cant boot anything!' }
        }

        const minVersion = AccountsStorage.cachedNetworkAccount.current.minVersion
        const latestVersion = AccountsStorage.cachedNetworkAccount.current.latestVersion
        const appJoinDataVersion = appJoinData.version

        // Min version reasons we can't stay on standby list.
        const minVersionValidationResult = meetsMinimumVersion(minVersion, appJoinDataVersion)
        if (minVersionValidationResult !== VersionValidationResult.Success) {
          switch (minVersionValidationResult) {
            case VersionValidationResult.ComparisonFailed:
              return {
                canStay: false,
                reason: `canStayOnStandby: Standby node version: ${appJoinDataVersion} failed to meet min version ${minVersion}`,
              }
            case VersionValidationResult.ControlVersionParseFailure:
              return { canStay: false, reason: `canStayOnStandby: Failed to parse minVersion ${minVersion}` }
            case VersionValidationResult.InvalidControlVersion:
              return { canStay: false, reason: `canStayOnStandby: Failed to validate minVersion ${minVersion}` }
            case VersionValidationResult.TestVersionParseFailure:
              return {
                canStay: false,
                reason: `canStayOnStandby: Failed to parse appJoinDataVersion ${appJoinDataVersion}`,
              }
            case VersionValidationResult.InvalidTestVersion:
              return {
                canStay: false,
                reason: `canStayOnStandby: Failed to validate appJoinDataVersion ${appJoinDataVersion}`,
              }
            default:
              return {
                canStay: false,
                reason: `canStayOnStandby: Unexpected validation result ${minVersionValidationResult} - minVersion: ${minVersion} appJoinDataVersion: ${appJoinDataVersion}`,
              }
          }
        }

        // Max version reasons we can't stay on standby list.
        const latestVersionValidationResult = isWithinMaximumVersion(latestVersion, appJoinDataVersion)
        if (latestVersionValidationResult !== VersionValidationResult.Success) {
          switch (latestVersionValidationResult) {
            case VersionValidationResult.ComparisonFailed:
              return {
                canStay: false,
                reason: `canStayOnStandby: Standby node version: ${appJoinDataVersion} exceeds latestVersion ${latestVersion}`,
              }
            case VersionValidationResult.ControlVersionParseFailure:
              return { canStay: false, reason: `canStayOnStandby: Failed to parse latestVersion ${latestVersion}` }
            case VersionValidationResult.InvalidControlVersion:
              return { canStay: false, reason: `canStayOnStandby: Failed to validate latestVersion ${latestVersion}` }
            case VersionValidationResult.TestVersionParseFailure:
              return {
                canStay: false,
                reason: `canStayOnStandby: Failed to parse appJoinDataVersion ${appJoinDataVersion}`,
              }
            case VersionValidationResult.InvalidTestVersion:
              return {
                canStay: false,
                reason: `canStayOnStandby: Failed to validate appJoinDataVersion ${appJoinDataVersion}`,
              }
            default:
              return {
                canStay: false,
                reason: `canStayOnStandby: Unexpected validation result ${latestVersionValidationResult} - latestVersion: ${latestVersion} appJoinDataVersion: ${appJoinDataVersion}`,
              }
          }
        }
      }

      return { canStay: true, reason: '' }
    },
    binarySerializeObject(identifier: string, obj): Buffer {
      nestedCountersInstance.countEvent('binarySerializeObject', identifier)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('binarySerializeObject:', identifier, obj)
      try {
        switch (identifier) {
          case 'AppData':
            return accountSerializer(obj).getBuffer()
          default:
            return Buffer.from(Utils.safeStringify(obj), 'utf8')
        }
      } catch (e) {
        /* prettier-ignore */ if (logFlags.error) console.log('binarySerializeObject error:', e, 'obj: ', obj)
        nestedCountersInstance.countEvent('binarySerializeObject', 'error')
        return Buffer.from(Utils.safeStringify(obj), 'utf8')
      }
    },
    binaryDeserializeObject(identifier: string, buffer: Buffer) {
      nestedCountersInstance.countEvent('binaryDeserializeObject', identifier)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('binaryDeserializeObject:', identifier, buffer)
      try {
        switch (identifier) {
          case 'AppData':
            return accountDeserializer(buffer)
          default:
            return Utils.safeJsonParse(buffer.toString('utf8'))
        }
      } catch (e) {
        /* prettier-ignore */ if (logFlags.error) console.log('binaryDeserializeObject error:', e)
        nestedCountersInstance.countEvent('binaryDeserializeObject', 'error')
        return Utils.safeJsonParse(buffer.toString('utf8'))
      }
    },

    getTxSenderAddress(tx) {
      if (isInternalTx(tx) || isDebugTx(tx)) {
        const internalTx = tx as InternalTx
        if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
          return internalTx.from
        } else if (internalTx.internalTXType === InternalTXType.InitNetwork) {
          return internalTx.network
        } else if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
          return internalTx.from
        } else if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
          return internalTx.network
        } else if (internalTx.internalTXType === InternalTXType.ChangeNetworkParam) {
          return internalTx.from
        } else if (internalTx.internalTXType === InternalTXType.ApplyNetworkParam) {
          return internalTx.network
        } else if (isSetCertTimeTx(internalTx)) {
          return internalTx.nominee
        } else if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
          return internalTx.nominee
        } else if (internalTx.internalTXType === InternalTXType.ClaimReward) {
          return internalTx.nominee
        } else if (internalTx.internalTXType === InternalTXType.Penalty) {
          const penaltyTx: any = internalTx
          return penaltyTx.reportedNodePublickKey
        }
        return internalTx.from
      }
      const shardusTxId = generateTxId(tx)
      const transaction = getTransactionObj(tx)
      const senderAddress = getTxSenderAddress(transaction, shardusTxId).address
      const callerEVMAddress = senderAddress.toString()
      const callerShardusAddress = toShardusAddress(callerEVMAddress, AccountType.Account)
      return callerShardusAddress
    },
    injectTxToConsensor(validatorDetails: any[], tx) {
      return InjectTxToConsensor(validatorDetails, tx)
    },
    getNonceFromTx(tx: ShardusTypes.OpaqueTransaction): bigint {
      if (isInternalTx(tx) || isDebugTx(tx)) {
        return BigInt(0)
      }
      const transaction = getTransactionObj(tx)
      if (transaction && transaction.nonce) {
        return transaction.nonce
      }
    },
    async getAccountNonce(accountId: string, wrappedData: ShardusTypes.WrappedData): Promise<bigint> {
      if (wrappedData != null) {
        const wrappedEVMAccount = wrappedData.data as WrappedEVMAccount
        return wrappedEVMAccount.account.nonce
      }

      let getAccountNonceRetries = 3
      if (ShardeumFlags.debugExtraNonceLookup) {
        getAccountNonceRetries = config.server.sharding.nodesPerConsensusGroup
      }

      let exceptionCount = 0

      for (let i = 0; i < getAccountNonceRetries; i++) {
        try {
          const account: ShardusTypes.WrappedDataFromQueue = await shardus.getLocalOrRemoteAccount(accountId, {
            useRICache: false,
            canThrowException: true,
          })
          if (account != null) {
            const wrappedEVMAccount = account.data as WrappedEVMAccount
            return wrappedEVMAccount.account.nonce
          }
          //if we did not get an exeption we could return null, but seems better to retry
        } catch (e) {
          exceptionCount++
          //This has the potential to spam our counters if message has a format string. may have to dial it back
          //or disable after we fix issues
          /* prettier-ignore */ nestedCountersInstance.countEvent('getAccountNonce', `getAccountNonce: ${e.message}`)
        }
      }

      nestedCountersInstance.countEvent(
        'getAccountNonce',
        `getAccountNonce: out of retries exceptionCount: ${exceptionCount}`
      )

      return undefined
    },
    verifyMultiSigs: (
      rawPayload: object,
      sigs: Sign[],
      allowedPubkeys: { [pubkey: string]: DevSecurityLevel },
      minSigRequired: number,
      requiredSecurityLevel: DevSecurityLevel
    ): boolean => {
      return verifyMultiSigs(rawPayload, sigs, allowedPubkeys, minSigRequired, requiredSecurityLevel)
    },
    isNGT: (tx: OpaqueTransaction): boolean => {
      const INIT_REWARD_TX = 8
      const CLAIM_REWARD_TX = 9
      const NGT_TYPES = [INIT_REWARD_TX, CLAIM_REWARD_TX]
      return NGT_TYPES.includes(tx?.['internalTXType'])
    },
    verifyAppJoinData: (data: unknown): string[] | null => verifyPayload(AJVSchemaEnum.AppJoinData, data),
    getUniqueAppTags: (tx: ShardusTypes.OpaqueTransaction): { [key: string]: string } | null | undefined => {
      const txId = generateTxId(tx)
      return { txId }
    },
    async getNetworkAccountFromArchiver(): Promise<WrappedAccount> {
      try {
        const networkAccount = await fetchNetworkAccountFromArchiver()
        return networkAccount
      } catch (e) {
        /* prettier-ignore */ if (logFlags.error) console.log('getNetworkAccountFromArchiver error:', e)
        nestedCountersInstance.countEvent('getNetworkAccountFromArchiver', 'error')
      }
      return null
    },
}

export const shardusSetup = (shardusInstance: any, evmCommonInstance: any, debugAppdataInstance: any): void => {
  // Initialize functions that depend on shardus and evmCommon
  // Create a sync function that Shardus can call directly
  // The sync function factory returns a function, so we call it immediately to get the actual sync function
  setupConfig.sync = sync(shardusInstance, evmCommonInstance)
  setupConfig.validateTransaction = validateTransaction(shardusInstance)
  setupConfig.validateTxnFields = validateTxnFields(shardusInstance, debugAppdataInstance)
  
  /**
   * interface tx {
   *   type: string
   *   from: string,
   *   to: string,
   *   amount: number,
   *   timestamp: number
   * }
   */
  shardusInstance.setup(Object.assign({}, Object.assign({}, setupConfig, joinFunctions), txFunctions));

  shardusInstance.registerExceptionHandler()
}