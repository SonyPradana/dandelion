import { button } from '../components/button';
import { getActiveConfig, recordEvent, isLimitReached } from '../configuration';
import { debugMarker } from '../components/marker';
import { debugButton } from '../components/debugButton';
import { fillPinnedFields } from './skriningform/fill-pinned-fields';

/**
 * ⚠️ Legal / UX Notice:
 * This button only trigger local form filling.
 * The use must consciously press the button to perform the action.
 */
export async function initializeSkriningForm () {
  let isDebugEnabled = false; // Initial state is off

  const tombol = button('dandelion-auto-fill');
  const debugToggle = debugButton();

  debugToggle.addEventListener('click', () => {
    isDebugEnabled = !isDebugEnabled;
    showDebugInformation(isDebugEnabled);
  });

  document.body.appendChild(debugToggle);

  if (tombol) {
    tombol.addEventListener('click', async () => {
      if (await isLimitReached()) {
        alert('Daily limit reached. Please try again tomorrow.');
        return;
      }
      await recordEvent('click');

      const config = await getActiveConfig();
      const radioButtonKeywords = (config.radioButtonKeywords && config.radioButtonKeywords.split(';')) || [];
      const dropdownKeywords = (config.dropdownKeywords && config.dropdownKeywords.split(';')) || [];
      const pinneds = config.pinneds || {};
      const excludes = [
        ...((config.excludes && config.excludes.split(';')) || []),
        ...Object.keys(pinneds)
      ];

      fillPinnedFields(pinneds);
      fillRadioButtons(radioButtonKeywords, excludes);
      fillDropdowns(dropdownKeywords, excludes);
    });
    document.body.appendChild(tombol);
    recordEvent('load');
  }

  /**
    * @param {string[]} config - List of radioInput konfuguration
    * @param {string[]} skipList - List of data-name attributes to skip (e.g., ['LPMxxx|FRMxxx|PPMxxx|text'])
    */
  function fillRadioButtons (config, skipList = []) {
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
        const questionElement = parentLabel.closest('[data-name]');
        if (questionElement) {
          const dataName = questionElement.getAttribute('data-name');
          if (skipList.includes(dataName)) {
            return;
          }
        }

        const radioInput = parentLabel.querySelector('input[type="radio"]');
        if (radioInput && !radioInput.checked) {
          radioInput.click();
        }
      }
    });
  }

  /**
    * @param {string[]} config - List of radioInput konfuguration
    * @param {string[]} skipList - List of data-name attributes to skip (e.g., ['LPMxxx|FRMxxx|PPMxxx|text'])
    */
  async function fillDropdowns (config, skipList = []) {
    const chevronButtons = Array.from(document.querySelectorAll('.sd-dropdown_chevron-button'));

    for (let i = 0; i < chevronButtons.length; i++) {
      const chevronButton = chevronButtons[i];

      const questionElement = chevronButton.closest('[data-name]');

      if (questionElement) {
        const dataName = questionElement.getAttribute('data-name');
        if (skipList.includes(dataName)) {
          continue; // Skip dropdown (exclude list)
        }
      }

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

  /**
    * @param {boolean} enable - Toggle show or hide debug markers.
    */
  function showDebugInformation (enable) {
    const DEBUG_MARKER_CLASS = 'dandelion-debug-marker';

    if (enable) {
      const elementsWithDataName = document.querySelectorAll('[data-name]');

      elementsWithDataName.forEach(element => {
        // Prevent adding duplicate markers
        if (element.querySelector(`.${DEBUG_MARKER_CLASS}`)) {
          return;
        }

        const dataName = element.getAttribute('data-name');
        const marker = debugMarker(dataName);

        // Ensure the parent is positioned to contain the absolute marker
        if (window.getComputedStyle(element).position === 'static') {
          element.style.position = 'relative';
        }

        element.appendChild(marker);
      });
    } else {
      const markers = document.querySelectorAll(`.${DEBUG_MARKER_CLASS}`);
      markers.forEach(marker => marker.remove());
    }
  }
}
