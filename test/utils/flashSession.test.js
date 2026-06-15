import { describe, it, expect, beforeEach } from 'vitest'
import { store } from '../../src/store.js'
import { MemoryBackend } from '../__support__/memory-backend.js'
import { setFlashData, getFlashData, clearFlashData } from '../../src/utils/flashSession.js'

describe('flashSession', () => {
  beforeEach(() => {
    store.init(new MemoryBackend())
  })

  it('getFlashData should return null when no data', async () => {
    expect(await getFlashData()).toBeNull()
  })

  it('setFlashData should store data with timestamp', async () => {
    await setFlashData({ pinneds: { key: 'val' } })
    const data = await getFlashData()
    expect(data.pinneds).toEqual({ key: 'val' })
    expect(data).toHaveProperty('_timestamp')
  })

  it('getFlashData should return null for expired data', async () => {
    await setFlashData({ pinneds: { key: 'val' } })
    const result = await getFlashData(-1)
    expect(result).toBeNull()
  })

  it('clearFlashData should remove stored data', async () => {
    await setFlashData({ pinneds: { key: 'val' } })
    await clearFlashData()
    expect(await getFlashData()).toBeNull()
  })

  it('getFlashData with custom maxAge should respect expiry', async () => {
    await setFlashData({ pinneds: {} })
    const result = await getFlashData(1000)
    expect(result).not.toBeNull()
  })
})
