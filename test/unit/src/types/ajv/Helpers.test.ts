import {
  verifyPayload,
  filterObjectByWhitelistedProps,
  initAjvSchemas,
} from '../../../../../src/types/ajv/Helpers'
import { getVerifyFunction } from '../../../../../src/utils/serialization/SchemaHelpers'
import { initInjectTxReq } from '../../../../../src/types/ajv/InjectTxReq'
import { initSign } from '../../../../../src/types/ajv/SignSchema'
import { initPenaltyTX } from '../../../../../src/types/ajv/PenaltyTXSchema'
import { initJoinAppData } from '../../../../../src/types/ajv/JoinAppData'
import { initStakeResp } from '../../../../../src/types/ajv/StakeResp'
import { initStakeCert } from '../../../../../src/types/ajv/StakeCert'
import { initRemoveNodeCert } from '../../../../../src/types/ajv/RemoveNodeCert'
import { initApplyChangeConfigTx } from '../../../../../src/types/ajv/ApplyChangeConfigTxSchema'
import { initApplyNetworkParamTx } from '../../../../../src/types/ajv/ApplyNetworkParamTxSchema'
import { initChangeConfigTx } from '../../../../../src/types/ajv/ChangeConfigTxSchema'
import { initChangeNetworkParamTx } from '../../../../../src/types/ajv/ChangeNetworkParamTxSchema'
import { initSetCertTimeTx } from '../../../../../src/types/ajv/SetCertTimeTxSchema'
import { initStakeTx } from '../../../../../src/types/ajv/StakeTxSchema'
import { initInitRewardTimesTx } from '../../../../../src/types/ajv/InitRewardTimesTxSchema'
import { initClaimRewardTx } from '../../../../../src/types/ajv/ClaimRewardTxSchema'
import { initTransferFromSecureAccountTx } from '../../../../../src/types/ajv/TransferFromSecureAccountTxSchema'
import { initUnstakeTx } from '../../../../../src/types/ajv/UnstakeTxSchema'
import { initInitNetworkTx } from '../../../../../src/types/ajv/InitNetworkTxSchema'
import Ajv from 'ajv'

jest.mock('../../../../../src/utils/serialization/SchemaHelpers', () => ({
  getVerifyFunction: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/InjectTxReq', () => ({
  initInjectTxReq: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/SignSchema', () => ({
  initSign: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/PenaltyTXSchema', () => ({
  initPenaltyTX: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/JoinAppData', () => ({
  initJoinAppData: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/StakeResp', () => ({
  initStakeResp: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/StakeCert', () => ({
  initStakeCert: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/RemoveNodeCert', () => ({
  initRemoveNodeCert: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/ApplyChangeConfigTxSchema', () => ({
  initApplyChangeConfigTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/ApplyNetworkParamTxSchema', () => ({
  initApplyNetworkParamTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/ChangeConfigTxSchema', () => ({
  initChangeConfigTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/ChangeNetworkParamTxSchema', () => ({
  initChangeNetworkParamTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/SetCertTimeTxSchema', () => ({
  initSetCertTimeTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/StakeTxSchema', () => ({
  initStakeTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/InitRewardTimesTxSchema', () => ({
  initInitRewardTimesTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/ClaimRewardTxSchema', () => ({
  initClaimRewardTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/TransferFromSecureAccountTxSchema', () => ({
  initTransferFromSecureAccountTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/UnstakeTxSchema', () => ({
  initUnstakeTx: jest.fn(),
}))

jest.mock('../../../../../src/types/ajv/InitNetworkTxSchema', () => ({
  initInitNetworkTx: jest.fn(),
}))

