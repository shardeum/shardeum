import { Opcode, getOpcodesForHF } from '../../../../../src/evm_v2/opcodes/codes'
import { Common, Hardfork } from '@ethereumjs/common'
import { CustomOpcode } from '../../../../../src/evm_v2/types'

// Mock dependencies
jest.mock('../../../../../src/evm_v2/opcodes/functions', () => ({
  handlers: new Map([
    [0x00, jest.fn()], // STOP
    [0x01, jest.fn()], // ADD
    [0x02, jest.fn()], // MUL
  ])
}))

jest.mock('../../../../../src/evm_v2/opcodes/gas', () => ({
  dynamicGasHandlers: new Map([
    [0x0a, jest.fn()], // EXP
    [0x20, jest.fn()], // KECCAK256
  ])
}))

jest.mock('../../../../../src/evm_v2/opcodes/util', () => ({
  getFullname: jest.fn((code: number, name: string) => `${name}${code}`)
}))

describe('opcodes/codes', () => {
  describe('Opcode class', () => {
    it('should create an Opcode instance with all properties', () => {
      const opcode = new Opcode({
        code: 0x01,
        name: 'ADD',
        fullName: 'ADD1',
        fee: 3,
        isAsync: false,
        dynamicGas: false,
      })

      expect(opcode.code).toBe(0x01)
      expect(opcode.name).toBe('ADD')
      expect(opcode.fullName).toBe('ADD1')
      expect(opcode.fee).toBe(3)
      expect(opcode.isAsync).toBe(false)
      expect(opcode.dynamicGas).toBe(false)
    })

    it('should freeze the Opcode instance', () => {
      const opcode = new Opcode({
        code: 0x01,
        name: 'ADD',
        fullName: 'ADD1',
        fee: 3,
        isAsync: false,
        dynamicGas: false,
      })

      expect(Object.isFrozen(opcode)).toBe(true)
      
      // Attempting to modify should throw an error in strict mode
      expect(() => {
        ;(opcode as any).code = 0x02
      }).toThrow()
      expect(opcode.code).toBe(0x01)
    })

    it('should handle async opcodes', () => {
      const opcode = new Opcode({
        code: 0xf1,
        name: 'CALL',
        fullName: 'CALL241',
        fee: 700,
        isAsync: true,
        dynamicGas: true,
      })

      expect(opcode.isAsync).toBe(true)
      expect(opcode.dynamicGas).toBe(true)
    })
  })

  describe('getOpcodesForHF', () => {
    let mockCommon: jest.Mocked<Common>

    beforeEach(() => {
      mockCommon = {
        gteHardfork: jest.fn(),
        isActivatedEIP: jest.fn(),
        param: jest.fn(),
      } as any
    })

    it('should return base opcodes for early hardforks', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation((section, name) => {
        // Return some default gas prices
        const gasPrices: { [key: string]: number } = {
          stop: 0,
          add: 3,
          mul: 5,
          sub: 3,
          div: 5,
          exp: 10,
          keccak256: 30,
          // Add more as needed
        }
        return BigInt(gasPrices[name] || 0)
      })

      const result = getOpcodesForHF(mockCommon)

      expect(result.opcodes).toBeInstanceOf(Map)
      expect(result.handlers).toBeInstanceOf(Map)
      expect(result.dynamicGasHandlers).toBeInstanceOf(Map)

      // Check some base opcodes exist
      expect(result.opcodes.has(0x00)).toBe(true) // STOP
      expect(result.opcodes.has(0x01)).toBe(true) // ADD
      expect(result.opcodes.has(0x02)).toBe(true) // MUL

      const stopOpcode = result.opcodes.get(0x00)
      expect(stopOpcode?.name).toBe('STOP')
      expect(stopOpcode?.isAsync).toBe(false)
      expect(stopOpcode?.dynamicGas).toBe(false)
    })

    it('should include Homestead opcodes when appropriate', () => {
      mockCommon.gteHardfork.mockImplementation((hf: string) => {
        return hf === Hardfork.Homestead
      })
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(3))

      const result = getOpcodesForHF(mockCommon)

      // DELEGATECALL was added in Homestead
      expect(result.opcodes.has(0xf4)).toBe(true)
      const delegateCall = result.opcodes.get(0xf4)
      expect(delegateCall?.name).toBe('DELEGATECALL')
      expect(delegateCall?.isAsync).toBe(true)
      expect(delegateCall?.dynamicGas).toBe(true)
    })

    it('should include Constantinople opcodes when appropriate', () => {
      mockCommon.gteHardfork.mockImplementation((hf: string) => {
        return [
          Hardfork.Homestead,
          Hardfork.TangerineWhistle,
          Hardfork.Byzantium,
          Hardfork.Constantinople,
        ].includes(hf as Hardfork)
      })
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(3))

      const result = getOpcodesForHF(mockCommon)

      // Constantinople added SHL, SHR, SAR
      expect(result.opcodes.has(0x1b)).toBe(true) // SHL
      expect(result.opcodes.has(0x1c)).toBe(true) // SHR
      expect(result.opcodes.has(0x1d)).toBe(true) // SAR
      expect(result.opcodes.has(0x3f)).toBe(true) // EXTCODEHASH
      expect(result.opcodes.has(0xf5)).toBe(true) // CREATE2
    })

    it('should include EIP-specific opcodes when activated', () => {
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.isActivatedEIP.mockImplementation((eip) => {
        return eip === 3855 // PUSH0
      })
      mockCommon.param.mockImplementation(() => BigInt(2))

      const result = getOpcodesForHF(mockCommon)

      // EIP-3855 adds PUSH0
      expect(result.opcodes.has(0x5f)).toBe(true)
      const push0 = result.opcodes.get(0x5f)
      expect(push0?.name).toBe('PUSH0')
      expect(push0?.isAsync).toBe(false)
      expect(push0?.dynamicGas).toBe(false)
    })

    it('should handle custom opcodes', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(3))

      const customOpcodes: CustomOpcode[] = [
        {
          opcode: 0xb0,
          opcodeName: 'CUSTOM1',
          baseFee: 100,
          logicFunction: jest.fn(),
        },
        {
          opcode: 0xb1,
          opcodeName: 'CUSTOM2',
          baseFee: 200,
          logicFunction: jest.fn(),
          gasFunction: jest.fn(),
        },
      ]

      const result = getOpcodesForHF(mockCommon, customOpcodes)

      // Check custom opcodes were added
      expect(result.opcodes.has(0xb0)).toBe(true)
      expect(result.opcodes.has(0xb1)).toBe(true)

      const custom1 = result.opcodes.get(0xb0)
      expect(custom1?.name).toBe('CUSTOM1')
      expect(custom1?.fee).toBe(100)
      expect(custom1?.isAsync).toBe(true)
      expect(custom1?.dynamicGas).toBe(false)

      const custom2 = result.opcodes.get(0xb1)
      expect(custom2?.name).toBe('CUSTOM2')
      expect(custom2?.fee).toBe(200)
      expect(custom2?.dynamicGas).toBe(true)

      // Check handlers were added
      expect(result.handlers.has(0xb0)).toBe(true)
      expect(result.handlers.has(0xb1)).toBe(true)
      expect(result.dynamicGasHandlers.has(0xb1)).toBe(true)
    })

    it('should delete opcodes when custom opcode has no logicFunction', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(3))

      const customOpcodes: CustomOpcode[] = [
        {
          opcode: 0x01, // Override ADD
          opcodeName: 'ADD',
          baseFee: 3,
          logicFunction: undefined,
        },
      ]

      const result = getOpcodesForHF(mockCommon, customOpcodes)

      // ADD should be removed
      expect(result.opcodes.has(0x01)).toBe(false)
    })

    it('should throw error for custom opcode missing required fields', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(3))

      const customOpcodes: CustomOpcode[] = [
        {
          opcode: 0xb0,
          opcodeName: undefined as any,
          baseFee: 100,
          logicFunction: jest.fn(),
        },
      ]

      expect(() => getOpcodesForHF(mockCommon, customOpcodes)).toThrow(
        'Custom opcode 176 does not have the required values'
      )
    })

    it('should handle undefined base fees by converting to 0', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => undefined)

      // The function uses Number(undefined) which returns NaN
      // createOpcodes checks isNaN and converts to 0
      const result = getOpcodesForHF(mockCommon)
      
      // All opcodes should have fee set to 0 when param returns undefined
      for (const [, opcode] of result.opcodes) {
        expect(opcode.fee).toBe(0)
      }
    })

    it('should handle all PUSH opcodes', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(3))

      const result = getOpcodesForHF(mockCommon)

      // Check all PUSH opcodes from PUSH1 to PUSH32
      for (let i = 0x60; i <= 0x7f; i++) {
        expect(result.opcodes.has(i)).toBe(true)
        const pushOpcode = result.opcodes.get(i)
        expect(pushOpcode?.name).toBe('PUSH')
        expect(pushOpcode?.isAsync).toBe(false)
        expect(pushOpcode?.dynamicGas).toBe(false)
      }
    })

    it('should handle all DUP opcodes', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(3))

      const result = getOpcodesForHF(mockCommon)

      // Check all DUP opcodes from DUP1 to DUP16
      for (let i = 0x80; i <= 0x8f; i++) {
        expect(result.opcodes.has(i)).toBe(true)
        const dupOpcode = result.opcodes.get(i)
        expect(dupOpcode?.name).toBe('DUP')
        expect(dupOpcode?.isAsync).toBe(false)
        expect(dupOpcode?.dynamicGas).toBe(false)
      }
    })

    it('should handle all SWAP opcodes', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(3))

      const result = getOpcodesForHF(mockCommon)

      // Check all SWAP opcodes from SWAP1 to SWAP16
      for (let i = 0x90; i <= 0x9f; i++) {
        expect(result.opcodes.has(i)).toBe(true)
        const swapOpcode = result.opcodes.get(i)
        expect(swapOpcode?.name).toBe('SWAP')
        expect(swapOpcode?.isAsync).toBe(false)
        expect(swapOpcode?.dynamicGas).toBe(false)
      }
    })

    it('should handle all LOG opcodes', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(375))

      const result = getOpcodesForHF(mockCommon)

      // Check LOG0 to LOG4
      for (let i = 0xa0; i <= 0xa4; i++) {
        expect(result.opcodes.has(i)).toBe(true)
        const logOpcode = result.opcodes.get(i)
        expect(logOpcode?.name).toBe('LOG')
        expect(logOpcode?.isAsync).toBe(false)
        expect(logOpcode?.dynamicGas).toBe(true)
      }
    })

    it('should correctly set PREVRANDAO in Paris hardfork', () => {
      mockCommon.gteHardfork.mockImplementation((hf: string) => {
        return [
          Hardfork.Homestead,
          Hardfork.TangerineWhistle,
          Hardfork.Byzantium,
          Hardfork.Constantinople,
          Hardfork.Istanbul,
          Hardfork.Paris,
        ].includes(hf as Hardfork)
      })
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockImplementation(() => BigInt(2))

      const result = getOpcodesForHF(mockCommon)

      // In Paris, DIFFICULTY (0x44) becomes PREVRANDAO
      expect(result.opcodes.has(0x44)).toBe(true)
      const prevrandao = result.opcodes.get(0x44)
      expect(prevrandao?.name).toBe('PREVRANDAO')
    })
  })
})