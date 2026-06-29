import { describe, it, expect } from 'vitest';
import {
  validateRegisterFormFields,
  validateNik,
  validateJenisKelamin,
  validateTanggalLahir,
  validateTanggalPemeriksaan,
  validateNoWhatsapp,
} from '../../src/utils/registerFormValidator.js';

function todayDDMMYYYY() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

describe('validateNik', () => {
  it('should return error for empty value', () => {
    expect(validateNik('nik', '')).toBeTruthy();
    expect(validateNik('nik', null)).toBeTruthy();
  });

  it('should return error for wrong length', () => {
    expect(validateNik('nik', '123')).toContain('16 digit');
  });

  it('should return error for non-digit chars', () => {
    expect(validateNik('nik', '123456789012345a')).toContain('angka');
  });

  it('should return null for valid NIK', () => {
    expect(validateNik('nik', '3322185207660004')).toBeNull();
  });
});

describe('validateJenisKelamin', () => {
  it('should return null for valid values', () => {
    for (const v of ['laki-laki', 'perempuan', 'L', 'P', 'pria', 'wanita']) {
      expect(validateJenisKelamin('Jenis Kelamin', v)).toBeNull();
    }
  });

  it('should return null when empty', () => {
    expect(validateJenisKelamin('Jenis Kelamin', '')).toBeNull();
  });

  it('should return error for unrecognized value', () => {
    expect(validateJenisKelamin('Jenis Kelamin', 'alien')).toContain('tidak dikenali');
  });
});

describe('validateTanggalLahir', () => {
  it('should return null for valid date with reasonable age', () => {
    expect(validateTanggalLahir('Tanggal Lahir', '12-07-1966')).toBeNull();
  });

  it('should return null when empty', () => {
    expect(validateTanggalLahir('Tanggal Lahir', '')).toBeNull();
  });

  it('should return error for invalid format', () => {
    expect(validateTanggalLahir('Tanggal Lahir', 'not-a-date')).toContain('Format');
  });

  it('should return error for age > 120', () => {
    expect(validateTanggalLahir('Tanggal Lahir', '12-07-1800')).toContain('tidak masuk akal');
  });

  it('should return error for future date', () => {
    expect(validateTanggalLahir('Tanggal Lahir', '12-07-2099')).toContain('tidak masuk akal');
  });
});

describe('validateTanggalPemeriksaan', () => {
  it('should return null for today', () => {
    expect(validateTanggalPemeriksaan('Tanggal Pemeriksaan', todayDDMMYYYY())).toBeNull();
  });

  it('should return null for date within 7 days', () => {
    expect(validateTanggalPemeriksaan('Tanggal Pemeriksaan', daysFromNow(-3))).toBeNull();
    expect(validateTanggalPemeriksaan('Tanggal Pemeriksaan', daysFromNow(3))).toBeNull();
  });

  it('should return null for date exactly 7 days away', () => {
    expect(validateTanggalPemeriksaan('Tanggal Pemeriksaan', daysFromNow(7))).toBeNull();
    expect(validateTanggalPemeriksaan('Tanggal Pemeriksaan', daysFromNow(-7))).toBeNull();
  });

  it('should return error for date > 7 days away', () => {
    expect(validateTanggalPemeriksaan('Tanggal Pemeriksaan', daysFromNow(8))).toContain('7 hari');
    expect(validateTanggalPemeriksaan('Tanggal Pemeriksaan', daysFromNow(-8))).toContain('7 hari');
  });

  it('should return error for invalid format', () => {
    expect(validateTanggalPemeriksaan('Tanggal Pemeriksaan', 'bad')).toContain('Format');
  });

  it('should return null when empty', () => {
    expect(validateTanggalPemeriksaan('Tanggal Pemeriksaan', '')).toBeNull();
  });
});

