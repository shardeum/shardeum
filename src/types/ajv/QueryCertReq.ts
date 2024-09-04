import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'

const schemaQueryCertReq = {
  type: 'object',
  properties: {},
  required: [],
  allowAdditionalProperties: false,
}

export function initQueryCertReq(): void {
  addSchemaDependencies()
  addSchemas()
}

// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(AJVSchemaEnum.QueryCertReq, schemaQueryCertReq)
}
