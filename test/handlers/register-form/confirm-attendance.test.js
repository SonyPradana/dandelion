import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { confirmAttendance } from '../../../src/handlers/register-form/confirm-attendance.js';

function makeAttandanceModal(contentText, buttons, ticketText) {
  const outer = document.createElement('div');
  outer.className = 'fixed flex justify-center items-center';

  const inner = document.createElement('div');
  inner.className = 'rounded-lg bg-white p-4';

  const msg = document.createElement('div');
  msg.textContent = contentText;
  inner.appendChild(msg);

  if (ticketText) {
    const row = document.createElement('div');
    row.className = 'px-4 pb-1 flex gap-1';
    const label = document.createElement('div');
    label.className = 'font-semibold';
    label.textContent = 'Nomor Tiket:';
    const value = document.createElement('div');
    value.textContent = ticketText;
    row.appendChild(label);
    row.appendChild(value);
    inner.appendChild(row);
  }

  for (const label of buttons) {
    const btn = document.createElement('button');
    btn.textContent = label;
    inner.appendChild(btn);
  }

  outer.appendChild(inner);
  return outer;
}

function makeHadirButton(enabled) {
  const btn = document.createElement('button');
  btn.textContent = 'Hadir';

  if (!enabled) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cursor-not-allowed';
    wrapper.appendChild(btn);
    return wrapper;
  }

  return btn;
}

