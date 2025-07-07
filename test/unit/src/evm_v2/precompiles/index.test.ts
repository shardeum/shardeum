import { Hardfork } from '@ethereumjs/common'
import { Address, hexToBytes } from '@ethereumjs/util'
import { 
  getActivePrecompiles, 
  precompileEntries, 
  precompiles,
  ripemdPrecompileAddress 
} from '../../../../../src/evm_v2/precompiles/index'
import { precompile01 } from '../../../../../src/evm_v2/precompiles/01-ecrecover'
import { precompile02 } from '../../../../../src/evm_v2/precompiles/02-sha256'
import { precompile03 } from '../../../../../src/evm_v2/precompiles/03-ripemd160'
import { precompile04 } from '../../../../../src/evm_v2/precompiles/04-identity'
import { precompile05 } from '../../../../../src/evm_v2/precompiles/05-modexp'
import { precompile06 } from '../../../../../src/evm_v2/precompiles/06-ecadd'
import { precompile07 } from '../../../../../src/evm_v2/precompiles/07-ecmul'
import { precompile08 } from '../../../../../src/evm_v2/precompiles/08-ecpairing'
import { precompile09 } from '../../../../../src/evm_v2/precompiles/09-blake2f'
import { precompile0a } from '../../../../../src/evm_v2/precompiles/0a-kzg-point-evaluation'
import type { Common } from '@ethereumjs/common'
import type { PrecompileFunc } from '../../../../../src/evm_v2/precompiles/types'

