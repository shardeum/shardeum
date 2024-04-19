import { nestedCountersInstance, Shardus, ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { isValidAddress } from '@ethereumjs/util'
import { Request } from 'express'
import { toShardusAddress } from '../shardeum/evmAddress'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  AccountType,
  InjectTxResponse,
  NodeAccountAxiosResponse,
  NodeAccountQueryResponse,
  WrappedEVMAccount,
} from '../shardeum/shardeumTypes'
import { fixDeserializedWrappedEVMAccount, isWrappedEVMAccount } from '../shardeum/wrappedEVMAccountFunctions'
import { getRandom, fixBigIntLiteralsToBigInt } from '../utils'
import { shardusGetFromNode, shardusPostToNode, shardusPutToNode } from '../utils/requests'
import { logFlags, shardeumGetTime } from '..'
import { OpaqueTransaction } from '@shardus/core/dist/shardus/shardus-types'

// constants

const maxNodeAccountRetries = 3

const errNodeAccountNotFound = 'node account not found'
const errNodeBusy = 'node busy'

// types

export interface QueryCertRequest {
  nominee: string
  nominator: string
  sign: ShardusTypes.Sign
}

export type CertSignaturesResult = {
  success: boolean
  signedStakeCert?: StakeCert
}

export interface StakeCert {
  nominator: string //the operator account that nominated a node account
  nominee: string //the node account that was nominated
  stake: bigint //the amount staked
  certExp: number //cert expiration time in seconds
  signs?: ShardusTypes.Sign[] //this is used when when the cert has a list of valid signatures
  sign?: ShardusTypes.Sign //this is use when we need to sign and unsigned cert. signs and sign will not exist yet when sign() is called
}

export interface RemoveNodeCert {
  nodePublicKey: string //public key of the node account
  cycle: number //cert expiration time in seconds
  signs?: ShardusTypes.Sign[] //this is used when when the cert has a list of valid signatures
  sign?: ShardusTypes.Sign //this is use when we need to sign and unsigned cert. signs and sign will not exist yet when sign() is called
}

export interface ValidatorError {
  success: boolean
  reason: string
}

