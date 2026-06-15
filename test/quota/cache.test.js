import { describe, it, expect, beforeEach } from 'vitest'
import { store } from '../../src/store.js'
import { MemoryBackend } from '../__support__/memory-backend.js'
import { getCache, setCache, clearCache } from '../../src/quota/cache.js'

describe('cache', () => {
  beforeEach(() => {
    store.init(new MemoryBackend())
  })

  it('getCache should return null when empty', async () => {
    expect(await getCache()).toBeNull()
  })

  it('setCache should store data with cachedAt', async () => {
    await setCache({ status: 'valid' })
    const cache = await getCache()
    expect(cache.status).toBe('valid')
    expect(cache).toHaveProperty('cachedAt')
  })

  it('clearCache should remove cached data', async () => {
    await setCache({ status: 'valid' })
    await clearCache()
    expect(await getCache()).toBeNull()
  })

  it('getCache should return null for expired cache', async () => {
    await setCache({ status: 'valid' })
    const backend = store._backend
    backend._data.set('license-cache', { status: 'valid', cachedAt: Date.now() - 9 * 60 * 60 * 1000 })
    expect(await getCache()).toBeNull()
  })

  it('should persist data across get/set', async () => {
    await setCache({ status: 'none', payload: null })
    const cache = await getCache()
    expect(cache.status).toBe('none')
    expect(cache.payload).toBeNull()
  })
})
