import { controlPanel } from '../components/controlPanel.js';
import { notify } from '../components/notification';
import { button } from '../components/button.js';
import { h } from '../utils/dom.js';
import { showFlashDataPanel } from '../components/flashPanel.js';
import {
  setRegisterFormFlashData,
  getRegisterFormFlashData,
  clearRegisterFormFlashData,
  clearRegisterFormStep,
} from '../utils/registerFormFlashSession.js';
import { validateRegisterFormFields } from '../utils/registerFormValidator.js';
import { getFlashData, setFlashData, clearFlashData } from '../utils/flashSession.js';
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
import {
  submitSection3,
  findRegistrationSuccessModal,
  parseTicket,
} from './register-form/submit-section-3.js';
import { fillDataWali } from './register-form/fill-data-wali.js';
import { fillNikWali } from './register-form/fill-nik-wali.js';
import { initializeSkriningPage } from './initialize-skrining-page.js';

const SKRINING_SOURCE = 'register-form';

let isRegisterFormRunning = false;
let registerFormAbort = false;
let cancelActiveRun = null;

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
      const close = await notify.confirm(
        'Register Form',
        'Task sedang berjalan. Tutup dan bersihkan state?',
      );
      if (!close) return;
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
      if (!opened) {
        if (registerFormAbort) {
          registerFormAbort = false;
          return;
        }
        notify.alert('Register Form', 'Modal pendaftaran tidak muncul');
        document.getElementById('dandelion-flash-data')?.remove();
        return;
      }
    }

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

    const stateEl = document.createElement('div');
    stateEl.style.cssText = 'font-size:9px;opacity:0.5;margin-top:2px;';
    stateEl.textContent = 'Mulai 1/3';

    async function runRegisterForm() {
      if (isRegisterFormRunning) return;
      isRegisterFormRunning = true;

      let finished = false;
      let finishing = null;
      let recapPanel = null;
      let recapResolve = null;
      let countdown = null;
      let watcher = null;
      let clickHandler = null;
      let handingOff = false;

      /** @param {string} [label] */
      function stopRun(label) {
        if (finished) return;
        finished = true;
        isRegisterFormRunning = false;
        if (label) stateEl.textContent = label;
      }

      /**
       * @param {'done'|'closed'|'skrining'|'cancelled'|'aborted'|'error'} reason
       * @param {{ closeModal?: boolean }} [options]
       * @returns {Promise<void>}
       */
      function finish(reason = 'done', { closeModal = false } = {}) {
        if (finished) return finishing ?? Promise.resolve();
        finished = true;
        isRegisterFormRunning = false;

        finishing = (async () => {
          if (watcher) clearInterval(watcher);
          watcher = null;
          if (clickHandler) document.removeEventListener('click', clickHandler, true);
          clickHandler = null;
          if (countdown) {
            countdown.dismiss();
            countdown = null;
          }

          document.getElementById('dandelion-flash-data')?.remove();
          actionPanel?.remove();
          recapPanel?.remove();
          recapPanel = null;
          if (closeModal) closeSuccessModalIfOpen();
          recapResolve?.();
          recapResolve = null;

          try {
            await clearRegisterFormFlashData();
            await clearRegisterFormStep();
            if (reason !== 'skrining') {
              const flash = await getFlashData();
              if (flash?._source === SKRINING_SOURCE) await clearFlashData();
            }
          } catch (error) {
            console.error('[Dandelion] Register Form cleanup failed:', error);
          }
        })();

        return finishing;
      }

      /**
       * Resolve when the SPA route changes or the target DOM appears.
       * The handoff only mounts a global initial panel; form readiness is
       * intentionally not required because automation is not started here.
       *
       * @returns {Promise<boolean>}
       */
      async function waitForPageChange(previousUrl, timeout = 10_000) {
        return new Promise((resolve) => {
          const start = Date.now();
          const poll = () => {
            if (window.location.href !== previousUrl) return resolve(true);
            if (
              document.getElementById('dandelion-auto-fill') ||
              document.getElementById('dandelion-zen-mode-toggle') ||
              document.querySelector('[data-name], [id^="rowfrm"], [id^="row-FRM"]')
            ) {
              return resolve(true);
            }
            if (Date.now() - start > timeout) return resolve(false);
            setTimeout(poll, 250);
          };
          poll();
        });
      }

      /** @returns {HTMLButtonElement|Element|null} */
      function findSiteSkriningButton() {
        const modal = findRegistrationSuccessModal();
        if (!modal) return null;
        return (
          Array.from(modal.querySelectorAll('button, a')).find((el) =>
            /isi skrining/i.test(el.textContent || ''),
          ) || null
        );
      }

      /**
       * @param {{ handoff: Object, ticket: string|null }} params
       * @returns {Promise<void>}
       */
      async function startHandoff({ handoff, ticket }) {
        if (handingOff || finished) return;
        handingOff = true;
        recapPanel?.remove();
        recapPanel = null;

        try {
          const cd = notify.countdown(
            'Skrining Mandiri',
            ticket
              ? `No. Tiket: ${ticket} — lanjut ke formulir skrining?`
              : 'Lanjut ke formulir skrining?',
            countdownDuration,
            { keepOpenOnTimeout: true },
          );
          countdown = cd;
          const ok = await cd.promise;
          countdown = null;
          if (!ok) {
            await finish('cancelled', { closeModal: true });
            return;
          }
          cd.close();

          if (finished) return;

          if (!findRegistrationSuccessModal()) {
            await finish('closed');
            return;
          }

          const siteBtn = findSiteSkriningButton();
          if (!siteBtn) {
            notify.alert('Register Form', 'Tombol skrining tidak ditemukan');
            await finish('closed', { closeModal: true });
            return;
          }

          const previousUrl = window.location.href;
          await finish('skrining');
          siteBtn.click();

          const navigated = await waitForPageChange(previousUrl);
          if (!navigated) {
            await clearFlashData();
            notify.info('Register Form', 'Halaman skrining tidak terdeteksi', 3000);
            return;
          }

          const page = await initializeSkriningPage(handoff, { autoAssist: false });
          if (!page) {
            await clearFlashData();
            notify.info('Register Form', 'Halaman skrining belum dikenali', 3000);
          }
        } catch (error) {
          console.error('[Dandelion] Skrining handoff failed:', error);
          await clearFlashData();
          notify.info('Register Form', 'Gagal membuka halaman skrining', 3000);
          await finish('error', { closeModal: true });
        }
      }

      /**
       * @param {string|null} ticket
       * @param {Record<string, any>|null} flashData
       * @returns {Promise<void>}
       */
      async function showRecap(ticket, flashData) {
        const mandiri = isSkriningMandiri(flashData);
        await clearRegisterFormFlashData();
        await clearRegisterFormStep();
        document.getElementById('dandelion-flash-data')?.remove();

        if (mandiri) {
          const handoff = {
            pinneds: { ...(flashData?.pinneds || {}) },
            'skrining mandiri': true,
            _source: SKRINING_SOURCE,
          };
          await setFlashData(handoff);
          const pending = new Promise((resolve) => {
            recapResolve = resolve;
          });
          void startHandoff({ handoff, ticket });
          await pending;
          return;
        }

        const recap = notify.action(
          'Register Form',
          h(
            'div',
            { style: 'display:grid;gap:3px;' },
            h('div', null, 'Berhasil Daftar'),
            h(
              'div',
              { style: 'opacity:0.8;' },
              'No. Tiket: ',
              h(
                'span',
                { style: 'user-select:all;-webkit-user-select:all;color:#4ade80;' },
                ticket || 'Tidak terbaca',
              ),
            ),
          ),
          [
            {
              label: 'Isi Skrining',
              type: 'success',
              autoClose: false,
              onClick: () => {
                void finish('closed');
              },
            },
            {
              label: 'Tutup',
              autoClose: false,
              onClick: () => {
                void finish('closed', { closeModal: true });
              },
            },
          ],
          { pinned: true },
        );
        recapPanel = recap;

        recap.panel
          .querySelector('.dandelion-panel-close')
          ?.addEventListener('click', () => void finish('closed', { closeModal: true }));

        clickHandler = (event) => {
          if (finished) return;
          const target = event.target instanceof Element ? event.target.closest('button, a') : null;
          if (!target || !findRegistrationSuccessModal()?.contains(target)) return;

          const label = target.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
          if (label.includes('isi skrining')) {
            void finish('closed');
          } else if (label === 'tutup') {
            void finish('closed');
          }
        };
        document.addEventListener('click', clickHandler, true);

        let missingTicks = 0;
        watcher = setInterval(() => {
          if (finished) return;
          if (!isRecapPanelMounted(recapPanel)) {
            clearInterval(watcher);
            watcher = null;
            void finish('closed');
            return;
          }
          if (findRegistrationSuccessModal()) {
            missingTicks = 0;
            return;
          }
          missingTicks++;
          if (missingTicks >= 2) {
            clearInterval(watcher);
            watcher = null;
            void finish('closed');
          }
        }, 300);

        await new Promise((resolve) => {
          recapResolve = resolve;
        });
      }

      cancelActiveRun = finish;

      try {
        const step = detectCurrentStep();
        let flashData = await getRegisterFormFlashData();

        if (step === 'confirmation') {
          const modal = findRegistrationSuccessModal();
          if (modal) {
            if (!flashData?.pinneds || Object.keys(flashData.pinneds).length === 0) {
              const pending = await getFlashData();
              if (pending?._source === SKRINING_SOURCE) flashData = pending;
            }
            await showRecap(parseTicket(modal), flashData);
            return;
          }
        }

        if (!flashData?.pinneds || Object.keys(flashData.pinneds).length === 0) {
          notify.info('Register Form', 'Isi flash data panel dulu', 2000);
          stopRun();
          return;
        }

        const entries = Object.entries(flashData.pinneds);
        const startSection = step === 'section-2' ? 2 : 1;
        stateEl.textContent = `Mulai ${startSection}/3`;

        if (startSection <= 1) {
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
            ([id]) => id.toLowerCase().includes('jenis') && id.toLowerCase().includes('kelamin'),
          );
          if (!dataDitemukan && jkEntry && (await fillJenisKelamin(jkEntry[1]))) count++;

          const tlEntry = pesertaEntries.find(
            ([id]) => id.toLowerCase().includes('tanggal') && id.toLowerCase().includes('lahir'),
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
            await finish('aborted', { closeModal: true });
            return;
          }

          const submitted = await submitSection1();
          if (finished) return;
          if (submitted === 'blocked') {
            notify.alert('Register Form', 'Pendaftaran tidak dapat dilanjutkan');
            await finish('closed', { closeModal: true });
            return;
          }
          if (!submitted) {
            notify.alert('Register Form', 'Gagal submit section 1');
            stopRun('Gagal — coba lagi');
            return;
          }
          bus.emit('registerForm:sectionComplete', { phase: 'section-1', section: 1 });
          stateEl.textContent = 'Mulai 2/3';
        }

        if (registerFormAbort) {
          await finish('aborted', { closeModal: true });
          return;
        }

        if (startSection <= 2) {
          const section2Ok = await retry('Section 2', () => fillSection2(entries));
          if (!section2Ok) {
            notify.alert('Register Form', 'Gagal mengisi section 2');
            stopRun('Gagal — coba lagi');
            return;
          }
          if (finished) return;
          const submitted2 = await submitSection2();
          if (finished) return;
          if (!submitted2) {
            notify.alert('Register Form', 'Gagal submit section 2');
            stopRun('Gagal — coba lagi');
            return;
          }
          bus.emit('registerForm:sectionComplete', { phase: 'section-2', section: 2 });
          stateEl.textContent = 'Mulai 3/3';
        }

        if (registerFormAbort) {
          await finish('aborted', { closeModal: true });
          return;
        }

        const result = await submitSection3();
        if (finished) return;
        if (result.status === 'missing') {
          notify.alert('Register Form', 'Modal Berhasil Daftar tidak muncul');
          stopRun('Gagal — coba lagi');
          return;
        }

        bus.emit('registerForm:sectionComplete', { phase: 'confirmation', section: 3 });

        if (result.status === 'closed') {
          notify.info('Register Form', 'Pendaftaran selesai', 3000);
          await finish('closed', { closeModal: true });
          return;
        }

        await showRecap(result.ticket, flashData);
      } catch (error) {
        console.error('[Dandelion] Register Form failed:', error);
        notify.alert('Register Form', 'Terjadi kesalahan saat menjalankan alur');
        await finish('error');
      } finally {
        if (!finished) stopRun();
        if (cancelActiveRun === finish) cancelActiveRun = null;
        registerFormAbort = false;
      }
    }

    const actionPanel = notify.action(
      'Register Form',
      'Isi data dengan lengkap dan sesuai',
      [
        {
          label: 'Mulai',
          type: 'success',
          autoClose: false,
          onClick: runRegisterForm,
        },
      ],
      { pinned: true },
    );
    actionPanel.panel.appendChild(stateEl);
  });

  /**
   * @param {string|null} [message]
   * @returns {Promise<void>}
   */
  async function resetRegisterForm(message = 'NIK sudah pernah diperiksa, task dibatalkan') {
    if (cancelActiveRun) {
      await cancelActiveRun('aborted', { closeModal: true });
    } else {
      isRegisterFormRunning = false;
      await clearRegisterFormFlashData();
      await clearRegisterFormStep();
      const flashPanel = document.getElementById('dandelion-flash-data');
      if (flashPanel) flashPanel.remove();
      document.querySelector('[id^="dandelion-action-"]')?.remove();
      const flash = await getFlashData();
      if (flash?._source === SKRINING_SOURCE) await clearFlashData();
      closeSuccessModalIfOpen();
    }
    if (message) notify.alert('Register Form', message);
  }

  controlPanel.mount(monkeyBtn, 1);
}

