import { describe, it, expect, beforeEach } from 'vitest'
import { store } from '../../src/store.js'
import { MemoryBackend } from '../__support__/memory-backend.js'
import { getPinnedItems, addPinnedItem, removePinnedItem, isPinned } from '../../src/utils/pinneds.js'

async function setupConfig(pinneds = {}) {
  store.init(new MemoryBackend())
  await store.setConfig({
    activeProfile: 'profile1',
    profiles: {
      profile1: {
        name: 'Profile 1',
        formSkrining: { pinneds, excludes: '' },
        notChecked: {},
        skrining: {},
        zenMode: {},
        flashData: {},
      },
      profile2: {
        name: 'Profile 2',
        formSkrining: {},
        notChecked: {},
        skrining: {},
        zenMode: {},
        flashData: {},
      },
    },
  })
}

describe('pinneds', () => {
  it('getPinnedItems should return empty object when no pinneds', async () => {
    await setupConfig()
    expect(await getPinnedItems()).toEqual({})
  })

  it('getPinnedItems should return pinned items', async () => {
    await setupConfig({ key1: 'val1', key2: 'val2' })
    const items = await getPinnedItems()
    expect(items).toEqual({ key1: 'val1', key2: 'val2' })
  })

  it('addPinnedItem should add a new item', async () => {
    await setupConfig({})
    await addPinnedItem('color', 'red')
    const items = await getPinnedItems()
    expect(items.color).toBe('red')
  })

  it('removePinnedItem should remove an existing item', async () => {
    await setupConfig({ key1: 'val1' })
    await removePinnedItem('key1')
    const items = await getPinnedItems()
    expect(items).toEqual({})
  })

  it('isPinned should return true for pinned key', async () => {
    await setupConfig({ key1: 'val1' })
    expect(await isPinned('key1')).toBe(true)
  })

  it('isPinned should return false for non-pinned key', async () => {
    await setupConfig({ key1: 'val1' })
    expect(await isPinned('missing')).toBe(false)
  })
})
