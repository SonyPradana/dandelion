import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  submitSection3,
  findRegistrationSuccessModal,
  parseTicket,
} from '../../../src/handlers/register-form/submit-section-3.js';

function makeSuccessModal(content = 'No. Tiket: ABC-123') {
  const outer = document.createElement('div');
  const inner = document.createElement('div');
  inner.className = 'rounded-lg bg-white p-4';
  const title = document.createElement('div');
  title.textContent = 'Berhasil Daftar';
  const detail = document.createElement('div');
  detail.textContent = content;
  const close = document.createElement('button');
  close.textContent = 'Tutup';
  inner.append(title, detail, close);
  outer.appendChild(inner);
  document.body.appendChild(outer);
  return inner;
}

describe('submitSection3', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('reads an already-open success modal without clicking Tutup', async () => {
    const modal = makeSuccessModal();
    const close = modal.querySelector('button');
    const clickSpy = vi.fn();
    close.addEventListener('click', clickSpy);

    const result = await submitSection3();

    expect(result.status).toBe('ok');
    expect(result.ticket).toBe('ABC-123');
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('waits for the success modal to appear', async () => {
    setTimeout(makeSuccessModal, 50);

    const result = await submitSection3(1000);

    expect(result.status).toBe('ok');
    expect(result.ticket).toBe('ABC-123');
  });

  it('returns closed when the modal appears and disappears before polling', async () => {
    const promise = submitSection3(1000);

    setTimeout(() => {
      const modal = makeSuccessModal();
      setTimeout(() => modal.closest('div')?.remove(), 10);
    }, 10);

    const result = await promise;

    expect(result.status).toBe('closed');
  });

  it('returns missing when no success modal appears', async () => {
    const result = await submitSection3(100);

    expect(result.status).toBe('missing');
  });
});

describe('findRegistrationSuccessModal', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('returns null when only other modals exist', () => {
    const modal = document.createElement('div');
    modal.className = 'rounded-lg bg-white p-4';
    modal.textContent = 'Data peserta valid';
    document.body.appendChild(modal);

    expect(findRegistrationSuccessModal()).toBeNull();
  });
});

describe('parseTicket', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('reads the No. Tiket text', () => {
    expect(parseTicket(makeSuccessModal('No. Tiket: XYZ-9'))).toBe('XYZ-9');
  });

  it('reads a Nomor Tiket label', () => {
    const modal = makeSuccessModal('');
    const row = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'font-semibold';
    label.textContent = 'Nomor Tiket:';
    const value = document.createElement('div');
    value.textContent = 'LMN-1';
    row.append(label, value);
    modal.appendChild(row);

    expect(parseTicket(modal)).toBe('LMN-1');
  });

  it('returns null when the ticket is missing', () => {
    expect(parseTicket(makeSuccessModal(''))).toBeNull();
  });

  it('handles the site success modal markup with nested action buttons', () => {
    const modal = document.createElement('div');
    modal.className =
      'w-[30%] max-h-full relative z-1000 rounded-lg bg-white p-4 shadow-gmail overflow-auto';
    modal.innerHTML = `
      <button><svg></svg></button>
      <div class="p-2">
        <div class="flex flex-col justify-center items-center gap-3 text-[20px] font-bold mb-7">
          <div class="pb-2">Berhasil Daftar</div>
          <div>No. Tiket: K9F-6CM</div>
          <div class="w-full border-1">Pemeriksaan mandiri belum lengkap</div>
        </div>
        <div class="flex justify-center gap-2 font-600 text-base mt-4">
          <button type="button"><div><div class="tracking-wide">Bantu Isi Skrining Mandiri</div></div></button>
          <button type="button"><div><div class="tracking-wide">Tutup</div></div></button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    expect(findRegistrationSuccessModal()).toBe(modal);
    expect(parseTicket(modal)).toBe('K9F-6CM');
  });
});
