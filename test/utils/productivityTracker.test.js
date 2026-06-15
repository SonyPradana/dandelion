import { describe, it, expect, beforeEach, vi } from 'vitest'
import { store } from '../../src/store.js'
import { MemoryBackend } from '../__support__/memory-backend.js'
import {
  increment,
  incrementBatch,
  getTodaySummary,
  getYesterdaySummary,
  getMonthTotal,
  getWeekTotal,
  getOverallBreakdown,
  getFullHistory,
  isDailyLimitReached,
  WEIGHTS,
  MONTHLY_TARGET,
  TARGET_MODE,
  DAILY_LIMIT,
} from '../../src/utils/productivityTracker.js'

describe('productivityTracker', () => {
  beforeEach(() => {
    store.init(new MemoryBackend())
  })

  describe('constants', () => {
    it('should have correct WEIGHTS', () => {
      expect(WEIGHTS).toEqual({ radio: 1, freetext: 1, dropdown: 1, formNotChecked: 5, formZen: 5 })
    })

    it('should have MONTHLY_TARGET', () => {
      // oxlint-disable-next-line unicorn/numeric-separators-style
      expect(MONTHLY_TARGET).toBe(30_000)
    })

    it('should have TARGET_MODE', () => {
      expect(TARGET_MODE).toBe('weekly')
    })

    it('should have DAILY_LIMIT', () => {
      // oxlint-disable-next-line unicorn/numeric-separators-style
      expect(DAILY_LIMIT).toBe(13_200)
    })
  })

  it('getTodaySummary should return null when no data', async () => {
    expect(await getTodaySummary()).toBeNull()
  })

  it('getYesterdaySummary should return null when no data', async () => {
    expect(await getYesterdaySummary()).toBeNull()
  })

  it('incrementBatch should accumulate counts', async () => {
    await incrementBatch({ radio: 2, dropdown: 1 })
    const summary = await getTodaySummary()
    expect(summary.counts.radio).toBe(2)
    expect(summary.counts.dropdown).toBe(1)
    expect(summary.dayTotal).toBe(3)
  })

  it('increment should add to a single category', async () => {
    await increment('formZen')
    const summary = await getTodaySummary()
    expect(summary.counts.formZen).toBe(1)
  })

  it('increment should warn for unknown category', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await increment('unknown')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('getFullHistory should return raw data', async () => {
    await incrementBatch({ radio: 1 })
    const history = await getFullHistory()
    expect(history).toHaveProperty('_meta')
  })

  it('isDailyLimitReached should return false below limit', async () => {
    expect(await isDailyLimitReached()).toBe(false)
  })

  it('getOverallBreakdown should aggregate data', async () => {
    await incrementBatch({ radio: 5 })
    const breakdown = await getOverallBreakdown()
    expect(breakdown.counts.radio).toBe(5)
    expect(breakdown.grandTotal).toBeGreaterThan(0)
    expect(breakdown.activeDays).toBeGreaterThan(0)
  })

  describe('weight calculations', () => {
    it('formNotChecked should weight 5x', async () => {
      await incrementBatch({ formNotChecked: 1 })
      const summary = await getTodaySummary()
      expect(summary.dayTotal).toBe(5)
    })

    it('formZen should weight 5x', async () => {
      await incrementBatch({ formZen: 1 })
      const summary = await getTodaySummary()
      expect(summary.dayTotal).toBe(5)
    })
  })

  describe('getMonthTotal', () => {
    it('should sum day totals for current month', async () => {
      await incrementBatch({ radio: 10 })
      const total = await getMonthTotal()
      expect(total).toBe(10)
    })
  })

  describe('getWeekTotal', () => {
    it('should sum day totals for current week', async () => {
      await incrementBatch({ radio: 10 })
      const total = await getWeekTotal()
      expect(total).toBe(10)
    })
  })
})
