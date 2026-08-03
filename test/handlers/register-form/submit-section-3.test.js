import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { submitSection3 } from '../../../src/handlers/register-form/submit-section-3.js';

function makeModal(text, buttons) {
  const outer = document.createElement('div');
  outer.className = 'fixed flex justify-center items-center';

  const inner = document.createElement('div');
  inner.className = 'rounded-lg bg-white p-4';

  const msg = document.createElement('div');
  msg.textContent = text;
  inner.appendChild(msg);

  for (const label of buttons) {
    const btn = document.createElement('button');
    btn.textContent = label;
    inner.appendChild(btn);
  }

  outer.appendChild(inner);
  return outer;
}

describe('submitSection3', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('full success', () => {
    it('should complete the full flow and return true', async () => {
      const modal = makeModal('Formulir Pendaftaran', ['Pilih']);
      document.body.appendChild(modal);

      setTimeout(() => {
        const inner = modal.querySelector('.rounded-lg');
        inner.replaceChildren();
        const msg = document.createElement('div');
        msg.textContent = 'Formulir Pendaftaran';
        inner.appendChild(msg);
        const daftarBtn = document.createElement('button');
        daftarBtn.textContent = 'Daftarkan dengan NIK';
        inner.appendChild(daftarBtn);
      }, 800);

      setTimeout(() => {
        const inner = modal.querySelector('.rounded-lg');
        inner.replaceChildren();
        const msg = document.createElement('div');
        msg.textContent = 'Berhasil Daftar';
        inner.appendChild(msg);
        const tutupBtn = document.createElement('button');
        tutupBtn.textContent = 'Tutup';
        inner.appendChild(tutupBtn);
        const ticketMsg = document.createElement('div');
        ticketMsg.textContent = 'No. Tiket: 12345';
        inner.appendChild(ticketMsg);
      }, 1500);

      const promise = submitSection3();
      await vi.advanceTimersByTimeAsync(3000);
      expect(await promise).toBe(true);
    });
  });

  describe('failure cases', () => {
    it('should return false when form modal never appears', async () => {
      const promise = submitSection3();
      await vi.advanceTimersByTimeAsync(13_000);
      expect(await promise).toBe(false);
    });

    it('should return false when Pilih button is not found in modal', async () => {
      const modal = makeModal('Formulir Pendaftaran', ['Batal']);
      document.body.appendChild(modal);

      const promise = submitSection3();
      await vi.advanceTimersByTimeAsync(7000);
      expect(await promise).toBe(false);
    });

    it('should return false when Daftarkan button never appears', async () => {
      const modal = makeModal('Formulir Pendaftaran', ['Pilih']);
      document.body.appendChild(modal);

      const promise = submitSection3();
      await vi.advanceTimersByTimeAsync(20_000);
      expect(await promise).toBe(false);
    });

    it('should return false when success modal never appears', async () => {
      const modal = makeModal('Formulir Pendaftaran', ['Pilih']);
      document.body.appendChild(modal);

      setTimeout(() => {
        const inner = modal.querySelector('.rounded-lg');
        inner.replaceChildren();
        const msg = document.createElement('div');
        msg.textContent = 'Formulir Pendaftaran';
        inner.appendChild(msg);
        const daftarBtn = document.createElement('button');
        daftarBtn.textContent = 'Daftarkan dengan NIK';
        inner.appendChild(daftarBtn);
      }, 800);

      const promise = submitSection3();
      await vi.advanceTimersByTimeAsync(20_000);
      expect(await promise).toBe(false);
    });

    it('should return false when Tutup button is missing from success modal', async () => {
      const modal = makeModal('Formulir Pendaftaran', ['Pilih']);
      document.body.appendChild(modal);

      setTimeout(() => {
        const inner = modal.querySelector('.rounded-lg');
        inner.replaceChildren();
        const msg = document.createElement('div');
        msg.textContent = 'Formulir Pendaftaran';
        inner.appendChild(msg);
        const daftarBtn = document.createElement('button');
        daftarBtn.textContent = 'Daftarkan dengan NIK';
        inner.appendChild(daftarBtn);
      }, 800);

      setTimeout(() => {
        const inner = modal.querySelector('.rounded-lg');
        inner.replaceChildren();
        const msg = document.createElement('div');
        msg.textContent = 'Berhasil Daftar';
        inner.appendChild(msg);
        // No Tutup button!
      }, 1500);

      const promise = submitSection3();
      await vi.advanceTimersByTimeAsync(20_000);
      expect(await promise).toBe(false);
    });
  });
});
