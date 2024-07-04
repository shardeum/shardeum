import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { ValidatorAjvTypeReqRespEnum } from '../enum/ValidatorAjvTypeReqRespEnum'

export const schemaQueryCertificateReq = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        nominee: { type: 'string' },
        nominator: { type: 'string' },
        sign: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            sig: { type: 'string' },
          },
          required: ['owner', 'sig'],
        }, // Adjust the type as per the actual definition of 'sign'
      },
      required: [],
    },
  },
  required: ['body'],
}

export function initQueryCertificateReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(ValidatorAjvTypeReqRespEnum.QueryCertificateReq, schemaQueryCertificateReq)
}
