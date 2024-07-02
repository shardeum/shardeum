import { addSchema } from '../../utils/serialization/SchemaHelpers'
export const schemaDumpStorageReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: [],
    },
  },
  required: ['query'],
}

export function initDumpStorageReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema('DumpStorageReq', schemaDumpStorageReq)
}
