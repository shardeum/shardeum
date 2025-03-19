import axios, {
  AxiosInstance,
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
} from 'axios'
import got, { Got } from 'got'
import { shardusConfig } from '../index'
import { Utils } from '@shardeum-foundation/lib-types'

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
 * @param axiosConfig Additional axios axiosConfig options
 * @returns Custom axios instance
 */
export function customAxios(maxBytes?: number, axiosConfig: AxiosRequestConfig = {}): AxiosInstance {
  // Use the provided maxBytes or fall back to config.maxResponseSize
  const downloadLimit = maxBytes ?? shardusConfig.p2p.maxResponseSize

  const instance = axios.create({
    ...axiosConfig,
    maxContentLength: downloadLimit,
    maxBodyLength: downloadLimit,
    // Add responseType for better handling
    responseType: 'arraybuffer',
    // Don't automatically reject on error status codes
    validateStatus: () => true,
  })

  // Add request interceptor to add a cancel token
  instance.interceptors.request.use((request) => {
    const source = axios.CancelToken.source()
    request.cancelToken = source.token
    ;(request as any)._cancelSource = source
    return request
  })

  // Add response interceptor to check size
  instance.interceptors.response.use(
    (response) => {
      // Check size for different response types
      if (response.data) {
        let dataSize = 0

        if (response.data instanceof ArrayBuffer) {
          dataSize = response.data.byteLength
        } else if (typeof response.data === 'string') {
          dataSize = response.data.length
        } else if (Buffer.isBuffer(response.data)) {
          dataSize = response.data.length
        } else if (typeof response.data === 'object') {
          // For JSON responses
          dataSize = Utils.safeStringify(response.data).length
        }

        if (dataSize > downloadLimit) {
          throw new Error(`Response size of ${dataSize} bytes exceeds limit of ${downloadLimit} bytes`)
        }
      }

      // Also check Content-Length header if available
      const contentLength = parseInt(response.headers['content-length'] || '0', 10)
      if (contentLength > 0 && contentLength > downloadLimit) {
        throw new Error(
          `Response content length ${contentLength} bytes exceeds limit of ${downloadLimit} bytes`
        )
      }

      return response
    },
    (error) => {
      if (axios.isCancel(error)) {
        throw new Error(`Response size exceeds limit of ${downloadLimit} bytes`)
      }

      if (
        error.message &&
        (error.message.includes('maxContentLength') ||
          error.message.includes('maxBodyLength') ||
          error.message.includes('socket hang up'))
      ) {
        throw new Error(`Response size exceeds limit of ${downloadLimit} bytes`)
      }

      throw error
    }
  )

  // Handle download progress
  instance.defaults.onDownloadProgress = (progressEvent: AxiosProgressEvent) => {
    if (progressEvent.loaded > downloadLimit) {
      try {
        const event = progressEvent as unknown as { config?: { _cancelSource?: CancelTokenSource } }
        if (event.config?._cancelSource?.cancel) {
          event.config._cancelSource.cancel(`Response size exceeds limit of ${downloadLimit} bytes`)
        }
      } catch (err) {
        // Silently handle any errors with the cancellation
        console.error('Error during request cancellation:', err)
      }
    }
  }

  return instance
}
