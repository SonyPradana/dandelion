const PROFILE_STRING_FIELDS = [
  'name',
  'formSkrining.url',
  'formSkrining.radioButtonKeywords',
  'formSkrining.dropdownKeywords',
  'formSkrining.excludes',
  'notChecked.url',
  'notChecked.notCheckedList',
  'skrining.url',
  'registerForm.url',
];

const PROFILE_NUMBER_FIELDS = [
  'notChecked.automationDelay',
  'notChecked.itemDelay',
  'notChecked.reloadDelay',
  'notChecked.domTimeout',
  'registerForm.retryMax',
  'registerForm.retryDelay',
  'registerForm.countdownDuration',
  'zenMode.domTimeout',
  'zenMode.timeout',
  'flashData.maxAge',
];

const PROFILE_BOOLEAN_FIELDS = [
  'formSkrining.scrollToButton',
  'formSkrining.respectInput',
  'formSkrining.ensureFill',
  'zenMode.enabled',
  'flashData.enabled',
];

const PANEL_POSITIONS = new Set(['top-left', 'top-right', 'bottom-left', 'bottom-right']);

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  'profiles',
  'activeProfile',
  'panelPosition',
  'silenceInfoNotification',
]);

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function parseConfig(text) {
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: `JSON tidak valid: ${error.message}` };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Konfigurasi harus berupa objek JSON.' };
  }
  return { ok: true, value: parsed };
}

export function validateConfig(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['Konfigurasi harus berupa objek JSON.'] };
  }

  const errors = [];
  const profiles = raw.profiles;

  if (
    !profiles ||
    typeof profiles !== 'object' ||
    Array.isArray(profiles) ||
    Object.keys(profiles).length === 0
  ) {
    errors.push('"profiles" wajib berupa objek dan tidak boleh kosong.');
  } else {
    if (typeof raw.activeProfile !== 'string' || !raw.activeProfile) {
      errors.push('"activeProfile" wajib diisi.');
    } else if (!Object.hasOwn(profiles, raw.activeProfile)) {
      errors.push(`Profil aktif "${raw.activeProfile}" tidak ditemukan di "profiles".`);
    }
  }

  if (profiles && typeof profiles === 'object' && !Array.isArray(profiles)) {
    for (const [key, profile] of Object.entries(profiles)) {
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        errors.push(`Profil "${key}" harus berupa objek.`);
        continue;
      }
      for (const field of PROFILE_STRING_FIELDS) {
        const value = getByPath(profile, field);
        if (value !== undefined && value !== null && typeof value !== 'string') {
          errors.push(`Profil "${key}": "${field}" harus berupa teks.`);
        }
      }
      for (const field of PROFILE_NUMBER_FIELDS) {
        const value = getByPath(profile, field);
        if (
          value !== undefined &&
          value !== null &&
          (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
        ) {
          errors.push(`Profil "${key}": "${field}" harus berupa angka.`);
        }
      }
      for (const field of PROFILE_BOOLEAN_FIELDS) {
        const value = getByPath(profile, field);
        if (value !== undefined && value !== null && typeof value !== 'boolean') {
          errors.push(`Profil "${key}": "${field}" harus berupa boolean.`);
        }
      }
    }
  }

  if (
    raw.silenceInfoNotification !== undefined &&
    raw.silenceInfoNotification !== null &&
    typeof raw.silenceInfoNotification !== 'boolean'
  ) {
    errors.push('"silenceInfoNotification" harus berupa boolean.');
  }

  if (
    raw.panelPosition !== undefined &&
    raw.panelPosition !== null &&
    !PANEL_POSITIONS.has(raw.panelPosition)
  ) {
    errors.push(
      '"panelPosition" tidak valid. Gunakan salah satu: top-left, top-right, bottom-left, bottom-right.',
    );
  }

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      errors.push(`Key "${key}" tidak didukung.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
