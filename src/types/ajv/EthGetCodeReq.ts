import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaEthGetCodeReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        blockNumber: { type: 'string' },
      },
      required: [],
    },
  },
  required: ['query'],
}

export function initEthGetCodeReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('EthGetCodeReq', schemaEthGetCodeReq)
}
