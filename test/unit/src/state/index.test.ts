import { describe, test, expect } from '@jest/globals'
import * as stateExports from '../../../../src/state/index'
import ShardeumState from '../../../../src/state/shardeumState'
import TransactionState from '../../../../src/state/transactionState'

describe('State index exports', () => {
  test('should export ShardeumState as named export', () => {
    expect(stateExports.ShardeumState).toBe(ShardeumState)
  })

  test('should export TransactionState as named export', () => {
    expect(stateExports.TransactionState).toBe(TransactionState)
  })

  test('should export exactly the expected exports', () => {
    const exportKeys = Object.keys(stateExports).sort()
    const expectedKeys = ['ShardeumState', 'TransactionState'].sort()
    expect(exportKeys).toEqual(expectedKeys)
  })

  test('exported classes should be constructable', () => {
    expect(() => new stateExports.ShardeumState()).not.toThrow()
    expect(() => new stateExports.TransactionState()).not.toThrow()
  })
})