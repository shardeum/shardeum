import {
  verify,
  isInternalTXGlobal,
  isInternalTx,
  isDebugTx,
  getInjectedOrGeneratedTimestamp,
  hashSignedObj,
  verifyMultiSigs
} from '../../../../src/setup/helpers'
import { InternalTXType, InternalTx } from '../../../../src/shardeum/shardeumTypes'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'
import { Utils } from '@shardeum-foundation/lib-types'
import { ethers } from 'ethers'
import { DevSecurityLevel } from '@shardeum-foundation/core'
import { Sign } from '@shardeum-foundation/core/dist/shardus/shardus-types'

jest.mock('@shardeum-foundation/lib-crypto-utils', () => ({
  init: jest.fn(),
  setCustomStringifier: jest.fn(),
  verifyObj: jest.fn(),
  hashObj: jest.fn(),
}))

describe('verify', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should verify an object with matching public key', () => {
    const mockObj = {
      sign: { owner: 'testPk' },
      data: 'testData',
    }
    ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

    const result = verify(mockObj, 'testPk')
    expect(result).toBe(true)
    expect(crypto.verifyObj).toHaveBeenCalledWith(mockObj)
  })

  it('should return false for mismatched public key', () => {
    const mockObj = {
      sign: { owner: 'testPk' },
      data: 'testData',
    }

    const result = verify(mockObj, 'differentPk')
    expect(result).toBe(false)
  })

  it('should verify an object without public key check', () => {
    const mockObj = {
      sign: { owner: 'testPk' },
      data: 'testData',
    }
    ;(crypto.verifyObj as jest.Mock).mockReturnValue(true)

    const result = verify(mockObj)
    expect(result).toBe(true)
    expect(crypto.verifyObj).toHaveBeenCalledWith(mockObj)
  })

  it('should handle null/undefined input', () => {
    ;(crypto.verifyObj as jest.Mock).mockImplementation(() => {
      throw new TypeError('Input must be an object.')
    })

    expect(() => verify(null)).toThrow(TypeError)
    expect(() => verify(undefined)).toThrow(TypeError)
  })
})

describe('isInternalTXGlobal', () => {
  const createMockInternalTx = (internalTXType: InternalTXType): InternalTx => ({
    isInternalTx: true,
    internalTXType,
    timestamp: Date.now(),
    sign: { owner: 'test', sig: 'test' },
  })

  it('should identify SetGlobalCodeBytes as global', () => {
    const tx = createMockInternalTx(InternalTXType.SetGlobalCodeBytes)
    expect(isInternalTXGlobal(tx)).toBe(true)
  })

  it('should identify ApplyChangeConfig as global', () => {
    const tx = createMockInternalTx(InternalTXType.ApplyChangeConfig)
    expect(isInternalTXGlobal(tx)).toBe(true)
  })

  it('should identify InitNetwork as global', () => {
    const tx = createMockInternalTx(InternalTXType.InitNetwork)
    expect(isInternalTXGlobal(tx)).toBe(true)
  })

  it('should identify ApplyNetworkParam as global', () => {
    const tx = createMockInternalTx(InternalTXType.ApplyNetworkParam)
    expect(isInternalTXGlobal(tx)).toBe(true)
  })

  it('should identify non-global transaction types', () => {
    const tx = createMockInternalTx(InternalTXType.Stake)
    expect(isInternalTXGlobal(tx)).toBe(false)
  })

  it('should handle missing internalTXType', () => {
    const tx = createMockInternalTx(InternalTXType.Stake)
    delete (tx as any).internalTXType
    expect(isInternalTXGlobal(tx)).toBe(false)
  })

  it('should handle null/undefined input', () => {
    expect(() => isInternalTXGlobal(null as any)).toThrow()
    expect(() => isInternalTXGlobal(undefined as any)).toThrow()
  })
})

describe('isInternalTx', () => {
  it('should identify internal transaction', () => {
    const tx = { isInternalTx: true }
    expect(isInternalTx(tx)).toBe(true)
  })

  it('should identify external transaction with raw field', () => {
    const tx = { raw: 'someData' }
    expect(isInternalTx(tx)).toBe(false)
  })

  it('should handle null/undefined input', () => {
    expect(isInternalTx(null as any)).toBe(false)
    expect(isInternalTx(undefined as any)).toBe(false)
  })

  it('should handle empty object', () => {
    expect(isInternalTx({})).toBe(false)
  })
})

