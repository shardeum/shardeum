import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaDebugSetServicePointReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        key1: { type: 'string' },
        key2: { type: 'string' },
        value: { type: ['string', 'null'] },
      },
      required: [],
    },
  },
  required: ['query'],
}

export function initDebugSetServicePointReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('DebugSetServicePointReq', schemaDebugSetServicePointReq)
}
