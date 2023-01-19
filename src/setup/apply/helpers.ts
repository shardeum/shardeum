import Common from '@ethereumjs/common'
import { Shardus } from '@shardus/core'
import { ShardeumState, TransactionState } from '../../state'
import {
  accountInvolved,
  accountMiss,
  contractStorageInvolved,
  contractStorageMiss,
  tryGetRemoteAccountCBNoOp,
} from '../callbacks'

export function getApplyTXState(
  txId: string,
  shardeumStateTXMap: Map<string, ShardeumState>,
  evmCommon: Common,
  shardus: Shardus
): ShardeumState {
  let shardeumState = shardeumStateTXMap.get(txId)
  if (shardeumState == null) {
    shardeumState = new ShardeumState({ common: evmCommon })
    let transactionState = new TransactionState()
    transactionState.initData(
      shardeumState,
      {
        storageMiss: accountMiss,
        contractStorageMiss,
        accountInvolved: accountInvolved(shardus),
        contractStorageInvolved: contractStorageInvolved(shardus),
        tryGetRemoteAccountCB: tryGetRemoteAccountCBNoOp,
        monitorEventCB: shardus.monitorEvent.bind(shardus),
      },
      txId,
      undefined,
      undefined
    )
    shardeumState.setTransactionState(transactionState)
    shardeumStateTXMap.set(txId, shardeumState)
  }
  return shardeumState
}
