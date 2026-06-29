const GENDER_VALUES = new Set(['laki-laki', 'perempuan', 'l', 'p', 'pria', 'wanita']);

function isDigitsOnly(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c < '0' || c > '9') return false;
  }
  return true;
}

function parseDate(ddmmyyyy) {
  const parts = ddmmyyyy.split('-');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function diffDays(a, b) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function diffYears(a, b) {
  let years = b.getFullYear() - a.getFullYear();
  const monthDiff = b.getMonth() - a.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && b.getDate() < a.getDate())) {
    years--;
  }
  return years;
}

function digitCount(s) {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] >= '0' && s[i] <= '9') count++;
  }
  return count;
}

export function validateNik(_key, value) {
  if (!value) return 'NIK wajib diisi';
  if (value.length !== 16) return 'NIK harus 16 digit';
  if (!isDigitsOnly(value)) return 'NIK harus berupa angka';
  return null;
}

export function validateJenisKelamin(_key, value) {
  if (!value) return null;
  if (!GENDER_VALUES.has(value.toLowerCase())) return 'Jenis kelamin tidak dikenali';
  return null;
}

export function validateTanggalLahir(_key, value) {
  if (!value) return null;
  const date = parseDate(value);
  if (!date) return 'Format tanggal lahir harus DD-MM-YYYY';
  const age = diffYears(date, new Date());
  if (age < 0 || age > 120) return 'Tanggal lahir tidak masuk akal';
  return null;
}

export function validateTanggalPemeriksaan(_key, value) {
  if (!value) return null;
  const date = parseDate(value);
  if (!date) return 'Format tanggal pemeriksaan harus DD-MM-YYYY';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (diffDays(date, today) > 7) return 'Tanggal pemeriksaan maksimal 7 hari dari hari ini';
  return null;
}

export function validateNoWhatsapp(_key, value) {
  if (!value) return null;
  if (value.startsWith('+62') || value.startsWith('0'))
    return 'No Whatsapp tidak boleh diawali +62 atau 0';
  const digits = digitCount(value);
  if (digits < 8 || digits > 13) return 'No Whatsapp harus 8-13 digit';
  return null;
}

export function validateRegisterFormFields(entries) {
  const errors = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const validators = [];

  for (const [key, value] of Object.entries(entries)) {
    const k = key.toLowerCase().trim();
    const v = String(value ?? '').trim();

    if (k === 'nik') {
      validators.push(() => {
        const msg = validateNik(key, v);
        if (msg) errors.push({ key, message: msg });
      });
      continue;
    }

    if (k.includes('jenis kelamin') || k === 'jk' || k === 'jenis_kelamin') {
      validators.push(() => {
        const msg = validateJenisKelamin(key, v);
        if (msg) errors.push({ key, message: msg });
      });
      continue;
    }

    if (k.includes('tanggal lahir')) {
      validators.push(() => {
        const msg = validateTanggalLahir(key, v);
        if (msg) errors.push({ key, message: msg });
      });
      continue;
    }

    if (k.includes('tanggal pemeriksaan')) {
      validators.push(() => {
        const msg = validateTanggalPemeriksaan(key, v);
        if (msg) errors.push({ key, message: msg });
      });
      continue;
    }

    const isWaKey =
      k.includes('whatsapp') ||
      k.includes('no hp') ||
      k.includes('no wa') ||
      k === 'nohp' ||
      k === 'nowa';
    if (isWaKey) {
      validators.push(() => {
        const msg = validateNoWhatsapp(key, v);
        if (msg) errors.push({ key, message: msg });
      });
      continue;
    }
  }

  for (const fn of validators) {
    fn();
  }

  return errors;
}
