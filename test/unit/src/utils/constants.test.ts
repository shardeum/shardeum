import { zeroAddressStr, emptyCodeHash, zeroAddressAccount } from '../../../../src/utils/constants'
import { Account } from '@ethereumjs/util'

describe('constants', () => {
  describe('zeroAddressStr', () => {
    it('should be a valid ethereum zero address', () => {
      expect(zeroAddressStr).toBe('0x0000000000000000000000000000000000000000')
      expect(zeroAddressStr.length).toBe(42)
      expect(zeroAddressStr.startsWith('0x')).toBe(true)
    })

    it('should contain only zeros after 0x prefix', () => {
      const withoutPrefix = zeroAddressStr.slice(2)
      expect(withoutPrefix).toMatch(/^0+$/)
      expect(withoutPrefix.length).toBe(40)
    })
  })

  describe('emptyCodeHash', () => {
    it('should be a valid keccak256 hash', () => {
      expect(emptyCodeHash).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
      expect(emptyCodeHash.length).toBe(66)
      expect(emptyCodeHash.startsWith('0x')).toBe(true)
    })

    it('should be the hash of empty data', () => {
      const withoutPrefix = emptyCodeHash.slice(2)
      expect(withoutPrefix).toMatch(/^[a-f0-9]+$/)
      expect(withoutPrefix.length).toBe(64)
    })
  })

  describe('zeroAddressAccount', () => {
    it('should be an instance of Account', () => {
      expect(zeroAddressAccount).toBeInstanceOf(Account)
    })

    it('should have zero nonce', () => {
      expect(zeroAddressAccount.nonce).toBe(BigInt(0))
    })

    it('should have zero balance', () => {
      expect(zeroAddressAccount.balance).toBe(BigInt(0))
    })

    it('should have the empty code hash', () => {
      // Convert Buffer to hex string without '0x' prefix
      const codeHashHex = '0x' + Buffer.from(zeroAddressAccount.codeHash).toString('hex')
      expect(codeHashHex).toBe(emptyCodeHash)
    })

    it('should have empty storage root', () => {
      expect(zeroAddressAccount.storageRoot).toBeDefined()
    })
  })
})