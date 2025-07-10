import { describe, test, expect } from '@jest/globals'

// Mock dependencies to avoid complex imports
jest.mock('../../../../src/vm_v7/bloom/index.js', () => ({
  Bloom: class MockBloom {}
}))

jest.mock('../../../../src/vm_v7/buildBlock.js', () => ({
  BlockBuilder: class MockBlockBuilder {},
  BuildStatus: { MOCK: 'status' }
}))

jest.mock('../../../../src/vm_v7/runBlock.js', () => ({
  encodeReceipt: jest.fn()
}))

jest.mock('../../../../src/vm_v7/types.js', () => ({
  mockType: 'type'
}))

jest.mock('../../../../src/vm_v7/vm.js', () => ({
  VM: class MockVM {}
}))

jest.mock('../../../../src/shardeum/shardeumFlags', () => ({
  ShardeumFlags: {}
}))

describe('vm_v7/index', () => {
  describe('exports', () => {
    test('should export Bloom from bloom/index.js', async () => {
      const { Bloom } = await import('../../../../src/vm_v7/index')
      expect(Bloom).toBeDefined()
      expect(typeof Bloom).toBe('function')
    })

    test('should export BlockBuilder from buildBlock.js', async () => {
      const { BlockBuilder } = await import('../../../../src/vm_v7/index')
      expect(BlockBuilder).toBeDefined()
      expect(typeof BlockBuilder).toBe('function')
    })

    test('should export BuildStatus from buildBlock.js', async () => {
      const { BuildStatus } = await import('../../../../src/vm_v7/index')
      expect(BuildStatus).toBeDefined()
      expect(typeof BuildStatus).toBe('object')
    })

    test('should export encodeReceipt from runBlock.js', async () => {
      const { encodeReceipt } = await import('../../../../src/vm_v7/index')
      expect(encodeReceipt).toBeDefined()
      expect(typeof encodeReceipt).toBe('function')
    })

    test('should re-export types from types.js', async () => {
      // Types are not available at runtime, so we just verify the module loads
      const exports = await import('../../../../src/vm_v7/index')
      expect(exports).toBeDefined()
    })

    test('should export ShardeumVM as VM', async () => {
      const { ShardeumVM } = await import('../../../../src/vm_v7/index')
      expect(ShardeumVM).toBeDefined()
      expect(typeof ShardeumVM).toBe('function')
    })

    test('should have all expected exports', async () => {
      const exports = await import('../../../../src/vm_v7/index')
      const expectedExports = ['Bloom', 'BlockBuilder', 'BuildStatus', 'encodeReceipt', 'ShardeumVM']
      
      expectedExports.forEach(exportName => {
        expect(exports[exportName]).toBeDefined()
      })
    })

    test('should not export undefined values', async () => {
      const exports = await import('../../../../src/vm_v7/index')
      const exportKeys = Object.keys(exports)
      
      exportKeys.forEach(key => {
        expect(exports[key]).toBeDefined()
      })
    })
  })
})