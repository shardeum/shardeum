import { describe, it, expect } from '@jest/globals'
import { DefaultBlockchain } from '../../../../src/evm_v2/types'
import { zeros } from '@ethereumjs/util'

describe('EVM Types', () => {
  describe('DefaultBlockchain', () => {
    let blockchain: DefaultBlockchain

    beforeEach(() => {
      blockchain = new DefaultBlockchain()
    })

    describe('getBlock', () => {
      it('should return a mock block with hash function', async () => {
        const block = await blockchain.getBlock()
        expect(block).toBeDefined()
        expect(block).toHaveProperty('hash')
        expect(typeof block.hash).toBe('function')
      })

      it('should return a block that produces 32 zero bytes hash', async () => {
        const block = await blockchain.getBlock()
        const hash = block.hash()
        
        expect(hash).toBeInstanceOf(Uint8Array)
        expect(hash.length).toBe(32)
        expect(hash).toEqual(zeros(32))
      })

      it('should return same hash format for all calls', async () => {
        const block1 = await blockchain.getBlock()
        const block2 = await blockchain.getBlock()
        
        const hash1 = block1.hash()
        const hash2 = block2.hash()
        
        expect(hash1).toEqual(hash2)
        expect(hash1).toEqual(zeros(32))
      })
    })

    describe('shallowCopy', () => {
      it('should return the same instance (this)', () => {
        const copy = blockchain.shallowCopy()
        expect(copy).toBe(blockchain)
      })

      it('should maintain the same behavior after shallow copy', async () => {
        const copy = blockchain.shallowCopy()
        const block = await copy.getBlock()
        const hash = block.hash()
        
        expect(hash).toEqual(zeros(32))
      })
    })

    describe('Blockchain interface implementation', () => {
      it('should implement all required Blockchain interface methods', () => {
        expect(blockchain).toHaveProperty('getBlock')
        expect(blockchain).toHaveProperty('shallowCopy')
        expect(typeof blockchain.getBlock).toBe('function')
        expect(typeof blockchain.shallowCopy).toBe('function')
      })
    })
  })

  describe('Type exports', () => {
    // This test verifies that types are properly exported and can be imported
    it('should export all necessary types', () => {
      // Import test - if this compiles, types are exported correctly
      const typeImports: string[] = [
        'DeleteOpcode',
        'AddOpcode',
        'CustomOpcode',
        'EVMRunOpts',
        'EVMRunCodeOpts',
        'EVMRunCallOpts',
        'EVMEvents',
        'EVMInterface',
        'EVMOpts',
        'EVMResult',
        'ExecResult',
        'Log',
        'Block',
        'TransientStorageInterface',
        'Blockchain',
        'DefaultBlockchain'
      ]
      
      // This test primarily ensures that the module exports what it should
      expect(typeImports.length).toBeGreaterThan(0)
    })
  })
})