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
            radioButtonKeywords: 'Opsi A',
            dropdownKeywords: 'Opsi A',
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
      expect(selectedRadio.value).toBe('opt_a');
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
      expect(selectedItem.textContent.trim()).toBe('Opsi A');
    });
  });

  describe('number input', () => {
    it('should fill pinned number field when provided', async () => {
      vi.useFakeTimers();
      await initializeSkriningForm({
        pinneds: {
          'abcxyz000123|defuvw000456|jkl000791|number': '65',
        },
      });

      await clickAutoFill();

      const numberInput = document.querySelector('input[type="number"]');
      expect(numberInput.value).toBe('65');
    });
  });

  describe('respect input feature', () => {
    describe('radio button', () => {
      it('should overwrite existing radio when respectInput is OFF (default)', async () => {
        vi.useFakeTimers();
        const q1 = document.getElementById('q1');
        const radioOptB = q1.querySelector('input[value="opt_b"]');
        radioOptB.checked = true;

        await initializeSkriningForm();
        await clickAutoFill();

        const checkedRadio = document.querySelector('input[type="radio"]:checked');
        expect(checkedRadio.value).toBe('opt_a');
      });

      it('should NOT overwrite existing radio when respectInput is ON', async () => {
        vi.useFakeTimers();
        await store.setConfig({
          activeProfile: 'profile1',
          profiles: {
            profile1: {
              name: 'Default Profile',
              formSkrining: {
                radioButtonKeywords: 'Opsi A',
                dropdownKeywords: 'Opsi A',
                pinneds: {},
                respectInput: true,
              },
            },
          },
        });

        const q1 = document.getElementById('q1');
        const radioOptB = q1.querySelector('input[value="opt_b"]');
        radioOptB.checked = true;

        await initializeSkriningForm();
        await clickAutoFill();

        const checkedRadio = document.querySelector('input[type="radio"]:checked');
        expect(checkedRadio).toBeTruthy();
        expect(checkedRadio.value).toBe('opt_b');
      });
    });

    describe('pinned number input', () => {
      it('should overwrite existing number when respectInput is OFF (default)', async () => {
        vi.useFakeTimers();
        const numberInput = document.querySelector('input[type="number"]');
        numberInput.value = '10';

        await initializeSkriningForm({
          pinneds: {
            'abcxyz000123|defuvw000456|jkl000791|number': '65',
          },
        });
        await clickAutoFill();

        expect(numberInput.value).toBe('65');
      });

      it('should NOT overwrite existing number when respectInput is ON', async () => {
        vi.useFakeTimers();
        await store.setConfig({
          activeProfile: 'profile1',
          profiles: {
            profile1: {
              name: 'Default Profile',
              formSkrining: {
                radioButtonKeywords: '',
                dropdownKeywords: '',
                pinneds: {},
                respectInput: true,
              },
            },
          },
        });

        const numberInput = document.querySelector('input[type="number"]');
        numberInput.value = '10';

        await initializeSkriningForm({
          pinneds: {
            'abcxyz000123|defuvw000456|jkl000791|number': '65',
          },
        });
        await clickAutoFill();

        expect(numberInput.value).toBe('10');
      });
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
