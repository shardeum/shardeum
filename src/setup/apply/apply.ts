import { Shardus, ShardusTypes } from '@shardus/core'
import { getInjectedOrGeneratedTimestamp, isInternalTx } from '../helpers'
import { validateTransaction } from '../validateTransaction'
import { applyInternalTx } from './applyInternalTx'

// TODO: We need a way to manage global variables. Passing them down in a HOF won't work because
// when the inner function is called, it will be using the old value for value parameters. Eg. latestBlock
export const apply = (shardus: Shardus) => async (timestampedTx, wrappedStates, appData) => {
  let { tx } = timestampedTx
  const txTimestamp = getInjectedOrGeneratedTimestamp(timestampedTx)
  // Validate the tx
  const { result, reason } = validateTransaction(shardus, tx)
  if (result !== 'pass') {
    throw new Error(`invalid transaction, reason: ${reason}. tx: ${JSON.stringify(tx)}`)
  }

  if (isInternalTx(tx)) {
    return applyInternalTx(tx, wrappedStates, txTimestamp)
  }

  if (isDebugTx(tx)) {
    let debugTx = tx as DebugTx
    return applyDebugTx(debugTx, wrappedStates, txTimestamp)
  }

  const transaction: Transaction | AccessListEIP2930Transaction = getTransactionObj(tx)
  const ethTxId = bufferToHex(transaction.hash())
  const shardusReceiptAddress = toShardusAddressWithKey(ethTxId, '', AccountType.Receipt)
  let txId = crypto.hashObj(tx)
  // Create an applyResponse which will be used to tell Shardus that the tx has been applied
  if (ShardeumFlags.VerboseLogs)
    console.log('DBG', new Date(), 'attempting to apply tx', txId, ethTxId, tx, wrappedStates, appData)
  const applyResponse = shardus.createApplyResponse(txId, txTimestamp)

  //Now we need to get a transaction state object.  For single sharded networks this will be a new object.
  //When we have multiple shards we could have some blob data that wrapped up read accounts.  We will read these accounts
  //Into the the transaction state init at some point (possibly not here).  This will allow the EVM to run and not have
  //A storage miss for accounts that were read on previous shard attempts to exectute this TX
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
  shardeumState._transactionState.appData = appData

  if (appData.internalTx && appData.internalTXType === InternalTXType.Stake) {
    if (ShardeumFlags.VerboseLogs) console.log('applying stake tx', wrappedStates, appData)

    // get stake tx from appData.internalTx
    let stakeCoinsTx: StakeCoinsTX = appData.internalTx
    let operatorShardusAddress = toShardusAddress(stakeCoinsTx.nominator, AccountType.Account)
    const operatorEVMAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress].data

    // validate tx timestamp, compare timestamp against account's timestamp
    if (stakeCoinsTx.timestamp < operatorEVMAccount.timestamp) {
      throw new Error('Stake transaction timestamp is too old')
    }

    // Validate tx timestamp against certExp
    if (operatorEVMAccount.operatorAccountInfo && operatorEVMAccount.operatorAccountInfo.certExp > 0) {
      if (stakeCoinsTx.timestamp > operatorEVMAccount.operatorAccountInfo.certExp) {
        throw new Error('Operator certExp is already set and expired compared to stake transaction')
      }
    }

    // set stake value, nominee, cert in OperatorAcc (if not set yet)
    let nomineeNodeAccount2Address = stakeCoinsTx.nominee
    operatorEVMAccount.timestamp = txTimestamp

    // todo: operatorAccountInfo field may not exist in the operatorEVMAccount yet
    if (operatorEVMAccount.operatorAccountInfo == null) {
      operatorEVMAccount.operatorAccountInfo = { stake: new BN(0), nominee: '', certExp: null }
    }
    operatorEVMAccount.operatorAccountInfo.stake = stakeCoinsTx.stake
    operatorEVMAccount.operatorAccountInfo.nominee = stakeCoinsTx.nominee
    operatorEVMAccount.operatorAccountInfo.certExp = 0
    fixDeserializedWrappedEVMAccount(operatorEVMAccount)

    let totalAmountToDeduct = stakeCoinsTx.stake.add(new BN(ShardeumFlags.constantTxFee))
    operatorEVMAccount.account.balance = operatorEVMAccount.account.balance.sub(totalAmountToDeduct)
    operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce.add(new BN('1'))

    let operatorEVMAddress: Address = Address.fromString(stakeCoinsTx.nominator)
    await shardeumState.checkpoint()
    await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
    await shardeumState.commit()

    let updatedOperatorEVMAccount = await shardeumState.getAccount(operatorEVMAddress)

    const nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data
    nodeAccount2.nominator = stakeCoinsTx.nominator
    nodeAccount2.stakeLock = stakeCoinsTx.stake
    nodeAccount2.timestamp = txTimestamp

    if (ShardeumFlags.useAccountWrites) {
      // for operator evm account
      let { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
      console.log('\nAccount Writes: ', accountWrites)
      for (let account of accountWrites.entries()) {
        let addressStr = account[0]
        if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
          continue
        }
        let accountObj = Account.fromRlpSerializedAccount(account[1])
        console.log('\nWritten Account Object: ', accountObj)

        console.log('written account Obj', accountObj)

        let wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }

        updateEthAccountHash(wrappedEVMAccount)
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          wrappedChangedAccount.accountId,
          wrappedChangedAccount,
          txId,
          wrappedChangedAccount.timestamp
        )
      }

      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(
        wrappedStates[nomineeNodeAccount2Address].data
      )
      // for nominee node account
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        nomineeNodeAccount2Address,
        wrappedChangedAccount,
        txId,
        txTimestamp
      )
    }

    // generate a proper receipt for stake tx
    let readableReceipt: ReadableReceipt = {
      status: 1,
      transactionHash: ethTxId,
      transactionIndex: '0x1',
      blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
      nonce: transaction.nonce.toString('hex'),
      blockHash: readableBlocks[latestBlock].hash,
      cumulativeGasUsed: '0x' + new BN(ShardeumFlags.constantTxFee).toString('hex'),
      gasUsed: '0x' + new BN(ShardeumFlags.constantTxFee).toString('hex'),
      logs: [],
      logsBloom: '',
      contractAddress: null,
      from: transaction.getSenderAddress().toString(),
      to: transaction.to ? transaction.to.toString() : null,
      stakeInfo: {
        nominee: nomineeNodeAccount2Address,
      },
      value: transaction.value.toString('hex'),
      data: '0x' + transaction.data.toString('hex'),
    }

    let wrappedReceiptAccount: WrappedEVMAccount = {
      timestamp: txTimestamp,
      ethAddress: ethTxId,
      hash: '',
      readableReceipt,
      amountSpent: totalAmountToDeduct.toString(),
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
          wrappedChangedAccount,
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
    let unstakeCoinsTX: UnstakeCoinsTX = appData.internalTx

    // todo: validate tx timestamp, compare timestamp against account's timestamp

    // todo: validate cert exp

    // set stake value, nominee, cert in OperatorAcc (if not set yet)
    let operatorShardusAddress = toShardusAddress(unstakeCoinsTX.nominator, AccountType.Account)
    let nomineeNodeAccount2Address = unstakeCoinsTX.nominee
    const operatorEVMAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress].data
    operatorEVMAccount.timestamp = txTimestamp

    if (operatorEVMAccount.operatorAccountInfo == null) {
      nestedCountersInstance.countEvent(
        'shardeum-unstaking',
        'unable to apply unstake tx, operator account info does not exist'
      )
      throw new Error(
        `Unable to apply Unstake tx because operator account info does not exist for ${unstakeCoinsTX.nominator}`
      )
    }
    fixDeserializedWrappedEVMAccount(operatorEVMAccount)

    let nodeAccount2: NodeAccount2 = wrappedStates[nomineeNodeAccount2Address].data

    let currentBalance = operatorEVMAccount.account.balance
    let stake = new BN(operatorEVMAccount.operatorAccountInfo.stake, 16)
    let reward = new BN(nodeAccount2.reward, 16)
    let penalty = new BN(nodeAccount2.penalty, 16)
    let txFee = new BN(ShardeumFlags.constantTxFee, 10)
    if (ShardeumFlags.VerboseLogs)
      console.log('calculating new balance after unstake', currentBalance, stake, reward, penalty, txFee)
    let newBalance = currentBalance
      .add(stake)
      .add(reward)
      .sub(penalty)
      .sub(txFee)
    operatorEVMAccount.account.balance = newBalance
    operatorEVMAccount.account.nonce = operatorEVMAccount.account.nonce.add(new BN('1'))

    operatorEVMAccount.operatorAccountInfo.stake = new BN(0)
    operatorEVMAccount.operatorAccountInfo.nominee = null
    operatorEVMAccount.operatorAccountInfo.certExp = null

    let operatorEVMAddress: Address = Address.fromString(unstakeCoinsTX.nominator)
    await shardeumState.checkpoint()
    await shardeumState.putAccount(operatorEVMAddress, operatorEVMAccount.account)
    await shardeumState.commit()

    const stakeInfo = {
      nominee: nomineeNodeAccount2Address,
      rewardStartTime: nodeAccount2.rewardStartTime,
      rewardEndTime: nodeAccount2.rewardEndTime,
      reward,
      penalty,
    }

    nodeAccount2.nominator = null
    nodeAccount2.stakeLock = new BN(0)
    nodeAccount2.timestamp = txTimestamp
    nodeAccount2.penalty = new BN(0)
    nodeAccount2.reward = new BN(0)
    nodeAccount2.rewardStartTime = 0
    nodeAccount2.rewardEndTime = 0

    if (ShardeumFlags.useAccountWrites) {
      // for operator evm account
      let { accounts: accountWrites } = shardeumState._transactionState.getWrittenAccounts()
      console.log('\nAccount Writes: ', accountWrites)
      for (let account of accountWrites.entries()) {
        let addressStr = account[0]
        if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
          continue
        }
        let accountObj = Account.fromRlpSerializedAccount(account[1])
        console.log('\nWritten Account Object: ', accountObj)

        console.log('written account Obj', accountObj)

        let wrappedEVMAccount: WrappedEVMAccount = { ...operatorEVMAccount, account: accountObj }
        updateEthAccountHash(wrappedEVMAccount)
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          wrappedChangedAccount.accountId,
          wrappedChangedAccount,
          txId,
          wrappedChangedAccount.timestamp
        )
      }

      // for nominee node account
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        nomineeNodeAccount2Address,
        wrappedStates[nomineeNodeAccount2Address],
        txId,
        txTimestamp
      )
    }

    // generate a proper receipt for unstake tx
    let readableReceipt: ReadableReceipt = {
      status: 1,
      transactionHash: ethTxId,
      transactionIndex: '0x1',
      blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
      nonce: transaction.nonce.toString('hex'),
      blockHash: readableBlocks[latestBlock].hash,
      cumulativeGasUsed: '0x' + new BN(ShardeumFlags.constantTxFee).toString('hex'),
      gasUsed: '0x' + new BN(ShardeumFlags.constantTxFee).toString('hex'),
      logs: [],
      logsBloom: '',
      contractAddress: null,
      from: transaction.getSenderAddress().toString(),
      to: transaction.to ? transaction.to.toString() : null,
      stakeInfo,
      value: transaction.value.toString('hex'),
      data: '0x' + transaction.data.toString('hex'),
    }

    let wrappedReceiptAccount = {
      timestamp: txTimestamp,
      ethAddress: ethTxId,
      hash: '',
      readableReceipt,
      amountSpent: newBalance.toString(),
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
          wrappedChangedAccount,
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

  let validatorStakedAccounts: Map<string, OperatorAccountInfo> = new Map()

  //ah shoot this binding will not be "thread safe" may need to make it part of the EEI for this tx? idk.
  //shardeumStateManager.setTransactionState(transactionState)

  // loop through the wrappedStates an insert them into the transactionState as first*Reads
  for (let accountId in wrappedStates) {
    if (shardusReceiptAddress === accountId) {
      //have to skip the created receipt account
      continue
    }

    let wrappedEVMAccount: WrappedEVMAccount = wrappedStates[accountId].data
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
    let address
    if (wrappedEVMAccount.accountType === AccountType.ContractCode)
      address = Address.fromString(wrappedEVMAccount.contractAddress)
    else address = Address.fromString(wrappedEVMAccount.ethAddress)

    if (ShardeumFlags.VerboseLogs) {
      let ourNodeShardData = shardus.stateManager.currentCycleShardData.nodeShardData
      let minP = ourNodeShardData.consensusStartPartition
      let maxP = ourNodeShardData.consensusEndPartition
      let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
      let { homePartition } = __ShardFunctions.addressToPartition(
        shardus.stateManager.currentCycleShardData.shardGlobals,
        shardusAddress
      )
      let accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false

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
  //   let senderEVMAddrStr = transaction.getSenderAddress().toString()
  //   let shardusAddress = toShardusAddress(senderEVMAddrStr,  AccountType.Account)
  //   let senderAccount:WrappedEVMAccount = wrappedStates[shardusAddress]
  //  bug here seem like nonce is undefined even though type def indicate, it does.
  //   if(senderAccount.account.nonce >= transaction.nonce ){
  //     throw new Error(`invalid transaction, reason: nonce fail. tx: ${JSON.stringify(tx)}`)
  //   }
  // }

  // Apply the tx
  // const runTxResult = await EVM.runTx({tx: transaction, skipNonce: !ShardeumFlags.CheckNonce, skipBlockGasLimitValidation: true})
  let blockForTx = getOrCreateBlockFromTimestamp(txTimestamp)
  if (ShardeumFlags.VerboseLogs) console.log(`Block for tx ${ethTxId}`, blockForTx.header.number.toNumber())
  let runTxResult: RunTxResult
  let wrappedReceiptAccount: WrappedEVMAccount
  try {
    // if checkNonce is true, we're not gonna skip the nonce
    //@ts-ignore
    EVM.stateManager = null
    //@ts-ignore
    EVM.stateManager = shardeumState
    runTxResult = await EVM.runTx({
      block: blockForTx,
      tx: transaction,
      skipNonce: !ShardeumFlags.CheckNonce,
    })
    if (ShardeumFlags.VerboseLogs) console.log('runTxResult', txId, runTxResult)
  } catch (e) {
    // if (!transactionFailHashMap[ethTxId]) {
    let caAddr = null
    if (!transaction.to) {
      let txSenderEvmAddr = transaction.getSenderAddress().toString()

      let hack0Nonce = new BN(0)
      let caAddrBuf = predictContractAddressDirect(txSenderEvmAddr, hack0Nonce)

      caAddr = '0x' + caAddrBuf.toString('hex')

      let shardusAddr = toShardusAddress(caAddr, AccountType.Account)
      // otherAccountKeys.push(shardusAddr)
      // shardusAddressToEVMAccountInfo.set(shardusAddr, { evmAddress: caAddr, type: AccountType.Account })

      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Predicting contract account address:', caAddr, shardusAddr)
    }
    let readableReceipt: ReadableReceipt = {
      status: 0,
      transactionHash: ethTxId,
      transactionIndex: '0x1',
      blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
      nonce: transaction.nonce.toString('hex'),
      blockHash: readableBlocks[latestBlock].hash,
      cumulativeGasUsed: '0x',
      logs: null,
      logsBloom: null,
      gasUsed: '0x',
      contractAddress: caAddr,
      from: transaction.getSenderAddress().toString(),
      to: transaction.to ? transaction.to.toString() : null,
      value: transaction.value.toString('hex'),
      data: '0x',
      reason: e.toString(),
    }
    wrappedReceiptAccount = {
      timestamp: txTimestamp,
      ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
      hash: '',
      // receipt: runTxResult.receipt,
      readableReceipt,
      amountSpent: '0',
      txId,
      accountType: AccountType.Receipt,
      txFrom: transaction.getSenderAddress().toString(),
    }
    // if (ShardeumFlags.EVMReceiptsAsAccounts) {
    //   transactionFailHashMap[ethTxId] = wrappedFailReceiptAccount
    //   // const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedFailReceiptAccount)
    //   // if (shardus.applyResponseAddChangedAccount != null) {
    //   //   shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
    //   // }
    // } else {

    //   const shardusWrappedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedFailReceiptAccount)
    //   //communicate this in the message back to sharuds so we can attach it to the fail receipt
    //   shardus.applyResponseAddReceiptData(applyResponse, shardusWrappedAccount, crypto.hashObj(shardusWrappedAccount))
    //   shardus.applyResponseSetFailed(applyResponse, reason)
    //   return applyResponse //return rather than throw exception
    // }
    // }
    shardus.log('Unable to apply transaction', e)
    if (ShardeumFlags.VerboseLogs) console.log('Unable to apply transaction', txId, e)
    // throw new Error(e)
  }
  // Still keeping this here to check later if it may need later
  // if (runTxResult.execResult.exceptionError) {
  //   let readableReceipt: ReadableReceipt = {
  //     status: 0,
  //     transactionHash: ethTxId,
  //     transactionIndex: '0x1',
  //     blockNumber: readableBlocks[latestBlock].number,
  //     nonce: transaction.nonce.toString('hex'),
  //     blockHash: readableBlocks[latestBlock].hash,
  //     cumulativeGasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
  //     gasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
  //     logs: null,
  //     contractAddress: runTxResult.createdAddress ? runTxResult.createdAddress.toString() : null,
  //     from: transaction.getSenderAddress().toString(),
  //     to: transaction.to ? transaction.to.toString() : null,
  //     value: transaction.value.toString('hex'),
  //     data: '0x' + transaction.data.toString('hex'),
  //   }
  //   let wrappedFailReceiptAccount: WrappedEVMAccount = {
  //     timestamp: txTimestamp,
  //     ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
  //     hash: '',
  //     receipt: runTxResult.receipt,
  //     readableReceipt,
  //     txId,
  //     accountType: AccountType.Receipt,
  //     txFrom: transaction.getSenderAddress().toString(),
  //   }
  //   if(ShardeumFlags.EVMReceiptsAsAccounts){
  //     // transactionFailHashMap[ethTxId] = wrappedFailReceiptAccount
  //     const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedFailReceiptAccount)
  //     if (shardus.applyResponseAddChangedAccount != null) {
  //       shardus.applyResponseAddChangedAccount(applyResponse, wrappedChangedAccount.accountId, wrappedChangedAccount, txId, wrappedChangedAccount.timestamp)
  //     }
  //     shardeumStateManager.unsetTransactionState()
  //     return applyResponse //return rather than throw exception
  //   } else {
  //     //keep this for now but maybe remove it soon
  //     // transactionFailHashMap[ethTxId] = wrappedFailReceiptAccount

  //     //put this on the fail receipt. we need a way to pass it in the exception!
  //     const shardusWrappedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedFailReceiptAccount)
  //     shardus.applyResponseAddReceiptData(applyResponse,shardusWrappedAccount, crypto.hashObj(shardusWrappedAccount))
  //     shardus.applyResponseSetFailed(applyResponse, reason)
  //     return applyResponse //return rather than throw exception
  //   }
  //   // throw new Error(`invalid transaction, reason: ${JSON.stringify(runTxResult.execResult.exceptionError)}. tx: ${JSON.stringify(tx)}`)
  // }
  if (ShardeumFlags.VerboseLogs) console.log('DBG', 'applied tx', txId, runTxResult)
  if (ShardeumFlags.VerboseLogs) console.log('DBG', 'applied tx eth', ethTxId, runTxResult)

  if (ShardeumFlags.AppliedTxsMaps) {
    shardusTxIdToEthTxId[txId] = ethTxId // todo: fix that this is getting set too early, should wait untill after TX consensus

    // this is to expose tx data for json rpc server
    appliedTxs[ethTxId] = {
      txId: ethTxId,
      injected: tx,
      receipt: { ...runTxResult, nonce: transaction.nonce.toString('hex'), status: 1 },
    }
  }

  // if (ShardeumFlags.temporaryParallelOldMode === true) {
  //   //This is also temporary.  It will move to the UpdateAccountFull code once we wrap the receipt a an account type
  //   // shardus-global-server wont be calling all of the UpdateAccountFull calls just yet though so we need this here
  //   // but it is ok to start adding the code that handles receipts in UpdateAccountFull and understand it will get called
  //   // soon

  //   // TEMPORARY HACK
  //   // store contract account, when shardus-global-server has more progress we can disable this
  //   if (runTxResult.createdAddress) {
  //     let ethAccountID = runTxResult.createdAddress.toString()
  //     let shardusAddress = toShardusAddress(ethAccountID, AccountType.Account)
  //     let contractAccount = await EVM.stateManager.getAccount(runTxResult.createdAddress)
  //     let wrappedEVMAccount = {
  //       timestamp: 0,
  //       account: contractAccount,
  //       ethAddress: ethAccountID,
  //       hash: '',
  //       accountType: AccountType.Account,
  //     }

  //     WrappedEVMAccountFunctions.updateEthAccountHash(wrappedEVMAccount)

  //     //accounts[shardusAddress] = wrappedEVMAccount
  //     await AccountsStorage.setAccount(shardusAddress, wrappedEVMAccount)

  //     if (ShardeumFlags.VerboseLogs) console.log('Contract account stored', wrappedEVMAccount)
  //   }
  // }

  //get a list of accounts or CA keys that have been written to
  //This is important because the EVM could change many accounts or keys that we are not aware of
  //the transactionState is what accumulates the writes that we need
  let {
    accounts: accountWrites,
    contractStorages: contractStorageWrites,
    contractBytes: contractBytesWrites,
  } = shardeumState._transactionState.getWrittenAccounts()

  if (ShardeumFlags.VerboseLogs) console.log(`DBG: all contractStorages writes`, contractStorageWrites)

  for (let contractStorageEntry of contractStorageWrites.entries()) {
    //1. wrap and save/update this to shardeum accounts[] map
    let addressStr = contractStorageEntry[0]
    let contractStorageWrites = contractStorageEntry[1]
    for (let [key, value] of contractStorageWrites) {
      // do we need .entries()?
      let wrappedEVMAccount: WrappedEVMAccount = {
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
          wrappedChangedAccount,
          txId,
          wrappedChangedAccount.timestamp
        )
      }
    }
  }

  //Keep a map of CA addresses to codeHash
  //use this later in the loop of account updates to set the correct account code hash values
  let accountToCodeHash: Map<string, Buffer> = new Map()

  for (let contractBytesEntry of contractBytesWrites.entries()) {
    //1. wrap and save/update this to shardeum accounts[] map
    let addressStr = '0x' + contractBytesEntry[0]
    let contractByteWrite: ContractByteWrite = contractBytesEntry[1]

    let wrappedEVMAccount: WrappedEVMAccount = {
      timestamp: txTimestamp,
      codeHash: contractByteWrite.codeHash,
      codeByte: contractByteWrite.contractByte,
      ethAddress: addressStr,
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
          wrappedChangedAccount,
          txId,
          wrappedChangedAccount.timestamp
        )
      }
    }
  }

  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('DBG: all account writes', shardeumState._transactionState.logAccountWrites(accountWrites))

  // Handle Account type last, because CAs may depend on CA:Storage or CA:Bytecode updates
  //wrap these accounts and keys up and add them to the applyResponse as additional involved accounts
  for (let account of accountWrites.entries()) {
    //1. wrap and save/update this to shardeum accounts[] map
    let addressStr = account[0]
    if (ShardeumFlags.Virtual0Address && addressStr === zeroAddressStr) {
      //do not inform shardus about the 0 address account
      continue
    }
    let accountObj = Account.fromRlpSerializedAccount(account[1])

    let wrappedEVMAccount: WrappedEVMAccount = {
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

    updateEthAccountHash(wrappedEVMAccount)

    // I think data is unwrapped too much and we should be using wrappedEVMAccount directly as data
    const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedEVMAccount)

    // and the added it to the apply response (not implemented yet)
    //Attach the written account data to the apply response.  This will allow it to be shared with other shards if needed.
    if (shardus.applyResponseAddChangedAccount != null) {
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        wrappedChangedAccount.accountId,
        wrappedChangedAccount,
        txId,
        wrappedChangedAccount.timestamp
      )
    }
  }

  let txSenderEvmAddr = transaction.getSenderAddress().toString()
  //TODO also create an account for the receipt (nested in the returned runTxResult should be a receipt with a list of logs)
  // We are ready to loop over the receipts and add them
  if (runTxResult) {
    let runState: RunStateWithLogs = runTxResult.execResult.runState
    let logs = []
    if (runState == null) {
      if (ShardeumFlags.VerboseLogs) console.log(`No runState found in the receipt for ${txId}`)
    } else {
      logs = runState.logs.map((l: any[]) => {
        return {
          logIndex: '0x1',
          blockNumber: readableBlocks[latestBlock].number,
          blockHash: readableBlocks[latestBlock].hash,
          transactionHash: ethTxId,
          transactionIndex: '0x1',
          address: bufferToHex(l[0]),
          topics: l[1].map(i => bufferToHex(i)),
          data: bufferToHex(l[2]),
        }
      })
    }

    let readableReceipt: ReadableReceipt = {
      status: runTxResult.receipt['status'],
      transactionHash: ethTxId,
      transactionIndex: '0x1',
      blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
      nonce: transaction.nonce.toString('hex'),
      blockHash: readableBlocks[latestBlock].hash,
      cumulativeGasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
      gasUsed: '0x' + runTxResult.gasUsed.toString('hex'),
      logs: logs,
      logsBloom: bufferToHex(runTxResult.receipt.bitvector),
      contractAddress: runTxResult.createdAddress ? runTxResult.createdAddress.toString() : null,
      from: transaction.getSenderAddress().toString(),
      to: transaction.to ? transaction.to.toString() : null,
      value: transaction.value.toString('hex'),
      data: '0x' + transaction.data.toString('hex'),
    }
    if (runTxResult.execResult.exceptionError) {
      readableReceipt.reason = runTxResult.execResult.exceptionError.error
    }
    wrappedReceiptAccount = {
      timestamp: txTimestamp,
      ethAddress: ethTxId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
      hash: '',
      receipt: runTxResult.receipt,
      readableReceipt,
      amountSpent: runTxResult.amountSpent.toString(),
      txId,
      accountType: AccountType.Receipt,
      txFrom: txSenderEvmAddr,
    }
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`DBG Receipt Account for txId ${ethTxId}`, wrappedReceiptAccount)
  }

  if (ShardeumFlags.EVMReceiptsAsAccounts) {
    const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
    if (shardus.applyResponseAddChangedAccount != null) {
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        wrappedChangedAccount.accountId,
        wrappedChangedAccount,
        txId,
        wrappedChangedAccount.timestamp
      )
    }
  } else {
    const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
    //put this in the apply response
    shardus.applyResponseAddReceiptData(
      applyResponse,
      receiptShardusAccount,
      crypto.hashObj(receiptShardusAccount)
    )
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
}