describe('validateNoWhatsapp', () => {
  it('should return null for valid number', () => {
    expect(validateNoWhatsapp('No Whatsapp', '88888888')).toBeNull();
  });

  it('should return null for 13 digit number', () => {
    expect(validateNoWhatsapp('No Whatsapp', '8888888888888')).toBeNull();
  });

  it('should return error for +62 prefix', () => {
    expect(validateNoWhatsapp('No Whatsapp', '+6288888888')).toContain('+62');
  });

  it('should return error for 0 prefix', () => {
    expect(validateNoWhatsapp('No Whatsapp', '088888888')).toContain('0');
  });

  it('should return error for < 8 digits', () => {
    expect(validateNoWhatsapp('No Whatsapp', '1234567')).toContain('8-13');
  });

  it('should return error for > 13 digits', () => {
    expect(validateNoWhatsapp('No Whatsapp', '12345678901234')).toContain('8-13');
  });

  it('should return null when empty', () => {
    expect(validateNoWhatsapp('No Whatsapp', '')).toBeNull();
  });
});

describe('validateRegisterFormFields', () => {
  describe('NIK', () => {
    it('should error when NIK is empty', () => {
      const errors = validateRegisterFormFields({ nik: '' });
      expect(errors.some((e) => e.key === 'nik' && e.message.includes('wajib'))).toBe(true);
    });

    it('should error when NIK is not 16 digits', () => {
      const errors = validateRegisterFormFields({ nik: '123' });
      expect(errors.some((e) => e.key === 'nik' && e.message.includes('16 digit'))).toBe(true);
    });

    it('should error when NIK contains non-digit chars', () => {
      const errors = validateRegisterFormFields({ nik: '123456789012345a' });
      expect(errors.some((e) => e.key === 'nik' && e.message.includes('angka'))).toBe(true);
    });

    it('should pass for valid 16-digit NIK', () => {
      const errors = validateRegisterFormFields({ nik: '3322185207660004' });
      expect(errors.filter((e) => e.key === 'nik')).toHaveLength(0);
    });
  });

  describe('Jenis Kelamin', () => {
    const valid = ['laki-laki', 'perempuan', 'L', 'P', 'pria', 'wanita'];
    for (const v of valid) {
      it(`should accept "${v}"`, () => {
        const errors = validateRegisterFormFields({ 'Jenis Kelamin': v });
        expect(errors.filter((e) => e.key === 'Jenis Kelamin')).toHaveLength(0);
      });
    }

    it('should error for unrecognized value', () => {
      const errors = validateRegisterFormFields({ 'Jenis Kelamin': 'alien' });
      expect(errors.some((e) => e.message.includes('tidak dikenali'))).toBe(true);
    });

    it('should skip when empty', () => {
      const errors = validateRegisterFormFields({ 'Jenis Kelamin': '' });
      expect(errors.filter((e) => e.key === 'Jenis Kelamin')).toHaveLength(0);
    });
  });

  describe('Tanggal Lahir', () => {
    it('should pass for valid date with reasonable age', () => {
      const errors = validateRegisterFormFields({ 'Tanggal Lahir': '12-07-1966' });
      expect(errors.filter((e) => e.key === 'Tanggal Lahir')).toHaveLength(0);
    });

    it('should error for invalid format', () => {
      const errors = validateRegisterFormFields({ 'Tanggal Lahir': 'not-a-date' });
      expect(errors.some((e) => e.message.includes('Format'))).toBe(true);
    });

    it('should error for date with unreasonable age (> 120)', () => {
      const errors = validateRegisterFormFields({ 'Tanggal Lahir': '12-07-1800' });
      expect(errors.some((e) => e.message.includes('tidak masuk akal'))).toBe(true);
    });

    it('should error for future birth date', () => {
      const errors = validateRegisterFormFields({ 'Tanggal Lahir': '12-07-2099' });
      expect(errors.some((e) => e.message.includes('tidak masuk akal'))).toBe(true);
    });

    it('should skip when empty', () => {
      const errors = validateRegisterFormFields({ 'Tanggal Lahir': '' });
      expect(errors.filter((e) => e.key === 'Tanggal Lahir')).toHaveLength(0);
    });
  });

  describe('Tanggal Pemeriksaan', () => {
    it('should pass for today', () => {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const errors = validateRegisterFormFields({ 'Tanggal Pemeriksaan': `${dd}-${mm}-${yyyy}` });
      expect(errors.filter((e) => e.key === 'Tanggal Pemeriksaan')).toHaveLength(0);
    });

    it('should pass for date within 7 days', () => {
      const errors = validateRegisterFormFields({ 'Tanggal Pemeriksaan': '24-06-2026' });
      expect(errors.filter((e) => e.key === 'Tanggal Pemeriksaan')).toHaveLength(0);
    });

    it('should error for date more than 7 days away', () => {
      const errors = validateRegisterFormFields({ 'Tanggal Pemeriksaan': '01-01-2020' });
      expect(errors.some((e) => e.message.includes('7 hari'))).toBe(true);
    });

    it('should error for invalid format', () => {
      const errors = validateRegisterFormFields({ 'Tanggal Pemeriksaan': 'bad' });
      expect(errors.some((e) => e.message.includes('Format'))).toBe(true);
    });

    it('should skip when empty', () => {
      const errors = validateRegisterFormFields({ 'Tanggal Pemeriksaan': '' });
      expect(errors.filter((e) => e.key === 'Tanggal Pemeriksaan')).toHaveLength(0);
    });
  });

  describe('No Whatsapp', () => {
    it('should pass for 8-13 digit number without prefix', () => {
      const errors = validateRegisterFormFields({ 'No Whatsapp': '88888888' });
      expect(errors.filter((e) => e.key === 'No Whatsapp')).toHaveLength(0);
    });

    it('should pass for 13 digit number', () => {
      const errors = validateRegisterFormFields({ 'No Whatsapp': '8888888888888' });
      expect(errors.filter((e) => e.key === 'No Whatsapp')).toHaveLength(0);
    });

    it('should error for +62 prefix', () => {
      const errors = validateRegisterFormFields({ 'No Whatsapp': '+62888888888' });
      expect(errors.some((e) => e.message.includes('+62'))).toBe(true);
    });

    it('should error for 0 prefix', () => {
      const errors = validateRegisterFormFields({ 'No Whatsapp': '088888888' });
      expect(errors.some((e) => e.message.includes('0'))).toBe(true);
    });

    it('should error when less than 8 digits', () => {
      const errors = validateRegisterFormFields({ 'No Whatsapp': '1234567' });
      expect(errors.some((e) => e.message.includes('8-13'))).toBe(true);
    });

    it('should error when more than 13 digits', () => {
      const errors = validateRegisterFormFields({ 'No Whatsapp': '12345678901234' });
      expect(errors.some((e) => e.message.includes('8-13'))).toBe(true);
    });

    it('should skip when empty', () => {
      const errors = validateRegisterFormFields({ 'No Whatsapp': '' });
      expect(errors.filter((e) => e.key === 'No Whatsapp')).toHaveLength(0);
    });

    it('should match alternate keys like "no hp" or "nowa"', () => {
      const errors = validateRegisterFormFields({ 'no hp': '123' });
      expect(errors.some((e) => e.message.includes('8-13'))).toBe(true);
    });
  });

  describe('unknown keys', () => {
    it('should skip unrecognized keys', () => {
      const errors = validateRegisterFormFields({ 'Some random key': 'anything' });
      expect(errors).toHaveLength(0);
    });
  });

  describe('multiple errors', () => {
    it('should return all errors in one call', () => {
      const errors = validateRegisterFormFields({
        nik: '',
        'Jenis Kelamin': 'alien',
        'Tanggal Lahir': 'bad',
      });
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
