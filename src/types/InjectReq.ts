import { VectorBufferStream } from '../utils/serialization/VectorBufferStream'
import { verifyPayload } from './ajv/Helpers'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

export type InjectReq = {
  timestamp: number
}
export const cInjectReqVersion = 1

// export const serializeInjectReq = (
//     // stream: VectorBufferStream,
//     inp: InjectReq,
//     // root = false
// ): void => {
//     const errors = verifyPayload('InjectReq', inp)
//     if (errors && errors.length > 0) {
//         throw new Error('Data validation error')
//     }

// }
export function serializeInjectReq(data: InjectReq): string {
  const errors = verifyPayload('InjectReq', data)
  if (errors && errors.length > 0) {
    throw new Error('Data validation error')
  }
  return JSON.stringify(data)
}

export function deserializeInjectReq(data: string): InjectReq {
  return JSON.parse(data)
}
