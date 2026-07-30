import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fillDataWali } from '../../../src/handlers/register-form/fill-data-wali.js';
import * as birthDateWali from '../../../src/handlers/register-form/fill-birth-date-wali.js';
import * as genderWali from '../../../src/handlers/register-form/fill-gender-wali.js';

function makeContainer() {
  const container = document.createElement('div');
  container.className = 'form-data-individu';

  const nikInput = document.createElement('input');
  nikInput.id = 'nik wali';
  container.appendChild(nikInput);

  const namaInput = document.createElement('input');
  namaInput.id = 'Nama Lengkap';
  container.appendChild(namaInput);

  const tlWrapper = document.createElement('div');
  tlWrapper.id = 'Tanggal Lahir';
  const tlInput = document.createElement('div');
  tlInput.className = 'mx-input-wrapper';
  tlWrapper.appendChild(tlInput);
  container.appendChild(tlWrapper);

  const jkWrapper = document.createElement('div');
  jkWrapper.setAttribute('show-icon-reset', 'false');
  jkWrapper.className = 'w-full';
  const jkLabel = document.createElement('div');
  jkLabel.className = 'font-semibold text-xs';
  jkLabel.textContent = 'Jenis Kelamin *';
  jkWrapper.appendChild(jkLabel);
  const jkTrigger = document.createElement('div');
  jkTrigger.className = 'relative cursor-pointer';
  jkTrigger.textContent = 'Pilih';
  jkWrapper.appendChild(jkTrigger);
  container.appendChild(jkWrapper);

  const waInput = document.createElement('input');
  waInput.id = 'No whatsapp';
  container.appendChild(waInput);

  return container;
}

describe('fillDataWali', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return false when no wali entries found', async () => {
    const container = makeContainer();
    document.body.appendChild(container);

    const entries = [
      ['NIK', '1234567890123456'],
      ['Nama Lengkap', 'Budi'],
    ];
    expect(await fillDataWali(entries)).toBe(false);
  });

  it('should return false when #nik wali element not found', async () => {
    const entries = [['NIK Wali', '1234567890123456']];
    expect(await fillDataWali(entries)).toBe(false);
  });

  it('should return false when .form-data-individu container not found', async () => {
    const nikInput = document.createElement('input');
    nikInput.id = 'nik wali';
    document.body.appendChild(nikInput);
    // no .form-data-individu parent

    const entries = [['NIK Wali', '1234567890123456']];
    expect(await fillDataWali(entries)).toBe(false);
  });

  it('should fill Nama Lengkap via fillScoped', async () => {
    const container = makeContainer();
    document.body.appendChild(container);

    const entries = [
      ['NIK Wali', '1234567890123456'],
      ['Nama Lengkap Wali', 'Budi Santoso'],
    ];

    await fillDataWali(entries);

    const namaInput = container.querySelector('[id="Nama Lengkap"]');
    expect(namaInput.value).toBe('Budi Santoso');
  });

  it('should call fillTanggalLahirWali with container', async () => {
    const container = makeContainer();
    document.body.appendChild(container);

    const spy = vi.spyOn(birthDateWali, 'fillTanggalLahirWali');
    spy.mockResolvedValue(true);

    const entries = [
      ['NIK Wali', '1234567890123456'],
      ['Tanggal Lahir Wali', '15-06-1990'],
    ];

    await fillDataWali(entries);

    expect(spy).toHaveBeenCalledWith('15-06-1990', container);
  });

  it('should call fillJenisKelaminWali with container', async () => {
    const container = makeContainer();
    document.body.appendChild(container);

    const spy = vi.spyOn(genderWali, 'fillJenisKelaminWali');
    spy.mockResolvedValue(true);

    const entries = [
      ['NIK Wali', '1234567890123456'],
      ['Jenis Kelamin Wali', 'laki-laki'],
    ];

    await fillDataWali(entries);

    expect(spy).toHaveBeenCalledWith('laki-laki', container);
  });

  it('should fill No whatsapp and not click phone-sama', async () => {
    const container = makeContainer();
    document.body.appendChild(container);

    const phoneSama = document.createElement('div');
    phoneSama.id = 'phone-sama';
    phoneSama.className = 'check';
    document.body.appendChild(phoneSama);

    let phoneClicked = false;
    phoneSama.addEventListener('click', () => {
      phoneClicked = true;
    });

    const entries = [
      ['NIK Wali', '1234567890123456'],
      ['No Whatsapp Wali', '08123456789'],
    ];

    await fillDataWali(entries);

    const waInput = container.querySelector('[id="No whatsapp"]');
    expect(waInput.value).toBe('08123456789');
    expect(phoneClicked).toBe(false);
  });

  it('should click phone-sama checkbox when WA entry not present', async () => {
    const container = makeContainer();
    document.body.appendChild(container);

    const phoneSama = document.createElement('div');
    phoneSama.id = 'phone-sama';
    phoneSama.className = 'check';
    document.body.appendChild(phoneSama);

    let phoneClicked = false;
    phoneSama.addEventListener('click', () => {
      phoneClicked = true;
    });

    const entries = [
      ['Nama Lengkap Wali', 'Budi Santoso'],
      ['NIK Wali', '1234567890123456'],
    ];

    await fillDataWali(entries);
    expect(phoneClicked).toBe(true);
  });

  it('should not fail when phone-sama checkbox is absent', async () => {
    const container = makeContainer();
    document.body.appendChild(container);

    const entries = [
      ['Nama Lengkap Wali', 'Budi Santoso'],
      ['NIK Wali', '1234567890123456'],
    ];

    const result = await fillDataWali(entries);
    expect(result).toBe(true);
  });

  it('should process all field types in order', async () => {
    const container = makeContainer();
    document.body.appendChild(container);

    const entries = [
      ['NIK Wali', '1234567890123456'],
      ['Nama Lengkap Wali', 'Siti Rahmawati'],
      ['Tanggal Lahir Wali', '20-08-1988'],
      ['Jenis Kelamin Wali', 'perempuan'],
      ['No Whatsapp Wali', '08765432109'],
    ];

    const tlSpy = vi.spyOn(birthDateWali, 'fillTanggalLahirWali');
    tlSpy.mockResolvedValue(true);
    const jkSpy = vi.spyOn(genderWali, 'fillJenisKelaminWali');
    jkSpy.mockResolvedValue(true);

    await fillDataWali(entries);

    expect(container.querySelector('[id="Nama Lengkap"]').value).toBe('Siti Rahmawati');
    expect(container.querySelector('[id="No whatsapp"]').value).toBe('08765432109');
    expect(tlSpy).toHaveBeenCalledWith('20-08-1988', container);
    expect(jkSpy).toHaveBeenCalledWith('perempuan', container);
  });

  it('should handle case-insensitive field detection', async () => {
    const container = makeContainer();
    document.body.appendChild(container);

    const entries = [
      ['nik wali', '9999999999999999'],
      ['nama lengkap wali', 'Test User'],
    ];

    await fillDataWali(entries);

    expect(container.querySelector('[id="Nama Lengkap"]').value).toBe('Test User');
  });
});
