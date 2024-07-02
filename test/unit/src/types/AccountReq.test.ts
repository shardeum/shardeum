import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Account req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        params: {
          address: {},
        },
      },
      {
        params: {
          address: 1,
        },
      },
      {
        params: {
          address: null,
        },
      },
    ]
    // const otherInvalidObject = [
    //   {
    //     text: {
    //       // blockHash: 1,
    //     },
    //   },
    // ]
    const validObjects = [
      {
        params: {
          address: '0x01',
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('AccountAddressReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be `)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    // test.each(otherInvalidObject)('should throw AJV error', (data) => {
    //     const res = verifyPayload('AccountAddressReq', {
    //         ...data,
    //     })
    //     console.log('res', res)
    //     expect(res!.length).toBeGreaterThan(0)
    //     expect(res![0].slice(0, 40)).toContain(`should have required property`)
    //     // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    // })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('AccountAddressReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
