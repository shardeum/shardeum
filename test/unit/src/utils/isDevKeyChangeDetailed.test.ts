import { isDevKeyChangeDetailed } from '../../../../src/utils/multisig'
import { describe, expect, test } from '@jest/globals'

/**
 * Unit tests for isDevKeyChangeDetailed
 */
describe('isDevKeyChangeDetailed', () => {
  test('returns true when devPublicKeys change', () => {
    const oldConfig = {
      debug: { devPublicKeys: { key1: 1 } }
    }

    const newConfig = {
      debug: { devPublicKeys: { key1: 1, key2: 2 } }
    }

    expect(isDevKeyChangeDetailed(oldConfig, newConfig)).toBe(true)
  })

  test('returns false when devPublicKeys stay the same', () => {
    const oldConfig = {
      debug: { devPublicKeys: { key1: 1 } }
    }

    const newConfig = {
      debug: { devPublicKeys: { key1: 1 } }
    }

    expect(isDevKeyChangeDetailed(oldConfig, newConfig)).toBe(false)
  })
})
