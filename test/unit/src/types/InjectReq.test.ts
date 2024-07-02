import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Inject req test', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    describe('Data validation Cases', () => {
        const invalidObjects = [
            {
                // sender: '0x0',
                user: {},
            },

        ]
        const otherInvalidObject = [
            {
                timestamp: null,
                accountId: 'c',
            },
            {
                timestamp: '0x0',
            },
        ]
        const validObjects = [
            {
                timestamp: 1719305344,
            },
            {
                sender: '0x0',
                sign: {
                    owner: '0x1',
                    sig: '0x1',
                },
                timestamp: 2,
                accountId: '0x1',
            },
        ]
        test.each(invalidObjects)('should throw AJV error', (data) => {
            const res = verifyPayload('InjectReq', {
                ...data,
            })
            console.log('res', res!)
            expect(res!.length).toBeGreaterThan(0)
            expect(res![0].slice(0, 40)).toContain(`should have required property`)
            // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
        })
        test.each(otherInvalidObject)('should throw AJV error', (data) => {
            const res = verifyPayload('InjectReq', {
                ...data,
            })
            console.log('res', res!)
            expect(res!.length).toBeGreaterThan(0)
            expect(res![0].slice(0, 40)).toContain(`should be number`)
            // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
        })
        test.each(validObjects)('should have no AJV error', (data) => {
            const res = verifyPayload('InjectReq', {
                ...data,
            })
            console.log('res', res!)
            expect(res).toEqual(null)
        })
    })
})