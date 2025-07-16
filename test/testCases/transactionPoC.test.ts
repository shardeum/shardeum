import { Common, Hardfork} from '@ethereumjs/common'
import { EVM as EthereumVirtualMachine } from '../../src/evm_v2/evm'
import {
  Address, bytesToHex, hexToBytes
} from '@ethereumjs/util'
import { DefaultStateManager } from '@ethereumjs/statemanager'

describe('Precompiles: BLAKE2F', () => {
  it('BLAKE2F PoC', async () => {
    const evmCommon = new Common({ chain: 'mainnet', hardfork: Hardfork.Cancun, eips: [3855, 5656, 1153] })
    const calldata =
            '0x0000000c28c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b3dd8338ed89de6791854126751ac933302810c04147014e9eb472e4dbc09d3c96abb531c9ae39c9e6c454cb83913d688795e237837d30258d11ea7c75201003000454cb83913d688795e237837d30258d11ea7c752011af5b8015c64d39ab44c60ead8317f9f5a9b6c4c01000000000100ca9a3b000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000'
    const customEVM = new EthereumVirtualMachine({
      common: evmCommon,
      stateManager: new DefaultStateManager()
    })
    // This proxy contract copies calldata to memory at an offset, then calls the precompile
    const code = `0x366000602037600080366020600060095AF1593D6000593E3D90F3`
    await customEVM.stateManager.putContractCode(Address.zero(), hexToBytes(code))
    try {
      const runTxResult = await customEVM.runCall(
        {
          data: hexToBytes(calldata),
          to: Address.zero()
        }
      )
      console.log('RETURN VALUE:', bytesToHex(runTxResult.execResult.returnValue))
    } finally {
      customEVM.cleanUp()
    }
  })
})