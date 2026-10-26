import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  bootstrapSkriningGate,
  parseExaminationDate,
  selectDateInModal,
} from '../../../src/handlers/skriningform/bootstrap-gate.js';

function makeModal() {
  const modal = document.createElement('div');
  modal.className = 'rounded-lg bg-white p-4';
  modal.innerHTML = `
    <div>Konfirmasi Tanggal Pemeriksaan</div>
    <div class="flex justify-between items-center mb-4">
      <div><button type="button">Okt</button><button type="button">2026</button></div>
      <div><button type="button"><svg></svg></button><button type="button"><svg></svg></button></div>
    </div>
    <button type="button"><span>26</span></button>
  `;
  document.body.appendChild(modal);
  return modal;
}

function addButton(label, onClick, root = document.body) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', onClick);
  root.appendChild(button);
  return button;
}

describe('parseExaminationDate', () => {
  it('parses supported date formats', () => {
    expect(parseExaminationDate('26-10-2026')).toEqual({ day: 26, month: 10, year: 2026 });
    expect(parseExaminationDate('26/10/2026')).toEqual({ day: 26, month: 10, year: 2026 });
    expect(parseExaminationDate('2026-10-26')).toEqual({ day: 26, month: 10, year: 2026 });
  });

  it('rejects empty and invalid dates', () => {
    expect(parseExaminationDate('')).toBeNull();
    expect(parseExaminationDate(null)).toBeNull();
    expect(parseExaminationDate('31-02-2026')).toBeNull();
  });
});

describe('selectDateInModal', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('clicks the matching day', async () => {
    const modal = makeModal();
    const day = modal.querySelector('span')?.closest('button');
    const click = vi.fn();
    day?.addEventListener('click', click);

    await expect(selectDateInModal(modal, { day: 26, month: 10, year: 2026 })).resolves.toBe(true);
    expect(click).toHaveBeenCalledOnce();
  });

  it('does not click a disabled day', async () => {
    const modal = makeModal();
    const day = modal.querySelector('span')?.closest('button');
    day?.classList.add('cursor-not-allowed');

    await expect(selectDateInModal(modal, { day: 26, month: 10, year: 2026 })).resolves.toBe(false);
  });
});

describe('bootstrapSkriningGate', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('clicks the gate and Simpan when no date is provided', async () => {
    const modal = makeModal();
    modal.remove();
    const gateClick = vi.fn(() => document.body.appendChild(modal));
    addButton('Mulai Pemeriksaan', gateClick);
    const simpan = addButton('Simpan', () => modal.remove(), modal);

    await expect(bootstrapSkriningGate({})).resolves.toBe('done');
    expect(gateClick).toHaveBeenCalledOnce();
    expect(simpan.isConnected).toBe(false);
  });

  it('selects the flash date before clicking Simpan', async () => {
    const modal = makeModal();
    modal.remove();
    const day = modal.querySelector('span')?.closest('button');
    const dayClick = vi.fn();
    day?.addEventListener('click', dayClick);
    addButton('Mulai Pemeriksaan', () => document.body.appendChild(modal));
    addButton('Simpan', () => modal.remove(), modal);

    await expect(
      bootstrapSkriningGate({ pinneds: { 'tanggal pemeriksaan': '26-10-2026' } }),
    ).resolves.toBe('done');
    expect(dayClick).toHaveBeenCalledOnce();
  });

  it('confirms an already-open modal without a gate', async () => {
    const modal = makeModal();
    addButton('Simpan', () => modal.remove(), modal);

    await expect(bootstrapSkriningGate({})).resolves.toBe('done');
  });

  it('leaves the page alone when the gate is missing', async () => {
    await expect(bootstrapSkriningGate({})).resolves.toBe('no-gate');
  }, 10_000);
});
