// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { skipButton } from '../../src/components/skipButton';

describe('skipButton', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should create a button with id dandelion-zen-skip', () => {
    const btn = skipButton();
    expect(btn).toBeInstanceOf(HTMLButtonElement);
    expect(btn.id).toBe('dandelion-zen-skip');
  });

  it('should have correct title and innerHTML', () => {
    const btn = skipButton();
    expect(btn.title).toBe('Skip to next form');
    expect(btn.innerHTML).toContain('lewati');
  });

  it('mousedown should scale down', () => {
    const btn = skipButton();
    btn.dispatchEvent(new MouseEvent('mousedown'));
    expect(btn.style.transform).toBe('scale(0.95)');
  });

  it('mouseup should reset scale', () => {
    const btn = skipButton();
    btn.dispatchEvent(new MouseEvent('mousedown'));
    btn.dispatchEvent(new MouseEvent('mouseup'));
    expect(btn.style.transform).toBe('scale(1)');
  });
});
