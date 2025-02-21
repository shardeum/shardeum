import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'

const schemaApplyNetworkParamTx = {
    type: 'object',
    properties: {
        isInternalTx: { type: 'boolean', enum: [true] },
        internalTXType: { enum: [InternalTXType.ApplyNetworkParam] },
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

export function initApplyNetworkParamTx(): void {
    addSchemaDependencies()
    addSchemas()
}

function addSchemaDependencies(): void {
    // No dependencies
}

function addSchemas(): void {
    addSchema(AJVSchemaEnum.ApplyNetworkParamTx, schemaApplyNetworkParamTx)
}
