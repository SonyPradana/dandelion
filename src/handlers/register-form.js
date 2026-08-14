import { controlPanel } from '../components/controlPanel.js';
import { notify } from '../components/notification';
import { button } from '../components/button.js';
import { h } from '../utils/dom.js';
import { showFlashDataPanel } from '../components/flashPanel.js';
import {
  setRegisterFormFlashData,
  getRegisterFormFlashData,
  clearRegisterFormFlashData,
} from '../utils/registerFormFlashSession.js';
import { validateRegisterFormFields } from '../utils/registerFormValidator.js';
import bus from '../utils/hooks';
import { fillByCheckId } from './register-form/fill-by-check-id.js';
import { clickCekNik, waitForCekNikResponse } from './register-form/click-check-nik.js';
import { fillTanggalPemeriksaan } from './register-form/fill-examination-date.js';
import { fillJenisKelamin } from './register-form/fill-gender.js';
import { fillTanggalLahir } from './register-form/fill-birth-date.js';
import { submitSection1 } from './register-form/submit-section-1.js';
import { fillStatusPernikahan } from './register-form/fill-marital-status.js';
import { fillPenyandangDisabilitas } from './register-form/fill-disability.js';
import { fillPekerjaan } from './register-form/fill-occupation.js';
import { fillAlamatDomisili } from './register-form/fill-residence-address.js';
import { submitSection2 } from './register-form/submit-section-2.js';
import { submitSection3 } from './register-form/submit-section-3.js';
import {
  searchAttendance,
  completeAttendance,
  completeDoneAttendance,
  detectAttendancePosition,
} from './register-form/confirm-attendance.js';
import { fillDataWali } from './register-form/fill-data-wali.js';
import { fillNikWali } from './register-form/fill-nik-wali.js';

let isRegisterFormRunning = false;
let registerFormAbort = false;

/**
 * @param {{ retryMax?: number, retryDelay?: number, countdownDuration?: number }} [registerFormConfig={}]
 * @returns {Promise<void>}
 */
