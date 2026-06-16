// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { sendButton } from '../../src/components/sendButton'

describe('sendButton', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should create a button with id dandelion-send-btn', () => {
    const btn = sendButton()
    expect(btn).toBeInstanceOf(HTMLButtonElement)
    expect(btn.id).toBe('dandelion-send-btn')
  })

  it('should have correct title and innerHTML', () => {
    const btn = sendButton()
    expect(btn.title).toBe('Kirim form')
    expect(btn.innerHTML).toContain('kirim')
  })

  it('mousedown should scale down', () => {
    const btn = sendButton()
    btn.dispatchEvent(new MouseEvent('mousedown'))
    expect(btn.style.transform).toBe('scale(0.95)')
  })

  it('mouseup should reset scale', () => {
    const btn = sendButton()
    btn.dispatchEvent(new MouseEvent('mousedown'))
    btn.dispatchEvent(new MouseEvent('mouseup'))
    expect(btn.style.transform).toBe('scale(1)')
  })
})
