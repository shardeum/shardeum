import { jest } from '@jest/globals'
import { getCachedRIAccount } from '../../../../src/storage/riAccountsCache'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'

jest.mock('../../../../src', () => ({
  isServiceMode: jest.fn().mockReturnValue(false),
  logFlags: {
    important_as_fatal: false,
    dapp_verbose: false,
  },
}))

describe('getCachedRIAccount', () => {
  const originalFlag = ShardeumFlags.enableRIAccountsCache

  beforeEach(() => {
    ShardeumFlags.enableRIAccountsCache = false
  })

  afterEach(() => {
    ShardeumFlags.enableRIAccountsCache = originalFlag
  })

  it('resolves to undefined when caching is disabled', async () => {
    const result = await getCachedRIAccount('0x123')
    expect(result).toBeUndefined()
  })
})