function validateQueryCertRequest(req: QueryCertRequest): ValidatorError {
  if (!isValidAddress(req.nominator)) {
    return { success: false, reason: 'Invalid nominator address' }
  }
  if (!req.nominee || req.nominee === '' || req.nominee.length !== 64) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateQueryCertRequest fail req.nominee address invalid`)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateQueryCertRequest fail req.nominee address invalid', req)
    return { success: false, reason: 'Invalid nominee address' }
  }
  try {
    if (!crypto.verifyObj(req)) return { success: false, reason: 'Invalid signature for QueryCert tx' }
  } catch (e) {
    return { success: false, reason: 'Invalid signature for QueryCert tx' }
  }

  return { success: true, reason: '' }
}

async function getNodeAccount(
  randomConsensusNode: ShardusTypes.ValidatorNodeDetails,
  nodeAccountId: string
): Promise<NodeAccountQueryResponse | ValidatorError> {
  try {
    let queryString = `/account/:address`.replace(':address', nodeAccountId)
    queryString += `?type=${AccountType.NodeAccount2}`
    const res = await shardusGetFromNode<NodeAccountAxiosResponse>(randomConsensusNode, queryString)
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

export async function getNodeAccountWithRetry(
  nodeAccountId: string,
  activeNodes: ShardusTypes.ValidatorNodeDetails[]
): Promise<NodeAccountQueryResponse | ValidatorError> {
  let i = 0
  while (i <= maxNodeAccountRetries) {
    const randomConsensusNode = getRandom(activeNodes, 1)[0]
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

async function getEVMAccountDataForAddress(
  shardus: Shardus,
  evmAddress: string
): Promise<WrappedEVMAccount | undefined> {
  const shardusAddress = toShardusAddress(evmAddress, AccountType.Account)
  const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
  if (!account) return undefined
  const data = account.data
  if (isWrappedEVMAccount(data)) {
    fixDeserializedWrappedEVMAccount(data)
    return data
  }
  return undefined
}

export async function getCertSignatures(
  shardus: Shardus,
  certData: StakeCert
): Promise<CertSignaturesResult> {
  const signedAppData = await shardus.getAppDataSignatures(
    'sign-stake-cert',
    crypto.hashObj(certData),
    5,
    certData,
    2
  )
  if (!signedAppData.success) {
    return {
      success: false,
      signedStakeCert: null,
    }
  }
  certData.signs = signedAppData.signatures
  return { success: true, signedStakeCert: certData }
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
  publicKey: string,
  activeNodes: ShardusTypes.ValidatorNodeDetails[]
): Promise<CertSignaturesResult | ValidatorError> {
  nestedCountersInstance.countEvent('shardeum-staking', 'calling queryCertificate')

  if (activeNodes.length === 0) {
    return {
      success: false,
      reason: 'activeNodes list is 0 to get query certificate',
    }
  }

  const randomConsensusNode: ShardusTypes.ValidatorNodeDetails = getRandom(activeNodes, 1)[0]

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

  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('signedCertRequest', signedCertRequest)

  return await callQueryCertificate(signedCertRequest)
}

// Move this helper function to utils or somewhere
export async function InjectTxToConsensor(
  randomConsensusNodes: ShardusTypes.ValidatorNodeDetails[],
  tx: OpaqueTransaction // Sign Object
): Promise<InjectTxResponse | ValidatorError> {
  const promises = []
  try {
    for (const randomConsensusNode of randomConsensusNodes) {
      const promise = shardusPostToNode<any>(randomConsensusNode, `/inject`, tx) // eslint-disable-line
      // @typescript-eslint/no-explicit-any
      promises.push(promise)
    }
    const res = await raceForSuccess(promises, 5000)
    if (!res.data.success) {
      return { success: false, reason: res.data.reason }
    }
    return res.data as InjectTxResponse
  } catch (error) {
    return { success: false, reason: (error as Error).message }
  }
}

async function raceForSuccess<
  T extends {
    data: {
      success: boolean
      reason?: string
    }
  }
>(promises: Promise<T>[], timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let unresolvedCount = promises.length
    const timer = setTimeout(() => {
      reject(new Error('Timeout: Operation did not complete within the allowed time.'))
    }, timeoutMs)

    for (const promise of promises) {
      promise
        .then((response) => {
          if (response.data.success) {
            clearTimeout(timer)
            resolve(response)
          } else {
            unresolvedCount--
            if (unresolvedCount === 0) {
              clearTimeout(timer)
              //reject(new Error('All promises failed or returned unsuccessful responses.'))
              resolve(response)
            }
          }
        })
        .catch((error) => {
          unresolvedCount--
          if (unresolvedCount === 0) {
            clearTimeout(timer)
            //reject(new Error('All promises failed or returned unsuccessful responses: ' + error))
            reject(error)
          }
        })
    }
  })
}

export async function queryCertificateHandler(
  req: Request,
  shardus: Shardus
): Promise<CertSignaturesResult | ValidatorError> {
  nestedCountersInstance.countEvent('shardeum-staking', 'calling queryCertificateHandler')

  const queryCertReq = req.body as QueryCertRequest
  const reqValidationResult = validateQueryCertRequest(queryCertReq)
  if (!reqValidationResult.success) {
    nestedCountersInstance.countEvent(
      'shardeum-staking',
      'queryCertificateHandler: failed validateQueryCertRequest'
    )
    return reqValidationResult
  }

  const operatorAccount = await getEVMAccountDataForAddress(shardus, queryCertReq.nominator)
  if (!operatorAccount) {
    nestedCountersInstance.countEvent(
      'shardeum-staking',
      'queryCertificateHandler: failed to fetch operator account' + ' state'
    )
    return { success: false, reason: 'Failed to fetch operator account state' }
  }
  let nodeAccount = await shardus.getLocalOrRemoteAccount(queryCertReq.nominee)
  nodeAccount = fixBigIntLiteralsToBigInt(nodeAccount)
  if (!nodeAccount) {
    nestedCountersInstance.countEvent(
      'shardeum-staking',
      'queryCertificateHandler: failed to fetch node account state'
    )
    return { success: false, reason: 'Failed to fetch node account state' }
  }

  const currentTimestampInMillis = shardeumGetTime()

  if (operatorAccount.operatorAccountInfo == null) {
    nestedCountersInstance.countEvent(
      'shardeum-staking',
      'queryCertificateHandler: operator account info is null'
    )
    return {
      success: false,
      reason: 'Operator account info is null',
    }
  }

  if (operatorAccount.operatorAccountInfo.certExp === null) {
    nestedCountersInstance.countEvent(
      'shardeum-staking',
      'queryCertificateHandler: Operator certificate time is null'
    )
    return {
      success: false,
      reason: 'Operator certificate time is null',
    }
  }

  // check operator cert validity
  if (operatorAccount.operatorAccountInfo.certExp < currentTimestampInMillis) {
    nestedCountersInstance.countEvent(
      'shardeum-staking',
      'queryCertificateHandler: operator certificate has expired'
    )

    return {
      success: false,
      reason: 'Operator certificate has expired',
    }
  }
  return await getCertSignatures(shardus, {
    nominator: queryCertReq.nominator,
    nominee: queryCertReq.nominee,
    stake: operatorAccount.operatorAccountInfo.stake,
    certExp: operatorAccount.operatorAccountInfo.certExp,
  })
}
