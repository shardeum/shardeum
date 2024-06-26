import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Query certificate req test', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  describe('Data validation Cases', () => {
    const invalidObjects = [
      {
        body: {
          nominee: ['0x01'],
          nominator: null,
          sign: null,
        },
      },
      {
        body: {
          nominee: ['0x01'],
          nominator: null,
          sign: {},
        },
      },
      {
        body: {
          nominee: ['0x01'],
          nominator: {},
          sign: {
            owner: '0x01',
            sig: '0x02',
          },
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
        body: {
          nominee: '0x01',
          nominator: '0x02',
          sign: {
            owner: '0x01',
            sig: '0x02',
          },
        },
      },
      {
        body: {
          nominee: '0x01',
          nominator: '0x02',
          sign: {
            owner: '0x01',
            sig: '0x02',
          },
          type: 1,
        },
      },
      {
        body: {
          nominee: '0x01',
          nominator: '0x02',
          sign: {
            owner: '0x01',
            sig: '0x02',
          },
        },
      },
    ]
    test.each(invalidObjects)('should throw AJV error', (data) => {
      const res = verifyPayload('QueryCertificateReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should be `)
      // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
    })
    test.each(otherInvalidObject)('should throw AJV error', (data) => {
      const res = verifyPayload('QueryCertificateReq', {
        ...data,
      })
      console.log('res', res)
      expect(res!.length).toBeGreaterThan(0)
      expect(res![0].slice(0, 40)).toContain(`should have required property`)
      // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
    })
    test.each(validObjects)('should have no AJV error', (data) => {
      const res = verifyPayload('QueryCertificateReq', {
        ...data,
      })
      console.log('res', res)
      expect(res).toEqual(null)
    })
  })
})
