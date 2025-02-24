import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'
import { schemaSign } from './SignSchema'

const schemaStakeTx = {
    type: 'object',
    properties: {
        isInternalTx: { type: 'boolean', enum: [true] },
        internalTXType: { enum: [InternalTXType.Stake] },
        nominee: { type: 'string' },
        nominator: { type: 'string' },
        stake: { isBigInt: true },
        timestamp: { type: 'number', exclusiveMinimum: 0 },
        sign: schemaSign
    },
    required: [
        'isInternalTx',
        'internalTXType',
        'nominee',
        'nominator',
        'stake',
        'timestamp',
        'sign'
    ],
    additionalProperties: false
}

export function initStakeTx(): void {
    addSchemaDependencies()
    addSchemas()
}

function addSchemaDependencies(): void {
    // No dependencies
}

function addSchemas(): void {
    addSchema(AJVSchemaEnum.StakeTx, schemaStakeTx)
}
