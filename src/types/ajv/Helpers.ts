import { Utils } from '@shardeum-foundation/lib-types'
import { ErrorObject } from 'ajv'
import { getVerifyFunction } from '../../utils/serialization/SchemaHelpers'
import { initInjectTxReq } from './InjectTxReq'
import { initSign } from './SignSchema';
import { initPenaltyTX } from './PenaltyTXSchema';
import { initStakeResp } from './StakeResp';

export function initAjvSchemas(): void {
  initSign()
  initInjectTxReq()
  initPenaltyTX()
  initStakeResp()
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
