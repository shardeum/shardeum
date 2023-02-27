import { retry } from '../../src/utils/retry'

describe('retry', () => {
  const successFunc = async () => 'success'
  const errorFunc = async () => {
    throw new Error('error')
  }
  const trueShouldRetry = async () => true
  const falseShouldRetry = async () => false

  it('should return the result of a successful function call', async () => {
    const result = await retry(successFunc, falseShouldRetry, 3, 0)
    expect(result).toBe('success')
  })

  it('should retry a failed function call', async () => {
    const result = await retry(errorFunc, trueShouldRetry, 3, 0)
    expect(result).toBe(undefined)
  })

  it('should throw an error if retries are exhausted without success', async () => {
    await expect(await retry(errorFunc, falseShouldRetry, 0, 0)).toBe(undefined)
  })

  it('should wait for the specified amount of time between retries', async () => {
    const startTime = Date.now()
    await retry(errorFunc, trueShouldRetry, 2, 1)
    const endTime = Date.now()
    expect(endTime - startTime).toBeGreaterThanOrEqual(6000)
  })
})
