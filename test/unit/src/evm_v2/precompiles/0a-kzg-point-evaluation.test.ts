import { 
  bytesToHex, 
  concatBytes,
  bigIntToBytes,
  setLengthLeft,
  computeVersionedHash,
  kzg
} from '@ethereumjs/util'
import { precompile0a, BLS_MODULUS } from '../../../../../src/evm_v2/precompiles/0a-kzg-point-evaluation'
import { OOGResult } from '../../../../../src/evm_v2/evm'
import { ERROR, EvmError } from '../../../../../src/evm_v2/exceptions'
import type { PrecompileInput } from '../../../../../src/evm_v2/precompiles/types'
import type { Common } from '@ethereumjs/common'

// Mock the kzg module
jest.mock('@ethereumjs/util', () => {
  const actual = jest.requireActual('@ethereumjs/util')
  return {
    ...actual,
    kzg: {
      verifyKzgProof: jest.fn(),
      loadTrustedSetup: jest.fn(),
    }
  }
})

describe('KZG_POINT_EVALUATION (0x0a) Precompile', () => {
  let mockCommon: jest.Mocked<Common>
  let mockDebug: jest.Mock
  let baseInput: PrecompileInput
  const mockKzg = kzg as jest.Mocked<typeof kzg>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockCommon = {
      param: jest.fn((topic, param) => {
        if (param === 'kzgPointEvaluationGasPrecompilePrice') return BigInt(50000)
        return BigInt(0)
      }),
      paramByEIP: jest.fn((topic, param, eip) => {
        if (param === 'blobCommitmentVersionKzg') return BigInt(1)
        if (param === 'fieldElementsPerBlob') return BigInt(4096)
        return BigInt(0)
      }),
    } as any

    mockDebug = jest.fn()

    baseInput = {
      data: new Uint8Array(),
      gasLimit: BigInt(100000),
      common: mockCommon,
      _EVM: {} as any,
      _debug: mockDebug,
    }

    // Default mock - verification succeeds
    mockKzg.verifyKzgProof.mockReturnValue(true)
  })

  describe('Gas Usage', () => {
    it('should return OOG when gas limit is less than required', async () => {
      const input: PrecompileInput = {
        ...baseInput,
        gasLimit: BigInt(49999),
      }

      const result = await precompile0a(input)

      expect(result).toEqual(OOGResult(BigInt(49999)))
      expect(mockDebug).toHaveBeenCalledWith('KZG_POINT_EVALUATION (0x14) failed: OOG')
    })

    it('should consume correct amount of gas on successful execution', async () => {
      const commitment = new Uint8Array(48)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      
      // Create versioned hash from commitment
      const version = 1
      const versionedHash = computeVersionedHash(commitment, version)
      
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(result.executionGasUsed).toBe(BigInt(50000))
    })

    it('should use gas price from common configuration', async () => {
      mockCommon.param.mockReturnValue(BigInt(80000))

      const commitment = new Uint8Array(48)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'kzgPointEvaluationGasPrecompilePrice')
      expect(result.executionGasUsed).toBe(BigInt(80000))
    })
  })

  describe('Input Validation', () => {
    it('should fail when input length is not 192 bytes', async () => {
      const testCases = [0, 100, 191, 193, 500]

      for (const length of testCases) {
        const input: PrecompileInput = {
          ...baseInput,
          data: new Uint8Array(length),
        }

        const result = await precompile0a(input)

        expect(result.executionGasUsed).toBe(baseInput.gasLimit)
        expect((result as any).exceptionError).toBeInstanceOf(EvmError)
        expect((result as any).exceptionError?.error).toBe(ERROR.INVALID_INPUT_LENGTH)
      }
    })

    it('should fail when versioned hash does not match commitment', async () => {
      const commitment = new Uint8Array(48).fill(1)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      
      // Use incorrect versioned hash
      const incorrectVersionedHash = new Uint8Array(32).fill(0xFF)
      
      const data = concatBytes(incorrectVersionedHash, z, y, commitment, proof)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(result.executionGasUsed).toBe(baseInput.gasLimit)
      expect((result as any).exceptionError).toBeInstanceOf(EvmError)
      expect((result as any).exceptionError?.error).toBe(ERROR.INVALID_COMMITMENT)
      expect(mockDebug).toHaveBeenCalledWith('KZG_POINT_EVALUATION (0x14) failed: INVALID_COMMITMENT')
    })

    it('should fail when z >= BLS_MODULUS', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      
      // Create z value equal to BLS_MODULUS
      const z = setLengthLeft(bigIntToBytes(BLS_MODULUS), 32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      // Mock kzg.verifyKzgProof to throw C_KZG_BADARGS error for invalid inputs
      mockKzg.verifyKzgProof.mockImplementation(() => {
        throw new Error('C_KZG_BADARGS: Invalid input parameters')
      })

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(result.executionGasUsed).toBe(baseInput.gasLimit)
      expect((result as any).exceptionError).toBeInstanceOf(EvmError)
      expect((result as any).exceptionError?.error).toBe(ERROR.INVALID_INPUTS)
      expect(mockDebug).toHaveBeenCalledWith('KZG_POINT_EVALUATION (0x14) failed: INVALID_INPUTS')
    })

    it('should fail when y >= BLS_MODULUS', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = new Uint8Array(32)
      
      // Create y value greater than BLS_MODULUS
      const y = setLengthLeft(bigIntToBytes(BLS_MODULUS + BigInt(1)), 32)
      const proof = new Uint8Array(48)
      
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      // Mock kzg.verifyKzgProof to throw C_KZG_BADARGS error for invalid inputs
      mockKzg.verifyKzgProof.mockImplementation(() => {
        throw new Error('C_KZG_BADARGS: Invalid input parameters')
      })

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(result.executionGasUsed).toBe(baseInput.gasLimit)
      expect((result as any).exceptionError).toBeInstanceOf(EvmError)
      expect((result as any).exceptionError?.error).toBe(ERROR.INVALID_INPUTS)
    })
  })

  describe('KZG Verification', () => {
    it('should succeed when KZG proof is valid', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      mockKzg.verifyKzgProof.mockReturnValue(true)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(mockKzg.verifyKzgProof).toHaveBeenCalledWith(commitment, z, y, proof)
      expect(result.executionGasUsed).toBe(BigInt(50000))
      expect(result.returnValue).toEqual(concatBytes(
        setLengthLeft(bigIntToBytes(BigInt(4096)), 32),
        setLengthLeft(bigIntToBytes(BLS_MODULUS), 32)
      ))
    })

    it('should fail when KZG proof is invalid', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      mockKzg.verifyKzgProof.mockReturnValue(false)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(result.executionGasUsed).toBe(baseInput.gasLimit)
      expect((result as any).exceptionError).toBeInstanceOf(EvmError)
      expect((result as any).exceptionError?.error).toBe(ERROR.INVALID_PROOF)
    })

    it('should handle kzg.verifyKzgProof throwing an error', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      mockKzg.verifyKzgProof.mockImplementation(() => {
        throw new Error('KZG verification error')
      })

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(result.executionGasUsed).toBe(baseInput.gasLimit)
      expect((result as any).exceptionError).toBeInstanceOf(EvmError)
      expect((result as any).exceptionError?.error).toBe(ERROR.REVERT)
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information when enabled', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      await precompile0a(input)

      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('Run KZG_POINT_EVALUATION (0x14) precompile')
      )
      expect(mockDebug).toHaveBeenCalledWith(
        expect.stringContaining('KZG_POINT_EVALUATION (0x14) return')
      )
    })

    it('should work without debug function', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      const input: PrecompileInput = {
        ...baseInput,
        data,
        _debug: undefined,
      }

      const result = await precompile0a(input)

      expect(result).toBeDefined()
      expect(result.returnValue).toHaveLength(64)
    })
  })

  describe('Version Handling', () => {
    it('should use version from common configuration', async () => {
      mockCommon.paramByEIP.mockImplementation((topic, param, eip) => {
        if (param === 'blobCommitmentVersionKzg') return BigInt(2)
        if (param === 'fieldElementsPerBlob') return BigInt(4096)
        return BigInt(0)
      })

      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 2) // Version 2
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(mockCommon.paramByEIP).toHaveBeenCalledWith('sharding', 'blobCommitmentVersionKzg', 4844)
      expect(result.returnValue).toBeDefined()
    })
  })

  describe('Return Value', () => {
    it('should return fieldElementsPerBlob and BLS_MODULUS', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      mockCommon.paramByEIP.mockImplementation((topic, param, eip) => {
        if (param === 'blobCommitmentVersionKzg') return BigInt(1)
        if (param === 'fieldElementsPerBlob') return BigInt(8192)
        return BigInt(0)
      })

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(result.returnValue).toHaveLength(64)
      
      // First 32 bytes should be fieldElementsPerBlob
      const fieldElements = result.returnValue.subarray(0, 32)
      expect(bytesToHex(fieldElements)).toBe(bytesToHex(setLengthLeft(bigIntToBytes(BigInt(8192)), 32)))
      
      // Last 32 bytes should be BLS_MODULUS
      const modulus = result.returnValue.subarray(32, 64)
      expect(bytesToHex(modulus)).toBe(bytesToHex(setLengthLeft(bigIntToBytes(BLS_MODULUS), 32)))
    })
  })

  describe('Edge Cases', () => {
    it('should handle z value just below BLS_MODULUS', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = setLengthLeft(bigIntToBytes(BLS_MODULUS - BigInt(1)), 32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(result.exceptionError).toBeUndefined()
      expect(result.returnValue).toHaveLength(64)
    })

    it('should handle all zero input values', async () => {
      const commitment = new Uint8Array(48)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = new Uint8Array(32)
      const y = new Uint8Array(32)
      const proof = new Uint8Array(48)
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      expect(result.returnValue).toHaveLength(64)
    })

    it('should handle all 0xFF input values (except versioned hash)', async () => {
      const commitment = new Uint8Array(48).fill(0xFF)
      const versionedHash = computeVersionedHash(commitment, 1)
      const z = new Uint8Array(32).fill(0xFF)
      const y = new Uint8Array(32).fill(0xFF)
      const proof = new Uint8Array(48).fill(0xFF)
      const data = concatBytes(versionedHash, z, y, commitment, proof)

      // Mock kzg.verifyKzgProof to throw C_KZG_BADARGS error for invalid inputs
      mockKzg.verifyKzgProof.mockImplementation(() => {
        throw new Error('C_KZG_BADARGS: Invalid input parameters')
      })

      const input: PrecompileInput = {
        ...baseInput,
        data,
      }

      const result = await precompile0a(input)

      // Should fail because z and y > BLS_MODULUS
      expect((result as any).exceptionError).toBeInstanceOf(EvmError)
      expect((result as any).exceptionError?.error).toBe(ERROR.INVALID_INPUTS)
    })
  })
})