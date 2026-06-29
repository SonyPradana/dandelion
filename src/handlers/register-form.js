import { controlPanel } from '../components/controlPanel.js';
import { notify } from '../components/notification';
import { button } from '../components/button.js';
import { showFlashDataPanel } from '../components/flashPanel.js';
import {
  setRegisterFormFlashData,
  getRegisterFormFlashData,
  clearRegisterFormFlashData,
} from '../utils/registerFormFlashSession.js';
import { validateRegisterFormFields } from '../utils/registerFormValidator.js';
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
import { confirmAttendance } from './register-form/confirm-attendance.js';
import { incrementBatch } from '../utils/productivityTracker.js';

export async function initializeRegisterForm() {
  const monkeyBtn = button('dandelion-register-form-btn');
  if (!monkeyBtn) return;

  monkeyBtn.addEventListener('click', async () => {
    closeSuccessModalIfOpen();

    const target = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.trim().includes('Daftar Baru'),
    );
    if (target) target.click();

    showFlashDataPanel({
      setData: setRegisterFormFlashData,
      clearData: clearRegisterFormFlashData,
      onSave: () => notify.info('Register Form', 'Flash data tersimpan', 1500),
      validate: validateRegisterFormFields,
    });

    waitForModal().then(() => {
      let isRunning = false;
      const actionPanel = notify.action(
        'Register Form',
        'Isi data dengan lengkap dan sesuai',
        [
          {
            label: 'Mulai',
            type: 'success',
            autoClose: false,
            onClick: async () => {
              if (isRunning) return;
              isRunning = true;

              const flashData = await getRegisterFormFlashData();
              if (!flashData?.pinneds || Object.keys(flashData.pinneds).length === 0) {
                notify.info('Register Form', 'Isi flash data panel dulu', 2000);
                isRunning = false;
                return;
              }

              const entries = Object.entries(flashData.pinneds);
              const step = detectCurrentStep();

              if (step === 'section-2') {
                const section2Ok = await fillSection2(entries);
                if (section2Ok) {
                  const submitted2 = await submitSection2();
                  if (submitted2) {
                    const submitted3 = await submitSection3();
                    if (submitted3) {
                      const nik = entries.find(([id]) => id.toLowerCase() === 'nik')?.[1];
                      if (nik) {
                        const ticket = await confirmAttendance(nik);
                        if (ticket) {
                          await incrementBatch({ registerForm: 1 });
                          await resetRegisterForm(null);
                          notify.info('Register Form', `${ticket} — Berhasil Hadir`, 5000);
                          actionPanel.remove();
                        } else {
                          notify.alert('Register Form', 'Gagal konfirmasi hadir', 3000);
                        }
                      } else {
                        notify.info('Register Form', 'Pendaftaran selesai', 3000);
                      }
                    } else {
                      notify.alert('Register Form', 'Gagal di section 3', 3000);
                    }
                  } else {
                    notify.alert('Register Form', 'Gagal submit section 2', 3000);
                  }
                }
                isRunning = false;
                return;
              }

              const nikEntry = entries.find(([id]) => id.toLowerCase() === 'nik');
              const otherEntries = entries.filter(([id]) => id.toLowerCase() !== 'nik');
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
                for (const [id, value] of entries) {
                  if (fillByCheckId(id, value)) count++;
                }
              }

              const jkEntry = entries.find(
                ([id]) =>
                  id.toLowerCase().includes('jenis') && id.toLowerCase().includes('kelamin'),
              );
              if (!dataDitemukan && jkEntry && (await fillJenisKelamin(jkEntry[1]))) count++;

              const tlEntry = entries.find(
                ([id]) =>
                  id.toLowerCase().includes('tanggal') && id.toLowerCase().includes('lahir'),
              );
              if (!dataDitemukan && tlEntry && (await fillTanggalLahir(tlEntry[1]))) count++;

              const tpEntry = entries.find(
                ([id]) =>
                  id.toLowerCase().includes('tanggal') && id.toLowerCase().includes('pemeriksaan'),
              );
              fillTanggalPemeriksaan(tpEntry ? tpEntry[1] : null);

              notify.info('Register Form', `Terisi: ${count}/${entries.length} field`, 2000);

              const noWaliDiv = document.querySelector('#noWali.check');
              if (noWaliDiv) {
                noWaliDiv.click();
                await new Promise((r) => setTimeout(r, 300));
              }

              const submitted = await submitSection1();
              if (submitted === 'blocked') {
                await resetRegisterForm();
              } else if (submitted) {
                notify.info('Register Form', 'Lanjut ke step 2', 2000);
                const section2Ok = await fillSection2(entries);
                if (section2Ok) {
                  const submitted2 = await submitSection2();
                  if (submitted2) {
                    const submitted3 = await submitSection3();
                    if (submitted3) {
                      const nik = entries.find(([id]) => id.toLowerCase() === 'nik')?.[1];
                      if (nik) {
                        const ticket = await confirmAttendance(nik);
                        if (ticket) {
                          await incrementBatch({ registerForm: 1 });
                          await resetRegisterForm(null);
                          notify.info('Register Form', `${ticket} — Berhasil Hadir`, 5000);
                          actionPanel.remove();
                        } else {
                          notify.alert('Register Form', 'Gagal konfirmasi hadir', 3000);
                        }
                      } else {
                        notify.info('Register Form', 'Pendaftaran selesai', 3000);
                      }
                    } else {
                      notify.alert('Register Form', 'Gagal di section 3', 3000);
                    }
                  } else {
                    notify.alert('Register Form', 'Gagal submit section 2', 3000);
                  }
                }
              } else {
                notify.alert('Register Form', 'Gagal submit section 1', 3000);
              }

              isRunning = false;
            },
          },
        ],
        { pinned: true },
      );
    });
  });

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

function detectCurrentStep() {
  const greenBars = document.querySelectorAll(String.raw`.stepper .bg-\[\#16B3AC\]`);
  if (greenBars.length === 2) return 'section-2';
  if (greenBars.length === 1) return 'section-1';
  return 'unknown';
}

function waitForPanel2(timeout = 7000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const poll = () => {
      const labels = document.querySelectorAll('div.mb-1.font-semibold');
      const found = Array.from(labels).some((l) => l.textContent.includes('Status Pernikahan'));
      if (found) return resolve(true);
      if (Date.now() - start > timeout) return resolve(false);
      setTimeout(poll, 300);
    };
    poll();
  });
}

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
  if (prov && kab && kec && kel) {
    if (await fillAlamatDomisili(prov, kab, kec, kel)) count++;
  }

  notify.info('Section 2', `Terisi: ${count} field`, 2000);
  return true;
}

async function waitForModal() {
  while (true) {
    const found = Array.from(document.querySelectorAll('div')).some(
      (d) => d.textContent?.trim() === 'Cek NIK',
    );
    if (found) return;
    await new Promise((r) => setTimeout(r, 500));
  }
}
