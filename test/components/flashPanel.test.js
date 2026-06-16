// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { store } from '../../src/store'
import { MemoryBackend } from '../__support__/memory-backend'
import { controlPanel } from '../../src/components/controlPanel'
import { showFlashDataPanel } from '../../src/components/flashPanel'

describe('flashPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
    store.init(new MemoryBackend())
    controlPanel.init()
  })

  it('should create panel with id dandelion-flash-data', () => {
    showFlashDataPanel()
    const panel = document.getElementById('dandelion-flash-data')
    expect(panel).toBeTruthy()
  })

  it('should have JSON and KV tab buttons', () => {
    showFlashDataPanel()
    const panel = document.getElementById('dandelion-flash-data')
    expect(panel.textContent).toContain('Raw JSON')
    expect(panel.textContent).toContain('Tabel KV')
  })

  it('should show JSON tab by default', () => {
    showFlashDataPanel()
    const textarea = document.querySelector('textarea')
    expect(textarea).toBeTruthy()
    expect(textarea.style.display).not.toBe('none')
  })

  it('should switch to KV tab when clicked', () => {
    showFlashDataPanel()
    const buttons = document.querySelectorAll('button')
    const kvBtn = Array.from(buttons).find((b) => b.textContent === 'Tabel KV')
    kvBtn.click()
    // textarea container gets display:none, KV inputs become visible
    const inputs = document.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    // Verify textarea is hidden (container has display:none)
    const textarea = document.querySelector('textarea')
    expect(textarea.closest('[style*="display: none"]')).toBeTruthy()
  })

  it('should have Gunakan button', () => {
    showFlashDataPanel()
    const panel = document.getElementById('dandelion-flash-data')
    expect(panel.textContent).toContain('Gunakan')
  })

  it('should remove existing panel before creating new one', () => {
    showFlashDataPanel()
    showFlashDataPanel()
    const panels = document.querySelectorAll('#dandelion-flash-data')
    expect(panels.length).toBe(1)
  })

  it('should allow adding KV row in KV tab', () => {
    showFlashDataPanel()
    // Switch to KV tab
    const buttons = document.querySelectorAll('button')
    const kvBtn = Array.from(buttons).find((b) => b.textContent === 'Tabel KV')
    kvBtn.click()
    // Find add inputs
    const inputs = document.querySelectorAll('input')
    const keyInput = inputs[0]
    const valInput = inputs[1]
    const addBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === '+')
    keyInput.value = 'test-field'
    valInput.value = 'test-value'
    addBtn.click()
    const kvKeys = document.querySelectorAll('.flash-kv-key')
    expect(kvKeys.length).toBe(1)
    expect(kvKeys[0].value).toBe('test-field')
  })
})
