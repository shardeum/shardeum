import { PersistenceJob, WatchdogMetrics, WatchdogConfig, AccountToSave } from './types/persistenceTypes'
import { nestedCountersInstance } from '@shardeum-foundation/core'

class PersistenceWatchdog {
  private jobs: Map<string, PersistenceJob> = new Map()
  private accountToJobs: Map<string, Set<string>> = new Map() // accountId -> Set of txIds
  private checkIntervalId: NodeJS.Timeout | null = null
  private reportIntervalId: NodeJS.Timeout | null = null
  private metrics: WatchdogMetrics = {
    jobsCreated: 0,
    jobsCompleted: 0,
    jobsTimedOut: 0,
    accountsSaved: 0,
    accountsPending: 0,
    averageCompletionTime: 0,
    oldUnfinishedJobs: 0,
    consensusJobs: 0,
    receiptJobs: 0,
    syncJobs: 0,
  }
  private completionTimes: number[] = []
  private config: WatchdogConfig = {
    enabled: true,
    checkInterval: 10000, // 10 seconds
    timeoutThreshold: 30000, // 30 seconds
    reportInterval: 300000, // 5 minutes
    verbose: false,
    maxJobRetention: 600000, // 10 minutes
  }

  constructor(config?: Partial<WatchdogConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Initialize the watchdog and start periodic checks
   */
  init(): void {
    if (!this.config.enabled) {
      console.log('PersistenceWatchdog: Disabled via configuration')
      return
    }

    console.log('PersistenceWatchdog: Initializing with config:', this.config)
    
    // Start periodic check for old jobs
    this.checkIntervalId = setInterval(() => {
      this.checkForOldJobs()
    }, this.config.checkInterval)

    // Start periodic reporting
    this.reportIntervalId = setInterval(() => {
      this.reportStatus()
    }, this.config.reportInterval)

    console.log('PersistenceWatchdog: Initialized successfully')
  }

  /**
   * Shutdown the watchdog and clean up
   */
  shutdown(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }
    if (this.reportIntervalId) {
      clearInterval(this.reportIntervalId)
      this.reportIntervalId = null
    }
    this.jobs.clear()
    this.accountToJobs.clear()
    console.log('PersistenceWatchdog: Shutdown complete')
  }

  /**
   * Create a new job to track transaction persistence
   */
  createJob(
    txId: string,
    receipt: any,
    accountIds: string[],
    source: 'consensus' | 'receipt' | 'sync' = 'consensus'
  ): void {
    if (!this.config.enabled) return

    // Don't create duplicate jobs
    if (this.jobs.has(txId)) {
      if (this.config.verbose) {
        console.log(`PersistenceWatchdog: Job already exists for tx ${txId}`)
      }
      return
    }

    const now = Date.now()
    const accountsToSave: AccountToSave[] = accountIds.map(accountId => ({
      accountId,
      saved: false,
    }))

    const job: PersistenceJob = {
      txId,
      receipt,
      accountsToSave,
      createdAt: now,
      lastCheckedAt: now,
      isComplete: false,
      source,
    }

    this.jobs.set(txId, job)

    // Update account to jobs mapping
    for (const accountId of accountIds) {
      if (!this.accountToJobs.has(accountId)) {
        this.accountToJobs.set(accountId, new Set())
      }
      this.accountToJobs.get(accountId)!.add(txId)
    }

    // Update metrics
    this.metrics.jobsCreated++
    this.metrics.accountsPending += accountIds.length
    if (source === 'consensus') {
      this.metrics.consensusJobs++
    } else if (source === 'receipt') {
      this.metrics.receiptJobs++
    } else if (source === 'sync') {
      this.metrics.syncJobs++
    }

    nestedCountersInstance.countEvent('persistence-watchdog', 'job-created')
    nestedCountersInstance.countEvent('persistence-watchdog', `job-created-${source}`)

    if (this.config.verbose) {
      console.log(`PersistenceWatchdog: Created job for tx ${txId} with ${accountIds.length} accounts from ${source}`)
    }
  }

