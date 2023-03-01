import VM, { VMOpts } from '@ethereumjs/vm'
import { default as runTx, RunTxOpts } from './runTx'
import { default as runCall, RunCallOpts } from './runCall'
import { ShardeumFlags } from '../shardeum/shardeumFlags'

export default class ShardeumVM extends VM {
  constructor(opts: VMOpts = {}) {
    super(opts)
  }

  // Resolving this any seems to be a bit of a pain
  // I think it will require touching files outside of the scope of this task
  // TODO: Figure out how to resolve this any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async runTx(opts: RunTxOpts): Promise<any> {
    if (ShardeumFlags.VerboseLogs) console.log('shardeum custom runTx')
    await this.init()
    return runTx.bind(this)(opts)
  }

  // Resolving this any seems to be a bit of a pain
  // I think it will require touching files outside of the scope of this task
  // TODO: Figure out how to resolve this any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async runCall(opts: RunCallOpts): Promise<any> {
    if (ShardeumFlags.VerboseLogs) console.log('shardeum custom runCall')
    await this.init()
    return runCall.bind(this)(opts) //as Promise<EVMResult>
  }
}
