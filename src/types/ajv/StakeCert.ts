import { addSchema } from '../../utils/serialization/SchemaHelpers';
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum';
import { schemaSign } from './SignSchema';

export const StakeCert = {
  type: 'object',
  properties: {
    nominator: { type: 'string' },
    nominee: { type: 'string' },
    stake: { isBigInt: true },
    certExp: { type: 'number' },
    sign: schemaSign,
    signs: {
      type: "array",
      items: schemaSign
    }
  },
  required: ['nominator', 'nominee', 'stake', 'certExp'],
  additionalProperties: false
}

export function initStakeCert(): void {
  addSchemaDependencies()
  addSchemas()
}

function addSchemaDependencies(): void {
  // No dependencies
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.StakeCert, StakeCert);
}
