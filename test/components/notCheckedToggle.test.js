// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { createNotCheckedToggle } from '../../src/components/notCheckedToggle';

async function setupConfig(notCheckedList = '') {
  await store.storageSetMany({
    activeProfile: 'profile1',
    profiles: {
      profile1: {
        name: 'Profile 1',
        notChecked: {
          notCheckedList,
        },
      },
    },
  });
}

describe('notCheckedToggle', () => {
  beforeEach(async () => {
    store.init(new MemoryBackend());
  });

  it('should create a span with dandelion-not-checked-toggle class', () => {
    const el = createNotCheckedToggle('row1');
    expect(el).toBeInstanceOf(HTMLSpanElement);
    expect(el.classList.contains('dandelion-not-checked-toggle')).toBe(true);
  });

  it('should show plus when item not in list', async () => {
    await setupConfig('');
    const el = createNotCheckedToggle('row1');
    await vi.waitFor(() => {
      expect(el.textContent).toBe('➕');
    });
  });

  it('should show cross when item is in list', async () => {
    await setupConfig('row1;row2');
    const el = createNotCheckedToggle('row1');
    await vi.waitFor(() => {
      expect(el.textContent).toBe('❌');
    });
  });

  it('should toggle from absent to present on click', async () => {
    await setupConfig('');
    const el = createNotCheckedToggle('row1');
    await vi.waitFor(() => {
      expect(el.textContent).toBe('➕');
    });
    el.click();
    await vi.waitFor(() => {
      expect(el.textContent).toBe('❌');
    });
  });

  it('should toggle from present to absent on click', async () => {
    await setupConfig('row1');
    const el = createNotCheckedToggle('row1');
    await vi.waitFor(() => {
      expect(el.textContent).toBe('❌');
    });
    el.click();
    await vi.waitFor(() => {
      expect(el.textContent).toBe('➕');
    });
  });

  it('should stop click propagation', () => {
    const el = createNotCheckedToggle('row1');
    const parent = document.createElement('div');
    parent.appendChild(el);
    const onParentClick = vi.fn();
    parent.addEventListener('click', onParentClick);
    el.click();
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
