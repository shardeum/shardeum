import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'
import { schemaSign } from './SignSchema'

const schemaTransferFromSecureAccountTx = {
    type: 'object',
    properties: {
        isInternalTx: { type: 'boolean', enum: [true] },
        internalTXType: { enum: [InternalTXType.TransferFromSecureAccount] },
        accountName: { type: 'string' },
        nonce: { type: 'number' },
        amount: { type: 'string' },
        timestamp: { type: 'number', exclusiveMinimum: 0 },
        from: { type: 'string' },
        sign: {
            type: 'array',
            items: schemaSign
        }
    },
    required: [
        'isInternalTx',
        'internalTXType',
        'accountName',
        'nonce',
        'amount',
        'timestamp',
        'from',
        'sign'
    ],
    additionalProperties: false
}

export function initTransferFromSecureAccountTx(): void {
    addSchemaDependencies()
    addSchemas()
}

function addSchemaDependencies(): void {
    // No dependencies
}

function addSchemas(): void {
    addSchema(AJVSchemaEnum.TransferFromSecureAccountTx, schemaTransferFromSecureAccountTx)
}
