import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'

describe('StakeCert AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object without sign and signs should pass verification', () => {
        const obj = {
          nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
          nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
          stake: BigInt("10000000000000000000"),
          certExp: 1740003179858,
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
        expect(errors).toBeNull()
    })

    test('Valid object with sign and without signs should pass verification', () => {
      const obj = {
        nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
        stake: BigInt("10000000000000000000"),
        certExp: 1740003179858,
        sign: {
          owner: '61f529902152b2f87afce2743eefab1ed18a7eefacdefdfd7826e7c5b11911a5', 
          sig: '6ba8db8f5bbd2b28a1f1e7f607df3600fc33384e71514121a96ca9f22262ec3feaabd38bd830521ce4a1da6051df60c410ee2309e217a11f66f03a287652ce08d930feab7950c93070a5dce9d105c06772021f4a0b9b6965369b357a7a501968',
        },
      }
      const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
      expect(errors).toBeNull()
    })

    test('Valid object with signs and without sign should pass verification', () => {
      const obj = {
        nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
        stake: BigInt("10000000000000000000"),
        certExp: 1740003179858,
        signs: [
            {
            owner: '61f529902152b2f87afce2743eefab1ed18a7eefacdefdfd7826e7c5b11911a5', 
            sig: '6ba8db8f5bbd2b28a1f1e7f607df3600fc33384e71514121a96ca9f22262ec3feaabd38bd830521ce4a1da6051df60c410ee2309e217a11f66f03a287652ce08d930feab7950c93070a5dce9d105c06772021f4a0b9b6965369b357a7a501968',
          }
        ],
      }
      const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
      expect(errors).toBeNull()
    })

    test('Valid object with sign and signs should pass verification', () => {
      const obj = {
        nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
        stake: BigInt("10000000000000000000"),
        certExp: 1740003179858,
        sign: {
          owner: '61f529902152b2f87afce2743eefab1ed18a7eefacdefdfd7826e7c5b11911a5', 
          sig: '6ba8db8f5bbd2b28a1f1e7f607df3600fc33384e71514121a96ca9f22262ec3feaabd38bd830521ce4a1da6051df60c410ee2309e217a11f66f03a287652ce08d930feab7950c93070a5dce9d105c06772021f4a0b9b6965369b357a7a501968',
        },
        signs: [
          {
          owner: '61f529902152b2f87afce2743eefab1ed18a7eefacdefdfd7826e7c5b11911a5', 
          sig: '6ba8db8f5bbd2b28a1f1e7f607df3600fc33384e71514121a96ca9f22262ec3feaabd38bd830521ce4a1da6051df60c410ee2309e217a11f66f03a287652ce08d930feab7950c93070a5dce9d105c06772021f4a0b9b6965369b357a7a501968',
        }
        ],
      }
      const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
      expect(errors).toBeNull()
    })

    test('Missing nominator field should fail validation', () => {
        const obj = {
          nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
          stake: BigInt("10000000000000000000"),
          certExp: 1740003179858,
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'nominator': {\"missingProperty\":\"nominator\"}")
    })

    test('Missing nominee field should fail validation', () => {
        const obj = {
          nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
          stake: BigInt("10000000000000000000"),
          certExp: 1740003179858,
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'nominee': {\"missingProperty\":\"nominee\"}")
    })

    test('Missing stake field should fail validation', () => {
      const obj = {
        nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
        certExp: 1740003179858,
      }
      const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain("should have required property 'stake': {\"missingProperty\":\"stake\"}")
    })

    test('Missing certExp field should fail validation', () => {
      const obj = {
        nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
        stake: BigInt("10000000000000000000"),
      }
      const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain("should have required property 'certExp': {\"missingProperty\":\"certExp\"}")
    })

    test('Wrong type for nominator should fail validation', () => {
        const obj = {
          nominator: 111111,
          nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
          stake: BigInt("10000000000000000000"),
          certExp: 1740003179858,
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should be string: {\"type\":\"string\"}")
    })

    test('Wrong type for nominee should fail validation', () => {
        const obj = {
          nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
          nominee: 111111,
          stake: BigInt("10000000000000000000"),
          certExp: 1740003179858,
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should be string: {\"type\":\"string\"}")
    })

    test('Wrong type for stake should fail validation', () => {
      const obj = {
        nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
        stake: "10000000000000000000",
        certExp: 1740003179858,
      }
      const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      console.log('errors', errors)
      expect(errors?.[0]).toContain("should pass \"isBigInt\" keyword validation: {\"keyword\":\"isBigInt\"}")
    })

    test('Wrong type for certExp should fail validation', () => {
      const obj = {
        nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
        stake: BigInt("10000000000000000000"),
        certExp: '1740003179858',
      }
      const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain("should be number: {\"type\":\"number\"}")
    })

    test('Additional properties should fail validation', () => {
      const obj = {
        nominator: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        nominee: '3bc437d69166fed6b9a071020f67e10e7be54d00b753f5ae8923f193ba683c4a',
        stake: BigInt("10000000000000000000"),
        certExp: 1740003179858,
        extraField: 'should not be here'
      }

      const errors = verifyPayload(AJVSchemaEnum.StakeCert, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain("should NOT have additional properties: {\"additionalProperty\":\"extraField\"}")
    })
})
