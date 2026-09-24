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
}));

vi.mock('../../src/utils/flashSession', () => ({
  clearFlashData: vi.fn(),
}));

vi.mock('../../src/handlers/flashData', () => ({
  showFlashDataPanelIfEnabled: vi.fn(),
}));

vi.mock('../../src/handlers/inspection/not-checked-utils', () => ({
  waitForRow: vi.fn(),
  waitForElement: vi.fn(),
  clickFinishServiceButton: vi.fn(),
  hasRemainingForms: vi.fn().mockResolvedValue(false),
  getActiveRowIds: vi.fn(() => []),
  countUnresolvedRows: vi.fn(() => 0),
  TABLE_ID: 'tableLayanan',
}));

import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { startZenAutomation } from '../../src/handlers/zen-mode';
import {
  getActiveRowIds,
  countUnresolvedRows,
  waitForRow,
  clickFinishServiceButton,
} from '../../src/handlers/inspection/not-checked-utils';

let TABLE_ID = null;

describe('zen-mode', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    store.init(new MemoryBackend());
    document.body.innerHTML = rowsHtml;
    const actual = await vi.importActual('../../src/handlers/inspection/not-checked-utils');
    getActiveRowIds.mockImplementation(actual.getActiveRowIds);
    countUnresolvedRows.mockImplementation(actual.countUnresolvedRows);
    TABLE_ID = actual.TABLE_ID;
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

  describe('completion', () => {
    /**
     * Advances the fake timer until all queued microtasks and timers settle.
     */
    async function flushAll() {
      for (let i = 0; i < 20; i += 1) {
        await vi.advanceTimersByTimeAsync(0);
      }
    }

    afterEach(() => {
      vi.useRealTimers();
    });

    /**
     * Boots Zen Mode with a queue holding one already-finished row so the
     * processing chain drains into the completion branch.
     */
    async function startWithDoneRow() {
      vi.useFakeTimers();
      vi.resetModules();
      const { store: freshStore } = await import('../../src/store');
      const { MemoryBackend } = await import('../__support__/memory-backend');
      const { initializeZenMode } = await import('../../src/handlers/zen-mode');

      freshStore.init(new MemoryBackend());
      await freshStore.setZenModeState({
        active: true,
        queue: ['rowfrmzzz'],
        total: 1,
        mode: 'zen',
      });

      const rowEl = document.createElement('div');
      rowEl.id = 'rowfrmzzz';
      const row = document.createElement('div');
      row.className = 'grid';
      row.innerHTML = '<div>Selesai diperiksa</div>';
      row.appendChild(rowEl);
      document.body.innerHTML = `<div id="${TABLE_ID}"></div>`;
      document.querySelector(`#${TABLE_ID}`).appendChild(row);

      waitForRow.mockResolvedValue(rowEl);
      return { initializeZenMode };
    }

    it('should confirm with the unresolved count before finishing when rows remain', async () => {
      const { initializeZenMode } = await startWithDoneRow();

      countUnresolvedRows.mockReturnValue(['rowfrmzzz', 'rowfrmskip2'].length);
      mockNotify.confirm.mockResolvedValue(true);

      initializeZenMode();
      await flushAll();

      expect(mockNotify.alert).not.toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Zen Mode Selesai!'),
      );
      expect(mockNotify.confirm).toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Ada 2 item yang belum selesai. Tetap selesaikan layanan?'),
      );
      expect(clickFinishServiceButton).toHaveBeenCalled();
    });

    it('should not click finish when user declines with unresolved rows', async () => {
      const { initializeZenMode } = await startWithDoneRow();

      countUnresolvedRows.mockReturnValue(['rowfrmzzz', 'rowfrmskip2', 'rowfrmskip3'].length);
      mockNotify.confirm.mockResolvedValue(false);

      initializeZenMode();
      await flushAll();

      expect(mockNotify.confirm).toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Ada 3 item yang belum selesai. Tetap selesaikan layanan?'),
      );
      expect(clickFinishServiceButton).not.toHaveBeenCalled();
    });

    it('should keep the normal completion flow when no unresolved rows remain', async () => {
      const { initializeZenMode } = await startWithDoneRow();

      countUnresolvedRows.mockReturnValue(0);
      mockNotify.confirm.mockResolvedValue(true);

      initializeZenMode();
      await flushAll();

      expect(mockNotify.alert).toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Zen Mode Selesai!'),
      );
      expect(mockNotify.confirm).toHaveBeenCalledWith('Konfirmasi', 'Selesaikan Layanan?');
      expect(clickFinishServiceButton).toHaveBeenCalled();
    });

    it('should show the unresolved confirmation instead of Zen Mode Selesai! when a pending row keeps its button', async () => {
      const { initializeZenMode } = await startWithDoneRow();
      const actual = await vi.importActual('../../src/handlers/inspection/not-checked-utils');

      document.body.innerHTML += `
        <div class="grid">
          <div id="rowfrmskip1">
            <button type="button">Input Data</button>
          </div>
          <div>Tidak diperiksa</div>
        </div>
      `;
      countUnresolvedRows.mockImplementation(actual.countUnresolvedRows);
      mockNotify.confirm.mockResolvedValue(true);

      initializeZenMode();
      await flushAll();

      expect(mockNotify.alert).not.toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Zen Mode Selesai!'),
      );
      expect(mockNotify.confirm).toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Ada 1 item yang belum selesai. Tetap selesaikan layanan?'),
      );
      expect(clickFinishServiceButton).toHaveBeenCalled();
    });

    it('should defer completion while the list page is not showing', async () => {
      vi.useFakeTimers();
      vi.resetModules();
      const { store: freshStore } = await import('../../src/store');
      const { MemoryBackend } = await import('../__support__/memory-backend');
      const { initializeZenMode } = await import('../../src/handlers/zen-mode');

      freshStore.init(new MemoryBackend());
      await freshStore.setZenModeState({
        active: true,
        queue: ['rowfrmzzz'],
        total: 1,
        mode: 'zen',
      });

      document.body.innerHTML = `
        <div class="grid">
          <div id="rowfrmzzz"><div>Selesai diperiksa</div></div>
        </div>
      `;
      waitForRow.mockResolvedValue(document.getElementById('rowfrmzzz'));
      countUnresolvedRows.mockReturnValue(0);
      mockNotify.confirm.mockResolvedValue(true);

      initializeZenMode();
      await flushAll();

      expect(mockNotify.alert).not.toHaveBeenCalled();
      expect(mockNotify.confirm).not.toHaveBeenCalled();
      expect(await freshStore.getZenModeState()).toMatchObject({ active: true });
    });

    it('should finish within half a second after the list page becomes available', async () => {
      vi.useFakeTimers();
      vi.resetModules();
      const { store: freshStore } = await import('../../src/store');
      const { MemoryBackend } = await import('../__support__/memory-backend');
      const { initializeZenMode } = await import('../../src/handlers/zen-mode');

      freshStore.init(new MemoryBackend());
      await freshStore.setZenModeState({
        active: true,
        queue: ['rowfrmzzz'],
        total: 1,
        mode: 'zen',
      });

      document.body.innerHTML = `
        <div class="grid">
          <div id="rowfrmzzz"><div>Selesai diperiksa</div></div>
        </div>
      `;
      waitForRow.mockResolvedValue(document.getElementById('rowfrmzzz'));
      countUnresolvedRows.mockReturnValue(0);
      mockNotify.confirm.mockResolvedValue(true);

      initializeZenMode();
      await flushAll();

      await vi.advanceTimersByTimeAsync(500);
      await flushAll();

      expect(await freshStore.getZenModeState()).toMatchObject({ active: true });

      document.body.innerHTML = `<div id="${TABLE_ID}">
        <div class="grid">
          <div id="rowfrmzzz"><div>Selesai diperiksa</div></div>
        </div>
      </div>`;
      await vi.advanceTimersByTimeAsync(500);
      await flushAll();

      expect(mockNotify.alert).toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Zen Mode Selesai!'),
      );
      expect(await freshStore.getZenModeState()).toMatchObject({ active: false });
    });

    it('should keep the queue when the list rows are not on the page', async () => {
      vi.useFakeTimers();
      vi.resetModules();
      const { store: freshStore } = await import('../../src/store');
      const { MemoryBackend } = await import('../__support__/memory-backend');
      const { initializeZenMode } = await import('../../src/handlers/zen-mode');

      freshStore.init(new MemoryBackend());
      await freshStore.setZenModeState({
        active: true,
        queue: ['rowfrmA', 'rowfrmB'],
        total: 2,
        mode: 'zen',
      });

      document.body.innerHTML = '<div class="grid"><div>Dalam Pemeriksaan</div></div>';
      waitForRow.mockResolvedValue(null);
      mockNotify.confirm.mockResolvedValue(true);

      initializeZenMode();
      await flushAll();

      expect(waitForRow).not.toHaveBeenCalled();
      expect(await freshStore.getZenModeState()).toMatchObject({
        queue: ['rowfrmA', 'rowfrmB'],
      });
    });

    it('should complete when the queue is empty and the list shows no rows', async () => {
      vi.useFakeTimers();
      vi.resetModules();
      const { store: freshStore } = await import('../../src/store');
      const { MemoryBackend } = await import('../__support__/memory-backend');
      const { initializeZenMode } = await import('../../src/handlers/zen-mode');

      freshStore.init(new MemoryBackend());
      await freshStore.setZenModeState({
        active: true,
        queue: [],
        total: 1,
        mode: 'zen',
      });

      document.body.innerHTML = `<div id="${TABLE_ID}"></div>`;
      countUnresolvedRows.mockReturnValue(0);
      mockNotify.confirm.mockResolvedValue(true);

      initializeZenMode();
      await flushAll();

      expect(mockNotify.alert).toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Zen Mode Selesai!'),
      );
      expect(await freshStore.getZenModeState()).toMatchObject({ active: false });
    });

    it('should not complete when a non-done row keeps a disabled button', async () => {
      const { initializeZenMode } = await startWithDoneRow();
      const actual = await vi.importActual('../../src/handlers/inspection/not-checked-utils');

      document.body.innerHTML += `
        <div class="grid">
          <div id="rowfrmskip1">
            <button type="button" disabled>Input Data</button>
          </div>
          <div>Dalam Pemeriksaan</div>
        </div>
      `;
      getActiveRowIds.mockImplementation(actual.getActiveRowIds);
      countUnresolvedRows.mockImplementation(actual.countUnresolvedRows);
      mockNotify.confirm.mockResolvedValue(true);

      initializeZenMode();
      await flushAll();

      expect(mockNotify.alert).not.toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Zen Mode Selesai!'),
      );
      expect(mockNotify.confirm).toHaveBeenCalledWith(
        'Zen Mode',
        expect.stringContaining('Ada 1 item yang belum selesai. Tetap selesaikan layanan?'),
      );
      expect(clickFinishServiceButton).toHaveBeenCalled();
    });
  });
});
