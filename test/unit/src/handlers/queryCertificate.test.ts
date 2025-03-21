import { Request } from 'express'
import { Shardus, ShardusTypes } from '@shardeum-foundation/core'
import {
  queryCertificate,
  queryCertificateHandler,
  getNodeAccountWithRetry,
  InjectTxToConsensor,
  getCertSignatures,
  QueryCertRequest,
  CertSignaturesResult,
} from '../../../../src/handlers/queryCertificate'
import { NodeAccountQueryResponse } from '../../../../src/shardeum/shardeumTypes'
import { shardusGetFromNode, shardusPutToNode } from '../../../../src/utils/requests'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'
import { shardeumGetTime } from '../../../../src'
import { Utils } from '@shardeum-foundation/lib-types'

jest.mock('../../../../src/utils/requests', () => ({
  shardusGetFromNode: jest.fn(),
  shardusPostToNode: jest.fn(),
  shardusPutToNode: jest.fn(),
}))

jest.mock('../../../../src/shardeum/evmAddress', () => ({
  toShardusAddress: jest.fn(),
}))

jest.mock('../../../../src/index', () => ({
  shardeumGetTime: jest.fn(),
  logFlags: { dapp_verbose: true },
}))

jest.mock('@shardeum-foundation/lib-crypto-utils', () => ({
  verifyObj: jest.fn().mockReturnValue(true),
  hashObj: jest.fn(),
  init: jest.fn(),
  setCustomStringifier: jest.fn(),
}))

