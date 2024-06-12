import { VectorBufferStream } from '../utils/serialization/VectorBufferStream'
import { verifyPayload } from './ajv/Helpers'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

export type InjectResp = {
  success: boolean
  reason: string
  status: number
  txId?: string
}
//TODO: work with response version
export const cInjectRespVersion = 1

export function serializeInjectResp(data: InjectResp): string {
  const errors = verifyPayload('InjectResp', data)
  if (errors && errors.length > 0) {
    throw new Error('Data validation error')
  }
  return JSON.stringify(data)
}

export function deserializeInjectResp(data: string): InjectResp {
  return JSON.parse(data)
}

export function verifyInjectResp(data: InjectResp): boolean {
  const errors = verifyPayload('InjectResp', data)
  if (errors && errors.length > 0) {
    return false
  }
  return true
}
