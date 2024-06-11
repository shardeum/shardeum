import { VectorBufferStream } from '../utils/serialization/VectorBufferStream'
import { verifyPayload } from './ajv/Helpers'
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum'

export type InjectResp = {
  success: number
  reason: string
  status: number
  txId?: string
}
export const cInjectRespVersion = 1

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
