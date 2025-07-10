import { describe, test, expect } from '@jest/globals'

// Mock the individual models to avoid complex dependencies
jest.mock('../../../../../src/storage/models/accountsEntry', () => ({
  default: { name: 'accountsEntry', mock: true },
}))

jest.mock('../../../../../src/storage/models/riAccountsCache', () => ({
  default: { name: 'riAccountsCache', mock: true },
}))

import models from '../../../../../src/storage/models/index'
import accountsEntry from '../../../../../src/storage/models/accountsEntry'
import riAccountsCache from '../../../../../src/storage/models/riAccountsCache'

describe('Storage models index', () => {
  test('should export array of models', () => {
    expect(Array.isArray(models)).toBe(true)
  })

  test('should contain accountsEntry model', () => {
    expect(models).toContain(accountsEntry)
  })

  test('should contain riAccountsCache model', () => {
    expect(models).toContain(riAccountsCache)
  })

  test('should have exactly 2 models', () => {
    expect(models.length).toBe(2)
  })

  test('should maintain correct order', () => {
    expect(models[0]).toBe(accountsEntry)
    expect(models[1]).toBe(riAccountsCache)
  })

  test('all models should be defined', () => {
    models.forEach(model => {
      expect(model).toBeDefined()
      expect(model).not.toBeNull()
    })
  })

  test('should be the default export', () => {
    expect(models).toBeDefined()
  })
})