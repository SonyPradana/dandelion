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

vi.mock('../../src/utils/zenMode', () => ({
  isZenModeActive: vi.fn().mockResolvedValue(false),
  clearZenMode: vi.fn(),
  getZenModeState: vi.fn().mockResolvedValue({ active: false, queue: [], total: 0 }),
  peekNextFromQueue: vi.fn().mockResolvedValue(null),
  getNextFromQueue: vi.fn().mockResolvedValue(null),
  setZenModeState: vi.fn().mockResolvedValue(),
  skipQueue: vi.fn(),
}));

vi.mock('../../src/handlers/zen-mode', () => ({
  startZenAutomation: vi.fn(),
  initializeZenMode: vi.fn(),
}));

vi.mock('../../src/handlers/zero-mode', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    startZeroAutomation: vi.fn(),
    initializeZeroMode: vi.fn(),
    isZeroRunning: vi.fn().mockResolvedValue(false),
  };
});

vi.mock('../../src/quota/quota-manager', () => ({
  isFeatureEnabled: vi.fn().mockReturnValue(true),
}));

import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { initialize } from '../../src/handlers/skrining-form-not-checked';
import { isZeroRunning } from '../../src/handlers/zero-mode';
import { isFeatureEnabled } from '../../src/quota/quota-manager';

describe('skrining-form-not-checked', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(isFeatureEnabled).mockReturnValue(true);
    vi.mocked(isZeroRunning).mockResolvedValue(false);
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
        },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialize', () => {
    it('should mount control buttons on processing page', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      const mainBtn = document.getElementById('dandelion-not-checked-automation');
      expect(mainBtn).toBeTruthy();
      expect(mainBtn.tagName).toBe('BUTTON');

      const panel = document.getElementById('dandelion-control-panel');
      expect(panel).toBeTruthy();
    });

    it('should NOT mount control buttons on non-processing page', async () => {
      document.body.innerHTML = '<div>Tidak ada status</div>';

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      const mainBtn = document.getElementById('dandelion-not-checked-automation');
      expect(mainBtn).toBeFalsy();
    });

    it('should remove buttons when page changes from processing to non-processing', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      expect(document.getElementById('dandelion-not-checked-automation')).toBeTruthy();

      document.body.innerHTML = '<div>Selesai</div>';

      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(0);

      expect(document.getElementById('dandelion-not-checked-automation')).toBeFalsy();
    });

    it('should show running state when pending data exists', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';
      await store.storageSet('dandelion_pending_not_checked', JSON.stringify(['rowfrm000184']));
      await store.storageSet('dandelion_total_not_checked', '1');

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      const mainBtn = document.getElementById('dandelion-not-checked-automation');
      expect(mainBtn).toBeTruthy();
      expect(mainBtn.classList.contains('dandelion-running')).toBe(true);
    });

    it('should mount Zero button in a row left of the not-checked button', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      const zeroRow = document.getElementById('dandelion-zero-row');
      expect(zeroRow).toBeTruthy();

      const zeroBtn = document.getElementById('dandelion-zero-toggle');
      expect(zeroBtn).toBeTruthy();
      expect(zeroBtn.textContent).toBe('Zero');
      expect(zeroBtn.style.background).toBe('#ffffff');
      expect(zeroBtn.style.color).toBe('#000000');
      expect(zeroBtn.style.fontWeight).toBe('bold');

      const mainBtn = document.getElementById('dandelion-not-checked-automation');
      const rowChildren = Array.from(zeroRow.children);
      expect(rowChildren[0]).toBe(zeroBtn);
      expect(rowChildren[1]).toBe(mainBtn);
    });

    it('should NOT mount Zero or zen buttons when zen-mode feature is disabled', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';
      vi.mocked(isFeatureEnabled).mockReturnValue(false);

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      expect(document.getElementById('dandelion-zero-row')).toBeFalsy();
      expect(document.getElementById('dandelion-zero-toggle')).toBeFalsy();
      expect(document.getElementById('dandelion-zen-mode-toggle')).toBeFalsy();

      const mainBtn = document.getElementById('dandelion-not-checked-automation');
      expect(mainBtn).toBeTruthy();
    });

    it('should dim (not activate) the zen button while Zero is running', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';
      vi.mocked(isZeroRunning).mockResolvedValue(true);

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      const zenBtn = document.getElementById('dandelion-zen-mode-toggle');
      expect(zenBtn).toBeTruthy();
      expect(zenBtn.classList.contains('dandelion-dimmed')).toBe(true);
      expect(zenBtn.classList.contains('dandelion-zen-active')).toBe(false);
    });
  });
});
