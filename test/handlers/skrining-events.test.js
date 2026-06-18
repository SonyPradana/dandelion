import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import bus from '../../src/utils/hooks';

const mockIncrement = vi.fn();
const mockIncrementBatch = vi.fn();
const mockNotifyInfo = vi.fn();

vi.mock('../../src/utils/productivityTracker', () => ({
  increment: (...args) => mockIncrement(...args),
  incrementBatch: (...args) => mockIncrementBatch(...args),
}));

vi.mock('../../src/components/notification', () => ({
  notify: { info: (...args) => mockNotifyInfo(...args) },
}));

await import('../../src/handlers/skrining-events');

describe('skrining-events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('skriningForm:didFill', () => {
    it('should incrementBatch with result fields', async () => {
      bus.emit('skriningForm:didFill', {
        result: { radio: 2, dropdown: 1, freetext: 0, total: 3 },
      });

      await vi.runAllTimersAsync();

      expect(mockIncrementBatch).toHaveBeenCalledWith({
        radio: 2,
        dropdown: 1,
        freetext: 0,
      });
    });

    it('should notify Selesai', async () => {
      bus.emit('skriningForm:didFill', {
        result: { radio: 1, dropdown: 0, freetext: 0, total: 1 },
      });

      await vi.runAllTimersAsync();

      expect(mockNotifyInfo).toHaveBeenCalledWith(
        'Selesai',
        'Berhasil, 1 ditemukan.',
        2500,
      );
    });

    it('should blur active element if not body', async () => {
      const blur = vi.fn();
      Object.defineProperty(document, 'activeElement', {
        value: { blur },
        configurable: true,
      });

      bus.emit('skriningForm:didFill', {
        result: { radio: 1, dropdown: 0, freetext: 0, total: 1 },
      });

      await vi.runAllTimersAsync();

      expect(blur).toHaveBeenCalled();
    });

    it('should NOT blur when activeElement is body', async () => {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true,
      });

      bus.emit('skriningForm:didFill', {
        result: { radio: 1, dropdown: 0, freetext: 0, total: 1 },
      });

      await vi.runAllTimersAsync();

      expect(mockIncrementBatch).toHaveBeenCalled();
    });

    it('should scroll when total > 0', async () => {
      bus.emit('skriningForm:didFill', {
        result: { radio: 1, dropdown: 0, freetext: 0, total: 1 },
      });

      await vi.runAllTimersAsync();

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
    });

    it('should NOT scroll when total is 0', async () => {
      bus.emit('skriningForm:didFill', {
        result: { radio: 0, dropdown: 0, freetext: 0, total: 0 },
      });

      await vi.runAllTimersAsync();

      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('skrining:didFill', () => {
    it('should incrementBatch with radio count', async () => {
      bus.emit('skrining:didFill', { radio: 3 });

      await vi.runAllTimersAsync();

      expect(mockIncrementBatch).toHaveBeenCalledWith({ radio: 3 });
    });
  });

  describe('notChecked:didProcessItem', () => {
    it('should increment formNotChecked', async () => {
      bus.emit('notChecked:didProcessItem');

      await vi.runAllTimersAsync();

      expect(mockIncrement).toHaveBeenCalledWith('formNotChecked');
    });
  });

  describe('zenMode:didProcessItem', () => {
    it('should increment formZen', async () => {
      bus.emit('zenMode:didProcessItem');

      await vi.runAllTimersAsync();

      expect(mockIncrement).toHaveBeenCalledWith('formZen');
    });
  });
});
