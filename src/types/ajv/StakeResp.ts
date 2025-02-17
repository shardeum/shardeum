import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'

const schemaStakeResp = {
    type: 'object',
    properties: {
        stakeRequired: { type: 'string' }, // BigInt is serialized as string
        stakeRequiredUsd: { type: 'string' } // BigInt is serialized as string
    },
    required: ['stakeRequired', 'stakeRequiredUsd'],
    additionalProperties: false
}

export function initStakeResp(): void {
    addSchemaDependencies()
    addSchemas()
}

// Function to add schema dependencies
function addSchemaDependencies(): void {
    // No dependencies
}

// Function to register the schema
function addSchemas(): void {
    addSchema(AJVSchemaEnum.StakeResp, schemaStakeResp)
}