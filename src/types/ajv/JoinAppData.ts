import { schemaSign } from './SignSchema'
import {AJVSchemaEnum} from "../enum/AJVSchemaEnum";
import {addSchema} from "../../utils/serialization/SchemaHelpers";

export const schemaStakeCert = {
  type: 'object',
  properties: {
    nominator: { type: 'string' },
    nominee: { type: 'string' },
    stake: { type: 'string', pattern: '^[0-9]+$' }, // bigint as string
    certExp: { type: 'number' },
    signs: {
      type: 'array',
      items: schemaSign,
    },
    sign: schemaSign,
  },
  required: ['nominator', 'nominee', 'stake', 'certExp'],
  additionalProperties: false,
}

export const schemaAdminCert = {
  type: 'object',
  properties: {
    nominee: { type: 'string' },
    certCreation: { type: 'number' },
    certExp: { type: 'number' },
    sign: schemaSign,
    goldenTicket: { type: 'boolean' },
  },
  required: ['nominee', 'certCreation', 'certExp', 'sign', 'goldenTicket'],
  additionalProperties: false,
}

export const schemaAppJoinData = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    stakeCert: schemaStakeCert,
    adminCert: schemaAdminCert,
    isAdminCertUnexpired: { type: 'boolean' },
  },
  required: ['version', 'stakeCert', 'adminCert', 'isAdminCertUnexpired'],
  additionalProperties: false,
}

export function initJoinAppData(): void {
  addSchemaDependencies()
  addSchemas()
}

function addSchemaDependencies(): void {
  // No dependencies
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.AppJoinData, schemaAppJoinData)
}
