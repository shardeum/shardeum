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
          nodePublicKey: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
          cycle: 1,
        }
        const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, obj)
        expect(errors).toBeNull()
    })

    test('Valid object with sign and without signs should pass verification', () => {
      const obj = {
        nodePublicKey: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        cycle: 1,
        sign: {
          owner: '61f529902152b2f87afce2743eefab1ed18a7eefacdefdfd7826e7c5b11911a5', 
          sig: '6ba8db8f5bbd2b28a1f1e7f607df3600fc33384e71514121a96ca9f22262ec3feaabd38bd830521ce4a1da6051df60c410ee2309e217a11f66f03a287652ce08d930feab7950c93070a5dce9d105c06772021f4a0b9b6965369b357a7a501968',
        },
      }
      const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, obj)
      expect(errors).toBeNull()
    })

    test('Valid object with signs and without sign should pass verification', () => {
      const obj = {
        nodePublicKey: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        cycle: 1,
        signs: [
            {
            owner: '61f529902152b2f87afce2743eefab1ed18a7eefacdefdfd7826e7c5b11911a5', 
            sig: '6ba8db8f5bbd2b28a1f1e7f607df3600fc33384e71514121a96ca9f22262ec3feaabd38bd830521ce4a1da6051df60c410ee2309e217a11f66f03a287652ce08d930feab7950c93070a5dce9d105c06772021f4a0b9b6965369b357a7a501968',
          }
        ],
      }
      const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, obj)
      expect(errors).toBeNull()
    })

    test('Valid object with sign and signs should pass verification', () => {
      const obj = {
        nodePublicKey: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        cycle: 1,
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
      const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, obj)
      expect(errors).toBeNull()
    })

    test('Missing nodePublicKey field should fail validation', () => {
        const obj = {
          cycle: 1,
        }
        const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'nodePublicKey': {\"missingProperty\":\"nodePublicKey\"}")
    })

    test('Missing cycle field should fail validation', () => {
        const obj = {
          nodePublicKey: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        }
        const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'cycle': {\"missingProperty\":\"cycle\"}")
    })

    test('Wrong type for nodePublicKey should fail validation', () => {
        const obj = {
          nodePublicKey: 1,
          cycle: 1,
        }
        const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should be string: {\"type\":\"string\"}")
    })

    test('Wrong type for cycle should fail validation', () => {
        const obj = {
          nodePublicKey: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
          cycle: '1',
        }
        const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should be number: {\"type\":\"number\"}")
    })

    test('Additional properties should fail validation', () => {
      const obj = {
        nodePublicKey: '0xb86a2d3a92484e3325968bde291268de7d8b7cd0',
        cycle: 1,
        extraField: 'should not be here'
      }

      const errors = verifyPayload(AJVSchemaEnum.RemoveNodeCert, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain("should NOT have additional properties: {\"additionalProperty\":\"extraField\"}")
    })
})