describe('Precompiles Registry', () => {
  let mockCommon: jest.Mocked<Common>

  beforeEach(() => {
    mockCommon = {
      gteHardfork: jest.fn(),
      isActivatedEIP: jest.fn(),
    } as any
  })

  describe('precompileEntries', () => {
    it('should contain all 10 precompiles', () => {
      expect(precompileEntries).toHaveLength(10)
    })

    it('should have correct addresses', () => {
      const addresses = precompileEntries.map(entry => entry.address)
      expect(addresses).toEqual([
        '0000000000000000000000000000000000000001',
        '0000000000000000000000000000000000000002',
        '0000000000000000000000000000000000000003',
        '0000000000000000000000000000000000000004',
        '0000000000000000000000000000000000000005',
        '0000000000000000000000000000000000000006',
        '0000000000000000000000000000000000000007',
        '0000000000000000000000000000000000000008',
        '0000000000000000000000000000000000000009',
        '000000000000000000000000000000000000000a',
      ])
    })

    it('should have correct hardfork checks', () => {
      const hardforkChecks = precompileEntries
        .filter(entry => 'type' in entry.check && 'param' in entry.check && typeof entry.check.param === 'string')
        .map(entry => entry.check.param)
      
      expect(hardforkChecks).toContain(Hardfork.Chainstart)
      expect(hardforkChecks).toContain(Hardfork.Byzantium)
      expect(hardforkChecks).toContain(Hardfork.Istanbul)
    })

    it('should have correct EIP checks', () => {
      const eipChecks = precompileEntries
        .filter(entry => 'type' in entry.check && 'param' in entry.check && typeof entry.check.param === 'number')
        .map(entry => entry.check.param)
      
      expect(eipChecks).toContain(4844)
    })
  })

  describe('precompiles object', () => {
    it('should contain all 10 precompile functions', () => {
      expect(Object.keys(precompiles)).toHaveLength(10)
    })

    it('should map addresses to correct functions', () => {
      expect(precompiles['0000000000000000000000000000000000000001']).toBe(precompile01)
      expect(precompiles['0000000000000000000000000000000000000002']).toBe(precompile02)
      expect(precompiles[ripemdPrecompileAddress]).toBe(precompile03)
      expect(precompiles['0000000000000000000000000000000000000004']).toBe(precompile04)
      expect(precompiles['0000000000000000000000000000000000000005']).toBe(precompile05)
      expect(precompiles['0000000000000000000000000000000000000006']).toBe(precompile06)
      expect(precompiles['0000000000000000000000000000000000000007']).toBe(precompile07)
      expect(precompiles['0000000000000000000000000000000000000008']).toBe(precompile08)
      expect(precompiles['0000000000000000000000000000000000000009']).toBe(precompile09)
      expect(precompiles['000000000000000000000000000000000000000a']).toBe(precompile0a)
    })
  })

  describe('getActivePrecompiles', () => {
    it('should return empty map when no precompiles are active', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const result = getActivePrecompiles(mockCommon)

      expect(result.size).toBe(0)
    })

    it('should return Chainstart precompiles', () => {
      mockCommon.gteHardfork.mockImplementation((hardfork) => {
        return hardfork === Hardfork.Chainstart
      })
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const result = getActivePrecompiles(mockCommon)

      expect(result.size).toBe(4)
      expect(result.has('0000000000000000000000000000000000000001')).toBe(true)
      expect(result.has('0000000000000000000000000000000000000002')).toBe(true)
      expect(result.has('0000000000000000000000000000000000000003')).toBe(true)
      expect(result.has('0000000000000000000000000000000000000004')).toBe(true)
    })

    it('should return Byzantium precompiles', () => {
      mockCommon.gteHardfork.mockImplementation((hardfork) => {
        return hardfork === Hardfork.Chainstart || hardfork === Hardfork.Byzantium
      })
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const result = getActivePrecompiles(mockCommon)

      expect(result.size).toBe(8)
      expect(result.has('0000000000000000000000000000000000000005')).toBe(true)
      expect(result.has('0000000000000000000000000000000000000006')).toBe(true)
      expect(result.has('0000000000000000000000000000000000000007')).toBe(true)
      expect(result.has('0000000000000000000000000000000000000008')).toBe(true)
    })

    it('should return Istanbul precompiles', () => {
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const result = getActivePrecompiles(mockCommon)

      expect(result.size).toBe(9)
      expect(result.has('0000000000000000000000000000000000000009')).toBe(true)
    })

    it('should return EIP-4844 precompiles when activated', () => {
      mockCommon.gteHardfork.mockReturnValue(true)
      mockCommon.isActivatedEIP.mockImplementation((eip) => eip === 4844)

      const result = getActivePrecompiles(mockCommon)

      expect(result.size).toBe(10)
      expect(result.has('000000000000000000000000000000000000000a')).toBe(true)
    })

    it('should handle custom precompiles - add new precompile', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const customAddress = new Address(hexToBytes('0x0000000000000000000000000000000000000042'))
      const customFunction: PrecompileFunc = jest.fn()

      const customPrecompiles = [{
        address: customAddress,
        function: customFunction,
      }]

      const result = getActivePrecompiles(mockCommon, customPrecompiles)

      expect(result.size).toBe(1)
      expect(result.has('0000000000000000000000000000000000000042')).toBe(true)
      expect(result.get('0000000000000000000000000000000000000042')).toBe(customFunction)
    })

    it('should handle custom precompiles - delete existing precompile', () => {
      mockCommon.gteHardfork.mockImplementation((hardfork) => {
        return hardfork === Hardfork.Chainstart
      })
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const deleteAddress = new Address(hexToBytes('0x0000000000000000000000000000000000000001'))

      const customPrecompiles = [{
        address: deleteAddress,
      }]

      const result = getActivePrecompiles(mockCommon, customPrecompiles)

      expect(result.size).toBe(4)
      expect(result.has('0000000000000000000000000000000000000001')).toBe(true)
      expect(result.get('0000000000000000000000000000000000000001')).toBeUndefined()
    })

    it('should handle custom precompiles - override existing precompile', () => {
      mockCommon.gteHardfork.mockImplementation((hardfork) => {
        return hardfork === Hardfork.Chainstart
      })
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const overrideAddress = new Address(hexToBytes('0x0000000000000000000000000000000000000001'))
      const customFunction: PrecompileFunc = jest.fn()

      const customPrecompiles = [{
        address: overrideAddress,
        function: customFunction,
      }]

      const result = getActivePrecompiles(mockCommon, customPrecompiles)

      expect(result.size).toBe(4)
      expect(result.has('0000000000000000000000000000000000000001')).toBe(true)
      expect(result.get('0000000000000000000000000000000000000001')).toBe(customFunction)
      expect(result.get('0000000000000000000000000000000000000001')).not.toBe(precompile01)
    })

    it('should handle multiple custom precompiles', () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      mockCommon.isActivatedEIP.mockReturnValue(false)

      const address1 = new Address(hexToBytes('0x0000000000000000000000000000000000000100'))
      const address2 = new Address(hexToBytes('0x0000000000000000000000000000000000000200'))
      const function1: PrecompileFunc = jest.fn()
      const function2: PrecompileFunc = jest.fn()

      const customPrecompiles = [
        { address: address1, function: function1 },
        { address: address2, function: function2 },
      ]

      const result = getActivePrecompiles(mockCommon, customPrecompiles)

      expect(result.size).toBe(2)
      expect(result.get('0000000000000000000000000000000000000100')).toBe(function1)
      expect(result.get('0000000000000000000000000000000000000200')).toBe(function2)
    })
  })

  describe('ripemdPrecompileAddress', () => {
    it('should be correctly exported', () => {
      expect(ripemdPrecompileAddress).toBe('0000000000000000000000000000000000000003')
    })
  })
})