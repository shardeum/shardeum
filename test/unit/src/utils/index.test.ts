import { describe, test, expect } from '@jest/globals'
import * as utilsExports from '../../../../src/utils/index'

describe('Utils index exports', () => {
  test('should export general utilities', () => {
    // These should be exported from general.ts
    expect(utilsExports.calculateGasPrice).toBeDefined()
    expect(utilsExports.scaleByStabilityFactor).toBeDefined()
    expect(utilsExports.sleep).toBeDefined()
    expect(utilsExports.replacer).toBeDefined()
    expect(utilsExports.getRandom).toBeDefined()
    expect(utilsExports.isWithinRange).toBeDefined()
    expect(utilsExports.formatErrorMessage).toBeDefined()
    expect(utilsExports.findMajorityResult).toBeDefined()
    expect(utilsExports.comparePropertiesTypes).toBeDefined()
    
    expect(typeof utilsExports.calculateGasPrice).toBe('function')
    expect(typeof utilsExports.scaleByStabilityFactor).toBe('function')
    expect(typeof utilsExports.sleep).toBe('function')
    expect(typeof utilsExports.replacer).toBe('function')
    expect(typeof utilsExports.getRandom).toBe('function')
    expect(typeof utilsExports.isWithinRange).toBe('function')
    expect(typeof utilsExports.formatErrorMessage).toBe('function')
    expect(typeof utilsExports.findMajorityResult).toBe('function')
    expect(typeof utilsExports.comparePropertiesTypes).toBe('function')
  })

  test('should export constants', () => {
    // These should be exported from constants.ts
    expect(utilsExports.zeroAddressStr).toBeDefined()
    expect(utilsExports.emptyCodeHash).toBeDefined()
    expect(utilsExports.zeroAddressAccount).toBeDefined()
    
    expect(typeof utilsExports.zeroAddressStr).toBe('string')
    expect(typeof utilsExports.emptyCodeHash).toBe('string')
    expect(utilsExports.zeroAddressAccount).toBeDefined()
  })

  test('should export serialization utilities', () => {
    // These should be exported from serialization.ts
    expect(utilsExports.isObject).toBeDefined()
    expect(utilsExports.convertBigIntsToHex).toBeDefined()
    expect(utilsExports.fixBigIntLiteralsToBigInt).toBeDefined()
    expect(utilsExports._base16BNParser).toBeDefined()
    expect(utilsExports._base10BNParser).toBeDefined()
    expect(utilsExports._readableSHM).toBeDefined()
    expect(utilsExports.debug_map_replacer).toBeDefined()
    
    expect(typeof utilsExports.isObject).toBe('function')
    expect(typeof utilsExports.convertBigIntsToHex).toBe('function')
    expect(typeof utilsExports.fixBigIntLiteralsToBigInt).toBe('function')
    expect(typeof utilsExports._base16BNParser).toBe('function')
    expect(typeof utilsExports._base10BNParser).toBe('function')
    expect(typeof utilsExports._readableSHM).toBe('function')
    expect(typeof utilsExports.debug_map_replacer).toBe('function')
  })

  test('should export version utilities', () => {
    // These should be exported from versions.ts
    expect(utilsExports.operatorCLIVersion).toBeDefined()
    expect(utilsExports.operatorGUIVersion).toBeDefined()
    expect(utilsExports.readOperatorVersions).toBeDefined()
    
    expect(typeof utilsExports.operatorCLIVersion).toBe('string')
    expect(typeof utilsExports.operatorGUIVersion).toBe('string')
    expect(typeof utilsExports.readOperatorVersions).toBe('function')
  })

  test('should export transaction utilities', () => {
    // These should be exported from transaction.ts
    expect(utilsExports.generateTxId).toBeDefined()
    expect(utilsExports.getTxSenderAddress).toBeDefined()
    expect(utilsExports.isInSenderCache).toBeDefined()
    expect(utilsExports.removeTxFromSenderCache).toBeDefined()
    expect(utilsExports.isStakingEVMTx).toBeDefined()
    
    expect(typeof utilsExports.generateTxId).toBe('function')
    expect(typeof utilsExports.getTxSenderAddress).toBe('function')
    expect(typeof utilsExports.isInSenderCache).toBe('function')
    expect(typeof utilsExports.removeTxFromSenderCache).toBe('function')
    expect(typeof utilsExports.isStakingEVMTx).toBe('function')
  })

  test('should export all required functions', () => {
    const exportedFunctions = Object.keys(utilsExports).filter(key => 
      typeof utilsExports[key] === 'function'
    )
    
    expect(exportedFunctions.length).toBeGreaterThan(10)
    expect(exportedFunctions).toContain('calculateGasPrice')
    expect(exportedFunctions).toContain('sleep')
    expect(exportedFunctions).toContain('isObject')
    expect(exportedFunctions).toContain('readOperatorVersions')
    expect(exportedFunctions).toContain('generateTxId')
  })

  test('should export all required constants', () => {
    const exportedConstants = Object.keys(utilsExports).filter(key => 
      typeof utilsExports[key] === 'string' || typeof utilsExports[key] === 'object'
    )
    
    expect(exportedConstants).toContain('zeroAddressStr')
    expect(exportedConstants).toContain('emptyCodeHash')
    expect(exportedConstants).toContain('operatorCLIVersion')
    expect(exportedConstants).toContain('operatorGUIVersion')
  })

  test('constants should have correct values', () => {
    expect(utilsExports.zeroAddressStr).toBe('0x0000000000000000000000000000000000000000')
    expect(utilsExports.emptyCodeHash).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
    expect(typeof utilsExports.operatorCLIVersion).toBe('string')
    expect(typeof utilsExports.operatorGUIVersion).toBe('string')
  })
})