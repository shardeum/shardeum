import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Contract estimate gas req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        params: {
          from: '0x01',
        },
      },
      {
        params: {
          to: '0x01',
        },
      },
      {
        params: {
          data: '0x01',
          gas: '0x01',
        },
      },
    ]
    const otherInvalidObject = [
      {
        params: {
          from: {},
          to: {},
        },
      },
      {
        params: {
          from: '0x01',
          to: '0x01',
          gas: 1,
        },
      },
      {
        params: {
          from: '0x01',
          to: '0x01',
          gas: '0x01',
          gasPrice: 1,
        },
      },
    ]
    const validObjects = [
      {
        body: {
          from: '0x01',
          to: '0x01',
        },
      },
      {
        body: {
          from: '0x01',
          to: '0x01',
          gas: '0x01',
          gasPrice: '0x01',
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('ContractEstimateGasReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property `)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('ContractEstimateGasReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('ContractEstimateGasReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