describe('confirmAttendance', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('full success', () => {
    it('should complete the full flow and return ticket number', async () => {
      const input = document.createElement('input');
      input.id = 'searchNik';
      document.body.appendChild(input);

      setTimeout(() => {
        document.body.appendChild(
          makeAttandanceModal('Tandai Hadir?', ['Batal', 'Hadir'], 'ABC-123'),
        );
        // Add verify checkbox
        const checkDiv = document.createElement('div');
        checkDiv.id = 'verify';
        checkDiv.className = 'check';
        document.body.appendChild(checkDiv);
      }, 600);

      // Real Konfirmasi Hadir button in initial DOM
      setTimeout(() => {
        const konfirmBtn = document.createElement('button');
        konfirmBtn.textContent = 'Konfirmasi Hadir';
        document.body.appendChild(konfirmBtn);
      }, 400);

      setTimeout(() => {
        const modal = document.querySelector('.rounded-lg.bg-white.p-4');
        if (modal) {
          modal.replaceChildren();
          const msg = document.createElement('div');
          msg.textContent = 'Berhasil Hadir';
          modal.appendChild(msg);
          const tutupBtn = document.createElement('button');
          tutupBtn.textContent = 'Tutup';
          modal.appendChild(tutupBtn);
        }
      }, 1200);

      const nik = '3322185207660004';
      const promise = confirmAttendance(nik);
      await vi.advanceTimersByTimeAsync(3000);
      expect(await promise).toBe('ABC-123');
    });
  });

  describe('input handling', () => {
    it('should set input value and dispatch events', { timeout: 15_000 }, async () => {
      const input = document.createElement('input');
      input.id = 'searchNik';
      document.body.appendChild(input);

      const inputSpy = vi.fn();
      input.addEventListener('input', inputSpy);
      const keydownSpy = vi.fn();
      input.addEventListener('keydown', keydownSpy);

      const promise = confirmAttendance('3322185207660004');
      await vi.advanceTimersByTimeAsync(500);
      expect(input.value).toBe('3322185207660004');
      expect(inputSpy).toHaveBeenCalledOnce();
      expect(keydownSpy).toHaveBeenCalledOnce();

      await vi.advanceTimersByTimeAsync(9000);
      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('failure cases', () => {
    it('should return false when searchNik input is missing', async () => {
      const result = await confirmAttendance('3322185207660004');
      expect(result).toBe(false);
    });

    it('should return false when Konfirmasi Hadir button never appears', async () => {
      const input = document.createElement('input');
      input.id = 'searchNik';
      document.body.appendChild(input);

      const promise = confirmAttendance('3322185207660004');
      await vi.advanceTimersByTimeAsync(9000);
      expect(await promise).toBe(false);
    });

    it('should return false when Tandai Hadir modal never appears', async () => {
      const input = document.createElement('input');
      input.id = 'searchNik';
      document.body.appendChild(input);

      setTimeout(() => {
        const btn = document.createElement('button');
        btn.textContent = 'Konfirmasi Hadir';
        document.body.appendChild(btn);
      }, 400);

      const promise = confirmAttendance('3322185207660004');
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await promise).toBe(false);
    });

    it('should return false when Hadir button is disabled (cursor-not-allowed)', async () => {
      const input = document.createElement('input');
      input.id = 'searchNik';
      document.body.appendChild(input);

      setTimeout(() => {
        const btn = document.createElement('button');
        btn.textContent = 'Konfirmasi Hadir';
        document.body.appendChild(btn);
      }, 400);

      setTimeout(() => {
        document.body.appendChild(makeAttandanceModal('Tandai Hadir?', ['Batal'], 'ABC-123'));
        const checkDiv = document.createElement('div');
        checkDiv.id = 'verify';
        checkDiv.className = 'check';
        document.body.appendChild(checkDiv);
      }, 800);

      // The Hadir button exists but is inside cursor-not-allowed wrapper
      setTimeout(() => {
        // disabled Hadir button
        const wrapper = document.createElement('div');
        wrapper.className = 'cursor-not-allowed';
        const disabledBtn = document.createElement('button');
        disabledBtn.textContent = 'Hadir';
        wrapper.appendChild(disabledBtn);
        document.body.appendChild(wrapper);
      }, 1000);

      const promise = confirmAttendance('3322185207660004');
      await vi.advanceTimersByTimeAsync(12_000);
      expect(await promise).toBe(false);
    });

    it('should return null when Berhasil Hadir modal never appears', async () => {
      const input = document.createElement('input');
      input.id = 'searchNik';
      document.body.appendChild(input);

      setTimeout(() => {
        const btn = document.createElement('button');
        btn.textContent = 'Konfirmasi Hadir';
        document.body.appendChild(btn);
      }, 400);

      setTimeout(() => {
        document.body.appendChild(
          makeAttandanceModal('Tandai Hadir?', ['Batal', 'Hadir'], 'ABC-123'),
        );
        const checkDiv = document.createElement('div');
        checkDiv.id = 'verify';
        checkDiv.className = 'check';
        document.body.appendChild(checkDiv);
      }, 800);

      setTimeout(() => {
        document.body.appendChild(makeHadirButton(true));
      }, 1000);

      const promise = confirmAttendance('3322185207660004');
      await vi.advanceTimersByTimeAsync(20_000);
      expect(await promise).toBe(null);
    });

    it('should return ticket text even when Tutup button is missing', async () => {
      const input = document.createElement('input');
      input.id = 'searchNik';
      document.body.appendChild(input);

      setTimeout(() => {
        const btn = document.createElement('button');
        btn.textContent = 'Konfirmasi Hadir';
        document.body.appendChild(btn);
      }, 400);

      setTimeout(() => {
        document.body.appendChild(
          makeAttandanceModal('Tandai Hadir?', ['Batal', 'Hadir'], 'ABC-123'),
        );
        const checkDiv = document.createElement('div');
        checkDiv.id = 'verify';
        checkDiv.className = 'check';
        document.body.appendChild(checkDiv);
      }, 800);

      setTimeout(() => {
        document.body.appendChild(makeHadirButton(true));
      }, 1000);

      setTimeout(() => {
        const modal = makeAttandanceModal('Berhasil Hadir', []);
        const ticket = document.createElement('div');
        ticket.textContent = 'No. Tiket: ABC-123';
        modal.querySelector('.rounded-lg').appendChild(ticket);
        document.body.appendChild(modal);
      }, 1600);

      const promise = confirmAttendance('3322185207660004');
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await promise).toBe('ABC-123');
    });
  });
});
