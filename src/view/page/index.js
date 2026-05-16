import { getAgreement, getFullConfig, setConfig } from '../../configuration';
import { KeywordList } from '../components/KeywordList.js';
import { KeyValueList } from '../components/KeyValueList.js';
import { ProfileManager } from '../components/ProfileManager.js';
import {
  getTodaySummary,
  getYesterdaySummary,
  getRange,
  getMonthTotal,
  getOverallBreakdown,
  getFullHistory,
  MONTHLY_TARGET,
} from '../../utils/productivityTracker';

document.addEventListener('DOMContentLoaded', async () => {
  const agreed = await getAgreement();
  const overlay = document.getElementById('agreement-overlay');
  const configBody = document.getElementById('config-body');

  if (!agreed) {
    overlay.classList.remove('hidden');
    configBody.classList.add('blurred');
    return;
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

      if (!profileSettings.notChecked) profileSettings.notChecked = {};
      profileSettings.notChecked.url = notCheckedUrlInput.value;
      profileSettings.notChecked.notCheckedList = notCheckedListInput.value;
      profileSettings.notChecked.automationDelay =
        parseInt(notCheckedAutomationDelayInput.value) || 2000;
      profileSettings.notChecked.itemDelay = parseInt(notCheckedItemDelayInput.value) || 1000;
      profileSettings.notChecked.reloadDelay = parseInt(notCheckedReloadDelayInput.value) || 1000;

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
  function delta(current, prev) {
    if (prev === null || prev === undefined) return String(current);
    if (prev === 0 && current === 0) return '0';
    if (prev === 0) return `${current} (+${current})`;
    const d = current - prev;
    if (d === 0) return String(current);
    if (d > 0) return `${current} (+${d})`;
    return `${current} (${d})`;
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

    const monthTotal = await getMonthTotal();
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
        <div class="prod-row"><span class="label">📻 Radio</span><span class="value">${delta(today.counts.radio, prev?.radio ?? null)} / ${overall.counts.radio.toLocaleString()}</span></div>
        <div class="prod-row"><span class="label">📝 Teks</span><span class="value">${delta(today.counts.freetext, prev?.freetext ?? null)} / ${overall.counts.freetext.toLocaleString()}</span></div>
        <div class="prod-row"><span class="label">📋 Dropdown</span><span class="value">${delta(today.counts.dropdown, prev?.dropdown ?? null)} / ${overall.counts.dropdown.toLocaleString()}</span></div>
        <div class="prod-row"><span class="label">❌ Tidak Periksa</span><span class="value">${delta(today.counts.formNotChecked, prev?.formNotChecked ?? null)} / ${overall.counts.formNotChecked.toLocaleString()}</span></div>
        <div class="prod-row"><span class="label">🧘 Zen</span><span class="value">${delta(today.counts.formZen, prev?.formZen ?? null)} / ${overall.counts.formZen.toLocaleString()}</span></div>
        <div class="prod-total"><span>Total</span><span>${delta(today.dayTotal, yesterday?.dayTotal ?? null)} / ${overall.grandTotal.toLocaleString()}</span></div>
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
        <div class="prod-header">Progress Bulan Ini (target ${MONTHLY_TARGET.toLocaleString()} poin)</div>
        <div class="prod-bar-track"><div class="prod-bar-fill" style="width:${Math.min(100, Math.round((monthTotal / MONTHLY_TARGET) * 100))}%"></div></div>
        <div style="font-size:12px;color:#888;margin-top:4px">${monthTotal.toLocaleString()} / ${MONTHLY_TARGET.toLocaleString()} poin</div>
      </div>
    `;

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