export async function initializeRegisterForm(registerFormConfig = {}) {
  const monkeyBtn = button('dandelion-register-form-btn');
  if (!monkeyBtn) return;

  monkeyBtn.addEventListener('click', async () => {
    if (isRegisterFormRunning) {
      const close = await notify.confirm(
        'Register Form',
        'Task sedang berjalan. Tutup dan bersihkan state?',
      );
      if (!close) return;
      registerFormAbort = true;
      await resetRegisterForm('Task dihentikan');
      return;
    }

    const resuming = isRegisterFormResumable();
    if (isRegisterFormFlowOpen() && !resuming) {
      registerFormAbort = true;
      await resetRegisterForm(null);
      return;
    }

    registerFormAbort = false;
    if (resuming) {
      document.querySelectorAll('[id^="dandelion-action-"]').forEach((p) => p.remove());
    } else {
      closeSuccessModalIfOpen();

      const target = Array.from(document.querySelectorAll('button')).find((btn) =>
        btn.textContent?.trim().includes('Daftar Baru'),
      );
      if (target) target.click();

      showFlashDataPanel({
        setData: setRegisterFormFlashData,
        clearData: clearRegisterFormFlashData,
        validate: validateRegisterFormFields,
        initialData: registerFormConfig.defaultPinneds,
      });

      const opened = await waitForModal();
      if (!opened) return;
    }

    const completed = {};
    /** @param {number} ms */
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const { retryMax = 3, retryDelay = 2000, countdownDuration = 5000 } = registerFormConfig;
    /**
     * @param {string} label
     * @param {() => Promise<any>} fn
     * @returns {Promise<any>}
     */
    async function retry(label, fn) {
      for (let i = 1; i <= retryMax; i++) {
        const result = await fn();
        if (result && result !== 'blocked') return result;
        if (result === 'blocked') return 'blocked';
        if (i < retryMax) {
          stateEl.textContent = `${label} [ulang ${i}/${retryMax - 1}]`;
          await wait(retryDelay);
        }
      }
      return null;
    }
    const actionPanel = notify.action(
      'Register Form',
      'Isi data dengan lengkap dan sesuai',
      [
        {
          label: 'Mulai',
          type: 'success',
          autoClose: false,
          onClick: async () => {
            if (isRegisterFormRunning) return;
            isRegisterFormRunning = true;

            const flashData = await getRegisterFormFlashData();
            if (!flashData?.pinneds || Object.keys(flashData.pinneds).length === 0) {
              notify.info('Register Form', 'Isi flash data panel dulu', 2000);
              isRegisterFormRunning = false;
              return;
            }
            if (registerFormAbort) {
              isRegisterFormRunning = false;
              return;
            }

            const entries = Object.entries(flashData.pinneds);
            const step = detectCurrentStep();
            let startSection = 1;
            if (step === 'section-2' || completed[1]) startSection = 2;
            if (step === 'section-3' || completed[2]) startSection = 3;
            if (step === 'section-4' || completed[3]) startSection = 4;
            stateEl.textContent = `Mulai ${startSection}/4`;

            // ── Section 1 ──
            if (startSection <= 1 && !completed[1]) {
              const pesertaEntries = entries.filter(([id]) => !id.toLowerCase().endsWith(' wali'));
              const nikEntry = pesertaEntries.find(([id]) => id.toLowerCase() === 'nik');
              const otherEntries = pesertaEntries.filter(([id]) => id.toLowerCase() !== 'nik');
              let dataDitemukan = false;
              let count = 0;

              if (nikEntry && fillByCheckId(nikEntry[0], nikEntry[1])) {
                count++;
                const clicked = await clickCekNik();
                if (clicked) {
                  const result = await waitForCekNikResponse();
                  if (result === 'not-found') {
                    notify.info('Cek NIK', 'Data baru, isi manual', 3000);
                    for (const [id, value] of otherEntries) {
                      if (fillByCheckId(id, value)) count++;
                    }
                  } else if (result === 'found') {
                    dataDitemukan = await handleDataDitemukanModal();
                    await new Promise((r) => setTimeout(r, 300));
                  }
                }
              } else {
                for (const [id, value] of pesertaEntries) {
                  if (fillByCheckId(id, value)) count++;
                }
              }

              const jkEntry = pesertaEntries.find(
                ([id]) =>
                  id.toLowerCase().includes('jenis') && id.toLowerCase().includes('kelamin'),
              );
              if (!dataDitemukan && jkEntry && (await fillJenisKelamin(jkEntry[1]))) count++;

              const tlEntry = pesertaEntries.find(
                ([id]) =>
                  id.toLowerCase().includes('tanggal') && id.toLowerCase().includes('lahir'),
              );
              if (!dataDitemukan && tlEntry && (await fillTanggalLahir(tlEntry[1]))) count++;

              const tpEntry = pesertaEntries.find(
                ([id]) =>
                  id.toLowerCase().includes('tanggal') && id.toLowerCase().includes('pemeriksaan'),
              );
              fillTanggalPemeriksaan(tpEntry ? tpEntry[1] : null);

              notify.info('Register Form', `Terisi: ${count}/${pesertaEntries.length} field`, 2000);

              const usia = tlEntry ? countAge(tlEntry[1]) : null;

              const noWaliDiv = document.querySelector('#noWali.check');
              if (noWaliDiv && usia !== null && usia >= 60) {
                noWaliDiv.click();
                await new Promise((r) => setTimeout(r, 300));
              }

              if (usia !== null && usia >= 1 && usia <= 5) {
                await new Promise((r) => setTimeout(r, 500));
                await fillDataWali(entries);
                await new Promise((r) => setTimeout(r, 300));
                fillNikWali(entries);
                await new Promise((r) => setTimeout(r, 200));
                const nikWaliInput = document.getElementById('nik wali');
                if (nikWaliInput && !nikWaliInput.value) {
                  fillNikWali(entries);
                }
              }

              if (registerFormAbort) {
                isRegisterFormRunning = false;
                return;
              }

              const submitted = await submitSection1();
              if (submitted === 'blocked') {
                await resetRegisterForm();
                isRegisterFormRunning = false;
                return;
              }
              if (!submitted) {
                notify.alert('Register Form', 'Gagal submit section 1', 3000);
                isRegisterFormRunning = false;
                return;
              }
              completed[1] = true;
              bus.emit('registerForm:sectionComplete', { section: 1 });
              stateEl.textContent = 'Mulai 2/4';
            }

            // ── Section 2 ──
            if (startSection <= 2 && !completed[2]) {
              if (registerFormAbort) {
                isRegisterFormRunning = false;
                return;
              }
              const section2Ok = await retry('Section 2', () => fillSection2(entries));
              if (!section2Ok) {
                notify.alert('Register Form', 'Gagal mengisi section 2', 3000);
                isRegisterFormRunning = false;
                return;
              }
              const submitted2 = await submitSection2();
              if (!submitted2) {
                notify.alert('Register Form', 'Gagal submit section 2', 3000);
                isRegisterFormRunning = false;
                return;
              }
              completed[2] = true;
              bus.emit('registerForm:sectionComplete', { section: 2 });
              stateEl.textContent = 'Mulai 3/4';
            }

            // ── Section 3 ──
            if (startSection <= 3 && !completed[3]) {
              if (registerFormAbort) {
                isRegisterFormRunning = false;
                return;
              }
              const submitted3 = await submitSection3();
              if (!submitted3) {
                notify.alert('Register Form', 'Gagal di section 3', 3000);
                isRegisterFormRunning = false;
                return;
              }
              completed[3] = true;
              bus.emit('registerForm:sectionComplete', { section: 3 });
              stateEl.textContent = 'Mulai 4/4';
            }

            // ── Section 4 ──
            if (registerFormAbort) {
              isRegisterFormRunning = false;
              return;
            }
            const nik = entries.find(([id]) => id.toLowerCase() === 'nik')?.[1];
            if (nik) {
              const pos = detectAttendancePosition();
              let ticket = null;
              if (pos === 'done') {
                ticket = await completeDoneAttendance();
              } else {
                const searchResult = await searchAttendance(nik, { skip: pos === 'hadir' });
                if (searchResult) {
                  ticket = await completeAttendance(searchResult.ticket, countdownDuration);
                }
              }
              if (ticket) {
                stateEl.textContent = `Selesai — ${ticket}`;
                bus.emit('registerForm:sectionComplete', { section: 4 });
                await resetRegisterForm(null);
                await notify.alert(
                  'Register Form',
                  h(
                    'span',
                    {},
                    'Berhasil menghadirkan ',
                    h('span', { style: 'user-select: all; -webkit-user-select: all;' }, ticket),
                  ),
                );
                actionPanel.remove();
              } else {
                notify.alert('Register Form', 'Gagal konfirmasi hadir', 3000);
              }
            } else {
              notify.info('Register Form', 'Pendaftaran selesai', 3000);
            }

            isRegisterFormRunning = false;
          },
        },
      ],
      { pinned: true },
    );

    const stateEl = document.createElement('div');
    stateEl.style.cssText = 'font-size:9px;opacity:0.5;margin-top:2px;';
    stateEl.textContent = 'Mulai 1/4';
    actionPanel.panel.appendChild(stateEl);
  });

  /**
   * @param {string} [message]
   * @returns {Promise<void>}
   */
  async function resetRegisterForm(message = 'NIK sudah pernah diperiksa, task dibatalkan') {
    await clearRegisterFormFlashData();
    const flashPanel = document.getElementById('dandelion-flash-data');
    if (flashPanel) flashPanel.remove();
    document.querySelector('[id^="dandelion-action-"]')?.remove();
    const closeBtn = document.querySelector(
      'button.absolute.right-4.top-3.cursor-pointer.p-1.btn-transparent',
    );
    if (closeBtn) closeBtn.click();
    if (message) notify.alert('Register Form', message);
  }

  controlPanel.mount(monkeyBtn, 1);
}

