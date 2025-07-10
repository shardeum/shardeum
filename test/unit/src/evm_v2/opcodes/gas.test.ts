import { Common, Hardfork } from '@ethereumjs/common'
import { Address, bigIntToBytes, setLengthLeft } from '@ethereumjs/util'
import { dynamicGasHandlers } from '../../../../../src/evm_v2/opcodes/gas'
import { ERROR } from '../../../../../src/evm_v2/exceptions'
import * as util from '../../../../../src/evm_v2/opcodes/util'
import * as EIP1283 from '../../../../../src/evm_v2/opcodes/EIP1283'
import * as EIP2200 from '../../../../../src/evm_v2/opcodes/EIP2200'
import * as EIP2929 from '../../../../../src/evm_v2/opcodes/EIP2929'

// Mock all dependencies
jest.mock('../../../../../src/evm_v2/opcodes/util')
jest.mock('../../../../../src/evm_v2/opcodes/EIP1283')
jest.mock('../../../../../src/evm_v2/opcodes/EIP2200')
jest.mock('../../../../../src/evm_v2/opcodes/EIP2929')

describe('Dynamic Gas Handlers', () => {
  let mockRunState: any
  let mockCommon: any
  let mockInterpreter: any
  let mockStateManager: any
  let mockStack: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock stack
    mockStack = {
      peek: jest.fn(),
    }

    // Setup mock state manager
    mockStateManager = {
      getAccount: jest.fn(),
    }

    // Setup mock interpreter
    mockInterpreter = {
      getGasLeft: jest.fn().mockReturnValue(BigInt(1000000)),
      getAddress: jest.fn().mockReturnValue(new Address(new Uint8Array(20))),
      isStatic: jest.fn().mockReturnValue(false),
      addStipend: jest.fn(),
      getReturnDataSize: jest.fn().mockReturnValue(BigInt(0)),
      storageLoad: jest.fn().mockResolvedValue(new Uint8Array(32)),
      getExternalBalance: jest.fn().mockResolvedValue(BigInt(0)),
    }

    // Setup mock common
    mockCommon = {
      param: jest.fn(),
      gteHardfork: jest.fn(),
      isActivatedEIP: jest.fn(),
      hardfork: jest.fn(),
    } as any

    // Setup mock run state
    mockRunState = {
      stack: mockStack,
      interpreter: mockInterpreter,
      stateManager: mockStateManager,
      opCode: 0,
      messageGasLimit: BigInt(0),
      auth: undefined,
    }

    // Setup default mock implementations
    ;(util.trap as jest.Mock) = jest.fn((error) => {
      throw new Error(error)
    })
    ;(util.subMemUsage as jest.Mock) = jest.fn().mockReturnValue(BigInt(0))
    ;(util.divCeil as jest.Mock) = jest.fn((a, b) => (a + b - BigInt(1)) / b)
    ;(util.maxCallGas as jest.Mock) = jest.fn((a, b) => (a < b ? a : b))
    ;(util.addresstoBytes as jest.Mock) = jest.fn((addr) => 
      setLengthLeft(bigIntToBytes(addr), 20)
    )
    ;(util.setLengthLeftStorage as jest.Mock) = jest.fn((val) => 
      val instanceof Uint8Array ? setLengthLeft(val, 32) : setLengthLeft(bigIntToBytes(val), 32)
    )
    ;(util.updateSstoreGas as jest.Mock) = jest.fn().mockReturnValue(BigInt(0))
    ;(EIP1283.updateSstoreGasEIP1283 as jest.Mock) = jest.fn().mockReturnValue(BigInt(0))
    ;(EIP2200.updateSstoreGasEIP2200 as jest.Mock) = jest.fn().mockReturnValue(BigInt(0))
    ;(EIP2929.accessAddressEIP2929 as jest.Mock) = jest.fn().mockReturnValue(BigInt(0))
    ;(EIP2929.accessStorageEIP2929 as jest.Mock) = jest.fn().mockReturnValue(BigInt(0))
  })

  describe('EXP opcode (0x0a)', () => {
    const handler = dynamicGasHandlers.get(0x0a)!

    it('should return base gas for exponent of 0', async () => {
      mockStack.peek.mockReturnValue([BigInt(2), BigInt(0)])
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(100))
    })

    it('should calculate gas for single byte exponent', async () => {
      mockStack.peek.mockReturnValue([BigInt(2), BigInt(10)])
      mockCommon.param.mockReturnValue(BigInt(50))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(150)) // 100 + 1 * 50
      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'expByte')
    })

    it('should calculate gas for multi-byte exponent', async () => {
      mockStack.peek.mockReturnValue([BigInt(2), BigInt(256)]) // 2 bytes
      mockCommon.param.mockReturnValue(BigInt(50))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(200)) // 100 + 2 * 50
    })

    it('should handle maximum 32-byte exponent', async () => {
      const maxExponent = BigInt(2) ** BigInt(256) - BigInt(1)
      mockStack.peek.mockReturnValue([BigInt(2), maxExponent])
      mockCommon.param.mockReturnValue(BigInt(50))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(1700)) // 100 + 32 * 50
    })

    it('should trap on exponent byte length out of range', async () => {
      mockStack.peek.mockReturnValue([BigInt(2), BigInt(2) ** BigInt(257)])
      mockCommon.param.mockReturnValue(BigInt(50))
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.OUT_OF_RANGE)
      expect(util.trap).toHaveBeenCalledWith(ERROR.OUT_OF_RANGE)
    })
  })

  describe('KECCAK256 opcode (0x20)', () => {
    const handler = dynamicGasHandlers.get(0x20)!

    it('should calculate gas for zero length', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0)])
      mockCommon.param.mockReturnValue(BigInt(6))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(110)) // 100 + 10 (memory) + 0 (no words)
      expect(util.subMemUsage).toHaveBeenCalledWith(mockRunState, BigInt(0), BigInt(0), mockCommon)
    })

    it('should calculate gas for single word', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(32)])
      mockCommon.param.mockReturnValue(BigInt(6))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(116)) // 100 + 10 + 6
      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'keccak256Word')
    })

    it('should calculate gas for multiple words', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(64)])
      mockCommon.param.mockReturnValue(BigInt(6))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(122)) // 100 + 10 + 12 (2 words)
    })
  })

  describe('BALANCE opcode (0x31)', () => {
    const handler = dynamicGasHandlers.get(0x31)!

    it('should return base gas when EIP-2929 is not activated', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(100))
      expect(EIP2929.accessAddressEIP2929).not.toHaveBeenCalled()
    })

    it('should add access cost when EIP-2929 is activated', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValue(true)
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2700))
      expect(EIP2929.accessAddressEIP2929).toHaveBeenCalled()
    })
  })

  describe('CALLDATACOPY opcode (0x37)', () => {
    const handler = dynamicGasHandlers.get(0x37)!

    it('should calculate gas for zero length copy', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(0)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(110)) // No copy cost for zero length
    })

    it('should calculate gas for data copy', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(64)])
      mockCommon.param.mockReturnValue(BigInt(3))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(116)) // 100 + 10 + 6 (2 words * 3)
      expect(mockCommon.param).toHaveBeenCalledWith('gasPrices', 'copy')
    })
  })

  describe('RETURNDATACOPY opcode (0x3e)', () => {
    const handler = dynamicGasHandlers.get(0x3e)!

    it('should trap when copying beyond return data size', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(10), BigInt(20)])
      mockInterpreter.getReturnDataSize.mockReturnValue(BigInt(25))
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.OUT_OF_GAS)
      expect(util.trap).toHaveBeenCalledWith(ERROR.OUT_OF_GAS)
    })

    it('should calculate gas for valid copy', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(32)])
      mockInterpreter.getReturnDataSize.mockReturnValue(BigInt(64))
      mockCommon.param.mockReturnValue(BigInt(3))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(113)) // 100 + 10 + 3
    })
  })

  describe('SLOAD opcode (0x54)', () => {
    const handler = dynamicGasHandlers.get(0x54)!

    it('should calculate gas without EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(100))
      expect(EIP2929.accessStorageEIP2929).not.toHaveBeenCalled()
    })

    it('should add storage access cost with EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValue(true)
      ;(EIP2929.accessStorageEIP2929 as jest.Mock).mockReturnValue(BigInt(2100))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2200))
      expect(EIP2929.accessStorageEIP2929).toHaveBeenCalled()
    })
  })

  describe('SSTORE opcode (0x55)', () => {
    const handler = dynamicGasHandlers.get(0x55)!

    it('should trap in static context', async () => {
      mockInterpreter.isStatic.mockReturnValue(true)
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.STATIC_STATE_CHANGE)
    })

    it('should handle Constantinople hardfork', async () => {
      mockStack.peek.mockReturnValue([BigInt(123), BigInt(456)])
      mockCommon.hardfork.mockReturnValue(Hardfork.Constantinople)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      ;(EIP1283.updateSstoreGasEIP1283 as jest.Mock).mockReturnValue(BigInt(5000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(5100))
      expect(EIP1283.updateSstoreGasEIP1283).toHaveBeenCalled()
    })

    it('should handle Istanbul hardfork', async () => {
      mockStack.peek.mockReturnValue([BigInt(123), BigInt(456)])
      mockCommon.hardfork.mockReturnValue(Hardfork.Istanbul)
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      ;(EIP2200.updateSstoreGasEIP2200 as jest.Mock).mockReturnValue(BigInt(5000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(5100))
      expect(EIP2200.updateSstoreGasEIP2200).toHaveBeenCalled()
    })

    it('should handle pre-Constantinople hardfork', async () => {
      mockStack.peek.mockReturnValue([BigInt(123), BigInt(456)])
      mockCommon.hardfork.mockReturnValue(Hardfork.Byzantium)
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      ;(util.updateSstoreGas as jest.Mock).mockReturnValue(BigInt(5000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(5100))
      expect(util.updateSstoreGas).toHaveBeenCalled()
    })

    it('should add EIP-2929 storage access cost', async () => {
      mockStack.peek.mockReturnValue([BigInt(123), BigInt(456)])
      mockCommon.hardfork.mockReturnValue(Hardfork.Berlin)
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.isActivatedEIP.mockReturnValue(true)
      ;(EIP2200.updateSstoreGasEIP2200 as jest.Mock).mockReturnValue(BigInt(5000))
      ;(EIP2929.accessStorageEIP2929 as jest.Mock).mockReturnValue(BigInt(2100))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(7200))
    })
  })

  describe('MCOPY opcode (0x5e)', () => {
    const handler = dynamicGasHandlers.get(0x5e)!

    it('should calculate gas for memory copy', async () => {
      mockStack.peek.mockReturnValue([BigInt(64), BigInt(0), BigInt(32)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      // 100 + 3 * 1 (words copied) + 10 (src mem) + 10 (dst mem)
      expect(gas).toBe(BigInt(123))
    })

    it('should handle zero length copy', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(0)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(100))
    })
  })

  describe('LOG opcodes (0xa0-0xa4)', () => {
    it('should trap in static context', async () => {
      mockRunState.opCode = 0xa0
      mockInterpreter.isStatic.mockReturnValue(true)
      const handler = dynamicGasHandlers.get(0xa0)!
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.STATIC_STATE_CHANGE)
    })

    it('should calculate gas for LOG0', async () => {
      mockRunState.opCode = 0xa0
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(32)])
      mockCommon.param.mockReturnValueOnce(BigInt(375)) // logTopic
      mockCommon.param.mockReturnValueOnce(BigInt(8)) // logData
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const handler = dynamicGasHandlers.get(0xa0)!
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(366)) // 100 + 10 + 0 + 256
    })

    it('should calculate gas for LOG4', async () => {
      mockRunState.opCode = 0xa4
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(32)])
      mockCommon.param.mockReturnValueOnce(BigInt(375)) // logTopic
      mockCommon.param.mockReturnValueOnce(BigInt(8)) // logData
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const handler = dynamicGasHandlers.get(0xa4)!
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(1866)) // 100 + 10 + 1500 + 256
    })

    it('should trap on invalid LOG opcode', async () => {
      mockRunState.opCode = 0xa5 // Invalid LOG5
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(32)])
      const handler = dynamicGasHandlers.get(0xa0)!
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.OUT_OF_RANGE)
    })
  })

  describe('CREATE opcode (0xf0)', () => {
    const handler = dynamicGasHandlers.get(0xf0)!

    it('should trap in static context', async () => {
      mockInterpreter.isStatic.mockReturnValue(true)
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.STATIC_STATE_CHANGE)
    })

    it('should calculate gas without EIP-3860', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(32)])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(90000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(110))
      expect(mockRunState.messageGasLimit).toBe(BigInt(90000))
    })

    it('should add initcode cost with EIP-3860', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(64)])
      mockCommon.isActivatedEIP.mockReturnValueOnce(false) // EIP-2929
      mockCommon.isActivatedEIP.mockReturnValueOnce(true) // EIP-3860
      mockCommon.param.mockReturnValue(BigInt(2))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(90000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(114)) // 100 + 10 + 4 (2 words * 2)
    })
  })

  describe('CALL opcode (0xf1)', () => {
    const handler = dynamicGasHandlers.get(0xf1)!

    it('should trap on value transfer in static context', async () => {
      mockInterpreter.isStatic.mockReturnValue(true)
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(100), // gas, address, value
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)  // offsets/lengths
      ])
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.STATIC_STATE_CHANGE)
    })

    it('should calculate gas for simple call', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(0), // gas, address, no value
        BigInt(0), BigInt(32), BigInt(0), BigInt(32)  // offsets/lengths
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.gteHardfork.mockReturnValue(true)
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      mockStateManager.getAccount.mockResolvedValue({ isEmpty: () => false })
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(120)) // 100 + 10 + 10
      expect(mockRunState.messageGasLimit).toBe(BigInt(50000))
    })

    it('should add value transfer cost', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(100), // gas, address, value
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)  // offsets/lengths
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.param.mockReturnValueOnce(BigInt(9000)) // callValueTransfer
      mockCommon.param.mockReturnValueOnce(BigInt(25000)) // callNewAccount
      mockCommon.param.mockReturnValueOnce(BigInt(2300)) // callStipend
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      mockStateManager.getAccount.mockResolvedValue(undefined)
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(34100)) // 100 + 9000 + 25000
      expect(mockRunState.messageGasLimit).toBe(BigInt(52300)) // 50000 + 2300
    })

    it('should trap on insufficient gas', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(1000000), BigInt(123), BigInt(0),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockInterpreter.getGasLeft.mockReturnValue(BigInt(1000))
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.gteHardfork.mockReturnValue(false)
      mockStateManager.getAccount.mockResolvedValue(undefined)
      mockCommon.param.mockReturnValue(BigInt(25000))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(1500))
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.OUT_OF_GAS)
    })
  })

  describe('DELEGATECALL opcode (0xf4)', () => {
    const handler = dynamicGasHandlers.get(0xf4)!

    it('should calculate gas correctly', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), // gas limit, address
        BigInt(0), BigInt(32), BigInt(0), BigInt(32) // offsets/lengths
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(120)) // 100 + 10 + 10
      expect(mockRunState.messageGasLimit).toBe(BigInt(50000))
    })

    it('should add EIP-2929 address access cost', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(true)
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2700))
    })
  })

  describe('CREATE2 opcode (0xf5)', () => {
    const handler = dynamicGasHandlers.get(0xf5)!

    it('should calculate gas including keccak256 cost', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(0), BigInt(0), BigInt(64), BigInt(123) // value, offset, length, salt
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockReturnValue(BigInt(6)) // keccak256Word
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(90000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(122)) // 100 + 10 + 12 (2 words * 6)
      expect(mockRunState.messageGasLimit).toBe(BigInt(90000))
    })
  })

  describe('AUTH opcode (0xf6)', () => {
    const handler = dynamicGasHandlers.get(0xf6)!

    it('should calculate gas for AUTH', async () => {
      mockStack.peek.mockReturnValue([BigInt(123), BigInt(0), BigInt(32)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(110))
    })
  })

  describe('AUTHCALL opcode (0xf7)', () => {
    const handler = dynamicGasHandlers.get(0xf7)!

    it('should trap when auth is not set', async () => {
      mockRunState.auth = undefined
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.AUTHCALL_UNSET)
    })

    it('should trap on non-zero valueExt', async () => {
      mockRunState.auth = {}
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(0), BigInt(1), // gas, addr, value, valueExt
        BigInt(0), BigInt(0), BigInt(0), BigInt(0) // offsets/lengths
      ])
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.AUTHCALL_NONZERO_VALUEEXT)
    })

    it('should calculate gas correctly', async () => {
      mockRunState.auth = {}
      mockStack.peek.mockReturnValue([
        BigInt(0), BigInt(123), BigInt(100), BigInt(0), // gas=0 (use all available), addr, value, valueExt
        BigInt(0), BigInt(32), BigInt(0), BigInt(32) // offsets/lengths
      ])
      mockCommon.param.mockReturnValueOnce(BigInt(100)) // warmstorageread
      mockCommon.param.mockReturnValueOnce(BigInt(9000)) // authcallValueTransfer
      mockCommon.param.mockReturnValueOnce(BigInt(25000)) // callNewAccount
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      mockStateManager.getAccount.mockResolvedValue(undefined)
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(34220)) // 100 + 100 + 0 + 10 + 10 + 9000 + 25000
      expect(mockRunState.messageGasLimit).toBe(BigInt(50000))
    })

    it('should handle explicit gas limit', async () => {
      mockRunState.auth = {}
      mockStack.peek.mockReturnValue([
        BigInt(30000), BigInt(123), BigInt(0), BigInt(0),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.param.mockReturnValue(BigInt(100))
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(200))
      expect(mockRunState.messageGasLimit).toBe(BigInt(30000))
    })

    it('should trap on insufficient gas for explicit limit', async () => {
      mockRunState.auth = {}
      mockStack.peek.mockReturnValue([
        BigInt(60000), BigInt(123), BigInt(0), BigInt(0),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.param.mockReturnValue(BigInt(100))
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.OUT_OF_GAS)
    })
  })

  describe('STATICCALL opcode (0xfa)', () => {
    const handler = dynamicGasHandlers.get(0xfa)!

    it('should calculate gas correctly', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123),
        BigInt(0), BigInt(32), BigInt(0), BigInt(32)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(120))
      expect(mockRunState.messageGasLimit).toBe(BigInt(50000))
    })
  })

  describe('REVERT opcode (0xfd)', () => {
    const handler = dynamicGasHandlers.get(0xfd)!

    it('should calculate memory expansion cost', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(32)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(110))
    })
  })

  describe('SELFDESTRUCT opcode (0xff)', () => {
    const handler = dynamicGasHandlers.get(0xff)!

    it('should trap in static context', async () => {
      mockInterpreter.isStatic.mockReturnValue(true)
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.STATIC_STATE_CHANGE)
    })

    it('should not charge for existing account post-SpuriousDragon', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockInterpreter.getExternalBalance.mockResolvedValue(BigInt(1000))
      mockStateManager.getAccount.mockResolvedValue({ isEmpty: () => false })
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(100))
    })

    it('should charge for new account when sending value post-SpuriousDragon', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockReturnValue(BigInt(25000))
      mockInterpreter.getExternalBalance.mockResolvedValue(BigInt(1000))
      mockStateManager.getAccount.mockResolvedValue(undefined)
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(25100))
    })

    it('should handle TangerineWhistle hardfork', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.gteHardfork.mockReturnValueOnce(false) // Not SpuriousDragon
      mockCommon.gteHardfork.mockReturnValueOnce(true) // Is TangerineWhistle
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockReturnValue(BigInt(25000))
      mockStateManager.getAccount.mockResolvedValue(undefined)
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(25100))
    })

    it('should add EIP-2929 address access cost', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(true)
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2700))
    })
  })

  describe('CODECOPY opcode (0x39)', () => {
    const handler = dynamicGasHandlers.get(0x39)!

    it('should calculate gas for zero length copy', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(0)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(110))
    })

    it('should calculate gas for code copy', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(64)])
      mockCommon.param.mockReturnValue(BigInt(3))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(116)) // 100 + 10 + 6 (2 words * 3)
    })
  })

  describe('EXTCODESIZE opcode (0x3b)', () => {
    const handler = dynamicGasHandlers.get(0x3b)!

    it('should return base gas without EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(100))
    })

    it('should add access cost with EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValue(true)
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2700))
    })
  })

  describe('EXTCODECOPY opcode (0x3c)', () => {
    const handler = dynamicGasHandlers.get(0x3c)!

    it('should calculate gas for zero length copy without EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(123), BigInt(0), BigInt(0), BigInt(0)])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(110))
    })

    it('should calculate gas for code copy with EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(123), BigInt(0), BigInt(0), BigInt(64)])
      mockCommon.isActivatedEIP.mockReturnValue(true)
      mockCommon.param.mockReturnValue(BigInt(3))
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2716)) // 100 + 10 + 2600 + 6
    })
  })

  describe('EXTCODEHASH opcode (0x3f)', () => {
    const handler = dynamicGasHandlers.get(0x3f)!

    it('should return base gas without EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(100))
    })

    it('should add access cost with EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValue(true)
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2700))
    })
  })

  describe('MSTORE opcode (0x52)', () => {
    const handler = dynamicGasHandlers.get(0x52)!

    it('should calculate memory expansion cost', async () => {
      mockStack.peek.mockReturnValue([BigInt(100)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(15))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(115))
    })
  })

  describe('MSTORE8 opcode (0x53)', () => {
    const handler = dynamicGasHandlers.get(0x53)!

    it('should calculate memory expansion cost for single byte', async () => {
      mockStack.peek.mockReturnValue([BigInt(100)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(15))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(115))
    })
  })

  describe('SSTORE edge cases', () => {
    const handler = dynamicGasHandlers.get(0x55)!

    it('should handle zero value correctly', async () => {
      mockStack.peek.mockReturnValue([BigInt(123), BigInt(0)])
      mockCommon.hardfork.mockReturnValue(Hardfork.Istanbul)
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.isActivatedEIP.mockReturnValue(false)
      ;(EIP2200.updateSstoreGasEIP2200 as jest.Mock).mockReturnValue(BigInt(5000))
      mockInterpreter.storageLoad.mockResolvedValue(new Uint8Array(32))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(5100))
      
      // Verify that value is converted to empty array for zero
      const calls = (EIP2200.updateSstoreGasEIP2200 as jest.Mock).mock.calls
      expect(calls[0][3]).toEqual(expect.any(Uint8Array))
      expect(calls[0][3].length).toBe(32)
    })
  })

  describe('CREATE with EIP-2929', () => {
    const handler = dynamicGasHandlers.get(0xf0)!

    it('should add address access cost with EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(32)])
      mockCommon.isActivatedEIP.mockReturnValueOnce(true) // EIP-2929
      mockCommon.isActivatedEIP.mockReturnValueOnce(false) // EIP-3860
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(90000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2710))
      expect(EIP2929.accessAddressEIP2929).toHaveBeenCalledWith(
        mockRunState,
        expect.any(Address),
        mockCommon,
        false
      )
    })
  })

  describe('CREATE2 with EIP-2929', () => {
    const handler = dynamicGasHandlers.get(0xf5)!

    it('should add address access cost with EIP-2929', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(64), BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValueOnce(true) // EIP-2929
      mockCommon.isActivatedEIP.mockReturnValueOnce(false) // EIP-3860
      mockCommon.param.mockReturnValue(BigInt(6))
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(90000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2722)) // 100 + 10 + 2600 + 12
    })
  })

  describe('CREATE2 with EIP-3860', () => {
    const handler = dynamicGasHandlers.get(0xf5)!

    it('should add initcode cost with EIP-3860', async () => {
      mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(64), BigInt(123)])
      mockCommon.isActivatedEIP.mockReturnValueOnce(false) // EIP-2929
      mockCommon.isActivatedEIP.mockReturnValueOnce(true) // EIP-3860
      mockCommon.param.mockReturnValueOnce(BigInt(2)) // initCodeWordCost
      mockCommon.param.mockReturnValueOnce(BigInt(6)) // keccak256Word
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(90000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(126)) // 100 + 10 + 4 + 12
    })
  })

  describe('CALL with EIP-2929', () => {
    const handler = dynamicGasHandlers.get(0xf1)!

    it('should add EIP-2929 address access cost', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(0),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(true)
      mockCommon.gteHardfork.mockReturnValue(true)
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      mockStateManager.getAccount.mockResolvedValue({ isEmpty: () => false })
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2700))
    })
  })

  describe('CALLCODE opcode (0xf2)', () => {
    const handler = dynamicGasHandlers.get(0xf2)!

    it('should calculate gas without value transfer', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(0),
        BigInt(0), BigInt(32), BigInt(0), BigInt(32)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(120))
      expect(mockRunState.messageGasLimit).toBe(BigInt(50000))
    })

    it('should add value transfer cost and stipend', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(100),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.param.mockReturnValueOnce(BigInt(9000)) // callValueTransfer
      mockCommon.param.mockReturnValueOnce(BigInt(2300)) // callStipend
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(9100))
      expect(mockRunState.messageGasLimit).toBe(BigInt(52300))
      expect(mockInterpreter.addStipend).toHaveBeenCalledWith(BigInt(2300))
    })

    it('should add EIP-2929 address access cost', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(0),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(true)
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2700))
    })

    it('should trap on insufficient gas', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(0),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockInterpreter.getGasLeft.mockReturnValue(BigInt(1000))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(1500))
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.OUT_OF_GAS)
    })
  })

  describe('RETURN opcode (0xf3)', () => {
    const handler = dynamicGasHandlers.get(0xf3)!

    it('should calculate memory expansion cost', async () => {
      mockStack.peek.mockReturnValue([BigInt(100), BigInt(64)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(20))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(120))
    })
  })

  describe('DELEGATECALL edge cases', () => {
    const handler = dynamicGasHandlers.get(0xf4)!

    it('should trap on insufficient gas', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockInterpreter.getGasLeft.mockReturnValue(BigInt(1000))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(1500))
      
      await expect(handler(mockRunState, BigInt(100), mockCommon))
        .rejects.toThrow(ERROR.OUT_OF_GAS)
    })
  })

  describe('STATICCALL edge cases', () => {
    const handler = dynamicGasHandlers.get(0xfa)!

    it('should add EIP-2929 address access cost', async () => {
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(true)
      ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(2700))
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle invalid opcode', () => {
      const handler = dynamicGasHandlers.get(0x99)
      expect(handler).toBeUndefined()
    })

    it('should verify LOG handlers are properly mapped', () => {
      const logHandler = dynamicGasHandlers.get(0xa0)
      expect(dynamicGasHandlers.get(0xa1)).toBe(logHandler)
      expect(dynamicGasHandlers.get(0xa2)).toBe(logHandler)
      expect(dynamicGasHandlers.get(0xa3)).toBe(logHandler)
      expect(dynamicGasHandlers.get(0xa4)).toBe(logHandler)
    })

    it('should handle memory expansion correctly', async () => {
      const handler = dynamicGasHandlers.get(0x51)! // MLOAD
      mockStack.peek.mockReturnValue([BigInt(2) ** BigInt(32) - BigInt(1)])
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(1000000))
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(1000100))
    })

    it('should handle empty account checks correctly', async () => {
      const handler = dynamicGasHandlers.get(0xf1)! // CALL
      mockStack.peek.mockReturnValue([
        BigInt(100000), BigInt(123), BigInt(100),
        BigInt(0), BigInt(0), BigInt(0), BigInt(0)
      ])
      mockCommon.isActivatedEIP.mockReturnValue(false)
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.param.mockReturnValueOnce(BigInt(9000))
      mockCommon.param.mockReturnValueOnce(BigInt(25000))
      mockCommon.param.mockReturnValueOnce(BigInt(2300))
      ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
      ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
      
      // Test with empty account
      mockStateManager.getAccount.mockResolvedValue({ isEmpty: () => true })
      
      const gas = await handler(mockRunState, BigInt(100), mockCommon)
      expect(gas).toBe(BigInt(34100))
    })
  })

  describe('Additional coverage tests', () => {
    describe('CODECOPY opcode (0x39)', () => {
      const handler = dynamicGasHandlers.get(0x39)!

      it('should calculate gas for zero length copy', async () => {
        mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(0)])
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(110))
      })

      it('should calculate gas for code copy', async () => {
        mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(64)])
        mockCommon.param.mockReturnValue(BigInt(3))
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(116)) // 100 + 10 + 6
      })
    })

    describe('EXTCODESIZE opcode (0x3b)', () => {
      const handler = dynamicGasHandlers.get(0x3b)!

      it('should return base gas without EIP-2929', async () => {
        mockStack.peek.mockReturnValue([BigInt(123)])
        mockCommon.isActivatedEIP.mockReturnValue(false)
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(100))
      })

      it('should add access cost with EIP-2929', async () => {
        mockStack.peek.mockReturnValue([BigInt(123)])
        mockCommon.isActivatedEIP.mockReturnValue(true)
        ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(2700))
      })
    })

    describe('EXTCODECOPY opcode (0x3c)', () => {
      const handler = dynamicGasHandlers.get(0x3c)!

      it('should calculate gas without EIP-2929', async () => {
        mockStack.peek.mockReturnValue([BigInt(123), BigInt(0), BigInt(0), BigInt(32)])
        mockCommon.isActivatedEIP.mockReturnValue(false)
        mockCommon.param.mockReturnValue(BigInt(3))
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(113)) // 100 + 10 + 3
      })

      it('should add EIP-2929 cost and handle zero length', async () => {
        mockStack.peek.mockReturnValue([BigInt(123), BigInt(0), BigInt(0), BigInt(0)])
        mockCommon.isActivatedEIP.mockReturnValue(true)
        ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(2710)) // 100 + 10 + 2600
      })

      it('should calculate gas with EIP-2929 and copy cost', async () => {
        mockStack.peek.mockReturnValue([BigInt(123), BigInt(0), BigInt(0), BigInt(64)])
        mockCommon.isActivatedEIP.mockReturnValue(true)
        mockCommon.param.mockReturnValue(BigInt(3))
        ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(2716)) // 100 + 10 + 2600 + 6
      })
    })

    describe('EXTCODEHASH opcode (0x3f)', () => {
      const handler = dynamicGasHandlers.get(0x3f)!

      it('should return base gas without EIP-2929', async () => {
        mockStack.peek.mockReturnValue([BigInt(123)])
        mockCommon.isActivatedEIP.mockReturnValue(false)
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(100))
      })

      it('should add access cost with EIP-2929', async () => {
        mockStack.peek.mockReturnValue([BigInt(123)])
        mockCommon.isActivatedEIP.mockReturnValue(true)
        ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(2700))
      })
    })

    describe('MSTORE opcode (0x52)', () => {
      const handler = dynamicGasHandlers.get(0x52)!

      it('should calculate memory expansion cost', async () => {
        mockStack.peek.mockReturnValue([BigInt(64)])
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(15))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(115))
      })
    })

    describe('MSTORE8 opcode (0x53)', () => {
      const handler = dynamicGasHandlers.get(0x53)!

      it('should calculate memory expansion cost for single byte', async () => {
        mockStack.peek.mockReturnValue([BigInt(1000)])
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(50))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(150))
      })
    })

    describe('SSTORE opcode - empty value handling', () => {
      const handler = dynamicGasHandlers.get(0x55)!

      it('should handle zero value (empty byte array)', async () => {
        mockStack.peek.mockReturnValue([BigInt(123), BigInt(0)])
        mockCommon.hardfork.mockReturnValue(Hardfork.Istanbul)
        mockCommon.gteHardfork.mockReturnValue(true)
        mockCommon.isActivatedEIP.mockReturnValue(false)
        ;(EIP2200.updateSstoreGasEIP2200 as jest.Mock).mockReturnValue(BigInt(5000))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(5100))
        
        // Verify empty value handling
        const calls = (EIP2200.updateSstoreGasEIP2200 as jest.Mock).mock.calls
        const valueArg = calls[0][3]
        expect(valueArg).toEqual(setLengthLeft(new Uint8Array([]), 32))
      })
    })

    describe('CREATE opcode - EIP-2929 handling', () => {
      const handler = dynamicGasHandlers.get(0xf0)!

      it('should add EIP-2929 access cost', async () => {
        mockStack.peek.mockReturnValue([BigInt(0), BigInt(0), BigInt(32)])
        mockCommon.isActivatedEIP.mockReturnValueOnce(true) // EIP-2929
        mockCommon.isActivatedEIP.mockReturnValueOnce(false) // EIP-3860
        ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
        ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(90000))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(2710)) // 100 + 2600 + 10
        expect(EIP2929.accessAddressEIP2929).toHaveBeenCalledWith(
          mockRunState,
          mockInterpreter.getAddress(),
          mockCommon,
          false
        )
      })
    })

    describe('CALLCODE opcode (0xf2)', () => {
      const handler = dynamicGasHandlers.get(0xf2)!

      it('should calculate gas without value transfer', async () => {
        mockStack.peek.mockReturnValue([
          BigInt(100000), BigInt(123), BigInt(0),
          BigInt(0), BigInt(32), BigInt(0), BigInt(32)
        ])
        mockCommon.isActivatedEIP.mockReturnValue(false)
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
        ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(120)) // 100 + 10 + 10
        expect(mockRunState.messageGasLimit).toBe(BigInt(50000))
      })

      it('should add value transfer cost and stipend', async () => {
        mockStack.peek.mockReturnValue([
          BigInt(100000), BigInt(123), BigInt(100),
          BigInt(0), BigInt(0), BigInt(0), BigInt(0)
        ])
        mockCommon.isActivatedEIP.mockReturnValue(false)
        mockCommon.param.mockReturnValueOnce(BigInt(9000)) // callValueTransfer
        mockCommon.param.mockReturnValueOnce(BigInt(2300)) // callStipend
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
        ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(9100)) // 100 + 9000
        expect(mockRunState.messageGasLimit).toBe(BigInt(52300)) // 50000 + 2300
        expect(mockInterpreter.addStipend).toHaveBeenCalledWith(BigInt(2300))
      })

      it('should add EIP-2929 address access cost', async () => {
        mockStack.peek.mockReturnValue([
          BigInt(100000), BigInt(123), BigInt(0),
          BigInt(0), BigInt(0), BigInt(0), BigInt(0)
        ])
        mockCommon.isActivatedEIP.mockReturnValue(true)
        ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
        ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(2700))
      })

      it('should trap on insufficient gas', async () => {
        mockStack.peek.mockReturnValue([
          BigInt(1000000), BigInt(123), BigInt(0),
          BigInt(0), BigInt(0), BigInt(0), BigInt(0)
        ])
        mockInterpreter.getGasLeft.mockReturnValue(BigInt(1000))
        mockCommon.isActivatedEIP.mockReturnValue(false)
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
        ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(1500))
        
        await expect(handler(mockRunState, BigInt(100), mockCommon))
          .rejects.toThrow(ERROR.OUT_OF_GAS)
      })
    })

    describe('RETURN opcode (0xf3)', () => {
      const handler = dynamicGasHandlers.get(0xf3)!

      it('should calculate memory expansion cost', async () => {
        mockStack.peek.mockReturnValue([BigInt(100), BigInt(200)])
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(50))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(150))
      })
    })

    describe('DELEGATECALL opcode - gas limit edge case', () => {
      const handler = dynamicGasHandlers.get(0xf4)!

      it('should trap when gas limit exceeds available gas', async () => {
        mockStack.peek.mockReturnValue([
          BigInt(100000), BigInt(123),
          BigInt(0), BigInt(0), BigInt(0), BigInt(0)
        ])
        mockInterpreter.getGasLeft.mockReturnValue(BigInt(1000))
        mockCommon.isActivatedEIP.mockReturnValue(false)
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
        ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(1100))
        
        await expect(handler(mockRunState, BigInt(100), mockCommon))
          .rejects.toThrow(ERROR.OUT_OF_GAS)
      })
    })

    describe('CREATE2 opcode - EIP handling', () => {
      const handler = dynamicGasHandlers.get(0xf5)!

      it('should handle all EIPs together', async () => {
        mockStack.peek.mockReturnValue([
          BigInt(0), BigInt(0), BigInt(64), BigInt(123)
        ])
        mockCommon.isActivatedEIP.mockReturnValueOnce(true) // EIP-2929
        mockCommon.isActivatedEIP.mockReturnValueOnce(true) // EIP-3860
        mockCommon.param.mockReturnValueOnce(BigInt(2)) // initCodeWordCost
        mockCommon.param.mockReturnValueOnce(BigInt(6)) // keccak256Word
        ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(10))
        ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(90000))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(2726)) // 100 + 10 + 2600 + 4 + 12
      })
    })

    describe('STATICCALL opcode - EIP-2929', () => {
      const handler = dynamicGasHandlers.get(0xfa)!

      it('should add EIP-2929 address access cost', async () => {
        mockStack.peek.mockReturnValue([
          BigInt(100000), BigInt(123),
          BigInt(0), BigInt(0), BigInt(0), BigInt(0)
        ])
        mockCommon.isActivatedEIP.mockReturnValue(true)
        ;(EIP2929.accessAddressEIP2929 as jest.Mock).mockReturnValue(BigInt(2600))
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(0))
        ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(50000))
        
        const gas = await handler(mockRunState, BigInt(100), mockCommon)
        expect(gas).toBe(BigInt(2700))
      })
    })

    describe('Final coverage tests', () => {
      it('CALL opcode should trap when total gas exceeds available gas', async () => {
        const handler = dynamicGasHandlers.get(0xf1)!
        mockStack.peek.mockReturnValue([
          BigInt(100000), BigInt(123), BigInt(0),
          BigInt(0), BigInt(0), BigInt(0), BigInt(0)
        ])
        mockInterpreter.getGasLeft.mockReturnValue(BigInt(500))
        mockCommon.isActivatedEIP.mockReturnValue(false)
        mockCommon.gteHardfork.mockReturnValue(false)
        ;(util.subMemUsage as jest.Mock).mockReturnValue(BigInt(400))
        mockStateManager.getAccount.mockResolvedValue(undefined)
        mockCommon.param.mockReturnValue(BigInt(25000))
        ;(util.maxCallGas as jest.Mock).mockReturnValue(BigInt(10))
        
        await expect(handler(mockRunState, BigInt(100), mockCommon))
          .rejects.toThrow(ERROR.OUT_OF_GAS)
      })

      it('CREATE2 opcode should trap in static context', async () => {
        const handler = dynamicGasHandlers.get(0xf5)!
        mockInterpreter.isStatic.mockReturnValue(true)
        
        await expect(handler(mockRunState, BigInt(100), mockCommon))
          .rejects.toThrow(ERROR.STATIC_STATE_CHANGE)
      })
    })
  })
})