export { Bloom } from './bloom/index.js'
export { BlockBuilder, BuildStatus } from './buildBlock.js'
export { encodeReceipt } from './runBlock.js'
export * from './types.js'
import { VM } from './vm.js'
import { ShardeumFlags } from '../shardeum/shardeumFlags'


import type {
  BuildBlockOpts,
  RunBlockOpts,
  RunBlockResult,
  RunTxOpts,
  RunTxResult,
  VMEvents,
  VMOpts,
} from './types.js'
import {EVMRunCallOpts} from '../evm_v2/types'

// import VM, { VMOpts } from '@ethereumjs/vm'
// import { default as runTx, RunTxOpts } from './runTx'

// export default class ShardeumVM extends VM {
//   constructor(opts: VMOpts = {}) {
//     super(opts)
//   }
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   // async runTx(opts: RunTxOpts): Promise<any> {
//   //   if (ShardeumFlags.VerboseLogs) console.log('shardeum custom runTx')
//   //   await this.init()
//   //   return runTx.bind(this)(opts)
//   // }
//   //
//   // // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   // async runCall(opts: RunCallOpts): Promise<any> {
//   //   if (ShardeumFlags.VerboseLogs) console.log('shardeum custom runCall')
//   //   await this.init()
//   //   return runCall.bind(this)(opts) //as Promise<EVMResult>
//   // }
// }
export const ShardeumVM = VM
