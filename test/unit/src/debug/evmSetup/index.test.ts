import { describe, test, expect } from '@jest/globals'

// Simple test for the debug evmSetup index exports
describe('Debug EVM Setup', () => {
  test('should be importable', () => {
    // Test that the module can be imported without throwing
    expect(() => {
      const evmSetupModule = require('../../../../../src/debug/evmSetup/index')
      expect(evmSetupModule).toBeDefined()
    }).not.toThrow()
  })

  test('should export networkAccount', () => {
    const evmSetupModule = require('../../../../../src/debug/evmSetup/index')
    expect(evmSetupModule.networkAccount).toBeDefined()
    expect(evmSetupModule.networkAccount).toHaveProperty('accountId')
    expect(evmSetupModule.networkAccount).toHaveProperty('stateId')
    expect(evmSetupModule.networkAccount).toHaveProperty('data')
    expect(evmSetupModule.networkAccount).toHaveProperty('timestamp')
  })

  test('should export initEVMSingletons function', () => {
    const evmSetupModule = require('../../../../../src/debug/evmSetup/index')
    expect(typeof evmSetupModule.initEVMSingletons).toBe('function')
  })

  test('should export expected variables', () => {
    const evmSetupModule = require('../../../../../src/debug/evmSetup/index')
    const expectedExports = [
      'evmCommon',
      'EVM',
      'shardeumStateTXMap',
      'shardusAddressToEVMAccountInfo',
      'debugAppdata',
      'networkAccount',
      'initEVMSingletons',
    ]
    
    expectedExports.forEach(exportName => {
      expect(evmSetupModule).toHaveProperty(exportName)
    })
  })

  test('networkAccount should have correct structure', () => {
    const evmSetupModule = require('../../../../../src/debug/evmSetup/index')
    const networkAccount = evmSetupModule.networkAccount
    
    expect(networkAccount.accountId).toBe('0000000000000000000000000000000000000000000000000000000000000000')
    expect(networkAccount.data).toBeDefined()
    expect(networkAccount.data.accountType).toBe(5)
    expect(networkAccount.data.current).toBeDefined()
    expect(networkAccount.data.current.activeVersion).toBe('1.3.0')
    expect(networkAccount.data.current.certCycleDuration).toBe(30)
    expect(networkAccount.data.current.maintenanceFee).toBe(0)
    expect(networkAccount.data.current.txPause).toBe(false)
  })

  test('networkAccount should have list of changes', () => {
    const evmSetupModule = require('../../../../../src/debug/evmSetup/index')
    const networkAccount = evmSetupModule.networkAccount
    
    expect(Array.isArray(networkAccount.data.listOfChanges)).toBe(true)
    expect(networkAccount.data.listOfChanges.length).toBe(1)
    expect(networkAccount.data.listOfChanges[0]).toHaveProperty('change')
    expect(networkAccount.data.listOfChanges[0]).toHaveProperty('cycle')
  })

  test('should export maps', () => {
    const evmSetupModule = require('../../../../../src/debug/evmSetup/index')
    
    // These may be undefined initially but should be defined after initEVMSingletons
    expect(evmSetupModule).toHaveProperty('shardeumStateTXMap')
    expect(evmSetupModule).toHaveProperty('shardusAddressToEVMAccountInfo')
    expect(evmSetupModule).toHaveProperty('debugAppdata')
  })
})