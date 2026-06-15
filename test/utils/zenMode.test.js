import { describe, it, expect, beforeEach } from 'vitest'
import { store } from '../../src/store.js'
import { MemoryBackend } from '../__support__/memory-backend.js'
import {
  getZenModeState,
  setZenModeState,
  isZenModeActive,
  addToQueue,
  peekNextFromQueue,
  getNextFromQueue,
  skipQueue,
  clearZenMode,
} from '../../src/utils/zenMode.js'

describe('zenMode', () => {
  beforeEach(() => {
    store.init(new MemoryBackend())
  })

  it('getZenModeState should return defaults when empty', async () => {
    const state = await getZenModeState()
    expect(state).toEqual({ active: false, queue: [], total: 0 })
  })

  it('setZenModeState should persist state', async () => {
    await setZenModeState({ active: true, queue: ['a'], total: 1 })
    const state = await getZenModeState()
    expect(state.active).toBe(true)
    expect(state.queue).toEqual(['a'])
    expect(state.total).toBe(1)
  })

  it('isZenModeActive should return false by default', async () => {
    expect(await isZenModeActive()).toBe(false)
  })

  it('isZenModeActive should return true when active', async () => {
    await setZenModeState({ active: true, queue: ['a'], total: 1 })
    expect(await isZenModeActive()).toBe(true)
  })

  it('addToQueue should set queue and total', async () => {
    await addToQueue(['a', 'b', 'c'])
    const state = await getZenModeState()
    expect(state.queue).toEqual(['a', 'b', 'c'])
    expect(state.total).toBe(3)
  })

  it('peekNextFromQueue should return first item without removing', async () => {
    await addToQueue(['a', 'b'])
    expect(await peekNextFromQueue()).toBe('a')
    const state = await getZenModeState()
    expect(state.queue).toEqual(['a', 'b'])
  })

  it('peekNextFromQueue should return null when queue is empty', async () => {
    expect(await peekNextFromQueue()).toBeNull()
  })

  it('getNextFromQueue should return first item and remove it', async () => {
    await addToQueue(['a', 'b'])
    expect(await getNextFromQueue()).toBe('a')
    const state = await getZenModeState()
    expect(state.queue).toEqual(['b'])
  })

  it('getNextFromQueue should return null when queue is empty', async () => {
    expect(await getNextFromQueue()).toBeNull()
  })

  it('skipQueue should remove first item without returning it', async () => {
    await addToQueue(['a', 'b'])
    await skipQueue()
    const state = await getZenModeState()
    expect(state.queue).toEqual(['b'])
  })

  it('clearZenMode should reset state', async () => {
    await addToQueue(['a', 'b'])
    await clearZenMode()
    const state = await getZenModeState()
    expect(state.active).toBe(false)
    expect(state.queue).toEqual([])
    expect(state.total).toBe(0)
  })
})
