import { addSchema } from '../../utils/serialization/SchemaHelpers';
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum';
import { schemaSign } from './SignSchema';

export const RemoveNodeCert = {
  type: 'object',
  properties: {
    nodePublicKey: { type: 'string' },
    cycle: { type: 'number' },
    sign: schemaSign,
    signs: {
      type: "array",
      items: schemaSign
    }
  },
  required: ['nodePublicKey', 'cycle'],
  additionalProperties: false
}

export function initRemoveNodeCert(): void {
  addSchemaDependencies()
  addSchemas()
}

function addSchemaDependencies(): void {
  // No dependencies
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.RemoveNodeCert, RemoveNodeCert);
}
