import { buildFetchNetworkAccountFromArchiver } from '../../../../src/shardeum/services/networkAccountService'

describe('NetworkAccountService', () => {
  it('should fetch network account from archiver', async () => {
    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver({
      getFinalArchiverList: () => [],
      getRandom: () => [],
      verify: () => true,
      ShardeumFlags: {
        VerboseLogs: false,
        enableArchiverNetworkAccountValidation: true
      },
      WrappedEVMAccountFunctions: {
        accountSpecificHash: () => ''
      },
      nestedCountersInstance: {
        countEvent: () => {
          // do nothing
        }
      },
      findMajorityResult: () => null,
      safeStringify: () => '',
    })
    const networkAccount = await fetchNetworkAccountFromArchiver()
    expect(networkAccount).toBeDefined()
  })
})
