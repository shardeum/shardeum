import { ERROR, EvmError } from '../../../../src/evm_v2/exceptions'

describe('exceptions', () => {
  describe('ERROR enum', () => {
    it('should have all gas-related error values', () => {
      expect(ERROR.OUT_OF_GAS).toBe('out of gas')
      expect(ERROR.CODESTORE_OUT_OF_GAS).toBe('code store out of gas')
      expect(ERROR.REFUND_EXHAUSTED).toBe('refund exhausted')
    })

    it('should have all stack-related error values', () => {
      expect(ERROR.STACK_UNDERFLOW).toBe('stack underflow')
      expect(ERROR.STACK_OVERFLOW).toBe('stack overflow')
    })

    it('should have all jump-related error values', () => {
      expect(ERROR.INVALID_JUMP).toBe('invalid JUMP')
      expect(ERROR.INVALID_BEGINSUB).toBe('invalid BEGINSUB')
      expect(ERROR.INVALID_RETURNSUB).toBe('invalid RETURNSUB')
      expect(ERROR.INVALID_JUMPSUB).toBe('invalid JUMPSUB')
    })

    it('should have all code-related error values', () => {
      expect(ERROR.CODESIZE_EXCEEDS_MAXIMUM).toBe('code size to deposit exceeds maximum code size')
      expect(ERROR.INVALID_OPCODE).toBe('invalid opcode')
      expect(ERROR.INVALID_BYTECODE_RESULT).toBe('invalid bytecode deployed')
      expect(ERROR.INVALID_EOF_FORMAT).toBe('invalid EOF format')
      expect(ERROR.INITCODE_SIZE_VIOLATION).toBe('initcode exceeds max initcode size')
    })

    it('should have all execution-related error values', () => {
      expect(ERROR.REVERT).toBe('revert')
      expect(ERROR.STOP).toBe('stop')
      expect(ERROR.STATIC_STATE_CHANGE).toBe('static state change')
      expect(ERROR.INTERNAL_ERROR).toBe('internal error')
      expect(ERROR.CREATE_COLLISION).toBe('create collision')
    })

    it('should have all value-related error values', () => {
      expect(ERROR.OUT_OF_RANGE).toBe('value out of range')
      expect(ERROR.VALUE_OVERFLOW).toBe('value overflow')
      expect(ERROR.INSUFFICIENT_BALANCE).toBe('insufficient balance')
      expect(ERROR.INVALID_INPUT_LENGTH).toBe('invalid input length')
    })

    it('should have all AUTH-related error values', () => {
      expect(ERROR.AUTHCALL_UNSET).toBe('attempting to AUTHCALL without AUTH set')
      expect(ERROR.AUTHCALL_NONZERO_VALUEEXT).toBe('attempting to execute AUTHCALL with nonzero external value')
      expect(ERROR.AUTH_INVALID_S).toBe('invalid Signature: s-values greater than secp256k1n/2 are considered invalid')
    })

    it('should have all BLS-related error values', () => {
      expect(ERROR.BLS_12_381_INVALID_INPUT_LENGTH).toBe('invalid input length')
      expect(ERROR.BLS_12_381_POINT_NOT_ON_CURVE).toBe('point not on curve')
      expect(ERROR.BLS_12_381_INPUT_EMPTY).toBe('input is empty')
      expect(ERROR.BLS_12_381_FP_NOT_IN_FIELD).toBe('fp point not in field')
    })

    it('should have all Point Evaluation error values', () => {
      expect(ERROR.INVALID_COMMITMENT).toBe('kzg commitment does not match versioned hash')
      expect(ERROR.INVALID_INPUTS).toBe('kzg inputs invalid')
      expect(ERROR.INVALID_PROOF).toBe('kzg proof invalid')
    })

    it('should have exactly 33 error types', () => {
      const errorKeys = Object.keys(ERROR)
      expect(errorKeys).toHaveLength(33)
    })

    it('should have unique error messages for most errors', () => {
      const errorValues = Object.values(ERROR)
      const uniqueValues = new Set(errorValues)
      
      // Note: BLS_12_381_INVALID_INPUT_LENGTH and INVALID_INPUT_LENGTH have the same message
      expect(uniqueValues.size).toBe(32) // 33 - 1 duplicate
    })
  })

  describe('EvmError class', () => {
    it('should create an EvmError instance with error property', () => {
      const error = new EvmError(ERROR.OUT_OF_GAS)
      expect(error.error).toBe(ERROR.OUT_OF_GAS)
      expect(error.errorType).toBe('EvmError')
    })

    it('should create instances for different error types', () => {
      const testCases = [
        ERROR.STACK_OVERFLOW,
        ERROR.INVALID_OPCODE,
        ERROR.REVERT,
        ERROR.INSUFFICIENT_BALANCE,
        ERROR.BLS_12_381_POINT_NOT_ON_CURVE,
      ]

      for (const errorType of testCases) {
        const error = new EvmError(errorType)
        expect(error.error).toBe(errorType)
        expect(error.errorType).toBe('EvmError')
      }
    })

    it('should be an instance of EvmError', () => {
      const error = new EvmError(ERROR.OUT_OF_GAS)
      expect(error).toBeInstanceOf(EvmError)
    })

    it('should have the correct properties', () => {
      const error = new EvmError(ERROR.INVALID_JUMP)
      expect(error).toHaveProperty('error')
      expect(error).toHaveProperty('errorType')
      expect(Object.keys(error)).toEqual(['error', 'errorType'])
    })

    it('should handle all ERROR enum values', () => {
      const allErrors = Object.values(ERROR) as ERROR[]
      
      for (const errorValue of allErrors) {
        const error = new EvmError(errorValue)
        expect(error.error).toBe(errorValue)
        expect(error.errorType).toBe('EvmError')
      }
    })

    it('should maintain error message integrity', () => {
      const error1 = new EvmError(ERROR.OUT_OF_GAS)
      const error2 = new EvmError(ERROR.OUT_OF_GAS)
      
      expect(error1.error).toBe(error2.error)
      expect(error1.errorType).toBe(error2.errorType)
    })

    it('should be usable in error handling scenarios', () => {
      const throwError = () => {
        throw new EvmError(ERROR.STACK_UNDERFLOW)
      }

      expect(throwError).toThrow()
      
      try {
        throwError()
      } catch (e) {
        expect(e).toBeInstanceOf(EvmError)
        expect((e as EvmError).error).toBe(ERROR.STACK_UNDERFLOW)
        expect((e as EvmError).errorType).toBe('EvmError')
      }
    })

    it('should be serializable to JSON', () => {
      const error = new EvmError(ERROR.INVALID_OPCODE)
      const serialized = JSON.stringify(error)
      const deserialized = JSON.parse(serialized)
      
      expect(deserialized).toEqual({
        error: ERROR.INVALID_OPCODE,
        errorType: 'EvmError'
      })
    })

    it('should work with different error checking patterns', () => {
      const error = new EvmError(ERROR.REVERT)
      
      // Pattern 1: Direct comparison
      expect(error.error === ERROR.REVERT).toBe(true)
      
      // Pattern 2: Switch statement
      let matched = false
      switch (error.error) {
        case ERROR.REVERT:
          matched = true
          break
        default:
          matched = false
      }
      expect(matched).toBe(true)
      
      // Pattern 3: Type checking
      expect(typeof error.error).toBe('string')
      expect(typeof error.errorType).toBe('string')
    })
  })

  describe('Error usage patterns', () => {
    it('should support error type checking', () => {
      const checkErrorType = (error: EvmError): string => {
        switch (error.error) {
          case ERROR.OUT_OF_GAS:
          case ERROR.CODESTORE_OUT_OF_GAS:
          case ERROR.REFUND_EXHAUSTED:
            return 'GAS_ERROR'
          case ERROR.STACK_UNDERFLOW:
          case ERROR.STACK_OVERFLOW:
            return 'STACK_ERROR'
          case ERROR.INVALID_JUMP:
          case ERROR.INVALID_JUMPSUB:
          case ERROR.INVALID_BEGINSUB:
          case ERROR.INVALID_RETURNSUB:
            return 'JUMP_ERROR'
          default:
            return 'OTHER_ERROR'
        }
      }

      expect(checkErrorType(new EvmError(ERROR.OUT_OF_GAS))).toBe('GAS_ERROR')
      expect(checkErrorType(new EvmError(ERROR.STACK_OVERFLOW))).toBe('STACK_ERROR')
      expect(checkErrorType(new EvmError(ERROR.INVALID_JUMP))).toBe('JUMP_ERROR')
      expect(checkErrorType(new EvmError(ERROR.REVERT))).toBe('OTHER_ERROR')
    })

    it('should support error message extraction', () => {
      const getErrorMessage = (error: EvmError): string => {
        return `EVM Error: ${error.error}`
      }

      expect(getErrorMessage(new EvmError(ERROR.OUT_OF_GAS))).toBe('EVM Error: out of gas')
      expect(getErrorMessage(new EvmError(ERROR.REVERT))).toBe('EVM Error: revert')
    })

    it('should support custom error handling', () => {
      class CustomEvmError extends EvmError {
        constructor(error: ERROR, public readonly context?: any) {
          super(error)
        }
      }

      const customError = new CustomEvmError(ERROR.INSUFFICIENT_BALANCE, { 
        required: 100, 
        available: 50 
      })

      expect(customError.error).toBe(ERROR.INSUFFICIENT_BALANCE)
      expect(customError.errorType).toBe('EvmError')
      expect(customError.context).toEqual({ required: 100, available: 50 })
    })
  })
})