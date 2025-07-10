import { Message, MessageWithTo } from '../../../../src/evm_v2/message'
import { Address } from '@ethereumjs/util'

// Helper to avoid BigInt literal syntax issues
const n = (value: number | string): bigint => BigInt(value)

// Mock Address
jest.mock('@ethereumjs/util', () => ({
  Address: {
    zero: jest.fn(() => ({
      toString: () => '0x0000000000000000000000000000000000000000',
      equals: (other: any) => false
    }))
  }
}))

describe('Message', () => {
  const mockAddress = {
    toString: () => '0x1234567890123456789012345678901234567890',
    equals: (other: any) => false
  } as unknown as Address

  const mockPrecompile = jest.fn()

  describe('constructor', () => {
    it('should create message with required gasLimit only', () => {
      const message = new Message({ gasLimit: n(1000) })
      
      expect(message.gasLimit).toBe(n(1000))
      expect(message.value).toBe(n(0))
      expect(message.depth).toBe(0)
      expect(message.isStatic).toBe(false)
      expect(message.isCompiled).toBe(false)
      expect(message.delegatecall).toBe(false)
      expect(message.gasRefund).toBe(n(0))
      expect(message.data.length).toBe(0)
    })

    it('should create message with all optional parameters', () => {
      const data = new Uint8Array([1, 2, 3])
      const code = new Uint8Array([4, 5, 6])
      const salt = new Uint8Array([7, 8, 9])
      const versionedHashes = [new Uint8Array([10, 11, 12])]
      const selfdestruct = new Set(['address1'])
      const createdAddresses = new Set(['address2'])

      const message = new Message({
        to: mockAddress,
        value: n(100),
        caller: mockAddress,
        gasLimit: n(1000),
        data,
        depth: 5,
        code,
        codeAddress: mockAddress,
        isStatic: true,
        isCompiled: true,
        salt,
        selfdestruct,
        createdAddresses,
        delegatecall: true,
        authcallOrigin: mockAddress,
        gasRefund: n(50),
        versionedHashes
      })

      expect(message.to).toBe(mockAddress)
      expect(message.value).toBe(n(100))
      expect(message.caller).toBe(mockAddress)
      expect(message.gasLimit).toBe(n(1000))
      expect(message.data).toBe(data)
      expect(message.depth).toBe(5)
      expect(message.code).toBe(code)
      expect(message._codeAddress).toBe(mockAddress)
      expect(message.isStatic).toBe(true)
      expect(message.isCompiled).toBe(true)
      expect(message.salt).toBe(salt)
      expect(message.selfdestruct).toBe(selfdestruct)
      expect(message.createdAddresses).toBe(createdAddresses)
      expect(message.delegatecall).toBe(true)
      expect(message.authcallOrigin).toBe(mockAddress)
      expect(message.gasRefund).toBe(n(50))
      expect(message.versionedHashes).toBe(versionedHashes)
    })

    it('should use default values when optional parameters are not provided', () => {
      const message = new Message({ gasLimit: n(1000) })

      expect(message.value).toBe(n(0))
      expect(message.caller.toString()).toContain('0000000000000000000000000000000000000000')
      expect(message.data).toEqual(new Uint8Array(0))
      expect(message.depth).toBe(0)
      expect(message.isStatic).toBe(false)
      expect(message.isCompiled).toBe(false)
      expect(message.delegatecall).toBe(false)
      expect(message.gasRefund).toBe(n(0))
    })

    it('should throw error for negative value', () => {
      expect(() => {
        new Message({ gasLimit: n(1000), value: n(-100) })
      }).toThrow('value field cannot be negative, received -100')
    })

    it('should accept zero value', () => {
      const message = new Message({ gasLimit: n(1000), value: n(0) })
      expect(message.value).toBe(n(0))
    })

    it('should handle precompile function as code', () => {
      const message = new Message({
        gasLimit: n(1000),
        code: mockPrecompile
      })
      
      expect(message.code).toBe(mockPrecompile)
      expect(typeof message.code).toBe('function')
    })
  })

  describe('codeAddress getter', () => {
    it('should return _codeAddress when defined', () => {
      const codeAddr = {
        toString: () => '0xCODEADDRESS',
        equals: (other: any) => false
      } as unknown as Address

      const message = new Message({
        gasLimit: n(1000),
        codeAddress: codeAddr
      })

      expect(message.codeAddress).toBe(codeAddr)
    })

    it('should return to address when _codeAddress is undefined', () => {
      const toAddr = {
        toString: () => '0xTOADDRESS',
        equals: (other: any) => false
      } as unknown as Address

      const message = new Message({
        gasLimit: n(1000),
        to: toAddr
      })

      expect(message.codeAddress).toBe(toAddr)
    })

    it('should prefer _codeAddress over to when both are defined', () => {
      const codeAddr = {
        toString: () => '0xCODEADDRESS',
        equals: (other: any) => false
      } as unknown as Address
      
      const toAddr = {
        toString: () => '0xTOADDRESS',
        equals: (other: any) => false
      } as unknown as Address

      const message = new Message({
        gasLimit: n(1000),
        to: toAddr,
        codeAddress: codeAddr
      })

      expect(message.codeAddress).toBe(codeAddr)
    })

    it('should throw error when neither _codeAddress nor to is defined', () => {
      const message = new Message({ gasLimit: n(1000) })

      expect(() => {
        message.codeAddress
      }).toThrow('Missing codeAddress')
    })
  })

  describe('edge cases', () => {
    it('should handle very large gas limits', () => {
      const largeGas = BigInt(2) ** BigInt(256) - BigInt(1)
      const message = new Message({ gasLimit: largeGas })
      expect(message.gasLimit).toBe(largeGas)
    })

    it('should handle empty data arrays', () => {
      const message = new Message({
        gasLimit: n(1000),
        data: new Uint8Array(0)
      })
      expect(message.data.length).toBe(0)
    })

    it('should handle large data arrays', () => {
      const largeData = new Uint8Array(10000).fill(42)
      const message = new Message({
        gasLimit: n(1000),
        data: largeData
      })
      expect(message.data).toBe(largeData)
      expect(message.data.length).toBe(10000)
    })

    it('should handle multiple versioned hashes', () => {
      const hashes = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        new Uint8Array([7, 8, 9])
      ]
      const message = new Message({
        gasLimit: n(1000),
        versionedHashes: hashes
      })
      expect(message.versionedHashes).toBe(hashes)
      expect(message.versionedHashes!.length).toBe(3)
    })

    it('should handle large selfdestruct sets', () => {
      const addresses = new Set<string>()
      for (let i = 0; i < 1000; i++) {
        addresses.add(`address${i}`)
      }
      
      const message = new Message({
        gasLimit: n(1000),
        selfdestruct: addresses
      })
      
      expect(message.selfdestruct).toBe(addresses)
      expect(message.selfdestruct!.size).toBe(1000)
    })
  })

  describe('property modifications', () => {
    it('should allow property modifications after construction', () => {
      const message = new Message({ gasLimit: n(1000) })
      
      message.value = n(200)
      message.depth = 10
      message.isStatic = true
      
      expect(message.value).toBe(n(200))
      expect(message.depth).toBe(10)
      expect(message.isStatic).toBe(true)
    })

    it('should maintain containerCode property', () => {
      const message = new Message({ gasLimit: n(1000) })
      const containerCode = new Uint8Array([1, 2, 3, 4])
      
      message.containerCode = containerCode
      expect(message.containerCode).toBe(containerCode)
    })
  })

  describe('MessageWithTo type', () => {
    it('should ensure to property is required', () => {
      const messageWithTo: MessageWithTo = new Message({
        gasLimit: n(1000),
        to: mockAddress
      }) as MessageWithTo

      expect(messageWithTo.to).toBeDefined()
      expect(messageWithTo.to).toBe(mockAddress)
    })
  })

  describe('complex scenarios', () => {
    it('should handle CREATE2 message setup', () => {
      const salt = new Uint8Array(32).fill(0)
      const initCode = new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xf3])
      
      const message = new Message({
        gasLimit: n(100000),
        value: n(0),
        data: initCode,
        salt,
        depth: 1
      })
      
      expect(message.salt).toBe(salt)
      expect(message.data).toBe(initCode)
    })

    it('should handle DELEGATECALL message setup', () => {
      const message = new Message({
        gasLimit: n(50000),
        caller: mockAddress,
        to: mockAddress,
        delegatecall: true,
        value: n(0) // DELEGATECALL doesn't transfer value
      })
      
      expect(message.delegatecall).toBe(true)
      expect(message.value).toBe(n(0))
    })

    it('should handle AUTHCALL message setup', () => {
      const authOrigin = {
        toString: () => '0xAUTH',
        equals: (other: any) => false
      } as unknown as Address

      const message = new Message({
        gasLimit: n(50000),
        authcallOrigin: authOrigin,
        value: n(100)
      })
      
      expect(message.authcallOrigin).toBe(authOrigin)
    })

    it('should handle precompile call setup', () => {
      const precompileAddr = {
        toString: () => '0x0000000000000000000000000000000000000001',
        equals: (other: any) => false
      } as unknown as Address

      const message = new Message({
        gasLimit: n(3000),
        to: precompileAddr,
        code: mockPrecompile,
        isCompiled: true,
        data: new Uint8Array(128) // ecrecover input
      })
      
      expect(message.isCompiled).toBe(true)
      expect(message.code).toBe(mockPrecompile)
    })
  })
})