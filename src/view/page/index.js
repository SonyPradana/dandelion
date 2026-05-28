import browser from 'webextension-polyfill';
import { getAgreement, setAgreement, getFullConfig, setConfig } from '../../configuration';
import { showAgreementPopup } from '../../components/agreementPopup';
import { AGREEMENT_SECTIONS_HTML } from '../../agreement-text';
import { KeywordList } from '../components/KeywordList.js';
import { KeyValueList } from '../components/KeyValueList.js';
import { ProfileManager } from '../components/ProfileManager.js';
import {
  getTodaySummary,
  getYesterdaySummary,
  getRange,
  getMonthTotal,
  getWeekTotal,
  getOverallBreakdown,
  getFullHistory,
  MONTHLY_TARGET,
  TARGET_MODE,
} from '../../utils/productivityTracker';
import {
  init,
  getStatus,
  getDeviceId,
  getToken,
  saveToken,
  removeToken,
  getRemainingToday,
} from '../../quota/quota-manager.js';

let activePopup = null;

document.addEventListener('DOMContentLoaded', async () => {
  await init();

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.dandelion_terms) {
      const terms = changes.dandelion_terms.newValue;
      const version = browser.runtime.getManifest().version;
      if (!terms?.agreed || terms.version !== version) {
        if (!activePopup) {
          activePopup = showAgreementPopup();
          activePopup.promise.then(() => {
            activePopup = null;
          });
        }
      } else if (activePopup) {
        activePopup.remove();
        activePopup = null;
      }
    }
  });

  if (!(await getAgreement())) {
    activePopup = showAgreementPopup();
    await activePopup.promise;
    activePopup = null;
  }

  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      tabPanes.forEach((pane) => {
        pane.classList.toggle('active', pane.id === `tab-${tabId}`);
      });
    });
  });

  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
    if (targetBtn) targetBtn.click();
  }

  let loadedConfig = null;

  const radioButtonKeywordsList = new KeywordList(
    'form-skrining-radio-keywords-input',
    'form-skrining-radio-keywords-list',
    'form-skrining-radio-keywords-add-input',
    'form-skrining-radio-keywords-add',
  );

  const dropdownKeywordsList = new KeywordList(
    'form-skrining-dropdown-keywords-input',
    'form-skrining-dropdown-keywords-list',
    'form-skrining-dropdown-keywords-add-input',
    'form-skrining-dropdown-keywords-add',
  );

  const notCheckedList = new KeywordList(
    'not-checked-list-input',
    'not-checked-list-container',
    'not-checked-list-add-input',
    'not-checked-list-add',
  );

  window.keywordLists = { radioButtonKeywordsList, dropdownKeywordsList, notCheckedList };
  let pinnedValuesList = null;

  const formSkriningUrlInput = document.getElementById('form-skrining-url');
  const scrollToButtonCheckbox = document.getElementById('form-skrining-scroll-to-button');
  const radioButtonKeywordsInput = document.getElementById('form-skrining-radio-keywords-input');
  const dropdownKeywordsInput = document.getElementById('form-skrining-dropdown-keywords-input');
  const excludesInput = document.getElementById('form-skrining-excludes');
  const notCheckedUrlInput = document.getElementById('not-checked-url');
  const notCheckedListInput = document.getElementById('not-checked-list-input');
  const notCheckedAutomationDelayInput = document.getElementById('not-checked-automation-delay');
  const notCheckedItemDelayInput = document.getElementById('not-checked-item-delay');
  const notCheckedReloadDelayInput = document.getElementById('not-checked-reload-delay');
  const skriningUrlInput = document.getElementById('skrining-url');
  const zenModeEnabledCheckbox = document.getElementById('zen-mode-enabled');
  const zenModeTimeoutInput = document.getElementById('zen-mode-timeout');

  function updateFormForProfile(selectedProfile) {
    if (!loadedConfig) return;

    const profileSettings = loadedConfig.profiles[selectedProfile];

    const fs = profileSettings.formSkrining || {};
    formSkriningUrlInput.value = fs.url || '';
    scrollToButtonCheckbox.checked = fs.scrollToButton ?? true;
    radioButtonKeywordsInput.value = fs.radioButtonKeywords || '';
    dropdownKeywordsInput.value = fs.dropdownKeywords || '';
    excludesInput.value = fs.excludes || '';

    radioButtonKeywordsInput.dispatchEvent(new Event('input', { bubbles: true }));
    dropdownKeywordsInput.dispatchEvent(new Event('input', { bubbles: true }));

    if (pinnedValuesList) {
      pinnedValuesList.setData(fs.pinneds || {});
    }

    const nc = profileSettings.notChecked || {};
    notCheckedUrlInput.value = nc.url || '';
    notCheckedListInput.value = nc.notCheckedList || '';
    notCheckedAutomationDelayInput.value = nc.automationDelay || 2000;
    notCheckedItemDelayInput.value = nc.itemDelay || 1000;
    notCheckedReloadDelayInput.value = nc.reloadDelay || 1000;

    notCheckedListInput.dispatchEvent(new Event('input', { bubbles: true }));

    const sk = profileSettings.skrining || {};
    skriningUrlInput.value = sk.url || '';

    const zm = profileSettings.zenMode || {};
    zenModeEnabledCheckbox.checked = zm.enabled !== false;
    zenModeTimeoutInput.value = zm.timeout || 3500;
  }

  getFullConfig().then((config) => {
    loadedConfig = config;

    const activeProfileSettings = config.profiles[config.activeProfile];
    pinnedValuesList = new KeyValueList(
      'form-skrining-pinned-values',
      activeProfileSettings.formSkrining?.pinneds || {},
      (newPinneds) => {
        if (loadedConfig) {
          const selectedProfile = loadedConfig.activeProfile;
          if (!loadedConfig.profiles[selectedProfile].formSkrining) {
            loadedConfig.profiles[selectedProfile].formSkrining = {};
          }
          loadedConfig.profiles[selectedProfile].formSkrining.pinneds = newPinneds;
        }
      },
    );

    updateFormForProfile(config.activeProfile);

    void new ProfileManager('profile-manager-container', config.profiles, config.activeProfile, {
      onSwitch: (newActiveProfile) => {
        loadedConfig.activeProfile = newActiveProfile;
        updateFormForProfile(newActiveProfile);
        setConfig(loadedConfig);
      },
      onChange: () => {
        setConfig(loadedConfig);
      },
    });

    const panelPosition = config.panelPosition || 'top-right';
    const posBtns = document.querySelectorAll('.pos-option');
    const activePosBtn = document.querySelector(`.pos-option[data-pos="${panelPosition}"]`);
    if (activePosBtn) activePosBtn.classList.add('active');

    posBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        posBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  const saveConfigBtn = document.getElementById('save-config-btn');
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', () => {
      if (!loadedConfig) return;

      const selectedProfile = loadedConfig.activeProfile;
      const profileSettings = loadedConfig.profiles[selectedProfile];

      loadedConfig.activeProfile = selectedProfile;

      if (!profileSettings.formSkrining) profileSettings.formSkrining = {};
      profileSettings.formSkrining.url = formSkriningUrlInput.value;
      profileSettings.formSkrining.scrollToButton = scrollToButtonCheckbox.checked;
      profileSettings.formSkrining.radioButtonKeywords = radioButtonKeywordsInput.value;
      profileSettings.formSkrining.dropdownKeywords = dropdownKeywordsInput.value;
      profileSettings.formSkrining.excludes = excludesInput.value;

      if (pinnedValuesList) {
        profileSettings.formSkrining.pinneds = pinnedValuesList.getData();
      }

      if (!profileSettings.skrining) profileSettings.skrining = {};
      profileSettings.skrining.url = skriningUrlInput.value;

      if (!profileSettings.zenMode) profileSettings.zenMode = {};
      profileSettings.zenMode.enabled = zenModeEnabledCheckbox.checked;
      profileSettings.zenMode.timeout = Math.min(30_000, Math.max(500, parseInt(zenModeTimeoutInput.value) || 5000));

      if (!profileSettings.notChecked) profileSettings.notChecked = {};
      profileSettings.notChecked.url = notCheckedUrlInput.value;
      profileSettings.notChecked.notCheckedList = notCheckedListInput.value;
      profileSettings.notChecked.automationDelay =
        parseInt(notCheckedAutomationDelayInput.value) || 2000;
      profileSettings.notChecked.itemDelay = parseInt(notCheckedItemDelayInput.value) || 1000;
      profileSettings.notChecked.reloadDelay = parseInt(notCheckedReloadDelayInput.value) || 1000;

      const activePosBtn = document.querySelector('.pos-option.active');
      if (activePosBtn) {
        loadedConfig.panelPosition = activePosBtn.dataset.pos;
      }

      setConfig(loadedConfig);

      saveConfigBtn.textContent = 'Tersimpan!';
      setTimeout(() => {
        saveConfigBtn.textContent = 'Simpan';
      }, 1500);
    });
  }

  const exportLink = document.getElementById('export-link');
  const importLink = document.getElementById('import-link');
  const importFileInput = document.getElementById('import-file-input');

  // --- Produktifitas Tab Logic ---
  function rd(current, prev) {
    if (prev === null || prev === undefined) return `<span class="pv">${current}</span>`;
    if (prev === 0 && current === 0) return '<span class="pv zero">0</span>';
    if (prev === 0)
      return `<span class="pv">${current}</span> <span class="pd pos">(+${current})</span>`;
    const d = current - prev;
    if (d === 0) return `<span class="pv">${current}</span>`;
    if (d > 0) return `<span class="pv">${current}</span> <span class="pd pos">(+${d})</span>`;
    return `<span class="pv">${current}</span> <span class="pd neg">(${d})</span>`;
  }

  async function renderProduktifitas() {
    const container = document.getElementById('produktifitas-page-content');
    if (!container) return;

    const [today, yesterday, overall, history] = await Promise.all([
      getTodaySummary(),
      getYesterdaySummary(),
      getOverallBreakdown(),
      getFullHistory(),
    ]);

    const periodLabel = TARGET_MODE === 'weekly' ? 'Minggu' : 'Bulan';
    const periodTotal = TARGET_MODE === 'weekly' ? await getWeekTotal() : await getMonthTotal();
    const prev = yesterday ? yesterday.counts : null;

    const dataDays = Object.values(history).filter((d) => d.dayTotal > 0).length;
    let chartDays = 7;
    if (dataDays >= 30) chartDays = 30;
    else if (dataDays >= 14) chartDays = 14;

    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - (chartDays - 1));
    const y1 = from.getFullYear();
    const m1 = String(from.getMonth() + 1).padStart(2, '0');
    const d1 = String(from.getDate()).padStart(2, '0');
    const y2 = now.getFullYear();
    const m2 = String(now.getMonth() + 1).padStart(2, '0');
    const d2 = String(now.getDate()).padStart(2, '0');
    const rangeData = await getRange(`${y1}-${m1}-${d1}`, `${y2}-${m2}-${d2}`);

    const maxVal = Math.max(1, ...rangeData.map((d) => (d ? d.dayTotal : 0)));

    // --- Layout: Grid 2 kolom ---
    let html = '<div class="prod-grid"><div class="prod-col">';

    // Kolom kiri: Hari Ini
    html += '<div class="prod-col-header">Hari Ini</div>';
    if (today) {
      html += `
        <div class="prod-row"><span class="label">📻 Radio</span><span class="value">${rd(today.counts.radio, prev?.radio ?? null)}<span class="po">/ ${overall.counts.radio.toLocaleString()}</span></span></div>
        <div class="prod-row"><span class="label">📝 Teks</span><span class="value">${rd(today.counts.freetext, prev?.freetext ?? null)}<span class="po">/ ${overall.counts.freetext.toLocaleString()}</span></span></div>
        <div class="prod-row"><span class="label">📋 Dropdown</span><span class="value">${rd(today.counts.dropdown, prev?.dropdown ?? null)}<span class="po">/ ${overall.counts.dropdown.toLocaleString()}</span></span></div>
        <div class="prod-row"><span class="label">❌ Tidak Periksa</span><span class="value">${rd(today.counts.formNotChecked, prev?.formNotChecked ?? null)}<span class="po">/ ${overall.counts.formNotChecked.toLocaleString()}</span></span></div>
        <div class="prod-row"><span class="label">🧘 Zen</span><span class="value">${rd(today.counts.formZen, prev?.formZen ?? null)}<span class="po">/ ${overall.counts.formZen.toLocaleString()}</span></span></div>
        <div class="prod-total"><span>Total</span><span>${rd(today.dayTotal, yesterday?.dayTotal ?? null)}<span class="po">/ ${overall.grandTotal.toLocaleString()}</span></span></div>
      `;
    } else {
      html += '<div class="prod-row" style="color:#999">Belum ada data hari ini.</div>';
    }

    html += '</div><div class="prod-col">';

    // Kolom kanan: Progress + Ringkasan
    html += '<div class="prod-col-header">Ringkasan</div>';
    html += `
      <div class="prod-row"><span class="label">🏆 Grand Total</span><span class="value">${overall.grandTotal.toLocaleString()}</span></div>
      <div class="prod-row"><span class="label">📆 Hari Aktif</span><span class="value">${overall.activeDays}</span></div>
      <div class="prod-row"><span class="label">⚡ Rata-rata/hari</span><span class="value">${overall.average}</span></div>
      <div style="margin-top:12px">
        <div class="prod-header">Progress ${periodLabel} Ini (target ${MONTHLY_TARGET.toLocaleString()} poin)</div>
        <div class="prod-bar-track"><div class="prod-bar-fill" style="width:${Math.min(100, Math.round((periodTotal / MONTHLY_TARGET) * 100))}%"></div></div>
        <div style="font-size:12px;color:#888;margin-top:4px">${periodTotal.toLocaleString()} / ${MONTHLY_TARGET.toLocaleString()} poin</div>
      </div>
    `;

    const licStatus = getStatus();
    if (!licStatus.isFreePlan && licStatus.payload) {
      const p = licStatus.payload;
      const totalLimit = p.total_limit || 0;
      const from = new Date(p.iat * 1000);
      const to = new Date();
      const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
      const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
      const rangeData = await getRange(fromStr, toStr);
      const usedInLicense = rangeData.reduce((sum, d) => sum + (d ? d.dayTotal : 0), 0);
      const totalPct = Math.min(100, Math.round((usedInLicense / totalLimit) * 100));
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];
      const fmtDate = (ts) => {
        const d = new Date(ts * 1000);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      };
      html += `
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb">
          <div class="prod-header" style="color:#065f46">🏅 Total Limit (Pro Tier)</div>
          <div class="prod-bar-track"><div class="prod-bar-fill" style="width:${totalPct}%"></div></div>
          <div style="font-size:12px;color:#888;margin-top:4px">${usedInLicense.toLocaleString()} / ${totalLimit.toLocaleString()} poin (sejak lisensi)</div>
          <div style="font-size:12px;color:#888;margin-top:8px">Periode Token: ${fmtDate(p.iat)} - ${fmtDate(p.exp)}</div>
        </div>
      `;
    } else {
      html += `
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb">
          <div class="prod-header" style="color:#92400e">🆓 Free Tier</div>
          <div style="font-size:12px;color:#888">50 poin/hari · tanpa total limit</div>
        </div>
      `;
    }

    html += '</div></div>';

    html += `
      <div class="prod-chart-section">
        <h3>Grafik Produktivitas ${chartDays}H Terakhir</h3>
        <div class="prod-chart">
    `;

    for (const day of rangeData) {
      const pct = day ? Math.round((day.dayTotal / maxVal) * 100) : 0;
      const label = day ? day.date.slice(5) : '';
      html += `
        <div class="prod-chart-bar-wrapper">
          <div class="prod-chart-bar" style="height:${Math.max(pct, 2)}%"></div>
          <div class="prod-chart-label">${label}</div>
        </div>
      `;
    }

    html += '</div></div>';

    container.innerHTML = html;
  }

  const produktifitasTab = document.querySelector('.tab-btn[data-tab="produktifitas"]');
  if (produktifitasTab) {
    produktifitasTab.addEventListener('click', () => {
      setTimeout(renderProduktifitas, 50);
    });
  }

  if (document.getElementById('tab-produktifitas')?.classList.contains('active')) {
    renderProduktifitas();
  }

  document.getElementById('refresh-prod')?.addEventListener('click', renderProduktifitas);

  // --- License Tab Logic ---
  async function renderLicense() {
    const container = document.getElementById('license-page-content');
    if (!container) return;

    const status = getStatus();
    const remaining = await getRemainingToday();
    const jwt = await getToken();

    const isFree = status.isFreePlan;
    const badge = isFree
      ? '<span class="license-badge free">FREE</span>'
      : '<span class="license-badge pro">PRO</span>';
    const statusText = isFree ? 'Free Tier (50 poin/hari)' : 'Pro Tier';
    const statusClass = isFree ? 'free' : 'pro';

    let infoHtml = '';
    if (!isFree && status.payload) {
      const p = status.payload;
      const expDate = p.exp ? new Date(p.exp * 1000).toLocaleDateString('id-ID') : '-';
      const featList =
        Array.isArray(p.features) && p.features.length > 0 ? p.features.join(', ') : '-';
      const verList =
        Array.isArray(p.version_allowed) && p.version_allowed.length > 0
          ? p.version_allowed.join(', ')
          : '-';
      infoHtml = `
        <div class="license-info-grid">
          <div class="license-info-item"><div class="label">Total Limit</div><div class="value">${(p.total_limit ?? 0).toLocaleString()}</div></div>
          <div class="license-info-item"><div class="label">Grace Daily</div><div class="value">${(p.daily_limit ?? 100).toLocaleString()}</div></div>
          <div class="license-info-item"><div class="label">Berlaku Sampai</div><div class="value">${expDate}</div></div>
          <div class="license-info-item"><div class="label">Sisa Hari Ini</div><div class="value">${remaining.toLocaleString()}</div></div>
          <div class="license-info-item" style="grid-column:1/-1"><div class="label">Fitur</div><div class="value">${featList}</div></div>
          <div class="license-info-item" style="grid-column:1/-1"><div class="label">Versi Diizinkan</div><div class="value">${verList}</div></div>
        </div>
      `;
    }

    const deviceId = getDeviceId();

    container.innerHTML = `
      <div class="license-status ${statusClass}">${badge} ${statusText}</div>
      <div class="device-id-section">
        <div class="device-id-label">Device ID</div>
        <div class="device-id-row">
          <span class="device-id-value">${deviceId || '-'}</span>
          <button class="device-id-copy" id="device-id-copy-btn">Salin</button>
        </div>
        <div class="device-id-hint">Gunakan ID ini untuk mendapatkan token</div>
      </div>
      ${infoHtml}
      <div class="pane-title">Aktifkan Token</div>
      <textarea class="license-jwt-input" id="quota-jwt-input" placeholder="Tempel token (JWT) di sini...">${jwt || ''}</textarea>
      <div class="license-actions">
        <button class="license-btn activate" id="quota-activate-btn">Aktifkan</button>
        <button class="license-btn remove" id="quota-remove-btn" ${isFree ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>Hapus Token</button>
      </div>
      <div class="license-message" id="quota-message"></div>
    `;

    document.getElementById('device-id-copy-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('device-id-copy-btn');
      try {
        await navigator.clipboard.writeText(deviceId || '');
        btn.textContent = 'Tersalin!';
        setTimeout(() => {
          btn.textContent = 'Salin';
        }, 1500);
      } catch {
        btn.textContent = 'Gagal';
        setTimeout(() => {
          btn.textContent = 'Salin';
        }, 1500);
      }
    });

    document.getElementById('quota-activate-btn')?.addEventListener('click', async () => {
      const input = document.getElementById('quota-jwt-input');
      const msg = document.getElementById('quota-message');
      if (!input || !msg) return;
      const val = input.value.trim().split('\n')[0].trim();
      if (!val) {
        msg.className = 'license-message error';
        msg.textContent = 'Masukkan token terlebih dahulu.';
        return;
      }
      try {
        await saveToken(val);
        msg.className = 'license-message success';
        msg.textContent = 'Token berhasil diaktifkan!';
        setTimeout(renderLicense, 1000);
      } catch (error) {
        msg.className = 'license-message error';
        msg.textContent = `Gagal: ${error.message}`;
      }
    });

    document.getElementById('quota-remove-btn')?.addEventListener('click', async () => {
      const msg = document.getElementById('quota-message');
      await removeToken();
      msg.className = 'license-message success';
      msg.textContent = 'Token dihapus, kembali ke Free Tier.';
      setTimeout(renderLicense, 1000);
    });
  }

  const quotaTab = document.querySelector('.tab-btn[data-tab="quota"]');
  if (quotaTab) {
    quotaTab.addEventListener('click', () => {
      setTimeout(renderLicense, 50);
    });
  }

  if (document.getElementById('tab-quota')?.classList.contains('active')) {
    renderLicense();
  }

  const persetujuanContent = document.getElementById('persetujuan-content');
  if (persetujuanContent) {
    persetujuanContent.innerHTML = `
      <div class="overview">
        ${AGREEMENT_SECTIONS_HTML}
      </div>
    `;
  }

  exportLink.addEventListener('click', (event) => {
    event.preventDefault();
    getFullConfig().then((config) => {
      const configStr = JSON.stringify(config, null, 2);
      const blob = new Blob([configStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dandelion-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  importLink.addEventListener('click', (event) => {
    event.preventDefault();
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);

        if (!importedConfig.profiles || !importedConfig.activeProfile) {
          throw new Error('Invalid config file format.');
        }

        setConfig(importedConfig);
        loadedConfig = await getFullConfig();
        updateFormForProfile(loadedConfig.activeProfile);
      } catch (error) {
      } finally {
        importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  });
});
