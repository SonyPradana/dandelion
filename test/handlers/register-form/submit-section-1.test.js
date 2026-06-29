import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { submitSection1 } from '../../../src/handlers/register-form/submit-section-1.js';

function makeSubmitButton() {
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn-fill-primary';
  btn.textContent = 'Selanjutnya';
  return btn;
}

function makeStepper(bars) {
  const stepper = document.createElement('div');
  stepper.className = 'stepper';
  for (let i = 0; i < bars; i++) {
    const bar = document.createElement('div');
    bar.className = 'bg-[#16B3AC]';
    stepper.appendChild(bar);
  }
  return stepper;
}

function makeResultModal(text, buttonText) {
  const outer = document.createElement('div');
  outer.className = 'fixed flex justify-center items-center';
  outer.style.cssText = 'position:fixed;display:flex;justify-content:center;align-items:center';

  const content = document.createElement('div');
  content.className = 'rounded-lg bg-white p-4';

  const msg = document.createElement('div');
  msg.textContent = text;
  content.appendChild(msg);

  const btn = document.createElement('button');
  btn.textContent = buttonText;
  content.appendChild(btn);

  outer.appendChild(content);
  return outer;
}

function makeKuotaModal() {
  return makeResultModal('Kuota Pemeriksaan Habis', 'Lanjut');
}

describe('submitSection1', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('success path', () => {
    it(
      'should return true when result is "Data peserta valid" + stepper shows step 2',
      { timeout: 15_000 },
      async () => {
        document.body.appendChild(makeSubmitButton());
        document.body.appendChild(makeStepper(2));

        setTimeout(() => {
          document.body.appendChild(makeResultModal('Data peserta valid', 'Lanjutkan'));
        }, 500);

        const promise = submitSection1();
        await vi.advanceTimersByTimeAsync(7000);
        expect(await promise).toBe(true);
      },
    );

    it(
      'should return false when stepper does not show 2 green bars',
      { timeout: 15_000 },
      async () => {
        document.body.appendChild(makeSubmitButton());
        document.body.appendChild(makeStepper(1));

        setTimeout(() => {
          document.body.appendChild(makeResultModal('Data peserta valid', 'Lanjutkan'));
        }, 500);

        const promise = submitSection1();
        await vi.advanceTimersByTimeAsync(7000);
        expect(await promise).toBe(false);
      },
    );
  });

  describe('blocked path', () => {
    it(
      'should return "blocked" when "Individu sudah menerima layanan" modal appears',
      { timeout: 15_000 },
      async () => {
        document.body.appendChild(makeSubmitButton());

        setTimeout(() => {
          document.body.appendChild(makeResultModal('Individu sudah menerima layanan', 'Kembali'));
        }, 500);

        const promise = submitSection1();
        await vi.advanceTimersByTimeAsync(7000);
        expect(await promise).toBe('blocked');
      },
    );
  });

  describe('kuota habis modal', () => {
    it('should handle Kuota Habis modal then succeed on result', async () => {
      document.body.appendChild(makeSubmitButton());
      document.body.appendChild(makeStepper(2));

      setTimeout(() => {
        document.body.appendChild(makeKuotaModal());
      }, 100);

      setTimeout(() => {
        document.body.querySelectorAll('.rounded-lg.bg-white.p-4').forEach((el) => el.remove());
        document.body.appendChild(makeResultModal('Data peserta valid', 'Lanjutkan'));
      }, 1500);

      const promise = submitSection1();
      await vi.advanceTimersByTimeAsync(3000);
      expect(await promise).toBe(true);
    });

    it('should proceed normally if kuota modal never appears', async () => {
      document.body.appendChild(makeSubmitButton());
      document.body.appendChild(makeStepper(2));

      setTimeout(() => {
        document.body.appendChild(makeResultModal('Data peserta valid', 'Lanjutkan'));
      }, 500);

      const promise = submitSection1();
      await vi.advanceTimersByTimeAsync(7000);
      expect(await promise).toBe(true);
    });
  });

  describe('failure cases', () => {
    it('should return false when submit button never appears', async () => {
      const promise = submitSection1();
      await vi.advanceTimersByTimeAsync(11_000);
      expect(await promise).toBe(false);
    });

    it('should return false when result modal times out', async () => {
      document.body.appendChild(makeSubmitButton());

      const promise = submitSection1();
      await vi.advanceTimersByTimeAsync(20_000);
      expect(await promise).toBe(false);
    });
  });
});
