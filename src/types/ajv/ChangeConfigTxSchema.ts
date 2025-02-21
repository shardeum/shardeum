import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'

const schemaChangeConfigTx = {
    type: 'object',
    properties: {
        isInternalTx: { type: 'boolean', enum: [true] },
        internalTXType: { enum: [InternalTXType.ChangeConfig] },
        type: { type: 'string' },
        from: { type: 'string' },
        cycle: { type: 'number' },
        config: { type: 'string' },
        timestamp: { type: 'number', exclusiveMinimum: 0 },
        sign: { type: 'array', items: { $ref: AJVSchemaEnum.Sign } }
    },
    required: [
        'isInternalTx',
        'internalTXType',
        'from',
        'cycle',
        'config',
        'timestamp'
    ],
    additionalProperties: false
}

export function initChangeConfigTx(): void {
    addSchemaDependencies()
    addSchemas()
}

function addSchemaDependencies(): void {
    // No dependencies
}

function addSchemas(): void {
    addSchema(AJVSchemaEnum.ChangeConfigTx, schemaChangeConfigTx)
}
