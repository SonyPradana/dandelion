// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const formHtml = readFileSync(resolve('test/__fixtures__/form.html'), 'utf8');

const mockNotify = vi.hoisted(() => ({
  alert: vi.fn(),
  confirm: vi.fn(),
  info: vi.fn(),
  countdown: vi.fn(() => ({ dismiss: vi.fn(), promise: Promise.resolve(false) })),
}));

vi.mock('../../src/components/notification', () => ({
  notify: mockNotify,
}));

vi.mock('../../src/utils/zenMode', () => ({
  isZenModeActive: vi.fn().mockResolvedValue(false),
  clearZenMode: vi.fn(),
  skipQueue: vi.fn(),
  getZenModeState: vi.fn().mockResolvedValue({ active: false, queue: [], total: 0 }),
  peekNextFromQueue: vi.fn().mockResolvedValue(null),
  getNextFromQueue: vi.fn().mockResolvedValue(null),
  setZenModeState: vi.fn().mockResolvedValue(),
}));

import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';
import { initializeSkriningForm } from '../../src/handlers/skriningform';
import bus from '../../src/utils/hooks';

globalThis.CSS ??= { escape: (v) => v };

describe('skriningform', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    store.init(new MemoryBackend());
    document.head.innerHTML = '';
    document.body.innerHTML = formHtml;

    await store.setConfig({
      activeProfile: 'profile1',
      profiles: {
        profile1: {
          name: 'Default Profile',
          formSkrining: {
            radioButtonKeywords: 'Tidak ada serumen impaksi',
            dropdownKeywords: 'Tidak ada infeksi telinga',
            pinneds: {},
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function clickAutoFill() {
    const btn = document.getElementById('dandelion-auto-fill');
    btn.click();
    await vi.advanceTimersByTimeAsync(2000);
  }

  describe('initializeSkriningForm', () => {
    it('should create the auto-fill button', async () => {
      await initializeSkriningForm();

      const btn = document.getElementById('dandelion-auto-fill');
      expect(btn).toBeTruthy();
      expect(btn.tagName).toBe('BUTTON');
    });

    it('should create the debug toggle button', async () => {
      await initializeSkriningForm();

      const debugBtn = document.getElementById('dandelion-debug-toggle');
      expect(debugBtn).toBeTruthy();
    });
  });

  describe('radio button filling', () => {
    it('should select matching radio option on button click', async () => {
      vi.useFakeTimers();
      await initializeSkriningForm();

      const btn = document.getElementById('dandelion-auto-fill');
      btn.click();
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(0);

      const selectedRadio = document.querySelector('input[type="radio"]:checked');
      expect(selectedRadio).toBeTruthy();
      expect(selectedRadio.value).toBe('PPV00001020');
    });

    it('should not select radio when no keywords match', async () => {
      vi.useFakeTimers();
      await store.setConfig({
        activeProfile: 'profile1',
        profiles: {
          profile1: {
            name: 'Default Profile',
            formSkrining: {
              radioButtonKeywords: 'Tidak ada yang cocok',
              dropdownKeywords: '',
              pinneds: {},
            },
          },
        },
      });

      await initializeSkriningForm();
      await clickAutoFill();

      const selectedRadio = document.querySelector('input[type="radio"]:checked');
      expect(selectedRadio).toBeFalsy();
    });
  });

  describe('dropdown filling', () => {
    it('should select matching dropdown option on button click', async () => {
      vi.useFakeTimers();
      await initializeSkriningForm();
      await clickAutoFill();

      const selectedItem = document.querySelector('.sv-list__item--selected');
      expect(selectedItem).toBeTruthy();
      expect(selectedItem.textContent.trim()).toBe('Tidak ada infeksi telinga');
    });
  });

  describe('number input', () => {
    it('should fill pinned number field when provided', async () => {
      vi.useFakeTimers();
      await initializeSkriningForm({
        pinneds: {
          'LPM000073|FRM000093|PPM00000248|number': '65',
        },
      });

      await clickAutoFill();

      const numberInput = document.querySelector('input[type="number"]');
      expect(numberInput.value).toBe('65');
    });
  });

  describe('bus event', () => {
    it('should emit skriningForm:didFill with correct result', async () => {
      vi.useFakeTimers();
      await initializeSkriningForm();

      let busResult = null;
      bus.on('skriningForm:didFill', (payload) => { busResult = payload; });
      await clickAutoFill();

      expect(busResult).toBeDefined();
      expect(busResult.result).toHaveProperty('radio');
      expect(busResult.result).toHaveProperty('dropdown');
      expect(busResult.result).toHaveProperty('freetext');
      expect(busResult.result).toHaveProperty('total');
      expect(busResult.result.total).toBeGreaterThan(0);
    });
  });
});
