import { VectorBufferStream } from '../utils/serialization/VectorBufferStream'
import { verifyPayload } from './ajv/Helpers'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

export type InjectReq = {
  timestamp: number
}
//TODO: work with request version
export const cInjectReqVersion = 1

export function serializeInjectReq(data: InjectReq): string {
  const errors = verifyPayload('InjectReq', data)
  if (errors && errors.length > 0) {
    throw new Error('Data validation error')
  }
  return JSON.stringify(data)
}
export function verifyInjectReq(data: InjectReq): boolean {
  const errors = verifyPayload('InjectReq', data)
  if (errors && errors.length > 0) {
    return false
  }
  return true
}
export function deserializeInjectReq(data: string): InjectReq {
  return JSON.parse(data)
}
