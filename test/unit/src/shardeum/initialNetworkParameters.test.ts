/**
 * initialNetworkParameters.test.ts
 *
 * Comprehensive test suite for Shardeum Initial Network Parameters (System Constants)
 *
 * This test suite ensures:
 * 1. All network parameters are present with correct types
 * 2. Parameters have the expected values
 * 3. Parameters maintain proper relationships with other constants
 */

import { initialNetworkParamters } from '../../../../src/shardeum/initialNetworkParameters'
import { ONE_HOUR, ONE_DAY, THIRTY_MINUTES, oneSHM } from '../../../../src/shardeum/shardeumConstants'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'

describe('Initial Network Parameters', () => {
  describe('Existence and Type Tests', () => {
    it('should define all network parameters with correct types', () => {
      // Test existence
      expect(initialNetworkParamters.title).toBeDefined()
      expect(initialNetworkParamters.description).toBeDefined()
      expect(initialNetworkParamters.nodeRewardInterval).toBeDefined()
      expect(initialNetworkParamters.nodeRewardAmountUsd).toBeDefined()
      expect(initialNetworkParamters.nodePenaltyUsd).toBeDefined()
      expect(initialNetworkParamters.stakeRequiredUsd).toBeDefined()
      expect(initialNetworkParamters.restakeCooldown).toBeDefined()
      expect(initialNetworkParamters.maintenanceInterval).toBeDefined()
      expect(initialNetworkParamters.maintenanceFee).toBeDefined()
      expect(initialNetworkParamters.minVersion).toBeDefined()
      expect(initialNetworkParamters.activeVersion).toBeDefined()
      expect(initialNetworkParamters.latestVersion).toBeDefined()
      expect(initialNetworkParamters.archiver).toBeDefined()
      expect(initialNetworkParamters.stabilityScaleMul).toBeDefined()
      expect(initialNetworkParamters.stabilityScaleDiv).toBeDefined()
      expect(initialNetworkParamters.txPause).toBeDefined()
      expect(initialNetworkParamters.certCycleDuration).toBeDefined()
      expect(initialNetworkParamters.enableNodeSlashing).toBeDefined()
      expect(initialNetworkParamters.qa).toBeDefined()
      expect(initialNetworkParamters.slashing).toBeDefined()
      expect(initialNetworkParamters.enableRPCEndpoints).toBeDefined()
      expect(initialNetworkParamters.stakeLockTime).toBeDefined()
      expect(initialNetworkParamters.chainID).toBeDefined()

      // Test types
      expect(typeof initialNetworkParamters.title).toBe('string')
      expect(typeof initialNetworkParamters.description).toBe('string')
      expect(typeof initialNetworkParamters.nodeRewardInterval).toBe('number')
      expect(typeof initialNetworkParamters.nodeRewardAmountUsd).toBe('bigint')
      expect(typeof initialNetworkParamters.nodePenaltyUsd).toBe('bigint')
      expect(typeof initialNetworkParamters.stakeRequiredUsd).toBe('bigint')
      expect(typeof initialNetworkParamters.restakeCooldown).toBe('number')
      expect(typeof initialNetworkParamters.maintenanceInterval).toBe('number')
      expect(typeof initialNetworkParamters.maintenanceFee).toBe('number')
      expect(typeof initialNetworkParamters.minVersion).toBe('string')
      expect(typeof initialNetworkParamters.activeVersion).toBe('string')
      expect(typeof initialNetworkParamters.latestVersion).toBe('string')
      expect(typeof initialNetworkParamters.archiver).toBe('object')
      expect(typeof initialNetworkParamters.stabilityScaleMul).toBe('number')
      expect(typeof initialNetworkParamters.stabilityScaleDiv).toBe('number')
      expect(typeof initialNetworkParamters.txPause).toBe('boolean')
      expect(typeof initialNetworkParamters.certCycleDuration).toBe('number')
      expect(typeof initialNetworkParamters.enableNodeSlashing).toBe('boolean')
      expect(typeof initialNetworkParamters.qa).toBe('object')
      expect(typeof initialNetworkParamters.slashing).toBe('object')
      expect(typeof initialNetworkParamters.enableRPCEndpoints).toBe('boolean')
      expect(typeof initialNetworkParamters.stakeLockTime).toBe('number')
      expect(typeof initialNetworkParamters.chainID).toBe('number')
    })

    it('should define all archiver parameters with correct types', () => {
      expect(initialNetworkParamters.archiver.minVersion).toBeDefined()
      expect(initialNetworkParamters.archiver.activeVersion).toBeDefined()
      expect(initialNetworkParamters.archiver.latestVersion).toBeDefined()

      expect(typeof initialNetworkParamters.archiver.minVersion).toBe('string')
      expect(typeof initialNetworkParamters.archiver.activeVersion).toBe('string')
      expect(typeof initialNetworkParamters.archiver.latestVersion).toBe('string')
    })

    it('should define all QA parameters with correct types', () => {
      expect(initialNetworkParamters.qa.qaTestNumber).toBeDefined()
      expect(initialNetworkParamters.qa.qaTestBoolean).toBeDefined()
      expect(initialNetworkParamters.qa.qaTestPercent).toBeDefined()
      expect(initialNetworkParamters.qa.qaTestSemver).toBeDefined()

      expect(typeof initialNetworkParamters.qa.qaTestNumber).toBe('number')
      expect(typeof initialNetworkParamters.qa.qaTestBoolean).toBe('boolean')
      expect(typeof initialNetworkParamters.qa.qaTestPercent).toBe('number')
      expect(typeof initialNetworkParamters.qa.qaTestSemver).toBe('string')
    })

    it('should define all slashing parameters with correct types', () => {
      expect(initialNetworkParamters.slashing.enableLeftNetworkEarlySlashing).toBeDefined()
      expect(initialNetworkParamters.slashing.enableSyncTimeoutSlashing).toBeDefined()
      expect(initialNetworkParamters.slashing.enableNodeRefutedSlashing).toBeDefined()
      expect(initialNetworkParamters.slashing.leftNetworkEarlyPenaltyPercent).toBeDefined()
      expect(initialNetworkParamters.slashing.syncTimeoutPenaltyPercent).toBeDefined()
      expect(initialNetworkParamters.slashing.nodeRefutedPenaltyPercent).toBeDefined()

      expect(typeof initialNetworkParamters.slashing.enableLeftNetworkEarlySlashing).toBe('boolean')
      expect(typeof initialNetworkParamters.slashing.enableSyncTimeoutSlashing).toBe('boolean')
      expect(typeof initialNetworkParamters.slashing.enableNodeRefutedSlashing).toBe('boolean')
      expect(typeof initialNetworkParamters.slashing.leftNetworkEarlyPenaltyPercent).toBe('number')
      expect(typeof initialNetworkParamters.slashing.syncTimeoutPenaltyPercent).toBe('number')
      expect(typeof initialNetworkParamters.slashing.nodeRefutedPenaltyPercent).toBe('number')
    })
  })

  describe('Value Correctness Tests', () => {
    it('should have correct values for basic network parameters', () => {
      expect(initialNetworkParamters.title).toBe('Initial parameters')
      expect(initialNetworkParamters.description).toBe(
        'These are the initial network parameters Shardeum started with'
      )
      expect(initialNetworkParamters.nodeRewardInterval).toBe(ONE_HOUR)
      expect(initialNetworkParamters.nodeRewardAmountUsd).toBe(oneSHM)
      expect(initialNetworkParamters.nodePenaltyUsd).toBe(oneSHM * BigInt(10))
      expect(initialNetworkParamters.stakeRequiredUsd).toBe(oneSHM * BigInt(10))
      expect(initialNetworkParamters.restakeCooldown).toBe(THIRTY_MINUTES)
      expect(initialNetworkParamters.maintenanceInterval).toBe(ONE_DAY)
      expect(initialNetworkParamters.maintenanceFee).toBe(0)
      expect(initialNetworkParamters.stabilityScaleMul).toBe(1000)
      expect(initialNetworkParamters.stabilityScaleDiv).toBe(1000)
      expect(initialNetworkParamters.txPause).toBe(false)
      expect(initialNetworkParamters.certCycleDuration).toBe(30)
      expect(initialNetworkParamters.enableNodeSlashing).toBe(false)
      expect(initialNetworkParamters.enableRPCEndpoints).toBe(false)
      expect(initialNetworkParamters.stakeLockTime).toBe(6000)
      expect(initialNetworkParamters.chainID).toBe(ShardeumFlags.ChainID)
    })

    it('should have correct values for version parameters', () => {
      expect(initialNetworkParamters.minVersion).toBe('1.18.0-prerelease.0')
      expect(initialNetworkParamters.activeVersion).toBe('1.18.0-prerelease.0')
      expect(initialNetworkParamters.latestVersion).toBe('1.18.0')
    })

    it('should have correct values for archiver parameters', () => {
      expect(initialNetworkParamters.archiver.minVersion).toBe('3.6.0-prerelease.0')
      expect(initialNetworkParamters.archiver.activeVersion).toBe('3.6.0-prerelease.0')
      expect(initialNetworkParamters.archiver.latestVersion).toBe('3.6.0')
    })

    it('should have correct values for QA parameters', () => {
      expect(initialNetworkParamters.qa.qaTestNumber).toBe(0)
      expect(initialNetworkParamters.qa.qaTestBoolean).toBe(false)
      expect(initialNetworkParamters.qa.qaTestPercent).toBe(0)
      expect(initialNetworkParamters.qa.qaTestSemver).toBe('0.0.0')
    })

    it('should have correct values for slashing parameters', () => {
      expect(initialNetworkParamters.slashing.enableLeftNetworkEarlySlashing).toBe(false)
      expect(initialNetworkParamters.slashing.enableSyncTimeoutSlashing).toBe(false)
      expect(initialNetworkParamters.slashing.enableNodeRefutedSlashing).toBe(false)
      expect(initialNetworkParamters.slashing.leftNetworkEarlyPenaltyPercent).toBe(0.2)
      expect(initialNetworkParamters.slashing.syncTimeoutPenaltyPercent).toBe(0.2)
      expect(initialNetworkParamters.slashing.nodeRefutedPenaltyPercent).toBe(0.2)
    })
  })

  describe('Relationship Tests', () => {
    it('should maintain correct relationships with time constants', () => {
      expect(initialNetworkParamters.nodeRewardInterval).toBe(ONE_HOUR)
      expect(initialNetworkParamters.restakeCooldown).toBe(THIRTY_MINUTES)
      expect(initialNetworkParamters.maintenanceInterval).toBe(ONE_DAY)
    })

    it('should maintain correct relationships with token constants', () => {
      expect(initialNetworkParamters.nodeRewardAmountUsd).toBe(oneSHM)
      expect(initialNetworkParamters.nodePenaltyUsd).toBe(oneSHM * BigInt(10))
      expect(initialNetworkParamters.stakeRequiredUsd).toBe(oneSHM * BigInt(10))
    })

    it('should maintain correct relationships with ShardeumFlags', () => {
      expect(initialNetworkParamters.chainID).toBe(ShardeumFlags.ChainID)
    })

    it('should have consistent penalty percentages', () => {
      const penaltyPercent = initialNetworkParamters.slashing.leftNetworkEarlyPenaltyPercent
      expect(initialNetworkParamters.slashing.syncTimeoutPenaltyPercent).toBe(penaltyPercent)
      expect(initialNetworkParamters.slashing.nodeRefutedPenaltyPercent).toBe(penaltyPercent)
    })

    it('should have stability scale multiplier equal to divisor', () => {
      expect(initialNetworkParamters.stabilityScaleMul).toBe(initialNetworkParamters.stabilityScaleDiv)
    })
  })
})
