import { button } from '../components/button';
import { store } from '../store';
import { getFullConfig, getActiveConfig } from '../configuration';
import { isExcluded, toggleExclude } from '../utils/excludes';
import { isPinned, addPinnedItem, removePinnedItem } from '../utils/pinneds';
import { debugMarker } from '../components/marker';
import { debugButton } from '../components/debugButton';
import { fillPinnedFields } from './skriningform/fill-pinned-fields';
import { zenModeButton } from '../components/zenModeButton';
import { skipButton } from '../components/skipButton';
import { waitForElement } from './inspection/not-checked-utils';
import { isZenModeActive, clearZenMode, skipQueue } from '../utils/zenMode';
import { clearFlashData } from '../utils/flashSession';
import { controlPanel } from '../components/controlPanel';
import { createProfileComponent } from '../components/profile';
import bus from '../utils/hooks';
import { notify } from '../components/notification';

/**
 * ⚠️ Legal / UX Notice:
 * This button only triggers local form filling.
 * The user must consciously press the button to perform the action.
 *
 * Zen Mode Asist auto-fill is optional and can be disabled in settings.
 * The countdown can be dismissed or overridden by manually pressing the button,
 * so the user always retains control over the action.
 */
export async function initializeSkriningForm(flashData = {}) {
  let isDebugEnabled = false; // Initial state is off
  let dismissCountdown = null;

  const tombol = button('dandelion-auto-fill');
  const fullConfig = await getFullConfig();
  const profileIndicator = createProfileComponent({
    profiles: fullConfig.profiles,
    activeProfile: fullConfig.activeProfile,
  });
  bus.on('component:profile:switch', async ({ profileKey }) => {
    await store.setActiveProfile(profileKey);
  });
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
      await clearFlashData();
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

    const activeConfig = await getActiveConfig();
    const zenConfig = activeConfig.zenMode || {};
    if (zenConfig.enabled !== false) {
      const timeout = Math.min(30_000, Math.max(500, zenConfig.timeout || 5000));
      const cd = notify.countdown('Zen Mode Asist', '⏳ menunggu...', timeout);
      dismissCountdown = cd.dismiss;
      cd.promise.then(async (result) => {
        dismissCountdown = null;
        if (result) {
          await performFormFill();
        }
      });
    }
  }

  if (flashData.pinneds && Object.keys(flashData.pinneds).length > 0) {
    notify.info('Flash Data', 'Flash data active for this session', 2500);
  }

  async function performFormFill() {
    if (dismissCountdown) {
      dismissCountdown();
      dismissCountdown = null;
    }

    const config = await getActiveConfig();
    const fs = config.formSkrining || {};
    const radioButtonKeywords = (fs.radioButtonKeywords && fs.radioButtonKeywords.split(';')) || [];
    const dropdownKeywords = (fs.dropdownKeywords && fs.dropdownKeywords.split(';')) || [];

    const configPinneds = Object.fromEntries(
      Object.entries(fs.pinneds || {}).filter(([k]) => !k.includes('|number')),
    );
    const pinneds = { ...configPinneds, ...flashData.pinneds };
    const excludes = [...((fs.excludes && fs.excludes.split(';')) || []), ...Object.keys(pinneds)];

    const result = await processWithRecursion(
      radioButtonKeywords,
      dropdownKeywords,
      pinneds,
      excludes,
    );

    bus.emit('skriningForm:didFill', { result });
  }

  if (tombol) {
    tombol.addEventListener('click', performFormFill);
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
        let dataName = null;
        if (questionElement) {
          dataName = questionElement.getAttribute('data-name');
          if (skipList.includes(dataName)) {
            return;
          }
        }

        const radioInput = parentLabel.querySelector('input[type="radio"]');
        if (radioInput && !radioInput.checked) {
          radioInput.click();
          if (dataName) skipList.push(dataName);
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
      let dataName = null;

      if (questionElement) {
        dataName = questionElement.getAttribute('data-name');
        if (skipList.includes(dataName)) {
          continue;
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
        if (dataName) skipList.push(dataName);
        count++;
        await new Promise((resolve) => setTimeout(resolve, 200));
      } else {
        chevronButton.click(); // Close drop down
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }

    return count;
  }

  async function processWithRecursion(radioKw, dropdownKw, pinneds, excludes) {
    let radioTotal = 0;
    let dropdownTotal = 0;
    let freetextTotal = 0;
    const MAX_ROUNDS = 2;
    const DELAY = 300;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const prevCount = document.querySelectorAll('[data-name]').length;

      const radioCount = fillRadioButtons(radioKw, excludes);
      const dropdownCount = await fillDropdowns(dropdownKw, excludes);
      const pinnedCount = await fillPinnedFields(pinneds);

      radioTotal += radioCount;
      dropdownTotal += dropdownCount;
      if (round === 0) {
        radioTotal += pinnedCount.radio;
        dropdownTotal += pinnedCount.dropdown;
        freetextTotal += pinnedCount.freetext;
      }

      if (radioCount === 0 && dropdownCount === 0) break;

      await new Promise((resolve) => setTimeout(resolve, DELAY));

      const newCount = document.querySelectorAll('[data-name]').length;
      if (newCount <= prevCount) break;
    }

    return {
      radio: radioTotal,
      dropdown: dropdownTotal,
      freetext: freetextTotal,
      total: radioTotal + dropdownTotal + freetextTotal,
    };
  }

  /**
   * @param {boolean} enable - Toggle show or hide debug markers.
   */
  async function showDebugInformation(enable) {
    const DEBUG_MARKER_CLASS = 'dandelion-debug-marker';

    if (enable) {
      const elementsWithDataName = document.querySelectorAll('[data-name]');

      const markersData = [];

      for (const element of elementsWithDataName) {
        if (element.querySelector(`.${DEBUG_MARKER_CLASS}`)) {
          continue;
        }

        const dataName = element.getAttribute('data-name');

        let initialExcluded = false;
        let initialPinned = false;
        try {
          [initialExcluded, initialPinned] = await Promise.all([
            isExcluded(dataName),
            isPinned(dataName),
          ]);
        } catch (error) {
          console.error('Failed to fetch initial marker state:', error);
        }

        markersData.push({ element, dataName, initialExcluded, initialPinned });
      }

      for (const { element, dataName, initialExcluded, initialPinned } of markersData) {
        const marker = debugMarker(dataName, {
          excludeToggle: {
            initialExcluded,
            onToggle: (id) => toggleExclude(id),
          },
          pinToggle: {
            initialPinned,
            onToggle: async (id, value) => {
              const pinned = await isPinned(id);
              if (pinned) {
                await removePinnedItem(id);
              } else if (value !== null) {
                await addPinnedItem(id, value);
              }
              return !pinned;
            },
          },
        });

        if (window.getComputedStyle(element).position === 'static') {
          element.style.position = 'relative';
        }

        element.appendChild(marker);
      }
    } else {
      const markers = document.querySelectorAll(`.${DEBUG_MARKER_CLASS}`);
      markers.forEach((marker) => marker.remove());
    }
  }
}
