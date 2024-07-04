import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { ValidatorAjvTypeReqRespEnum } from '../enum/ValidatorAjvTypeReqRespEnum'

export const schemaEthGetBlockByNumberReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        blockNumber: { type: 'string' },
      },
      required: ['blockNumber'],
    },
  },
  required: ['query'],
}

export function initEthGetBlockByNumberReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(ValidatorAjvTypeReqRespEnum.EthGetBlockByNumberReq, schemaEthGetBlockByNumberReq)
}
