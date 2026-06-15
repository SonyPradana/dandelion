import { describe, it, expect, beforeEach } from 'vitest'
import { store } from '../../src/store.js'
import { MemoryBackend } from '../__support__/memory-backend.js'
import { getNotCheckedList, isInNotCheckedList, toggleNotCheckedItem } from '../../src/utils/notChecked.js'

async function setupConfig(listStr = '') {
  store.init(new MemoryBackend())
  await store.setConfig({
    activeProfile: 'profile1',
    profiles: {
      profile1: {
        name: 'Profile 1',
        notChecked: { notCheckedList: listStr },
        formSkrining: {},
        skrining: {},
        zenMode: {},
        flashData: {},
      },
      profile2: {
        name: 'Profile 2',
        notChecked: {},
        formSkrining: {},
        skrining: {},
        zenMode: {},
        flashData: {},
      },
    },
  })
}

describe('notChecked', () => {
  it('getNotCheckedList should return empty array for empty list', async () => {
    await setupConfig('')
    expect(await getNotCheckedList()).toEqual([])
  })

  it('getNotCheckedList should return parsed items', async () => {
    await setupConfig('a;b;c')
    expect(await getNotCheckedList()).toEqual(['a', 'b', 'c'])
  })

  it('isInNotCheckedList should return true for existing id', async () => {
    await setupConfig('a;b')
    expect(await isInNotCheckedList('a')).toBe(true)
  })

  it('isInNotCheckedList should return false for missing id', async () => {
    await setupConfig('a;b')
    expect(await isInNotCheckedList('x')).toBe(false)
  })

  it('toggleNotCheckedItem should remove existing id', async () => {
    await setupConfig('a;b')
    const result = await toggleNotCheckedItem('a')
    expect(result).toBe(false)
    expect(await isInNotCheckedList('a')).toBe(false)
  })

  it('toggleNotCheckedItem should add missing id', async () => {
    await setupConfig('a;b')
    const result = await toggleNotCheckedItem('x')
    expect(result).toBe(true)
    expect(await isInNotCheckedList('x')).toBe(true)
  })
})