  /**
   * Mark an account as failed to save for all relevant jobs
   */
  markAccountFailed(accountId: string, reason?: string): void {
    if (!this.config.enabled) return

    const jobIds = this.accountToJobs.get(accountId)
    if (!jobIds || jobIds.size === 0) {
      // No jobs tracking this account
      return
    }

    const now = Date.now()
    
    console.warn(`PersistenceWatchdog: Account ${accountId} failed to save. Reason: ${reason || 'Unknown'}`)
    nestedCountersInstance.countEvent('persistence-watchdog', 'account-save-failed')

    // Mark the account as failed in all relevant jobs
    for (const txId of jobIds) {
      const job = this.jobs.get(txId)
      if (!job || job.isComplete) continue

      // Find the account and mark it as saved (with failure noted)
      for (const account of job.accountsToSave) {
        if (account.accountId === accountId && !account.saved) {
          // We mark it as "saved" to complete the job, but log the failure
          account.saved = true
          account.savedAt = now
          
          // Check if job is now complete
          const allSaved = job.accountsToSave.every(acc => acc.saved)
          if (allSaved) {
            job.isComplete = true
            this.metrics.jobsCompleted++
            
            console.warn(`PersistenceWatchdog: Job ${txId} completed with failures`)
            nestedCountersInstance.countEvent('persistence-watchdog', 'job-completed-with-failures')
            
            // Schedule job cleanup
            setTimeout(() => {
              this.removeJob(txId)
            }, this.config.maxJobRetention)
          }
          break
        }
      }
    }

    // Clean up account mapping
    this.accountToJobs.delete(accountId)
  }

  /**
   * Mark an account as saved for all relevant jobs
   */
  markAccountSaved(accountId: string, timestamp?: number): void {
    if (!this.config.enabled) return

    const jobIds = this.accountToJobs.get(accountId)
    if (!jobIds || jobIds.size === 0) {
      // No jobs tracking this account
      return
    }

    const now = timestamp || Date.now()
    let completedJobs = 0

    for (const txId of jobIds) {
      const job = this.jobs.get(txId)
      if (!job || job.isComplete) continue

      // Find and mark the account as saved
      let accountSaved = false
      for (const account of job.accountsToSave) {
        if (account.accountId === accountId && !account.saved) {
          account.saved = true
          account.savedAt = now
          accountSaved = true
          this.metrics.accountsSaved++
          this.metrics.accountsPending--
          break
        }
      }

      if (accountSaved) {
        // Check if job is now complete
        const allSaved = job.accountsToSave.every(acc => acc.saved)
        if (allSaved) {
          job.isComplete = true
          const completionTime = now - job.createdAt
          this.completionTimes.push(completionTime)
          this.updateAverageCompletionTime()
          this.metrics.jobsCompleted++
          completedJobs++

          nestedCountersInstance.countEvent('persistence-watchdog', 'job-completed')
          nestedCountersInstance.countEvent('persistence-watchdog', `job-completed-${job.source}`)

          if (this.config.verbose) {
            console.log(`PersistenceWatchdog: Job ${txId} completed in ${completionTime}ms`)
          }

          // Schedule job cleanup
          setTimeout(() => {
            this.removeJob(txId)
          }, this.config.maxJobRetention)
        }
      }
    }

    // Clean up account mapping for completed jobs
    if (completedJobs > 0) {
      const remainingJobs = new Set<string>()
      for (const txId of jobIds) {
        const job = this.jobs.get(txId)
        if (job && !job.isComplete) {
          remainingJobs.add(txId)
        }
      }
      if (remainingJobs.size === 0) {
        this.accountToJobs.delete(accountId)
      } else {
        this.accountToJobs.set(accountId, remainingJobs)
      }
    }
  }

