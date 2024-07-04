import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { ValidatorAjvTypeReqRespEnum } from '../enum/ValidatorAjvTypeReqRespEnum'

export const schemaGenesisAccountsReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        start: { type: ['string', 'number'] },
      },
      required: [],
    },
  },
  required: ['query'],
}

export function initGenesisAccountsReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(ValidatorAjvTypeReqRespEnum.GenesisAccountsReq, schemaGenesisAccountsReq)
}
