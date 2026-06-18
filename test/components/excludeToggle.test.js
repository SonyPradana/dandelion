import { describe, it, expect, vi } from 'vitest';
import { createExcludeToggle } from '../../src/components/excludeToggle';

describe('excludeToggle', () => {
  // NOTE: don't clear document.head because stylesInitialized flag
  // persists between tests in the same file

  it('should create a span with dandelion-exclude-toggle class', () => {
    const el = createExcludeToggle('field1');
    expect(el.tagName).toBe('SPAN');
    expect(el.classList.contains('dandelion-exclude-toggle')).toBe(true);
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('should inject styles on first call', () => {
    createExcludeToggle('f1');
    const style = document.querySelector('style');
    expect(style).toBeTruthy();
    expect(style.textContent).toContain('.dandelion-exclude-toggle');
  });

  it('should not inject styles twice', () => {
    createExcludeToggle('f1');
    createExcludeToggle('f2');
    expect(document.querySelectorAll('style').length).toBe(1);
  });

  it('should show excluded state when initialExcluded=true', () => {
    const el = createExcludeToggle('f1', { initialExcluded: true });
    expect(el.textContent).toBe('❌');
    expect(el.getAttribute('aria-label')).toBe('Include this question');
  });

  it('should show included state when initialExcluded=false', () => {
    const el = createExcludeToggle('f1', { initialExcluded: false });
    expect(el.textContent).toBe('➕');
    expect(el.getAttribute('aria-label')).toBe('Exclude this question');
  });

  it('should show unknown state when initialExcluded not set', () => {
    const el = createExcludeToggle('f1');
    expect(el.textContent).toBe('⋯');
  });

  it('should call onToggle on click', async () => {
    const onToggle = vi.fn().mockResolvedValue(true);
    const el = createExcludeToggle('f1', { onToggle });
    el.click();
    expect(onToggle).toHaveBeenCalledWith('f1');
  });

  it('should update state after onToggle resolves', async () => {
    const onToggle = vi.fn().mockResolvedValue(true);
    const el = createExcludeToggle('f1', { initialExcluded: false, onToggle });
    el.click();
    await vi.waitFor(() => {
      expect(el.textContent).toBe('❌');
    });
  });

  it('should show loading state during toggle', async () => {
    let resolveToggle = null;
    const onToggle = vi.fn().mockReturnValue(
      new Promise((r) => {
        resolveToggle = r;
      }),
    );
    const el = createExcludeToggle('f1', { onToggle });
    el.click();
    await vi.waitFor(() => {
      expect(el.classList.contains('loading')).toBe(true);
    });
    resolveToggle(true);
    await vi.waitFor(() => {
      expect(el.classList.contains('loading')).toBe(false);
    });
  });

  it('should show error state on failed toggle', async () => {
    const onToggle = vi.fn().mockRejectedValue(new Error('fail'));
    const el = createExcludeToggle('f1', { onToggle });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    el.click();
    await vi.waitFor(() => {
      expect(el.textContent).toBe('⚠️');
    });
    spy.mockRestore();
  });

  it('should call onToggle on keydown Enter', () => {
    const onToggle = vi.fn().mockResolvedValue(true);
    const el = createExcludeToggle('f1', { onToggle });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onToggle).toHaveBeenCalled();
  });

  it('should call onToggle on keydown Space', () => {
    const onToggle = vi.fn().mockResolvedValue(true);
    const el = createExcludeToggle('f1', { onToggle });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(onToggle).toHaveBeenCalled();
  });

  it('click should stop propagation', () => {
    const onToggle = vi.fn().mockResolvedValue(true);
    const el = createExcludeToggle('f1', { onToggle });
    const parent = document.createElement('div');
    parent.appendChild(el);
    const onParentClick = vi.fn();
    parent.addEventListener('click', onParentClick);
    el.click();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('should not throw when onToggle is not provided', () => {
    const el = createExcludeToggle('f1');
    expect(() => el.click()).not.toThrow();
  });
});
