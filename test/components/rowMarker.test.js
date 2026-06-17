// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { createRowMarker } from '../../src/components/rowMarker';

describe('rowMarker', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    store.init(new MemoryBackend());
  });

  it('should create a div with dandelion-row-marker class', () => {
    const el = createRowMarker('row1');
    expect(el.tagName).toBe('DIV');
    expect(el.classList.contains('dandelion-row-marker')).toBe(true);
  });

  it('should set data-row-id attribute', () => {
    const el = createRowMarker('row1');
    expect(el.dataset.rowId).toBe('row1');
  });

  it('should contain span with rowId text and notCheckedToggle', async () => {
    // ensure store has config so notCheckedToggle initializes
    await store.storageSetMany({
      activeProfile: 'profile1',
      profiles: { profile1: { name: 'Profile 1', notChecked: { notCheckedList: '' } } },
    });
    const el = createRowMarker('row1');
    const span = el.querySelector('span');
    expect(span).toBeTruthy();
    expect(span.textContent).toBe('row1');
    const toggle = el.querySelector('.dandelion-not-checked-toggle');
    expect(toggle).toBeTruthy();
  });

  it('should handle empty rowId', () => {
    const el = createRowMarker('');
    expect(el.dataset.rowId).toBe('');
    const span = el.querySelector('span');
    expect(span.textContent).toBe('');
  });
});
