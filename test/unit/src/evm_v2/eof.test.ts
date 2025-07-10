import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { codeAnalysis, validOpcodes, getEOFCode, EOF, FORMAT, MAGIC, VERSION } from '../../../../src/evm_v2/eof'

// Mock the handlers import
jest.mock('../../../../src/evm_v2/opcodes/index.js', () => ({
  handlers: new Map([
    [0x00, {}], // STOP
    [0x01, {}], // ADD
    [0x60, {}], // PUSH1
    [0x61, {}], // PUSH2
    [0x7f, {}], // PUSH32
    [0xf3, {}], // RETURN
    [0xfd, {}], // REVERT
    [0xfe, {}], // INVALID (added in validOpcodes)
    [0xff, {}], // SELFDESTRUCT
  ])
}))

describe('EOF (EVM Object Format)', () => {
  describe('Constants', () => {
    it('should have correct FORMAT constant', () => {
      expect(FORMAT).toBe(0xef)
    })

    it('should have correct MAGIC constant', () => {
      expect(MAGIC).toBe(0x00)
    })

    it('should have correct VERSION constant', () => {
      expect(VERSION).toBe(0x01)
    })
  })

  describe('codeAnalysis', () => {
    it('should return undefined for non-EOF1 bytecode', () => {
      const nonEOF = new Uint8Array([0x60, 0x01, 0x60, 0x02])
      expect(codeAnalysis(nonEOF)).toBeUndefined()
    })

    it('should return undefined for bytecode with wrong magic', () => {
      const wrongMagic = new Uint8Array([0xef, 0x01, 0x01])
      expect(codeAnalysis(wrongMagic)).toBeUndefined()
    })

    it('should return undefined for bytecode with wrong version', () => {
      const wrongVersion = new Uint8Array([0xef, 0x00, 0x02])
      expect(codeAnalysis(wrongVersion)).toBeUndefined()
    })

    it('should parse valid EOF1 container with code section only', () => {
      // EF00 01 01 0002 00 FEFE (code: FEFE)
      const validEOF = new Uint8Array([0xef, 0x00, 0x01, 0x01, 0x00, 0x02, 0x00, 0xfe, 0xfe])
      const result = codeAnalysis(validEOF)
      expect(result).toEqual({ code: 2, data: 0 })
    })

    it('should parse valid EOF1 container with code and data sections', () => {
      // EF00 01 01 0002 02 0003 00 FEFE AABBCC (code: FEFE, data: AABBCC)
      const validEOF = new Uint8Array([
        0xef, 0x00, 0x01, 0x01, 0x00, 0x02, 0x02, 0x00, 0x03, 0x00,
        0xfe, 0xfe, 0xaa, 0xbb, 0xcc
      ])
      const result = codeAnalysis(validEOF)
      expect(result).toEqual({ code: 2, data: 3 })
    })

    it('should return undefined for container shorter than minimum length', () => {
      const tooShort = new Uint8Array([0xef, 0x00, 0x01])
      expect(codeAnalysis(tooShort)).toBeUndefined()
    })

    it('should return undefined for code section with zero size', () => {
      const zeroCode = new Uint8Array([0xef, 0x00, 0x01, 0x01, 0x00, 0x00, 0x00])
      expect(codeAnalysis(zeroCode)).toBeUndefined()
    })

    it('should return undefined for data section with zero size', () => {
      const zeroData = new Uint8Array([
        0xef, 0x00, 0x01, 0x01, 0x00, 0x01, 0x02, 0x00, 0x00, 0x00, 0xfe
      ])
      expect(codeAnalysis(zeroData)).toBeUndefined()
    })

    it('should return undefined for mismatched container size', () => {
      // Claims 3 bytes of code but only has 2
      const mismatchedSize = new Uint8Array([
        0xef, 0x00, 0x01, 0x01, 0x00, 0x03, 0x00, 0xfe, 0xfe
      ])
      expect(codeAnalysis(mismatchedSize)).toBeUndefined()
    })

    it('should handle maximum size code section', () => {
      // Maximum 16-bit size: 0xFFFF
      const header = new Uint8Array([0xef, 0x00, 0x01, 0x01, 0xff, 0xff, 0x00])
      const code = new Uint8Array(0xffff).fill(0xfe)
      const container = new Uint8Array(header.length + code.length)
      container.set(header)
      container.set(code, header.length)
      
      const result = codeAnalysis(container)
      expect(result).toEqual({ code: 0xffff, data: 0 })
    })
  })

  describe('validOpcodes', () => {
    it('should validate code with valid opcodes', () => {
      const validCode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]) // PUSH1 01 PUSH1 02 ADD STOP
      expect(validOpcodes(validCode)).toBe(true)
    })

    it('should reject code with invalid opcodes', () => {
      const invalidCode = new Uint8Array([0x60, 0x01, 0xef, 0x00]) // PUSH1 01 <invalid> STOP
      expect(validOpcodes(invalidCode)).toBe(false)
    })

    it('should reject code without terminating opcode', () => {
      const noTerminator = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]) // PUSH1 01 PUSH1 02 ADD
      expect(validOpcodes(noTerminator)).toBe(false)
    })

    it('should accept all valid terminating opcodes', () => {
      const terminators = [0x00, 0xf3, 0xfd, 0xfe, 0xff] // STOP, RETURN, REVERT, INVALID, SELFDESTRUCT
      
      terminators.forEach(opcode => {
        const code = new Uint8Array([opcode])
        expect(validOpcodes(code)).toBe(true)
      })
    })

    it('should handle PUSH opcodes correctly', () => {
      // PUSH1 with correct data
      const push1Valid = new Uint8Array([0x60, 0xaa, 0x00]) // PUSH1 aa STOP
      expect(validOpcodes(push1Valid)).toBe(true)

      // PUSH32 with correct data
      const push32Data = new Uint8Array(32).fill(0xbb)
      const push32Valid = new Uint8Array([0x7f, ...push32Data, 0x00])
      expect(validOpcodes(push32Valid)).toBe(true)
    })

    it('should reject PUSH opcodes with insufficient data', () => {
      // PUSH1 without enough data
      const push1Invalid = new Uint8Array([0x60, 0x00]) // PUSH1 <missing> STOP
      expect(validOpcodes(push1Invalid)).toBe(false)

      // PUSH32 without enough data
      const push32Invalid = new Uint8Array([0x7f, 0xaa, 0xbb, 0x00]) // PUSH32 <incomplete data> STOP
      expect(validOpcodes(push32Invalid)).toBe(false)
    })

    it('should handle edge case of PUSH at end of code', () => {
      // PUSH1 that would read past end
      const pushAtEnd = new Uint8Array([0x60, 0x01, 0x60]) // PUSH1 01 PUSH1 <missing>
      expect(validOpcodes(pushAtEnd)).toBe(false)
    })

    it('should validate empty code as invalid', () => {
      const emptyCode = new Uint8Array([])
      expect(validOpcodes(emptyCode)).toBe(false)
    })

    it('should accept INVALID opcode (0xfe) as valid', () => {
      const withInvalid = new Uint8Array([0x60, 0x01, 0xfe]) // PUSH1 01 INVALID
      expect(validOpcodes(withInvalid)).toBe(true)
    })
  })

  describe('getEOFCode', () => {
    it('should return original code for non-EOF bytecode', () => {
      const nonEOF = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00])
      expect(getEOFCode(nonEOF)).toBe(nonEOF)
    })

    it('should extract code section from EOF container with code only', () => {
      // EF00 01 01 0002 00 FEFE (code: FEFE)
      const eofContainer = new Uint8Array([0xef, 0x00, 0x01, 0x01, 0x00, 0x02, 0x00, 0xfe, 0xfe])
      const result = getEOFCode(eofContainer)
      expect(result).toEqual(new Uint8Array([0xfe, 0xfe]))
    })

    it('should extract code section from EOF container with code and data', () => {
      // EF00 01 01 0002 02 0003 00 FEFE AABBCC (code: FEFE, data: AABBCC)
      const eofContainer = new Uint8Array([
        0xef, 0x00, 0x01, 0x01, 0x00, 0x02, 0x02, 0x00, 0x03, 0x00,
        0xfe, 0xfe, 0xaa, 0xbb, 0xcc
      ])
      const result = getEOFCode(eofContainer)
      expect(result).toEqual(new Uint8Array([0xfe, 0xfe]))
    })

    it('should handle large code sections', () => {
      const codeSize = 1000
      const header = new Uint8Array([
        0xef, 0x00, 0x01, 0x01, 
        (codeSize >> 8) & 0xff, codeSize & 0xff, 
        0x00
      ])
      const code = new Uint8Array(codeSize).fill(0x60)
      const container = new Uint8Array(header.length + code.length)
      container.set(header)
      container.set(code, header.length)

      const result = getEOFCode(container)
      expect(result.length).toBe(codeSize)
      expect(result[0]).toBe(0x60)
    })
  })

  describe('EOF object', () => {
    it('should export all functions and constants', () => {
      expect(EOF).toHaveProperty('FORMAT', FORMAT)
      expect(EOF).toHaveProperty('MAGIC', MAGIC)
      expect(EOF).toHaveProperty('VERSION', VERSION)
      expect(EOF).toHaveProperty('codeAnalysis', codeAnalysis)
      expect(EOF).toHaveProperty('validOpcodes', validOpcodes)
    })
  })
})