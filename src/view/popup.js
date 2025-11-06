import { getAgreement, setAgreement } from '../configuration';

document.addEventListener('DOMContentLoaded', () => {
  const agreeCheckbox = document.getElementById('agree-checkbox');

  // Set initial checkbox state
  getAgreement().then((agreed) => {
    agreeCheckbox.checked = agreed;
  });

  // Listen for changes on the checkbox
  agreeCheckbox.addEventListener('change', () => {
    setAgreement(agreeCheckbox.checked);
  });
});
