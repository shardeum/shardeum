import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Debug set service point req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        query: {
          key1: 1,
          key2: 1,
          value: 1,
        },
      },
      {
        query: {
          key1: '1',
          key2: '0x01',
          value: 1,
        },
      },
      {
        query: {
          key1: '1',
          key2: {},
          value: '0x01',
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
          key1: '0x01',
          key2: '0x02',
          value: '0x01',
        },
      },
      {
        query: {
          key1: '0x01',
          key2: '0x02',
          value: '0x01',
          gasPrice: '0x01',
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('DebugSetServicePointReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be`)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('DebugSetServicePointReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('DebugSetServicePointReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
