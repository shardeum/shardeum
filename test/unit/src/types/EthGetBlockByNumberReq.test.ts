import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Eth_getBlockByNumber req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        query: {
          blockNumber: {},
        },
      },
      {
        query: {
          blockNumber: 1,
        },
      },
      {
        query: {
          blockNumber: null,
        },
      },
    ]
    const otherInvalidObject = [
      {
        query: {
          // blockHash: 1,
        },
      },
      {
        text: {
          // blockHash: 1,
        },
      },
    ]
    const validObjects = [
      {
        query: {
          blockNumber: '0x0c1',
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('EthGetBlockByNumberReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be `)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('EthGetBlockByNumberReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('EthGetBlockByNumberReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
