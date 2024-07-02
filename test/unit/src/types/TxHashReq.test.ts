import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Tx hash req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        params: {
          hash: ['0x01'],
        },
      },
      {
        params: {
          hash: {},
        },
      },
      {
        params: {
          hash: null,
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
        params: {
          hash: '0x01',
        },
      },
      {
        params: {
          hash: '0x01',
          sign: {
            owner: '0x01',
            sig: '0x02',
          },
          type: 1,
        },
      },
      {
        params: {},
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('TxHashReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be `)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('TxHashReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('TxHashReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
