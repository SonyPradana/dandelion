import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
  ACTION_PANEL_PREFIX: 'dandelion-action-',
}));

vi.mock('../../src/utils/flashSession', () => ({
  clearFlashData: vi.fn(),
}));

vi.mock('../../src/handlers/flashData', () => ({
  showFlashDataPanelIfEnabled: vi.fn(),
}));

import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { startZenAutomation, initializeZenMode } from '../../src/handlers/zen-mode';
import { teardown } from '../../src/refreshState';

describe('zen-mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.init(new MemoryBackend());
    document.body.innerHTML = rowsHtml;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initializeZenMode', () => {
    it('should stop the poll loop after teardown', async () => {
      vi.useFakeTimers();

      initializeZenMode();
      await vi.advanceTimersByTimeAsync(0);

      expect(vi.getTimerCount()).toBeGreaterThan(0);

      teardown();
      await vi.advanceTimersByTimeAsync(20_000);

      expect(vi.getTimerCount()).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('startZenAutomation', () => {
    it('should queue only pending (Dalam Pemeriksaan) rows', async () => {
      mockNotify.confirm.mockResolvedValue(true);

      await startZenAutomation();

      const state = await store.getZenModeState();
      expect(state).toEqual({
        active: true,
        queue: ['rowfrmabc000002'],
        total: 1,
        mode: 'zen',
      });
    });

    it('should call notify.alert when no pending rows found', async () => {
      document.body.innerHTML = `
        <div class="grid">
          <div id="rowfrm000099">
            <button type="button">Input Data</button>
          </div>
          <div> Selesai diperiksa </div>
        </div>
      `;

      await startZenAutomation();

      expect(mockNotify.alert).toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Tidak ada form aktif'),
      );
    });

    it('should clear flash data when user cancels', async () => {
      mockNotify.confirm.mockResolvedValue(false);
      const { clearFlashData } = await import('../../src/utils/flashSession');

      await startZenAutomation();

      expect(clearFlashData).toHaveBeenCalled();
    });
  });
});
