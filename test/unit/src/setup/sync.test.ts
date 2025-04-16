import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'

jest.resetModules();

const fakeGenesisPath = '/tmp/fake-genesis.json';

jest.mock('../../../../src/shardeum/wrappedEVMAccountFunctions', () => {
  return {
    __esModule: true,
    updateEthAccountHash: jest.fn(),
    _shardusWrappedAccount: jest.fn((acc) => ({ ...acc, stateId: 'mocked' })),
    _calculateAccountHash: jest.fn(() => 'mocked_hash'),
  }
})

jest.mock('@ethereumjs/util', () => {
  class Account {
    static fromAccountData = jest.fn(() => new Account());
    static fromRlpSerializedAccount = jest.fn(() => new Account());
    serialize = jest.fn(() => Buffer.from([]));
  }
  class Address {
    toString(): string { return '0x1111111111111111111111111111111111111111'; }
    static fromString(): Address { return new Address(); }
  }
  return {
    __esModule: true,
    Account,
    Address,
    hexToBytes: jest.fn(() => new Uint8Array()),
  }
})

jest.mock('@ethereumjs/statemanager', () => {
  return {
    __esModule: true,
    DefaultStateManager: jest.fn(),
  }
})

jest.mock('../../../../src/shardeum/evmAddress', () => {
  return {
    __esModule: true,
    toShardusAddress: jest.fn(() => 'mocked_shardus_address'),
  }
})

jest.mock('../../../../src/shardeum/debugRestoreAccounts', () => {
  return {
    __esModule: true,
    loadAccountDataFromDB: jest.fn().mockResolvedValue(undefined)
  }
})

jest.mock('../../../../src/index', () => {
  const createNetworkAccount = jest.fn(async () => ({ timestamp: 0, stateId: 'mocked', hash: 'mocked' }));
  return {
    __esModule: true,
    logFlags: { dapp_verbose: false, important_as_error: false },
    shardeumGetTime: (): number => 0,
    createNetworkAccount,
    default: { createNetworkAccount },
  }
})
jest.mock('../../../../src/storage/accountStorage', () => {
  return {
    __esModule: true,
  };
})
jest.mock('@shardeum-foundation/lib-crypto-utils', () => {
  const crypto = {
    __esModule: true,
    init: jest.fn(),
    setCustomStringifier: jest.fn(),
    hashObj: jest.fn(() => 'mocked_hash'),
  }
  return Object.assign(crypto, {
    crypto,
    default: crypto
  })
})
jest.mock('@shardeum-foundation/core', () => {
  return {
    DevSecurityLevel: {},
    Shardus: jest.fn(),
    ShardusTypes: {},
  }
})
import fs from 'fs'
let sync

describe('sync uses LOAD_JSON_GENESIS when SetupGenesisAccount is set', () => {
  let originalEnv
  const originalSetupGenesisAccount = ShardeumFlags.SetupGenesisAccount
  let existsSyncSpy: jest.SpyInstance
  let readFileSyncSpy: jest.SpyInstance

  beforeEach(() => {
    originalEnv = { ...process.env }
    jest.clearAllMocks()
    ShardeumFlags.SetupGenesisAccount = true
    process.env.LOAD_JSON_GENESIS = fakeGenesisPath
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue('{"0x1111111111111111111111111111111111111111": {"wei": "123"}}')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const secureAccounts = require('../../../../src/shardeum/secureAccounts')
    // Spy on initializeSecureAccount before requiring sync
    jest.spyOn(secureAccounts, 'initializeSecureAccount')
      .mockImplementation((config, cycles) => ({ id: 'some_id', hash: 'some_hash', timestamp: 0 }))
    // Mock manuallyCreateAccount and createAccount before requiring sync
    jest.mock('../../../../src/setup/sync', () => {
      const actual = jest.requireActual('../../../../src/setup/sync')
      return {
        ...actual,
        manuallyCreateAccount: jest.fn().mockResolvedValue({
          accountId: 'mocked_id',
          wrappedEVMAccount: { timestamp: 0, account: {}, ethAddress: 'mocked', hash: 'mocked', accountType: 0 },
          cycle: { counter: 1 }
        }),
        createAccount: jest.fn().mockResolvedValue({
          timestamp: 0, account: {}, ethAddress: 'mocked', hash: 'mocked', accountType: 0
        })
      }
    })
    // Import sync after setting up spies and mocks
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sync = require('../../../../src/setup/sync').sync
  })

  afterEach(() => {
    process.env = originalEnv
    ShardeumFlags.SetupGenesisAccount = originalSetupGenesisAccount
    existsSyncSpy.mockRestore()
    readFileSyncSpy.mockRestore()
  })

  it('reads the file specified by LOAD_JSON_GENESIS', async () => {
    // Minimal mock for shardus and evmCommon (not used in the file loading logic)
    const shardus: any = {
      p2p: { isFirstSeed: true },
      getNodeId: jest.fn(() => 'mock-node-id'),
      getLocalOrRemoteAccount: jest.fn().mockResolvedValue(null),
      getLatestCycles: jest.fn(() => [{ start: 0, counter: 1 }]),
      debugCommitAccountCopies: jest.fn(),
      forwardAccounts: jest.fn(),
      setGlobal: jest.fn(),
      log: jest.fn(),
      useAccountWrites: jest.fn(),
      getDevPublicKeys: jest.fn(() => ({})),
      getNetworkMode: jest.fn(() => ''),
    }
    const evmCommon = {}

    // Act
    await sync(shardus, evmCommon)()

    // Assert
    expect(fs.existsSync).toHaveBeenCalledWith(fakeGenesisPath)
    expect(fs.readFileSync).toHaveBeenCalledWith(fakeGenesisPath)
  })
}) 
