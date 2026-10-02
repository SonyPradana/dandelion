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
  isZenRunning: vi.fn().mockResolvedValue(false),
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
import { controlPanel } from '../../src/components/controlPanel';
import { isZeroRunning, startZeroAutomation } from '../../src/handlers/zero-mode';
import { isFeatureEnabled } from '../../src/quota/quota-manager';
import { clearZenMode, isZenRunning } from '../../src/utils/zenMode';

describe('skrining-form-not-checked', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(isFeatureEnabled).mockReturnValue(true);
    vi.mocked(isZeroRunning).mockResolvedValue(false);
    vi.mocked(isZenRunning).mockResolvedValue(false);
    vi.useFakeTimers();
    store.init(new MemoryBackend());
    controlPanel.setPosition('top-right');
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

      const zeroBtn = document.getElementById('dandelion-zero-toggle');
      expect(zeroBtn).toBeTruthy();
      expect(zeroBtn.tagName).toBe('BUTTON');
      expect(document.getElementById('dandelion-zen-mode-toggle')).toBeTruthy();
      expect(document.getElementById('dandelion-debug-toggle')).toBeTruthy();

      const panel = document.getElementById('dandelion-control-panel');
      expect(panel).toBeTruthy();
    });

    it('should NOT mount the removed auto-uncheck button', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      expect(document.getElementById('dandelion-not-checked-automation')).toBeFalsy();
      expect(document.getElementById('dandelion-zero-row')).toBeFalsy();
    });

    it('should NOT mount control buttons on non-processing page', async () => {
      document.body.innerHTML = '<div>Tidak ada status</div>';

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      expect(document.getElementById('dandelion-zero-toggle')).toBeFalsy();
      expect(document.getElementById('dandelion-zen-mode-toggle')).toBeFalsy();
      expect(document.getElementById('dandelion-debug-toggle')).toBeFalsy();
    });

    it('should remove buttons when page changes from processing to non-processing', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      expect(document.getElementById('dandelion-zero-toggle')).toBeTruthy();

      document.body.innerHTML = '<div>Selesai</div>';

      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(0);

      expect(document.getElementById('dandelion-zero-toggle')).toBeFalsy();
      expect(document.getElementById('dandelion-zen-mode-toggle')).toBeFalsy();
    });

    it('should mount the Zero button directly in the control panel', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      const zeroBtn = document.getElementById('dandelion-zero-toggle');
      expect(zeroBtn).toBeTruthy();
      expect(zeroBtn.textContent).toBe('Zero');
      expect(zeroBtn.style.background).toBe('#ffffff');
      expect(zeroBtn.style.color).toBe('#000000');
      expect(zeroBtn.style.fontWeight).toBe('bold');
      expect(zeroBtn.style.textDecoration).toBe('line-through');

      expect(document.getElementById('dandelion-zero-row')).toBeFalsy();
    });

    it('should NOT mount Zero or zen buttons when zen-mode feature is disabled', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';
      vi.mocked(isFeatureEnabled).mockReturnValue(false);

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      expect(document.getElementById('dandelion-zero-row')).toBeFalsy();
      expect(document.getElementById('dandelion-zero-toggle')).toBeFalsy();
      expect(document.getElementById('dandelion-zen-mode-toggle')).toBeFalsy();

      // The bee helper toggle stays available so the list can still be marked.
      expect(document.getElementById('dandelion-debug-toggle')).toBeTruthy();
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

      const zeroBtn = document.getElementById('dandelion-zero-toggle');
      expect(zeroBtn.classList.contains('dandelion-zen-active')).toBe(true);
    });

    it('should stop Zero (toggle-off) when clicking the Zero button while it is running', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';
      vi.mocked(isZeroRunning).mockResolvedValue(true);

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      const zeroBtn = document.getElementById('dandelion-zero-toggle');
      zeroBtn.click();
      await vi.advanceTimersByTimeAsync(0);

      expect(clearZenMode).toHaveBeenCalled();
      expect(startZeroAutomation).not.toHaveBeenCalled();
    });

    it('should ignore Zero button click while Zen owns the queue', async () => {
      document.body.innerHTML = '<div>Sedang Pemeriksaan</div>';
      vi.mocked(isZenRunning).mockResolvedValue(true);

      initialize();

      await vi.advanceTimersByTimeAsync(0);

      const zeroBtn = document.getElementById('dandelion-zero-toggle');
      zeroBtn.click();
      await vi.advanceTimersByTimeAsync(0);

      expect(startZeroAutomation).not.toHaveBeenCalled();
      expect(clearZenMode).not.toHaveBeenCalled();
    });
  });
});
