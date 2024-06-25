import { initAjvSchemas, verifyPayload } from '../../../../src/types/ajv/Helpers'

describe('Inject response test', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    describe('Data validation Cases', () => {
        const invalidObjects = [
            {
                success: false,
                reason: "not connect",
                txId: "0x01",
            },
            {
                reason: "not connect",
                status: 1,
            },
            {
                success: true,
                status: 1,
                txId: "0x01"
            },

        ]
        const otherInvalidObject = [
            {
                success: false,
                status: 1,
                reason: "not connect",
                txId: 1
            },
            {
                success: false,
                status: 1,
                reason: {},
                txId: 1
            },
            {
                success: "false",
                status: 1,
                reason: {},
                txId: 1
            },
            {
                success: false,
                status: 1,
                reason: "not connected",
                txId: 1
            },
        ]
        const validObjects = [
            {
                success: true,
                status: 200,
                reason: "not connected",
            },
            {
                success: false,
                status: 1,
                reason: "not connected",
                txId: "0x01"
            },
        ]
        test.each(invalidObjects)('should throw AJV error', (data) => {
            const res = verifyPayload('InjectResp', {
                ...data,
            })
            console.log('res', res!)
            expect(res!.length).toBeGreaterThan(0)
            expect(res![0].slice(0, 40)).toContain(`should have required property`)
            // expect(res[0]).toEqual(`should have required property 'sender': {"missingProperty":"sender"}`)
        })
        test.each(otherInvalidObject)('should throw AJV error', (data) => {
            const res = verifyPayload('InjectResp', {
                ...data,
            })
            console.log('res', res!)
            expect(res!.length).toBeGreaterThan(0)
            expect(res![0].slice(0, 40)).toContain(`should be `)
            // expect(res[0]).toEqual(`should be number,null: {"type":"number,null"}`)
        })
        test.each(validObjects)('should have no AJV error', (data) => {
            const res = verifyPayload('InjectResp', {
                ...data,
            })
            console.log('res', res!)
            expect(res).toEqual(null)
        })
    })
})