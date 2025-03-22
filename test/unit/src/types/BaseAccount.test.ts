import { describe, test, expect } from '@jest/globals'
import { VectorBufferStream } from '@shardeum-foundation/core'
import { BaseAccount, serializeBaseAccount, deserializeBaseAccount } from '../../../../src/types/BaseAccount'
import { TypeIdentifierEnum } from '../../../../src/types/enum/TypeIdentifierEnum'

describe('BaseAccount Tests', () => {
    describe('serialization and deserialization', () => {
        test('should correctly serialize BaseAccount with root=true', () => {
            // Arrange
            const account: BaseAccount = {
                accountType: 123
            }
            const stream = new VectorBufferStream(1024)

            // Act
            serializeBaseAccount(stream, account, true)
            stream.position = 0

            // Assert
            expect(stream.readUInt16()).toBe(TypeIdentifierEnum.cBaseAccount)
            expect(stream.readUInt8()).toBe(1) // version
            expect(stream.readUInt16()).toBe(123) // accountType
        })

        test('should correctly serialize BaseAccount with root=false', () => {
            // Arrange
            const account: BaseAccount = {
                accountType: 456
            }
            const stream = new VectorBufferStream(1024)

            // Act
            serializeBaseAccount(stream, account, false)
            stream.position = 0

            // Assert
            expect(stream.readUInt8()).toBe(1) // version
            expect(stream.readUInt16()).toBe(456) // accountType
        })

        test('should correctly deserialize BaseAccount', () => {
            // Arrange
            const stream = new VectorBufferStream(1024)
            stream.writeUInt8(1) // version
            stream.writeUInt16(789) // accountType
            stream.position = 0

            // Act
            const result = deserializeBaseAccount(stream)

            // Assert
            expect(result).toEqual({
                accountType: 789
            })
        })

        test('should throw error when version is higher than expected', () => {
            // Arrange
            const stream = new VectorBufferStream(1024)
            stream.writeUInt8(2) // version higher than supported
            stream.writeUInt16(123) // accountType
            stream.position = 0

            // Act & Assert
            expect(() => deserializeBaseAccount(stream)).toThrow('BaseAccount version mismatch')
        })

        test('should round-trip serialize/deserialize correctly', () => {
            // Arrange
            const originalAccount: BaseAccount = {
                accountType: 42
            }
            const stream = new VectorBufferStream(1024)

            // Act
            serializeBaseAccount(stream, originalAccount)
            stream.position = 0
            const deserializedAccount = deserializeBaseAccount(stream)

            // Assert
            expect(deserializedAccount).toEqual(originalAccount)
        })

        test('should handle edge case with maximum accountType value', () => {
            // Arrange
            const account: BaseAccount = {
                accountType: 65535 // Max UInt16 value
            }
            const stream = new VectorBufferStream(1024)

            // Act
            serializeBaseAccount(stream, account)
            stream.position = 0
            const result = deserializeBaseAccount(stream)

            // Assert
            expect(result.accountType).toBe(65535)
        })

        test('should handle minimum accountType value', () => {
            // Arrange
            const account: BaseAccount = {
                accountType: 0
            }
            const stream = new VectorBufferStream(1024)

            // Act
            serializeBaseAccount(stream, account)
            stream.position = 0
            const result = deserializeBaseAccount(stream)

            // Assert
            expect(result.accountType).toBe(0)
        })
    })
}) 