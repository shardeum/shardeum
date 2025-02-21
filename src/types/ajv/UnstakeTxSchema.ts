import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'

const schemaUnstakeTx = {
    type: 'object',
    properties: {
        isInternalTx: { type: 'boolean', enum: [true] },
        internalTXType: { enum: [InternalTXType.Unstake] },
        nominee: { type: 'string' },
        nominator: { type: 'string' },
        timestamp: { type: 'number', exclusiveMinimum: 0 },
        sign: { $ref: AJVSchemaEnum.Sign },
        force: { type: 'boolean' }
    },
    required: [
        'isInternalTx',
        'internalTXType',
        'nominee',
        'nominator',
        'timestamp',
        'sign',
        'force'
    ],
    additionalProperties: false
}

export function initUnstakeTx(): void {
    addSchemaDependencies()
    addSchemas()
}

function addSchemaDependencies(): void {
    // No dependencies
}

function addSchemas(): void {
    addSchema(AJVSchemaEnum.UnstakeTx, schemaUnstakeTx)
}
