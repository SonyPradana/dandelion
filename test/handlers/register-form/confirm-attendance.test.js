import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  confirmAttendance,
  searchAttendance,
  completeAttendance,
  completeDoneAttendance,
  detectAttendancePosition,
} from '../../../src/handlers/register-form/confirm-attendance.js';

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

function makeDoneModal(ticketText) {
  const outer = makeAttandanceModal('Berhasil Hadir', ['Tutup'], ticketText);
  const tutup = outer.querySelector('button');
  if (tutup) tutup.addEventListener('click', () => outer.remove());
  return outer;
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
      const promise = confirmAttendance(nik, 500);
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

      const promise = confirmAttendance('3322185207660004', 1000);
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
      const result = await confirmAttendance('3322185207660004', 1000);
      expect(result).toBe(false);
    });

    it('should return false when Konfirmasi Hadir button never appears', async () => {
      const input = document.createElement('input');
      input.id = 'searchNik';
      document.body.appendChild(input);

      const promise = confirmAttendance('3322185207660004', 1000);
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

      const promise = confirmAttendance('3322185207660004', 1000);
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

      const promise = confirmAttendance('3322185207660004', 1000);
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

      const promise = confirmAttendance('3322185207660004', 1000);
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

      const promise = confirmAttendance('3322185207660004', 1000);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await promise).toBe('ABC-123');
    });
  });
});

describe('detectAttendancePosition', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('should return null when no attendance signal exists', () => {
    expect(detectAttendancePosition()).toBeNull();
  });

  it('should return search when only searchNik exists', () => {
    const input = document.createElement('input');
    input.id = 'searchNik';
    document.body.appendChild(input);
    expect(detectAttendancePosition()).toBe('search');
  });

  it('should return confirm when Konfirmasi Hadir button is present', () => {
    const input = document.createElement('input');
    input.id = 'searchNik';
    document.body.appendChild(input);
    const btn = document.createElement('button');
    btn.textContent = 'Konfirmasi Hadir';
    document.body.appendChild(btn);
    expect(detectAttendancePosition()).toBe('confirm');
  });

  it('should return hadir when Tandai Hadir modal is open', () => {
    document.body.appendChild(makeAttandanceModal('Tandai Hadir?', []));
    expect(detectAttendancePosition()).toBe('hadir');
  });

  it('should return hadir when countdown panel exists', () => {
    const countdown = document.createElement('div');
    countdown.id = 'dandelion-countdown-1';
    document.body.appendChild(countdown);
    expect(detectAttendancePosition()).toBe('hadir');
  });

  it('should return done when Berhasil Hadir modal is open', () => {
    document.body.appendChild(makeAttandanceModal('Berhasil Hadir', []));
    expect(detectAttendancePosition()).toBe('done');
  });

  it('should prioritize done over other signals', () => {
    const input = document.createElement('input');
    input.id = 'searchNik';
    document.body.appendChild(input);
    document.body.appendChild(makeAttandanceModal('Berhasil Hadir', []));
    expect(detectAttendancePosition()).toBe('done');
  });
});

describe('searchAttendance', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null when searchNik input is missing', async () => {
    const result = await searchAttendance('3322185207660004');
    expect(result).toBeNull();
  });

  it('should search and return modal with ticket', async () => {
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
    }, 800);

    const promise = searchAttendance('3322185207660004');
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;
    expect(result).not.toBeNull();
    expect(result.ticket).toBe('ABC-123');
    expect(result.modal.textContent).toContain('Tandai Hadir?');
    expect(input.value).toBe('3322185207660004');
  });

  it('should return null when Konfirmasi Hadir never appears', async () => {
    const input = document.createElement('input');
    input.id = 'searchNik';
    document.body.appendChild(input);

    const promise = searchAttendance('3322185207660004');
    await vi.advanceTimersByTimeAsync(9000);
    expect(await promise).toBeNull();
  });

  it('should skip search phase when skip=true', async () => {
    const input = document.createElement('input');
    input.id = 'searchNik';
    document.body.appendChild(input);

    setTimeout(() => {
      document.body.appendChild(
        makeAttandanceModal('Tandai Hadir?', ['Batal', 'Hadir'], 'ABC-123'),
      );
    }, 200);

    const promise = searchAttendance('3322185207660004', { skip: true });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result).not.toBeNull();
    expect(result.ticket).toBe('ABC-123');
    expect(input.value).toBe('');
  });

  it('should return null when skip=true and modal never appears', async () => {
    const promise = searchAttendance('3322185207660004', { skip: true });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await promise).toBeNull();
  });
});

describe('completeAttendance', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should complete flow, close success modal, and return ticket', async () => {
    document.body.appendChild(makeDoneModal('ABC-123'));

    const promise = completeAttendance('ABC-123', 500);
    await vi.advanceTimersByTimeAsync(3000);
    expect(await promise).toBe('ABC-123');
    expect(document.querySelector('.rounded-lg.bg-white.p-4')).toBeNull();
  });

  it('should click Hadir when success modal is not yet open', async () => {
    document.body.appendChild(makeAttandanceModal('Tandai Hadir?', ['Batal'], 'ABC-123'));
    document.body.appendChild(makeHadirButton(true));

    setTimeout(() => {
      document.body.appendChild(makeDoneModal('ABC-123'));
    }, 2500);

    const promise = completeAttendance('ABC-123', 1000);
    await vi.advanceTimersByTimeAsync(8000);
    expect(await promise).toBe('ABC-123');
  });

  it('should return false when Hadir stays disabled', async () => {
    document.body.appendChild(makeAttandanceModal('Tandai Hadir?', ['Batal'], 'ABC-123'));
    const wrapper = document.createElement('div');
    wrapper.className = 'cursor-not-allowed';
    const disabledBtn = document.createElement('button');
    disabledBtn.textContent = 'Hadir';
    wrapper.appendChild(disabledBtn);
    document.body.appendChild(wrapper);

    const promise = completeAttendance('ABC-123', 1000);
    await vi.advanceTimersByTimeAsync(8000);
    expect(await promise).toBe(false);
  });

  it('should return null when Berhasil Hadir modal never appears', async () => {
    document.body.appendChild(makeAttandanceModal('Tandai Hadir?', ['Batal'], 'ABC-123'));
    document.body.appendChild(makeHadirButton(true));

    const promise = completeAttendance('ABC-123', 1000);
    await vi.advanceTimersByTimeAsync(8000);
    expect(await promise).toBeNull();
  });
});

describe('completeDoneAttendance', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return ticket and close the open success modal', async () => {
    document.body.appendChild(makeDoneModal('ABC-123'));

    const promise = completeDoneAttendance();
    await vi.advanceTimersByTimeAsync(2000);
    expect(await promise).toBe('ABC-123');
    expect(document.querySelector('.rounded-lg.bg-white.p-4')).toBeNull();
  });

  it('should return null when no success modal is open', async () => {
    const promise = completeDoneAttendance();
    await vi.advanceTimersByTimeAsync(2000);
    expect(await promise).toBeNull();
  });
});
