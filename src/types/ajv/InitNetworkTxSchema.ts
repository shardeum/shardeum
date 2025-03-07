import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'

const schemaInitNetworkTx = {
    type: 'object',
    properties: {
        isInternalTx: { type: 'boolean', enum: [true] },
        internalTXType: { enum: [InternalTXType.InitNetwork] },
        timestamp: { type: 'number', exclusiveMinimum: 0 },
        network: { type: 'string' }
    },
    required: [
        'isInternalTx',
        'internalTXType',
        'timestamp',
        'network'
    ],
    additionalProperties: false
}

export function initInitNetworkTx(): void {
    addSchemaDependencies()
    addSchemas()
}

// Function to add schema dependencies
function addSchemaDependencies(): void {
    // No dependencies
}

// Function to register the schema
function addSchemas(): void {
    addSchema(AJVSchemaEnum.InitNetworkTx, schemaInitNetworkTx)
}
