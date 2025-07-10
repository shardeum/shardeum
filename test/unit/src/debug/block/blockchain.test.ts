import { describe, test, expect } from '@jest/globals'

// Simple test for the debug blockchain exports
describe('Debug blockchain', () => {
  test('should be importable', () => {
    // Test that the module can be imported without throwing
    expect(() => {
      const blockchainModule = require('../../../../../src/debug/block/blockchain')
      expect(blockchainModule).toBeDefined()
    }).not.toThrow()
  })

  test('should export blocks map', () => {
    const blockchainModule = require('../../../../../src/debug/block/blockchain')
    expect(blockchainModule.blocks).toBeDefined()
    expect(typeof blockchainModule.blocks).toBe('object')
  })

  test('should export getOrCreateBlockFromTimestamp function', () => {
    const blockchainModule = require('../../../../../src/debug/block/blockchain')
    expect(typeof blockchainModule.getOrCreateBlockFromTimestamp).toBe('function')
  })

  test('should export ShardeumBlock class', () => {
    const blockchainModule = require('../../../../../src/debug/block/blockchain')
    expect(typeof blockchainModule.ShardeumBlock).toBe('function')
  })

  test('should export all expected exports', () => {
    const blockchainModule = require('../../../../../src/debug/block/blockchain')
    const expectedExports = [
      'blocks',
      'getOrCreateBlockFromTimestamp',
      'ShardeumBlock',
    ]
    
    expectedExports.forEach(exportName => {
      expect(blockchainModule).toHaveProperty(exportName)
    })
  })

  test('blocks should be an object', () => {
    const blockchainModule = require('../../../../../src/debug/block/blockchain')
    expect(typeof blockchainModule.blocks).toBe('object')
    expect(blockchainModule.blocks).not.toBeNull()
  })

  test('should create ShardeumBlock instance', () => {
    const blockchainModule = require('../../../../../src/debug/block/blockchain')
    expect(() => {
      const instance = new blockchainModule.ShardeumBlock()
      expect(instance).toBeDefined()
    }).not.toThrow()
  })

  test('getOrCreateBlockFromTimestamp should be callable', () => {
    const blockchainModule = require('../../../../../src/debug/block/blockchain')
    expect(() => {
      const result = blockchainModule.getOrCreateBlockFromTimestamp(Date.now())
      expect(result).toBeDefined()
    }).not.toThrow()
  })
})