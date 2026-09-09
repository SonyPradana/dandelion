import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const formHtml = readFileSync(resolve('test/__fixtures__/form.html'), 'utf8');
const formFilledDropdownHtml = readFileSync(
  resolve('test/__fixtures__/form-filled-dropdown.html'),
  'utf8',
);
const formCrossPopupHtml = readFileSync(resolve('test/__fixtures__/form-cross-popup.html'), 'utf8');

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
import { isZenModeActive } from '../../src/utils/zenMode';
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

  async function waitForBusResult(getResult, timeout = 3000) {
    vi.useRealTimers();
    const start = Date.now();
    while (!getResult()) {
      if (Date.now() - start > timeout) break;
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  function didFillResult(emitSpy) {
    const call = emitSpy.mock.calls.find((c) => c[0] === 'skriningForm:didFill');
    return call?.[1]?.result;
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

  describe('dropdown double-count', () => {
    it('should not count dropdown that is already filled when re-filling', async () => {
      vi.useFakeTimers();
      document.body.innerHTML = formFilledDropdownHtml;

      await initializeSkriningForm();

      const emitSpy = vi.spyOn(bus, 'emit');

      await clickAutoFill();
      await vi.runAllTimersAsync();
      await waitForBusResult(() => didFillResult(emitSpy) !== undefined);

      // q1 already filled -> skipped; only q2 (empty) counted.
      expect(didFillResult(emitSpy).dropdown).toBe(1);
    });
  });

  describe('dropdown scope per-field popup', () => {
    it('should only match options from the field being processed', async () => {
      vi.useFakeTimers();
      await store.setConfig({
        activeProfile: 'profile1',
        profiles: {
          profile1: {
            name: 'Default Profile',
            formSkrining: {
              radioButtonKeywords: '',
              dropdownKeywords: 'X',
              pinneds: {},
            },
          },
        },
      });
      document.body.innerHTML = formCrossPopupHtml;

      await initializeSkriningForm();

      const emitSpy = vi.spyOn(bus, 'emit');

      await clickAutoFill();
      await vi.runAllTimersAsync();
      await waitForBusResult(() => didFillResult(emitSpy) !== undefined);

      // Only q1 has "X" in its own popup. q2's popup lacks "X", so a global
      // lookup would wrongly match q1's open popup and count q2 too. Scoped
      // per-field keeps the count to the single matching field.
      expect(didFillResult(emitSpy).dropdown).toBe(1);
    });
  });

  describe('ensureFill dedupe', () => {
    it('should not double-count a pinned field re-filled by ensure fill', async () => {
      vi.useFakeTimers();
      await store.setConfig({
        activeProfile: 'profile1',
        profiles: {
          profile1: {
            name: 'Default Profile',
            formSkrining: {
              radioButtonKeywords: '',
              dropdownKeywords: '',
              pinneds: {
                'abcxyz000123|defuvw000456|ghi000789|text': 'X',
                'abcxyz000123|defuvw000456|ghi000790|text': 'Y',
              },
              ensureFill: true,
            },
          },
        },
      });
      document.body.innerHTML = formCrossPopupHtml;

      await initializeSkriningForm();

      const emitSpy = vi.spyOn(bus, 'emit');

      await clickAutoFill();
      await vi.runAllTimersAsync();
      await waitForBusResult(() => didFillResult(emitSpy) !== undefined);

      // Two distinct pinned fields filled once each. Even though ensureFill
      // runs a second pass (pass 2), the same fields must not be counted twice.
      expect(didFillResult(emitSpy).dropdown).toBe(2);
    });
  });

  describe('pinned dropdown double-count', () => {
    it('should not count pinned dropdown that is already filled', async () => {
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
            },
          },
        },
      });
      document.body.innerHTML = formFilledDropdownHtml;

      await initializeSkriningForm({
        pinneds: {
          'abcxyz000123|defuvw000456|ghi000789|text': 'Opsi B',
        },
      });

      const emitSpy = vi.spyOn(bus, 'emit');

      await clickAutoFill();
      await vi.runAllTimersAsync();
      await waitForBusResult(() => didFillResult(emitSpy) !== undefined);

      // q1 dropdown is already filled -> pinned fill should be skipped and not counted.
      expect(didFillResult(emitSpy).dropdown).toBe(0);
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

  describe('ensure fill', () => {
    it('should fill dropdown with ensureFill enabled', async () => {
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
              ensureFill: true,
            },
          },
        },
      });

      await initializeSkriningForm();

      const btn = document.getElementById('dandelion-auto-fill');
      btn.click();
      await vi.advanceTimersByTimeAsync(4000);

      const selectedItem = document.querySelector('.sv-list__item--selected');
      expect(selectedItem).toBeTruthy();
      expect(selectedItem.textContent.trim()).toBe('Opsi A');
    });
  });

  describe('bus event', () => {
    it('should emit skriningForm:didFill with correct result', async () => {
      vi.useFakeTimers();
      await initializeSkriningForm();

      let busResult = null;
      bus.on('skriningForm:didFill', (payload) => {
        busResult = payload;
      });
      await clickAutoFill();

      expect(busResult).toBeDefined();
      expect(busResult.result).toHaveProperty('radio');
      expect(busResult.result).toHaveProperty('dropdown');
      expect(busResult.result).toHaveProperty('freetext');
      expect(busResult.result).toHaveProperty('total');
      expect(busResult.result.total).toBeGreaterThan(0);
    });
  });

  describe('zen/zero assist DOM-readiness retry', () => {
    let cdMock = null;

    beforeEach(() => {
      vi.mocked(isZenModeActive).mockReset();
      vi.mocked(isZenModeActive).mockResolvedValue(false);
      vi.mocked(isZenModeActive).mockResolvedValueOnce(true);
      cdMock = { dismiss: vi.fn(), close: vi.fn(), restart: vi.fn() };
      mockNotify.countdown.mockReturnValueOnce({ ...cdMock, promise: Promise.resolve(true) });
    });

    it('should fill normally when the form DOM is ready on the first attempt', async () => {
      vi.useFakeTimers();
      const emitSpy = vi.spyOn(bus, 'emit');

      await initializeSkriningForm();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(2000);
      await waitForBusResult(() => didFillResult(emitSpy) !== undefined);

      expect(didFillResult(emitSpy).total).toBeGreaterThan(0);
      expect(cdMock.restart).not.toHaveBeenCalled();
      expect(cdMock.close).toHaveBeenCalled();
    });

    it('should retry inside the countdown panel until form fields appear', async () => {
      vi.useFakeTimers();
      document.body.innerHTML = '<div class="loading"></div>';
      const emitSpy = vi.spyOn(bus, 'emit');

      await initializeSkriningForm();
      await vi.advanceTimersByTimeAsync(0);
      expect(cdMock.restart).toHaveBeenCalledTimes(1);
      expect(cdMock.restart).toHaveBeenCalledWith(3000, '⏳ menunggu... (1/3)');

      document.body.innerHTML = formHtml;
      await vi.advanceTimersByTimeAsync(3000);
      await vi.advanceTimersByTimeAsync(2000);
      await waitForBusResult(() => didFillResult(emitSpy) !== undefined);

      expect(cdMock.restart).toHaveBeenCalledTimes(1);
      expect(didFillResult(emitSpy).total).toBeGreaterThan(0);
      expect(cdMock.close).toHaveBeenCalled();
    });

    it('should stop silently when no fields appear after all retries', async () => {
      vi.useFakeTimers();
      document.body.innerHTML = '';
      const emitSpy = vi.spyOn(bus, 'emit');

      await initializeSkriningForm();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(10_000);

      expect(cdMock.restart.mock.calls).toEqual([
        [3000, '⏳ menunggu... (1/3)'],
        [3000, '⏳ menunggu... (2/3)'],
        [3000, '⏳ menunggu... (3/3)'],
      ]);
      expect(emitSpy).not.toHaveBeenCalledWith('skriningForm:didFill', expect.anything());
      expect(cdMock.close).toHaveBeenCalled();
    });
  });
});
