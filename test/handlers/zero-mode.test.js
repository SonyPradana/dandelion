import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rowsHtml = readFileSync(resolve('test/__fixtures__/rows.html'), 'utf8');

const mockNotify = vi.hoisted(() => ({
  alert: vi.fn(),
  confirm: vi.fn(),
  info: vi.fn(),
  countdown: vi.fn(),
}));

vi.mock('../../src/components/notification', () => ({
  notify: mockNotify,
}));

vi.mock('../../src/utils/flashSession', () => ({
  clearFlashData: vi.fn(),
}));

vi.mock('../../src/handlers/flashData', () => ({
  showFlashDataPanelIfEnabled: vi.fn(),
}));

vi.mock('../../src/handlers/inspection/not-checked-utils', () => ({
  waitForRow: vi.fn(() => new Promise(() => {})),
  waitForElement: vi.fn(),
  clickFinishServiceButton: vi.fn(),
  hasRemainingForms: vi.fn().mockResolvedValue(false),
}));

import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { startZeroAutomation, isZeroRunning, getZeroQueue } from '../../src/handlers/zero-mode';
import { waitForRow, waitForElement } from '../../src/handlers/inspection/not-checked-utils';

describe('zero-mode', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    store.init(new MemoryBackend());
    document.body.innerHTML = rowsHtml;

    await store.setConfig({
      activeProfile: 'profile1',
      profiles: {
        profile1: {
          name: 'Default Profile',
          notChecked: {
            notCheckedList: '',
          },
          zenMode: {},
        },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function flushAll() {
    for (let i = 0; i < 20; i += 1) {
      await vi.advanceTimersByTimeAsync(0);
    }
  }

  describe('startZeroAutomation', () => {
    it('should save the pending rows to the shared zen state with mode zero', async () => {
      mockNotify.confirm.mockResolvedValue(true);

      await startZeroAutomation();

      const state = await store.getZenModeState();
      expect(state).toEqual({
        active: true,
        queue: ['rowfrmabc000002'],
        total: 1,
        mode: 'zero',
      });
    });

    it('should keep the same queue regardless of the notCheckedList membership', async () => {
      await store.setConfig({
        activeProfile: 'profile1',
        profiles: {
          profile1: {
            name: 'Default Profile',
            notChecked: {
              notCheckedList: 'rowfrmabc000002',
            },
            zenMode: {},
          },
        },
      });
      mockNotify.confirm.mockResolvedValue(true);

      await startZeroAutomation();

      const state = await store.getZenModeState();
      expect(state.queue).toEqual(['rowfrmabc000002']);
      expect(state.mode).toBe('zero');
    });

    it('should report uncheck and fill counts in the confirm message', async () => {
      await store.setConfig({
        activeProfile: 'profile1',
        profiles: {
          profile1: {
            name: 'Default Profile',
            notChecked: {
              notCheckedList: 'rowfrmabc000001;rowfrmabc000002',
            },
            zenMode: {},
          },
        },
      });
      mockNotify.confirm.mockResolvedValue(true);

      await startZeroAutomation();

      expect(mockNotify.confirm).toHaveBeenCalledWith(
        'Zero Mode',
        expect.stringContaining('Ditemukan 1 form aktif (1 di-uncheck, 0 diisi). Mulai Zero Mode?'),
      );
    });

    it('should alert when no pending rows found', async () => {
      document.body.innerHTML = `
        <div class="grid">
          <div id="rowfrm000099">
            <button type="button">Input Data</button>
          </div>
          <div> Selesai diperiksa </div>
        </div>
      `;

      await startZeroAutomation();

      expect(mockNotify.alert).toHaveBeenCalledWith(
        'Zero Mode',
        expect.stringContaining('Tidak ada form aktif'),
      );
    });

    it('should clear flash data when user cancels', async () => {
      mockNotify.confirm.mockResolvedValue(false);
      const { clearFlashData } = await import('../../src/utils/flashSession');

      await startZeroAutomation();

      expect(clearFlashData).toHaveBeenCalled();
      expect(await store.getZenModeState()).toEqual({
        active: false,
        queue: [],
        total: 0,
      });
    });
  });

  describe('processNextZeroItem', () => {
    it('should uncheck an item that is in the notCheckedList', async () => {
      await store.setConfig({
        activeProfile: 'profile1',
        profiles: {
          profile1: {
            name: 'Default Profile',
            notChecked: {
              notCheckedList: 'rowfrmabc000002',
            },
            zenMode: {},
          },
        },
      });

      document.body.innerHTML = '';
      const rowEl = document.createElement('div');
      rowEl.id = 'rowfrmabc000002';
      rowEl.innerHTML = '<label>Form Title</label><button type="button">Input Data</button>';
      const grid = document.createElement('div');
      grid.className = 'grid';
      grid.appendChild(rowEl);
      document.body.appendChild(grid);

      const confirmBtn = { click: vi.fn() };
      vi.mocked(waitForRow).mockResolvedValue(rowEl);
      vi.mocked(waitForElement).mockResolvedValue(confirmBtn);

      mockNotify.confirm.mockResolvedValue(true);

      await startZeroAutomation();
      await flushAll();

      expect(waitForElement).toHaveBeenCalledWith('button', 'Tidak Periksa', 6000);
      expect(confirmBtn.click).toHaveBeenCalled();
      expect(await getZeroQueue()).toEqual([]);
    });

    it('should visit and fill an item that is NOT in the notCheckedList', async () => {
      document.body.innerHTML = '';
      const rowEl = document.createElement('div');
      rowEl.id = 'rowfrmabc000002';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Input Data';
      btn.click = vi.fn();
      rowEl.appendChild(btn);
      const grid = document.createElement('div');
      grid.className = 'grid';
      grid.appendChild(rowEl);
      document.body.appendChild(grid);

      vi.mocked(waitForRow).mockResolvedValue(rowEl);

      mockNotify.confirm.mockResolvedValue(true);

      await startZeroAutomation();
      await flushAll();

      expect(waitForElement).not.toHaveBeenCalled();
      expect(btn.click).toHaveBeenCalled();
      expect(grid.style.backgroundColor).toBe('#e0f2fe');
      expect(await getZeroQueue()).toEqual(['rowfrmabc000002']);
    });
  });

  describe('getZeroQueue / isZeroRunning', () => {
    it('should expose the shared queue only for zero sessions', async () => {
      await store.setZenModeState({
        active: true,
        queue: ['rowfrmabc000002'],
        total: 1,
        mode: 'zero',
      });

      expect(await getZeroQueue()).toEqual(['rowfrmabc000002']);
      expect(await isZeroRunning()).toBe(true);
    });

    it('should report not running for zen-mode sessions', async () => {
      await store.setZenModeState({
        active: true,
        queue: ['rowfrmabc000002'],
        total: 1,
        mode: 'zen',
      });

      expect(await isZeroRunning()).toBe(false);
      expect(await getZeroQueue()).toEqual([]);
    });

    it('should report not running when no state exists', async () => {
      expect(await isZeroRunning()).toBe(false);
      expect(await getZeroQueue()).toEqual([]);
    });
  });
});
