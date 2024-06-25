import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaContractEstimateGasReq = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  required: ['body'],
}

export function initContractEstimateGasReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('ContractEstimateGasReq', schemaContractEstimateGasReq)
}
