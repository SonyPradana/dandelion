import { describe, it, expect, beforeEach } from 'vitest';
import { debugButton } from '../../src/components/debugButton';

describe('debugButton', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('should create a button with id dandelion-debug-toggle', () => {
    const btn = debugButton();
    expect(btn).toBeInstanceOf(HTMLButtonElement);
    expect(btn.id).toBe('dandelion-debug-toggle');
  });

  it('setDimmed should toggle dandelion-dimmed class', () => {
    const btn = debugButton();
    btn.setDimmed(true);
    expect(btn.classList.contains('dandelion-dimmed')).toBe(true);
    btn.setDimmed(false);
    expect(btn.classList.contains('dandelion-dimmed')).toBe(false);
  });

  it('reset should remove dandelion-dimmed class', () => {
    const btn = debugButton();
    btn.setDimmed(true);
    btn.reset();
    expect(btn.classList.contains('dandelion-dimmed')).toBe(false);
  });

  it('mousedown should scale when not dimmed', () => {
    const btn = debugButton();
    btn.dispatchEvent(new MouseEvent('mousedown'));
    expect(btn.style.transform).toBe('scale(0.95)');
  });

  it('mousedown should be ignored when dimmed', () => {
    const btn = debugButton();
    btn.setDimmed(true);
    btn.dispatchEvent(new MouseEvent('mousedown'));
    expect(btn.style.transform).not.toBe('scale(0.95)');
  });

  it('mouseup should reset scale', () => {
    const btn = debugButton();
    btn.dispatchEvent(new MouseEvent('mousedown'));
    btn.dispatchEvent(new MouseEvent('mouseup'));
    expect(btn.style.transform).toBe('scale(1)');
  });
});
