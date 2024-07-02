import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Eth_getCode req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        query: {
          address: ['0x01'],
          blockNumber: null,
        },
      },
      {
        query: {
          address: {},
          blockNumber: null,
        },
      },
      {
        query: {
          address: {},
          blockNumber: 1,
        },
      },
    ]
    const otherInvalidObject = [
      {
        text: {
          // blockHash: 1,
        },
      },
    ]
    const validObjects = [
      {
        query: {
          address: '0x01',
          blockNumber: 'latest',
        },
      },
      {
        query: {
          address: '0x01',
          blockNumber: '0x02',
        },
      },
      {
        query: {
          address: '0x01',
          blockNumber: 'latest',
          to: '0x1',
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('EthGetCodeReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be `)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('EthGetCodeReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('EthGetCodeReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
