import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'

const schemaApplyChangeConfigTx = {
    type: 'object',
    properties: {
        isInternalTx: { type: 'boolean', enum: [true] },
        internalTXType: { enum: [InternalTXType.ApplyChangeConfig] },
        type: { type: 'string' },
        change: { type: 'object' },
        timestamp: { type: 'number', exclusiveMinimum: 0 },
        sign: { $ref: AJVSchemaEnum.Sign }
    },
    required: [
        'isInternalTx',
        'internalTXType',
        'type',
        'change',
        'timestamp',
        'sign'
    ],
    additionalProperties: false
}

export function initApplyChangeConfigTx(): void {
    addSchemaDependencies()
    addSchemas()
}

function addSchemaDependencies(): void {
    // No dependencies
}

function addSchemas(): void {
    addSchema(AJVSchemaEnum.ApplyChangeConfigTx, schemaApplyChangeConfigTx)
}
