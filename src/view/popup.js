import { getAgreement, setAgreement, getFullConfig, setConfig, getStats } from '../configuration';
import { KeywordList } from './components/KeywordList.js';
import { KeyValueList } from './components/KeyValueList.js';

document.addEventListener('DOMContentLoaded', () => {
  const agreeCheckbox = document.getElementById('agree-checkbox');
  const configWrapper = document.getElementById('config-wrapper');
  let loadedConfig = null;

  /**
   * Fetches and renders the latest statistics.
   */
  async function renderStats () {
    const stats = await getStats();
    const todayClick = stats.todayClick;
    const limit = stats.limit;
    const remaining = Math.max(0, limit - todayClick);
    const percentage = Math.min(100, (todayClick / limit) * 100);

    // Update Basic Labels
    document.getElementById('today-load').textContent = stats.todayLoad;
    document.getElementById('today-click').textContent = todayClick;
    document.getElementById('total-load').textContent = stats.totalLoad;
    document.getElementById('total-click').textContent = stats.totalClick;
    document.getElementById('daily-limit').textContent = limit;

    // Update Progress UI
    const progressBar = document.getElementById('click-progress');
    const remainingLabel = document.getElementById('remaining-click');

    if (progressBar && remainingLabel) {
      progressBar.style.width = `${percentage}%`;
      remainingLabel.textContent = `Sisa: ${remaining}`;

      // Change colors based on usage
      progressBar.classList.remove('warning', 'danger');
      if (percentage >= 90) {
        progressBar.classList.add('danger');
      } else if (percentage >= 70) {
        progressBar.classList.add('warning');
      }
    }
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
        content.id === tabName ? content.classList.add('active') : content.classList.remove('active');
      });

      if (tabName === 'stats') {
        renderStats();
      }
    });
  });

  // Initial stats render
  renderStats();

  // Initialize KeywordList components
  const saveConfigBtn = document.getElementById('save-config-btn');
  const formInput = document.getElementById('form-input');
  const surveyInput = document.getElementById('survey-input');
  const radioButtonKeywordsInput = document.getElementById('radio-button-keywords-input');
  const dropdownKeywordsInput = document.getElementById('dropdown-keywords-input');
  const profileSelect = document.getElementById('profile-select');
  const excludesInput = document.getElementById('excludes');

  /**
   * Updates the form inputs based on the selected profile in the loaded config.
   * @param {string} selectedProfile - The key of the profile to load ('profile1' or 'profile2').
   */
  function updateFormForProfile (selectedProfile) {
    if (!loadedConfig) return;

    const profileSettings = loadedConfig.profiles[selectedProfile];
    formInput.value = loadedConfig.formSelector;
    surveyInput.value = loadedConfig.surveySelector;

    // Set values to textboxes (KeywordList components will auto-sync via event listener)
    radioButtonKeywordsInput.value = profileSettings.radioButtonKeywords;
    dropdownKeywordsInput.value = profileSettings.dropdownKeywords;

    // Trigger input event to sync with KeywordList components
    radioButtonKeywordsInput.dispatchEvent(new Event('input', { bubbles: true }));
    dropdownKeywordsInput.dispatchEvent(new Event('input', { bubbles: true }));

    excludesInput.value = profileSettings.excludes;

    if (pinnedValuesList) {
      pinnedValuesList.setData(profileSettings.pinneds || {});
    }

    // Update select box selection
    profileSelect.value = selectedProfile;
  }

  // Load initial config and set up profile switching
  getFullConfig().then((config) => {
    loadedConfig = config;

    // Initialize KeyValueList component with onChange callback
    const activeProfileSettings = config.profiles[config.activeProfile];
    pinnedValuesList = new KeyValueList(
      'pinned-values-container',
      activeProfileSettings.pinneds || {},
      (newPinneds) => {
        // Auto-update loadedConfig when pinneds change
        if (loadedConfig) {
          const selectedProfile = profileSelect.value;
          loadedConfig.profiles[selectedProfile].pinneds = newPinneds;
        }
      }
    );

    updateFormForProfile(config.activeProfile);

    profileSelect.addEventListener('change', (event) => updateFormForProfile(event.target.value));
  });

  // Save button logic
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', () => {
      if (!loadedConfig) return;

      const selectedProfile = profileSelect.value;

      // Update the loadedConfig object with current form values
      loadedConfig.activeProfile = selectedProfile;
      loadedConfig.formSelector = formInput.value;
      loadedConfig.surveySelector = surveyInput.value;

      // Get values from textboxes (already synced by KeywordList components)
      loadedConfig.profiles[selectedProfile].radioButtonKeywords = radioButtonKeywordsInput.value;
      loadedConfig.profiles[selectedProfile].dropdownKeywords = dropdownKeywordsInput.value;

      loadedConfig.profiles[selectedProfile].excludes = excludesInput.value;

      // Get pinneds from KeyValueList (already auto-synced via onChange callback)
      if (pinnedValuesList) {
        loadedConfig.profiles[selectedProfile].pinneds = pinnedValuesList.getData();
      }

      setConfig(loadedConfig);

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
    getFullConfig().then(config => {
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
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);

        // Basic validation
        if (!importedConfig.profiles || !importedConfig.activeProfile) {
          throw new Error('Invalid config file format.');
        }

        // Save and reload
        setConfig(importedConfig);
        loadedConfig = importedConfig;
        updateFormForProfile(importedConfig.activeProfile);
      } catch (error) {
      } finally {
        // Reset file input
        importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  });
});
