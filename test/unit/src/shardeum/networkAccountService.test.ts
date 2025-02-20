import { buildFetchNetworkAccountFromArchiver } from '../../../../src/shardeum/services/networkAccountService'
import { Archiver } from '@shardeum-foundation/lib-archiver-discovery/dist/src/types'
import { NetworkAccount } from '../../../../src/shardeum/shardeumTypes'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const noop = (): void => { /* noop */ }

describe('NetworkAccountService', () => {
  // Mock dependencies
  const mockArchiver: Archiver = {
    ip: '127.0.0.1',
    port: 8080,
    publicKey: 'mock-public-key'
  }

  const mockNetworkAccount = {
    data: {
      hash: 'mock-hash',
      // Add other required network account fields here
    }
  }

  const mockNetworkAccountHashResponse = {
    networkAccountHash: 'mock-hash',
    sign: {
      owner: 'mock-public-key',
      sig: 'mock-signature'
    }
  }

  const mockDependencies = {
    getFinalArchiverList: jest.fn().mockReturnValue([mockArchiver]),
    getRandom: jest.fn().mockImplementation((list: Archiver[], count: number) => list.slice(0, count)),
    verify: jest.fn().mockReturnValue(true),
    ShardeumFlags: {
      VerboseLogs: false,
      enableArchiverNetworkAccountValidation: true
    },
    WrappedEVMAccountFunctions: {
      accountSpecificHash: jest.fn().mockReturnValue('mock-hash')
    },
    nestedCountersInstance: {
      countEvent: jest.fn()
    },
    findMajorityResult: jest.fn().mockImplementation((values) => values[0] || null),
    safeStringify: jest.fn().mockImplementation(JSON.stringify)
  }

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
    // Reset console.log and console.error spies
    jest.spyOn(console, 'log').mockImplementation(noop)
    jest.spyOn(console, 'error').mockImplementation(noop)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should fetch network account from archiver', async () => {
    // Mock axios responses
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({ data: mockNetworkAccountHashResponse }))
      .mockImplementationOnce(() => Promise.resolve({ data: { networkAccount: mockNetworkAccount } }))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(mockDependencies)
    const networkAccount = await fetchNetworkAccountFromArchiver()
    
    expect(networkAccount).toBeDefined()
    expect(mockDependencies.getFinalArchiverList).toHaveBeenCalled()
    expect(mockDependencies.getRandom).toHaveBeenCalled()
    expect(mockDependencies.verify).toHaveBeenCalled()
    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
  })

  it('should handle empty archiver list', async () => {
    const modifiedDeps = {
      ...mockDependencies,
      getFinalArchiverList: jest.fn().mockReturnValue([])
    }

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow()
  })

  it('should validate network account hash when validation is enabled', async () => {
    // Mock axios responses
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({ data: mockNetworkAccountHashResponse }))
      .mockImplementationOnce(() => Promise.resolve({ data: { networkAccount: mockNetworkAccount } }))

    const modifiedDeps = {
      ...mockDependencies,
      ShardeumFlags: {
        VerboseLogs: true, // Enable verbose logs
        enableArchiverNetworkAccountValidation: true
      }
    }

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await fetchNetworkAccountFromArchiver()

    expect(modifiedDeps.WrappedEVMAccountFunctions.accountSpecificHash).toHaveBeenCalled()
    expect(console.log).toHaveBeenCalled()
  })

  it('should handle verification failure', async () => {
    const modifiedDeps = {
      ...mockDependencies,
      verify: jest.fn().mockReturnValue(false)
    }

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow()
  })

  it('should handle null response data', async () => {
    mockedAxios.get.mockImplementationOnce(() => Promise.resolve({ data: null }))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(mockDependencies)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow()
  })

  it('should handle mismatched archiver public key', async () => {
    mockedAxios.get.mockImplementationOnce(() => Promise.resolve({
      data: {
        ...mockNetworkAccountHashResponse,
        sign: { ...mockNetworkAccountHashResponse.sign, owner: 'different-public-key' }
      }
    }))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(mockDependencies)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow()
  })

  it('should handle network request failures', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(mockDependencies)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow()
    expect(console.error).toHaveBeenCalled()
    expect(mockDependencies.nestedCountersInstance.countEvent).toHaveBeenCalledWith(
      'network-config-operation',
      'error: Network error'
    )
  })

  it('should handle malformed network account data', async () => {
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({ data: mockNetworkAccountHashResponse }))
      .mockImplementationOnce(() => Promise.resolve({ data: { networkAccount: { data: null } } }))

    const modifiedDeps = {
      ...mockDependencies,
      ShardeumFlags: {
        VerboseLogs: false,
        enableArchiverNetworkAccountValidation: true
      }
    }

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('Not able to fetch')
    expect(modifiedDeps.nestedCountersInstance.countEvent).toHaveBeenCalledWith(
      'network-config-operation',
      expect.stringContaining('malformed data')
    )
  })

  it('should handle hash mismatch during validation', async () => {
    const mockResponse = {
      data: {
        networkAccount: {
          data: {
            hash: 'mock-hash',
            // Add other required network account fields here
          }
        }
      }
    }

    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({ data: mockNetworkAccountHashResponse }))
      .mockImplementationOnce(() => Promise.resolve(mockResponse))

    const modifiedDeps = {
      ...mockDependencies,
      verify: jest.fn().mockReturnValue(true),
      WrappedEVMAccountFunctions: {
        accountSpecificHash: jest.fn().mockReturnValue('different-hash')
      }
    }

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('Not able to fetch')
    expect(modifiedDeps.nestedCountersInstance.countEvent).toHaveBeenCalledWith(
      'network-config-operation',
      'failure: The rehashed network account is not the same as the majority hash'
    )
  })

  it('should handle multiple archivers with majority result', async () => {
    const mockArchivers = [
      { ip: '127.0.0.1', port: 8080, publicKey: 'pk1' },
      { ip: '127.0.0.2', port: 8080, publicKey: 'pk2' },
      { ip: '127.0.0.3', port: 8080, publicKey: 'pk3' }
    ]

    const modifiedDeps = {
      ...mockDependencies,
      getFinalArchiverList: jest.fn().mockReturnValue(mockArchivers),
      getRandom: jest.fn().mockReturnValue(mockArchivers)
    }

    // Mock successful responses for all archivers
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({
        data: { ...mockNetworkAccountHashResponse, sign: { owner: 'pk1', sig: 'sig1' } }
      }))
      .mockImplementationOnce(() => Promise.resolve({
        data: { ...mockNetworkAccountHashResponse, sign: { owner: 'pk2', sig: 'sig2' } }
      }))
      .mockImplementationOnce(() => Promise.resolve({
        data: { ...mockNetworkAccountHashResponse, sign: { owner: 'pk3', sig: 'sig3' } }
      }))
      .mockImplementationOnce(() => Promise.resolve({ data: { networkAccount: mockNetworkAccount } }))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    const result = await fetchNetworkAccountFromArchiver()

    expect(result).toBeDefined()
    expect(mockedAxios.get).toHaveBeenCalledTimes(4) // 3 hash requests + 1 data request
  })

  it('should handle no majority result', async () => {
    const mockArchivers = [
      { ip: '127.0.0.1', port: 8080, publicKey: 'pk1' },
      { ip: '127.0.0.2', port: 8080, publicKey: 'pk2' }
    ]

    const modifiedDeps = {
      ...mockDependencies,
      getFinalArchiverList: jest.fn().mockReturnValue(mockArchivers),
      getRandom: jest.fn().mockReturnValue(mockArchivers),
      findMajorityResult: jest.fn().mockReturnValue(null)
    }

    // Mock responses with different hashes
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({
        data: { networkAccountHash: 'hash1', sign: { owner: 'pk1', sig: 'sig1' } }
      }))
      .mockImplementationOnce(() => Promise.resolve({
        data: { networkAccountHash: 'hash2', sign: { owner: 'pk2', sig: 'sig2' } }
      }))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('no majority found')
  })

  it('should handle network account fetch failure after majority', async () => {
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({ data: mockNetworkAccountHashResponse }))
      .mockRejectedValueOnce(new Error('Failed to fetch network account'))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(mockDependencies)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('Not able to fetch')
    expect(console.error).toHaveBeenCalled()
  })

  it('should handle validation disabled', async () => {
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({ data: mockNetworkAccountHashResponse }))
      .mockImplementationOnce(() => Promise.resolve({ data: { networkAccount: mockNetworkAccount } }))

    const modifiedDeps = {
      ...mockDependencies,
      ShardeumFlags: {
        VerboseLogs: false,
        enableArchiverNetworkAccountValidation: false
      }
    }

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    const result = await fetchNetworkAccountFromArchiver()
    expect(result).toBeDefined()
    expect(modifiedDeps.WrappedEVMAccountFunctions.accountSpecificHash).not.toHaveBeenCalled()
  })

  it('should handle response verification failure after majority', async () => {
    const mockResponse = {
      data: {
        networkAccount: {
          data: {
            hash: 'mock-hash',
            // Add other required network account fields here
          }
        }
      }
    }

    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({ data: mockNetworkAccountHashResponse }))
      .mockImplementationOnce(() => Promise.resolve(mockResponse))

    const modifiedDeps = {
      ...mockDependencies,
      verify: jest.fn()
        .mockReturnValueOnce(true) // First call during hash verification
        .mockReturnValueOnce(false) // Second call during network account verification
    }

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('Not able to fetch')
    expect(modifiedDeps.nestedCountersInstance.countEvent).toHaveBeenCalledWith(
      'network-config-operation',
      'failure: The response signature is not the same from archiver pk:${majorityValue.archiver.publicKey}'
    )
  })

  it('should handle all archivers failing', async () => {
    const mockArchivers = [
      { ip: '127.0.0.1', port: 8080, publicKey: 'pk1' },
      { ip: '127.0.0.2', port: 8080, publicKey: 'pk2' }
    ]

    const modifiedDeps = {
      ...mockDependencies,
      getFinalArchiverList: jest.fn().mockReturnValue(mockArchivers),
      getRandom: jest.fn().mockReturnValue(mockArchivers)
    }

    // Mock all archivers failing
    mockedAxios.get
      .mockRejectedValueOnce(new Error('Network error 1'))
      .mockRejectedValueOnce(new Error('Network error 2'))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('no majority found')
  })

  it('should handle random archiver selection', async () => {
    const mockArchivers = [
      { ip: '127.0.0.1', port: 8080, publicKey: 'pk1' },
      { ip: '127.0.0.2', port: 8080, publicKey: 'pk2' },
      { ip: '127.0.0.3', port: 8080, publicKey: 'pk3' },
      { ip: '127.0.0.4', port: 8080, publicKey: 'pk4' }
    ]

    const selectedArchivers = mockArchivers.slice(0, 3)

    const modifiedDeps = {
      ...mockDependencies,
      getFinalArchiverList: jest.fn().mockReturnValue(mockArchivers),
      getRandom: jest.fn().mockReturnValue(selectedArchivers)
    }

    // Mock successful responses for selected archivers
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({
        data: { ...mockNetworkAccountHashResponse, sign: { owner: 'pk1', sig: 'sig1' } }
      }))
      .mockImplementationOnce(() => Promise.resolve({
        data: { ...mockNetworkAccountHashResponse, sign: { owner: 'pk2', sig: 'sig2' } }
      }))
      .mockImplementationOnce(() => Promise.resolve({
        data: { ...mockNetworkAccountHashResponse, sign: { owner: 'pk3', sig: 'sig3' } }
      }))
      .mockImplementationOnce(() => Promise.resolve({ data: { networkAccount: mockNetworkAccount } }))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await fetchNetworkAccountFromArchiver()

    expect(modifiedDeps.getRandom).toHaveBeenCalledWith(mockArchivers, 3)
  })

  it('should handle less than 3 archivers', async () => {
    const mockArchivers = [
      { ip: '127.0.0.1', port: 8080, publicKey: 'pk1' },
      { ip: '127.0.0.2', port: 8080, publicKey: 'pk2' }
    ]

    const modifiedDeps = {
      ...mockDependencies,
      getFinalArchiverList: jest.fn().mockReturnValue(mockArchivers),
      getRandom: jest.fn().mockReturnValue(mockArchivers)
    }

    // Mock successful responses for all archivers
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({
        data: { ...mockNetworkAccountHashResponse, sign: { owner: 'pk1', sig: 'sig1' } }
      }))
      .mockImplementationOnce(() => Promise.resolve({
        data: { ...mockNetworkAccountHashResponse, sign: { owner: 'pk2', sig: 'sig2' } }
      }))
      .mockImplementationOnce(() => Promise.resolve({ data: { networkAccount: mockNetworkAccount } }))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await fetchNetworkAccountFromArchiver()

    expect(modifiedDeps.getRandom).toHaveBeenCalledWith(mockArchivers, 2)
  })

  it('should handle response signature verification failure during hash check', async () => {
    const mockArchivers = [
      { ip: '127.0.0.1', port: 8080, publicKey: 'pk1' }
    ]

    const modifiedDeps = {
      ...mockDependencies,
      getFinalArchiverList: jest.fn().mockReturnValue(mockArchivers),
      getRandom: jest.fn().mockReturnValue(mockArchivers),
      verify: jest.fn().mockReturnValue(false)
    }

    mockedAxios.get.mockImplementationOnce(() => Promise.resolve({
      data: {
        networkAccountHash: 'mock-hash',
        sign: {
          owner: 'pk1',
          sig: 'invalid-signature'
        }
      }
    }))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(modifiedDeps)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('no majority found')
    expect(modifiedDeps.nestedCountersInstance.countEvent).toHaveBeenCalledWith(
      'network-config-operation',
      'error: The response signature is not the same from archiver pk:pk1'
    )
  })

  it('should handle null response data during network account fetch', async () => {
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({ data: mockNetworkAccountHashResponse }))
      .mockImplementationOnce(() => Promise.resolve({ data: null }))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(mockDependencies)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('Not able to fetch')
    expect(mockDependencies.nestedCountersInstance.countEvent).toHaveBeenCalledWith(
      'network-config-operation',
      'failure: did not get network account from archiver private key, returned null. Use default configs.'
    )
  })

  it('should handle network error during network account fetch', async () => {
    mockedAxios.get
      .mockImplementationOnce(() => Promise.resolve({ data: mockNetworkAccountHashResponse }))
      .mockRejectedValueOnce(new Error('Network error'))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(mockDependencies)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('Not able to fetch')
    expect(mockDependencies.nestedCountersInstance.countEvent).toHaveBeenCalledWith(
      'network-config-operation',
      'error: Network error'
    )
  })

  it('should handle network error during hash check', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error during hash check'))

    const fetchNetworkAccountFromArchiver = buildFetchNetworkAccountFromArchiver(mockDependencies)
    await expect(fetchNetworkAccountFromArchiver()).rejects.toThrow('no majority found')
    expect(mockDependencies.nestedCountersInstance.countEvent).toHaveBeenCalledWith(
      'network-config-operation',
      'error: Network error during hash check'
    )
  })
})
