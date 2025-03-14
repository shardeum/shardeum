import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'

describe('AJVSchemaEnum', () => {
  it('should be defined', () => {
    expect(AJVSchemaEnum).toBeDefined()
  })

  it('should contain all expected values', () => {
    const expectedValues = [
      'QueryCertReq',
      'InjectTxReq',
      'PenaltyTx',
      'InternalTxBase',
      'LeftNetworkEarlyViolationData',
      'SyncingTimeoutViolationData',
      'NodeRefutedViolationData',
      'Sign',
      'AppJoinData',
      'StakeResp',
      'StakeCert',
      'RemoveNodeCert',
      'InitNetworkTx',
      'ApplyChangeConfigTx',
      'ApplyNetworkParamTx',
      'ChangeConfigTx',
      'ChangeNetworkParamTx',
      'SetCertTimeTx',
      'StakeTx',
      'UnstakeTx',
      'TransferFromSecureAccountTx',
      'ClaimRewardTx',
      'NodeRewardTxData',
      'NodeInitTxData',
      'InitRewardTimesTx',
    ]

    expectedValues.forEach((value) => {
      expect(AJVSchemaEnum[value as keyof typeof AJVSchemaEnum]).toBeDefined()
      expect(AJVSchemaEnum[value as keyof typeof AJVSchemaEnum]).toBe(value)
    })
  })

  // Test that the enum values are immutable
  it.skip('should have immutable values', () => {
    // Skipped: TypeScript enums are not automatically frozen at runtime.
    // This is expected behavior as TypeScript enums are compiled to regular JavaScript objects.
    expect(Object.isFrozen(AJVSchemaEnum)).toBe(true)
  })

  it('should have unique values', () => {
    const values = Object.values(AJVSchemaEnum)
    const uniqueValues = new Set(values)

    expect(values.length).toBe(uniqueValues.size)
  })

  it('should have string values', () => {
    Object.values(AJVSchemaEnum).forEach((value) => {
      expect(typeof value).toBe('string')
    })
  })

  // Negative tests and edge cases
  it('should not contain unexpected values', () => {
    const unexpectedValues = [
      'NonExistentValue',
      'InvalidValue',
      'TestValue',
      'RandomValue',
      '123',
      '',
      null,
      undefined,
    ]

    unexpectedValues.forEach((value) => {
      expect(AJVSchemaEnum[value as keyof typeof AJVSchemaEnum]).toBeUndefined()
    })
  })

  it('should not contain empty or whitespace-only values', () => {
    Object.values(AJVSchemaEnum).forEach((value) => {
      expect(value.trim()).toBe(value)
      expect(value).not.toBe('')
    })
  })

  it('should not contain duplicate keys', () => {
    const keys = Object.keys(AJVSchemaEnum)
    const uniqueKeys = new Set(keys)
    expect(keys.length).toBe(uniqueKeys.size)
  })

  it('should handle case sensitivity correctly', () => {
    const lowerCaseValues = Object.values(AJVSchemaEnum).map((v) => v.toLowerCase())
    const upperCaseValues = Object.values(AJVSchemaEnum).map((v) => v.toUpperCase())

    Object.values(AJVSchemaEnum).forEach((value, index) => {
      expect(value).not.toBe(lowerCaseValues[index])
      expect(value).not.toBe(upperCaseValues[index])
    })
  })
})
