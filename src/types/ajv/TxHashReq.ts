import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { ValidatorAjvTypeReqRespEnum } from '../enum/ValidatorAjvTypeReqRespEnum'

export const schemaTxHashReq = {
  type: 'object',
  properties: {
    params: {
      type: 'object',
      properties: {
        hash: { type: 'string' },
      },
      required: [],
    },
  },
  required: ['params'],
}

export function initTxHashReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(ValidatorAjvTypeReqRespEnum.TxHashReq, schemaTxHashReq)
}
