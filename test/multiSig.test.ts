import { DevSecurityLevel, shardusFactory } from "@shardus/core"
import * as crypto from "@shardus/crypto-utils"
import { verifyMultiSig } from "../src/setup/helpers"

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

const KEYPAIRS: crypto.Keypair[]  = new Array(10)
crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

for(let i = 0; i < 10; i++) {
  KEYPAIRS[i] = crypto.generateKeypair()
} 

const changeConfigTx: any = {
  isInternalTx: true,
  internalTXType: 3,
  timestamp: Date.now(),
  from: KEYPAIRS[0].publicKey,
  config: '{"p2p":{"useBinarySerializedEndpoints":true}}',
  cycle: -1,
}

const tx_hash = crypto.hashObj(changeConfigTx)

test('should validate the internal tx with multi sig', () => {

  const sign: any = []
  for(let i = 0; i < 3; i++) {
    const signature = crypto.sign(tx_hash, KEYPAIRS[i].secretKey)
    sign.push({
      owner: KEYPAIRS[i].publicKey,
      sig: signature
    })
  }
  const mockAllowedDevKeys = {
    [KEYPAIRS[0].publicKey]: DevSecurityLevel.High,
    [KEYPAIRS[1].publicKey]: DevSecurityLevel.High,
    [KEYPAIRS[2].publicKey]: DevSecurityLevel.High
  }
  const result = verifyMultiSig(
    changeConfigTx,
    sign,
    mockAllowedDevKeys,
    3,
    DevSecurityLevel.High
  )

  expect(result).toBe(true)
})

test('should fail without min approval', ()=>{

  const sign: any = []
  for(let i = 0; i < 3; i++) {
    const signature = crypto.sign(tx_hash, KEYPAIRS[i].secretKey)
    sign.push({
      owner: KEYPAIRS[i].publicKey,
      sig: signature
    })
  }
  const mockAllowedDevKeys = {
    [KEYPAIRS[0].publicKey]: DevSecurityLevel.High,
    [KEYPAIRS[1].publicKey]: DevSecurityLevel.High,
    [KEYPAIRS[2].publicKey]: DevSecurityLevel.High
  }
  const result = verifyMultiSig(
    changeConfigTx,
    sign,
    mockAllowedDevKeys,
    4,
    DevSecurityLevel.High
  )

  expect(result).toBe(false)
})

test('should fail without min security level', ()=>{

  const sign: any = []
  for(let i = 0; i < 3; i++) {
    const signature = crypto.sign(tx_hash, KEYPAIRS[i].secretKey)
    sign.push({
      owner: KEYPAIRS[i].publicKey,
      sig: signature
    })
  }
  const mockAllowedDevKeys = {
    [KEYPAIRS[0].publicKey]: DevSecurityLevel.High,
    [KEYPAIRS[1].publicKey]: DevSecurityLevel.Medium,
    [KEYPAIRS[2].publicKey]: DevSecurityLevel.High
  }
  const result = verifyMultiSig(
    changeConfigTx,
    sign,
    mockAllowedDevKeys,
    3,
    DevSecurityLevel.High
  )

  expect(result).toBe(false)
})

test('should fail when pubkey is not recognized', ()=>{

  const sign: any = []
  for(let i = 0; i < 3; i++) {
    const signature = crypto.sign(tx_hash, KEYPAIRS[i].secretKey)
    sign.push({
      owner: KEYPAIRS[i].publicKey,
      sig: signature
    })
  }
  const mockAllowedDevKeys = {
    [KEYPAIRS[8].publicKey]: DevSecurityLevel.High,
    [KEYPAIRS[9].publicKey]: DevSecurityLevel.Medium,
  }
  const result = verifyMultiSig(
    changeConfigTx,
    sign,
    mockAllowedDevKeys,
    1,
    DevSecurityLevel.High
  )

  expect(result).toBe(false)
})

test('should fail when signature is invalid', ()=>{
  const sign: any = []
  const signature = crypto.sign(tx_hash, KEYPAIRS[0].secretKey)
  sign.push({
    owner: KEYPAIRS[0].publicKey,
    sig: signature.replace('a', 'b').replace('1','3') // temper with the signature signature
  })
  const mockAllowedDevKeys = {
    [KEYPAIRS[0].publicKey]: DevSecurityLevel.High,
  }
  const result = verifyMultiSig(
    changeConfigTx,
    sign,
    mockAllowedDevKeys,
    1,
    DevSecurityLevel.High
  )

  expect(result).toBe(false)
})
