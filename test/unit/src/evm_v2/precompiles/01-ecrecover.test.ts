import { 
  bytesToHex, 
  hexToBytes, 
  setLengthLeft,
  setLengthRight,
  bigIntToBytes,
  bytesToBigInt,
  publicToAddress,
  ecsign,
  privateToPublic,
  hashPersonalMessage
} from '@ethereumjs/util'
import { precompile01 } from '../../../../../src/evm_v2/precompiles/01-ecrecover'
import { OOGResult } from '../../../../../src/evm_v2/evm'
import type { PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { Common } from '@ethereumjs/common'

describe('ECRECOVER (0x01) Precompile', () => {
  let mockCommon: jest.Mocked<Common>
  let mockDebug: jest.Mock
  let baseInput: PrecompileInput

  beforeEach(() => {
    mockCommon = {
      param: jest.fn().mockReturnValue(BigInt(3000)),
    } as any

    mockDebug = jest.fn()

    baseInput = {
      data: new Uint8Array(),
      gasLimit: BigInt(10000),
      common: mockCommon,
      _EVM: {} as any,
      _debug: mockDebug,
    }
  })

  describe('Gas Usage', () => {
    it('should return OOG when gas limit is less than required', () => {
      const input: PrecompileInput = {
        ...baseInput,
        gasLimit: BigInt(2999),
      }

      const result = precompile01(input)

      expect(result).toEqual(OOGResult(BigInt(2999)))
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('ECRECOVER (0x01) failed: OOG')
      )
    })

    it('should consume correct amount of gas on successful execution', () => {
      const input: PrecompileInput = {
        ...baseInput,
        gasLimit: BigInt(5000),
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
    })
  })

  describe('Input Validation', () => {
    it('should pad input data to 128 bytes', () => {
      const shortData = new Uint8Array(50)
      const input: PrecompileInput = {
        ...baseInput,
        data: shortData,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      expect(result.returnValue).toBeInstanceOf(Uint8Array)
    })

    it('should reject v values other than 27 or 28', () => {
      const data = new Uint8Array(128)
      // Set v to 26
      data.set(setLengthLeft(bigIntToBytes(BigInt(26)), 32), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      expect(result.returnValue).toHaveLength(0)
      expect(mockDebug).toHaveBeenCalledWith(
        'ECRECOVER (0x01) failed: v neither 27 nor 28'
      )
    })

    it('should reject v = 0', () => {
      const data = new Uint8Array(128)
      // v = 0
      data.set(setLengthLeft(bigIntToBytes(BigInt(0)), 32), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.returnValue).toHaveLength(0)
    })

    it('should reject v = 1', () => {
      const data = new Uint8Array(128)
      // v = 1
      data.set(setLengthLeft(bigIntToBytes(BigInt(1)), 32), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.returnValue).toHaveLength(0)
    })
  })

  describe('Successful Recovery', () => {
    it('should recover correct address from valid signature', () => {
      // Test with known signature
      const privateKey = hexToBytes('0x4646464646464646464646464646464646464646464646464646464646464646')
      const publicKey = privateToPublic(privateKey)
      const address = publicToAddress(publicKey)
      
      const message = Buffer.from('Hello World')
      const msgHash = hashPersonalMessage(message)
      
      const signature = ecsign(msgHash, privateKey)
      
      // Prepare input data: msgHash (32) + v (32) + r (32) + s (32) = 128 bytes
      const data = new Uint8Array(128)
      data.set(msgHash, 0)
      data.set(setLengthLeft(bigIntToBytes(signature.v), 32), 32)
      data.set(setLengthLeft(signature.r, 32), 64)
      data.set(setLengthLeft(signature.s, 32), 96)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      expect(result.returnValue).toHaveLength(32)
      
      // The returned address should be padded to 32 bytes
      const recoveredAddress = result.returnValue.subarray(12)
      expect(bytesToHex(recoveredAddress)).toBe(bytesToHex(address))
    })

    it('should handle v = 27', () => {
      const data = new Uint8Array(128)
      // Create a valid signature structure with v = 27
      const msgHash = hexToBytes('0x3c69398f826c7d633730d0d9fa8b83f5d1781c934693834f8b6628d48f03aa8f')
      const v = BigInt(27)
      const r = hexToBytes('0x8ddb8d76097290e95b0e0ec093a88d8c685e91088ac419e0cbae217ed8540e23')
      const s = hexToBytes('0x4182194ef3c2a81166576e0b49e2bad96683183c82a96b1962b3e2a672d21801')

      data.set(msgHash, 0)
      data.set(setLengthLeft(bigIntToBytes(v), 32), 32)
      data.set(setLengthLeft(r, 32), 64)
      data.set(setLengthLeft(s, 32), 96)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      expect(result.returnValue).toHaveLength(32)
    })

    it('should handle v = 28', () => {
      const data = new Uint8Array(128)
      // Create a valid signature structure with v = 28
      const msgHash = hexToBytes('0x3c69398f826c7d633730d0d9fa8b83f5d1781c934693834f8b6628d48f03aa8f')
      const v = BigInt(28)
      const r = hexToBytes('0x8ddb8d76097290e95b0e0ec093a88d8c685e91088ac419e0cbae217ed8540e23')
      const s = hexToBytes('0x4182194ef3c2a81166576e0b49e2bad96683183c82a96b1962b3e2a672d21801')

      data.set(msgHash, 0)
      data.set(setLengthLeft(bigIntToBytes(v), 32), 32)
      data.set(setLengthLeft(r, 32), 64)
      data.set(setLengthLeft(s, 32), 96)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      expect(result.returnValue).toHaveLength(32)
    })
  })

  describe('Failed Recovery', () => {
    it('should return empty when recovery fails due to invalid signature', () => {
      const data = new Uint8Array(128)
      // Invalid signature data - all zeros except v
      data.set(setLengthLeft(bigIntToBytes(BigInt(27)), 32), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      expect(result.returnValue).toHaveLength(0)
      expect(mockDebug).toHaveBeenCalledWith(
        'ECRECOVER (0x01) failed: PK recovery failed'
      )
    })

    it('should handle malformed r value', () => {
      const data = new Uint8Array(128)
      const msgHash = hexToBytes('0x3c69398f826c7d633730d0d9fa8b83f5d1781c934693834f8b6628d48f03aa8f')
      const v = BigInt(27)
      // r value that's too large (> curve order)
      const r = hexToBytes('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141')
      const s = hexToBytes('0x4182194ef3c2a81166576e0b49e2bad96683183c82a96b1962b3e2a672d21801')

      data.set(msgHash, 0)
      data.set(setLengthLeft(bigIntToBytes(v), 32), 32)
      data.set(setLengthLeft(r, 32), 64)
      data.set(setLengthLeft(s, 32), 96)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      expect(result.returnValue).toHaveLength(0)
    })

    it('should handle malformed s value', () => {
      const data = new Uint8Array(128)
      const msgHash = hexToBytes('0x3c69398f826c7d633730d0d9fa8b83f5d1781c934693834f8b6628d48f03aa8f')
      const v = BigInt(27)
      const r = hexToBytes('0x8ddb8d76097290e95b0e0ec093a88d8c685e91088ac419e0cbae217ed8540e23')
      // s value that's too large (> curve order)
      const s = hexToBytes('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141')

      data.set(msgHash, 0)
      data.set(setLengthLeft(bigIntToBytes(v), 32), 32)
      data.set(setLengthLeft(r, 32), 64)
      data.set(setLengthLeft(s, 32), 96)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      expect(result.returnValue).toHaveLength(0)
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information when debug is enabled', () => {
      const data = new Uint8Array(128)
      data.set(setLengthLeft(bigIntToBytes(BigInt(27)), 32), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      precompile01(input)

      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run ECRECOVER (0x01) precompile')
      )
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('ECRECOVER (0x01): PK recovery with msgHash=')
      )
    })

    it('should work without debug function', () => {
      const data = new Uint8Array(128)
      data.set(setLengthLeft(bigIntToBytes(BigInt(27)), 32), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
        _debug: undefined,
      }

      const result = precompile01(input)

      expect(result).toBeDefined()
      expect(result.executionGasUsed).toBe(BigInt(3000))
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input data', () => {
      const input: PrecompileInput = {
        ...baseInput,
        data: new Uint8Array(),
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      expect(result.returnValue).toHaveLength(0)
    })

    it('should handle oversized input data', () => {
      const data = new Uint8Array(256)
      // Fill with valid v value
      data.set(setLengthLeft(bigIntToBytes(BigInt(27)), 32), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
      // Should only use first 128 bytes
    })

    it('should handle exactly 128 bytes of input', () => {
      const data = new Uint8Array(128)
      data.set(setLengthLeft(bigIntToBytes(BigInt(27)), 32), 32)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = precompile01(input)

      expect(result.executionGasUsed).toBe(BigInt(3000))
    })
  })

  describe('Gas Price Configuration', () => {
    it('should use gas price from common configuration', () => {
      mockCommon.param.mockReturnValue(BigInt(5000))

      const input: PrecompileInput = {
        ...baseInput,
        gasLimit: BigInt(6000),
      }

      const result = precompile01(input)

      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'ecRecover')
      expect(result.executionGasUsed).toBe(BigInt(5000))
    })
  })
})