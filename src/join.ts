import { ShardusTypes, nestedCountersInstance } from '@shardeum-foundation/core'
import { AppJoinData } from './shardeum/shardeumTypes'
import { version } from '../package.json'
import { stakeCert, adminCert, ShardeumFlags, meetsMinimumVersion, isWithinMaximumVersion, logFlags, VersionValidationResult, operatorCLIVersion, operatorGUIVersion, config, _readableSHM, updateAdminCert, updateStakeCert } from './index'
import * as AccountsStorage from './storage/accountStorage'
import { Utils } from '@shardeum-foundation/lib-types'
import { P2P } from '@shardeum-foundation/lib-types'
import { ShardeumState } from './state'
import { getAccountData } from './utils/account'
import { isValidAddress, Address } from '@ethereumjs/util'
import { toShardusAddress } from './shardeum/evmAddress'
import { AccountType } from './shardeum/shardeumTypes'
import { _base16BNParser, scaleByStabilityFactor } from './utils'
import { StakeCert, ValidatorError, CertSignaturesResult, queryCertificate } from './handlers/queryCertificate'
// import { verifyStakeCert } from './handlers/queryCertificateHelper'
import { getCertCycleDuration, injectSetCertTimeTx } from './tx/setCertTime'
import { shardus, shardeumGetTime } from './index'
import { AdminCert } from './handlers/adminCertificate'
import { getNodeCountForCertSignatures } from './index'
import { DevSecurityLevel } from '@shardeum-foundation/core/dist/shardus/shardus-types'
import { fetchNetworkAccountFromArchiver } from './index'
import { initialNetworkParamters } from './shardeum/initialNetworkParameters'
import { ServerMode } from '@shardeum-foundation/core/dist/shardus/shardus-types'
import { ONE_SECOND } from './shardeum/shardeumConstants'

// Module-level variables needed by isReadyToJoin
let cachedNetworkAccount = null
let cacheExpirationTimestamp = 0
let lastCertTimeTxTimestamp = 0
let lastCertTimeTxCycle: number | null = null
let isReadyToJoinLatestValue = false
let isAdminCertUnexpiredValue = false
let isCheckingReadyToJoin = false

// Export function to get isAdminCertUnexpired value
export function getIsAdminCertUnexpired(): boolean {
  return isAdminCertUnexpiredValue
}

