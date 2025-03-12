import {
  ShardeumFlags,
  updateShardeumFlag,
  updateServicePoints,
} from '../../../../src/shardeum/shardeumFlags'

/**
 * Comprehensive test suite for ShardeumFlags
 *
 * This test suite ensures:
 * 1. All flags are present and have correct default values
 * 2. Flag update functions work correctly for all types of flags
 * 3. Edge cases and error conditions are handled properly
 */
describe('ShardeumFlags', () => {
  // Store original values to restore after each test
  const originalFlags = { ...ShardeumFlags }
  const originalServicePoints = { ...ShardeumFlags.ServicePoints }
  const originalEnv = { ...process.env }

  // Reset flags after each test to avoid test interference
  afterEach(() => {
    Object.assign(ShardeumFlags, originalFlags)
    Object.assign(ShardeumFlags.ServicePoints, originalServicePoints)
    process.env = { ...originalEnv }
    jest.resetModules()
  })

  describe('Interface Implementation', () => {
    it('should implement all required properties from the ShardeumFlags interface', () => {
      // This test ensures all properties defined in the interface exist in the implementation
      expect(ShardeumFlags).toBeDefined()

      // Check for existence of key properties from different categories
      // Storage Configuration
      expect(ShardeumFlags.contractStorageKeySilo).toBeDefined()
      expect(ShardeumFlags.contractStoragePrefixBitLength).toBeDefined()
      expect(ShardeumFlags.contractCodeKeySilo).toBeDefined()
      expect(ShardeumFlags.globalCodeBytes).toBeDefined()
      expect(ShardeumFlags.UseDBForAccounts).toBeDefined()

      // Network Configuration
      expect(ShardeumFlags.ChainID).toBeDefined()
      expect(ShardeumFlags.blockProductionRate).toBeDefined()
      expect(ShardeumFlags.initialBlockNumber).toBeDefined()
      expect(ShardeumFlags.maxNumberOfOldBlocks).toBeDefined()

      // Service Points
      expect(ShardeumFlags.ServicePoints).toBeDefined()
      expect(ShardeumFlags.ServicePointsPerSecond).toBeDefined()

      // Transaction Processing
      expect(ShardeumFlags.CheckNonce).toBeDefined()
      expect(ShardeumFlags.txNoncePreCheck).toBeDefined()
      expect(ShardeumFlags.txBalancePreCheck).toBeDefined()
      expect(ShardeumFlags.chargeConstantTxFee).toBeDefined()
      expect(ShardeumFlags.constantTxFeeUsd).toBeDefined()

      // Staking
      expect(ShardeumFlags.StakingEnabled).toBeDefined()
      expect(ShardeumFlags.minActiveNodesForStaking).toBeDefined()
      expect(ShardeumFlags.MinStakeCertSig).toBeDefined()

      // Feature Flags
      expect(ShardeumFlags.unifiedAccountBalanceEnabled).toBeDefined()
      expect(ShardeumFlags.failedStakeReceipt).toBeDefined()
      expect(ShardeumFlags.ticketTypesEnabled).toBeDefined()
    })
  })

  describe('Default Values', () => {
    // 1.1 Storage Configuration Variables
    describe('Storage Configuration', () => {
      it('should have correct default values for storage configuration', () => {
        expect(ShardeumFlags.contractStorageKeySilo).toBe(true)
        expect(ShardeumFlags.contractStoragePrefixBitLength).toBe(3)
        expect(ShardeumFlags.contractCodeKeySilo).toBe(false)
        expect(ShardeumFlags.globalCodeBytes).toBe(false)
        expect(ShardeumFlags.UseDBForAccounts).toBe(true)
      })
    })

    // 1.2 Debugging Variables
    describe('Debugging Variables', () => {
      it('should have correct default values for debugging variables', () => {
        expect(ShardeumFlags.VerboseLogs).toBe(false)
        expect(ShardeumFlags.debugTraceLogs).toBe(false)
        expect(ShardeumFlags.SelfTest).toBe(false)
        expect(ShardeumFlags.DebugRestoreFile).toBe('account-export.json')
        expect(ShardeumFlags.DebugRestoreArchiveBatch).toBe(2000)
        expect(ShardeumFlags.debugLocalAALG).toBe(false)
        expect(ShardeumFlags.debugExtraNonceLookup).toBe(false)
        expect(ShardeumFlags.debugGlobalAccountUpdateFail).toBe(false)
        expect(ShardeumFlags.debugDefaultBalance).toBe('100')
        expect(ShardeumFlags.debugTxEnabled).toBe(false)
        expect(ShardeumFlags.blockedAtVerbose).toBe(false)
      })
    })

    // 1.3 Network and Block Configuration
    describe('Network and Block Configuration', () => {
      it('should have correct default values for network and block configuration', () => {
        expect(ShardeumFlags.Virtual0Address).toBe(true)
        expect(ShardeumFlags.GlobalNetworkAccount).toBe(true)
        expect(ShardeumFlags.FirstNodeRewardCycle).toBe(100)
        expect(ShardeumFlags.blockProductionRate).toBe(6)
        expect(ShardeumFlags.initialBlockNumber).toBe(0)
        expect(ShardeumFlags.maxNumberOfOldBlocks).toBe(256)
        expect(ShardeumFlags.ChainID).toBe(8082)
        expect(ShardeumFlags.certCycleDuration).toBe(10)
        expect(ShardeumFlags.shardeumTimeout).toBe(50000)
        expect(ShardeumFlags.networkAccountCacheDuration).toBe(3600)
      })
    })

    // 1.4 Transaction Processing
    describe('Transaction Processing', () => {
      it('should have correct default values for transaction processing', () => {
        expect(ShardeumFlags.CheckNonce).toBe(true)
        expect(ShardeumFlags.txNoncePreCheck).toBe(false)
        expect(ShardeumFlags.txBalancePreCheck).toBe(true)
        expect(ShardeumFlags.autoGenerateAccessList).toBe(false)
        expect(ShardeumFlags.UseTXPreCrack).toBe(true)
        expect(ShardeumFlags.chargeConstantTxFee).toBe(false)
        expect(ShardeumFlags.constantTxFeeUsd).toBe('10000000000000000')
        expect(ShardeumFlags.baselineTxGasUsage).toBe('36655')
        expect(ShardeumFlags.baselineTxFee).toBe('10000000000000000')
        expect(ShardeumFlags.extraTxTime).toBe(8)
        expect(ShardeumFlags.minNodesEVMtx).toBe(5)
        expect(ShardeumFlags.checkNodesEVMtx).toBe(true)
        expect(ShardeumFlags.txHashingFix).toBe(true)
        expect(ShardeumFlags.nonceCheckRange).toBe(3)
        expect(ShardeumFlags.looseNonceCheck).toBe(false)
        expect(ShardeumFlags.exactNonceCheck).toBe(true)
        expect(ShardeumFlags.supportEstimateGas).toBe(true)
      })
    })

    // 1.5 Staking Mechanism
    describe('Staking Mechanism', () => {
      it('should have correct default values for staking mechanism', () => {
        expect(ShardeumFlags.StakingEnabled).toBe(true)
        expect(ShardeumFlags.ModeEnabled).toBe(true)
        expect(ShardeumFlags.stakeTargetAddress).toBe('0x0000000000000000000000000000000000010000')
        expect(ShardeumFlags.minActiveNodesForStaking).toBe(5)
        expect(ShardeumFlags.MinStakeCertSig).toBe(1)
        expect(ShardeumFlags.FullCertChecksEnabled).toBe(true)
        expect(ShardeumFlags.allowForceUnstake).toBe(true)
        expect(ShardeumFlags.fixExtraStakeLessThanMin).toBe(true)
        expect(ShardeumFlags.unstakeCertCheckFix).toBe(true)
        expect(ShardeumFlags.lowStakePercent).toBe(0.2)
        expect(ShardeumFlags.penaltyPercent).toBe(0.2)
        expect(ShardeumFlags.numberOfNodesToInjectPenaltyTx).toBe(5)
        expect(ShardeumFlags.enableClaimRewardAdminCert).toBe(true)
        expect(ShardeumFlags.failedStakeReceipt).toBe(true)
      })
    })

    // 1.6 Service Point Configuration
    describe('Service Point Configuration', () => {
      it('should have correct default values for service point configuration', () => {
        expect(ShardeumFlags.ServicePointsPerSecond).toBe(200)
        expect(ShardeumFlags.ServicePoints['debug-points']).toBe(20)
        expect(ShardeumFlags.ServicePoints['account/:address']).toBe(5)
        expect(ShardeumFlags.ServicePoints['contract/call'].endpoint).toBe(5)
        expect(ShardeumFlags.ServicePoints['contract/call'].direct).toBe(20)
        expect(ShardeumFlags.ServicePoints['contract/accesslist'].endpoint).toBe(5)
        expect(ShardeumFlags.ServicePoints['contract/accesslist'].direct).toBe(20)
        expect(ShardeumFlags.ServicePoints['contract/estimateGas'].endpoint).toBe(5)
        expect(ShardeumFlags.ServicePoints['contract/estimateGas'].direct).toBe(20)
        expect(ShardeumFlags.ServicePoints['tx/:hash']).toBe(5)
        expect(ShardeumFlags.ServicePoints['canUnstake/:nominee/:nominator']).toBe(5)
        expect(ShardeumFlags.logServicePointSenders).toBe(false)
        expect(ShardeumFlags.startInServiceMode).toBe(false)
        expect(Array.isArray(ShardeumFlags.allowedEndpointsInServiceMode)).toBe(true)
        expect(ShardeumFlags.allowedEndpointsInServiceMode).toEqual([
          'POST /contract/estimateGas',
          'POST /contract/call',
          'POST /contract/accesslist',
          'GET /eth_gasPrice',
          'GET /account/*',
          'GET /eth_getCode',
          'GET /canUnstake/*',
        ])
        expect(Array.isArray(ShardeumFlags.controlledRPCEndpoints)).toBe(true)
        expect(ShardeumFlags.controlledRPCEndpoints).toEqual(['contract/estimateGas'])
      })
    })

    // 1.7 Cache and Storage Settings
    describe('Cache and Storage Settings', () => {
      it('should have correct default values for cache and storage settings', () => {
        expect(ShardeumFlags.cacheMaxCycleAge).toBe(5)
        expect(ShardeumFlags.cacheMaxItemPerTopic).toBe(4500)
        expect(ShardeumFlags.enableRIAccountsCache).toBe(true)
        expect(ShardeumFlags.riAccountsCacheSize).toBe(10000)
        expect(ShardeumFlags.riAccountsDeleteBatchSize).toBe(500)
        expect(ShardeumFlags.cleanStaleShardeumStateMap).toBe(false)
      })
    })

    // 1.8 Account and EVM Features
    describe('Account and EVM Features', () => {
      it('should have correct default values for account and EVM features', () => {
        expect(ShardeumFlags.SetupGenesisAccount).toBe(true)
        expect(ShardeumFlags.EVMReceiptsAsAccounts).toBe(false)
        expect(ShardeumFlags.useAccountWrites).toBe(true)
        expect(ShardeumFlags.useShardeumVM).toBe(true)
        expect(ShardeumFlags.UseBase64BufferEncoding).toBe(true)
        expect(ShardeumFlags.NewStorageIndex).toBe(true)
        expect(ShardeumFlags.shardeumVMPrecompiledFix).toBe(true)
        expect(ShardeumFlags.removeTokenBalanceCache).toBe(true)
        expect(ShardeumFlags.unifiedAccountBalanceEnabled).toBe(true)
        expect(ShardeumFlags.forwardGenesisAccounts).toBe(true)
      })
    })

    // 1.9 Receipt and Transaction Features
    describe('Receipt and Transaction Features', () => {
      it('should have correct default values for receipt and transaction features', () => {
        expect(ShardeumFlags.supportInternalTxReceipt).toBe(true)
        expect(ShardeumFlags.addInternalTxReceiptAccount).toBe(true)
        expect(ShardeumFlags.receiptLogIndexFix).toBe(true)
        expect(ShardeumFlags.accesslistNonceFix).toBe(true)
        expect(ShardeumFlags.internalTxTimestampFix).toBe(true)
        expect(ShardeumFlags.expiredTransactionStateFix).toBe(false)
        expect(ShardeumFlags.FailedTxLinearBackOffConstantInSecs).toBe(30)
      })
    })

    // 1.10 Certificate and Admin Features
    describe('Certificate and Admin Features', () => {
      it('should have correct default values for certificate and admin features', () => {
        expect(ShardeumFlags.AdminCertEnabled).toBe(false)
        expect(ShardeumFlags.ClaimRewardRetryCount).toBe(20)
        expect(ShardeumFlags.fixCertExpRenew).toBe(true)
        expect(ShardeumFlags.fixSetCertTimeTxApply).toBe(true)
        expect(ShardeumFlags.setCertTimeDurationOverride).toBe(true)
        expect(ShardeumFlags.fixCertExpTiming).toBe(true)
      })
    })

    // 1.11 Migration and Feature Flags
    describe('Migration and Feature Flags', () => {
      it('should have correct default values for migration and feature flags', () => {
        expect(ShardeumFlags.fixContractBytes).toBe(true)
        expect(ShardeumFlags.fixExtraStakeLessThanMin).toBe(true)
        expect(ShardeumFlags.rewardedFalseInInitRewardTx).toBe(true)
        expect(ShardeumFlags.totalUnstakeAmount).toBe(true)
        expect(ShardeumFlags.beta1_11_2).toBe(true)
        expect(ShardeumFlags.ticketTypesEnabled).toBe(false)
      })
    })

    // 1.12 Archiving and Special Modes
    describe('Archiving and Special Modes', () => {
      it('should have correct default values for archiving and special modes', () => {
        expect(ShardeumFlags.startInArchiveMode).toBe(false)
        expect(ShardeumFlags.collectorUrl).toBe('http://0.0.0.0:6001')
        expect(ShardeumFlags.aalgWarmupSleep).toBe(100)
        expect(ShardeumFlags.enableArchiverNetworkAccountValidation).toBe(false)
        expect(ShardeumFlags.tryGetRemoteAccountCB_OnlyErrorsLoop).toBe(true)
        expect(ShardeumFlags.loadGenesisNodeNetworkConfigToNetworkAccount).toBe(true)
      })
    })

    // 1.13 Miscellaneous Settings
    describe('Miscellaneous Settings', () => {
      it('should have correct default values for miscellaneous settings', () => {
        expect(ShardeumFlags.generateMemoryPatternData).toBe(true)
        expect(ShardeumFlags.labTest).toBe(false)
        expect(ShardeumFlags.AppliedTxsMaps).toBe(false)
        expect(ShardeumFlags.SaveEVMTries).toBe(false)
        expect(ShardeumFlags.CheckpointRevertSupport).toBe(true)
        expect(ShardeumFlags.disableSmartContractEndpoints).toBe(true)
        expect(ShardeumFlags.accessListSizeLimit).toBe(5)
      })
    })
  })

  describe('Environment Variable Interactions', () => {
    it('should use environment variable for ChainID when available', () => {
      process.env.CHAIN_ID = '1234'
      // Need to re-import to trigger the environment variable check
      jest.resetModules()
      const { ShardeumFlags: ReloadedFlags } = require('../../../../src/shardeum/shardeumFlags')
      expect(ReloadedFlags.ChainID).toBe(1234)
    })

    it('should use default ChainID when environment variable is not available', () => {
      delete process.env.CHAIN_ID
      jest.resetModules()
      const { ShardeumFlags: ReloadedFlags } = require('../../../../src/shardeum/shardeumFlags')
      expect(ReloadedFlags.ChainID).toBe(8082)
    })

    it('should handle invalid CHAIN_ID environment variable', () => {
      process.env.CHAIN_ID = 'not-a-number'
      jest.resetModules()
      const { ShardeumFlags: ReloadedFlags } = require('../../../../src/shardeum/shardeumFlags')
      // Should use NaN or default, depending on implementation
      expect(isNaN(ReloadedFlags.ChainID) || ReloadedFlags.ChainID === 8082).toBeTruthy()
    })
  })

  describe('updateShardeumFlag Function', () => {
    // Test updating different types of flags
    describe('Valid Updates', () => {
      it('should update boolean flag', () => {
        updateShardeumFlag('VerboseLogs', true)
        expect(ShardeumFlags.VerboseLogs).toBe(true)
      })

      it('should update number flag', () => {
        updateShardeumFlag('ChainID', 1234)
        expect(ShardeumFlags.ChainID).toBe(1234)
      })

      it('should update string flag', () => {
        updateShardeumFlag('DebugRestoreFile', 'new-file.json')
        expect(ShardeumFlags.DebugRestoreFile).toBe('new-file.json')
      })

      it('should update decimal string flag', () => {
        updateShardeumFlag('constantTxFeeUsd', '20000000000000000')
        expect(ShardeumFlags.constantTxFeeUsd).toBe('20000000000000000')
      })
    })

    // Test invalid updates
    describe('Invalid Updates', () => {
      it('should not update non-existent flag', () => {
        updateShardeumFlag('NonExistentFlag', true)
        expect(ShardeumFlags['NonExistentFlag']).toBeUndefined()
      })

      it('should handle type conversion for number flags', () => {
        updateShardeumFlag('ChainID', '5678' as any)
        // Depending on implementation, it might convert or ignore
        expect(typeof ShardeumFlags.ChainID).toBe('number')
      })

      it('should handle type conversion for boolean flags', () => {
        updateShardeumFlag('VerboseLogs', 1 as any)
        // Depending on implementation, it might convert or ignore
        expect(typeof ShardeumFlags.VerboseLogs).toBe('boolean')
      })
    })

    // Test that updates don't affect other flags
    describe('Isolated Updates', () => {
      it('should only update the specified flag', () => {
        const originalChainID = ShardeumFlags.ChainID
        const originalVerboseLogs = ShardeumFlags.VerboseLogs

        updateShardeumFlag('VerboseLogs', !originalVerboseLogs)

        expect(ShardeumFlags.VerboseLogs).toBe(!originalVerboseLogs)
        expect(ShardeumFlags.ChainID).toBe(originalChainID)
      })
    })
  })

  describe('updateServicePoints Function', () => {
    // Test updating simple service points
    describe('Simple Service Points', () => {
      it('should update simple service point', () => {
        updateServicePoints('debug-points', '', 30)
        expect(ShardeumFlags.ServicePoints['debug-points']).toBe(30)
      })

      it('should update account address service point', () => {
        updateServicePoints('account/:address', '', 10)
        expect(ShardeumFlags.ServicePoints['account/:address']).toBe(10)
      })

      it('should update tx hash service point', () => {
        updateServicePoints('tx/:hash', '', 15)
        expect(ShardeumFlags.ServicePoints['tx/:hash']).toBe(15)
      })
    })

    // Test updating nested service points
    describe('Nested Service Points', () => {
      it('should update contract call endpoint service point', () => {
        updateServicePoints('contract/call', 'endpoint', 10)
        expect(ShardeumFlags.ServicePoints['contract/call'].endpoint).toBe(10)
      })

      it('should update contract call direct service point', () => {
        updateServicePoints('contract/call', 'direct', 25)
        expect(ShardeumFlags.ServicePoints['contract/call'].direct).toBe(25)
      })

      it('should update contract accesslist endpoint service point', () => {
        updateServicePoints('contract/accesslist', 'endpoint', 8)
        expect(ShardeumFlags.ServicePoints['contract/accesslist'].endpoint).toBe(8)
      })

      it('should update contract estimateGas direct service point', () => {
        updateServicePoints('contract/estimateGas', 'direct', 30)
        expect(ShardeumFlags.ServicePoints['contract/estimateGas'].direct).toBe(30)
      })
    })

    // Test invalid updates
    describe('Invalid Updates', () => {
      it('should not update invalid service point', () => {
        updateServicePoints('invalid-point', '', 10)
        expect(ShardeumFlags.ServicePoints['invalid-point']).toBeUndefined()
      })

      it('should not update with invalid nested property', () => {
        updateServicePoints('contract/call', 'invalid', 10)
        expect(ShardeumFlags.ServicePoints['contract/call']['invalid']).toBeUndefined()
      })

      it('should not update with invalid value type', () => {
        const original = ShardeumFlags.ServicePoints['debug-points']
        updateServicePoints('debug-points', '', '30' as any)
        expect(ShardeumFlags.ServicePoints['debug-points']).toBe(original)
      })
    })

    // Test that updates don't affect other service points
    describe('Isolated Updates', () => {
      it('should only update the specified service point', () => {
        const originalDebugPoints = ShardeumFlags.ServicePoints['debug-points']
        const originalAccountAddress = ShardeumFlags.ServicePoints['account/:address']

        updateServicePoints('debug-points', '', 50)

        expect(ShardeumFlags.ServicePoints['debug-points']).toBe(50)
        expect(ShardeumFlags.ServicePoints['account/:address']).toBe(originalAccountAddress)
      })

      it('should only update the specified nested service point', () => {
        const originalEndpoint = ShardeumFlags.ServicePoints['contract/call'].endpoint
        const originalDirect = ShardeumFlags.ServicePoints['contract/call'].direct

        updateServicePoints('contract/call', 'endpoint', 15)

        expect(ShardeumFlags.ServicePoints['contract/call'].endpoint).toBe(15)
        expect(ShardeumFlags.ServicePoints['contract/call'].direct).toBe(originalDirect)
      })
    })
  })

  describe('Feature Flag Combinations', () => {
    // Test combinations of related flags
    it('should have consistent transaction checking flags', () => {
      // These flags should be consistent with each other
      if (ShardeumFlags.exactNonceCheck) {
        expect(ShardeumFlags.looseNonceCheck).toBe(false)
      }

      if (ShardeumFlags.looseNonceCheck) {
        expect(ShardeumFlags.exactNonceCheck).toBe(false)
      }
    })

    it('should have consistent VM and storage flags', () => {
      // If using Shardeum VM, certain storage flags should be set
      if (ShardeumFlags.useShardeumVM) {
        expect(ShardeumFlags.NewStorageIndex).toBe(true)
      }
    })

    it('should have consistent staking flags', () => {
      // If staking is enabled, related flags should be set appropriately
      if (ShardeumFlags.StakingEnabled) {
        expect(ShardeumFlags.stakeTargetAddress).not.toBe('')
        expect(ShardeumFlags.minActiveNodesForStaking).toBeGreaterThan(0)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle updating flags with extreme values', () => {
      // Test with very large number
      updateShardeumFlag('ChainID', Number.MAX_SAFE_INTEGER)
      expect(ShardeumFlags.ChainID).toBe(Number.MAX_SAFE_INTEGER)

      // Test with very small number
      updateShardeumFlag('ChainID', Number.MIN_SAFE_INTEGER)
      expect(ShardeumFlags.ChainID).toBe(Number.MIN_SAFE_INTEGER)
    })

    it('should handle updating service points with extreme values', () => {
      // Test with very large number
      updateServicePoints('debug-points', '', Number.MAX_SAFE_INTEGER)
      expect(ShardeumFlags.ServicePoints['debug-points']).toBe(Number.MAX_SAFE_INTEGER)

      // Test with zero
      updateServicePoints('debug-points', '', 0)
      expect(ShardeumFlags.ServicePoints['debug-points']).toBe(0)
    })

    it('should handle updating string flags with empty strings', () => {
      updateShardeumFlag('DebugRestoreFile', '')
      expect(ShardeumFlags.DebugRestoreFile).toBe('')
    })
  })
})
