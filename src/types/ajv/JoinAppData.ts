import { schemaSign } from './SignSchema'
import {AJVSchemaEnum} from "../enum/AJVSchemaEnum";
import {addSchema} from "../../utils/serialization/SchemaHelpers";

export const schemaStakeCert = {
  type: 'object',
  properties: {
    nominator: { type: 'string' },
    nominee: { type: 'string' },
    stake: { isBigInt: true },
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
  required: ['nominee', 'certCreation', 'certExp', 'sign'],
  additionalProperties: false,
}

export const schemaAppJoinData = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    stakeCert: { anyOf: [schemaStakeCert, { type: 'null' }] },
    adminCert: { anyOf: [schemaAdminCert, { type: 'null' }] },
    isAdminCertUnexpired: { type: 'boolean' },
  },
  required: ['version'],
  additionalProperties: false,
}

export function initJoinAppData(): void {
  addSchemas()
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.AppJoinData, schemaAppJoinData)
}
