// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { zenModeButton } from '../../src/components/zenModeButton'

describe('zenModeButton', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('should create a button with id dandelion-zen-mode-toggle', () => {
    const btn = zenModeButton()
    expect(btn).toBeInstanceOf(HTMLButtonElement)
    expect(btn.id).toBe('dandelion-zen-mode-toggle')
  })

  it('should inject zen mode styles on first call', () => {
    zenModeButton()
    const style = document.getElementById('dandelion-zen-mode-style')
    expect(style).toBeTruthy()
    expect(style.textContent).toContain('@keyframes dandelion-zen-border')
    expect(style.textContent).toContain('.dandelion-zen-active')
  })

  it('should not inject styles twice', () => {
    zenModeButton()
    zenModeButton()
    const styles = document.querySelectorAll('#dandelion-zen-mode-style')
    expect(styles.length).toBe(1)
  })

  it('should have initial active class when isActive=true', () => {
    const btn = zenModeButton(true)
    expect(btn.classList.contains('dandelion-zen-active')).toBe(true)
  })

  it('should not have active class when isActive=false', () => {
    const btn = zenModeButton(false)
    expect(btn.classList.contains('dandelion-zen-active')).toBe(false)
  })

  it('setDimmed should toggle dandelion-dimmed class', () => {
    const btn = zenModeButton()
    btn.setDimmed(true)
    expect(btn.classList.contains('dandelion-dimmed')).toBe(true)
    btn.setDimmed(false)
    expect(btn.classList.contains('dandelion-dimmed')).toBe(false)
  })

  it('setActive should toggle dandelion-zen-active class', () => {
    const btn = zenModeButton()
    btn.setActive(true)
    expect(btn.classList.contains('dandelion-zen-active')).toBe(true)
    btn.setActive(false)
    expect(btn.classList.contains('dandelion-zen-active')).toBe(false)
  })

  it('reset should remove both state classes', () => {
    const btn = zenModeButton()
    btn.setDimmed(true)
    btn.setActive(true)
    btn.reset()
    expect(btn.classList.contains('dandelion-dimmed')).toBe(false)
    expect(btn.classList.contains('dandelion-zen-active')).toBe(false)
  })

  it('mousedown should scale when not dimmed', () => {
    const btn = zenModeButton()
    btn.dispatchEvent(new MouseEvent('mousedown'))
    expect(btn.style.transform).toBe('scale(0.95)')
  })

  it('mousedown should be ignored when dimmed', () => {
    const btn = zenModeButton()
    btn.setDimmed(true)
    btn.dispatchEvent(new MouseEvent('mousedown'))
    expect(btn.style.transform).not.toBe('scale(0.95)')
  })

  it('mouseup should reset scale', () => {
    const btn = zenModeButton()
    btn.dispatchEvent(new MouseEvent('mousedown'))
    btn.dispatchEvent(new MouseEvent('mouseup'))
    expect(btn.style.transform).toBe('scale(1)')
  })
})
