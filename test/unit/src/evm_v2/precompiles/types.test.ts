import type { PrecompileFunc, PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { EVMInterface, ExecResult } from '../../../../../src/evm_v2/types'
import type { Common } from '@ethereumjs/common'
import type { debug } from 'debug'
import { EvmError, ERROR } from '../../../../../src/evm_v2/exceptions'

describe('Precompile types', () => {
  describe('PrecompileInput interface', () => {
    it('should accept valid PrecompileInput', () => {
      const mockEVM: EVMInterface = {} as EVMInterface
      const mockCommon: Common = {} as Common
      const mockDebugger: debug.Debugger = {} as debug.Debugger

      const validInput: PrecompileInput = {
        data: new Uint8Array([1, 2, 3]),
        gasLimit: BigInt(100000),
        common: mockCommon,
        _EVM: mockEVM,
        _debug: mockDebugger
      }

      expect(validInput.data).toBeInstanceOf(Uint8Array)
      expect(validInput.gasLimit).toBe(BigInt(100000))
      expect(validInput.common).toBe(mockCommon)
      expect(validInput._EVM).toBe(mockEVM)
      expect(validInput._debug).toBe(mockDebugger)
    })

    it('should accept PrecompileInput without optional _debug', () => {
      const mockEVM: EVMInterface = {} as EVMInterface
      const mockCommon: Common = {} as Common

      const validInput: PrecompileInput = {
        data: new Uint8Array([]),
        gasLimit: BigInt(0),
        common: mockCommon,
        _EVM: mockEVM
      }

      expect(validInput._debug).toBeUndefined()
    })

    it('should handle different data sizes', () => {
      const mockEVM: EVMInterface = {} as EVMInterface
      const mockCommon: Common = {} as Common

      const emptyData: PrecompileInput = {
        data: new Uint8Array([]),
        gasLimit: BigInt(21000),
        common: mockCommon,
        _EVM: mockEVM
      }

      const largeData: PrecompileInput = {
        data: new Uint8Array(1024).fill(255),
        gasLimit: BigInt(1000000),
        common: mockCommon,
        _EVM: mockEVM
      }

      expect(emptyData.data.length).toBe(0)
      expect(largeData.data.length).toBe(1024)
    })

    it('should handle different gas limits', () => {
      const mockEVM: EVMInterface = {} as EVMInterface
      const mockCommon: Common = {} as Common

      const zeroGas: PrecompileInput = {
        data: new Uint8Array([]),
        gasLimit: BigInt(0),
        common: mockCommon,
        _EVM: mockEVM
      }

      const maxGas: PrecompileInput = {
        data: new Uint8Array([]),
        gasLimit: BigInt('9007199254740991'), // Max safe integer as bigint
        common: mockCommon,
        _EVM: mockEVM
      }

      expect(zeroGas.gasLimit).toBe(BigInt(0))
      expect(maxGas.gasLimit).toBe(BigInt('9007199254740991'))
    })
  })

  describe('PrecompileFunc type', () => {
    it('should define a synchronous precompile function', () => {
      const syncPrecompile: PrecompileFunc = (input: PrecompileInput): ExecResult => {
        return {
          returnValue: new Uint8Array([42]),
          executionGasUsed: BigInt(100)
        }
      }

      const mockInput: PrecompileInput = {
        data: new Uint8Array([1]),
        gasLimit: BigInt(1000),
        common: {} as Common,
        _EVM: {} as EVMInterface
      }

      const result = syncPrecompile(mockInput)
      expect(result).toHaveProperty('returnValue')
      expect(result).toHaveProperty('executionGasUsed')
    })

    it('should define an asynchronous precompile function', async () => {
      const asyncPrecompile: PrecompileFunc = async (input: PrecompileInput): Promise<ExecResult> => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return {
          returnValue: new Uint8Array([84]),
          executionGasUsed: BigInt(200)
        }
      }

      const mockInput: PrecompileInput = {
        data: new Uint8Array([2]),
        gasLimit: BigInt(2000),
        common: {} as Common,
        _EVM: {} as EVMInterface
      }

      const result = await asyncPrecompile(mockInput)
      expect(result.returnValue).toEqual(new Uint8Array([84]))
      expect(result.executionGasUsed).toBe(BigInt(200))
    })

    it('should handle precompile with exception', () => {
      const exceptionPrecompile: PrecompileFunc = (input: PrecompileInput): ExecResult => {
        return {
          returnValue: new Uint8Array([]),
          executionGasUsed: input.gasLimit,
          exceptionError: new EvmError(ERROR.REVERT)
        }
      }

      const mockInput: PrecompileInput = {
        data: new Uint8Array([3]),
        gasLimit: BigInt(3000),
        common: {} as Common,
        _EVM: {} as EVMInterface
      }

      const result = exceptionPrecompile(mockInput) as ExecResult
      expect(result.exceptionError).toBeDefined()
      expect(result.exceptionError?.error).toBe(ERROR.REVERT)
      expect(result.executionGasUsed).toBe(BigInt(3000))
    })

    it('should handle precompile that uses debug parameter', () => {
      const debugPrecompile: PrecompileFunc = (input: PrecompileInput): ExecResult => {
        if (input._debug) {
          // In real implementation, this would log something
          input._debug('Executing precompile')
        }
        return {
          returnValue: input.data,
          executionGasUsed: BigInt(50)
        }
      }

      const mockDebug = jest.fn() as unknown as debug.Debugger
      const mockInput: PrecompileInput = {
        data: new Uint8Array([4, 5, 6]),
        gasLimit: BigInt(4000),
        common: {} as Common,
        _EVM: {} as EVMInterface,
        _debug: mockDebug
      }

      const result = debugPrecompile(mockInput) as ExecResult
      expect(result.returnValue).toEqual(new Uint8Array([4, 5, 6]))
    })

    it('should create array of precompile functions', () => {
      const precompiles: PrecompileFunc[] = [
        (input) => ({ returnValue: new Uint8Array([1]), executionGasUsed: BigInt(10) }),
        async (input) => ({ returnValue: new Uint8Array([2]), executionGasUsed: BigInt(20) }),
        (input) => ({ returnValue: new Uint8Array([3]), executionGasUsed: BigInt(30) })
      ]

      expect(precompiles).toHaveLength(3)
      expect(typeof precompiles[0]).toBe('function')
      expect(typeof precompiles[1]).toBe('function')
      expect(typeof precompiles[2]).toBe('function')
    })

    it('should handle precompile that accesses EVM interface', () => {
      const evmPrecompile: PrecompileFunc = (input: PrecompileInput): ExecResult => {
        // In real implementation, this would interact with the EVM
        const hasEVM = input._EVM !== undefined
        return {
          returnValue: new Uint8Array([hasEVM ? 1 : 0]),
          executionGasUsed: BigInt(100)
        }
      }

      const mockInput: PrecompileInput = {
        data: new Uint8Array([]),
        gasLimit: BigInt(5000),
        common: {} as Common,
        _EVM: {} as EVMInterface
      }

      const result = evmPrecompile(mockInput) as ExecResult
      expect(result.returnValue).toEqual(new Uint8Array([1]))
    })
  })

  describe('Type compatibility', () => {
    it('should enforce correct return type for PrecompileFunc', () => {
      // This test verifies TypeScript type checking at compile time
      const validPrecompile: PrecompileFunc = (input) => {
        return {
          returnValue: new Uint8Array([]),
          executionGasUsed: BigInt(0)
        }
      }

      const validAsyncPrecompile: PrecompileFunc = async (input) => {
        return {
          returnValue: new Uint8Array([]),
          executionGasUsed: BigInt(0)
        }
      }

      expect(typeof validPrecompile).toBe('function')
      expect(typeof validAsyncPrecompile).toBe('function')
    })

    it('should handle all possible ExecResult properties', () => {
      const fullResultPrecompile: PrecompileFunc = (input): ExecResult => {
        return {
          returnValue: new Uint8Array([255]),
          executionGasUsed: BigInt(1000),
          exceptionError: undefined,
          selfdestruct: new Set(),
          createdAddresses: new Set(),
          gas: BigInt(500),
          logs: []
        }
      }

      const mockInput: PrecompileInput = {
        data: new Uint8Array([]),
        gasLimit: BigInt(10000),
        common: {} as Common,
        _EVM: {} as EVMInterface
      }

      const result = fullResultPrecompile(mockInput)
      expect(result).toHaveProperty('returnValue')
      expect(result).toHaveProperty('executionGasUsed')
      expect(result).toHaveProperty('selfdestruct')
      expect(result).toHaveProperty('createdAddresses')
      expect(result).toHaveProperty('gas')
      expect(result).toHaveProperty('logs')
    })
  })
})