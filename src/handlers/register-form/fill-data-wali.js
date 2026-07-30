import { fillTanggalLahirWali } from './fill-birth-date-wali.js';
import { fillJenisKelaminWali } from './fill-gender-wali.js';

/**
 * @param {string} key
 * @returns {string|null}
 */
function detectWaliField(key) {
  const k = key.toLowerCase();
  if (!k.endsWith(' wali')) return null;
  if (k.includes('nik')) return 'nik';
  if (k.includes('nama')) return 'nama';
  if (k.includes('tanggal') && k.includes('lahir')) return 'tl';
  if (k.includes('jenis') && k.includes('kelamin')) return 'jk';
  if (k.includes('no') && (k.includes('wa') || k.includes('whatsapp'))) return 'wa';
  return null;
}

/**
 * @param {Array<[string, string]>} entries
 * @returns {Promise<boolean>}
 */
export async function fillDataWali(entries) {
  const waliEntries = entries.filter(([id]) => detectWaliField(id));
  if (waliEntries.length === 0) return false;

  const nikWali = document.getElementById('nik wali');
  if (!nikWali) return false;
  const container = nikWali.closest('.form-data-individu');
  if (!container) return false;

  let hasWa = false;

  /**
   * @param {string} id
   * @param {string} val
   * @returns {boolean}
   */
  function fillScoped(id, val) {
    const el = container.querySelector(`[id="${id}"]`);
    if (!el) return false;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  for (const [id, value] of waliEntries) {
    const type = detectWaliField(id);
    switch (type) {
      case 'nik': {
        // handled by fillNikWali after fillDataWali
        break;
      }
      case 'nama': {
        fillScoped('Nama Lengkap', value);
        break;
      }
      case 'tl': {
        await fillTanggalLahirWali(value, container);
        break;
      }
      case 'jk': {
        await fillJenisKelaminWali(value, container);
        break;
      }
      case 'wa': {
        fillScoped('No whatsapp', value);
        hasWa = true;
        break;
      }
    }
  }

  if (!hasWa) {
    const phoneSama = document.querySelector('#phone-sama.check');
    if (phoneSama) phoneSama.click();
  }

  return true;
}