describe('Ajv Helpers', () => {
  describe('initAjvSchemas', () => {
    it('should initialize all schemas without errors and invoke each function once', () => {
      expect(() => initAjvSchemas()).not.toThrow()
      expect(initInjectTxReq).toHaveBeenCalledTimes(1)
      expect(initSign).toHaveBeenCalledTimes(1)
      expect(initPenaltyTX).toHaveBeenCalledTimes(1)
      expect(initJoinAppData).toHaveBeenCalledTimes(1)
      expect(initStakeResp).toHaveBeenCalledTimes(1)
      expect(initStakeCert).toHaveBeenCalledTimes(1)
      expect(initRemoveNodeCert).toHaveBeenCalledTimes(1)
      expect(initApplyChangeConfigTx).toHaveBeenCalledTimes(1)
      expect(initApplyNetworkParamTx).toHaveBeenCalledTimes(1)
      expect(initChangeConfigTx).toHaveBeenCalledTimes(1)
      expect(initChangeNetworkParamTx).toHaveBeenCalledTimes(1)
      expect(initSetCertTimeTx).toHaveBeenCalledTimes(1)
      expect(initStakeTx).toHaveBeenCalledTimes(1)
      expect(initInitRewardTimesTx).toHaveBeenCalledTimes(1)
      expect(initClaimRewardTx).toHaveBeenCalledTimes(1)
      expect(initTransferFromSecureAccountTx).toHaveBeenCalledTimes(1)
      expect(initUnstakeTx).toHaveBeenCalledTimes(1)
      expect(initInitNetworkTx).toHaveBeenCalledTimes(1)
    })
  })

  describe('verifyPayload', () => {
    it('should return null if payload is valid', () => {
      const mockVerifyFn = jest.fn().mockReturnValue(true)
      ;(getVerifyFunction as jest.Mock).mockReturnValue(mockVerifyFn)

      const result = verifyPayload('testSchema', { test: 'data' })
      expect(result).toBeNull()
    })

    it('should return error messages if payload is invalid', () => {
      // Define the type for the mock function to include the errors property
      const mockVerifyFn: jest.Mock & { errors?: Array<{ message: string; params: any }> } = jest
        .fn()
        .mockReturnValue(false)
      mockVerifyFn.errors = [{ message: 'Invalid field', params: { field: 'test' } }]
      ;(getVerifyFunction as jest.Mock).mockReturnValue(mockVerifyFn)

      const result = verifyPayload('testSchema', { test: 'data' })
      expect(result).toEqual(['Invalid field: {"field":"test"}'])
    })

    it('should fail to return error message', () => {
      // Define the type for the mock function to include the errors property
      const mockVerifyFn: jest.Mock & { errors?: Array<{ message: string; params: any }> } = jest
        .fn()
        .mockReturnValue(false)
      ;(getVerifyFunction as jest.Mock).mockReturnValue(mockVerifyFn)

      const result = verifyPayload('testSchema', { test: 'data' })
      expect(result).toBe(null)
    })
  })

  describe('filterObjectByWhitelistedProps', () => {
    let ajv
    beforeEach(() => {
      ajv = new Ajv()
    })

    it('should return an object filtered by whitelisted properties', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const whitelist = [
        { name: 'a', type: 'number' },
        { name: 'c', type: 'number' },
      ]

      const result = filterObjectByWhitelistedProps(obj, whitelist)
      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('should return an empty object if no properties match the whitelist', () => {
      const obj = { x: 10, y: 20 }
      const whitelist = [{ name: 'a', type: 'number' }]

      const result = filterObjectByWhitelistedProps(obj, whitelist)
      expect(result).toEqual({})
    })

    it('should return an empty object if validation fails', () => {
      console.log = jest.fn() // Mock console.log

      const obj = { a: 'wrongType' }
      const whitelist = [{ name: 'a', type: 'number' }]

      // Mock AJV validation to fail
      const validate = jest.fn().mockReturnValue(false)
      ajv.compile = jest.fn().mockReturnValue(validate)

      const result = filterObjectByWhitelistedProps(obj, whitelist)
      expect(result).toEqual({})
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('validation errors in filterObjectByWhitelistedProps: '),
        expect.anything()
      )
    })

    it('should return the original object if all properties are whitelisted', () => {
      const obj = { a: 1, b: 2 }
      const whitelist = [
        { name: 'a', type: 'number' },
        { name: 'b', type: 'number' },
      ]

      const result = filterObjectByWhitelistedProps(obj, whitelist)
      expect(result).toEqual(obj)
    })

    it('should return an empty object if the input object is empty', () => {
      const obj = {}
      const whitelist = [{ name: 'a', type: 'number' }]

      const result = filterObjectByWhitelistedProps(obj, whitelist)
      expect(result).toEqual({})
    })

    it('should return an empty object if the whitelist is empty', () => {
      const obj = { a: 1, b: 2 }
      const whitelist = []

      const result = filterObjectByWhitelistedProps(obj, whitelist)
      expect(result).toEqual({})
    })
  })
})
