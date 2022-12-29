import VM, {VMOpts} from '@ethereumjs/vm'
import { default as runTx, RunTxOpts, RunTxResult } from './runTx'
import { default as runCall, RunCallOpts } from './runCall'
import {ShardeumFlags} from '../shardeum/shardeumFlags'
import { EVMResult } from './evm/evm'

export default class ShardeumVM extends VM {
  constructor(opts: VMOpts = {}) {
    super(opts)
  }

  async runTx(opts): Promise<any> {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('shardeum custom runTx')
    await this.init()
    return runTx.bind(this)(opts)
  }

  async runCall(opts: RunCallOpts): Promise<any> { //Promise<EVMResult> 
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('shardeum custom runCall')
    await this.init()
    return runCall.bind(this)(opts) //as Promise<EVMResult> 

  }
}
