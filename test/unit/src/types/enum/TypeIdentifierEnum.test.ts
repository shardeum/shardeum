import { TypeIdentifierEnum } from '../../../../../src/types/enum/TypeIdentifierEnum'

describe('TypeIdentifierEnum', () => {
    test('should have correct values for account types', () => {
        // Check base account type
        expect(TypeIdentifierEnum.cBaseAccount).toBe(1)

        // Check EVM account types
        expect(TypeIdentifierEnum.cEVMAccount).toBe(2)
        expect(TypeIdentifierEnum.cWrappedEVMAccount).toBe(3)

        // Check special account types
        expect(TypeIdentifierEnum.cDevAccount).toBe(4)
        expect(TypeIdentifierEnum.cNetworkAccount).toBe(5)

        // Check node account types
        expect(TypeIdentifierEnum.cNodeAccountStats).toBe(6)
        expect(TypeIdentifierEnum.cNodeAccount).toBe(7)
        expect(TypeIdentifierEnum.cNodeAccount2).toBe(8)

        // Check secure account type
        expect(TypeIdentifierEnum.cSecureAccount).toBe(13)

        // Check unknown type
        expect(TypeIdentifierEnum.cUnknown).toBe(14)

        // Negative test cases
        expect(TypeIdentifierEnum.cBaseAccount).not.toBe(2)
        expect(TypeIdentifierEnum.cEVMAccount).not.toBe(1)
        expect(TypeIdentifierEnum.cWrappedEVMAccount).not.toBe(2)
        expect(TypeIdentifierEnum.cDevAccount).not.toBe(3)
        expect(TypeIdentifierEnum.cNetworkAccount).not.toBe(4)
        expect(TypeIdentifierEnum.cNodeAccountStats).not.toBe(7)
        expect(TypeIdentifierEnum.cNodeAccount).not.toBe(6)
        expect(TypeIdentifierEnum.cNodeAccount2).not.toBe(7)
        expect(TypeIdentifierEnum.cSecureAccount).not.toBe(12)
        expect(TypeIdentifierEnum.cUnknown).not.toBe(13)
    })

    test('should have unique values for each type', () => {
        const values = Object.values(TypeIdentifierEnum).filter(v => typeof v === 'number')
        const uniqueValues = new Set(values)
        expect(uniqueValues.size).toBe(values.length)

        // Negative test - check that adding duplicate values changes set size
        const valuesWithDuplicate = [...values, values[0]]
        const uniqueValuesWithDuplicate = new Set(valuesWithDuplicate)
        expect(uniqueValuesWithDuplicate.size).not.toBe(valuesWithDuplicate.length)
    })

    test('should have correct string representations', () => {
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cBaseAccount]).toBe('cBaseAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cEVMAccount]).toBe('cEVMAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cWrappedEVMAccount]).toBe('cWrappedEVMAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cDevAccount]).toBe('cDevAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cNetworkAccount]).toBe('cNetworkAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cNodeAccountStats]).toBe('cNodeAccountStats')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cNodeAccount]).toBe('cNodeAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cNodeAccount2]).toBe('cNodeAccount2')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cSecureAccount]).toBe('cSecureAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cUnknown]).toBe('cUnknown')

        // Negative test cases
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cBaseAccount]).not.toBe('BaseAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cEVMAccount]).not.toBe('EVMAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cWrappedEVMAccount]).not.toBe('WrappedEVMAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cDevAccount]).not.toBe('DevAccount')
        expect(TypeIdentifierEnum[TypeIdentifierEnum.cNetworkAccount]).not.toBe('NetworkAccount')
    })

    test('should handle invalid values', () => {
        // Test that invalid values don't match any enum
        expect(TypeIdentifierEnum[0]).toBeUndefined()
        expect(TypeIdentifierEnum[15]).toBeUndefined()
        expect(TypeIdentifierEnum[-1]).toBeUndefined()

        // Negative test cases - check that valid values are not undefined
        expect(TypeIdentifierEnum[1]).not.toBeUndefined()
        expect(TypeIdentifierEnum[2]).not.toBeUndefined()
        expect(TypeIdentifierEnum[13]).not.toBeUndefined()
    })

    test('should have correct numeric range', () => {
        // Check that all values are positive integers
        const numericValues = Object.values(TypeIdentifierEnum).filter(v => typeof v === 'number')
        expect(numericValues.every(v => v > 0 && Number.isInteger(v))).toBe(true)

        // Negative test cases
        expect(numericValues.some(v => v <= 0)).toBe(false)
        expect(numericValues.some(v => !Number.isInteger(v))).toBe(false)
        expect(numericValues.some(v => v > 100)).toBe(false)
    })

    test('should have consistent naming pattern', () => {
        // Check that all enum keys follow the 'c' prefix naming convention
        const keys = Object.keys(TypeIdentifierEnum).filter(k => isNaN(Number(k)))
        expect(keys.every(k => k.startsWith('c'))).toBe(true)

        // Negative test cases
        expect(keys.some(k => k.startsWith('d'))).toBe(false)
        expect(keys.some(k => !k.startsWith('c'))).toBe(false)
    })

    test('should have correct type relationships', () => {
        // Check relationships between account types
        expect(TypeIdentifierEnum.cEVMAccount).toBeGreaterThan(TypeIdentifierEnum.cBaseAccount)
        expect(TypeIdentifierEnum.cWrappedEVMAccount).toBeGreaterThan(TypeIdentifierEnum.cEVMAccount)

        // Check node account relationships
        expect(TypeIdentifierEnum.cNodeAccount).toBeGreaterThan(TypeIdentifierEnum.cNodeAccountStats)
        expect(TypeIdentifierEnum.cNodeAccount2).toBeGreaterThan(TypeIdentifierEnum.cNodeAccount)

        // Negative test cases
        expect(TypeIdentifierEnum.cBaseAccount).not.toBeGreaterThan(TypeIdentifierEnum.cEVMAccount)
        expect(TypeIdentifierEnum.cEVMAccount).not.toBeGreaterThan(TypeIdentifierEnum.cWrappedEVMAccount)
        expect(TypeIdentifierEnum.cNodeAccountStats).not.toBeGreaterThan(TypeIdentifierEnum.cNodeAccount)
        expect(TypeIdentifierEnum.cNodeAccount).not.toBeGreaterThan(TypeIdentifierEnum.cNodeAccount2)
    })

    test('should be usable in switch statements', () => {
        // Test enum usage in switch statements
        function getAccountDescription(type: TypeIdentifierEnum): string {
            switch (type) {
                case TypeIdentifierEnum.cBaseAccount:
                    return 'Base Account'
                case TypeIdentifierEnum.cEVMAccount:
                    return 'EVM Account'
                case TypeIdentifierEnum.cWrappedEVMAccount:
                    return 'Wrapped EVM Account'
                default:
                    return 'Other Account Type'
            }
        }

        expect(getAccountDescription(TypeIdentifierEnum.cBaseAccount)).toBe('Base Account')
        expect(getAccountDescription(TypeIdentifierEnum.cEVMAccount)).toBe('EVM Account')
        expect(getAccountDescription(TypeIdentifierEnum.cWrappedEVMAccount)).toBe('Wrapped EVM Account')
        expect(getAccountDescription(TypeIdentifierEnum.cDevAccount)).toBe('Other Account Type')

        // Negative test cases
        expect(getAccountDescription(TypeIdentifierEnum.cBaseAccount)).not.toBe('EVM Account')
        expect(getAccountDescription(TypeIdentifierEnum.cEVMAccount)).not.toBe('Base Account')
        expect(getAccountDescription(TypeIdentifierEnum.cDevAccount)).not.toBe('Base Account')
    })

    test('should be usable for type checking', () => {
        // Test enum usage for type checking
        function isNodeAccount(type: TypeIdentifierEnum): boolean {
            return type === TypeIdentifierEnum.cNodeAccount ||
                type === TypeIdentifierEnum.cNodeAccount2 ||
                type === TypeIdentifierEnum.cNodeAccountStats
        }

        expect(isNodeAccount(TypeIdentifierEnum.cNodeAccount)).toBe(true)
        expect(isNodeAccount(TypeIdentifierEnum.cNodeAccount2)).toBe(true)
        expect(isNodeAccount(TypeIdentifierEnum.cNodeAccountStats)).toBe(true)
        expect(isNodeAccount(TypeIdentifierEnum.cBaseAccount)).toBe(false)
        expect(isNodeAccount(TypeIdentifierEnum.cEVMAccount)).toBe(false)

        // Negative test cases
        function isNotNodeAccount(type: TypeIdentifierEnum): boolean {
            return !isNodeAccount(type)
        }
        expect(isNotNodeAccount(TypeIdentifierEnum.cNodeAccount)).toBe(false)
        expect(isNotNodeAccount(TypeIdentifierEnum.cNodeAccount2)).toBe(false)
        expect(isNotNodeAccount(TypeIdentifierEnum.cBaseAccount)).toBe(true)
    })

    test('should support value mapping', () => {
        // Create a mapping from enum values to descriptions
        const typeDescriptions: Record<TypeIdentifierEnum, string> = {
            [TypeIdentifierEnum.cBaseAccount]: 'Basic account type',
            [TypeIdentifierEnum.cEVMAccount]: 'Ethereum Virtual Machine account',
            [TypeIdentifierEnum.cWrappedEVMAccount]: 'Wrapped EVM account',
            [TypeIdentifierEnum.cDevAccount]: 'Developer account',
            [TypeIdentifierEnum.cNetworkAccount]: 'Network account',
            [TypeIdentifierEnum.cNodeAccountStats]: 'Node statistics account',
            [TypeIdentifierEnum.cNodeAccount]: 'Node account',
            [TypeIdentifierEnum.cNodeAccount2]: 'Node account version 2',
            [TypeIdentifierEnum.cSecureAccount]: 'Secure account',
            [TypeIdentifierEnum.cUnknown]: 'Unknown account type'
        }

        // Test that the mapping works correctly
        expect(typeDescriptions[TypeIdentifierEnum.cBaseAccount]).toBe('Basic account type')
        expect(typeDescriptions[TypeIdentifierEnum.cEVMAccount]).toBe('Ethereum Virtual Machine account')
        expect(typeDescriptions[TypeIdentifierEnum.cNodeAccount2]).toBe('Node account version 2')

        // Negative test cases
        expect(typeDescriptions[TypeIdentifierEnum.cBaseAccount]).not.toBe('EVM account type')
        expect(typeDescriptions[TypeIdentifierEnum.cEVMAccount]).not.toBe('Basic account type')
        expect(typeDescriptions[TypeIdentifierEnum.cNodeAccount2]).not.toBe('Node account version 1')
    })

    test('should handle enum conversion between number and string', () => {
        // Test converting from enum value to number and back
        const enumValue = TypeIdentifierEnum.cBaseAccount
        const numericValue = enumValue as number
        const backToEnum = numericValue as TypeIdentifierEnum

        expect(numericValue).toBe(1)
        expect(backToEnum).toBe(TypeIdentifierEnum.cBaseAccount)

        // Negative test cases
        expect(numericValue).not.toBe(2)
        expect(backToEnum).not.toBe(TypeIdentifierEnum.cEVMAccount)
        expect(typeof enumValue).not.toBe('string')
    })

    test('should support bitwise operations', () => {
        // Test using enum values in bitwise operations
        const flag1 = TypeIdentifierEnum.cBaseAccount
        const flag2 = TypeIdentifierEnum.cEVMAccount

        // Bitwise OR to combine flags
        const combined = flag1 | flag2

        // Check if flags are set using bitwise AND
        expect(combined & flag1).toBeTruthy()
        expect(combined & flag2).toBeTruthy()
        expect(combined & TypeIdentifierEnum.cDevAccount).toBeFalsy()

        // Negative test cases
        expect(flag1 & flag2).toBeFalsy()
        expect(combined).not.toBe(flag1)
        expect(combined).not.toBe(flag2)
    })

    test('should work with array indexing', () => {
        // Create an array indexed by enum values
        const accountDescriptions: string[] = []
        accountDescriptions[TypeIdentifierEnum.cBaseAccount] = 'Base Account'
        accountDescriptions[TypeIdentifierEnum.cEVMAccount] = 'EVM Account'

        // Test array access using enum values
        expect(accountDescriptions[TypeIdentifierEnum.cBaseAccount]).toBe('Base Account')
        expect(accountDescriptions[TypeIdentifierEnum.cEVMAccount]).toBe('EVM Account')
        expect(accountDescriptions[TypeIdentifierEnum.cDevAccount]).toBeUndefined()

        // Negative test cases
        expect(accountDescriptions[TypeIdentifierEnum.cBaseAccount]).not.toBe('EVM Account')
        expect(accountDescriptions[TypeIdentifierEnum.cEVMAccount]).not.toBe('Base Account')
        expect(accountDescriptions[0]).toBeUndefined()
    })

    test('should support enum iteration', () => {
        // Get all enum keys that are not numeric
        const enumKeys = Object.keys(TypeIdentifierEnum)
            .filter(key => isNaN(Number(key)))

        // Get all enum values that are numeric
        const enumValues = Object.values(TypeIdentifierEnum)
            .filter(value => typeof value === 'number')

        // Check that we have the same number of string keys as numeric values
        expect(enumKeys.length).toBe(enumValues.length)

        // Check that each key maps to its corresponding value
        enumKeys.forEach(key => {
            const enumKey = key as keyof typeof TypeIdentifierEnum
            const enumValue = TypeIdentifierEnum[enumKey]
            expect(TypeIdentifierEnum[enumValue as any]).toBe(enumKey)
        })

        // Negative test cases
        expect(enumKeys.length).not.toBe(0)
        expect(enumValues.length).not.toBe(0)
        expect(enumKeys).not.toContain('invalidKey')
        expect(enumValues).not.toContain(0)
    })
}) 