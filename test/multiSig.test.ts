import { verifyMultiSigs } from '../src/setup/helpers'
import { ethers, Wallet } from 'ethers'
import { expect, test, afterAll } from '@jest/globals'

const DevSecurityLevel = {
  Low: 0,
  Medium: 1,
  High: 2,
}

const wallet = Wallet.createRandom()
const changeConfigTx: any = {
  isInternalTx: true,
  internalTXType: 3,
  timestamp: Date.now(),
  from: wallet.publicKey,
  config: '{"p2p":{"useBinarySerializedEndpoints":true}}',
  cycle: -1,
}

const tx_hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(changeConfigTx)))

test('should validate the internal tx with multi sig', async () => {
  const sign: any = []
  const signature = await wallet.signMessage(tx_hash)
  sign.push({
    owner: wallet.address,
    sig: signature,
  })
  const mockAllowedDevKeys = {
    [wallet.address]: DevSecurityLevel.High,
  }
  const result = verifyMultiSigs(changeConfigTx, sign, mockAllowedDevKeys, 1, DevSecurityLevel.High)
  expect(result).toBe(true)
})

test('should validate the internal tx with multi sig 2', async () => {
  const sign: any = []
  for (let i = 0; i < 3; i++) {
    const wallet = Wallet.createRandom()
    const signature = await wallet.signMessage(tx_hash)
    sign.push({
      owner: wallet.address,
      sig: signature,
    })
  }
  const mockAllowedDevKeys = {
    [sign[0].owner]: DevSecurityLevel.High,
    [sign[1].owner]: DevSecurityLevel.High,
    [sign[2].owner]: DevSecurityLevel.High,
  }
  const result = verifyMultiSigs(changeConfigTx, sign, mockAllowedDevKeys, 3, DevSecurityLevel.High)

  expect(result).toBe(true)
})

test('should fail without min approval', async () => {
  const sign: any = []
  for (let i = 0; i < 3; i++) {
    const wallet = Wallet.createRandom()
    const signature = await wallet.signMessage(tx_hash)
    sign.push({
      owner: wallet.address,
      sig: signature,
    })
  }
  const mockAllowedDevKeys = {
    [sign[0].owner]: DevSecurityLevel.High,
    [sign[1].owner]: DevSecurityLevel.High,
    [sign[2].owner]: DevSecurityLevel.High,
  }
  const result = verifyMultiSigs(changeConfigTx, sign, mockAllowedDevKeys, 4, DevSecurityLevel.High)

  expect(result).toBe(false)
})

test('should fail without min security level', async () => {
  const sign: any = []
  for (let i = 0; i < 3; i++) {
    const wallet = Wallet.createRandom()
    const signature = await wallet.signMessage(tx_hash)
    sign.push({
      owner: wallet.address,
      sig: signature,
    })
  }
  const mockAllowedDevKeys = {
    [sign[0].owner]: DevSecurityLevel.High,
    [sign[1].owner]: DevSecurityLevel.Medium,
    [sign[2].owner]: DevSecurityLevel.High,
  }
  const result = verifyMultiSigs(changeConfigTx, sign, mockAllowedDevKeys, 3, DevSecurityLevel.High)

  expect(result).toBe(false)
})

test('should fail when pubkey is not recognized', async () => {
  const sign: any = []
  for (let i = 0; i < 3; i++) {
    const wallet = Wallet.createRandom()
    const signature = await wallet.signMessage(tx_hash)
    sign.push({
      owner: wallet.address,
      sig: signature,
    })
  }
  const mockAllowedDevKeys = {
    [Wallet.createRandom().address]: DevSecurityLevel.High,
    [Wallet.createRandom().address]: DevSecurityLevel.Medium,
  }
  const result = verifyMultiSigs(changeConfigTx, sign, mockAllowedDevKeys, 1, DevSecurityLevel.High)

  expect(result).toBe(false)
})

test('should fail when signature is invalid', async () => {
  const sign: any = []
  const wallet = Wallet.createRandom()
  const signature = await wallet.signMessage(tx_hash)
  sign.push({
    owner: Wallet.createRandom().address,
    sig: signature, // temper with the signature signature
  })
  const mockAllowedDevKeys = {
    [wallet.address]: DevSecurityLevel.High,
  }
  const result = verifyMultiSigs(changeConfigTx, sign, mockAllowedDevKeys, 1, DevSecurityLevel.High)

  expect(result).toBe(false)
})

test('backward compatible with single sig payloads', async () => {
  const tx_copy = { ...changeConfigTx }
  const tx_hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(changeConfigTx)))
  const wallet = Wallet.createRandom()
  const hashed_sig = await wallet.signMessage(tx_hash)

  const signature = await wallet.signMessage(tx_hash)
  tx_copy.sign = {
    owner: wallet.address,
    sig: signature,
  }

  const mockAllowedDevKeys = {
    [wallet.address]: DevSecurityLevel.High,
  }
  const { sign, ...txWithoutSign } = tx_copy
  const result = verifyMultiSigs(txWithoutSign, [tx_copy.sign], mockAllowedDevKeys, 1, DevSecurityLevel.High)

  expect(result).toBe(true)

  expect(tx_copy.sign.sig).toBe(hashed_sig)
})

afterAll(async () => {
  // Ensure all asynchronous operations are completed
  await new Promise((resolve) => setTimeout(resolve, 1000))
})
