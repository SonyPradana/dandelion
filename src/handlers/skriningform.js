import { button } from '../components/button';
import { getActiveConfig } from '../configuration';
import { debugMarker } from '../components/marker';
import { debugButton } from '../components/debugButton';
import { fillPinnedFields } from './skriningform/fill-pinned-fields';
import { zenModeButton } from '../components/zenModeButton';
import { skipButton } from '../components/skipButton';
import { waitForElement } from './inspection/not-checked-utils';
import { isZenModeActive, clearZenMode, skipQueue } from '../utils/zenMode';
import { controlPanel } from '../components/controlPanel';
import { createProfileComponent } from '../components/profile';
import { incrementBatch } from '../utils/productivityTracker';
import { notify } from '../components/notification';

/**
 * ⚠️ Legal / UX Notice:
 * This button only trigger local form filling.
 * The use must consciously press the button to perform the action.
 */
export async function initializeSkriningForm() {
  let isDebugEnabled = false; // Initial state is off

  const tombol = button('dandelion-auto-fill');
  const profileIndicator = await createProfileComponent();
  const debugToggle = debugButton();

  if (tombol) {
    let hideTimeout = null;
    const showProfile = () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      profileIndicator.setVisibility(true);
    };
    const hideProfile = () => {
      hideTimeout = setTimeout(() => profileIndicator.setVisibility(false), 300);
    };

    tombol.addEventListener('mouseenter', showProfile);
    tombol.addEventListener('mouseleave', hideProfile);
    profileIndicator.addEventListener('mouseenter', showProfile);
    profileIndicator.addEventListener('mouseleave', hideProfile);
  }

  debugToggle.addEventListener('click', () => {
    isDebugEnabled = !isDebugEnabled;
    showDebugInformation(isDebugEnabled);
  });

  controlPanel.mount(debugToggle, 2);

  const zenActive = await isZenModeActive();
  if (zenActive) {
    const zenToggle = zenModeButton(true);

    zenToggle.addEventListener('click', async () => {
      await clearZenMode();
      // Remove both buttons to signal Zen Mode is off
      controlPanel.remove(zenToggle);
      const skipBtnEl = document.getElementById('dandelion-zen-skip');
      if (skipBtnEl) controlPanel.remove(skipBtnEl);
    });

    const skipBtn = skipButton();
    skipBtn.addEventListener('click', async () => {
      await skipQueue();
      skipBtn.style.opacity = '0.5';
      skipBtn.style.pointerEvents = 'none';
      skipBtn.innerHTML = '✅ Skipped';
      setTimeout(() => controlPanel.remove(skipBtn), 1000);

      try {
        const homeBtn = await waitForElement('button', 'Kembali ke Halaman Utama', 3000);
        homeBtn.click();
      } catch {}
    });

    controlPanel.mount(zenToggle, 2);
    controlPanel.mount(skipBtn, 2);
  }

  if (tombol) {
    tombol.addEventListener('click', async () => {
      const config = await getActiveConfig();
      const fs = config.formSkrining || {};
      const radioButtonKeywords =
        (fs.radioButtonKeywords && fs.radioButtonKeywords.split(';')) || [];
      const dropdownKeywords = (fs.dropdownKeywords && fs.dropdownKeywords.split(';')) || [];
      const pinneds = fs.pinneds || {};
      const excludes = [
        ...((fs.excludes && fs.excludes.split(';')) || []),
        ...Object.keys(pinneds),
      ];

      const radioCount = fillRadioButtons(radioButtonKeywords, excludes);
      const dropdownCount = await fillDropdowns(dropdownKeywords, excludes);
      const pinnedCount = await fillPinnedFields(pinneds);

      await incrementBatch({
        radio: radioCount + pinnedCount.radio,
        dropdown: dropdownCount + pinnedCount.dropdown,
        freetext: pinnedCount.freetext,
      });

      notify.info(
        'Selesai',
        `Berhasil, ${radioCount + pinnedCount.radio + dropdownCount + pinnedCount.dropdown + pinnedCount.freetext} ditemukan.`,
        2500,
      );

      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }

      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    });
    controlPanel.mount(tombol, 1);
    controlPanel.mount(profileIndicator, 4);
  }

  /**
   * @param {string[]} config - List of radioInput konfuguration
   * @param {string[]} skipList - List of data-name attributes to skip (e.g., ['LPMxxx|FRMxxx|PPMxxx|text'])
   */
  function fillRadioButtons(config, skipList = []) {
    const allMatchingLabels = Array.from(
      document.querySelectorAll('span.sd-item__control-label'),
    ).filter((span) => {
      const childViewerSpan = span.querySelector('span.sv-string-viewer');
      if (!childViewerSpan) return false;

      const text = childViewerSpan.textContent.trim();

      return config.includes(text);
    });

    let count = 0;

    allMatchingLabels.forEach((labelSpan) => {
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
          count++;
        }
      }
    });

    return count;
  }

  /**
   * @param {string[]} config - List of radioInput konfuguration
   * @param {string[]} skipList - List of data-name attributes to skip (e.g., ['LPMxxx|FRMxxx|PPMxxx|text'])
   */
  async function fillDropdowns(config, skipList = []) {
    const chevronButtons = Array.from(document.querySelectorAll('.sd-dropdown_chevron-button'));
    let count = 0;

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

      await new Promise((resolve) => setTimeout(resolve, 300));

      const visibleOptions = Array.from(
        document.querySelectorAll(
          '.sv-popup--dropdown .sv-string-viewer, .sv-popup--dropdown-overlay .sv-string-viewer',
        ),
      ).filter((option) => {
        const popup = option.closest('.sv-popup');
        return popup && popup.style.display !== 'none';
      });

      const targetOptionElement = visibleOptions.find((span) => {
        const text = span.textContent.trim();
        return config.includes(text);
      });

      if (targetOptionElement) {
        targetOptionElement.closest('.sv-list__item').click();
        count++;
        await new Promise((resolve) => setTimeout(resolve, 200));
      } else {
        chevronButton.click(); // Close drop down
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }

    return count;
  }

  /**
   * @param {boolean} enable - Toggle show or hide debug markers.
   */
  function showDebugInformation(enable) {
    const DEBUG_MARKER_CLASS = 'dandelion-debug-marker';

    if (enable) {
      const elementsWithDataName = document.querySelectorAll('[data-name]');

      elementsWithDataName.forEach((element) => {
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
      markers.forEach((marker) => marker.remove());
    }
  }
}
