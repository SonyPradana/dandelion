import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { getFlashDataIfEnabled, showFlashDataPanelIfEnabled } from '../../src/handlers/flashData';
import { notify } from '../../src/components/notification';

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

    it('should return a register-form handoff even when flashData is disabled', async () => {
      const flashData = {
        _source: 'register-form',
        pinneds: { foo: 'bar' },
        _timestamp: Date.now(),
      };
      await store.storageSet('flash_data', flashData);

      const spy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: false, maxAge: 600_000 },
      });

      await expect(getFlashDataIfEnabled()).resolves.toEqual(flashData);
      spy.mockRestore();
    });

    it('should read flash data from the injected store', async () => {
      const flashData = { pinneds: { foo: 'bar' }, _timestamp: Date.now() };
      const injectedStore = {
        getActiveConfig: vi.fn().mockResolvedValue({
          flashData: { enabled: true, maxAge: 600_000 },
        }),
        storageGet: vi.fn().mockResolvedValue(flashData),
        storageRemove: vi.fn(),
      };

      await expect(getFlashDataIfEnabled(injectedStore)).resolves.toEqual(flashData);
      expect(injectedStore.storageGet).toHaveBeenCalledWith('flash_data');
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
        zenMode: { defaultPinneds: { xx1234: '' } },
      });

      await showFlashDataPanelIfEnabled();
      expect(showFlashDataPanel).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should pass zenMode.defaultPinneds as initialData', async () => {
      const spy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: true },
        zenMode: { defaultPinneds: { NIK: '', xx1234: 'coba' } },
      });

      await showFlashDataPanelIfEnabled();
      expect(showFlashDataPanel).toHaveBeenCalledWith({
        initialData: { NIK: '', xx1234: 'coba' },
      });
      spy.mockRestore();
    });

    it('should seed the panel from a register-form handoff and keep it as session data', async () => {
      await store.storageSet('flash_data', {
        _source: 'register-form',
        'skrining mandiri': true,
        pinneds: { NIK: '123', 'skrining mandiri': true },
        _timestamp: Date.now(),
      });

      const spy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: true, maxAge: 600_000 },
        zenMode: { defaultPinneds: { NIK: '', 'LPM|text': 'coba' } },
      });

      await showFlashDataPanelIfEnabled();

      expect(showFlashDataPanel).toHaveBeenCalledWith({
        initialData: { NIK: '123', 'LPM|text': 'coba' },
        clearOnOpen: false,
      });
      expect(await store.storageGet('flash_data')).toEqual({
        pinneds: { NIK: '123', 'LPM|text': 'coba' },
        _timestamp: expect.any(Number),
      });
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

    it('should contain storage read failures and notify the user', async () => {
      const configSpy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: true, maxAge: 600_000 },
      });
      const storageSpy = vi
        .spyOn(store, 'storageGet')
        .mockRejectedValue(new Error('storage read failed'));
      const infoSpy = vi.spyOn(notify, 'info').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(showFlashDataPanelIfEnabled()).resolves.toBeUndefined();

      expect(showFlashDataPanel).not.toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalledWith('Flash Data', 'Data Flash tidak dapat dimuat');
      configSpy.mockRestore();
      storageSpy.mockRestore();
      infoSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should contain storage write failures and notify the user', async () => {
      await store.storageSet('flash_data', {
        _source: 'register-form',
        'skrining mandiri': true,
        pinneds: { NIK: '123', 'skrining mandiri': true },
        _timestamp: Date.now(),
      });
      const configSpy = vi.spyOn(store, 'getActiveConfig').mockResolvedValue({
        flashData: { enabled: true, maxAge: 600_000 },
      });
      const storageSpy = vi
        .spyOn(store, 'storageSet')
        .mockRejectedValue(new Error('storage write failed'));
      const infoSpy = vi.spyOn(notify, 'info').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(showFlashDataPanelIfEnabled()).resolves.toBeUndefined();

      expect(showFlashDataPanel).not.toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalledWith('Flash Data', 'Data Flash tidak dapat dimuat');
      configSpy.mockRestore();
      storageSpy.mockRestore();
      infoSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});