/**
 * @param {number} [timeout=8000]
 * @returns {Promise<boolean>}
 */
function handleDataDitemukanModal(timeout = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const modals = document.querySelectorAll('.rounded-lg.bg-white.p-4');
      for (const m of modals) {
        if (m.textContent.includes('Data Peserta ditemukan')) {
          const btns = m.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.textContent.trim() === 'Gunakan Data') {
              btn.click();
              return resolve(true);
            }
          }
        }
      }
      if (Date.now() - start > timeout) return resolve(false);
      setTimeout(poll, 200);
    };
    poll();
  });
}

/** @returns {boolean} */
function closeSuccessModalIfOpen() {
  const modals = document.querySelectorAll('.rounded-lg.bg-white.p-4');
  for (const m of modals) {
    if (m.textContent.includes('Berhasil Daftar') || m.textContent.includes('Berhasil Hadir')) {
      const btn = m.querySelector('button');
      if (btn && btn.textContent.trim() === 'Tutup') {
        btn.click();
      }
      return true;
    }
  }
  return false;
}

/** @returns {string} */
export function detectCurrentStep() {
  const greenBars = document.querySelectorAll(String.raw`.stepper .bg-\[\#16B3AC\]`);
  if (greenBars.length === 3) return 'section-3';
  if (greenBars.length === 2) return 'section-2';
  if (greenBars.length === 1) return 'section-1';
  const modal = document.querySelector(
    String.raw`.fixed.top-0.left-0.z-1000.w-full.h-full.flex.justify-center.items-center.backdrop-blur-5`,
  );
  if (modal && modal.textContent.includes('Formulir Pendaftaran')) {
    const hasSubmitBtn = Array.from(modal.querySelectorAll('button')).some((btn) =>
      ['Pilih', 'Daftarkan dengan NIK'].includes(btn.textContent.trim()),
    );
    if (hasSubmitBtn) return 'section-3';
  }
  if (detectAttendancePosition()) return 'section-4';
  return 'unknown';
}

