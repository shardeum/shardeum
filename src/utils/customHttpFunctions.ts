import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import got, { Got } from 'got'
import { shardusConfig } from '../index'
import { Utils } from '@shardeum-foundation/lib-types'
import { PassThrough } from 'node:stream'

const DEFAULT_MAX_BYTES = 15 * 1024 * 1024

export function customGot(maxBytes?: number): Got {
  return got.extend({
    handlers: [
      (options, next) => {
        const downloadLimit = maxBytes ?? shardusConfig?.p2p?.maxResponseSize ?? DEFAULT_MAX_BYTES
        const promiseOrStream = next(options)

        // A destroy function that supports both promises and streams
        const destroy = (message: string): void => {
          if (options.isStream) {
            // Type the stream properly
            const stream = promiseOrStream as ReturnType<typeof got.stream>
            stream.destroy(new Error(message))
            return
          }

          // Type the promise properly
          const promise = promiseOrStream as ReturnType<typeof got> & {
            cancel: (reason: string) => void
          }
          promise.cancel(message)
        }

        if (typeof downloadLimit === 'number') {
          promiseOrStream.on('downloadProgress', (progress) => {
            if (progress.transferred > downloadLimit) {
              // /* prettier-ignore */ if(logFlags.error) this.mainLogger.error(`CustomGot: Exceeded the download limit of ${downloadLimit} bytes, cancelling request. URL: ${options.url}`);
              // nestedCountersInstance.countEvent('p2p', 'download-limit-exceeded')
              destroy(`Exceeded the download limit of ${downloadLimit} bytes`)
            }
          })
        }

        return promiseOrStream
      },
    ],
  })
}

/**
 * Creates a custom axios instance with size limiting
 * @param maxBytes Maximum response size in bytes (default: 10MB)
 * @param axiosConfig Additional axios axiosConfig options
 * @returns Custom axios instance
 */
export function customAxios(maxBytes?: number, axiosConfig: AxiosRequestConfig = {}): AxiosInstance {
  const downloadLimit = maxBytes ?? shardusConfig?.p2p?.maxResponseSize ?? DEFAULT_MAX_BYTES

  const userRequestedType = axiosConfig.responseType ?? 'json'
  axiosConfig.responseType = 'stream'
  const instance = axios.create({
    ...axiosConfig,
    validateStatus: () => true,
  })

  instance.interceptors.request.use((request) => {
    const source = axios.CancelToken.source()
    request.cancelToken = source.token
    ;(request as any)._cancelSource = source
    return request
  })

  instance.interceptors.response.use(
    async (response) => {
      const contentLength = parseInt(response.headers['content-length'] || '0', 10)
      if (contentLength > 0 && contentLength > downloadLimit) {
        ;(response.config as any)._cancelSource?.cancel(
          `Response content-length ${contentLength} exceeds limit of ${downloadLimit}`
        )
        throw new Error(`Response size exceeds limit of ${downloadLimit} bytes`)
      }

      const stream = response.data
      let totalBytes = 0
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          totalBytes += chunk.length
          if (totalBytes > downloadLimit) {
            stream.destroy(new Error(`Response size exceeds limit of ${downloadLimit} bytes`))
            return
          }
          chunks.push(chunk)
        })

        stream.on('end', () => {
          const fullBuffer = Buffer.concat(chunks)

          switch (userRequestedType) {
            case 'stream': {
              // If user truly wants a stream, we can either:
              const pass = new PassThrough()
              pass.end(fullBuffer)
              response.data = pass
              break
            }

            case 'arraybuffer':
              response.data = fullBuffer
              break

            case 'json':
            default:
              try {
                response.data = Utils.safeJsonParse(fullBuffer.toString('utf8'))
              } catch (err: any) {
                return reject(new Error(`Failed to parse JSON (size: ${fullBuffer.length} bytes): ${err.message}`))
              }
              break
          }

          resolve(response)
        })

        stream.on('error', (err: Error) => {
          reject(err)
        })
      })
    },
    (error) => {
      if (axios.isCancel(error)) {
        throw new Error(`Response size exceeds limit of ${downloadLimit} bytes`)
      }
      throw error
    }
  )

  return instance
}