  /**
   * Check for old unfinished jobs
   */
  private checkForOldJobs(): void {
    const now = Date.now()
    let oldJobs = 0
    const oldJobDetails: any[] = []

    for (const [txId, job] of this.jobs) {
      if (!job.isComplete) {
        const age = now - job.createdAt
        if (age > this.config.timeoutThreshold) {
          oldJobs++
          
          const pendingAccounts = job.accountsToSave
            .filter(acc => !acc.saved)
            .map(acc => acc.accountId)

          oldJobDetails.push({
            txId,
            age: Math.round(age / 1000), // in seconds
            pendingAccounts: pendingAccounts.length,
            totalAccounts: job.accountsToSave.length,
            source: job.source,
          })

          // Only count as timeout once
          if (age > this.config.timeoutThreshold && age <= this.config.timeoutThreshold + this.config.checkInterval) {
            this.metrics.jobsTimedOut++
            nestedCountersInstance.countEvent('persistence-watchdog', 'job-timeout')
            nestedCountersInstance.countEvent('persistence-watchdog', `job-timeout-${job.source}`)
          }
        }
        job.lastCheckedAt = now
      }
    }

    this.metrics.oldUnfinishedJobs = oldJobs

    if (oldJobs > 0) {
      console.warn(`PersistenceWatchdog: Found ${oldJobs} old unfinished jobs:`, oldJobDetails)
      nestedCountersInstance.countEvent('persistence-watchdog', 'old-jobs-detected', oldJobs)
    }
  }

  /**
   * Report current status
   */
  private reportStatus(): void {
    const totalJobs = this.jobs.size
    const activeJobs = Array.from(this.jobs.values()).filter(j => !j.isComplete).length
    const completedJobs = totalJobs - activeJobs

    const report = {
      totalJobs,
      activeJobs,
      completedJobs,
      metrics: this.metrics,
      oldestJobAge: this.getOldestJobAge(),
      accountsBeingTracked: this.accountToJobs.size,
    }

    console.log('PersistenceWatchdog Status Report:', report)
    nestedCountersInstance.countEvent('persistence-watchdog', 'status-report')
    
    // Report to monitoring system
    console.log(`PersistenceWatchdog: Active=${activeJobs}, Old=${this.metrics.oldUnfinishedJobs}, AvgTime=${Math.round(this.metrics.averageCompletionTime)}ms`)
  }

  /**
   * Remove a job from tracking
   */
  private removeJob(txId: string): void {
    const job = this.jobs.get(txId)
    if (!job) return

    // Clean up account mappings
    for (const account of job.accountsToSave) {
      const jobIds = this.accountToJobs.get(account.accountId)
      if (jobIds) {
        jobIds.delete(txId)
        if (jobIds.size === 0) {
          this.accountToJobs.delete(account.accountId)
        }
      }
    }

    this.jobs.delete(txId)
  }

  /**
   * Update average completion time
   */
  private updateAverageCompletionTime(): void {
    if (this.completionTimes.length === 0) {
      this.metrics.averageCompletionTime = 0
      return
    }

    // Keep only last 100 completion times
    if (this.completionTimes.length > 100) {
      this.completionTimes = this.completionTimes.slice(-100)
    }

    const sum = this.completionTimes.reduce((a, b) => a + b, 0)
    this.metrics.averageCompletionTime = sum / this.completionTimes.length
  }

  /**
   * Get age of oldest unfinished job
   */
  private getOldestJobAge(): number {
    const now = Date.now()
    let oldestAge = 0

    for (const job of this.jobs.values()) {
      if (!job.isComplete) {
        const age = now - job.createdAt
        if (age > oldestAge) {
          oldestAge = age
        }
      }
    }

    return oldestAge
  }

  /**
   * Get current metrics
   */
  getMetrics(): WatchdogMetrics {
    return { ...this.metrics }
  }

  /**
   * Get job details by transaction ID
   */
  getJob(txId: string): PersistenceJob | undefined {
    return this.jobs.get(txId)
  }

  /**
   * Get all active (incomplete) jobs
   */
  getActiveJobs(): PersistenceJob[] {
    return Array.from(this.jobs.values()).filter(j => !j.isComplete)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WatchdogConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('PersistenceWatchdog: Configuration updated:', this.config)
  }
}

// Export singleton instance
export const persistenceWatchdog = new PersistenceWatchdog()

// Export class for testing
export { PersistenceWatchdog }