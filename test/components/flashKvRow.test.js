// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { addKvRow, rebuildKvRows, S } from '../../src/components/flashKvRow'

describe('flashKvRow', () => {
  let container = null

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('S should have input, row style constants', () => {
    expect(S.input).toBeTypeOf('function')
    expect(S.input(2)).toContain('flex:2')
    expect(S.row).toContain('display:flex')
  })

  it('addKvRow should create a row with key input, value input, remove button', () => {
    addKvRow(container, 'field1', 'val1', vi.fn())
    const rows = container.children
    expect(rows.length).toBe(1)
    const row = rows[0]
    expect(row.querySelector('.flash-kv-key')).toBeTruthy()
    expect(row.querySelector('.flash-kv-val')).toBeTruthy()
    const rmBtn = row.querySelector('button')
    expect(rmBtn).toBeTruthy()
    expect(rmBtn.textContent).toBe('\u00D7')
  })

  it('addKvRow should set key and value correctly', () => {
    addKvRow(container, 'my-key', 'my-value', vi.fn())
    const keyInput = container.querySelector('.flash-kv-key')
    const valInput = container.querySelector('.flash-kv-val')
    expect(keyInput.value).toBe('my-key')
    expect(valInput.value).toBe('my-value')
  })

  it('addKvRow should fire onRowChange on key input', () => {
    const onChange = vi.fn()
    addKvRow(container, 'k', 'v', onChange)
    const keyInput = container.querySelector('.flash-kv-key')
    keyInput.value = 'new-key'
    keyInput.dispatchEvent(new Event('input', { bubbles: true }))
    expect(onChange).toHaveBeenCalled()
  })

  it('addKvRow should fire onRowChange on value input', () => {
    const onChange = vi.fn()
    addKvRow(container, 'k', 'v', onChange)
    const valInput = container.querySelector('.flash-kv-val')
    valInput.value = 'new-val'
    valInput.dispatchEvent(new Event('input', { bubbles: true }))
    expect(onChange).toHaveBeenCalled()
  })

  it('addKvRow should fire onRowChange on remove button click', () => {
    const onChange = vi.fn()
    addKvRow(container, 'k', 'v', onChange)
    const rmBtn = container.querySelector('button')
    rmBtn.click()
    expect(onChange).toHaveBeenCalled()
    expect(container.children.length).toBe(0)
  })

  it('rebuildKvRows should clear and rebuild from object', () => {
    addKvRow(container, 'old', 'val', vi.fn())
    const onChange = vi.fn()
    rebuildKvRows(container, { a: '1', b: '2' }, onChange)
    const keyInputs = container.querySelectorAll('.flash-kv-key')
    const valInputs = container.querySelectorAll('.flash-kv-val')
    expect(keyInputs.length).toBe(2)
    expect(valInputs.length).toBe(2)
    expect(keyInputs[0].value).toBe('a')
    expect(valInputs[0].value).toBe('1')
    expect(keyInputs[1].value).toBe('b')
    expect(valInputs[1].value).toBe('2')
  })

  it('rebuildKvRows with empty object should clear all rows', () => {
    addKvRow(container, 'k', 'v', vi.fn())
    rebuildKvRows(container, {}, vi.fn())
    expect(container.children.length).toBe(0)
  })
})
