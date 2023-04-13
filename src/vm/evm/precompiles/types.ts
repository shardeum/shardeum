import { BN } from 'ethereumjs-util'
import Common from '@ethereumjs/common'
import { ExecResult } from '../evm'
import VM from '../../index'

export interface PrecompileFunc {
  (opts: PrecompileInput): Promise<ExecResult> | ExecResult
}

export interface PrecompileInput {
  data: Buffer
  gasLimit: BN
  _common: Common
  _VM: VM
}
