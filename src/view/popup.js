import { getAgreement, setAgreement, getFullConfig, setConfig } from '../configuration';

document.addEventListener('DOMContentLoaded', () => {
  const agreeCheckbox = document.getElementById('agree-checkbox');
  let loadedConfig = null;

  // --- Agreement Tab Logic ---
  getAgreement().then((agreed) => {
    if (agreeCheckbox) {
      agreeCheckbox.checked = agreed;
    }
  });

  if (agreeCheckbox) {
    agreeCheckbox.addEventListener('change', () => {
      setAgreement(agreeCheckbox.checked);
    });
  }

  // --- Tab Switching Logic ---
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
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
    excludesInput.value = profileSelect.excludes;

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
});