/** @returns {boolean} */
export function isRegisterFormResumable() {
  return ['section-2', 'section-3', 'section-4'].includes(detectCurrentStep());
}

/**
 * @param {number} [timeout=7000]
 * @returns {Promise<boolean>}
 */
function waitForPanel2(timeout = 7000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const labels = document.querySelectorAll('div.font-semibold');
      const found = Array.from(labels).some((l) => l.textContent.includes('Status Pernikahan'));
      if (found) return resolve(true);
      if (Date.now() - start > timeout) return resolve(false);
      setTimeout(poll, 300);
    };
    poll();
  });
}

/**
 * @param {Array<[string, string]>} entries
 * @returns {Promise<boolean>}
 */
async function fillSection2(entries) {
  const ready = await waitForPanel2();
  if (!ready) return false;

  let count = 0;
  for (const [id, value] of entries) {
    const lower = id.toLowerCase();

    if (lower.includes('detail') && lower.includes('domisil')) {
      if (fillByCheckId('detail-domisili', value)) count++;
      continue;
    }

    if (lower.includes('status') && lower.includes('pernikahan')) {
      if (await fillStatusPernikahan(value)) count++;
      continue;
    }

    if (lower.includes('penyandang') && lower.includes('disabilitas')) {
      if (await fillPenyandangDisabilitas(value)) count++;
      continue;
    }

    if (lower === 'pekerjaan') {
      if (await fillPekerjaan(value)) count++;
      continue;
    }
  }

  const getVal = (key) => {
    const entry = entries.find(([id]) => id.toLowerCase() === key.toLowerCase());
    return entry ? entry[1] : null;
  };
  const prov = getVal('Provinsi');
  const kab = getVal('Kabupaten');
  const kec = getVal('Kecamatan');
  const kel = getVal('Kelurahan');
  let alamatOk = true;
  if (prov && kab && kec && kel) {
    alamatOk = await fillAlamatDomisili(prov, kab, kec, kel);
    if (alamatOk) count++;
  }

  notify.info('Section 2', `Terisi: ${count} field`, 2000);
  return alamatOk;
}

/** @returns {boolean} */
function isRegisterFormFlowOpen() {
  if (document.getElementById('dandelion-flash-data')) return true;
  if (document.querySelector('[id^="dandelion-action-"]')) return true;
  return Array.from(document.querySelectorAll('div')).some(
    (d) => d.textContent?.trim() === 'Cek NIK',
  );
}

/** @returns {Promise<boolean>} */
async function waitForModal() {
  while (true) {
    if (registerFormAbort) return false;
    const found = Array.from(document.querySelectorAll('div')).some(
      (d) => d.textContent?.trim() === 'Cek NIK',
    );
    if (found) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
}

/**
 * @param {string} birthdate - dd/mm/yyyy or dd-mm-yyyy
 * @returns {number|null}
 */
function countAge(birthdate) {
  if (!birthdate) return null;

  const [day, month, year] = birthdate.split('/').join('-').split('-');
  if (!day || !month || !year) return null;

  const lahir = new Date(year, month - 1, day);
  if (isNaN(lahir.getTime())) return null;

  const now = new Date();
  let usia = now.getFullYear() - lahir.getFullYear();
  const belumUlangTahun =
    now.getMonth() < lahir.getMonth() ||
    (now.getMonth() === lahir.getMonth() && now.getDate() < lahir.getDate());
  if (belumUlangTahun) usia--;

  return usia;
}
