import { configManager } from '../configuration';
import { KeywordList } from './components/KeywordList.js';
import { KeyValueList } from './components/KeyValueList.js';

document.addEventListener('DOMContentLoaded', async () => {
  const agreeCheckbox = document.getElementById('agree-checkbox');
  const configWrapper = document.getElementById('config-wrapper');
  
  // Load config once at start
  await configManager.load();
  let loadedConfig = configManager.data;

  // Initialize KeywordList components
  const radioButtonKeywordsList = new KeywordList(
    'radio-button-keywords-input',
    'radio-button-keywords-list',
    'radio-button-keywords-add-input',
    'radio-button-keywords-add',
  );

  const dropdownKeywordsList = new KeywordList(
    'dropdown-keywords-input',
    'dropdown-keywords-list',
    'dropdown-keywords-add-input',
    'dropdown-keywords-add',
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
    const formElements = configWrapper.querySelectorAll('input, select, button, a');
    formElements.forEach((element) => {
      element.disabled = !isAgreed;
    });
  }

  // --- Agreement Tab Logic ---
  const agreed = configManager.getAgreement();
  if (agreeCheckbox) {
    agreeCheckbox.checked = agreed;
  }
  updateConfigState(agreed);

  if (agreeCheckbox) {
    agreeCheckbox.addEventListener('change', async () => {
      const isAgreed = agreeCheckbox.checked;
      await configManager.setAgreement(isAgreed);
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
  const formInput = document.getElementById('form-input');
  const surveyInput = document.getElementById('survey-input');
  const notCheckedUrlInput = document.getElementById('not-checked-url-input');
  const notCheckedAutomationDelayInput = document.getElementById('not-checked-automation-delay');
  const notCheckedItemDelayInput = document.getElementById('not-checked-item-delay');
  const notCheckedReloadDelayInput = document.getElementById('not-checked-reload-delay');
  const scrollBottomCheckbox = document.getElementById('scroll-bottom-checkbox');
  const radioButtonKeywordsInput = document.getElementById('radio-button-keywords-input');
  const dropdownKeywordsInput = document.getElementById('dropdown-keywords-input');
  const notCheckedListInput = document.getElementById('not-checked-list-input');
  const profileSelect = document.getElementById('profile-select');
  const excludesInput = document.getElementById('excludes');

  function updateFormForProfile(selectedProfile) {
    if (!loadedConfig) return;

    const profileSettings = loadedConfig.profiles[selectedProfile];
    formInput.value = loadedConfig.formSelector;
    surveyInput.value = loadedConfig.surveySelector;

    const nc = loadedConfig.notChecked || {};
    notCheckedUrlInput.value = nc.url || '';
    notCheckedAutomationDelayInput.value = nc.automationDelay || 2000;
    notCheckedItemDelayInput.value = nc.itemDelay || 1000;
    notCheckedReloadDelayInput.value = nc.reloadDelay || 3000;

    scrollBottomCheckbox.checked = loadedConfig.scrollToBottom || false;

    radioButtonKeywordsInput.value = profileSettings.radioButtonKeywords;
    dropdownKeywordsInput.value = profileSettings.dropdownKeywords;
    notCheckedListInput.value = profileSettings.notCheckedList || '';

    radioButtonKeywordsInput.dispatchEvent(new Event('input', { bubbles: true }));
    dropdownKeywordsInput.dispatchEvent(new Event('input', { bubbles: true }));
    notCheckedListInput.dispatchEvent(new Event('input', { bubbles: true }));

    excludesInput.value = profileSettings.excludes;

    if (pinnedValuesList) {
      pinnedValuesList.setData(profileSettings.pinneds || {});
    }

    profileSelect.value = selectedProfile;
  }

  // Initialize UI with loaded config
  const activeProfileSettings = loadedConfig.profiles[loadedConfig.activeProfile];
  pinnedValuesList = new KeyValueList(
    'pinned-values-container',
    activeProfileSettings.pinneds || {},
    (newPinneds) => {
      if (loadedConfig) {
        const selectedProfile = profileSelect.value;
        loadedConfig.profiles[selectedProfile].pinneds = newPinneds;
      }
    },
  );

  updateFormForProfile(loadedConfig.activeProfile);
  profileSelect.addEventListener('change', (event) => updateFormForProfile(event.target.value));

  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', async () => {
      if (!loadedConfig) return;

      const selectedProfile = profileSelect.value;
      loadedConfig.activeProfile = selectedProfile;
      loadedConfig.formSelector = formInput.value;
      loadedConfig.surveySelector = surveyInput.value;

      if (!loadedConfig.notChecked) loadedConfig.notChecked = {};
      loadedConfig.notChecked.url = notCheckedUrlInput.value;
      loadedConfig.notChecked.automationDelay = parseInt(notCheckedAutomationDelayInput.value) || 2000;
      loadedConfig.notChecked.itemDelay = parseInt(notCheckedItemDelayInput.value) || 1000;
      loadedConfig.notChecked.reloadDelay = parseInt(notCheckedReloadDelayInput.value) || 3000;

      loadedConfig.scrollToBottom = scrollBottomCheckbox.checked;

      loadedConfig.profiles[selectedProfile].radioButtonKeywords = radioButtonKeywordsInput.value;
      loadedConfig.profiles[selectedProfile].dropdownKeywords = dropdownKeywordsInput.value;
      loadedConfig.profiles[selectedProfile].notCheckedList = notCheckedListInput.value;
      loadedConfig.profiles[selectedProfile].excludes = excludesInput.value;

      if (pinnedValuesList) {
        loadedConfig.profiles[selectedProfile].pinneds = pinnedValuesList.getData();
      }

      await configManager.setFullConfig(loadedConfig);

      saveConfigBtn.textContent = 'Tersimpan!';
      setTimeout(() => {
        saveConfigBtn.textContent = 'Simpan';
      }, 1500);
    });
  }

  // --- Import/Export Logic ---
  const exportLink = document.getElementById('export-link');
  const importLink = document.getElementById('import-link');
  const importFileInput = document.getElementById('import-file-input');

  exportLink.addEventListener('click', (event) => {
    event.preventDefault();
    const configStr = JSON.stringify(loadedConfig, null, 2);
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
        if (!importedConfig.profiles || !importedConfig.activeProfile) {
          throw new Error('Invalid config file format.');
        }
        await configManager.setFullConfig(importedConfig);
        loadedConfig = configManager.data;
        updateFormForProfile(loadedConfig.activeProfile);
      } catch (error) {
        console.error('Dandelion: Import failed', error);
      } finally {
        importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  });
});
