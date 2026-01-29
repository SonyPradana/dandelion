import { getAgreement, setAgreement, getConfig, setConfig } from '../configuration';

document.addEventListener('DOMContentLoaded', () => {
  const agreeCheckbox = document.getElementById('agree-checkbox');

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

      // Update button active state
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Update content active state
      tabContents.forEach((content) => {
        if (content.id === tabName) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // --- Configuration Tab Logic ---
  const saveConfigBtn = document.getElementById('save-config-btn');
  const formInput = document.getElementById('form-input');
  const surveyInput = document.getElementById('survey-input');
  const radioButtonKeywordsInput = document.getElementById('radio-button-keywords-input');
  const dropdownKeywordsInput = document.getElementById('dropdown-keywords-input');

  // Load initial config
  getConfig().then((config) => {
    if (formInput) {
      formInput.value = config.form;
    }
    if (surveyInput) {
      surveyInput.value = config.survey;
    }
    if (radioButtonKeywordsInput) {
      radioButtonKeywordsInput.value = config.radioButtonKeywords;
    }
    if (dropdownKeywordsInput) {
      dropdownKeywordsInput.value = config.dropdownKeywords;
    }
  });

  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', () => {
      const formValue = formInput.value;
      const surveyValue = surveyInput.value;
      const radioButtonKeywordsValue = radioButtonKeywordsInput.value;
      const dropdownKeywordsValue = dropdownKeywordsInput.value;

      setConfig({ form: formValue, survey: surveyValue, radioButtonKeywords: radioButtonKeywordsValue, dropdownKeywords: dropdownKeywordsValue });
      // Optional: Add a visual confirmation that settings are saved
      saveConfigBtn.textContent = 'Tersimpan!';
      setTimeout(() => {
        saveConfigBtn.textContent = 'Simpan';
      }, 1500);
    });
  }
});