describe('queryCertificate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('queryCertificate', () => {
    const shardusMock = {} as Shardus
    const activeNodesMock: ShardusTypes.ValidatorNodeDetails[] = [{ id: 'node1' }] as any

    it('should return error when activeNodes list is empty', async () => {
      const result = await queryCertificate(shardusMock, 'publicKey', [])
      expect(result).toEqual({ success: false, reason: 'activeNodes list is 0 to get query certificate' })
    })

    it('should return error if getNodeAccountWithRetry fails', async () => {
      const result = await queryCertificate(shardusMock, 'publicKey', activeNodesMock)
      expect(result).toEqual({ success: false, reason: 'node busy' })
    })

    it('should return success', async () => {
      const mockResponse = { data: { account: { data: { id: 'abcd1234', success: true } } } }
      ;(shardusGetFromNode as jest.Mock).mockResolvedValue(mockResponse)
      ;(shardusPutToNode as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          signedStakeCert: {
            nominator: 'nominator',
            nominee: 'nominee',
            stake: 10000,
            certExp: Date.now() + 86400000,
            sign: '0xabcd',
          },
        },
      })
      // @ts-ignore
      const mockShardus: Shardus = {
        signAsNode: jest.fn().mockReturnValue({
          nominator: 'account1234',
          nominee: 'nominiee1234',
          sign: '0xabcd',
        }),
      }

      const result = (await queryCertificate(mockShardus, 'publicKey', activeNodesMock)) as CertSignaturesResult

      expect(result.success).toBe(true)
      expect(result.signedStakeCert).not.toBeNull()
    })
  })

  describe('queryCertificateHandler', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    const shardusMock = {} as Shardus
    it('should return error for invalid nominator', async () => {
      const reqMock = {
        body: { nominee: 'inValidNominee', nominator: 'validNominator', sign: {} } as QueryCertRequest,
      } as Request
      const result = await queryCertificateHandler(reqMock, shardusMock)
      expect(result).toEqual({ success: false, reason: 'Invalid nominator address' })
    })

    it('should return error for missing nominee', async () => {
      const reqMock = {
        body: { nominator: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d', sign: {} } as QueryCertRequest,
      } as Request

      const oldVerboseLogs = ShardeumFlags.VerboseLogs
      ShardeumFlags.VerboseLogs = true

      const result = await queryCertificateHandler(reqMock, shardusMock)
      expect(result).toEqual({ success: false, reason: 'Invalid nominee address' })
      ShardeumFlags.VerboseLogs = oldVerboseLogs
    })

    it('should return error if request is not signed', async () => {
      const reqMock = {
        body: {
          nominee: '8780a8ba77e8b9088989fedac0b4f80c3017c91fd46ea09cf6306b6fd70ce561',
          nominator: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d',
          sign: {},
        } as QueryCertRequest,
      } as Request

      ;(crypto.verifyObj as jest.Mock).mockReturnValue(false)

      const result = await queryCertificateHandler(reqMock, shardusMock)
      expect(result).toEqual({ success: false, reason: 'Invalid signature for QueryCert tx' })
    })

    it('should return error if crypto.verify throws error', async () => {
      const reqMock = {
        body: {
          nominee: '8780a8ba77e8b9088989fedac0b4f80c3017c91fd46ea09cf6306b6fd70ce561',
          nominator: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d',
          sign: {},
        } as QueryCertRequest,
      } as Request

      ;(crypto.verifyObj as jest.Mock).mockImplementation(() => {
        throw new Error('Verification failed')
      })

      const result = await queryCertificateHandler(reqMock, shardusMock)
      expect(result).toEqual({ success: false, reason: 'Invalid signature for QueryCert tx' })
    })

    it('should handle didnt return operatorAccount', async () => {
      const reqMock = {
        body: {
          nominee: '8780a8ba77e8b9088989fedac0b4f80c3017c91fd46ea09cf6306b6fd70ce561',
          nominator: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d',
          sign: {},
        } as QueryCertRequest,
      } as Request

      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      // @ts-ignore
      const mockShardus: Shardus = {
        getLocalOrRemoteAccount: jest.fn().mockReturnValue({
          accountId: 'account1234',
          data: {},
        }),
      }

      const result = await queryCertificateHandler(reqMock, mockShardus)
      expect(result).toEqual({ success: false, reason: 'Failed to fetch operator account state' })
    })

    it('should handle operatorAccountInfo is null', async () => {
      const reqMock = {
        body: {
          nominee: '8780a8ba77e8b9088989fedac0b4f80c3017c91fd46ea09cf6306b6fd70ce561',
          nominator: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d',
          sign: {},
        } as QueryCertRequest,
      } as Request

      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      // @ts-ignore
      const mockShardus: Shardus = {
        getLocalOrRemoteAccount: jest.fn().mockReturnValue({
          accountId: 'account1234',
          data: { ethAddress: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d' },
        }),
      }

      ;(shardeumGetTime as jest.Mock).mockReturnValue(Date.now())

      const result = await queryCertificateHandler(reqMock, mockShardus)
      expect(result).toEqual({ success: false, reason: 'Operator account info is null' })
    })

    it('should handle null cert time', async () => {
      const reqMock = {
        body: {
          nominee: '8780a8ba77e8b9088989fedac0b4f80c3017c91fd46ea09cf6306b6fd70ce561',
          nominator: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d',
          sign: {},
        } as QueryCertRequest,
      } as Request

      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      // @ts-ignore
      const mockShardus: Shardus = {
        getLocalOrRemoteAccount: jest.fn().mockReturnValue({
          accountId: 'account1234',
          data: {
            ethAddress: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d',
            operatorAccountInfo: { certExp: null },
          },
        }),
      }

      ;(shardeumGetTime as jest.Mock).mockReturnValue(Date.now())

      const result = await queryCertificateHandler(reqMock, mockShardus)
      expect(result).toEqual({ success: false, reason: 'Operator certificate time is null' })
    })

    it('should handle expired operator cert', async () => {
      const reqMock = {
        body: {
          nominee: '8780a8ba77e8b9088989fedac0b4f80c3017c91fd46ea09cf6306b6fd70ce561',
          nominator: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d',
          sign: {},
        } as QueryCertRequest,
      } as Request

      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      // @ts-ignore
      const mockShardus: Shardus = {
        getLocalOrRemoteAccount: jest.fn().mockReturnValue({
          accountId: 'account1234',
          data: {
            ethAddress: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d',
            operatorAccountInfo: { certExp: 0 },
          },
        }),
      }

      ;(shardeumGetTime as jest.Mock).mockReturnValue(Date.now())

      const result = await queryCertificateHandler(reqMock, mockShardus)
      expect(result).toEqual({ success: false, reason: 'Operator certificate has expired' })
    })

    it('should return resp successfully', async () => {
      const reqMock = {
        body: {
          nominee: '8780a8ba77e8b9088989fedac0b4f80c3017c91fd46ea09cf6306b6fd70ce561',
          nominator: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d',
          sign: {},
        } as QueryCertRequest,
      } as Request

      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      // @ts-ignore
      const mockShardus: Shardus = {
        getLocalOrRemoteAccount: jest.fn().mockReturnValue({
          accountId: 'account1234',
          data: { ethAddress: '0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d', operatorAccountInfo: {} },
        }),
        getAppDataSignatures: jest.fn().mockReturnValue({
          success: true,
          signatures: ['0xabcd', '0xpoiu'],
        }),
      }

      ;(shardeumGetTime as jest.Mock).mockReturnValue(Date.now())

      const result = (await queryCertificateHandler(reqMock, mockShardus)) as CertSignaturesResult
      expect(result.success).toBe(true)
      expect(result.signedStakeCert?.nominator).toBe('0xb01DffeB41A2f4B3Bcc693d377879C8D4635EF2d')
      expect(result.signedStakeCert?.signs).toEqual(['0xabcd', '0xpoiu'])
    })
  })

  describe('getNodeAccountWithRetry', () => {
    const activeNodesMock: ShardusTypes.ValidatorNodeDetails[] = [{ id: 'node1' }] as any

    it('should return success if getNodeAccount succeeds', async () => {
      const mockResponse = { data: { account: { data: { id: 'abcd1234', success: true } } } }
      ;(shardusGetFromNode as jest.Mock).mockResolvedValue(mockResponse)

      const result = (await getNodeAccountWithRetry('nodeAccountId', activeNodesMock)) as NodeAccountQueryResponse
      expect(result.success).not.toBeNull()
      expect(result.nodeAccount?.id).toBe('abcd1234')
    })

    it('should handle node account not found error', async () => {
      const mockResponse = { data: { success: false } }
      ;(shardusGetFromNode as jest.Mock).mockResolvedValue(mockResponse)

      const result = await getNodeAccountWithRetry('nodeAccountId', activeNodesMock)
      expect(result).toEqual({ success: false, reason: 'node account not found' })
    })

    it('should handle node busy error', async () => {
      const mockResponse = { data: { success: false, error: 'node busy', account: {} } }
      ;(shardusGetFromNode as jest.Mock).mockResolvedValue(mockResponse)
      const result = await getNodeAccountWithRetry('nodeAccountId', activeNodesMock)
      expect(result).toEqual({ success: false, reason: 'node busy' })
    })
  })

  describe('InjectTxToConsensor', () => {
    const txMock = {} as any
    const nodesMock: ShardusTypes.ValidatorNodeDetails[] = [{ id: 'node1' }] as any

    it('should return success if at least one request succeeds', async () => {
      jest
        .spyOn(require('../../../../src/utils/requests'), 'shardusPostToNode')
        .mockResolvedValueOnce({ data: { success: true } })

      const result = await InjectTxToConsensor(nodesMock, txMock)
      expect(result.success).toBe(true)
    })

    it('should return failure if all requests fail', async () => {
      jest
        .spyOn(require('../../../../src/utils/requests'), 'shardusPostToNode')
        .mockResolvedValue({ data: { success: false, reason: 'error' } })

      const result = await InjectTxToConsensor(nodesMock, txMock)
      expect(result.success).toBe(false)
    })
  })

  describe('getCertSignatures', () => {
    const shardusMock = {
      getAppDataSignatures: jest.fn(),
    } as any
    const certMock = { nominee: 'a', nominator: 'b', stake: BigInt(100), certExp: 1234 } as any

    it('should return success with signatures', async () => {
      shardusMock.getAppDataSignatures.mockResolvedValueOnce({ success: true, signatures: [{}] })
      const result = await getCertSignatures(shardusMock, certMock)
      expect(result.success).toBe(true)
      expect(result.signedStakeCert?.signs).toBeDefined()
    })

    it('should return failure if signatures retrieval fails', async () => {
      shardusMock.getAppDataSignatures.mockResolvedValueOnce({ success: false })

      const result = await getCertSignatures(shardusMock, certMock)
      expect(result.success).toBe(false)
    })
  })
})
