import VM from '@ethereumjs/vm'
import { default as runTx, RunTxOpts, RunTxResult } from './runTx'
import {ShardeumFlags} from '../shardeum/shardeumFlags'

export default class ShardeumVM extends VM {
  constructor(opts = {}) {
    super()
  }

  async runTx(opts): Promise<any> {
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('shardeum custom runTx')
    await this.init()
    return runTx.bind(this)(opts)
  }
}
