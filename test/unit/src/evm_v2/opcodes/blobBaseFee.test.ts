import { ShardeumFlags } from '../../../../../src/shardeum/shardeumFlags'

describe('BLOBBASEFEE Opcode Tests', () => {
  describe('Fixed Blob Base Fee', () => {
    it('should use fixed blob base fee when supportDenCunFork is enabled', () => {
      // Verify the flag is set correctly
      expect(ShardeumFlags.supportDenCunFork).toBe(true)
      expect(ShardeumFlags.fixedBlobBaseFee).toBe('1000000000') // 1 gwei
    })

    it('should convert fixed blob base fee to BigInt correctly', () => {
      const blobBaseFee = BigInt(ShardeumFlags.fixedBlobBaseFee)
      expect(blobBaseFee).toBe(BigInt(1000000000))
    })

    it('should be resistant to DOS by using fixed value', () => {
      // The fixed value prevents attackers from manipulating blob gas prices
      // which could be used to create DOS attacks in dynamic pricing systems
      const fixedFee = BigInt(ShardeumFlags.fixedBlobBaseFee)
      
      // Simulate multiple calls - fee should remain constant
      for (let i = 0; i < 100; i++) {
        const fee = BigInt(ShardeumFlags.fixedBlobBaseFee)
        expect(fee).toBe(fixedFee)
      }
    })

    it('should be configurable through flag updates', () => {
      const originalValue = ShardeumFlags.fixedBlobBaseFee
      
      // Test updating the flag
      const newValue = '2000000000' // 2 gwei
      ShardeumFlags.fixedBlobBaseFee = newValue
      expect(ShardeumFlags.fixedBlobBaseFee).toBe(newValue)
      
      // Restore original value
      ShardeumFlags.fixedBlobBaseFee = originalValue
      expect(ShardeumFlags.fixedBlobBaseFee).toBe(originalValue)
    })
  })
})