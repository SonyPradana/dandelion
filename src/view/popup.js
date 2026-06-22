import browser from '@bridge/browser';
import { store } from '../store.js';
import { AGREEMENT_SECTIONS_HTML } from '../agreement-text';
import { h, fragment } from '../utils/dom';
import { KeywordList } from './components/KeywordList.js';
import { KeyValueList } from './components/KeyValueList.js';
import { ProfileManager } from './components/ProfileManager.js';
import {
  getTodaySummary,
  getYesterdaySummary,
  getMonthTotal,
  getWeekTotal,
  getRange,
  getOverallBreakdown,
  MONTHLY_TARGET,
  TARGET_MODE,
} from '../utils/productivityTracker';
import { init, getStatus } from '../quota/quota-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
  const agreement = document.getElementById('agreement');
  if (agreement) {
    agreement.append(
      h('div', { className: 'header' },
        h('h1', null, 'SYARAT DAN KETENTUAN PENGGUNAAN'),
      ),
      h('div', { className: 'content' },
        fragment(AGREEMENT_SECTIONS_HTML),
        h('div', { className: 'checkbox-group' },
          h('h3', { style: 'margin-bottom: 16px; font-size: 15px; color: #333' }, 'KONFIRMASI'),
          h('div', { className: 'checkbox-item' },
            h('input', { type: 'checkbox', id: 'agree-checkbox' }),
            h('label', { for: 'agree-checkbox' }, 'Saya telah membaca dan menyetujui syarat dan ketentuan.'),
          ),
        ),
      ),
    );
  }

  store.init(browser);
  await init();
  const agreeCheckbox = document.getElementById('agree-checkbox');
  const configWrapper = document.getElementById('config-wrapper');
  let loadedConfig = null;

  // Initialize KeywordList components
  const notCheckedList = new KeywordList(
    'not-checked-list-input',
    'not-checked-list-container',
    'not-checked-list-add-input',
    'not-checked-list-add',
  );

  window.keywordLists = { notCheckedList };
  let pinnedValuesList = null;

  function updateConfigState(isAgreed) {
    configWrapper.classList.toggle('disabled', !isAgreed);
    const produkWrapper = document.getElementById('produktifitas');
    if (produkWrapper) produkWrapper.classList.toggle('disabled', !isAgreed);
    const formElements = configWrapper.querySelectorAll('input, select, button, a');
    formElements.forEach((element) => {
      element.disabled = !isAgreed;
    });
  }

  // --- Agreement Tab Logic ---
  store.getAgreement().then((agreed) => {
    if (agreeCheckbox) agreeCheckbox.checked = agreed;
    updateConfigState(agreed);
  });

  if (agreeCheckbox) {
    agreeCheckbox.addEventListener('change', () => {
      const isAgreed = agreeCheckbox.checked;
      store.setAgreement(isAgreed);
      updateConfigState(isAgreed);
    });
  }

  // --- Tab Switching Logic ---
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const tabName = button.dataset.tab;

      tabButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      tabContents.forEach((content) => {
        content.id === tabName
          ? content.classList.add('active')
          : content.classList.remove('active');
      });
    });
  });

  // --- Configuration Tab Logic ---
  const saveConfigBtn = document.getElementById('save-config-btn');
  const formSkriningUrlInput = document.getElementById('form-skrining-url');
  const scrollToButtonCheckbox = document.getElementById('form-skrining-scroll-to-button');
  const respectInputCheckbox = document.getElementById('form-skrining-respect-input');
  const ensureFillCheckbox = document.getElementById('form-skrining-ensure-fill');
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
    respectInputCheckbox.checked = fs.respectInput === true;
    ensureFillCheckbox.checked = fs.ensureFill === true;

    if (pinnedValuesList) pinnedValuesList.setData(fs.pinneds || {});

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

  store.getFullConfig().then((config) => {
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
        store.setConfig(loadedConfig);
      },
      onChange: () => {
        store.setConfig(loadedConfig);
      },
    });
  });

  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', () => {
      if (!loadedConfig) return;
      const selectedProfile = loadedConfig.activeProfile;
      const profileSettings = loadedConfig.profiles[selectedProfile];

      loadedConfig.activeProfile = selectedProfile;

      if (!profileSettings.formSkrining) profileSettings.formSkrining = {};
      profileSettings.formSkrining.url = formSkriningUrlInput.value;
      profileSettings.formSkrining.scrollToButton = scrollToButtonCheckbox.checked;
      profileSettings.formSkrining.respectInput = respectInputCheckbox.checked;
      profileSettings.formSkrining.ensureFill = ensureFillCheckbox.checked;

      if (pinnedValuesList) profileSettings.formSkrining.pinneds = pinnedValuesList.getData();

      if (!profileSettings.skrining) profileSettings.skrining = {};
      profileSettings.skrining.url = skriningUrlInput.value;

      if (!profileSettings.notChecked) profileSettings.notChecked = {};
      profileSettings.notChecked.url = notCheckedUrlInput.value;
      profileSettings.notChecked.notCheckedList = notCheckedListInput.value;
      profileSettings.notChecked.automationDelay =
        parseInt(notCheckedAutomationDelayInput.value) || 2000;
      profileSettings.notChecked.itemDelay = parseInt(notCheckedItemDelayInput.value) || 1000;
      profileSettings.notChecked.reloadDelay = parseInt(notCheckedReloadDelayInput.value) || 1000;

      store.setConfig(loadedConfig);

      saveConfigBtn.textContent = 'Tersimpan!';
      setTimeout(() => {
        saveConfigBtn.textContent = 'Simpan';
      }, 1500);
    });
  }

  // --- Open Full Page ---
  const openFullPage = document.getElementById('open-full-page');
  openFullPage.addEventListener('click', (event) => {
    event.preventDefault();
    browser.tabs.create({ url: browser.runtime.getURL('view/page/index.html#profile') });
  });

  // --- Import/Export Logic ---
  const exportLink = document.getElementById('export-link');
  const importLink = document.getElementById('import-link');
  const importFileInput = document.getElementById('import-file-input');

  exportLink.addEventListener('click', (event) => {
    event.preventDefault();
    store.getFullConfig().then((config) => {
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
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        if (!importedConfig.profiles || !importedConfig.activeProfile)
          throw new Error('Invalid config file format.');
        store.setConfig(importedConfig);
        loadedConfig = await store.getFullConfig();
        updateFormForProfile(loadedConfig.activeProfile);
      } catch {
      } finally {
        importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  // --- Produktifitas Tab Logic ---
  function rd(current, prev) {
    const pv = document.createElement('span');
    pv.className = 'pv';
    if (prev === null || prev === undefined) {
      pv.textContent = String(current);
      return pv;
    }
    if (prev === 0 && current === 0) {
      pv.className = 'pv zero';
      pv.textContent = '0';
      return pv;
    }
    const d = current - prev;
    if (d === 0) {
      pv.textContent = String(current);
      return pv;
    }
    pv.textContent = String(current);
    const pd = document.createElement('span');
    if (d > 0) {
      pd.className = 'pd pos';
      pd.textContent = `(+${d})`;
    } else {
      pd.className = 'pd neg';
      pd.textContent = `(${d})`;
    }
    const frag = document.createDocumentFragment();
    frag.appendChild(pv);
    frag.appendChild(document.createTextNode(' '));
    frag.appendChild(pd);
    return frag;
  }

  function prodRow(label, value) {
    return h('div', { className: 'prod-row' },
      h('span', { className: 'label' }, label),
      h('span', { className: 'value' }, value),
    );
  }

  async function renderProduktifitas() {
    const container = document.getElementById('produktifitas-content');
    if (!container) return;

    container.replaceChildren();

    const status = getStatus();
    const periodTotal = TARGET_MODE === 'weekly' ? await getWeekTotal() : await getMonthTotal();
    const periodLabel = TARGET_MODE === 'weekly' ? 'Minggu' : 'Bulan';

    const [today, yesterday, overall] = await Promise.all([
      getTodaySummary(),
      getYesterdaySummary(),
      getOverallBreakdown(),
    ]);

    const prev = yesterday ? yesterday.counts : null;

    if (!status.isFreePlan && status.payload) {
      const p = status.payload;
      const from = new Date(p.iat * 1000);
      const to = new Date();
      const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
      const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
      const rangeData = await getRange(fromStr, toStr);
      const usedInLicense = rangeData.reduce((sum, d) => sum + (d ? d.dayTotal : 0), 0);
      const totalPct = Math.min(100, Math.round((usedInLicense / (p.total_limit || 1)) * 100));
      const daysLeft = Math.ceil((p.exp * 1000 - Date.now()) / 86_400_000);
      const expiryText = daysLeft <= 0 ? 'Kedaluwarsa' : `Berakhir dalam ${daysLeft} hari`;
      container.appendChild(
        h('div', { className: 'prod-license pro' },
          h('span', { className: 'license-badge-sm pro' }, 'PRO'),
          h('span', { className: 'license-text' }, `${totalPct}% digunakan`),
          h('span', { className: 'license-sep' }, '\u00B7'),
          h('span', { className: 'license-text' }, expiryText),
        ),
      );
    }

    container.appendChild(h('div', { className: 'prod-header' }, 'Hari Ini'));

    if (today) {
      container.append(
        prodRow('📻 Radio', rd(today.counts.radio, prev?.radio ?? null)),
        prodRow('📝 Teks', rd(today.counts.freetext, prev?.freetext ?? null)),
        prodRow('📋 Dropdown', rd(today.counts.dropdown, prev?.dropdown ?? null)),
        prodRow('❌ Tidak Periksa', rd(today.counts.formNotChecked, prev?.formNotChecked ?? null)),
        prodRow('🧘 Zen', rd(today.counts.formZen, prev?.formZen ?? null)),
        h('div', { className: 'prod-total' },
          h('span', null, 'Total Hari Ini'),
          h('span', null, rd(today.dayTotal, yesterday?.dayTotal ?? null)),
        ),
      );
    } else {
      const emptyRow = document.createElement('div');
      emptyRow.className = 'prod-row';
      emptyRow.style.color = '#999';
      emptyRow.textContent = 'Belum ada data hari ini.';
      container.appendChild(emptyRow);
    }

    const barPct = Math.min(100, Math.round((periodTotal / MONTHLY_TARGET) * 100));
    container.append(
      h('div', { className: 'prod-grand' },
        h('span', null, 'Grand Total'),
        h('span', null, overall.grandTotal.toLocaleString()),
      ),
      h('div', { className: 'prod-progress' },
        h('div', { className: 'prod-header' }, `Progress ${periodLabel} Ini (target ${MONTHLY_TARGET.toLocaleString()} poin)`),
        h('div', { className: 'label-row' },
          h('span', null, `${periodTotal.toLocaleString()} / ${MONTHLY_TARGET.toLocaleString()} poin`),
        ),
        h('div', { className: 'prod-bar-track' },
          h('div', { className: 'prod-bar-fill', style: `width:${barPct}%` }),
        ),
      ),
    );
  }

  const produktifitasTab = document.querySelector('.tab-button[data-tab="produktifitas"]');
  if (produktifitasTab) {
    produktifitasTab.addEventListener('click', renderProduktifitas);
  }

  const prodOpenConfig = document.getElementById('prod-open-config');
  if (prodOpenConfig) {
    prodOpenConfig.addEventListener('click', (e) => {
      e.preventDefault();
      browser.tabs.create({ url: browser.runtime.getURL('view/page/index.html#produktifitas') });
    });
  }

  if (document.getElementById('produktifitas')?.classList.contains('active')) {
    renderProduktifitas();
  }
});
