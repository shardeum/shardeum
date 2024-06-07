import * as crypto from '@shardus/crypto-utils'
import { Utils } from '@shardus/types'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')
crypto.setCustomStringifier(Utils.safeStringify, 'shardus_safeStringify')
const data = {
  address: '0x1f1545Eb7EE5C3C1c4784ee9ddE5D26A9f76F77C',
  timestamp: Date.now(),
  nonce: BigInt(123),
  codeHash: new Uint8Array([10, 20, 30, 40]),
}

// const data ={
//   id: '0000000000000000000000000000000000000000000000000000000000000000',
//   accountType: 5,
//   listOfChanges: [ { cycle: 1, change: [Object] } ],
//   current: {
//     title: 'Initial parameters',
//     description: 'These are the initial network parameters Shardeum started with',
//     nodeRewardInterval: 3600000,
//     nodeRewardAmountUsd: BigInt(1000000000000000000),
//     nodePenaltyUsd: BigInt(1000000000000000000),
//     stakeRequiredUsd: BigInt(1000000000000000000),
//     maintenanceInterval: 86400000,
//     maintenanceFee: 0,
//     minVersion: '1.5.3',
//     activeVersion: '1.5.3',
//     latestVersion: '1.5.4',
//     stabilityScaleMul: 1000,
//     stabilityScaleDiv: 1000,
//     txPause: false,
//     certCycleDuration: 30
//   },
//   next: {},
//   hash: '',
//   timestamp: new Date()
// }

function test1() {
  console.log(`Original data`, data)
  const hashBefore = crypto.hashObj(data)

  const jsonString = Utils.safeStringify(data)
  console.log('JSON String:', jsonString)

  const parsedObject = Utils.safeJsonParse(jsonString)
  console.log('Parsed Object:', parsedObject)

  const hashAfter = crypto.hashObj(parsedObject)

  console.log(`hash before: ${hashBefore}`)
  console.log(`hash after: ${hashAfter}`)
}

function test2() {
  console.log(`Original data`, data)
  const hashBefore = crypto.hashObj(data)

  const replacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
      return { _BigInt_: value.toString() }
    }
    if (value instanceof Uint8Array) {
      return { __Uint8Array__: Array.from(value) }
    }
    return value
  }
  const reviver = (key: string, value: any) => {
    if (value && value._BigInt_) {
      return BigInt(value.__BigInt__)
    }
    if (value && value.__Uint8Array__ instanceof Array) {
      return new Uint8Array(value.__Uint8Array__)
    }
    return value
  }

  const jsonString = JSON.stringify(data, replacer)
  console.log('JSON String:', jsonString)

  const parsedObject = JSON.parse(jsonString, reviver)
  console.log('Parsed Object:', parsedObject)

  const hashAfter = crypto.hashObj(parsedObject)

  console.log(`hash before: ${hashBefore}`)
  console.log(`hash after: ${hashAfter}`)
}

test1()
