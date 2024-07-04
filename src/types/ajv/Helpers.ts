import { ErrorObject } from 'ajv'
import { getVerifyFunction } from '../../utils/serialization/SchemaHelpers'
import { Utils } from '@shardus/types'
import { initEthGetBlockByHashReq } from './EthGetBlockByHashReq'
import { initContractCallReq } from './ContractCallReq'
import { initDebugAppDataHashReq } from './DebugAppDataHashReq'
import { initEthGetBlockHashesReq } from './EthGetBlockHashesReq'
import { initEthGetBlockHashesResp } from './EthGetBlockHashesResp'
import { initGenesisAccountsReq } from './GenesisAccountsReq'
import { initQueryCertificateReq } from './QueryCertificateReq'
import { initTxHashReq } from './TxHashReq'

export function initAjvSchemas(): void {
  initContractCallReq()
  initDebugAppDataHashReq()
  initEthGetBlockByHashReq()
  initEthGetBlockHashesReq()
  initEthGetBlockHashesResp()
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
