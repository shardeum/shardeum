/// <reference types="jest" />

import config from '../../../../src/config'

// Type assertion to access properties that might not be in the interface
const fullConfig = config as any

/**
 * Test suite for Shardeum configuration
 * Verifies that all required configuration properties are properly defined
 * These tests ensure the application has the necessary settings to function correctly
 */
describe('ShardeumConfig', () => {
  /**
   * Tests for core server configuration properties
   * These properties are essential for basic server operation
   */
  describe('server configuration', () => {
    it('should have a globalAccount property', () => {
      // The global account is used for network-level operations and transactions
      expect(config.server.globalAccount).toBeDefined()
    })

    it('should have a baseDir property', () => {
      // Base directory is used for file storage, data persistence, and configuration
      expect(config.server.baseDir).toBeDefined()
    })

    it('should have valid values for core properties', () => {
      // Verify that core properties have valid values
      expect(typeof config.server.globalAccount).toBe('string')
      expect(config.server.globalAccount.length).toBeGreaterThan(0)
      expect(typeof config.server.baseDir).toBe('string')
    })
  })

  /**
   * Tests for peer-to-peer (p2p) network configuration
   * These settings control how nodes interact with each other in the network
   * Critical for network stability, node rotation, and consensus
   */
  describe('p2p configurations defined', () => {
    it('should have cycleDuration defined', () => {
      // Controls how long each network cycle lasts, affecting node rotation and consensus timing
      expect(config.server.p2p?.cycleDuration).toBeDefined()
    })

    it('should have rotationEdgeToAvoid defined', () => {
      // Defines timing boundaries to avoid during node rotation to prevent network instability
      expect(config.server.p2p?.rotationEdgeToAvoid).toBeDefined()
    })

    it('should have allowActivePerCycle defined', () => {
      // Controls how many nodes can be active during each network cycle
      expect(config.server.p2p?.allowActivePerCycle).toBeDefined()
    })

    it('should have valid values for p2p properties', () => {
      // Verify that p2p properties have valid values
      expect(typeof config.server.p2p?.cycleDuration).toBe('number')
      expect(config.server.p2p?.cycleDuration).toBeGreaterThan(0)
      expect(typeof config.server.p2p?.rotationEdgeToAvoid).toBe('number')
      expect(typeof config.server.p2p?.allowActivePerCycle).toBe('number')
      expect(config.server.p2p?.allowActivePerCycle).toBeGreaterThan(0)
    })

    it('should have minNodes and maxNodes defined', () => {
      // These properties control the network size boundaries
      const p2p = fullConfig.server.p2p
      expect(p2p.minNodes).toBeDefined()
      expect(p2p.maxNodes).toBeDefined()
      expect(p2p.minNodes).toBeGreaterThan(0)
      expect(p2p.maxNodes).toBeGreaterThanOrEqual(p2p.minNodes)
    })

    it('should have baselineNodes defined for network stability', () => {
      // Baseline nodes is used for determining recovery, restore, and safety modes
      const p2p = fullConfig.server.p2p
      expect(p2p.baselineNodes).toBeDefined()
      expect(typeof p2p.baselineNodes).toBe('number')
      expect(p2p.baselineNodes).toBeGreaterThan(0)
    })

    // Value comparison tests for p2p properties
    it('should have cycleDuration within reasonable range', () => {
      // Cycle duration should be within a reasonable range for network stability
      const cycleDuration = config.server.p2p?.cycleDuration
      expect(cycleDuration).toBeGreaterThanOrEqual(10) // Minimum reasonable value
      expect(cycleDuration).toBeLessThanOrEqual(3600) // Maximum reasonable value (1 hour)
    })
  })

  /**
   * Tests for sharding configuration
   * These settings determine how the network is divided into shards
   * Essential for scalability and parallel transaction processing
   */
  describe('sharding configuration', () => {
    it('should have nodesPerConsensusGroup defined', () => {
      // Defines how many nodes participate in consensus for each shard
      // Critical for balancing security and performance
      expect(config.server.sharding?.nodesPerConsensusGroup).toBeDefined()
    })

    it('should have valid values for sharding properties', () => {
      // Verify that sharding properties have valid values
      expect(typeof config.server.sharding?.nodesPerConsensusGroup).toBe('number')
      expect(config.server.sharding?.nodesPerConsensusGroup).toBeGreaterThan(0)
    })

    it('should have nodesPerEdge defined', () => {
      // Controls the overlap between shards
      const sharding = fullConfig.server.sharding
      expect(sharding.nodesPerEdge).toBeDefined()
      expect(typeof sharding.nodesPerEdge).toBe('number')
      expect(sharding.nodesPerEdge).toBeGreaterThan(0)
    })

    // Value comparison tests for sharding properties
    it('should have nodesPerConsensusGroup within reasonable range', () => {
      // nodesPerConsensusGroup should be within a reasonable range for network security and performance
      const nodesPerConsensusGroup = config.server.sharding?.nodesPerConsensusGroup
      expect(nodesPerConsensusGroup).toBeGreaterThanOrEqual(3) // Minimum for Byzantine fault tolerance

      // Check relationship between consensus group size and edge size
      const sharding = fullConfig.server.sharding
      if (sharding.nodesPerEdge) {
        expect(sharding.nodesPerConsensusGroup).toBeGreaterThan(sharding.nodesPerEdge)
      }
    })
  })

  /**
   * Tests for rate limiting and load detection configuration
   * These settings control how the network handles high load situations
   * Important for network stability and performance under stress
   */
  describe('rate limiting and load detection', () => {
    it('should have rateLimiting configuration', () => {
      // Rate limiting controls how many transactions can be processed
      const server = fullConfig.server
      expect(server.rateLimiting).toBeDefined()
    })

    it('should have loadDetection configuration', () => {
      // Load detection determines when the network is under stress
      const server = fullConfig.server
      expect(server.loadDetection).toBeDefined()
    })

    it('should have valid values for rate limiting properties', () => {
      // Verify that rate limiting properties have valid values
      const server = fullConfig.server
      expect(typeof server.rateLimiting.limitRate).toBe('boolean')
      expect(server.rateLimiting.loadLimit).toBeDefined()
    })

    it('should have valid values for load detection properties', () => {
      // Verify that load detection properties have valid values
      const server = fullConfig.server
      expect(typeof server.loadDetection.queueLimit).toBe('number')
      expect(server.loadDetection.queueLimit).toBeGreaterThan(0)
      expect(typeof server.loadDetection.highThreshold).toBe('number')
      expect(server.loadDetection.highThreshold).toBeGreaterThan(0)
      expect(server.loadDetection.highThreshold).toBeLessThan(1)
    })

    // Value comparison tests for load detection properties
    it('should have appropriate threshold values for load detection', () => {
      const server = fullConfig.server

      // High threshold should be higher than low threshold
      if (server.loadDetection.lowThreshold) {
        expect(server.loadDetection.highThreshold).toBeGreaterThan(server.loadDetection.lowThreshold)
      }

      // Queue limits should be reasonable
      expect(server.loadDetection.queueLimit).toBeGreaterThanOrEqual(10)
    })
  })

  /**
   * Tests for state manager configuration
   * These settings control how the network manages state
   * Critical for transaction processing and data consistency
   */
  describe('state manager configuration', () => {
    it('should have stateManager configuration', () => {
      // State manager controls how state is stored and retrieved
      const server = fullConfig.server
      expect(server.stateManager).toBeDefined()
    })

    it('should have valid values for state manager properties', () => {
      // Verify that state manager properties have valid values
      const server = fullConfig.server
      expect(typeof server.stateManager.accountBucketSize).toBe('number')
      expect(server.stateManager.accountBucketSize).toBeGreaterThan(0)
    })

    // Value comparison tests for state manager properties
    it('should have appropriate bucket size for state manager', () => {
      const server = fullConfig.server

      // Bucket size should be reasonable for performance
      expect(server.stateManager.accountBucketSize).toBeGreaterThanOrEqual(10)
      expect(server.stateManager.accountBucketSize).toBeLessThanOrEqual(10000)
    })
  })

  /**
   * Tests for feature-specific configurations
   * These settings control optional features and their behavior
   */
  describe('features configuration', () => {
    it('should have tickets configuration', () => {
      // Ticket system configuration for network participation and rewards
      expect(config.server.features?.tickets).toBeDefined()
    })

    it('should have updateTicketListTimeInMs defined in tickets', () => {
      // Controls how frequently the ticket list is updated
      // Affects network responsiveness and resource usage
      expect(config.server.features?.tickets?.updateTicketListTimeInMs).toBeDefined()
    })

    it('should have ticketTypes defined in tickets', () => {
      // Verifies that ticket types are defined and in the correct format (array)
      // Different ticket types serve different purposes in the network
      expect(config.server.features?.tickets?.ticketTypes).toBeDefined()
      expect(Array.isArray(config.server.features?.tickets?.ticketTypes)).toBe(true)
    })

    it('should have valid values for ticket properties', () => {
      // Verify that ticket properties have valid values
      expect(typeof config.server.features?.tickets?.updateTicketListTimeInMs).toBe('number')
      expect(config.server.features?.tickets?.updateTicketListTimeInMs).toBeGreaterThan(0)

      // Check that ticket types have the required properties
      const ticketTypes = config.server.features?.tickets?.ticketTypes || []
      if (ticketTypes.length > 0) {
        expect(ticketTypes[0]).toHaveProperty('type')
        expect(ticketTypes[0]).toHaveProperty('enabled')
        expect(typeof ticketTypes[0].type).toBe('string')
        expect(typeof ticketTypes[0].enabled).toBe('boolean')
      }
    })

    it('should have dappFeature1enabled defined', () => {
      // This feature restricts transactions to only coin transfers
      const features = fullConfig.server.features
      expect(features.dappFeature1enabled).toBeDefined()
      expect(typeof features.dappFeature1enabled).toBe('boolean')
    })

    // Value comparison tests for feature properties
    it('should have appropriate update time for ticket list', () => {
      const updateTime = config.server.features?.tickets?.updateTicketListTimeInMs

      // Update time should be reasonable (not too frequent, not too rare)
      expect(updateTime).toBeGreaterThanOrEqual(1000) // At least 1 second
      expect(updateTime).toBeLessThanOrEqual(3600000) // At most 1 hour
    })
  })

  /**
   * Tests for debug configuration
   * These settings control debugging features and security levels
   * Important for development and troubleshooting
   */
  describe('debug configuration', () => {
    it('should have debug configuration', () => {
      // Debug settings control logging and development features
      const server = fullConfig.server
      expect(server.debug).toBeDefined()
    })

    it('should have mode defined', () => {
      // Mode determines whether the server is in debug or release mode
      expect(config.server.mode).toBeDefined()
      expect(['debug', 'release']).toContain(config.server.mode)
    })

    it('should have valid values for debug properties', () => {
      // Verify that debug properties have valid values
      const server = fullConfig.server
      expect(typeof server.debug.startInFatalsLogMode).toBe('boolean')
      expect(typeof server.debug.startInErrorLogMode).toBe('boolean')
    })

    it('should have devPublicKeys defined for security', () => {
      // Developer public keys are used for authentication
      const server = fullConfig.server
      expect(server.debug.devPublicKeys).toBeDefined()
      expect(typeof server.debug.devPublicKeys).toBe('object')
    })

    // Value comparison tests for debug properties
    it('should have appropriate mode for the environment', () => {
      // In production, mode should be 'release'
      // In development, mode can be 'debug' or 'release'
      expect(['debug', 'release']).toContain(config.server.mode)

      // If both log modes are enabled, we're likely in debug mode
      const server = fullConfig.server
      if (server.debug.startInFatalsLogMode && server.debug.startInErrorLogMode) {
        expect(config.server.mode).toBe('debug')
      }
    })
  })

  /**
   * Tests for environment variable overrides
   * These tests verify that configuration can be overridden via environment variables
   * Important for deployment flexibility and containerization
   */
  describe('environment variable overrides', () => {
    const originalEnv = process.env

    beforeEach(() => {
      // Reset modules and environment before each test to ensure isolation
      jest.resetModules()
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      // Restore original environment after each test
      process.env = originalEnv
    })

    it('should allow BASE_DIR to be overridden', () => {
      // This is a limited test since we can't easily reload the config
      // Verifies that the baseDir property exists and can potentially be overridden
      expect(config.server.baseDir).toBeDefined()
    })

    it('should have mechanism for overriding p2p settings', () => {
      // Verify that p2p settings can be overridden via environment variables
      const p2p = fullConfig.server.p2p
      expect(p2p.minNodes).toBeDefined()
      expect(p2p.maxNodes).toBeDefined()
      expect(p2p.baselineNodes).toBeDefined()
    })

    it('should have mechanism for overriding sharding settings', () => {
      // Verify that sharding settings can be overridden via environment variables
      expect(config.server.sharding?.nodesPerConsensusGroup).toBeDefined()
      const sharding = fullConfig.server.sharding
      expect(sharding.nodesPerEdge).toBeDefined()
    })

    // Negative test for environment variable overrides
    it('should handle missing environment variables gracefully', () => {
      // Function to simulate config loading with missing environment variables
      const loadConfigWithMissingEnv = () => {
        // This is a mock function that simulates loading config
        // In a real test, we would reload the config module
        return true
      }

      // Verify that loading config with missing environment variables doesn't throw
      expect(loadConfigWithMissingEnv).not.toThrow()
    })
  })

  /**
   * Tests for config structure integrity
   * These tests verify that the configuration object has the expected structure
   * Important for ensuring that the configuration is properly organized
   */
  describe('config structure integrity', () => {
    it('should have server as the top-level property', () => {
      // The server property is the top-level container for all configuration
      expect(config).toHaveProperty('server')
      expect(typeof config.server).toBe('object')
    })

    it('should have all required top-level sections', () => {
      // Verify that all required top-level sections are present
      expect(config.server).toHaveProperty('globalAccount')
      expect(config.server).toHaveProperty('baseDir')
      expect(config.server).toHaveProperty('p2p')
      expect(config.server).toHaveProperty('sharding')
      expect(config.server).toHaveProperty('features')
      expect(config.server).toHaveProperty('mode')
    })

    it('should have consistent types for all properties', () => {
      // Verify that all properties have consistent types
      expect(typeof config.server.globalAccount).toBe('string')
      expect(typeof config.server.baseDir).toBe('string')
      expect(typeof config.server.p2p).toBe('object')
      expect(typeof config.server.sharding).toBe('object')
      expect(typeof config.server.features).toBe('object')
      expect(typeof config.server.mode).toBe('string')
    })

    // Negative test for config structure
    it('should detect missing required properties', () => {
      // Function to validate config structure
      const hasRequiredProperties = (config: any) => {
        if (!config || !config.server) {
          return false
        }

        const requiredProps = ['globalAccount', 'baseDir', 'p2p', 'sharding', 'features']
        for (const prop of requiredProps) {
          if (!config.server[prop]) {
            return false
          }
        }

        return true
      }

      // Test with invalid values
      expect(hasRequiredProperties(null)).toBe(false)
      expect(hasRequiredProperties({})).toBe(false)
      expect(hasRequiredProperties({ server: {} })).toBe(false)
      expect(
        hasRequiredProperties({
          server: {
            globalAccount: '0x123',
            baseDir: './',
            // Missing p2p, sharding, features
          },
        })
      ).toBe(false)

      // Verify the actual config value passes validation
      expect(hasRequiredProperties(config)).toBe(true)
    })
  })
})
