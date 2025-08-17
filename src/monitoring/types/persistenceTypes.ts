export interface AccountToSave {
  accountId: string
  expectedHash?: string
  saved: boolean
  savedAt?: number
}

export interface PersistenceJob {
  txId: string
  receipt: any // Reference to the receipt object
  accountsToSave: AccountToSave[]
  createdAt: number
  lastCheckedAt: number
  isComplete: boolean
  source: 'consensus' | 'receipt' | 'sync' // Track where the job originated (consensus, receipt from other nodes, or sync/repair)
}

export interface WatchdogMetrics {
  jobsCreated: number
  jobsCompleted: number
  jobsTimedOut: number
  accountsSaved: number
  accountsPending: number
  averageCompletionTime: number
  oldUnfinishedJobs: number
  consensusJobs: number
  receiptJobs: number
  syncJobs: number
}

export interface WatchdogConfig {
  enabled: boolean
  checkInterval: number // ms between periodic checks
  timeoutThreshold: number // ms before job is considered old
  reportInterval: number // ms between periodic reports
  verbose: boolean
  maxJobRetention: number // max time to keep completed jobs
}