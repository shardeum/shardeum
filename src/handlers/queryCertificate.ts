import { Shardus, ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { BN, isValidAddress } from 'ethereumjs-util'
import { Request } from 'express'
import { toShardusAddress } from '../shardeum/evmAddress'
import { AccountType, NodeAccountQueryResponse, WrappedEVMAccount } from '../shardeum/shardeumTypes'
import { fixDeserializedWrappedEVMAccount } from '../shardeum/wrappedEVMAccountFunctions'
import { shardusPutToNode } from '../utils/requests'

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
  nominator: string //the operator acount that nominated a node account
  nominee: string //the node account that was nominated
  stake: BN //the ammount staked
  certExp: number //cert expiration time in seconds
  signs?: ShardusTypes.Sign[] //this is used when when the cert has a list of valid signatures
  sign?: ShardusTypes.Sign //this is use when we need to sign and unsigned cert. signs and sign will not exist yet when sign() is called
}

export interface ValidatorError {
  success: boolean
  reason: string
}

function validateQueryCertRequest(req: QueryCertRequest, rawBody: any): ValidatorError {
  if (!isValidAddress(req.nominee)) {
    return { success: false, reason: 'Invalid nominee address' }
  }
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
 * on the chosen node. The nominator is chosen by querying `node-account/:address` on the
 * randomly chosen consensu node
 *
 * @param shardus
 * @returns
 */
export async function queryCertificate(shardus: Shardus): Promise<CertSignaturesResult | ValidatorError> {
  const nodeId = shardus.getNodeId()
  const randomConsensusNode = shardus.getRandomConsensusNodeForAccount(nodeId)

  // TODO: Replace this logic when `node-account/:address` endpoint is implemented
  // This function should be called on the `randomConsensusNode`
  const stubNodeAccount = async (address: string): Promise<NodeAccountQueryResponse> => {
    return {
      success: true,
      nodeAccount: {
        accountType: AccountType.NodeAccount2,
        id: 'stub-id',
        hash: 'stub-hash',
        timestamp: Date.now(),
        nominator: 'stub-nominator',
        stakeLock: new BN('123'),
        reward: new BN('2'),
        rewardStartTime: Date.now(),
        rewardEndTime: Date.now(),
        penalty: new BN('1'),
      },
    }
  }

  const callQueryCertificate = async (
    signedCertRequest: QueryCertRequest
  ): Promise<CertSignaturesResult | ValidatorError> => {
    try {
      const res = await shardusPutToNode<CertSignaturesResult>(randomConsensusNode, '/query-certificate', {
        data: signedCertRequest,
        // Custom timeout because this request is expected to take a while
        timeout: 15000,
      })
      return res.data
    } catch (error) {
      return {
        success: false,
        reason: 'Failed to get query certificate',
      }
    }
  }

  const nodeAccountQueryResponse = await stubNodeAccount(nodeId)
  const nominator = nodeAccountQueryResponse.nodeAccount?.id

  const certRequest = {
    nominee: nodeId,
    nominator: nominator,
  }
  const signedCertRequest: QueryCertRequest = shardus.signAsNode(certRequest)

  return callQueryCertificate(signedCertRequest)
}

export async function queryCertificateHandler(
  req: Request,
  shardus: any
): Promise<CertSignaturesResult | ValidatorError> {
  const queryCertReq = req.body as QueryCertRequest
  const reqValidationResult = validateQueryCertRequest(queryCertReq, req.body)
  if (!reqValidationResult.success) return reqValidationResult

  const operatorAccount = await getEVMAccountDataForAddress(shardus, queryCertReq.nominator)
  if (!operatorAccount) return { success: false, reason: 'Failed to fetch operator account state' }
  const nodeAccount = await getEVMAccountDataForAddress(shardus, queryCertReq.nominee)
  if (!nodeAccount) return { success: false, reason: 'Failed to fetch node account state' }

  const currentTimestamp = Math.round(Date.now() / 1000)

  // check operator cert validity
  if (operatorAccount.operatorAccountInfo.certExp > currentTimestamp)
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
  shardus: any,
  evmAddress: string
): Promise<WrappedEVMAccount | undefined> {
  const shardusAddress = toShardusAddress(evmAddress, AccountType.Account)
  const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
  if (!account) return undefined
  let data = account.data
  fixDeserializedWrappedEVMAccount(data)
  return data
}

export async function getCertSignatures(shardus: any, certData: StakeCert): Promise<CertSignaturesResult> {
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