export const joinFunctions = {
        getJoinData() {
      nestedCountersInstance.countEvent('shardeum-staking', 'calling getJoinData')
      const joinData: AppJoinData = {
        version,
        stakeCert,
        adminCert,
        isAdminCertUnexpired: isAdminCertUnexpiredValue,
      }
      return joinData
    },
    validateJoinRequest(
      data,
      mode: P2P.ModesTypes.Record['mode'] | null,
      latestCycle: ShardusTypes.Cycle,
      minNodes: number
    ) {
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest minNodes: ${minNodes}, active: ${latestCycle.active}, syncing ${latestCycle.syncing}, mode: ${mode}, flag: ${ShardeumFlags.AdminCertEnabled}`)

      try {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest ${Utils.safeStringify(data)}`)
        if (!data.appJoinData) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: !data.appJoinData`)
          return { success: false, reason: `Join request node doesn't provide the app join data.`, fatal: true }
        }

        const appJoinData = data.appJoinData as AppJoinData
        const appJoinDataVersion = appJoinData.version
        const minVersion = AccountsStorage.cachedNetworkAccount.current.minVersion
        const latestVersion = AccountsStorage.cachedNetworkAccount.current.latestVersion

        // Min version reasons we can't validate the join request.
        const minVersionValidationResult = meetsMinimumVersion(minVersion, appJoinDataVersion)
        if (minVersionValidationResult !== VersionValidationResult.Success) {
          switch (minVersionValidationResult) {
            case VersionValidationResult.ComparisonFailed:
              return {
                success: false,
                reason: `validateJoinRequest: Standby node version: ${appJoinDataVersion} failed to meet min version ${minVersion}`,
                fatal: true,
              }
            case VersionValidationResult.ControlVersionParseFailure:
              return {
                success: false,
                reason: `validateJoinRequest: Failed to parse minVersion ${minVersion}`,
                fatal: true,
              }
            case VersionValidationResult.InvalidControlVersion:
              return {
                success: false,
                reason: `validateJoinRequest: Failed to validate minVersion ${minVersion}`,
                fatal: true,
              }
            case VersionValidationResult.TestVersionParseFailure:
              return {
                success: false,
                reason: `validateJoinRequest: Failed to parse appJoinDataVersion ${appJoinDataVersion}`,
                fatal: true,
              }
            case VersionValidationResult.InvalidTestVersion:
              return {
                success: false,
                reason: `validateJoinRequest: Failed to validate appJoinDataVersion ${appJoinDataVersion}`,
                fatal: true,
              }
            default:
              return {
                success: false,
                reason: `validateJoinRequest: Unexpected validation result ${minVersionValidationResult} - minVersion: ${minVersion} appJoinDataVersion: ${appJoinDataVersion}`,
                fatal: true,
              }
          }
        }

        // Max version reasons we can't validate the join request.
        const latestVersionValidationResult = isWithinMaximumVersion(latestVersion, appJoinDataVersion)
        if (latestVersionValidationResult !== VersionValidationResult.Success) {
          switch (latestVersionValidationResult) {
            case VersionValidationResult.ComparisonFailed:
              return {
                success: false,
                reason: `validateJoinRequest: Standby node version: ${appJoinDataVersion} exceeds latestVersion ${latestVersion}`,
                fatal: true,
              }
            case VersionValidationResult.ControlVersionParseFailure:
              return {
                success: false,
                reason: `validateJoinRequest: Failed to parse latestVersion ${latestVersion}`,
                fatal: true,
              }
            case VersionValidationResult.InvalidControlVersion:
              return {
                success: false,
                reason: `validateJoinRequest: Failed to validate latestVersion ${latestVersion}`,
                fatal: true,
              }
            case VersionValidationResult.TestVersionParseFailure:
              return {
                success: false,
                reason: `validateJoinRequest: Failed to parse appJoinDataVersion ${appJoinDataVersion}`,
                fatal: true,
              }
            case VersionValidationResult.InvalidTestVersion:
              return {
                success: false,
                reason: `validateJoinRequest: Failed to validate appJoinDataVersion ${appJoinDataVersion}`,
                fatal: true,
              }
            default:
              return {
                success: false,
                reason: `validateJoinRequest: Unexpected validation result ${latestVersionValidationResult} - latestVersion: ${latestVersion} appJoinDataVersion: ${appJoinDataVersion}`,
                fatal: true,
              }
          }
        }

        const numActiveNodes = latestCycle.active
        const numTotalNodes = latestCycle.active + latestCycle.syncing // total number of nodes in the network

        // Staking is only enabled when flag is on and
        const stakingEnabled = ShardeumFlags.StakingEnabled && numActiveNodes >= ShardeumFlags.minActiveNodesForStaking

        // there is no flag to turn off golden ticket if we want to
        //Checks for golden ticket
        if (appJoinData.adminCert?.goldenTicket === true) {
          const adminCert: AdminCert = appJoinData.adminCert
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest: Golden ticket is enabled, node about to enter processing check')

          const currentTimestamp = Date.now()
          if (!adminCert || adminCert.certExp < currentTimestamp) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: !adminCert || adminCert.certExp < currentTimestamp')
            return {
              success: false,
              reason: 'No admin cert found in mode: ' + mode,
              fatal: false,
            }
          }
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest: adminCert ${Utils. safeStringify(adminCert)}`)

          // check for adminCert nominee
          const nodeAcc = data.sign.owner
          if (nodeAcc !== adminCert.nominee) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: nodeAcc !== adminCert.nominee')
            return {
              success: false,
              reason: 'Nominator mismatch',
              fatal: true,
            }
          }
          const pkClearance = shardus.getDevPublicKey(adminCert.sign.owner)
          // check for invalid signature for AdminCert
          if (pkClearance == null) {
            return {
              success: false,
              reason: 'Unauthorized! no getDevPublicKey defined',
              fatal: true,
            }
          }
          if (
            pkClearance &&
            (!shardus.crypto.verify(adminCert, pkClearance) ||
              shardus.ensureKeySecurity(pkClearance, DevSecurityLevel.High) === false)
          ) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: !shardus.crypto.verify(adminCert, shardus.getDevPublicKeyMaxLevel())')
            return {
              success: false,
              reason: 'Invalid signature for AdminCert',
              fatal: true,
            }
          }
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest success: adminCert')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateJoinRequest success: adminCert')
          return {
            success: true,
            reason: 'Join Request validated',
            fatal: false,
          }
        }

        // The below block has basically the same logic as the above block. Do we even want to use admin certs for anything other than GT nodes?
        // if not, we should remove it
        // if condition true and if none of this triggers it'll go past the staking checks and return true...
        if (
          stakingEnabled &&
          ShardeumFlags.AdminCertEnabled === true &&
          mode !== 'processing' &&
          numTotalNodes < minNodes //if node is about to enter processing check for stake as expected not admin cert
        ) {
          const adminCert: AdminCert = appJoinData.adminCert
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest: mode is not processing, AdminCertEnabled enabled, node about to enter processing check')

          const currentTimestamp = shardeumGetTime()
          if (!adminCert || adminCert.certExp < currentTimestamp) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: !adminCert || adminCert.certExp < currentTimestamp')
            return {
              success: false,
              reason: 'No admin cert found in mode: ' + mode,
              fatal: false,
            }
          }
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest: adminCert ${Utils. safeStringify(adminCert)}`)

          // check for adminCert nominee
          const nodeAcc = data.sign.owner
          if (nodeAcc !== adminCert.nominee) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: nodeAcc !== adminCert.nominee')
            return {
              success: false,
              reason: 'Nominator mismatch',
              fatal: true,
            }
          }

          const pkClearance = shardus.getDevPublicKey(adminCert.sign.owner)
          // check for invalid signature for AdminCert
          if (pkClearance == null) {
            return {
              success: false,
              reason: 'Unauthorized! no getDevPublicKey defined',
              fatal: true,
            }
          }
          if (
            pkClearance &&
            (!shardus.crypto.verify(adminCert, pkClearance) ||
              shardus.ensureKeySecurity(pkClearance, DevSecurityLevel.High) === false)
          ) {
            // check for invalid signature for AdminCert
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest fail: !shardus.crypto.verify(adminCert, shardus.getDevPublicKeyMaxLevel())')
            return {
              success: false,
              reason: 'Invalid signature for AdminCert',
              fatal: true,
            }
          }
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-mode', 'validateJoinRequest success: adminCert')
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('validateJoinRequest success: adminCert')
          return {
            success: true,
            reason: 'Join Request validated',
            fatal: false,
          }
        }

        if (
          (ShardeumFlags.ModeEnabled === true && mode === 'processing' && stakingEnabled) ||
          (ShardeumFlags.ModeEnabled === false && stakingEnabled)
        ) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validating join request with staking enabled')

          if (appJoinData.isAdminCertUnexpired) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: appJoinData.isAdminCertUnexpired')
            return {
              success: false,
              reason: 'Join Request wont have a stake certificate',
              fatal: false,
            }
          }

          const nodeAcc = data.sign.owner
          const stake_cert: StakeCert = appJoinData.stakeCert
          if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest ${Utils.safeStringify(stake_cert)}`)

          const tx_time = data.joinRequestTimestamp as number

          if (stake_cert == null) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: stake_cert == null')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: stake_cert == null`)
            return {
              success: false,
              reason: `Join request node doesn't provide the stake certificate.`,
              fatal: true,
            }
          }

          if (nodeAcc !== stake_cert.nominee) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: nodeAcc !== stake_cert.nominee')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: nodeAcc !== stake_cert.nominee`)
            return {
              success: false,
              reason: `Nominated address and tx signature owner doesn't match, nominee: ${stake_cert.nominee}, sign owner: ${nodeAcc}`,
              fatal: true,
            }
          }

          if (tx_time > stake_cert.certExp) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: tx_time > stake_cert.certExp')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: tx_time > stake_cert.certExp ${tx_time} > ${stake_cert.certExp}`)
            return {
              success: false,
              reason: `Certificate has expired at ${stake_cert.certExp}`,
              fatal: false,
            }
          }

          const serverConfig = config.server
          const two_cycle_ms = serverConfig.p2p.cycleDuration * 2 * 1000

          // stake certification should not expired for at least 2 cycle.
          if (shardeumGetTime() + two_cycle_ms > stake_cert.certExp) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: cert expires soon')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: cert expires soon ${shardeumGetTime() + two_cycle_ms} > ${stake_cert.certExp}`)
            return {
              success: false,
              reason: `Certificate will be expired really soon.`,
              fatal: false,
            }
          }

          const minStakeRequiredUsd = _base16BNParser(AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd)
          const minStakeRequired = scaleByStabilityFactor(minStakeRequiredUsd, AccountsStorage.cachedNetworkAccount)

          const stakedAmount = _base16BNParser(stake_cert.stake)

          if (stakedAmount < minStakeRequired) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: stake_cert.stake < minStakeRequired')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: stake_cert.stake < minStakeRequired ${_readableSHM(stakedAmount)} < ${_readableSHM(minStakeRequired)}`)
            return {
              success: false,
              reason: `Minimum stake amount requirement does not meet.`,
              fatal: false,
            }
          }

          const requiredSig = getNodeCountForCertSignatures()
          const { success, reason } = shardus.validateClosestActiveNodeSignatures(
            stake_cert,
            stake_cert.signs,
            requiredSig,
            5,
            2
          )
          if (!success) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateJoinRequest fail: invalid signature')
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest fail: invalid signature`, reason)
            return { success, reason, fatal: false }
          }
        }

        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest success!!!`)
        return {
          success: true,
          reason: 'Join Request validated',
          fatal: false,
        }
      } catch (e) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateJoinRequest exception: ${e}`)
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `validateJoinRequest fail: exception: ${e} `)
        return {
          success: false,
          reason: `validateJoinRequest fail: exception: ${e}`,
          fatal: true,
        }
      }
    },
    validateArchiverJoinRequest(data) {
      try {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest ${Utils. safeStringify(data)}`)
        if (!data.appData) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest fail: !data.appData`)
          return {
            success: false,
            reason: `Join request Archiver doesn't provide the app data (appData).`,
            fatal: true,
          }
        }

        const appDataVersion = data.appData.version
        const minVersion = AccountsStorage.cachedNetworkAccount.current.archiver.minVersion
        const latestVersion = AccountsStorage.cachedNetworkAccount.current.archiver.latestVersion

        // Min version reasons we can't validate the archiver join request.
        const minVersionValidationResult = meetsMinimumVersion(minVersion, appDataVersion)
        if (minVersionValidationResult !== VersionValidationResult.Success) {
          switch (minVersionValidationResult) {
            case VersionValidationResult.ComparisonFailed:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Archiver node version: ${appDataVersion} failed to meet min version ${minVersion}`,
                fatal: true,
              }
            case VersionValidationResult.ControlVersionParseFailure:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Failed to parse minVersion ${minVersion}`,
                fatal: true,
              }
            case VersionValidationResult.InvalidControlVersion:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Failed to validate minVersion ${minVersion}`,
                fatal: true,
              }
            case VersionValidationResult.TestVersionParseFailure:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Failed to parse appJoinDataVersion ${appDataVersion}`,
                fatal: true,
              }
            case VersionValidationResult.InvalidTestVersion:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Failed to validate appJoinDataVersion ${appDataVersion}`,
                fatal: true,
              }
            default:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Unexpected validation result ${minVersionValidationResult} - minVersion: ${minVersion} appJoinDataVersion: ${appDataVersion}`,
                fatal: true,
              }
          }
        }

        // Max version reasons we can't validate the archiverjoin request.
        const latestVersionValidationResult = isWithinMaximumVersion(latestVersion, appDataVersion)
        if (latestVersionValidationResult !== VersionValidationResult.Success) {
          switch (latestVersionValidationResult) {
            case VersionValidationResult.ComparisonFailed:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Archiver node version: ${appDataVersion} exceeds latestVersion ${latestVersion}`,
                fatal: true,
              }
            case VersionValidationResult.ControlVersionParseFailure:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Failed to parse latestVersion ${latestVersion}`,
                fatal: true,
              }
            case VersionValidationResult.InvalidControlVersion:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Failed to validate latestVersion ${latestVersion}`,
                fatal: true,
              }
            case VersionValidationResult.TestVersionParseFailure:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Failed to parse appJoinDataVersion ${appDataVersion}`,
                fatal: true,
              }
            case VersionValidationResult.InvalidTestVersion:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Failed to validate appJoinDataVersion ${appDataVersion}`,
                fatal: true,
              }
            default:
              return {
                success: false,
                reason: `validateArchiverJoinRequest: Unexpected validation result ${latestVersionValidationResult} - latestVersion: ${latestVersion} appJoinDataVersion: ${appDataVersion}`,
                fatal: true,
              }
          }
        }

        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest() Successful!`)
        return { success: true, reason: 'Archiver-Join Request Validated!', fatal: false }
      } catch (e) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`validateArchiverJoinRequest exception: ${e}`)
        return { success: false, reason: `validateArchiverJoinRequest fail: exception: ${e}`, fatal: true }
      }
    },
    // Update the activeNodes type here; We can import from P2P.P2PTypes.Node from '@shardeum-foundation/lib-types' lib but seems it's not installed yet
    async isReadyToJoin(
      latestCycle: ShardusTypes.Cycle,
      publicKey: string,
      activeNodes: P2P.P2PTypes.Node[],
      mode: P2P.ModesTypes.Record['mode']
    ): Promise<boolean> {
      // Prevent concurrent execution
      if (isCheckingReadyToJoin) {
        // Return the last known value if already checking
        return isReadyToJoinLatestValue
      }
      
      isCheckingReadyToJoin = true
      
      // Helper function to return and update the latest value
      const returnValue = (value: boolean): boolean => {
        isReadyToJoinLatestValue = value
        return value
      }
      
      try {
        const currentTime = Date.now()
        let networkAccount = null
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`isReadyToJoin cachedNetworkAccount 1 ${Utils.safeStringify(cachedNetworkAccount)}`)
      if (currentTime < cacheExpirationTimestamp && cachedNetworkAccount) {
        // Use cached result if it's still valid
        networkAccount = cachedNetworkAccount
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`isReadyToJoin using cached network account ${Utils. safeStringify(networkAccount)}`)
      } else {
        // Fetch new network account data
        networkAccount = await fetchNetworkAccountFromArchiver()
        // Update cache with new result
        cachedNetworkAccount = networkAccount
        cacheExpirationTimestamp = currentTime + ShardeumFlags.networkAccountCacheDuration * 1000
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`isReadyToJoin fetched new network account ${Utils. safeStringify(networkAccount)}`)
      }

      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`isReadyToJoin cachedNetworkAccount 2 ${Utils.safeStringify(cachedNetworkAccount)}`)

      if (initialNetworkParamters && networkAccount) {
        //error out nodes in debug mode for production networks to prevent joining
        if (networkAccount.data.mode === ServerMode.Release && config.server.mode !== ServerMode.Release) {
          const tag = `wrong mode; please update and restart`
          const message = `node mode must be in release mode; please update the node mode`
          shardus.shutdownFromDapp(tag, message, false)
          return false
        }

        const nodeVersion = version
        const minVersion = networkAccount.data.current.minVersion
        const latestVersion = networkAccount.data.current.latestVersion

        // Error out if our node version doesn't meet the min version (it's too old)
        const minVersionValidationResult = meetsMinimumVersion(minVersion, nodeVersion)
        if (minVersionValidationResult !== VersionValidationResult.Success) {
          const tag = `isReadyToJoin: Not ready to join`
          const message = `Node version (${nodeVersion}) does not meet minimum required version (${minVersion}); Please install version (${latestVersion})`
          shardus.shutdownFromDapp(tag, message, false)
          return false
        }

        // Error out if our node version exceeds the max version (it's too new)
        const latestVersionValidationResult = isWithinMaximumVersion(latestVersion, nodeVersion)
        if (latestVersionValidationResult !== VersionValidationResult.Success) {
          const tag = `isReadyToJoin: Not ready to join`
          const message = `Node version (${nodeVersion}) exceeds maximum allowed version (${latestVersion}); Please install version (${latestVersion})`
          shardus.shutdownFromDapp(tag, message, false)
          return false
        }
      } else {
        // There are important roadblocks checks above for when we do have the network account loaded
        // we should not skip ahead until we are passing the if condition above
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `network account not available yet`)
        return false
      }

      isReadyToJoinLatestValue = false
      isAdminCertUnexpiredValue = false

      //process golden ticket first
      if (adminCert && adminCert.certExp > Date.now() && adminCert?.goldenTicket === true) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Join req with admincert and golden ticket')
        isReadyToJoinLatestValue = true
        isAdminCertUnexpiredValue = true
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'goldenTicket available, isReadyToJoin = true')
        return true
      }

      if (ShardeumFlags.StakingEnabled === false) {
        isReadyToJoinLatestValue = true
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'staking disabled, isReadyToJoin = true')
        return true
      }

      const numTotalNodes = latestCycle.active + latestCycle.syncing // total number of nodes in the network
      if (numTotalNodes < ShardeumFlags.minActiveNodesForStaking) {
        isReadyToJoinLatestValue = true
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'numTotalNodes < ShardeumFlags.minActiveNodesForStaking, isReadyToJoin = true')
        return true
      }
      /* prettier-ignore */ if (logFlags.important_as_error) console.log(`active: ${latestCycle.active}, syncing: ${latestCycle.syncing}, flag: ${ShardeumFlags.AdminCertEnabled}`)
      // check for ShardeumFlags for mode + check if mode is not equal to processing and validate adminCert
      if (ShardeumFlags.AdminCertEnabled === true && mode !== 'processing') {
        /* prettier-ignore */ if (logFlags.important_as_error) console.log('entered admin cert conditon mode:' + mode)
        if (adminCert) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`checkAdminCert ${Utils. safeStringify(adminCert)}`)
          if (adminCert.certExp > shardeumGetTime()) {
            isReadyToJoinLatestValue = true
            isAdminCertUnexpiredValue = true
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'valid admin cert, isReadyToJoin = true')
            /* prettier-ignore */ if (logFlags.important_as_error) console.log('valid admin cert, isReadyToJoin = true')
            return true
          } else {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'adminCert present but expired, this blocks joining')
            /* prettier-ignore */ if (logFlags.important_as_error) console.log('admin cert present but expired, this blocks joining')
            return false
          }
        }
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'adminCert expected not ready to join, this blocks joining')
        /* prettier-ignore */ if (logFlags.important_as_error) console.log('admin cert required but missing, this blocks joining')
        return false // this will stop us from joining the normal way
      }
      if (ShardeumFlags.AdminCertEnabled === true && mode === 'processing') {
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'AdminCertEnabled=true but mode is processing')
      }
      if (adminCert && !ShardeumFlags.AdminCertEnabled) {
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'adminCert present but AdminCertEnabled=false')
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`isReadyToJoin: AdminCert available but not utilized due to configuration`)
      }

      /* prettier-ignore */ if (logFlags.important_as_error) console.log(`Running isReadyToJoin cycle:${latestCycle.counter} publicKey: ${publicKey}`)
      // handle first time staking setup
      if (lastCertTimeTxTimestamp === 0) {
        // inject setCertTimeTx for the first time
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'lastCertTimeTxTimestamp === 0 first time or expired')

        const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
        if (response == null) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 1 reason: response is null`)
          return false
        }
        if (!response.success) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 1 reason: ${(response as ValidatorError).reason}`)
          return false
        }

        // set lastCertTimeTxTimestamp and cycle
        lastCertTimeTxTimestamp = shardeumGetTime()
        lastCertTimeTxCycle = latestCycle.counter

        // return false and query/check again in next cycle
        return false
      }

      const isCertTimeExpired =
        lastCertTimeTxCycle > 0 && latestCycle.counter - lastCertTimeTxCycle > getCertCycleDuration()
      if (isCertTimeExpired) {
        nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert expired and need to be renewed')
        if (ShardeumFlags.fixCertExpRenew) {
          const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
          if (response == null) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: response is null`)
            return false
          }
          if (!response.success) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: ${(response as ValidatorError).reason}`)
            return false
          }
          updateStakeCert(null) //clear stake cert, so we will know to query for it again
          // set lastCertTimeTxTimestamp and cycle
          lastCertTimeTxTimestamp = shardeumGetTime()
          lastCertTimeTxCycle = latestCycle.counter
          // return false and query/check again in next cycle
          return false
        }
      }

      //if we have stakeCert, check its time
      if (stakeCert != null) {
        nestedCountersInstance.countEvent('shardeum-staking', `stakeCert is not null`)

        const remainingValidTime = stakeCert.certExp - shardeumGetTime()
        const certStartTimestamp = stakeCert.certExp - getCertCycleDuration() * ONE_SECOND * latestCycle.duration
        const certEndTimestamp = stakeCert.certExp
        const expiredPercentage = (shardeumGetTime() - certStartTimestamp) / (certEndTimestamp - certStartTimestamp)
        const isExpiringSoon = expiredPercentage >= (ShardeumFlags.fixCertExpTiming ? 0.7 : 0.9) // only renew
        // if the cert is expired 70% or more
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`cert != null, remainingValidTime: ${remainingValidTime}, expiredPercentage: ${expiredPercentage}, isExpiringSoon: ${isExpiringSoon}`)

        if (isExpiringSoon) {
          nestedCountersInstance.countEvent('shardeum-staking', 'stakeCert is expired or expiring soon')
          if (ShardeumFlags.fixSetCertTimeTxApply === false) {
            updateStakeCert(null) //clear stake cert, so we will know to query for it again
          }
          const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
          if (response == null) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: response is null`)
            return false
          }
          if (!response.success) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 2 reason: ${(response as ValidatorError).reason}`)
            return false
          }
          if (ShardeumFlags.fixSetCertTimeTxApply === true) {
            updateStakeCert(null) //clear stake cert, so we will know to query for it again
          }
          lastCertTimeTxTimestamp = shardeumGetTime()
          lastCertTimeTxCycle = latestCycle.counter
          // return false and check again in next cycle
          return false
        } else {
          const isValid = true
          // todo: validate the cert here
          if (!isValid) {
            nestedCountersInstance.countEvent('shardeum-staking', 'invalid cert, isReadyToJoin = false')
            return false
          }

          nestedCountersInstance.countEvent('shardeum-staking', 'valid cert, isReadyToJoin = true')
          /* prettier-ignore */ if (logFlags.important_as_error) { console.log('valid cert, isReadyToJoin = true ', stakeCert) }

          isReadyToJoinLatestValue = true
          return true
        }
      }
      //if stake cert is null and we have set cert time before then query for the cert
      if (lastCertTimeTxTimestamp > 0 && stakeCert == null) {
        // we have already submitted setCertTime
        // query the certificate from the network
        const res = await queryCertificate(shardus, publicKey, activeNodes)
        /* prettier-ignore */ if (logFlags.important_as_error) console.log('queryCertificate', res)
        if (!res.success) {
          if (ShardeumFlags.fixSetCertTimeTxApply === false) {
            //old logic
            if ((res as ValidatorError).reason === 'Operator certificate has expired') {
              //force a set cert time next cycle, this should not be needed
              lastCertTimeTxTimestamp = 0
              lastCertTimeTxCycle = 0
            }

            if ((res as ValidatorError).reason === 'Operator certificate time is null') {
              lastCertTimeTxTimestamp = 0
              lastCertTimeTxCycle = 0
            }
          }

          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `call to queryCertificate failed with reason: ${(res as ValidatorError).reason}`)

          if (ShardeumFlags.fixCertExpTiming) {
            // if we injected setCertTimeTx more than 3 cycles ago but still cannot get new cert, we need to inject it again
            if (
              latestCycle.counter - lastCertTimeTxCycle > 3 ||
              shardeumGetTime() - lastCertTimeTxTimestamp > 3 * ONE_SECOND * latestCycle.duration
            ) {
              /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `call to queryCertificate failed for 3 consecutive cycles, will inject setCertTimeTx again`)
              lastCertTimeTxTimestamp = 0
            }
          }

          return false
        }
        const signedStakeCert = (res as CertSignaturesResult).signedStakeCert
        if (signedStakeCert == null) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `signedStakeCert is null`)
          return false
        }
        const remainingValidTime = signedStakeCert.certExp - shardeumGetTime()

        const certStartTimestamp = signedStakeCert.certExp - getCertCycleDuration() * ONE_SECOND * latestCycle.duration
        const certEndTimestamp = signedStakeCert.certExp
        const expiredPercentage = (shardeumGetTime() - certStartTimestamp) / (certEndTimestamp - certStartTimestamp)
        const isNewCertExpiringSoon = expiredPercentage >= 0.7
        /* prettier-ignore */ if (logFlags.important_as_error) console.log(`stakeCert received. remainingValidTime: ${remainingValidTime} expiredPercent: ${expiredPercentage}, isNewCertExpiringSoon: ${isNewCertExpiringSoon}`)

        // if queried cert is going to expire soon, inject a new setCertTimeTx
        if (isNewCertExpiringSoon) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'new stakeCert is expiring soon. will inject' + ' setCertTimeTx again')

          updateStakeCert(null) //clear stake cert, so we will know to query for it again
          const response = await injectSetCertTimeTx(shardus, publicKey, activeNodes)
          if (response == null) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 3 reason: response is null`)
            return false
          }
          if (!response.success) {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `failed call to injectSetCertTimeTx 3 reason: ${(response as ValidatorError).reason}`)
            return false
          }

          lastCertTimeTxTimestamp = shardeumGetTime()
          lastCertTimeTxCycle = latestCycle.counter
          // return false and check again in next cycle
          return false
        } else {
          const isValid = true
          // todo: validate the cert here
          if (!isValid) {
            nestedCountersInstance.countEvent('shardeum-staking', 'invalid cert, isReadyToJoin = false')
            return false
          }
          // cert if valid and not expiring soon
          updateStakeCert(signedStakeCert)

          nestedCountersInstance.countEvent('shardeum-staking', 'valid cert, isReadyToJoin = true')
          /* prettier-ignore */ if (logFlags.important_as_error) console.log('valid cert, isReadyToJoin = true ', stakeCert)

          isReadyToJoinLatestValue = true
          return true
        }
      }

      // avoid returning undefined, what if the calling code was refactored to check "=== false"...
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `end of function with no earlier return`)
      isReadyToJoinLatestValue = false
      return false
      } finally {
        isCheckingReadyToJoin = false
      }
    },
}