import { getAgreement, setAgreement, getFullConfig, setConfig } from '../configuration';

document.addEventListener('DOMContentLoaded', () => {
  const agreeCheckbox = document.getElementById('agree-checkbox');
  const configWrapper = document.getElementById('config-wrapper');
  let loadedConfig = null;

  /**
   * Toggles the enabled/disabled state of the configuration tab and its contents.
   * @param {boolean} isAgreed - Whether the user has agreed to the terms.
   */
  function updateConfigState (isAgreed) {
    configWrapper.classList.toggle('disabled', !isAgreed);

    const formElements = configWrapper.querySelectorAll('input, select, button, a');
    formElements.forEach(element => {
      element.disabled = !isAgreed;
    });
  }

  // --- Agreement Tab Logic ---
  getAgreement().then((agreed) => {
    if (agreeCheckbox) {
      agreeCheckbox.checked = agreed;
    }
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
        content.id === tabName ? content.classList.add('active') : content.classList.remove('active');
      });
    });
  });

  // --- Configuration Tab Logic ---
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
    radioButtonKeywordsInput.value = profileSettings.radioButtonKeywords;
    dropdownKeywordsInput.value = profileSettings.dropdownKeywords;
    excludesInput.value = profileSettings.excludes;

    // Update select box selection
    profileSelect.value = selectedProfile;
  }

  // Load initial config and set up profile switching
  getFullConfig().then((config) => {
    loadedConfig = config;
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
      loadedConfig.profiles[selectedProfile].radioButtonKeywords = radioButtonKeywordsInput.value;
      loadedConfig.profiles[selectedProfile].dropdownKeywords = dropdownKeywordsInput.value;
      loadedConfig.profiles[selectedProfile].excludes = excludesInput.value;

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
