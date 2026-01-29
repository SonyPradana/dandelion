import { button } from '../components/button';
import { getConfig } from '../configuration';

/**
 * ⚠️ Legal / UX Notice:
 * This button only trigger local form filling.
 * The use must consciously press the button to perform the action.
 */
export async function initializeSkriningForm () {
  const tombol = button('dandelion-auto-fill');
  const config = await getConfig();
  const radioButtonKeywords = (config.radioButtonKeywords && config.radioButtonKeywords.split(';')) || [];

  if (tombol) {
    tombol.addEventListener('click', () => {
      fillRadioButtons(radioButtonKeywords);
      fillDropdowns();
    });
    document.body.appendChild(tombol);
  }

  /**
    * @param {string[]} config - List of radioInput konfuguration
    */
  function fillRadioButtons (config) {
    const allMatchingLabels = Array.from(document.querySelectorAll('span.sd-item__control-label')).filter(span => {
      const childViewerSpan = span.querySelector('span.sv-string-viewer');
      if (!childViewerSpan) return false;

      const text = childViewerSpan.textContent.trim();

      if (config.includes(text)) return true;

      return /^(Tidak)[\s\u00A0]/.test(text);
    });

    allMatchingLabels.forEach(labelSpan => {
      const parentLabel = labelSpan.closest('label.sd-selectbase__label');
      if (parentLabel) {
        const radioInput = parentLabel.querySelector('input[type="radio"]');
        if (radioInput && !radioInput.checked) {
          radioInput.click();
        }
      }
    });
  }

  function fillDropdowns () {
    const dropdownInputs = Array.from(document.querySelectorAll('.sd-dropdown[role="combobox"]'));

    dropdownInputs.forEach(dropdownInput => {
      dropdownInput.click();

      setTimeout(() => {
        const allOptions = Array.from(document.querySelectorAll('.sv-popup__container .sv-string-viewer'));

        const targetOptionElement = allOptions.find(span =>
          span.textContent.trim() === 'Mandiri' ||
          span.textContent.trim() === 'Tidak' ||
          span.textContent.trim() === 'Normal' ||
          span.textContent.trim() === 'SADANIS'
        );

        if (targetOptionElement) {
          targetOptionElement.closest('.sd-list__item').click();
        } else {
          dropdownInput.click(); // Close if no matching option was found
        }
      }, 100);
    });
  }
}
