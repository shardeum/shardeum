import { ErrorObject } from 'ajv'
import { getVerifyFunction } from '../../utils/serialization/SchemaHelpers'
import { Utils } from '@shardus/types'
import { initEthGetBlockByHashReq } from './EthGetBlockByHashReq'
import { initAccountReq } from './AccountReq'
import { initContractAccessListReq } from './ContractAccessListReq'
import { initContractCallReq } from './ContractCallReq'
import { initContractEstimateGasReq } from './ContractEstimateGasReq'
import { initDebugAppDataHashReq } from './DebugAppDataHashReq'
import { initDebugSetEventBlockThresholdReq } from './DebugSetEventBlockThresholdReq'
import { initDebugSetServicePointReq } from './DebugSetServicePointReq'
import { initDebugSetShardeumFlagReq } from './DebugSetShardeumFlagReq'
import { initDumpStorageReq } from './DumpStorageReq'
import { initEthGetBlockByNumberReq } from './EthGetBlockByNumberReq'
import { initEthGetBlockHashesReq } from './EthGetBlockHashesReq'
import { initEthGetBlockHashesResp } from './EthGetBlockHashesResp'
import { initEthGetCodeReq } from './EthGetCodeReq'
import { initGenesisAccountsReq } from './GenesisAccountsReq'
import { initQueryCertificateReq } from './QueryCertificateReq'
import { initTxHashReq } from './TxHashReq'
import { initDebugPointsReq } from './DebugPointsReq'

export function initAjvSchemas(): void {
  initAccountReq()
  initContractAccessListReq()
  initContractCallReq()
  initContractEstimateGasReq()
  initDebugAppDataHashReq()
  initDebugPointsReq()
  initDebugSetEventBlockThresholdReq()
  initDebugSetServicePointReq()
  initDebugSetShardeumFlagReq()
  initDumpStorageReq()
  initEthGetBlockByHashReq()
  initEthGetBlockByNumberReq()
  initEthGetBlockHashesReq()
  initEthGetBlockHashesResp()
  initEthGetCodeReq()
  initGenesisAccountsReq()
  initQueryCertificateReq()
  initTxHashReq()
}

export function verifyPayload<T>(name: string, payload: T): string[] | null {
  const verifyFn = getVerifyFunction(name)
  const isValid = verifyFn(payload)
  if (!isValid) {
    return parseAjvErrors(verifyFn.errors)
  } else {
    return null
  }
}
function parseAjvErrors(errors: Array<ErrorObject> | null): string[] | null {
  if (!errors) return null

  return errors.map((error) => {
    let errorMsg = `${error.message}`
    if (error.params && Object.keys(error.params).length > 0) {
      errorMsg += `: ${Utils.safeStringify(error.params)}`
    }
    return errorMsg
  })
}
