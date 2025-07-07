import { FilePaths } from '../../../../src/shardeum/shardeumFlags'

// Mock fs module
jest.mock('fs')

// Mock lib-types
jest.mock('@shardeum-foundation/lib-types')

describe('versions', () => {
  let mockReadFileSync: jest.Mock
  let mockSafeJsonParse: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear the module cache to ensure fresh imports
    jest.resetModules()
    
    // Set up mocks
    mockReadFileSync = jest.fn()
    mockSafeJsonParse = jest.fn((data) => JSON.parse(data))
    
    // Apply mocks
    jest.doMock('fs', () => ({
      readFileSync: mockReadFileSync
    }))
    
    jest.doMock('@shardeum-foundation/lib-types', () => ({
      Utils: {
        safeJsonParse: mockSafeJsonParse
      }
    }))
  })

  describe('readOperatorVersions', () => {
    it('should read both CLI and GUI versions successfully', () => {
      const mockCLIPackage = JSON.stringify({ version: '1.2.3' })
      const mockGUIPackage = JSON.stringify({ version: '4.5.6' })
      
      mockReadFileSync.mockImplementation((path) => {
        if (path === FilePaths.CLI_PACKAGE) return Buffer.from(mockCLIPackage)
        if (path === FilePaths.GUI_PACKAGE) return Buffer.from(mockGUIPackage)
        throw new Error(`Unexpected path: ${path}`)
      })

      // Import the function after mocks are set up
      const { readOperatorVersions } = require('../../../../src/utils/versions')
      const result = readOperatorVersions()
      
      expect(result).toEqual({
        operatorCLIVersion: '1.2.3',
        operatorGUIVersion: '4.5.6'
      })
      
      expect(mockReadFileSync).toHaveBeenCalledTimes(2)
      expect(mockReadFileSync).toHaveBeenCalledWith(FilePaths.CLI_PACKAGE)
      expect(mockReadFileSync).toHaveBeenCalledWith(FilePaths.GUI_PACKAGE)
    })

    it('should return empty string for CLI version when file read fails', () => {
      mockReadFileSync.mockImplementation((path) => {
        if (path === FilePaths.CLI_PACKAGE) throw new Error('File not found')
        if (path === FilePaths.GUI_PACKAGE) return Buffer.from(JSON.stringify({ version: '4.5.6' }))
        throw new Error('Unexpected path')
      })

      const { readOperatorVersions } = require('../../../../src/utils/versions')
      const result = readOperatorVersions()
      
      expect(result).toEqual({
        operatorCLIVersion: '',
        operatorGUIVersion: '4.5.6'
      })
    })

    it('should return empty string for GUI version when file read fails', () => {
      mockReadFileSync.mockImplementation((path) => {
        if (path === FilePaths.CLI_PACKAGE) return Buffer.from(JSON.stringify({ version: '1.2.3' }))
        if (path === FilePaths.GUI_PACKAGE) throw new Error('File not found')
        throw new Error('Unexpected path')
      })

      const { readOperatorVersions } = require('../../../../src/utils/versions')
      const result = readOperatorVersions()
      
      expect(result).toEqual({
        operatorCLIVersion: '1.2.3',
        operatorGUIVersion: ''
      })
    })

    it('should return empty strings for both versions when both files fail', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      const { readOperatorVersions } = require('../../../../src/utils/versions')
      const result = readOperatorVersions()
      
      expect(result).toEqual({
        operatorCLIVersion: '',
        operatorGUIVersion: ''
      })
    })

    it('should handle malformed JSON in CLI package', () => {
      mockSafeJsonParse.mockImplementation((data) => {
        if (data === 'invalid json') throw new Error('Invalid JSON')
        return JSON.parse(data)
      })
      
      mockReadFileSync.mockImplementation((path) => {
        if (path === FilePaths.CLI_PACKAGE) return Buffer.from('invalid json')
        if (path === FilePaths.GUI_PACKAGE) return Buffer.from(JSON.stringify({ version: '4.5.6' }))
        throw new Error('Unexpected path')
      })

      const { readOperatorVersions } = require('../../../../src/utils/versions')
      const result = readOperatorVersions()
      
      expect(result).toEqual({
        operatorCLIVersion: '',
        operatorGUIVersion: '4.5.6'
      })
    })

    it('should handle missing version property in package.json', () => {
      mockReadFileSync.mockImplementation((path) => {
        if (path === FilePaths.CLI_PACKAGE) return Buffer.from(JSON.stringify({ name: 'cli' }))
        if (path === FilePaths.GUI_PACKAGE) return Buffer.from(JSON.stringify({ name: 'gui' }))
        throw new Error('Unexpected path')
      })

      const { readOperatorVersions } = require('../../../../src/utils/versions')
      const result = readOperatorVersions()
      
      expect(result).toEqual({
        operatorCLIVersion: '',
        operatorGUIVersion: ''
      })
    })
  })
})