import { LRUCache } from 'lru-cache'

describe('shardeumStateTXMap TTL', () => {
  test('entries expire after ttl', async () => {
    const cache = new LRUCache<string, number>({ max: 10, ttl: 50 })
    cache.set('tx1', 1)
    expect(cache.get('tx1')).toBe(1)
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(cache.get('tx1')).toBeUndefined()
    expect(cache.size).toBe(0)
  })
})
