import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'
import { schemaSign } from './SignSchema'

const schemaSetCertTimeTx = {
    type: 'object',
    properties: {
        isInternalTx: { type: 'boolean', enum: [true] },
        internalTXType: { enum: [InternalTXType.SetCertTime] },
        nominee: { type: 'string' },
        nominator: { type: 'string' },
        duration: { type: 'number' },
        timestamp: { type: 'number', exclusiveMinimum: 0 },
        sign: schemaSign
    },
    required: [
        'isInternalTx',
        'internalTXType',
        'nominee',
        'nominator',
        'duration',
        'timestamp',
        'sign'
    ],
    additionalProperties: false
}

export function initSetCertTimeTx(): void {
    addSchemaDependencies()
    addSchemas()
}

function addSchemaDependencies(): void {
    // No dependencies
}

function addSchemas(): void {
    addSchema(AJVSchemaEnum.SetCertTimeTx, schemaSetCertTimeTx)
}
