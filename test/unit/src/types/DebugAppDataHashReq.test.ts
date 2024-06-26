import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Debug appData hash gas req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        params: {
          hash: 1,
        },
      },
      {
        params: {
          hash: {},
        },
      },
    ]
    const otherInvalidObject = [
      {
        params: {},
      },
    ]
    const validObjects = [
      {
        params: {
          hash: '0x01',
          to: '0x01',
        },
      },
      {
        params: {
          hash: '0x01',
          gas: '0x01',
          gasPrice: '0x01',
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('DebugAppDataHashReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be`)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('DebugAppDataHashReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('DebugAppDataHashReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
