import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaDebugSetEventBlockThresholdReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        threshold: { type: 'number' },
      },
      required: [],
    },
  },
  required: ['query'],
}

export function initDebugSetEventBlockThresholdReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('DebugSetEventBlockThresholdReq', schemaDebugSetEventBlockThresholdReq)
}
