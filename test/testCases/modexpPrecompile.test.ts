import { Common, Hardfork } from '@ethereumjs/common'
import { EVM } from '../../src/evm_v2'
import { bytesToHex, hexToBytes } from '@ethereumjs/util'
import { DefaultStateManager } from '@ethereumjs/statemanager'
import { testData } from './modexp-testdata'
import { ERROR, EvmError } from '../../src/evm_v2/exceptions'
import { getActivePrecompiles } from '../../src/evm_v2/precompiles'
import type { PrecompileFunc } from '../../src/evm_v2/precompiles/types'

describe('Precompiles: MODEXP (Fuzzer and Edge Cases from EIP-198)', () => {
    const evmCommon = new Common({ chain: 'mainnet', hardfork: Hardfork.Byzantium })
    let customEVM: EVM
    let MODEXP: PrecompileFunc

    beforeAll(() => {
        const precompiles = getActivePrecompiles(evmCommon)
        MODEXP = precompiles.get('0000000000000000000000000000000000000005')!
    })

    beforeEach(() => {
        const stateManager = new DefaultStateManager()
        customEVM = new EVM({
            common: evmCommon,
            stateManager,
        })
    })

    afterEach(() => {
        customEVM.cleanUp()
    })

    describe('Fuzzer tests (direct call)', () => {
        testData.data.forEach(([input, expected], i) => {
            it(`should pass fuzzer test case ${i + 1}`, async () => {
                const result = await MODEXP({
                    data: hexToBytes(input),
                    gasLimit: BigInt(0xffffff),
                    common: evmCommon,
                    _EVM: customEVM,
                })
                const output = bytesToHex(result.returnValue)
                expect(output).toEqual(expected)
            })
        })
    })

    it('should correctly right-pad data if input length is too short and fail on gas', async () => {
        const gas = BigInt(0xffff)
        const result = await MODEXP({
            data: hexToBytes('0x41'),
            gasLimit: gas,
            common: evmCommon,
            _EVM: customEVM,
        })
        expect(result.executionGasUsed).toEqual(gas)
        expect(result.exceptionError).toBeInstanceOf(EvmError)
        expect(result.exceptionError?.error).toBe(ERROR.OUT_OF_GAS)
    })
}) 