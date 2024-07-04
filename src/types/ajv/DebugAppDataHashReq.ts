import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { ValidatorAjvTypeReqRespEnum } from '../enum/ValidatorAjvTypeReqRespEnum'

export const schemaDebugAppDataHashReq = {
  type: 'object',
  properties: {
    params: {
      type: 'object',
      properties: {
        hash: { type: 'string' },
      },
      required: ['hash'],
    },
  },
  required: ['params'],
}

export function initDebugAppDataHashReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(ValidatorAjvTypeReqRespEnum.DebugAppDataHashReq, schemaDebugAppDataHashReq)
}
