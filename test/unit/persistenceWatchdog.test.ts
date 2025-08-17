import { PersistenceWatchdog } from '../../src/monitoring/persistenceWatchdog'
import { WatchdogConfig } from '../../src/monitoring/types/persistenceTypes'

describe('PersistenceWatchdog', () => {
  let watchdog: PersistenceWatchdog
  let originalConsoleLog: typeof console.log
  let originalConsoleWarn: typeof console.warn

  beforeEach(() => {
    // Create a new watchdog instance for each test
    const config: Partial<WatchdogConfig> = {
      enabled: true,
      checkInterval: 100, // 100ms for faster tests
      timeoutThreshold: 500, // 500ms for faster tests
      reportInterval: 1000, // 1 second for faster tests
      verbose: false,
      maxJobRetention: 2000, // 2 seconds for faster tests
    }
    watchdog = new PersistenceWatchdog(config)
    
    // Mock console methods
    originalConsoleLog = console.log
    originalConsoleWarn = console.warn
    console.log = jest.fn()
    console.warn = jest.fn()
  })

  afterEach(() => {
    // Cleanup
    watchdog.shutdown()
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
  })

  describe('Job Creation', () => {
    test('should create a new job successfully', () => {
      const txId = 'tx123'
      const receipt = { data: 'test' }
      const accountIds = ['account1', 'account2']

      watchdog.createJob(txId, receipt, accountIds, 'consensus')

      const job = watchdog.getJob(txId)
      expect(job).toBeDefined()
      expect(job?.txId).toBe(txId)
      expect(job?.receipt).toBe(receipt)
      expect(job?.accountsToSave).toHaveLength(2)
      expect(job?.source).toBe('consensus')
      expect(job?.isComplete).toBe(false)
    })

    test('should not create duplicate jobs', () => {
      const txId = 'tx123'
      const receipt = { data: 'test' }
      const accountIds = ['account1']

      watchdog.createJob(txId, receipt, accountIds, 'consensus')
      watchdog.createJob(txId, receipt, accountIds, 'consensus') // Try to create duplicate

      const activeJobs = watchdog.getActiveJobs()
      expect(activeJobs).toHaveLength(1)
    })

    test('should track metrics correctly on job creation', () => {
      const txId1 = 'tx1'
      const txId2 = 'tx2'
      const receipt = { data: 'test' }

      watchdog.createJob(txId1, receipt, ['account1', 'account2'], 'consensus')
      watchdog.createJob(txId2, receipt, ['account3'], 'receipt')

      const metrics = watchdog.getMetrics()
      expect(metrics.jobsCreated).toBe(2)
      expect(metrics.consensusJobs).toBe(1)
      expect(metrics.receiptJobs).toBe(1)
      expect(metrics.accountsPending).toBe(3)
    })
  })

  describe('Account Saving', () => {
    test('should mark account as saved', () => {
      const txId = 'tx123'
      const receipt = { data: 'test' }
      const accountIds = ['account1', 'account2']

      watchdog.createJob(txId, receipt, accountIds, 'consensus')
      watchdog.markAccountSaved('account1', Date.now())

      const job = watchdog.getJob(txId)
      expect(job?.accountsToSave[0].saved).toBe(true)
      expect(job?.accountsToSave[1].saved).toBe(false)
      expect(job?.isComplete).toBe(false)
    })

    test('should mark job as complete when all accounts are saved', () => {
      const txId = 'tx123'
      const receipt = { data: 'test' }
      const accountIds = ['account1', 'account2']

      watchdog.createJob(txId, receipt, accountIds, 'consensus')
      watchdog.markAccountSaved('account1')
      watchdog.markAccountSaved('account2')

      const job = watchdog.getJob(txId)
      expect(job?.isComplete).toBe(true)
      
      const metrics = watchdog.getMetrics()
      expect(metrics.jobsCompleted).toBe(1)
      expect(metrics.accountsSaved).toBe(2)
      expect(metrics.accountsPending).toBe(0)
    })

    test('should handle account saves for multiple jobs', () => {
      const txId1 = 'tx1'
      const txId2 = 'tx2'
      const receipt = { data: 'test' }
      
      // Create two jobs that both track account1
      watchdog.createJob(txId1, receipt, ['account1', 'account2'], 'consensus')
      watchdog.createJob(txId2, receipt, ['account1', 'account3'], 'receipt')
      
      // Save account1 - should affect both jobs
      watchdog.markAccountSaved('account1')
      
      const job1 = watchdog.getJob(txId1)
      const job2 = watchdog.getJob(txId2)
      
      expect(job1?.accountsToSave[0].saved).toBe(true) // account1 saved
      expect(job1?.accountsToSave[1].saved).toBe(false) // account2 not saved
      expect(job2?.accountsToSave[0].saved).toBe(true) // account1 saved
      expect(job2?.accountsToSave[1].saved).toBe(false) // account3 not saved
    })
  })

  describe('Timeout Detection', () => {
    test('should detect old unfinished jobs', async () => {
      const txId = 'tx123'
      const receipt = { data: 'test' }
      const accountIds = ['account1', 'account2']

      // Initialize watchdog
      watchdog.init()
      
      // Create a job
      watchdog.createJob(txId, receipt, accountIds, 'consensus')
      
      // Wait for timeout threshold to pass
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Check metrics
      const metrics = watchdog.getMetrics()
      expect(metrics.oldUnfinishedJobs).toBeGreaterThan(0)
      expect(metrics.jobsTimedOut).toBeGreaterThan(0)
      
      // Verify console warning was called
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Found'),
        expect.anything()
      )
    })
  })

  describe('Job Cleanup', () => {
    test('should clean up completed jobs after retention period', async () => {
      const txId = 'tx123'
      const receipt = { data: 'test' }
      const accountIds = ['account1']

      watchdog.createJob(txId, receipt, accountIds, 'consensus')
      watchdog.markAccountSaved('account1')

      // Job should be complete
      expect(watchdog.getJob(txId)?.isComplete).toBe(true)

      // Wait for retention period
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Job should be cleaned up
      expect(watchdog.getJob(txId)).toBeUndefined()
    })
  })

  describe('Configuration', () => {
    test('should respect disabled configuration', () => {
      const disabledWatchdog = new PersistenceWatchdog({ enabled: false })
      disabledWatchdog.init()
      
      const txId = 'tx123'
      const receipt = { data: 'test' }
      const accountIds = ['account1']
      
      disabledWatchdog.createJob(txId, receipt, accountIds, 'consensus')
      
      // Job should not be created when disabled
      expect(disabledWatchdog.getJob(txId)).toBeUndefined()
      
      disabledWatchdog.shutdown()
    })

    test('should update configuration dynamically', () => {
      watchdog.updateConfig({ verbose: true, timeoutThreshold: 1000 })
      
      const config = (watchdog as any).config
      expect(config.verbose).toBe(true)
      expect(config.timeoutThreshold).toBe(1000)
    })
  })

  describe('Metrics and Reporting', () => {
    test('should calculate average completion time', async () => {
      const receipt = { data: 'test' }
      
      // Create and complete multiple jobs with small delays
      for (let i = 0; i < 3; i++) {
        const txId = `tx${i}`
        watchdog.createJob(txId, receipt, [`account${i}`], 'consensus')
        await new Promise(resolve => setTimeout(resolve, 10)) // Small delay
        watchdog.markAccountSaved(`account${i}`)
      }
      
      const metrics = watchdog.getMetrics()
      expect(metrics.averageCompletionTime).toBeGreaterThanOrEqual(0)
      expect(metrics.jobsCompleted).toBe(3)
    })

    test('should return all active jobs', () => {
      const receipt = { data: 'test' }
      
      watchdog.createJob('tx1', receipt, ['account1'], 'consensus')
      watchdog.createJob('tx2', receipt, ['account2'], 'receipt')
      watchdog.createJob('tx3', receipt, ['account3'], 'consensus')
      
      // Complete one job
      watchdog.markAccountSaved('account2')
      
      const activeJobs = watchdog.getActiveJobs()
      expect(activeJobs).toHaveLength(2)
      expect(activeJobs.find(j => j.txId === 'tx1')).toBeDefined()
      expect(activeJobs.find(j => j.txId === 'tx3')).toBeDefined()
      expect(activeJobs.find(j => j.txId === 'tx2')).toBeUndefined()
    })
  })

  describe('Sync Jobs', () => {
    test('should track sync jobs correctly', () => {
      const syncId = 'sync-123-abc'
      const receipt = null // Sync jobs have no receipt
      const accountIds = ['account1', 'account2', 'account3']
      
      watchdog.createJob(syncId, receipt, accountIds, 'sync')
      
      const job = watchdog.getJob(syncId)
      expect(job).toBeDefined()
      expect(job?.txId).toBe(syncId)
      expect(job?.receipt).toBeNull()
      expect(job?.accountsToSave).toHaveLength(3)
      expect(job?.source).toBe('sync')
      expect(job?.isComplete).toBe(false)
      
      const metrics = watchdog.getMetrics()
      expect(metrics.syncJobs).toBe(1)
    })
    
    test('should complete sync jobs when all accounts are saved', () => {
      const syncId = 'sync-456-def'
      const accountIds = ['account1', 'account2']
      
      watchdog.createJob(syncId, null, accountIds, 'sync')
      
      // Save all accounts
      watchdog.markAccountSaved('account1')
      watchdog.markAccountSaved('account2')
      
      const job = watchdog.getJob(syncId)
      expect(job?.isComplete).toBe(true)
      
      const metrics = watchdog.getMetrics()
      expect(metrics.jobsCompleted).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    test('should handle marking non-existent account as saved', () => {
      // Should not throw when marking account with no jobs
      expect(() => {
        watchdog.markAccountSaved('nonexistent')
      }).not.toThrow()
    })

    test('should handle empty account list gracefully', () => {
      const txId = 'tx123'
      const receipt = { data: 'test' }
      
      watchdog.createJob(txId, receipt, [], 'consensus')
      
      const job = watchdog.getJob(txId)
      expect(job?.accountsToSave).toHaveLength(0)
      expect(job?.isComplete).toBe(false)
    })

    test('should handle multiple saves of same account', () => {
      const txId = 'tx123'
      const receipt = { data: 'test' }
      
      watchdog.createJob(txId, receipt, ['account1'], 'consensus')
      
      // Save the same account multiple times
      watchdog.markAccountSaved('account1')
      watchdog.markAccountSaved('account1')
      watchdog.markAccountSaved('account1')
      
      const metrics = watchdog.getMetrics()
      // Should only count as one save
      expect(metrics.accountsSaved).toBe(1)
    })
  })
})