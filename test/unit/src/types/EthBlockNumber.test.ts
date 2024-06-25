import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Account req test', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    describe('Data validation Cases', () => {
        const invalidObjects = [
            {
                // sender: '0x0',
                sign: {},
            },
            {
                sender: '0x0',
                // sign: {},
            },
        ]
        const otherInvalidObject = [
            {
                sender: '0x0',
                sign: {},
                start: 'a',
                end: 'b',
                accountId: 'c',
            },
        ]
        const validObjects = [
            {
                sender: '0x0',
                sign: {
                    owner: '0x1',
                    sig: '0x1',
                },
            },
            {
                sender: '0x0',
                sign: {
                    owner: '0x1',
                    sig: '0x1',
                },
                start: 2,
                end: 0,
                accountId: '0x1',
            },
        ]
        test.each(invalidObjects)('should throw AJV error', (data) => {
            const res = verifyPayload('AccountReq', {
                start: 0,
                end: 0,
                count: 0,
                ...data,
            })
            console.log('res', res)
            expect(res.length).toBeGreaterThan(0)
            expect(res[0].slice(0, 40)).toContain(`should have required property`)
            // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
        })
        test.each(otherInvalidObject)('should throw AJV error', (data) => {
            const res = verifyPayload('AccountReq', {
                ...data,
            })
            console.log('res', res)
            expect(res.length).toBeGreaterThan(0)
            expect(res[0].slice(0, 40)).toContain(`should be number,null`)
            // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
        })
        test.each(validObjects)('should have no AJV error', (data) => {
            const res = verifyPayload('AccountReq', {
                ...data,
            })
            console.log('res', res)
            expect(res).toEqual(null)
        })
    })
})
