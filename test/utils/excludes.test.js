import { describe, it, expect, beforeEach } from 'vitest'
import { store } from '../../src/store.js'
import { MemoryBackend } from '../__support__/memory-backend.js'
import { isExcluded, toggleExclude } from '../../src/utils/excludes.js'

async function setupConfig(excludesStr) {
  store.init(new MemoryBackend())
  await store.setConfig({
    activeProfile: 'profile1',
    profiles: {
      profile1: {
        name: 'Profile 1',
        formSkrining: { excludes: excludesStr, pinneds: {} },
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

describe('excludes', () => {
  beforeEach(async () => {
    await setupConfig('a;b;c')
  })

  it('isExcluded should return true for excluded item', async () => {
    expect(await isExcluded('a')).toBe(true)
  })

  it('isExcluded should return false for non-excluded item', async () => {
    expect(await isExcluded('x')).toBe(false)
  })

  it('isExcluded should return false when excludes is empty', async () => {
    await setupConfig('')
    expect(await isExcluded('a')).toBe(false)
  })

  it('toggleExclude should remove item if already excluded', async () => {
    const result = await toggleExclude('a')
    expect(result).toBe(false)
    expect(await isExcluded('a')).toBe(false)
  })

  it('toggleExclude should add item if not excluded', async () => {
    const result = await toggleExclude('x')
    expect(result).toBe(true)
    expect(await isExcluded('x')).toBe(true)
  })
})
