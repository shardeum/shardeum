import { nestedCountersInstance, Shardus, ShardusTypes } from '@shardus/core';
import * as crypto from '@shardus/crypto-utils';
import { hashSignedObj } from '../setup/helpers';
import { ShardeumFlags } from '../shardeum/shardeumFlags';
import { InitRewardTimes, InternalTx, InternalTXType, isNetworkAccount, isNodeAccount2, NetworkAccount, NodeAccount2, WrappedStates, } from '../shardeum/shardeumTypes';
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions';
import { sleep, generateTxId, _base16BNParser } from '../utils';
import { createInternalTxReceipt, shardeumGetTime, logFlags } from '..';
import { networkAccount } from '../shardeum/shardeumConstants';
export async function injectInitRewardTimesTx(shardus, eventData: ShardusTypes.ShardusEvent): Promise<unknown> {
    const startTime = eventData.additionalData.txData.startTime;
    let tx = {
        isInternalTx: true,
        internalTXType: InternalTXType.InitRewardTimes,
        nominee: eventData.publicKey,
        nodeActivatedTime: startTime,
        timestamp: shardeumGetTime(),
    } as InitRewardTimes;
    // check if this node has node account data
    let wrappedData: ShardusTypes.WrappedData = await shardus.getLocalOrRemoteAccount(eventData.publicKey);
    if (wrappedData == null || wrappedData.data == null) {
        //try one more time
        wrappedData = await shardus.getLocalOrRemoteAccount(eventData.publicKey);
        if (wrappedData == null || wrappedData.data == null) {
            return;
        }
    }
    const nodeAccount = wrappedData.data as NodeAccount2;
    // check if the nodeAccount has nomimator data
    if (nodeAccount.nominator == null) {
        return;
    }
    // check if nodeAccount.rewardStartTime is already set to eventData.time
    if (nodeAccount.rewardStartTime >= tx.nodeActivatedTime) {
        return;
    }
    if (ShardeumFlags.txHashingFix) {
        // to make sure that different nodes all submit an equivalent tx that is counted as the same tx,
        // we need to make sure that we have a deterministic timestamp
        const cycleEndTime = eventData.time;
        let futureTimestamp = cycleEndTime * 1000;
        while (futureTimestamp < shardeumGetTime()) {
            futureTimestamp += 30 * 1000;
        }
        const waitTime = futureTimestamp - shardeumGetTime();
        tx.timestamp = futureTimestamp;
        // since we have to pick a future timestamp, we need to wait until it is time to submit the tx
        await sleep(waitTime);
    }
    tx = shardus.signAsNode(tx);
    if (ShardeumFlags.VerboseLogs) {
        const txId = generateTxId(tx);
    }
    return await shardus.put(tx);
}
export function validateFields(tx: InitRewardTimes, shardus: Shardus): {
    success: boolean;
    reason: string;
} {
    if (!tx.nominee || tx.nominee === '' || tx.nominee.length !== 64) {
        return { success: false, reason: 'invalid nominee field in setRewardTimes Tx' };
    }
    if (!tx.nodeActivatedTime) {
        return { success: false, reason: 'nodeActivatedTime field is not found in setRewardTimes Tx' };
    }
    if (tx.nodeActivatedTime < 0 || tx.nodeActivatedTime > shardeumGetTime()) {
        return { success: false, reason: 'nodeActivatedTime is not correct in setRewardTimes Tx' };
    }
    const isValid = crypto.verifyObj(tx);
    if (!isValid) {
        return { success: false, reason: 'Invalid signature' };
    }
    return { success: true, reason: 'valid' };
}
export function validate(tx: InitRewardTimes, shardus: Shardus): {
    result: string;
    reason: string;
} {
    const isValid = crypto.verifyObj(tx);
    if (!isValid) {
        return { result: 'fail', reason: 'Invalid signature' };
    }
    return { result: 'pass', reason: 'valid' };
}
export function validateInitRewardState(tx: InitRewardTimes, wrappedStates: WrappedStates): {
    result: string;
    reason: string;
} {
    const isValid = crypto.verifyObj(tx);
    if (!isValid) {
        return { result: 'fail', reason: 'Invalid signature' };
    }
    /* eslint-disable security/detect-object-injection */
    let nodeAccount: NodeAccount2;
    if (isNodeAccount2(wrappedStates[tx.nominee].data)) {
        nodeAccount = wrappedStates[tx.nominee].data as NodeAccount2;
    }
    // check if nodeAccount.rewardStartTime is already set to tx.nodeActivatedTime
    if (nodeAccount.rewardStartTime >= tx.nodeActivatedTime) {
        return { result: 'fail', reason: 'rewardStartTime is already set' };
    }
    if (nodeAccount.timestamp >= tx.timestamp) {
        return { result: 'fail', reason: 'timestamp is already set' };
    }
    return { result: 'pass', reason: 'valid' };
}
export function apply(shardus, tx: InitRewardTimes, txId: string, txTimestamp: number, wrappedStates: WrappedStates, applyResponse: ShardusTypes.ApplyResponse): void {
    let nodeAccount: NodeAccount2;
    const acct = wrappedStates[tx.nominee].data;
    if (isNodeAccount2(acct)) {
        nodeAccount = acct;
    }
    else
        throw new Error('tx.nominee is not a NodeAccount2');
    // check the account state against the tx
    const isValidRequest = validateInitRewardState(tx, wrappedStates);
    if (isValidRequest.result === 'fail') {
        shardus.applyResponseSetFailed(applyResponse, `initRewardTimesTx failed validateInitRewardState nominee ${tx.nominee} ${isValidRequest.reason}`);
        return;
    }
    let network: NetworkAccount;
    if (wrappedStates[networkAccount]?.data && isNetworkAccount(wrappedStates[networkAccount].data)) {
        network = wrappedStates[networkAccount].data as NetworkAccount;
    }
    nodeAccount.rewardStartTime = tx.nodeActivatedTime;
    nodeAccount.rewardEndTime = 0;
    nodeAccount.timestamp = txTimestamp;
    nodeAccount.rewardRate = network ? _base16BNParser(network.current.nodeRewardAmountUsd) : BigInt(0);
    if (ShardeumFlags.rewardedFalseInInitRewardTx)
        nodeAccount.rewarded = false;
    if (ShardeumFlags.useAccountWrites) {
        const wrappedAccount: NodeAccount2 = nodeAccount; // eslint-disable-line @typescript-eslint/no-explicit-any
        const wrappedChangedNodeAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedAccount);
        shardus.applyResponseAddChangedAccount(applyResponse, tx.nominee, wrappedChangedNodeAccount, txId, txTimestamp);
    }
    if (ShardeumFlags.supportInternalTxReceipt) {
        createInternalTxReceipt(shardus, applyResponse, tx, tx.nominee, nodeAccount.nominator, txTimestamp, txId);
    }
}