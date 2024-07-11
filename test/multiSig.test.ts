import { DevSecurityLevel } from "@shardus/core"
import * as crypto from "@shardus/crypto-utils"
import { verifyMultiSigs } from "../src/setup/helpers"
import { Utils } from "@shardus/types"

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

crypto.setCustomStringifier(Utils.safeStringify, 'shardus_safeStringify')

const KEYPAIRS: crypto.Keypair[]  = new Array(10)

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
  const result = verifyMultiSigs(
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
  const result = verifyMultiSigs(
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
  const result = verifyMultiSigs(
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
  const result = verifyMultiSigs(
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
    owner: KEYPAIRS[2].publicKey,
    sig: signature // temper with the signature signature
  })
  const mockAllowedDevKeys = {
    [KEYPAIRS[0].publicKey]: DevSecurityLevel.High,
  }
  const result = verifyMultiSigs(
    changeConfigTx,
    sign,
    mockAllowedDevKeys,
    1,
    DevSecurityLevel.High
  )

  expect(result).toBe(false)
})

test('backward compitible with single sig payloads', ()=>{
  const tx_copy = changeConfigTx
  const tx_hash = crypto.hashObj(changeConfigTx)
  const hashed_sig = crypto.sign(tx_hash, KEYPAIRS[0].secretKey)

  crypto.signObj(tx_copy, KEYPAIRS[0].secretKey, KEYPAIRS[0].publicKey)

  const mockAllowedDevKeys = {
    [KEYPAIRS[0].publicKey]: DevSecurityLevel.High,
  }
  const {sign, ...txWithoutSign} = tx_copy
  const result = verifyMultiSigs(
    txWithoutSign,
    [tx_copy.sign],
    mockAllowedDevKeys,
    1,
    DevSecurityLevel.High
  )
  
  expect(result).toBe(true)
  
  expect(tx_copy.sign.sig).toBe(hashed_sig)

})

