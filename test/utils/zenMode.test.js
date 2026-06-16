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

  describe('error handling', () => {
    it('addToQueue should handle empty array', async () => {
      await addToQueue([])
      const state = await getZenModeState()
      expect(state.queue).toEqual([])
      expect(state.total).toBe(0)
    })

    it('peekNextFromQueue on single-item queue should work', async () => {
      await addToQueue(['only'])
      const next = await peekNextFromQueue()
      expect(next).toBe('only')
    })

    it('getNextFromQueue on single-item queue should pop correctly', async () => {
      await addToQueue(['only'])
      const next = await getNextFromQueue()
      expect(next).toBe('only')
      const state = await getZenModeState()
      expect(state.queue).toEqual([])
    })

    it('skipQueue on empty queue should not error', async () => {
      expect(async () => {
        await skipQueue()
      }).not.toThrow()
    })

    it('skipQueue on single-item queue should work', async () => {
      await addToQueue(['only'])
      await skipQueue()
      const state = await getZenModeState()
      expect(state.queue).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle large queue', async () => {
      const largeQueue = Array.from({ length: 1000 }, (_, i) => `item${i}`)
      await addToQueue(largeQueue)
      const state = await getZenModeState()
      expect(state.queue).toHaveLength(1000)
      expect(state.total).toBe(1000)
    })

    it('should handle repeated operations on same queue', async () => {
      await addToQueue(['a', 'b', 'c'])
      expect(await getNextFromQueue()).toBe('a')
      expect(await getNextFromQueue()).toBe('b')
      expect(await getNextFromQueue()).toBe('c')
      expect(await getNextFromQueue()).toBeNull()
    })

    it('should handle items with special characters', async () => {
      const specialItems = ['item-@#$%', 'item with spaces', 'item\twith\ttabs']
      await addToQueue(specialItems)
      expect(await peekNextFromQueue()).toBe('item-@#$%')
    })

    it('should preserve queue order through multiple operations', async () => {
      await addToQueue(['a', 'b', 'c'])
      expect(await getNextFromQueue()).toBe('a')
      expect(await peekNextFromQueue()).toBe('b')
      await getNextFromQueue()
      expect(await peekNextFromQueue()).toBe('c')
    })

    it('setZenModeState should override queue', async () => {
      await addToQueue(['a', 'b'])
      await setZenModeState({ active: true, queue: ['x', 'y', 'z'], total: 3 })
      const state = await getZenModeState()
      expect(state.queue).toEqual(['x', 'y', 'z'])
    })

    it('clearZenMode multiple times should be idempotent', async () => {
      await addToQueue(['a', 'b'])
      await clearZenMode()
      await clearZenMode()
      const state = await getZenModeState()
      expect(state.active).toBe(false)
      expect(state.queue).toEqual([])
    })

    it('should track total correctly', async () => {
      await addToQueue(['a', 'b', 'c'])
      const state1 = await getZenModeState()
      expect(state1.total).toBe(3)
      await getNextFromQueue()
      const state2 = await getZenModeState()
      expect(state2.total).toBe(3)
    })
  })
})
