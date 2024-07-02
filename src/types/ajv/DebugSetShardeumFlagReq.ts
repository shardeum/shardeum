import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaDebugSetShardeumFlagReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        value: { type: ['string', 'boolean', 'number'] },
      },
      required: [],
    },
  },
  required: ['query'],
}

export function initDebugSetShardeumFlagReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('DebugSetShardeumFlagReq', schemaDebugSetShardeumFlagReq)
}
