import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaInjectReq = {
  type: 'object',
  properties: {
    timestamp: { type: 'number' },
  },
  required: ['timestamp'],
}

export function initInjectReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('InjectReq', schemaInjectReq)
}
