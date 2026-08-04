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

import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { startZeroAutomation, isZeroRunning, getZeroQueue } from '../../src/handlers/zero-mode';
import { isInNotCheckedList } from '../../src/utils/notChecked';

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

  describe('startZeroAutomation', () => {
    it('should partition pending rows into uncheck and zen targets', async () => {
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

      expect(await isInNotCheckedList('rowfrmabc000002')).toBe(true);
      mockNotify.confirm.mockResolvedValue(true);

      await startZeroAutomation();

      const queueRaw = await store.storageGet('dandelion_zero_queue');
      expect(queueRaw).toBeTruthy();
      const queue = JSON.parse(queueRaw);
      expect(queue).toEqual([{ id: 'rowfrmabc000002', action: 'uncheck' }]);
    });

    it('should queue non-listed pending rows as zen targets', async () => {
      mockNotify.confirm.mockResolvedValue(true);

      await startZeroAutomation();

      const queueRaw = await store.storageGet('dandelion_zero_queue');
      expect(queueRaw).toBeTruthy();
      const queue = JSON.parse(queueRaw);
      expect(queue).toEqual([{ id: 'rowfrmabc000002', action: 'zen' }]);
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

    it('should not start when user cancels', async () => {
      mockNotify.confirm.mockResolvedValue(false);

      await startZeroAutomation();

      expect(await store.storageGet('dandelion_zero_queue')).toBeNull();
      expect(await isZeroRunning()).toBe(false);
    });
  });

  describe('getZeroQueue / isZeroRunning', () => {
    it('should expose remaining queue ids after starting', async () => {
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

      expect(await getZeroQueue()).toEqual(['rowfrmabc000002']);
      expect(await isZeroRunning()).toBe(true);
    });

    it('should report not running when no queue exists', async () => {
      expect(await isZeroRunning()).toBe(false);
      expect(await getZeroQueue()).toEqual([]);
    });
  });
});
