import { sleep } from './general'

export type RetryFunc<T> = () => Promise<T>

export type ShouldRetry<T> = (result: T) => Promise<boolean>

// Retry a function until it succeeds with linear back off. shouldRetry is called after waiting for waitTimeSeconds
export async function retry<T>(
  func: RetryFunc<T>,
  shouldRetryFunc: ShouldRetry<T>,
  retries: number,
  waitTimeSeconds: number,
  execCounter = 1
): Promise<T> {
  try {
    if (retries < 0) {
      return
    }
    const result = await func()
    await sleep(execCounter * waitTimeSeconds * 1000)
    const shouldRetry = await shouldRetryFunc(result)
    if (shouldRetry === true) {
      return retry(func, shouldRetryFunc, retries - 1, waitTimeSeconds, execCounter + 1)
    }
    return result
  } catch (error) {
    await sleep(execCounter * waitTimeSeconds * 1000)
    return retry(func, shouldRetryFunc, retries - 1, waitTimeSeconds, execCounter + 1)
  }
}
