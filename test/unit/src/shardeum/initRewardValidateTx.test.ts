import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals'
import { validateFields } from '../../../../src/tx/initRewardTimes'
import { InternalTXType, InitRewardTimes } from '../../../../src/shardeum/shardeumTypes'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'
import { shardeumGetTime } from '../../../../src/index'
// Mock modules
jest.mock('@shardeum-foundation/lib-crypto-utils')
jest.mock('../../../../src/index', () => ({
  shardeumGetTime: jest.fn(),
}))
beforeAll(() => {
  global.ShardeumFlags = { VerboseLogs: false }
  global.nestedCountersInstance = { countEvent: jest.fn() }
})
describe('validateFields', () => {
  const mockSign = { owner: 'owner', sig: 'sig' }
  const baseTx: InitRewardTimes = {
    nominee: 'a'.repeat(64),
    timestamp: 1720938600,
    nodeActivatedTime: 1720938699,
    txData: {
      startTime: 1720938699,
      publicKey: 'a'.repeat(64),
      nodeId: 'nodeid',
    },
    sign: mockSign,
    isInternalTx: true,
    internalTXType: InternalTXType.InitRewardTimes,
  }
  let mockShardus: any
  let verifyObjMock
  const mockTxDataHash = 'mockTxDataHash'
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(shardeumGetTime as jest.Mock).mockReturnValue(1720938700000)
    ;(crypto.hashObj as jest.Mock).mockReturnValue(mockTxDataHash)
    mockShardus = {
      serviceQueue: {
        containsTxData: jest.fn(() => true),
        getLatestNetworkTxEntryForSubqueueKey: jest.fn().mockReturnValue({
          hash: mockTxDataHash,
          tx: {
            type: 'nodeInitReward'
          }
        }),
      },
      getLatestCycles: jest.fn().mockReturnValue([
        {
          start: 1720938699,
          activatedPublicKeys: ['a'.repeat(64)]
        }
      ]),
    }
    verifyObjMock = jest.spyOn(crypto, 'verifyObj').mockReturnValue(true)
  })
  it('returns false for missing nominee', () => {
    const tx = { ...baseTx, nominee: undefined }
    expect(validateFields(tx as any, mockShardus)).toEqual({
      success: false,
      reason: 'invalid nominee field in setRewardTimes Tx',
    })
  })
  it('returns false for empty nominee', () => {
    const tx = { ...baseTx, nominee: '' }
    expect(validateFields(tx as any, mockShardus)).toEqual({
      success: false,
      reason: 'invalid nominee field in setRewardTimes Tx',
    })
  })
  it('returns false for nominee wrong length', () => {
    const tx = { ...baseTx, nominee: 'abc' }
    expect(validateFields(tx as any, mockShardus)).toEqual({
      success: false,
      reason: 'invalid nominee field in setRewardTimes Tx',
    })
  })
  it('returns false for missing nodeActivatedTime', () => {
    const tx = { ...baseTx }
    delete tx.nodeActivatedTime
    expect(validateFields(tx as any, mockShardus)).toEqual({
      success: false,
      reason: 'nodeActivatedTime field is not found in setRewardTimes Tx',
    })
  })
  it('returns false for negative nodeActivatedTime', () => {
    const tx = { ...baseTx, nodeActivatedTime: -1 }
    expect(validateFields(tx as any, mockShardus)).toEqual({
      success: false,
      reason: 'txData.startTime does not match nodeActivatedTime',
    })
  })
  it('returns false for nodeActivatedTime too far in the past', () => {
    const pastTime = 1571221268 // Approx Oct 2019
    // shardeumGetTime returns time in ms, so we mock it to return a time in ms

    ;(shardeumGetTime as jest.Mock).mockReturnValue(1571221265000)
    const tx = { ...baseTx, nodeActivatedTime: pastTime, txData: { ...baseTx.txData, startTime: 1568591444 } }
    expect(validateFields(tx as any, mockShardus)).toEqual({
      success: false,
      reason: 'txData.startTime does not match nodeActivatedTime',
    })
  })
  it('returns false for invalid signature', () => {
    verifyObjMock.mockReturnValue(false)
    expect(validateFields(baseTx, mockShardus)).toEqual({
      success: false,
      reason: 'Invalid signature',
    })
  })
  it('returns false if not in serviceQueue', () => {
    mockShardus.serviceQueue.containsTxData = jest.fn(() => false)
    expect(validateFields(baseTx, mockShardus)).toEqual({
      success: false,
      reason: 'node not in serviceQueue',
    })
  })
  it('returns false if txData.startTime does not match nodeActivatedTime', () => {
    const tx = { ...baseTx, txData: { ...baseTx.txData, startTime: 123 } }
    expect(validateFields(tx as any, mockShardus)).toEqual({
      success: false,
      reason: 'txData.startTime does not match nodeActivatedTime',
    })
  })
  it('returns false if txData.publicKey does not match nominee', () => {
    const tx = { ...baseTx, txData: { ...baseTx.txData, publicKey: 'b'.repeat(64) } }
    expect(validateFields(tx as any, mockShardus)).toEqual({
      success: false,
      reason: 'txData.publicKey does not match tx.nominee',
    })
  })
  it('returns true for valid tx', () => {
    expect(validateFields(baseTx, mockShardus)).toEqual({
      success: true,
      reason: 'valid',
    })
  })
  it('returns true for a valid tx that has a ms timestamp', () => {
    const tx = {
      internalTXType: 8,
      isInternalTx: true,
      nodeActivatedTime: 1752480275,
      nominee: '162c15ef77dece29ee9f46b333dc8de5167102be485034986aa0318c42951a2a',
      sign: {
        owner: 'de74658aacdbc9dc30235154cabc81554965cd3465e9885ecd8c55583d597013',
        sig: '32d5831272c69c318516df72d84e8a04b995421d20d6cd45e719b278c435a0b89cc09c9fd3a524820d82a724a2187dde4cd18406f15cf5a02a844a7447b7750808f5fe2c36c9c875dba80d65433304512cb4d6d2dd61494c60c4c0d470ca907c',
      },
      timestamp: 1752480455000,
      txData: {
        nodeId: '2f066cd6f7ed865a2358f1c3c2557f25fce477883acc1c18fd215b15d2775bd6',
        publicKey: '162c15ef77dece29ee9f46b333dc8de5167102be485034986aa0318c42951a2a',
        startTime: 1752480275,
      },
    }
    ;(shardeumGetTime as jest.Mock).mockReturnValue(1752480455000)
    // Update mock to handle this specific tx
    mockShardus.getLatestCycles.mockReturnValue([{
      start: 1752480275,
      activatedPublicKeys: ['162c15ef77dece29ee9f46b333dc8de5167102be485034986aa0318c42951a2a']
    }])
    expect(validateFields(tx as any, mockShardus)).toEqual({ success: true, reason: 'valid' })
  })
})
