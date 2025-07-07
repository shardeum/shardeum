import { Request } from 'express'
import { Shardus, ShardusTypes, nestedCountersInstance, DevSecurityLevel } from '@shardeum-foundation/core'
import {
  putAdminCertificateHandler,
  PutAdminCertRequest,
  AdminCert,
  PutAdminCertResult,
} from '../../../../src/handlers/adminCertificate'
import { ValidatorError } from '../../../../src/handlers/queryCertificate'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'

jest.mock('@shardeum-foundation/lib-crypto-utils', () => ({
  verifyObj: jest.fn(),
  init: jest.fn(),
  setCustomStringifier: jest.fn(),
}))

jest.mock('@shardeum-foundation/core', () => ({
  nestedCountersInstance: {
    countEvent: jest.fn(),
  },
  DevSecurityLevel: {
    Low: 0,
    Medium: 1,
    High: 2,
  },
}))

describe('adminCertificate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('putAdminCertificateHandler', () => {
    const mockPublicKey = 'a'.repeat(64) // Valid 64-character public key
    const mockSign: ShardusTypes.Sign = {
      owner: 'ownerPublicKey',
      sig: 'signature',
    }

    const validAdminCert: PutAdminCertRequest = {
      nominee: mockPublicKey,
      certCreation: Date.now(),
      certExp: Date.now() + 86400000,
      sign: mockSign,
      goldenTicket: false,
    }

    const createMockShardus = (overrides = {}): Shardus => {
      return {
        crypto: {
          getPublicKey: jest.fn().mockReturnValue(mockPublicKey),
          verify: jest.fn().mockReturnValue(true),
        },
        getDevPublicKey: jest.fn().mockReturnValue('devPublicKey'),
        ensureKeySecurity: jest.fn().mockReturnValue(true),
        ...overrides,
      } as unknown as Shardus
    }

    const createMockRequest = (body: any): Request => {
      return {
        body,
      } as Request
    }

    it('should successfully validate and return signed admin cert', async () => {
      const shardusMock = createMockShardus()
      const reqMock = createMockRequest(validAdminCert)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      const result = await putAdminCertificateHandler(reqMock, shardusMock)
      
      expect(result).toEqual({
        success: true,
        signedAdminCert: validAdminCert,
      })
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-admin-certificate',
        'calling queryCertificateHandler'
      )
    })

    it('should return error for invalid nominee address - empty string', async () => {
      const shardusMock = createMockShardus()
      const invalidCert = { ...validAdminCert, nominee: '' }
      const reqMock = createMockRequest(invalidCert)

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid nominee address')
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-admin-certificate',
        'validatePutAdminCertRequest fail req.nominee address invalid'
      )
    })

    it('should return error for invalid nominee address - wrong length', async () => {
      const shardusMock = createMockShardus()
      const invalidCert = { ...validAdminCert, nominee: 'shortkey' }
      const reqMock = createMockRequest(invalidCert)

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid nominee address')
    })

    it('should return error for nominee not matching public key', async () => {
      const shardusMock = createMockShardus()
      const invalidCert = { ...validAdminCert, nominee: 'b'.repeat(64) }
      const reqMock = createMockRequest(invalidCert)

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid nominee address')
    })

    it('should return error for missing nominee', async () => {
      const shardusMock = createMockShardus()
      const invalidCert = { ...validAdminCert, nominee: null }
      const reqMock = createMockRequest(invalidCert)

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid nominee address')
    })

    it('should return error for invalid crypto signature', async () => {
      const shardusMock = createMockShardus()
      const reqMock = createMockRequest(validAdminCert)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(false)

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid signature for AdminCert')
    })

    it('should return error when crypto.verifyObj throws exception', async () => {
      const shardusMock = createMockShardus()
      const reqMock = createMockRequest(validAdminCert)
      ;(crypto.verifyObj as jest.Mock).mockImplementation(() => {
        throw new Error('Verification error')
      })

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid signature for QueryCert tx')
    })

    it('should return error when getDevPublicKey returns null', async () => {
      const shardusMock = createMockShardus({
        getDevPublicKey: jest.fn().mockReturnValue(null),
      })
      const reqMock = createMockRequest(validAdminCert)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Unauthorized! no getDevPublicKey defined')
    })

    it('should return error when crypto verify fails with dev public key', async () => {
      const shardusMock = createMockShardus({
        crypto: {
          getPublicKey: jest.fn().mockReturnValue(mockPublicKey),
          verify: jest.fn().mockReturnValue(false),
        },
      })
      const reqMock = createMockRequest(validAdminCert)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Unauthorized! Please use higher level auth key.')
    })

    it('should return error when ensureKeySecurity returns false', async () => {
      const shardusMock = createMockShardus({
        ensureKeySecurity: jest.fn().mockReturnValue(false),
      })
      const reqMock = createMockRequest(validAdminCert)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Unauthorized! Please use higher level auth key.')
    })

    it('should return error when dev key validation throws exception', async () => {
      const shardusMock = createMockShardus({
        crypto: {
          getPublicKey: jest.fn().mockReturnValue(mockPublicKey),
          verify: jest.fn().mockImplementation(() => {
            throw new Error('Verify error')
          }),
        },
      })
      const reqMock = createMockRequest(validAdminCert)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      const result = await putAdminCertificateHandler(reqMock, shardusMock) as ValidatorError
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid signature for QueryCert tx')
    })

    it('should log verbose logs when VerboseLogs flag is true', async () => {
      const oldVerboseLogs = ShardeumFlags.VerboseLogs
      ShardeumFlags.VerboseLogs = true
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const shardusMock = createMockShardus()
      const invalidCert = { ...validAdminCert, nominee: '' }
      const reqMock = createMockRequest(invalidCert)

      await putAdminCertificateHandler(reqMock, shardusMock)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'validatePutAdminCertRequest fail req.nominee address invalid',
        invalidCert
      )

      consoleSpy.mockRestore()
      ShardeumFlags.VerboseLogs = oldVerboseLogs
    })

    it('should count failure event when validation fails', async () => {
      const shardusMock = createMockShardus()
      const invalidCert = { ...validAdminCert, nominee: '' }
      const reqMock = createMockRequest(invalidCert)

      await putAdminCertificateHandler(reqMock, shardusMock)
      
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith(
        'shardeum-admin-certificate',
        'queryCertificateHandler: failed validateQueryCertRequest'
      )
    })

    it('should call ensureKeySecurity with correct parameters', async () => {
      const shardusMock = createMockShardus()
      const reqMock = createMockRequest(validAdminCert)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      await putAdminCertificateHandler(reqMock, shardusMock)
      
      expect(shardusMock.ensureKeySecurity).toHaveBeenCalledWith('devPublicKey', DevSecurityLevel.High)
    })

    it('should verify the request with the correct dev public key', async () => {
      const shardusMock = createMockShardus()
      const reqMock = createMockRequest(validAdminCert)
      ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

      await putAdminCertificateHandler(reqMock, shardusMock)
      
      expect(shardusMock.crypto.verify).toHaveBeenCalledWith(validAdminCert, 'devPublicKey')
      expect(shardusMock.getDevPublicKey).toHaveBeenCalledWith(mockSign.owner)
    })
  })
})