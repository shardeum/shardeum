import { Utils } from '@shardeum-foundation/lib-types'
import Ajv, { ErrorObject } from 'ajv'
import { getVerifyFunction } from '../../utils/serialization/SchemaHelpers'
import { initInjectTxReq } from './InjectTxReq'
import { initSign } from './SignSchema'
import { initPenaltyTX } from './PenaltyTXSchema'
import { initJoinAppData } from './JoinAppData'
import { initStakeResp } from './StakeResp'
import { initStakeCert } from './StakeCert'
import { initRemoveNodeCert } from './RemoveNodeCert'
import { initApplyChangeConfigTx } from './ApplyChangeConfigTxSchema'
import { initApplyNetworkParamTx } from './ApplyNetworkParamTxSchema'
import { initChangeConfigTx } from './ChangeConfigTxSchema'
import { initChangeNetworkParamTx } from './ChangeNetworkParamTxSchema'
import { initSetCertTimeTx } from './SetCertTimeTxSchema'
import { initStakeTx } from './StakeTxSchema'
import { initInitRewardTimesTx } from './InitRewardTimesTxSchema'
import { initClaimRewardTx } from './ClaimRewardTxSchema'
import { initTransferFromSecureAccountTx } from './TransferFromSecureAccountTxSchema'
import { initUnstakeTx } from './UnstakeTxSchema'
import { initInitNetworkTx } from './InitNetworkTxSchema'

export function initAjvSchemas(): void {
  initSign()
  initInjectTxReq()
  initPenaltyTX()
  initJoinAppData()
  initStakeResp()
  initStakeCert()
  initRemoveNodeCert()
  initApplyChangeConfigTx()
  initApplyNetworkParamTx()
  initChangeConfigTx()
  initChangeNetworkParamTx()
  initClaimRewardTx()
  initInitNetworkTx()
  initInitRewardTimesTx()
  initSetCertTimeTx()
  initStakeTx()
  initUnstakeTx()
  initTransferFromSecureAccountTx()
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

export function filterObjectByWhitelistedProps(obj: any, whitelistedProps: { name: string; type: string }[]): any {
  const ajv = new Ajv()

  const newObject = Object.keys(obj)
    .filter((key) => whitelistedProps.map((item) => item.name).includes(key))
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})

  const schema = {
    type: 'object',
    properties: whitelistedProps.reduce((acc, prop) => {
      acc[prop.name] = { type: prop.type }
      return acc
    }, {}),
    additionalProperties: false,
  }

  const validate = ajv.compile(schema)

  if (validate(newObject)) {
    return newObject
  } else {
    console.log('validation errors in filterObjectByWhitelistedProps: ', validate.errors)
    return {}
  }
}
