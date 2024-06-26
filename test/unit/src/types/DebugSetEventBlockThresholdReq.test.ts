import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Debug set event block threshold req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        query: {
          threshold: '0x01',
        },
      },
      {
        query: {
          threshold: {},
        },
      },
    ]
    // const otherInvalidObject = [

    //     {
    //         query: {
    //             to: "0x01"
    //         }
    //     },
    // ]
    const validObjects = [
      {
        query: {
          threshold: 1,
        },
      },
      {
        query: {
          threshold: 2,
          gas: '0x01',
          gasPrice: '0x01',
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('DebugSetEventBlockThresholdReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be`)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    // test.each(otherInvalidObject)('should throw AJV error', (data) => {
    //     const res = verifyPayload('DebugSetEventBlockThresholdReq', {
    //         ...data,
    //     })
    //     console.log('res', res)
    //     expect(res!.length).toBeGreaterThan(0)
    //     expect(res![0].slice(0, 40)).toContain(`should have required property`)
    //     // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    // })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('DebugSetEventBlockThresholdReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
