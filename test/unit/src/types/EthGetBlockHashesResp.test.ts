import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Eth_getBlockHashes resp test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        fromBlock: {},
        toBlock: {},
        blockHashes: ['0x01'],
      },
      {
        fromBlock: 1,
        toBlock: {},
        blockHashes: ['0x01'],
      },
      {
        fromBlock: {},
        toBlock: {},
        blockHashes: null,
      },
    ]
    const otherInvalidObject = [
      {
        fromBlock: 1,
        toBlock: 'latest',
      },
      {
        text: {
          // blockHash: 1,
        },
      },
    ]
    const validObjects = [
      {
        fromBlock: '0xc1',
        toBlock: '0xd1',
        blockHashes: ['0x01'],
      },
      {
        fromBlock: '0xc1',
        toBlock: null,
        blockHashes: ['0x01'],
      },
      {
        fromBlock: '0xc1',
        toBlock: 'latest',
        blockHashes: ['0x01'],
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('EthGetBlockHashesResp', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be `)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('EthGetBlockHashesResp', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('EthGetBlockHashesResp', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
