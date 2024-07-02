import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaInjectResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    reason: { type: 'string' },
    status: { type: 'number' },
    txId: { type: 'string' },
  },
  required: ['success', 'reason', 'status'],
}

export function initInjectResp(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('InjectResp', schemaInjectResponse)
}
