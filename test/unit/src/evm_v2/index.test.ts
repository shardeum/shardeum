import { describe, test, expect } from '@jest/globals'

// Mock all the dependencies to avoid complex imports
jest.mock('../../../../src/evm_v2/eof', () => ({
  EOF: class MockEOF {},
}))

jest.mock('../../../../src/evm_v2/evm', () => ({
  EVM: class MockEVM {},
}))

jest.mock('../../../../src/evm_v2/exceptions', () => ({
  ERROR: { INVALID_OPCODE: 'Invalid opcode' },
  EvmError: class MockEvmError extends Error {
    constructor(error: any) {
      super(error)
      this.name = 'EvmError'
    }
  },
}))

jest.mock('../../../../src/evm_v2/interpreter', () => ({
  InterpreterStep: class MockInterpreterStep {},
}))

jest.mock('../../../../src/evm_v2/message', () => ({
  Message: class MockMessage {
    constructor(opts?: any) {
      // Mock constructor that accepts optional parameters
    }
  },
}))

jest.mock('../../../../src/evm_v2/precompiles/index', () => ({
  getActivePrecompiles: jest.fn(() => new Map()),
  PrecompileInput: 'precompile',
}))

jest.mock('../../../../src/evm_v2/types', () => ({
  EVMInterface: 'interface',
  EVMResult: 'result',
  ExecResult: 'exec',
  Log: 'log',
  PrecompileInput: 'precompile',
}))

// Import after mocks are set up
import * as evmExports from '../../../../src/evm_v2/index'

describe('EVM v2 index exports', () => {
  test('should export EOF', () => {
    expect(evmExports.EOF).toBeDefined()
  })

  test('should export EVM', () => {
    expect(evmExports.EVM).toBeDefined()
  })

  test('should export EvmError', () => {
    expect(evmExports.EvmError).toBeDefined()
  })

  test('should export EVMErrorMessage', () => {
    expect(evmExports.EVMErrorMessage).toBeDefined()
  })

  // InterpreterStep is a type-only export and won't exist at runtime

  test('should export Message', () => {
    expect(evmExports.Message).toBeDefined()
  })

  test('should export getActivePrecompiles', () => {
    expect(evmExports.getActivePrecompiles).toBeDefined()
  })

  test('should export all expected runtime exports', () => {
    const exportKeys = Object.keys(evmExports).sort()
    const expectedKeys = [
      'EOF',
      'EVM',
      'EvmError',
      'EVMErrorMessage',
      'getActivePrecompiles',
      'Message',
    ].sort()
    expect(exportKeys).toEqual(expectedKeys)
  })

  // Type-only exports (EVMInterface, EVMResult, ExecResult, Log, PrecompileInput) 
  // don't exist at runtime and can't be tested this way

  test('functions should be defined', () => {
    expect(typeof evmExports.getActivePrecompiles).toBe('function')
  })

  test('classes should be defined', () => {
    expect(typeof evmExports.EvmError).toBe('function')
    expect(typeof evmExports.Message).toBe('function')
  })
})