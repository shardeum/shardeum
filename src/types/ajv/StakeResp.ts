
import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'

const schemaStakeResp = {
    type: 'object',
    properties: {
        stakeRequired: {
            type: 'object',
            required: ['dataType', 'value'],
            properties: {
                dataType: {
                    type: 'string',
                    enum: ['bi'],
                },
                value: {
                    type: 'string',
                    pattern: '^[0-9a-fA-F]+$', // Hex string pattern
                },
            },
        },
        stakeRequiredUsd: {
            type: 'object',
            required: ['dataType', 'value'],
            properties: {
                dataType: {
                    type: 'string',
                    enum: ['bi'],
                },
                value: {
                    type: 'string',
                    pattern: '^[0-9a-fA-F]+$', // Hex string pattern
                },
            },
        },
    },
    required: ['stakeRequired', 'stakeRequiredUsd'],
    additionalProperties: false,
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