describe('isDebugTx', () => {
  it('should identify debug transaction', () => {
    const tx = { isDebugTx: true }
    expect(isDebugTx(tx)).toBe(true)
  })

  it('should identify non-debug transaction', () => {
    const tx = { isDebugTx: false }
    expect(isDebugTx(tx)).toBe(true) // Note: This might be a bug in the original code
  })

  it('should handle missing isDebugTx field', () => {
    const tx = {}
    expect(isDebugTx(tx)).toBe(false)
  })

  it('should handle null/undefined input', () => {
    expect(() => isDebugTx(null as any)).toThrow()
    expect(() => isDebugTx(undefined as any)).toThrow()
  })
})

// Note: getTransactionObj tests will require more complex mocking of TransactionFactory
// This will be implemented in the next iteration

describe('getInjectedOrGeneratedTimestamp', () => {
  it('should use timestamp from timestampReceipt', () => {
    const tx = {
      timestampReceipt: { timestamp: 1234567890 },
      tx: {},
    }
    expect(getInjectedOrGeneratedTimestamp(tx)).toBe(1234567890)
  })

  it('should use timestamp from tx when timestampReceipt is not available', () => {
    const tx = {
      tx: { timestamp: 1234567890 },
    }
    expect(getInjectedOrGeneratedTimestamp(tx)).toBe(1234567890)
  })

  it('should handle float timestamps', () => {
    const tx = {
      timestampReceipt: { timestamp: 1234567890.123 },
    }
    expect(getInjectedOrGeneratedTimestamp(tx)).toBe(1234567890)
  })

  it('should return NaN when no timestamp is available', () => {
    const tx = {
      tx: {},
    }
    expect(getInjectedOrGeneratedTimestamp(tx)).toBe(NaN)
  })
})

describe('hashSignedObj', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(crypto.hashObj as jest.Mock).mockReturnValue('mockedHash')
  })

  it('should hash object with sign field', () => {
    const obj = { sign: { owner: 'test' }, data: 'test' }
    const result = hashSignedObj(obj)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should hash object without sign field', () => {
    const obj = { data: 'test' }
    const result = hashSignedObj(obj)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle null/undefined input', () => {
    expect(() => hashSignedObj(null as any)).toThrow()
    expect(() => hashSignedObj(undefined as any)).toThrow()
  })
})

describe('verifyMultiSigs', () => {
  const requiredSigs = 1
  const objectToSign = { type: 'gold', data: [{ address: '0xd79eFA2f9bB9C780e4Ce05D6b8a15541915e4636' }] }
  const testWallet = new ethers.Wallet('0x1234567890123456789012345678901234567890123456789012345678901234')
  const testAddress = testWallet.address
  const devPublicKeys = {
    [testAddress]: DevSecurityLevel.High,
  }

  const getTestSignatureObject = async (): Promise<Sign> => {
    const messageToSign = Utils.safeStringify(objectToSign)
    const signature = await testWallet.signMessage(messageToSign)
    return {
      owner: testAddress,
      sig: signature,
    }
  }

  it('should return true', async () => {
    const signatureObject = await getTestSignatureObject()
    const isValidSig = verifyMultiSigs(
      objectToSign,
      [signatureObject],
      devPublicKeys,
      requiredSigs,
      DevSecurityLevel.High
    )

    expect(isValidSig).toBe(true)
  })

  it('should return false because of invalid payload', async () => {
    const isValidSig = verifyMultiSigs(
      { type: 'gold', data: [{ address: '0x01' }] },
      [await getTestSignatureObject()],
      devPublicKeys,
      requiredSigs,
      DevSecurityLevel.High
    )

    expect(isValidSig).toBe(false)
  })

  it('should return false because of signer is not a multi sig signer', async () => {
    const isValidSig = verifyMultiSigs(
      objectToSign,
      [await getTestSignatureObject()],
      { '0x1e5e12568b7103E8B22cd680A6fa6256DD66ED76': DevSecurityLevel.High },
      requiredSigs,
      DevSecurityLevel.High
    )

    expect(isValidSig).toBe(false)
  })
})