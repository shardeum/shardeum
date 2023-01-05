import { Shardus, ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { BN, isValidAddress } from 'ethereumjs-util'
import { Request } from 'express'
import { toShardusAddress } from '../shardeum/evmAddress'
import {
  AccountType,
  InjectTxResponse,
  NodeAccountQueryResponse,
  WrappedEVMAccount,
} from '../shardeum/shardeumTypes'
import { fixDeserializedWrappedEVMAccount } from '../shardeum/wrappedEVMAccountFunctions'
import { getRandom } from '../utils'
import { shardusGetFromNode, shardusPostToNode, shardusPutToNode } from '../utils/requests'

// constants

const maxNodeAccountRetries = 3

const errNodeAccountNotFound = 'node account not found'
const errNodeBusy = 'node busy'

// types

export interface QueryCertRequest {
  nominee: string
  nominator: string
  sign?: ShardusTypes.Sign
}

export type CertSignaturesResult = {
  success: boolean
  signedStakeCert?: StakeCert
}

export interface StakeCert {
  nominator: string //the operator account that nominated a node account
  nominee: string //the node account that was nominated
  stake: BN //the amount staked
  certExp: number //cert expiration time in seconds
  signs?: ShardusTypes.Sign[] //this is used when when the cert has a list of valid signatures
  sign?: ShardusTypes.Sign //this is use when we need to sign and unsigned cert. signs and sign will not exist yet when sign() is called
}

export interface ValidatorError {
  success: boolean
  reason: string
}

function validateQueryCertRequest(req: QueryCertRequest, rawBody: any): ValidatorError {
  // nominee is NodeAccount2, will need here to verify address with other methods
  // if (!isValidAddress(req.nominee)) {
  //   return { success: false, reason: 'Invalid nominee address' }
  // }
  if (!isValidAddress(req.nominator)) {
    return { success: false, reason: 'Invalid nominator address' }
  }
  try {
    if (!crypto.verifyObj(rawBody)) return { success: false, reason: 'Invalid signature for QueryCert tx' }
  } catch (e) {
    return { success: false, reason: 'Invalid signature for QueryCert tx' }
  }

  return { success: true, reason: '' }
}

/**
 * Query a random consensus node for the current node certificate by calling query-certificate
 * on the chosen node. The nominator is chosen by querying `account/:address` on the
 * randomly chosen consensus node
 *
 * @param shardus
 * @returns
 */
export async function queryCertificate(
  shardus: Shardus,
  publicKey,
  activeNodes
): Promise<CertSignaturesResult | ValidatorError> {
  if (activeNodes.length === 0) {
    return {
      success: false,
      reason: 'activeNodes list is 0 to get query certificate',
    }
  }

  const randomConsensusNode: any = getRandom(activeNodes, 1)[0]

  const callQueryCertificate = async (
    signedCertRequest: QueryCertRequest
  ): Promise<CertSignaturesResult | ValidatorError> => {
    try {
      const res = await shardusPutToNode<CertSignaturesResult>(
        randomConsensusNode,
        '/query-certificate',
        signedCertRequest,
        {
          // Custom timeout because this request is expected to take a while
          timeout: 15000,
        }
      )
      return res.data
    } catch (error) {
      return {
        success: false,
        reason: 'Failed to get query certificate',
      }
    }
  }

  const accountQueryResponse = await getNodeAccountWithRetry(publicKey, activeNodes)
  if (!accountQueryResponse.success) return accountQueryResponse

  const nodeAccountQueryResponse = accountQueryResponse as NodeAccountQueryResponse
  const nominator = nodeAccountQueryResponse.nodeAccount?.nominator

  const certRequest = {
    nominee: publicKey,
    nominator: nominator,
  }
  const signedCertRequest: QueryCertRequest = shardus.signAsNode(certRequest)
  console.log('signedCertRequest', signedCertRequest)

  return await callQueryCertificate(signedCertRequest)
}

export async function getNodeAccountWithRetry(
  nodeAccountId: string,
  activeNodes
): Promise<NodeAccountQueryResponse | ValidatorError> {
  let i = 0
  while (i <= maxNodeAccountRetries) {
    const randomConsensusNode: any = getRandom(activeNodes, 1)[0]
    const resp = await getNodeAccount(randomConsensusNode, nodeAccountId)
    if (resp.success) return resp
    else {
      const err = resp as ValidatorError
      if (err.reason == errNodeAccountNotFound) return err
      else i++
    }
  }
  return { success: false, reason: errNodeBusy }
}

async function getNodeAccount(
  randomConsensusNode: any,
  nodeAccountId: string
): Promise<NodeAccountQueryResponse | ValidatorError> {
  try {
    let queryString = `/account/:address`.replace(':address', nodeAccountId)
    //some reason params object is not working...
    queryString += `?type=${AccountType.NodeAccount2}`
    const res = await shardusGetFromNode<any>(
      randomConsensusNode,
      queryString //,
      //{ params: { type: AccountType.NodeAccount2 } }
    )
    if (!res.data.account) {
      return { success: false, reason: errNodeAccountNotFound }
    }
    if (res.data.error == errNodeBusy) {
      return { success: false, reason: errNodeBusy }
    }
    return { success: true, nodeAccount: res.data.account.data } as NodeAccountQueryResponse
  } catch (error) {
    return { success: false, reason: (error as Error).message }
  }
}

// Move this helper function to utils or somewhere
export async function InjectTxToConsensor(
  randomConsensusNode: any,
  tx: any // Sign Object
): Promise<InjectTxResponse | ValidatorError> {
  try {
    const res = await shardusPostToNode<any>(randomConsensusNode, `/inject`, tx)
    if (!res.data.success) {
      return { success: false, reason: res.data.reason }
    }
    return res.data as InjectTxResponse
  } catch (error) {
    return { success: false, reason: (error as Error).message }
  }
}

export async function queryCertificateHandler(
  req: Request,
  shardus: Shardus
): Promise<CertSignaturesResult | ValidatorError> {
  const queryCertReq = req.body as QueryCertRequest
  const reqValidationResult = validateQueryCertRequest(queryCertReq, req.body)
  if (!reqValidationResult.success) return reqValidationResult

  const operatorAccount = await getEVMAccountDataForAddress(shardus, queryCertReq.nominator)
  if (!operatorAccount) return { success: false, reason: 'Failed to fetch operator account state' }
  // TODO: look into why nodeAccount is queried here
  const nodeAccount = await shardus.getLocalOrRemoteAccount(queryCertReq.nominee)
  if (!nodeAccount) return { success: false, reason: 'Failed to fetch node account state' }

  // const currentTimestamp = Math.round(Date.now() / 1000)
  const currentTimestamp = Date.now()

  console.log('currentTimestamp', currentTimestamp, operatorAccount.operatorAccountInfo.certExp)

  // check operator cert validity
  if (operatorAccount.operatorAccountInfo.certExp < currentTimestamp)
    return {
      success: false,
      reason: 'Operator certificate has expired',
    }

  return await getCertSignatures(shardus, {
    nominator: queryCertReq.nominator,
    nominee: queryCertReq.nominee,
    stake: operatorAccount.operatorAccountInfo.stake,
    certExp: operatorAccount.operatorAccountInfo.certExp,
  })
}

async function getEVMAccountDataForAddress(
  shardus: Shardus,
  evmAddress: string
): Promise<WrappedEVMAccount | undefined> {
  const shardusAddress = toShardusAddress(evmAddress, AccountType.Account)
  const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
  if (!account) return undefined
  let data: any = account.data
  fixDeserializedWrappedEVMAccount(data)
  return data
}

export async function getCertSignatures(
  shardus: Shardus,
  certData: StakeCert
): Promise<CertSignaturesResult> {
  const signedAppData = await shardus.getAppDataSignatures(
    'sign-app-data',
    crypto.hashObj(certData),
    5,
    certData
  )
  if (!signedAppData.success) {
    return {
      success: false,
    }
  }
  certData.signs = signedAppData.signatures
  return { success: true, signedStakeCert: certData }
}
