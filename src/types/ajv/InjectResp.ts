import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { InjectReqRespEnum } from '../enum/InjectReqRespEnum'
export const schemaInjectResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    reason: { type: ['string', 'null'] },
    status: { type: 'number' },
    txId: { type: ['string', 'null'] },
  },
  required: ['success', 'status'],
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
  addSchema(InjectReqRespEnum.InjectResp, schemaInjectResponse)
}
