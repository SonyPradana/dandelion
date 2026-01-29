import { button } from '../components/button';
import { getActiveConfig } from '../configuration';

/**
 * ⚠️ Legal / UX Notice:
 * This button only trigger local form filling.
 * The use must consciously press the button to perform the action.
 */
export async function initializeSkriningForm () {
  const tombol = button('dandelion-auto-fill');

  if (tombol) {
    tombol.addEventListener('click', async () => {
      const config = await getActiveConfig();
      const radioButtonKeywords = (config.radioButtonKeywords && config.radioButtonKeywords.split(';')) || [];
      const dropdownKeywords = (config.dropdownKeywords && config.dropdownKeywords.split(';')) || [];

      fillRadioButtons(radioButtonKeywords);
      fillDropdowns(dropdownKeywords);
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

  /**
    * @param {string[]} config - List of radioInput konfuguration
    */
  async function fillDropdowns (config) {
    const chevronButtons = Array.from(document.querySelectorAll('.sd-dropdown_chevron-button'));

    for (let i = 0; i < chevronButtons.length; i++) {
      const chevronButton = chevronButtons[i];

      chevronButton.click();

      await new Promise(resolve => setTimeout(resolve, 300));

      const visibleOptions = Array.from(document.querySelectorAll('.sv-popup--dropdown .sv-string-viewer'))
        .filter(option => {
          const popup = option.closest('.sv-popup');
          return popup && popup.style.display !== 'none';
        });

      const targetOptionElement = visibleOptions.find(span => {
        const text = span.textContent.trim();
        return config.includes(text);
      });

      if (targetOptionElement) {
        targetOptionElement.closest('.sv-list__item').click();
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        chevronButton.click(); // Close drop down
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
  }
}