/**
 * `notify.action()` returns a `{ panel, remove }` handle, not an element.
 *
 * @param {{ panel?: Element }|null} recapPanel
 * @returns {boolean}
 */
export function isRecapPanelMounted(recapPanel) {
  return recapPanel?.panel?.isConnected === true;
}

/**
 * @param {Record<string, any>|null} [flashData]
 * @returns {boolean}
 */
export function isSkriningMandiri(flashData) {
  const raw = flashData?.['skrining mandiri'] ?? flashData?.pinneds?.['skrining mandiri'];
  return raw === true || raw === 'true';
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
  const modal = findRegistrationSuccessModal();
  if (!modal) return false;
  const btn = Array.from(modal.querySelectorAll('button')).find(
    (candidate) => candidate.textContent.trim() === 'Tutup',
  );
  if (btn) btn.click();
  return true;
}

/** @returns {string} */
export function detectCurrentStep() {
  if (findRegistrationSuccessModal()) return 'confirmation';

  const greenBars = document.querySelectorAll(String.raw`.stepper .bg-\[\#16B3AC\]`);
  if (greenBars.length === 2) return 'section-2';
  if (greenBars.length === 1) return 'section-1';
  return 'unknown';
}

/** @returns {boolean} */
export function isRegisterFormResumable() {
  return ['section-2', 'confirmation'].includes(detectCurrentStep());
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
  if (findRegistrationSuccessModal()) return true;
  if (document.getElementById('dandelion-flash-data')) return true;
  if (document.querySelector('[id^="dandelion-action-"]')) return true;
  return Array.from(document.querySelectorAll('div')).some(
    (d) => d.textContent?.trim() === 'Cek NIK',
  );
}

/**
 * @param {number} [timeout=15_000]
 * @returns {Promise<boolean>}
 */
function waitForModal(timeout = 15_000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      if (registerFormAbort) return resolve(false);
      const found = Array.from(document.querySelectorAll('div')).some(
        (d) => d.textContent?.trim() === 'Cek NIK',
      );
      if (found) return resolve(true);
      if (Date.now() - start > timeout) return resolve(false);
      setTimeout(poll, 500);
    };
    poll();
  });
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
