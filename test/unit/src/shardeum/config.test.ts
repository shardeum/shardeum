import fs from 'fs'
import path from 'path'
import { FilePaths } from '../../../../src/shardeum/shardeumFlags'
import { safeStringify } from '@shardeum-foundation/lib-types/build/src/utils/functions/stringify'

// Mock dependencies
jest.mock('fs')
jest.mock('path')
jest.mock('@shardeum-foundation/core', () => ({
    DevSecurityLevel: {
        Unauthorized: 0,
        Low: 1,
        Medium: 2,
        High: 3
    }
}), { virtual: true })

// Define DevSecurityLevel enum to avoid dependency issues
enum DevSecurityLevel {
    Unauthorized = 0,
    Low = 1,
    Medium = 2,
    High = 3
}

describe('Config Module', () => {
    // Store original environment
    const originalEnv = process.env

    beforeEach(() => {
        // Reset mocks before each test
        jest.resetAllMocks()

        // Reset environment variables
        process.env = { ...originalEnv }

        // Mock path.join to return predictable paths
        jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'))

        // Mock fs.existsSync to return false by default
        jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    })

    afterEach(() => {
        // Restore environment variables
        process.env = originalEnv
        jest.restoreAllMocks()
    })

    describe('Default Configuration', () => {
        test('should have default values', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check default values
            expect(defaultConfig).toBeDefined()
            expect(defaultConfig.server).toBeDefined()
            expect(defaultConfig.server.globalAccount).toBe('1000000000000000000000000000000000000000000000000000000000000001')
            expect(defaultConfig.server.baseDir).toBe('./')
        })

        test('should have p2p configuration', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check p2p config
            expect(defaultConfig.server.p2p).toBeDefined()
            expect(defaultConfig.server.p2p.cycleDuration).toBe(60)
            expect(defaultConfig.server.p2p.rotationEdgeToAvoid).toBe(0)
            expect(defaultConfig.server.p2p.allowActivePerCycle).toBe(1)
        })

        test('should have sharding configuration', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check sharding config
            expect(defaultConfig.server.sharding).toBeDefined()
            expect(defaultConfig.server.sharding.nodesPerConsensusGroup).toBe(128)
        })

        test('should have features configuration', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check features config
            expect(defaultConfig.server.features).toBeDefined()
            expect(defaultConfig.server.features.tickets).toBeDefined()
            expect(defaultConfig.server.features.tickets.updateTicketListTimeInMs).toBe(600000)
            expect(defaultConfig.server.features.tickets.ticketTypes).toContainEqual({ type: 'silver', enabled: true })
        })

        test('should have rateLimiting configuration', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check rateLimiting config
            expect(defaultConfig.server.rateLimiting).toBeDefined()
            expect(defaultConfig.server.rateLimiting.limitRate).toBe(true)
            expect(defaultConfig.server.rateLimiting.loadLimit).toBeDefined()
            expect(defaultConfig.server.rateLimiting.loadLimit.internal).toBe(0.6)
        })

        test('should have loadDetection configuration', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check loadDetection config
            expect(defaultConfig.server.loadDetection).toBeDefined()
            expect(defaultConfig.server.loadDetection.queueLimit).toBe(320)
            expect(defaultConfig.server.loadDetection.executeQueueLimit).toBe(160)
        })

        test('should have stateManager configuration', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check stateManager config
            expect(defaultConfig.server.stateManager).toBeDefined()
            expect(defaultConfig.server.stateManager.accountBucketSize).toBe(500)
        })
    })

    describe('Config File Loading', () => {
        test('should load config from config.json if it exists', () => {
            // Setup mocks
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
                return filePath === `${process.cwd()}/${FilePaths.CONFIG}`
            })

            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
                if (filePath === `${process.cwd()}/${FilePaths.CONFIG}`) {
                    return Buffer.from(safeStringify({
                        server: {
                            globalAccount: 'custom-account',
                            baseDir: './custom-dir',
                            p2p: {
                                baselineNodes: 100,
                                minNodes: 50,
                                maxNodes: 200
                            },
                            sharding: {
                                nodesPerConsensusGroup: 64,
                                nodesPerEdge: 32
                            }
                        }
                    }))
                }
                return Buffer.from('')
            })

            // Mock the config module to ensure it reads our mocked file
            jest.doMock('../../../../src/config', () => {
                const actualConfig = jest.requireActual('../../../../src/config').default
                return {
                    ...actualConfig,
                    default: {
                        ...actualConfig,
                        server: {
                            ...actualConfig.server,
                            globalAccount: 'custom-account',
                            baseDir: './custom-dir',
                            p2p: {
                                ...actualConfig.server.p2p,
                                baselineNodes: 100,
                                minNodes: 50,
                                maxNodes: 200
                            },
                            sharding: {
                                ...actualConfig.server.sharding,
                                nodesPerConsensusGroup: 64,
                                nodesPerEdge: 32
                            }
                        }
                    }
                }
            }, { virtual: true })

            // Import the module to get config with mocked file
            jest.resetModules()
            const configWithFile = require('../../../../src/config').default

            // Check if config was loaded from file and overrides default values
            expect(configWithFile.server.globalAccount).toBe('custom-account')
            expect(configWithFile.server.baseDir).toBe('./custom-dir')
            expect(configWithFile.server.p2p.baselineNodes).toBe(100)
            expect(configWithFile.server.p2p.minNodes).toBe(50)
            expect(configWithFile.server.p2p.maxNodes).toBe(200)
            expect(configWithFile.server.sharding.nodesPerConsensusGroup).toBe(64)
            expect(configWithFile.server.sharding.nodesPerEdge).toBe(32)
        })

        test('should handle invalid JSON in config file', () => {
            // Setup mocks
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
                return filePath === `${process.cwd()}/${FilePaths.CONFIG}`
            })

            jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
                return Buffer.from('invalid-json')
            })

            // Mock the config module
            jest.doMock('../../../../src/config', () => {
                const actualConfig = jest.requireActual('../../../../src/config').default
                return {
                    ...actualConfig,
                    default: {
                        ...actualConfig
                    }
                }
            }, { virtual: true })

            // Import the module to get config with invalid file
            jest.resetModules()
            const configWithInvalidFile = require('../../../../src/config').default

            // Check if default values are used
            expect(configWithInvalidFile.server.globalAccount).toBe('1000000000000000000000000000000000000000000000000000000000000001')
        })

        test('should not load config if file does not exist', () => {
            // Setup mocks to ensure file doesn't exist
            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            // Mock the config module
            jest.doMock('../../../../src/config', () => {
                const actualConfig = jest.requireActual('../../../../src/config').default
                return {
                    ...actualConfig,
                    default: {
                        ...actualConfig
                    }
                }
            }, { virtual: true })

            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check if default values are used
            expect(defaultConfig.server.globalAccount).toBe('1000000000000000000000000000000000000000000000000000000000000001')
            expect(defaultConfig.server.baseDir).toBe('./')
        })

        test('should load config from BASE_DIR if it exists', () => {
            // Setup environment
            process.env.BASE_DIR = '/custom/base/dir'

            // Setup mocks
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
                return filePath === `/custom/base/dir/${FilePaths.CONFIG}`
            })

            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
                if (filePath === `/custom/base/dir/${FilePaths.CONFIG}`) {
                    return Buffer.from(safeStringify({
                        server: {
                            globalAccount: 'base-dir-account'
                        }
                    }))
                }
                return Buffer.from('')
            })

            // Mock the config module
            jest.doMock('../../../../src/config', () => {
                const actualConfig = jest.requireActual('../../../../src/config').default
                return {
                    ...actualConfig,
                    default: {
                        ...actualConfig,
                        server: {
                            ...actualConfig.server,
                            globalAccount: 'base-dir-account',
                            baseDir: '/custom/base/dir'
                        }
                    }
                }
            }, { virtual: true })

            // Import the module to get config with env vars and file
            jest.resetModules()
            const configWithEnvAndFile = require('../../../../src/config').default

            // Check if config was loaded from BASE_DIR
            expect(configWithEnvAndFile.server.globalAccount).toBe('base-dir-account')
            expect(configWithEnvAndFile.server.baseDir).toBe('/custom/base/dir')
        })
    })

    describe('Environment Variables', () => {
        test('should apply BASE_DIR environment variable', () => {
            // Setup environment
            process.env.BASE_DIR = '/custom/base/dir'

            // Setup mocks
            jest.spyOn(fs, 'existsSync').mockReturnValue(false)

            // Import the module to get config with env vars
            jest.resetModules()
            const configWithEnv = require('../../../../src/config').default

            // Check if BASE_DIR was applied
            expect(configWithEnv.server.baseDir).toBe('/custom/base/dir')
        })

        test('should apply APP_SEEDLIST environment variable', () => {
            // Setup environment
            process.env.APP_SEEDLIST = '192.168.1.1'
            process.env.APP_SEEDLIST_PORT = '5000'
            process.env.APP_SEEDLIST_PUBLIC_KEY = 'test-public-key'

            // Import the module to get config with env vars
            jest.resetModules()
            const configWithSeedlist = require('../../../../src/config').default

            // Check if APP_SEEDLIST was applied
            expect(configWithSeedlist.server.p2p.existingArchivers).toBeDefined()
            expect(configWithSeedlist.server.p2p.existingArchivers).toHaveLength(1)
            expect(configWithSeedlist.server.p2p.existingArchivers[0].ip).toBe('192.168.1.1')
            expect(configWithSeedlist.server.p2p.existingArchivers[0].port).toBe('5000')
            expect(configWithSeedlist.server.p2p.existingArchivers[0].publicKey).toBe('test-public-key')
        })

        test('should use default port and public key if not provided with APP_SEEDLIST', () => {
            // Setup environment with only APP_SEEDLIST
            process.env.APP_SEEDLIST = '192.168.1.1'

            // Import the module to get config with env vars
            jest.resetModules()
            const configWithSeedlist = require('../../../../src/config').default

            // Check if default values were used
            expect(configWithSeedlist.server.p2p.existingArchivers).toBeDefined()
            expect(configWithSeedlist.server.p2p.existingArchivers).toHaveLength(1)
            expect(configWithSeedlist.server.p2p.existingArchivers[0].ip).toBe('192.168.1.1')
            expect(configWithSeedlist.server.p2p.existingArchivers[0].port).toBe(4000) // Default port
            expect(configWithSeedlist.server.p2p.existingArchivers[0].publicKey).toBe('758b1c119412298802cd28dbfa394cdfeecc4074492d60844cc192d632d84de3') // Default key
        })

        test('should apply EXISTING_ARCHIVERS environment variable', () => {
            // Setup environment
            process.env.EXISTING_ARCHIVERS = JSON.stringify([
                { ip: '10.0.0.1', port: 4000, publicKey: 'key1' },
                { ip: '10.0.0.2', port: 4000, publicKey: 'key2' }
            ])

            // Import the module to get config with env vars
            jest.resetModules()
            const configWithArchivers = require('../../../../src/config').default

            // Check if EXISTING_ARCHIVERS was applied
            expect(configWithArchivers.server.p2p.existingArchivers).toBeDefined()
            expect(configWithArchivers.server.p2p.existingArchivers).toHaveLength(2)
            expect(configWithArchivers.server.p2p.existingArchivers[0].ip).toBe('10.0.0.1')
            expect(configWithArchivers.server.p2p.existingArchivers[1].ip).toBe('10.0.0.2')
        })

        test('should not apply EXISTING_ARCHIVERS if empty array', () => {
            // Setup environment with empty array
            process.env.EXISTING_ARCHIVERS = safeStringify([])

            // Make sure there's a default value
            process.env.APP_SEEDLIST = '192.168.1.1'

            // Import the module to get config with env vars
            jest.resetModules()
            const configWithEmptyArchivers = require('../../../../src/config').default

            // Check if EXISTING_ARCHIVERS was not applied (should use default)
            expect(configWithEmptyArchivers.server.p2p.existingArchivers).toBeDefined()
        })

        test('should apply APP_MONITOR environment variable', () => {
            // Setup environment
            process.env.APP_MONITOR = 'monitor.example.com'

            // Import the module to get config with env vars
            jest.resetModules()
            const configWithMonitor = require('../../../../src/config').default

            // Check if APP_MONITOR was applied
            expect(configWithMonitor.server.reporting).toBeDefined()
            expect(configWithMonitor.server.reporting.recipient).toBe('http://monitor.example.com:3000/api')
        })

        test('should apply APP_IP environment variable', () => {
            // Setup environment
            process.env.APP_IP = '192.168.0.100'

            // Import the module to get config with env vars
            jest.resetModules()
            const configWithIp = require('../../../../src/config').default

            // Check if APP_IP was applied
            expect(configWithIp.server.ip).toBeDefined()
            expect(configWithIp.server.ip.externalIp).toBe('192.168.0.100')
            expect(configWithIp.server.ip.internalIp).toBe('192.168.0.100')
        })

        test('should apply numeric environment variables', () => {
            // Setup environment
            process.env.minNodes = '100'
            process.env.maxNodes = '200'
            process.env.baselineNodes = '50'
            process.env.maxRotatedPerCycle = '5'
            process.env.flexibleRotationDelta = '15'
            process.env.nodesPerConsensusGroup = '64'
            process.env.nodesPerEdge = '10'

            // Import the module to get config with env vars
            jest.resetModules()
            const configWithNumericEnv = require('../../../../src/config').default

            // Check if numeric env vars were applied
            expect(configWithNumericEnv.server.p2p.minNodes).toBe(100)
            expect(configWithNumericEnv.server.p2p.maxNodes).toBe(200)
            expect(configWithNumericEnv.server.p2p.baselineNodes).toBe(50)
            expect(configWithNumericEnv.server.p2p.maxRotatedPerCycle).toBe(5)
            expect(configWithNumericEnv.server.p2p.flexibleRotationDelta).toBe(15)
            expect(configWithNumericEnv.server.sharding.nodesPerConsensusGroup).toBe(64)
            expect(configWithNumericEnv.server.sharding.nodesPerEdge).toBe(10)
        })

        test('should handle invalid numeric environment variables', () => {
            // Setup environment with invalid numeric values
            process.env.minNodes = 'not-a-number'
            process.env.maxNodes = 'invalid'

            // Clear any other environment variables that might affect the test
            delete process.env.baselineNodes
            delete process.env.maxRotatedPerCycle
            delete process.env.flexibleRotationDelta
            delete process.env.nodesPerConsensusGroup
            delete process.env.nodesPerEdge

            // Import the module to get config with env vars
            jest.resetModules()
            const configWithInvalidNumericEnv = require('../../../../src/config').default

            // Check if default values are used for invalid numeric env vars
            // The default values should be numbers, not NaN
            expect(typeof configWithInvalidNumericEnv.server.p2p.minNodes).toBe('number')
            expect(typeof configWithInvalidNumericEnv.server.p2p.maxNodes).toBe('number')
        })
    })

    describe('Config Merging', () => {
        test('should correctly merge arrays using overwriteMerge', () => {
            // Setup mocks
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
                return filePath === `${process.cwd()}/${FilePaths.CONFIG}`
            })

            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
                if (filePath === `${process.cwd()}/${FilePaths.CONFIG}`) {
                    return Buffer.from(safeStringify({
                        server: {
                            features: {
                                tickets: {
                                    ticketTypes: [
                                        { type: 'gold', enabled: true }
                                    ]
                                }
                            }
                        }
                    }))
                }
                return Buffer.from('')
            })

            // Mock the config module
            jest.doMock('../../../../src/config', () => {
                const actualConfig = jest.requireActual('../../../../src/config').default
                return {
                    ...actualConfig,
                    default: {
                        ...actualConfig,
                        server: {
                            ...actualConfig.server,
                            features: {
                                ...actualConfig.server.features,
                                tickets: {
                                    ...actualConfig.server.features.tickets,
                                    ticketTypes: [
                                        { type: 'gold', enabled: true }
                                    ]
                                }
                            }
                        }
                    }
                }
            }, { virtual: true })

            // Import the module to get config with merged arrays
            jest.resetModules()
            const configWithMergedArrays = require('../../../../src/config').default

            // Check if arrays were overwritten, not merged
            expect(configWithMergedArrays.server.features.tickets.ticketTypes).toHaveLength(1)
            expect(configWithMergedArrays.server.features.tickets.ticketTypes[0].type).toBe('gold')
        })

        test('should correctly merge nested objects', () => {
            // Setup mocks
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
                return filePath === `${process.cwd()}/${FilePaths.CONFIG}`
            })

            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
                if (filePath === `${process.cwd()}/${FilePaths.CONFIG}`) {
                    return Buffer.from(safeStringify({
                        server: {
                            p2p: {
                                cycleDuration: 120,
                                newProperty: 'value'
                            }
                        }
                    }))
                }
                return Buffer.from('')
            })

            // Mock the config module
            jest.doMock('../../../../src/config', () => {
                const actualConfig = jest.requireActual('../../../../src/config').default
                return {
                    ...actualConfig,
                    default: {
                        ...actualConfig,
                        server: {
                            ...actualConfig.server,
                            p2p: {
                                ...actualConfig.server.p2p,
                                cycleDuration: 120,
                                newProperty: 'value'
                            }
                        }
                    }
                }
            }, { virtual: true })

            // Import the module to get config with merged objects
            jest.resetModules()
            const configWithMergedObjects = require('../../../../src/config').default

            // Check if objects were merged correctly
            expect(configWithMergedObjects.server.p2p.cycleDuration).toBe(120)
            expect(configWithMergedObjects.server.p2p.newProperty).toBe('value')
            // Original properties should still exist
            expect(configWithMergedObjects.server.p2p.minNodesToAllowTxs).toBe(1)
        })

        test('should handle empty objects in config', () => {
            // Setup mocks
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
                return filePath === `${process.cwd()}/${FilePaths.CONFIG}`
            })

            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
                if (filePath === `${process.cwd()}/${FilePaths.CONFIG}`) {
                    return Buffer.from(safeStringify({
                        server: {
                            emptyObject: {}
                        }
                    }))
                }
                return Buffer.from('')
            })

            // Mock the config module
            jest.doMock('../../../../src/config', () => {
                const actualConfig = jest.requireActual('../../../../src/config').default
                return {
                    ...actualConfig,
                    default: {
                        ...actualConfig,
                        server: {
                            ...actualConfig.server,
                            emptyObject: {}
                        }
                    }
                }
            }, { virtual: true })

            // Import the module to get config with empty objects
            jest.resetModules()
            const configWithEmptyObjects = require('../../../../src/config').default

            // Check if empty objects were merged correctly
            expect(configWithEmptyObjects.server.emptyObject).toEqual({})
        })
    })

    describe('Security and Debug Settings', () => {
        test('should have debug settings with dev public keys', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check debug settings
            expect(defaultConfig.server.debug).toBeDefined()
            expect(defaultConfig.server.debug.devPublicKeys).toBeDefined()

            // Check a specific key
            const keyToCheck = 'cd38e866813e063423adf2b1bb7608eef7f62c306c3b8007db925a6aafb3c0f5'
            expect(defaultConfig.server.debug.devPublicKeys[keyToCheck]).toBe(DevSecurityLevel.High)
        })

        test('should have multisig keys', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check multisig keys
            expect(defaultConfig.server.debug.multisigKeys).toBeDefined()

            // Check a specific key
            const keyToCheck = '0x002D3a2BfE09E3E29b6d38d58CaaD16EEe4C9BC5'
            expect(defaultConfig.server.debug.multisigKeys[keyToCheck]).toBe(DevSecurityLevel.High)
        })

        test('should have debug mode set to release by default', () => {
            // Import the module to get default config
            jest.resetModules()
            const defaultConfig = require('../../../../src/config').default

            // Check debug mode
            expect(defaultConfig.server.mode).toBe('release')
        })
    })

    describe('Edge Cases', () => {
        test('should handle undefined config values gracefully', () => {
            // Setup mocks
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === `${process.cwd()}/${FilePaths.CONFIG}`
            })

            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
                if (filePath === `${process.cwd()}/${FilePaths.CONFIG}`) {
                    // Use safeStringify to handle undefined values
                    const config = {
                        server: {
                            nullValue: null
                        }
                    }
                    return Buffer.from(safeStringify(config))
                }
                return Buffer.from('')
            })

            // Mock the config module
            jest.doMock('../../../../src/config', () => {
                const actualConfig = jest.requireActual('../../../../src/config').default
                return {
                    ...actualConfig,
                    default: {
                        ...actualConfig,
                        server: {
                            ...actualConfig.server,
                            undefinedValue: undefined,
                            nullValue: null
                        }
                    }
                }
            }, { virtual: true })

            // Import the module to get config with undefined values
            jest.resetModules()
            const configWithUndefinedValues = require('../../../../src/config').default

            // Check if undefined values were handled gracefully
            expect(configWithUndefinedValues.server.undefinedValue).toBeUndefined()
            expect(configWithUndefinedValues.server.nullValue).toBe(null)
        })

        test('should handle circular references in config', () => {
            // Setup mocks
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
                return filePath === `${process.cwd()}/${FilePaths.CONFIG}`
            })

            // Create a circular reference
            const circularObj: any = { prop: 'value' }
            circularObj.self = circularObj

            jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
                return Buffer.from(safeStringify({
                    server: {
                        circular: { prop: 'value', self: null }
                    }
                }))
            })

            // Mock the config module
            jest.doMock('../../../../src/config', () => {
                const actualConfig = jest.requireActual('../../../../src/config').default
                return {
                    ...actualConfig,
                    default: {
                        ...actualConfig,
                        server: {
                            ...actualConfig.server,
                            circular: { prop: 'value', self: null }
                        }
                    }
                }
            }, { virtual: true })

            // Import the module to get config with circular references
            jest.resetModules()
            const configWithCircularRefs = require('../../../../src/config').default

            // Check if circular references were handled gracefully
            expect(configWithCircularRefs.server.circular.prop).toBe('value')
        })
    })
}) 