import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Eth_getBlockHashes req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        query: {
          fromBlock: {},
        },
      },
      {
        query: {
          fromBlock: 1,
          toBlock: {},
        },
      },
      {
        query: {
          fromBlock: null,
        },
      },
    ]
    const otherInvalidObject = [
      {
        query: {
          // fromBlock: 1,
          toBlock: {},
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
          fromBlock: '0x021',
          toBlock: 'latest',
        },
      },
      {
        query: {
          fromBlock: '0x021',
          toBlock: null,
        },
      },
      {
        query: {
          fromBlock: '0x021',
          toBlock: 100,
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('EthGetBlockHashesReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be `)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('EthGetBlockHashesReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('EthGetBlockHashesReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
