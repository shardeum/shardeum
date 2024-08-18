import Common, { Chain } from '@ethereumjs/common'
import { Shardus, shardusFactory } from '@shardus/core'
import config from '../../src/config'
import { ShardeumFlags } from '../../src/shardeum/shardeumFlags'
import { sync } from '../../src/setup/sync'
import * as crypto from '@shardus/crypto-utils'
import * as debugRestoreAccounts from '../../src/shardeum/debugRestoreAccounts'
import * as AccountsStorage from '../../src/storage/accountStorage'
import { MOCK_SHARDUS_CONFIG } from '../mocks/mockShardusConfig'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

jest.useFakeTimers()

jest.mock('../../src/storage/accountStorage')
jest.mock('../../src/shardeum/debugRestoreAccounts')

jest.mock('@shardus/core', () => {
  return {
    Shardus: jest.fn().mockImplementation(() => {
      return {
        getDebugModeMiddleware: () => {},
        registerExternalGet: () => {},
        registerExternalPost: () => {},
        registerExceptionHandler: () => {},
        start: () => {},
        on: () => {},
        setup: () => {},
        useAccountWrites: jest.fn(),
        p2p: {
          isFirstSeed: true,
        },
        getNodeId: jest.fn(() => 'mock-node-id'),
        log: jest.fn(),
        getLatestCycles: jest.fn(() => [
          {
            start: 0,
          },
        ]),
        forwardAccounts: jest.fn(),
        setGlobal: jest.fn(),
        getLocalOrRemoteAccount: jest.fn(),
        debugCommitAccountCopies: jest.fn(),
      }
    }),
    shardusFactory: () => {
      return new Shardus(MOCK_SHARDUS_CONFIG)
    },
  }
})

jest.mock('../../src/utils/general', () => {
  const originalModule = jest.requireActual('../../src/utils/general')

  return {
    ...originalModule,
    // Mock the sleep function to resolve immediately, speeding up tests
    sleep: jest.fn(async () => {}),
  }
})

describe('sync', () => {
  let evmCommon: Common
  let shardus: Shardus

  beforeEach(() => {
    evmCommon = new Common({ chain: Chain.Mainnet })
    // @ts-ignore
    shardus = shardusFactory(config)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })
  it('calls useAccountWrites as expected', async () => {
    await sync(shardus, evmCommon)()

    expect(shardus.useAccountWrites).toHaveBeenCalledTimes(1)
  })

  it('does not call useAccountWrites as expected', async () => {
    // @ts-ignore Ignore rewriting of constant
    ShardeumFlags.useAccountWrites = false

    await sync(shardus, evmCommon)()
    expect(shardus.useAccountWrites).not.toHaveBeenCalled()
  })

  it('calls loadAccountDataFromDB as expected', async () => {
    await sync(shardus, evmCommon)()
    expect(debugRestoreAccounts.loadAccountDataFromDB).toHaveBeenCalledWith(shardus, {
      file: ShardeumFlags.DebugRestoreFile,
    })
  })

  it('does not call loadAccountDataFromDB as expected', async () => {
    // @ts-ignore Ignore rewriting of constant
    ShardeumFlags.DebugRestoreFile = null

    await sync(shardus, evmCommon)()
    expect(debugRestoreAccounts.loadAccountDataFromDB).not.toHaveBeenCalled()
  })

  describe('set up genesis account', () => {
    it('sets up genesis account as expected', async () => {
      await sync(shardus, evmCommon)()

      expect(AccountsStorage.setAccount).toHaveBeenCalledWith(
        '774491f80f47fedb119bb861601490f42bc3ea3b57fc63906c0d08e6d777a592',
        {
          accountType: 8,
          hash: 'cbfee3cb884e7d046220ecbf75a219cf6063dc1b03051b4bc8dd12193de9cd70',
          id: '774491f80f47fedb119bb861601490f42bc3ea3b57fc63906c0d08e6d777a592',
          timestamp: 0,
        }
      )
      expect(shardus.debugCommitAccountCopies).toHaveBeenCalledTimes(1)
      expect(shardus.forwardAccounts).toHaveBeenCalledTimes(1)
    })

    it('does not call debugCommitAccountCopies when SetupGenesisAccount is false', async () => {
      // @ts-ignore Ignore rewriting of constant
      ShardeumFlags.SetupGenesisAccount = false

      await sync(shardus, evmCommon)()
      expect(shardus.debugCommitAccountCopies).not.toHaveBeenCalled()
    })

    it('does not call forwardAccounts when forwardGenesisAccounts is false', async () => {
      // @ts-ignore Ignore rewriting of constant
      ShardeumFlags.forwardGenesisAccounts = false

      await sync(shardus, evmCommon)()
      expect(shardus.forwardAccounts).not.toHaveBeenCalled()
    })
  })

  it('logs the account if it already exists', async () => {
    const existingAccount = {
      accountId: 'mock-account-id',
      stateId: 'mock-state-id',
    }
    shardus.getLocalOrRemoteAccount = jest.fn().mockResolvedValue(existingAccount)

    await sync(shardus, evmCommon)()
    expect(shardus.log).toHaveBeenCalledWith('NETWORK_ACCOUNT ALREADY EXISTED: ', existingAccount)
  })

  it('sets a global account when the account does not exist', async () => {
    await sync(shardus, evmCommon)()
    expect(shardus.setGlobal).toHaveBeenCalledTimes(1)
  })
})
