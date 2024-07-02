import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Dump storage req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        query: {
          id: 1,
          value: 1,
        },
      },
      {
        query: {
          key: 1,
          id: {},
        },
      },
    ]
    const otherInvalidObject = [
      {
        body: {
          to: '0x01',
        },
      },
    ]
    const validObjects = [
      {
        query: {
          id: '0x01',
          value: '0x02',
        },
      },
      {
        query: {
          id: '0x01',
          key: '0x01',
          value: '0x02',
          gasPrice: '0x01',
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('DumpStorageReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be`)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('DumpStorageReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('DumpStorageReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
