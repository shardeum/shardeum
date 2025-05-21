import { jest, describe, test, expect, beforeEach } from '@jest/globals'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { generateTxId } from '../../../../src/utils'
import { sleep } from '../../../../src/utils'
import { shardeumGetTime } from '../../../../src'
import * as claimReward from '../../../../src/tx/claimReward'
import * as initRewardTimes from '../../../../src/tx/initRewardTimes'
import { injectSetCertTimeTx } from '../../../../src/tx/setCertTime'
import { getNodeAccountWithRetry, InjectTxToConsensor } from '../../../../src/handlers/queryCertificate'

jest.mock('../../../../src/utils', () => {
  const actual = jest.requireActual('../../../../src/utils') as any
  return { ...actual, sleep: jest.fn() }
})
jest.mock('../../../../src/handlers/queryCertificate')

jest.mock('../../../../src', () => ({
  shardeumGetTime: jest.fn(),
  createInternalTxReceipt: jest.fn(),
  logFlags: { dapp_verbose: false }
}))

describe('deterministic txId generation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(sleep as any).mockResolvedValue(undefined)
  })

  test('claimReward inject generates same txId across nodes', async () => {
    const originalFlag = ShardeumFlags.txHashingFix
    ShardeumFlags.txHashingFix = true
    const mockNodeAccount = { rewardStartTime: 0, rewardEndTime: 0, nominator: '0xaaa' }
    const mockEvent = {
      publicKey: 'pubkey',
      nodeId: 'node',
      time: 50,
      cycleNumber: 1,
      additionalData: { txData: { endTime: 60, publicKey: 'pubkey' } }
    }
    const createShardus = () => ({
      getLocalOrRemoteAccount: jest.fn(() => Promise.resolve({ data: mockNodeAccount } as any)),
      signAsNode: jest.fn().mockImplementation((tx: any) => ({ ...tx, sign: { owner: 'a', sig: 'b' } })),
      put: jest.fn()
    })

    const shardus1 = createShardus()
    ;(shardeumGetTime as any).mockReturnValueOnce(1000)
    await claimReward.injectClaimRewardTx(shardus1 as any, mockEvent as any)
    const tx1 = shardus1.put.mock.calls[0][0]
    const txId1 = generateTxId(tx1)

    const shardus2 = createShardus()
    ;(shardeumGetTime as any).mockReturnValueOnce(2000)
    await claimReward.injectClaimRewardTx(shardus2 as any, mockEvent as any)
    const tx2 = shardus2.put.mock.calls[0][0]
    const txId2 = generateTxId(tx2)

    expect(txId1).toBe(txId2)
    ShardeumFlags.txHashingFix = originalFlag
  })

  test('initRewardTimes inject generates same txId across nodes', async () => {
    const originalFlag = ShardeumFlags.txHashingFix
    ShardeumFlags.txHashingFix = true
    const mockNodeAccount = { rewardStartTime: 0, nominator: '0xaaa' }
    const mockEvent = {
      publicKey: 'pubkey',
      nodeId: 'node',
      time: 70,
      additionalData: { txData: { startTime: 70, publicKey: 'pubkey' } }
    }
    const createShardus = () => ({
      getLocalOrRemoteAccount: jest.fn(() => Promise.resolve({ data: mockNodeAccount } as any)),
      signAsNode: jest.fn().mockImplementation((tx: any) => ({ ...tx, sign: { owner: 'a', sig: 'b' } })),
      put: jest.fn()
    })

    const shardus1 = createShardus()
    ;(shardeumGetTime as any).mockReturnValueOnce(1000)
    await initRewardTimes.injectInitRewardTimesTx(shardus1 as any, mockEvent as any)
    const tx1 = shardus1.put.mock.calls[0][0]
    const txId1 = generateTxId(tx1)

    const shardus2 = createShardus()
    ;(shardeumGetTime as any).mockReturnValueOnce(2000)
    await initRewardTimes.injectInitRewardTimesTx(shardus2 as any, mockEvent as any)
    const tx2 = shardus2.put.mock.calls[0][0]
    const txId2 = generateTxId(tx2)

    expect(txId1).toBe(txId2)
    ShardeumFlags.txHashingFix = originalFlag
  })

  test('setCertTime inject generates same txId across nodes', async () => {
    const originalFlag = ShardeumFlags.txHashingFix
    ShardeumFlags.txHashingFix = true
    const mockActiveNodes = [{ id: 'node1', ip: '127.0.0.1', port: 3000, publicKey: 'pubkey' }]
    const createShardus = () => ({
      signAsNode: jest.fn().mockImplementation((tx: any) => ({ ...tx, sign: { owner: 'a', sig: 'b' } })),
      getLatestCycles: jest.fn().mockReturnValue([{ start: 0, duration: 30 }]),
      serviceQueue: { containsTxData: jest.fn().mockReturnValue(true) }
    })
    ;(getNodeAccountWithRetry as any).mockResolvedValue({ success: true, nodeAccount: { nominator: '0xaaa' } })
    ;(InjectTxToConsensor as any).mockResolvedValue({ success: true })

    const shardus1 = createShardus()
    ;(shardeumGetTime as any).mockReturnValueOnce(1000)
    await injectSetCertTimeTx(shardus1 as any, 'pubkey', mockActiveNodes)
    const tx1 = (InjectTxToConsensor as unknown as jest.Mock).mock.calls[0][1]
    const txId1 = generateTxId(tx1)

    const shardus2 = createShardus()
    ;(shardeumGetTime as any).mockReturnValueOnce(2000)
    await injectSetCertTimeTx(shardus2 as any, 'pubkey', mockActiveNodes)
    const tx2 = (InjectTxToConsensor as unknown as jest.Mock).mock.calls[1][1]
    const txId2 = generateTxId(tx2)

    expect(txId1).toBe(txId2)
    ShardeumFlags.txHashingFix = originalFlag
  })
})
