export interface NetworkAccountResponse {
  networkAccount: {
    accountId: string
    cycleNumber: number
    data: {
      accountType: number
      current: {
        activeVersion: string
        archiver: {
          activeVersion: string
          latestVersion: string
          minVersion: string
        }
        certCycleDuration: number
        chainID: number
        description: string
        enableNodeSlashing: boolean
        enableRPCEndpoints: boolean
        latestVersion: string
        maintenanceFee: number
        maintenanceInterval: number
        minVersion: string
        nodePenaltyUsd: {
          dataType: string
          value: string
        }
        nodeRewardAmountUsd: {
          dataType: string
          value: string
        }
        nodeRewardInterval: number
        qa: {
          qaTestBoolean: boolean
          qaTestNumber: number
          qaTestPercent: number
          qaTestSemver: string
        }
        restakeCooldown: number
        slashing: {
          enableLeftNetworkEarlySlashing: boolean
          enableNodeRefutedSlashing: boolean
          enableSyncTimeoutSlashing: boolean
          leftNetworkEarlyPenaltyPercent: number
          nodeRefutedPenaltyPercent: number
          syncTimeoutPenaltyPercent: number
        }
        stabilityScaleDiv: number
        stabilityScaleMul: number
        stakeLockTime: number
        stakeRequiredUsd: {
          dataType: string
          value: string
        }
        title: string
        txPause: boolean
      }
      hash: string
      id: string
      listOfChanges: Array<{
        change: Record<string, any>
        cycle: number
      }>
      mode: string
      next: Record<string, any>
      timestamp: number
    }
    hash: string
    isGlobal: boolean
    timestamp: number
  }
  sign: {
    owner: string
    sig: string
  }
}

export interface ConfigComparison {
  parameter: string
  expected: number | string
  actual: any
  matches: boolean
}

export interface ComparisonResult {
  section: string
  comparisons: ConfigComparison[]
  hasMismatches: boolean
}
