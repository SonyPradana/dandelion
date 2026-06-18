import { describe, it, expect, beforeEach, vi } from 'vitest';
import { controlPanel } from '../../src/components/controlPanel';
import { updateStatusPanel, removeStatusPanel } from '../../src/components/statusPanel';

describe('statusPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    controlPanel.init();
  });

  it('should create status panel with progress', () => {
    updateStatusPanel(3, 10, true);
    const panel = document.getElementById('dandelion-status-panel');
    expect(panel).toBeTruthy();
    expect(panel.textContent).toContain('3/10');
  });

  it('should show loading text when status is true', () => {
    updateStatusPanel(0, 5, true);
    const panel = document.getElementById('dandelion-status-panel');
    expect(panel.textContent).toContain('Sedang diproses');
  });

  it('should show done text when status is false', () => {
    updateStatusPanel(5, 5, false);
    const panel = document.getElementById('dandelion-status-panel');
    expect(panel.textContent).toContain('Selesai');
  });

  it('should show custom status text when string', () => {
    updateStatusPanel(1, 2, 'Custom status');
    const panel = document.getElementById('dandelion-status-panel');
    expect(panel.textContent).toContain('Custom status');
  });

  it('should add delete button when onDelete provided', () => {
    const onDelete = vi.fn();
    updateStatusPanel(1, 1, false, { onDelete });
    const panel = document.getElementById('dandelion-status-panel');
    const deleteBtn = panel.querySelector('.dandelion-delete-btn');
    expect(deleteBtn).toBeTruthy();
  });

  it('should reuse same panel on repeated calls', () => {
    updateStatusPanel(1, 5, true);
    updateStatusPanel(2, 5, true);
    const panels = document.querySelectorAll('#dandelion-status-panel');
    expect(panels.length).toBe(1);
  });

  it('removeStatusPanel should remove immediately', () => {
    updateStatusPanel(1, 1, false);
    removeStatusPanel(0);
    const panel = document.getElementById('dandelion-status-panel');
    expect(panel).toBeNull();
  });

  it('removeStatusPanel should show selesai then remove with delay', async () => {
    vi.useFakeTimers();
    updateStatusPanel(1, 1, false);
    removeStatusPanel(2000);
    let panel = document.getElementById('dandelion-status-panel');
    expect(panel.textContent).toContain('Selesai');
    vi.advanceTimersByTime(2000);
    panel = document.getElementById('dandelion-status-panel');
    expect(panel).toBeNull();
    vi.useRealTimers();
  });

  it('removeStatusPanel should do nothing if no panel exists', () => {
    expect(() => removeStatusPanel()).not.toThrow();
  });
});
