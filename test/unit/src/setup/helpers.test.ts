import { Utils } from '@shardeum-foundation/lib-types'
import { ethers } from 'ethers'
import { verifyMultiSigs } from '../../../../src/setup/helpers'
import { DevSecurityLevel } from '@shardeum-foundation/core'
import { Sign } from '@shardeum-foundation/core/dist/shardus/shardus-types'

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