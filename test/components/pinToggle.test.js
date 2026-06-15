// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinToggle } from '../../src/components/pinToggle'

describe('pinToggle', () => {
  // NOTE: don't clear document.head because stylesInitialized flag
  // persists between tests in the same file

  it('should create a span with dandelion-pin-toggle class', () => {
    const el = createPinToggle('field1', () => 'val')
    expect(el.tagName).toBe('SPAN')
    expect(el.classList.contains('dandelion-pin-toggle')).toBe(true)
    expect(el.getAttribute('role')).toBe('button')
    expect(el.getAttribute('tabindex')).toBe('0')
  })

  it('should inject styles on first call', () => {
    createPinToggle('f1', () => 'v')
    const style = document.querySelector('style')
    expect(style).toBeTruthy()
    expect(style.textContent).toContain('.dandelion-pin-toggle')
  })

  it('should not inject styles twice', () => {
    createPinToggle('f1', () => 'v')
    createPinToggle('f2', () => 'v')
    expect(document.querySelectorAll('style').length).toBe(1)
  })

  it('should show pinned state when initialPinned=true', () => {
    const el = createPinToggle('f1', () => 'v', { initialPinned: true })
    expect(el.classList.contains('active')).toBe(true)
    expect(el.getAttribute('aria-label')).toBe('Unpin this field')
  })

  it('should show unpinned state when initialPinned=false', () => {
    const el = createPinToggle('f1', () => 'v', { initialPinned: false })
    expect(el.classList.contains('active')).toBe(false)
    expect(el.getAttribute('aria-label')).toBe('Pin this field')
  })

  it('should show unknown state when initialPinned not set', () => {
    const el = createPinToggle('f1', () => 'v')
    expect(el.style.opacity).toBe('0.3')
  })

  it('should call onToggle on click', async () => {
    const onToggle = vi.fn().mockResolvedValue(true)
    const el = createPinToggle('f1', () => 'v', { onToggle })
    el.click()
    expect(onToggle).toHaveBeenCalledWith('f1', 'v')
  })

  it('should update state after onToggle resolves', async () => {
    const onToggle = vi.fn().mockResolvedValue(true)
    const el = createPinToggle('f1', () => 'v', { initialPinned: false, onToggle })
    el.click()
    // wait for async handler
    await vi.waitFor(() => {
      expect(el.classList.contains('active')).toBe(true)
    })
  })

  it('should show loading state during toggle', async () => {
    let resolveToggle = null
    const onToggle = vi.fn().mockReturnValue(new Promise((r) => { resolveToggle = r }))
    const el = createPinToggle('f1', () => 'v', { onToggle })
    el.click()
    await vi.waitFor(() => {
      expect(el.classList.contains('loading')).toBe(true)
    })
    resolveToggle(true)
    await vi.waitFor(() => {
      expect(el.classList.contains('loading')).toBe(false)
    })
  })

  it('should show error state on failed toggle', async () => {
    const onToggle = vi.fn().mockRejectedValue(new Error('fail'))
    const el = createPinToggle('f1', () => 'v', { onToggle })
    // suppress console.error in test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    el.click()
    await vi.waitFor(() => {
      expect(el.textContent).toBe('⚠️')
    })
    spy.mockRestore()
  })

  it('should call onToggle on keydown Enter', () => {
    const onToggle = vi.fn().mockResolvedValue(true)
    const el = createPinToggle('f1', () => 'v', { onToggle })
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(onToggle).toHaveBeenCalled()
  })

  it('should call onToggle on keydown Space', () => {
    const onToggle = vi.fn().mockResolvedValue(true)
    const el = createPinToggle('f1', () => 'v', { onToggle })
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    expect(onToggle).toHaveBeenCalled()
  })

  it('click should stop propagation', () => {
    const onToggle = vi.fn().mockResolvedValue(true)
    const el = createPinToggle('f1', () => 'v', { onToggle })
    const parent = document.createElement('div')
    parent.appendChild(el)
    const onParentClick = vi.fn()
    parent.addEventListener('click', onParentClick)
    el.click()
    expect(onParentClick).not.toHaveBeenCalled()
  })

  it('should not throw when onToggle is not provided', () => {
    const el = createPinToggle('f1', () => 'v')
    expect(() => el.click()).not.toThrow()
  })
})
