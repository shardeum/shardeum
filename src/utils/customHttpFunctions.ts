import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import got, { Got } from 'got'
import { shardusConfig } from '../index'

export function customGot(maxBytes?: number): Got {
  return got.extend({
    handlers: [
      (options, next) => {
        const downloadLimit = maxBytes ?? shardusConfig.p2p.maxResponseSize
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
 * @param config Additional axios config options
 * @returns Custom axios instance
 */
export function customAxios(maxBytes?: number, config: AxiosRequestConfig = {}): AxiosInstance {
  const downloadLimit = maxBytes ?? shardusConfig.p2p.maxResponseSize
  return axios.create({
    ...config,
    maxContentLength: downloadLimit, // Limits the response size
    maxBodyLength: downloadLimit, // Limits the request body size
  })
}
