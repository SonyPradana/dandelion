import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { getFlashDataIfEnabled, showFlashDataPanelIfEnabled } from '../../src/handlers/flashData';

vi.mock('../../src/components/flashPanel', () => ({
  showFlashDataPanel: vi.fn(),
}));

const { showFlashDataPanel } = await import('../../src/components/flashPanel');

describe('flashData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.init(new MemoryBackend());
  });

  describe('getFlashDataIfEnabled', () => {
    it('should return flash data when available', async () => {
      const flashData = { pinneds: { foo: 'bar' }, _timestamp: Date.now() };
      await store.storageSet('flash_data', flashData);

      const spy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: true, maxAge: 600_000 },
      });

      const result = await getFlashDataIfEnabled();
      expect(result).toEqual(flashData);
      spy.mockRestore();
    });

    it('should return {} when flashData is disabled in config', async () => {
      const spy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: false },
      });

      const result = await getFlashDataIfEnabled();
      expect(result).toEqual({});
      spy.mockRestore();
    });

    it('should return {} when no flash data exists', async () => {
      const spy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: true },
      });

      const result = await getFlashDataIfEnabled();
      expect(result).toEqual({});
      spy.mockRestore();
    });

    it('should return {} when flash data is expired', async () => {
      await store.storageSet('flash_data', {
        pinneds: { foo: 'bar' },
        _timestamp: Date.now() - 700_000,
      });

      const spy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: true, maxAge: 600_000 },
      });

      const result = await getFlashDataIfEnabled();
      expect(result).toEqual({});
      spy.mockRestore();
    });
  });

  describe('showFlashDataPanelIfEnabled', () => {
    it('should call showFlashDataPanel when flashData is enabled', async () => {
      const spy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: true },
      });

      await showFlashDataPanelIfEnabled();
      expect(showFlashDataPanel).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should NOT call showFlashDataPanel when disabled in config', async () => {
      const spy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: false },
      });

      await showFlashDataPanelIfEnabled();
      expect(showFlashDataPanel).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
