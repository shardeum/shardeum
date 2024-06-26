import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaAccountAddressReq = {
  type: 'object',
  properties: {
    params: {
      type: 'object',
      properties: {
        address: { type: 'string' },
      },
      required: [],
    },
  },
  required: ['params'],
}

export function initAccountReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('AccountAddressReq', schemaAccountAddressReq)
}
