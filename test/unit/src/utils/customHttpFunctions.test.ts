import { customAxios, customGot } from '../../../../src/utils/customHttpFunctions'
import * as http from 'node:http'

jest.mock('../../../../src/index', () => ({
  shardusConfig: {
    p2p: {
      maxResponseSize: 1024 * 10, // 10KB
    },
  },
}))

describe('cusotmHttpFunctions', () => {
  let server: http.Server
  let serverUrl: string

  beforeAll((done) => {
    // Start a test server on a random port
    server = http.createServer((req, res) => {
      if (req.url === '/small-data') {
        // Response under the limit (5MB)
        const size = 5 * 1024
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': size.toString(),
        })
        // Generate data in chunks to avoid memory issues
        const chunk = Buffer.alloc(64 * 1024, 'a')
        let sent = 0
        const sendChunk = (): void => {
          if (sent >= size) {
            res.end()
            return
          }
          const toSend = Math.min(chunk.length, size - sent)
          res.write(chunk.slice(0, toSend))
          sent += toSend
          setImmediate(sendChunk)
        }
        sendChunk()
      } else if (req.url === '/large-data') {
        // Response over the limit (15MB)
        const size = 15 * 1024
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': size.toString(),
        })
        // Generate data in chunks to avoid memory issues
        const chunk = Buffer.alloc(64 * 1024, 'a')
        let sent = 0
        const sendChunk = (): void => {
          if (sent >= size) {
            res.end()
            return
          }
          const toSend = Math.min(chunk.length, size - sent)
          res.write(chunk.slice(0, toSend))
          sent += toSend
          setImmediate(sendChunk)
        }
        sendChunk()
      } else if (req.url === '/chunked-data') {
        // Chunked response that will exceed the limit
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Transfer-Encoding': 'chunked',
        })

        // Send 1MB chunks
        const chunk = Buffer.alloc(1 * 1024, 'a')
        let chunkCount = 0

        const sendChunk = (): void => {
          if (chunkCount >= 15) {
            // Will send 15MB total
            res.end()
            return
          }
          res.write(chunk)
          chunkCount++
          setTimeout(sendChunk, 50) // Send a chunk every 50ms
        }

        // Start sending chunks
        sendChunk()
      }
    })

    server.listen(0, () => {
      // Port 0 means use a random available port
      const address = server.address() as { port: number }
      serverUrl = `http://localhost:${address.port}`
      done()
    })
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('customGot', () => {
    test('should successfully fetch a response under the size limit', async () => {
      // Create the customHttpFunctions instance
      const got = customGot()

      // Make the request
      const response = await got(`${serverUrl}/small-data`)

      // Verify the response was successful
      expect(response.statusCode).toBe(200)
      // Response should be 5KB
      expect(response.body.length).toBeGreaterThan(5 * 1024 - 100) // Allow for small variations
    }, 10000) // Timeout after 10 seconds

    test('should reject a response exceeding the size limit', async () => {
      // Create the customHttpFunctions instance
      const got = customGot()

      // Make the request and expect it to fail
      await expect(got(`${serverUrl}/large-data`)).rejects.toThrow()
    }, 10000) // Timeout after 10 seconds

    test('should reject a chunked response that exceeds the size limit', async () => {
      // Create the customHttpFunctions instance
      const got = customGot()

      // Make the request and expect it to fail due to size limit
      await expect(got(`${serverUrl}/chunked-data`)).rejects.toThrow()
    }, 10000) // Timeout after 10 seconds
  })

  describe('customAxios', () => {
    test('should successfully fetch a response under the size limit', async () => {
      const response = await customAxios(undefined, { responseType: 'arraybuffer' }).get(
        `${serverUrl}/small-data`
      )
      expect(response.status).toBe(200)
      expect(response.data.length).toBeGreaterThan(5 * 1024 - 100)
    }, 10000)

    test('should reject a response exceeding the size limit', async () => {
      const response = customAxios().get(`${serverUrl}/large-data`)
      await expect(response).rejects.toThrow('Response size exceeds limit of 10240 bytes')
    }, 10000)

    test('should reject a chunked response that exceeds the size limit', async () => {
      let response = customAxios().get(`${serverUrl}/chunked-data`)
      await expect(response).rejects.toThrow('Response size exceeds limit of 10240 bytes')
    }, 10000)
  })
})
