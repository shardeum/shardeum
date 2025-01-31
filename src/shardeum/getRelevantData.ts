import { ShardeumFlags } from "./shardeumFlags"

import { Shardus } from "@shardeum-foundation/core"
import { isInternalTx, isDebugTx } from "../setup/helpers"
import {
  AccountType,
  InternalTx,
  NetworkAccount,
  WrappedEVMAccount,
  InternalTXType,
  StakeCoinsTX,
  NodeAccount2
} from "./shardeumTypes"
import { DebugComplete } from "@shardeum-foundation/core"
import { Config } from '../config'
import { Utils } from '@shardeum-foundation/lib-types'
import { Address, hexToBytes } from '@ethereumjs/util'


type AccountsStorage = {
  getAccount: (accountId: string) => Promise<any>
}

type Dependencies = {
  shardus: Shardus
  AccountsStorage: AccountsStorage
  ShardeumFlags: typeof ShardeumFlags
  networkAccount: string
  createNetworkAccount: (accountId: string, config: any, isFirstSeed: boolean) => Promise<any>
  config: Config
  shardusAddressToEVMAccountInfo: Map<string, any>
  WrappedEVMAccountFunctions: any
  getTransactionObj: (tx: any) => any
  isStakingEVMTx: (tx: any) => boolean
  bytesToHex: (tx: any) => string
  toShardusAddressWithKey: (txHash: string, txId: string, accountType: AccountType) => string
  createNodeAccount2: (accountId: string) => NodeAccount2
  generateTxId: (tx: any) => string
  getApplyTXState: (txId: string) => any
  nestedCountersInstance: any
  logFlags: any
  createAccount: (evmAccountID: string, shardeumState: any) => Promise<any>
}

export async function getRelevantData(
  {
    shardus,
    config,
    AccountsStorage,
    ShardeumFlags, networkAccount,
    createNetworkAccount,
    shardusAddressToEVMAccountInfo,
    WrappedEVMAccountFunctions,
    getTransactionObj,
    isStakingEVMTx,
    bytesToHex,
    toShardusAddressWithKey,
    createNodeAccount2,
    generateTxId,
    getApplyTXState,
    nestedCountersInstance,
    logFlags,
    createAccount,
  }: Dependencies,
  accountId: string,
  timestampedTx: any,
  appData: any
) {
  if (ShardeumFlags.VerboseLogs) console.log('Running getRelevantData', accountId, timestampedTx, appData)
  //@ts-ignore
  const { tx } = timestampedTx

  if (isInternalTx(tx)) {
    const internalTx = tx as InternalTx

    let accountCreated = false
    //let wrappedEVMAccount = accounts[accountId]
    shardus.setDebugSetLastAppAwait('getRelevantData.AccountsStorage.getAccount 4')
    let wrappedEVMAccount: NetworkAccount | WrappedEVMAccount = await AccountsStorage.getAccount(
      accountId
    )
    shardus.setDebugSetLastAppAwait(
      'getRelevantData.AccountsStorage.getAccount 4',
      DebugComplete.Completed
    )
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
    if (internalTx.internalTXType === InternalTXType.SetCertTime) {
      if (!wrappedEVMAccount) {
        // Node Account or EVM Account(Nominator) has to be already created at this point.
        if (accountId === internalTx.nominee) {
          throw Error(
            `Node Account <nominee> is not found ${accountId}, tx: ${Utils.safeStringify(internalTx)}`
          )
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
}
