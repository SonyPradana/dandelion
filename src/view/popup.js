import browser from 'webextension-polyfill';
import { getAgreement, setAgreement, getFullConfig, setConfig } from '../configuration';
import { KeywordList } from './components/KeywordList.js';
import { KeyValueList } from './components/KeyValueList.js';
import { ProfileManager } from './components/ProfileManager.js';
import {
  getTodaySummary,
  getYesterdaySummary,
  getMonthTotal,
  getOverallBreakdown,
  MONTHLY_TARGET,
} from '../utils/productivityTracker';

document.addEventListener('DOMContentLoaded', () => {
  const agreeCheckbox = document.getElementById('agree-checkbox');
  const configWrapper = document.getElementById('config-wrapper');
  let loadedConfig = null;

  // Initialize KeywordList components
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
  getAgreement().then((agreed) => {
    if (agreeCheckbox) agreeCheckbox.checked = agreed;
    updateConfigState(agreed);
  });

  if (agreeCheckbox) {
    agreeCheckbox.addEventListener('change', () => {
      const isAgreed = agreeCheckbox.checked;
      setAgreement(isAgreed);
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

      setConfig(loadedConfig);

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
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        if (!importedConfig.profiles || !importedConfig.activeProfile)
          throw new Error('Invalid config file format.');
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
    const container = document.getElementById('produktifitas-content');
    if (!container) return;

    const [today, yesterday, monthTotal, overall] = await Promise.all([
      getTodaySummary(),
      getYesterdaySummary(),
      getMonthTotal(),
      getOverallBreakdown(),
    ]);

    const prev = yesterday ? yesterday.counts : null;

    let html = '<div class="prod-header">Hari Ini</div>';

    if (today) {
      html += `
        <div class="prod-row"><span class="label">📻 Radio</span><span class="value">${delta(today.counts.radio, prev?.radio ?? null)}</span></div>
        <div class="prod-row"><span class="label">📝 Teks</span><span class="value">${delta(today.counts.freetext, prev?.freetext ?? null)}</span></div>
        <div class="prod-row"><span class="label">📋 Dropdown</span><span class="value">${delta(today.counts.dropdown, prev?.dropdown ?? null)}</span></div>
        <div class="prod-row"><span class="label">❌ Tidak Periksa</span><span class="value">${delta(today.counts.formNotChecked, prev?.formNotChecked ?? null)}</span></div>
        <div class="prod-row"><span class="label">🧘 Zen</span><span class="value">${delta(today.counts.formZen, prev?.formZen ?? null)}</span></div>
        <div class="prod-total"><span>Total Hari Ini</span><span>${delta(today.dayTotal, yesterday?.dayTotal ?? null)}</span></div>
      `;
    } else {
      html += '<div class="prod-row" style="color:#999">Belum ada data hari ini.</div>';
    }

    const barPct = Math.min(100, Math.round((monthTotal / MONTHLY_TARGET) * 100));
    html += `
      <div class="prod-grand"><span>Grand Total</span><span>${overall.grandTotal.toLocaleString()}</span></div>
      <div class="prod-progress">
        <div class="prod-header">Progress Bulan Ini (target ${MONTHLY_TARGET.toLocaleString()} poin)</div>
        <div class="label-row"><span>${monthTotal.toLocaleString()} / ${MONTHLY_TARGET.toLocaleString()} poin</span></div>
        <div class="prod-bar-track"><div class="prod-bar-fill" style="width:${barPct}%"></div></div>
      </div>
    `;

    container.innerHTML = html;
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
