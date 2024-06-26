import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaDebugPointsReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        points: { type: ['string', 'number'] },
      },
      required: ['points'],
    },
  },
  required: ['query'],
}

export function initDebugPointsReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('DebugPointsReq', schemaDebugPointsReq)
}
