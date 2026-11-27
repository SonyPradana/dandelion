import { describe, it, expect } from 'vitest';
import { refreshButton } from '../../src/components/refreshButton';

describe('refreshButton', () => {
  it('creates a small overlay button for the panel corner', () => {
    const btn = refreshButton();

    expect(btn.id).toBe('dandelion-refresh-handler');
    expect(btn.type).toBe('button');
    expect(btn.title).toBe('Refresh Handler');
    expect(btn.getAttribute('aria-label')).toBe('Refresh Handler');
    expect(btn.style.position).toBe('absolute');
    expect(btn.style.pointerEvents).toBe('auto');
  });
});
