import { nestedCountersInstance, Shardus, ShardusTypes } from '@shardus/core';
import * as crypto from '@shardus/crypto-utils';
import { Address, bigIntToHex } from '@ethereumjs/util';
import { networkAccount } from '../shardeum/shardeumConstants';
import { createInternalTxReceipt, getApplyTXState, logFlags, shardeumGetTime } from '../index';
import { toShardusAddress } from '../shardeum/evmAddress';
import { ShardeumFlags } from '../shardeum/shardeumFlags';
import { AccountType, ClaimRewardTX, InternalTXType, isNetworkAccount, isNodeAccount2, NetworkAccount, NodeAccount2, WrappedEVMAccount, WrappedStates, } from '../shardeum/shardeumTypes';
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions';
import * as AccountsStorage from '../storage/accountStorage';
import { scaleByStabilityFactor, sleep, _base16BNParser, _readableSHM, generateTxId } from '../utils';
export async function injectClaimRewardTx(shardus, eventData: ShardusTypes.ShardusEvent | any): Promise<{
    success: boolean;
    reason: string;
    status: number;
}> {
    let wrappedData: ShardusTypes.WrappedData = await shardus.getLocalOrRemoteAccount(eventData.publicKey);
    if (wrappedData == null || wrappedData.data == null) {
        //try one more time
        wrappedData = await shardus.getLocalOrRemoteAccount(eventData.publicKey);
        if (wrappedData == null || wrappedData.data == null) {
            return;
        }
    }
    const nodeAccount = wrappedData.data as NodeAccount2;
    // check if the rewardStartTime is negative
    if (nodeAccount.rewardStartTime < 0) {
        return;
    }
    // check if nodeAccount.rewardEndTime is already set to eventData.time
    if (nodeAccount.rewardEndTime >= eventData.additionalData.txData.endTime) {
        return;
    }
    let tx = {
        nominee: eventData.publicKey,
        nominator: nodeAccount.nominator,
        timestamp: shardeumGetTime(),
        deactivatedNodeId: eventData.nodeId,
        nodeDeactivatedTime: eventData.additionalData.txData.endTime,
        cycle: eventData.cycle,
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
    } as Omit<ClaimRewardTX, 'sign'>;
    if (ShardeumFlags.txHashingFix) {
        // to make sure that differnt nodes all submit an equivalent tx that is counted as the same tx,
        // we need to make sure that we have a determinstic timestamp
        const cycleEndTime = eventData.time;
        let futureTimestamp = cycleEndTime * 1000;
        while (futureTimestamp < shardeumGetTime()) {
            futureTimestamp += 30 * 1000;
        }
        const waitTime = futureTimestamp - shardeumGetTime();
        tx.timestamp = futureTimestamp;
        // since we have to pick a future timestamp, we need to wait until it is time to submit the tx
        await sleep(waitTime);
        // todo: aamir keep an eye on the waitTime
    }
    tx = shardus.signAsNode(tx);
    if (ShardeumFlags.VerboseLogs) {
        const latestCycles = shardus.getLatestCycles(1);
        const txId = generateTxId(tx);
    }
    const injectResult = await shardus.put(tx);
    return injectResult;
}
export function validateClaimRewardTx(tx: ClaimRewardTX, shardus: Shardus): {
    isValid: boolean;
    reason: string;
} {
    if (!tx.nominee || tx.nominee === '' || tx.nominee.length !== 64) {
        return { isValid: false, reason: 'Invalid nominee address' };
    }
    if (!tx.deactivatedNodeId || tx.deactivatedNodeId === '' || tx.deactivatedNodeId.length !== 64) {
        return { isValid: false, reason: 'Invalid deactivatedNodeId' };
    }
    if (tx.nodeDeactivatedTime <= 0) {
        return { isValid: false, reason: 'duration must be > 0' };
    }
    if (tx.timestamp <= 0) {
        return { isValid: false, reason: 'Duration in tx must be > 0' };
    }
    if (shardus.getNode(tx.deactivatedNodeId)) {
        return { isValid: false, reason: 'Node is still active' };
    }
    try {
        if (!crypto.verifyObj(tx)) {
            return { isValid: false, reason: 'Invalid signature for ClaimReward tx' };
        }
    }
    catch (e) {
        return { isValid: false, reason: 'Invalid signature for ClaimReward tx' };
    }
    return { isValid: true, reason: '' };
}
export function validateClaimRewardState(tx: ClaimRewardTX, wrappedStates: WrappedStates, shardus, isAdminCertUnexpired = false): {
    result: string;
    reason: string;
} {
    const isValid = crypto.verifyObj(tx);
    if (!isValid) {
        return { result: 'fail', reason: 'Invalid signature' };
    }
    if (!ShardeumFlags.enableClaimRewardAdminCert && isAdminCertUnexpired) {
        return { result: 'fail', reason: 'Reward is disabled for admin cert or golden ticket node' };
    }
    /* eslint-disable security/detect-object-injection */
    let nodeAccount: NodeAccount2;
    if (isNodeAccount2(wrappedStates[tx.nominee].data)) {
        nodeAccount = wrappedStates[tx.nominee].data as NodeAccount2;
    }
    // check if the rewardStartTime is negative
    if (nodeAccount.rewardStartTime < 0) {
        return { result: 'fail', reason: 'rewardStartTime is less than 0' };
    }
    // check if nodeAccount.rewardEndTime is already set to tx.nodeDeactivatedTime
    if (nodeAccount.rewardEndTime >= tx.nodeDeactivatedTime) {
        return { result: 'fail', reason: 'rewardEndTime is already set' };
    }
    const nominee_nodeAcc = wrappedStates[tx.nominee].data as NodeAccount2;
    if (nominee_nodeAcc.nominator !== tx.nominator) {
        return { result: 'fail', reason: 'tx.nominator does not match' };
    }
    return { result: 'pass', reason: 'valid' };
}
export async function applyClaimRewardTx(shardus, tx: ClaimRewardTX, wrappedStates: WrappedStates, txId: string, txTimestamp: number, applyResponse: ShardusTypes.ApplyResponse, isAdminCertUnexpired = false): Promise<void> {
    const isValidRequest = validateClaimRewardState(tx, wrappedStates, shardus, isAdminCertUnexpired);
    if (isValidRequest.result === 'fail') {
        // throw new Error(
        //   `applyClaimReward failed validateClaimRewardState nominee ${tx.nominee} ${isValidRequest.reason}`
        // )
        shardus.applyResponseSetFailed(applyResponse, `applyClaimReward failed validateClaimRewardState nominee ${tx.nominee} ${isValidRequest.reason}`);
        return;
    }
    const operatorShardusAddress = toShardusAddress(tx.nominator, AccountType.Account);
    /* eslint-disable security/detect-object-injection */
    let nodeAccount: NodeAccount2;
    if (isNodeAccount2(wrappedStates[tx.nominee].data)) {
        nodeAccount = wrappedStates[tx.nominee].data as NodeAccount2;
    }
    let network: NetworkAccount;
    if (isNetworkAccount(wrappedStates[networkAccount].data)) {
        network = wrappedStates[networkAccount].data as NetworkAccount;
    }
    let operatorAccount: WrappedEVMAccount;
    if (WrappedEVMAccountFunctions.isWrappedEVMAccount(wrappedStates[operatorShardusAddress].data)) {
        operatorAccount = wrappedStates[operatorShardusAddress].data as WrappedEVMAccount;
    }
    /* eslint-enable security/detect-object-injection */
    const currentRate = _base16BNParser(network.current.nodeRewardAmountUsd); //BigInt(Number('0x' +
    const rate = nodeAccount.rewardRate > currentRate ? nodeAccount.rewardRate : currentRate;
    const nodeRewardAmount = scaleByStabilityFactor(rate, network);
    const nodeRewardInterval = BigInt(network.current.nodeRewardInterval);
    if (nodeAccount.rewardStartTime < 0) {
        shardus.applyResponseSetFailed(applyResponse, `applyClaimReward failed because rewardStartTime is less than 0`);
        return;
    }
    let durationInNetwork = tx.nodeDeactivatedTime - nodeAccount.rewardStartTime;
    if (durationInNetwork < 0) {
        //throw new Error(`applyClaimReward failed because durationInNetwork is less than or equal 0`)
        shardus.applyResponseSetFailed(applyResponse, `applyClaimReward failed because durationInNetwork is less than 0`);
        return;
    }
    // special case for seed nodes:
    // they have 0 rewardStartTime and will not be rewarded but the claim tx should still be applied
    if (nodeAccount.rewardStartTime === 0) {
        durationInNetwork = 0;
    }
    if (nodeAccount.rewarded === true) {
        //throw new Error(`applyClaimReward failed already rewarded`)
        shardus.applyResponseSetFailed(applyResponse, `applyClaimReward failed already rewarded`);
        return;
    }
    nodeAccount.rewardEndTime = tx.nodeDeactivatedTime;
    //we multiply fist then devide to preserve precision
    let rewardedAmount = nodeRewardAmount * BigInt(durationInNetwork * 1000); // Convert from seconds to milliseconds
    //update total reward var so it can be logged
    rewardedAmount = rewardedAmount / nodeRewardInterval;
    //re-parse reward since it was saved as hex
    nodeAccount.reward = _base16BNParser(nodeAccount.reward);
    //add the reward because nodes can cycle without unstaking
    nodeAccount.reward = nodeAccount.reward + rewardedAmount;
    nodeAccount.timestamp = txTimestamp;
    nodeAccount.rewarded = true;
    // update the node account historical stats
    nodeAccount.nodeAccountStats.totalReward =
        _base16BNParser(nodeAccount.nodeAccountStats.totalReward) + rewardedAmount;
    nodeAccount.nodeAccountStats.history.push({
        b: nodeAccount.rewardStartTime,
        e: nodeAccount.rewardEndTime,
    });
    const shardeumState = getApplyTXState(txId);
    shardeumState._transactionState.appData = {};
    if (operatorAccount?.operatorAccountInfo == null) {
        shardus.applyResponseSetFailed(applyResponse, 'applyClaimReward failed because `operatorAccountInfo` is null');
        return;
    }
    // update the operator historical stats
    operatorAccount.operatorAccountInfo.operatorStats.history.push({
        b: nodeAccount.rewardStartTime,
        e: nodeAccount.rewardEndTime,
    });
    operatorAccount.operatorAccountInfo.operatorStats.totalNodeReward =
        _base16BNParser(operatorAccount.operatorAccountInfo.operatorStats.totalNodeReward) + rewardedAmount;
    operatorAccount.operatorAccountInfo.operatorStats.totalNodeTime += durationInNetwork;
    operatorAccount.operatorAccountInfo.operatorStats.lastStakedNodeKey =
        operatorAccount.operatorAccountInfo.nominee;
    // hmm may be we don't need this as we are not updating nonce and balance
    const operatorEVMAddress: Address = Address.fromString(tx.nominator);
    await shardeumState.checkpoint();
    await shardeumState.putAccount(operatorEVMAddress, operatorAccount.account);
    await shardeumState.commit();
    operatorAccount.timestamp = txTimestamp;
    if (ShardeumFlags.useAccountWrites) {
        let wrappedChangedNodeAccount: ShardusTypes.WrappedData;
        if (WrappedEVMAccountFunctions.isInternalAccount(nodeAccount)) {
            wrappedChangedNodeAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(nodeAccount);
        }
        shardus.applyResponseAddChangedAccount(applyResponse, tx.nominee, wrappedChangedNodeAccount, txId, txTimestamp);
        let wrappedChangedOperatorAccount: ShardusTypes.WrappedData;
        /* eslint-disable security/detect-object-injection */
        if (WrappedEVMAccountFunctions.isWrappedEVMAccount(wrappedStates[operatorShardusAddress].data)) {
            wrappedChangedOperatorAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedStates[operatorShardusAddress].data as WrappedEVMAccount);
        }
        /* eslint-enable security/detect-object-injection */
        shardus.applyResponseAddChangedAccount(applyResponse, operatorShardusAddress, wrappedChangedOperatorAccount, txId, txTimestamp);
    }
    if (ShardeumFlags.supportInternalTxReceipt) {
        createInternalTxReceipt(shardus, applyResponse, tx, tx.nominee, tx.nominator, txTimestamp, txId, bigIntToHex(BigInt(0)), // 0 amountSpent
        rewardedAmount);
    }
}