import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  bootstrapSkriningGate,
  parseExaminationDate,
  selectDateInModal,
} from '../../../src/handlers/skriningform/bootstrap-gate.js';

const modalHtml = readFileSync(resolve('test/__fixtures__/skrining-date-modal.html'), 'utf8');

function makeModal() {
  const host = document.createElement('div');
  host.innerHTML = modalHtml;
  const modal = host.firstElementChild;
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

function dayButton(modal, day) {
  return Array.from(modal.querySelectorAll('button')).find(
    (button) => button.textContent.trim() === String(day),
  );
}

function wireSimpan(modal) {
  const simpan = Array.from(modal.querySelectorAll('button')).find(
    (button) => button.textContent.trim() === 'Simpan',
  );
  simpan.addEventListener('click', () => modal.remove());
  return simpan;
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
    const day = dayButton(modal, 26);
    const click = vi.fn();
    day?.addEventListener('click', click);

    await expect(selectDateInModal(modal, { day: 26, month: 10, year: 2026 })).resolves.toBe(true);
    expect(click).toHaveBeenCalledOnce();
  });

  it('does not click a disabled day', async () => {
    const modal = makeModal();
    const day = dayButton(modal, 26);
    day?.classList.add('cursor-not-allowed');

    await expect(selectDateInModal(modal, { day: 26, month: 10, year: 2026 })).resolves.toBe(false);
  });

  it('gives up when the calendar does not move', async () => {
    const modal = makeModal();

    await expect(selectDateInModal(modal, { day: 1, month: 5, year: 2026 })).resolves.toBe(false);
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
    const simpan = wireSimpan(modal);

    await expect(bootstrapSkriningGate({})).resolves.toBe('done');
    expect(gateClick).toHaveBeenCalledOnce();
    expect(simpan.isConnected).toBe(false);
  });

  it('selects the flash date before clicking Simpan', async () => {
    const modal = makeModal();
    modal.remove();
    const day = dayButton(modal, 26);
    const dayClick = vi.fn();
    day?.addEventListener('click', dayClick);
    addButton('Mulai Pemeriksaan', () => document.body.appendChild(modal));
    wireSimpan(modal);

    await expect(
      bootstrapSkriningGate({ pinneds: { 'tanggal pemeriksaan': '26-10-2026' } }),
    ).resolves.toBe('done');
    expect(dayClick).toHaveBeenCalledOnce();
  });

  it('confirms an already-open modal without a gate', async () => {
    const modal = makeModal();
    wireSimpan(modal);

    await expect(bootstrapSkriningGate({})).resolves.toBe('done');
  });

  it('reports a fallback when the flash date cannot be selected', async () => {
    const modal = makeModal();
    dayButton(modal, 26)?.classList.add('cursor-not-allowed');
    const simpan = wireSimpan(modal);

    await expect(
      bootstrapSkriningGate({ pinneds: { 'tanggal pemeriksaan': '26-10-2026' } }),
    ).resolves.toBe('date-fallback');
    expect(simpan.isConnected).toBe(false);
  });

  it('leaves the page alone when the gate is missing', async () => {
    await expect(bootstrapSkriningGate({}, { gateTimeout: 50 })).resolves.toBe('no-gate');
  });
});
