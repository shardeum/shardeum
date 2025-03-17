import {
    isServiceMode,
    isArchiverMode,
    shardeumGetTime,
    getApplyTXState,
    shouldLoadNetworkConfigToNetworkAccount,
    setGenesisAccounts
} from '../../../src/index'

describe('Mode check functions', () => {
    describe('isServiceMode', () => {
        test('should return a boolean', () => {
            expect(typeof isServiceMode()).toBe('boolean')
        })
    })

    describe('isArchiverMode', () => {
        test('should return a boolean', () => {
            expect(typeof isArchiverMode()).toBe('boolean')
        })
    })
})

describe('Network configuration', () => {
    describe('shouldLoadNetworkConfigToNetworkAccount', () => {
        test('should return true for first seed', () => {
            expect(shouldLoadNetworkConfigToNetworkAccount(true)).toBe(true)
        })

        test('should return false for non-first seed', () => {
            expect(shouldLoadNetworkConfigToNetworkAccount(false)).toBe(false)
        })
    })

    describe('setGenesisAccounts', () => {
        test('should accept empty array', () => {
            expect(() => setGenesisAccounts()).not.toThrow()
        })

        test('should accept array of accounts', () => {
            const accounts = [
                { address: '0x123', balance: '1000000' },
                { address: '0x456', balance: '2000000' }
            ]
            expect(() => setGenesisAccounts(accounts as any)).not.toThrow()
        })
    })
})

describe('Transaction state management', () => {
    const mockTxId = 'test-tx-id'

    describe('getApplyTXState', () => {
        test('should return state object for valid txId', () => {
            const state = getApplyTXState(mockTxId)
            expect(state).toBeDefined()
            expect(typeof state).toBe('object')
        })

        test('should return different instances for different txIds', () => {
            const state1 = getApplyTXState('tx1')
            const state2 = getApplyTXState('tx2')
            expect(state1).not.toBe(state2)
        })
    })
})

describe('Time functions', () => {
    describe('shardeumGetTime', () => {
        test('should return current timestamp in milliseconds', () => {
            const time = shardeumGetTime()
            expect(typeof time).toBe('number')
            expect(time).toBeGreaterThan(0)
            expect(time).toBeLessThanOrEqual(Date.now())
        })
    })
}) 