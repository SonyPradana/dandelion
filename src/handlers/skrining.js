import bus from '../utils/hooks';
import { button } from '../components/button';
import { controlPanel } from '../components/controlPanel';
import { notify } from '../components/notification';
import { createProfileComponent } from '../components/profile';
import { debugButton } from '../components/debugButton';
import { debugMarker } from '../components/marker';
import {
  getAnswers,
  saveAnswers,
  isAnswerPinned,
  getSkriningExcludes,
  toggleSkriningExclude,
} from '../utils/skriningConfig';
import { store as globalStore } from '../store';

const MANUAL_TRIGGER_ID = 'dandelion-skrining-manual';
const DEBUG_MARKER_CLASS = 'dandelion-debug-marker';

export async function initializeSkrining(skriningConfig = {}, store = globalStore) {
  const answers = skriningConfig.answers || {};
  const excludes = new Set((skriningConfig.excludes || '').split(';').filter(Boolean));
  const radioClickedSet = new Set();
  let throttleTimeout = null;
  let observer = null;

  /**
   * Groups radios by name so a question is filled or skipped as one unit.
   * @param {NodeList} radios
   * @returns {Map<string, {key: string, options: HTMLInputElement[]}>}
   */
  function groupRadios(radios) {
    const groups = new Map();

    for (const radio of radios) {
      let group = groups.get(radio.name);
      if (!group) {
        group = { key: radio.id || `${radio.name}_${radio.value}`, options: [] };
        groups.set(radio.name, group);
      }
      group.options.push(radio);
    }

    return groups;
  }

  /**
   * A config entry only counts when its value matches a real radio option,
   * otherwise the question falls back to the legacy behaviour.
   * @param {{key: string, options: HTMLInputElement[]}} group
   * @returns {HTMLInputElement|null}
   */
  function resolveTarget(group) {
    const wanted = answers[group.key];
    if (!wanted) return null;

    return group.options.find((radio) => radio.value === wanted) ?? null;
  }

  /**
   * Fills questions without a usable config entry with the legacy behaviour
   * (click every unchecked radio, last option wins).
   * @param {Map<string, {key: string, options: HTMLInputElement[]}>} groups
   * @returns {number} How many radios were clicked.
   */
  function fillLegacy(groups) {
    let count = 0;

    for (const group of groups.values()) {
      if (excludes.has(group.key)) continue;
      if (resolveTarget(group)) continue;

      for (const radio of group.options) {
        const radioKey = radio.id || `${radio.name}_${radio.value}`;

        if (!radio.checked && !radioClickedSet.has(radioKey)) {
          radio.click();
          radioClickedSet.add(radioKey);
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Applies configured answers. Excluded questions win over answers.
   * @param {Map<string, {key: string, options: HTMLInputElement[]}>} groups
   * @returns {number} How many radios were clicked.
   */
  function fillFromConfig(groups) {
    let count = 0;

    for (const group of groups.values()) {
      if (excludes.has(group.key)) continue;

      const target = resolveTarget(group);
      if (!target) continue;
      if (target.checked) continue;

      target.click();
      radioClickedSet.add(target.id || `${target.name}_${target.value}`);
      count++;
    }

    return count;
  }

  /**
   * A question counts as done once its own radio group is settled: the
   * configured option is selected, or every option has been clicked.
   * @param {{key: string, options: HTMLInputElement[]}} group
   * @returns {boolean}
   */
  function isGroupDone(group) {
    const target = resolveTarget(group);
    if (target) return target.checked;

    return group.options.every(
      (radio) => radio.checked || radioClickedSet.has(radio.id || `${radio.name}_${radio.value}`),
    );
  }

  /**
   * @returns {number} How many radios were clicked.
   */
  function manipulateRadioButtons() {
    const allRadioButtons = document.querySelectorAll('input[type="radio"]');
    const groups = groupRadios(allRadioButtons);
    const count = fillLegacy(groups) + fillFromConfig(groups);

    if (count > 0) {
      bus.emit('skrining:didFill', { radio: count });
    }

    // Excluded questions are never filled, so they must not hold the observer open
    const fillable = [...groups.values()].filter((group) => !excludes.has(group.key));

    if (fillable.length > 0 && fillable.every(isGroupDone)) {
      stopObserver();
    }

    return count;
  }

  function runManualTrigger() {
    stopObserver();

    const filled = manipulateRadioButtons();

    notify.info(
      'Isi Radio',
      filled > 0 ? `Berhasil, ${filled} radio terisi.` : 'Tidak ada radio baru untuk diisi',
      2500,
    );
  }

  function throttledManipulate() {
    if (throttleTimeout) return;
    throttleTimeout = setTimeout(() => {
      manipulateRadioButtons();
      throttleTimeout = null;
    }, 200);
  }

  function startObserver() {
    if (observer) return;

    observer = new MutationObserver(() => throttledManipulate());
    observer.observe(document.body, { childList: true, subtree: true });
    throttledManipulate();
  }

  function stopObserver() {
    if (throttleTimeout) {
      clearTimeout(throttleTimeout);
      throttleTimeout = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  document.addEventListener('click', (event) => {
    if (!event.target) return;

    // Stop button
    if (event.target.id === 'btnBacktoHome1') {
      stopObserver();
      radioClickedSet.clear();
    }

    // Start button
    if (event.target.id === 'nextGenBtn') {
      startObserver();
    }

    // Manual trigger: fill once then stay off
    if (event.target.id === MANUAL_TRIGGER_ID) {
      runManualTrigger();
    }
  });

  /**
   * Adds or removes a pin toggle for the question, storing the currently
   * selected radio value.
   * @param {string} key - Radio id of the first option
   * @param {string|null} value - Currently checked radio value
   * @returns {Promise<boolean>} New pinned state.
   */
  async function togglePin(key, value) {
    const pinned = await isAnswerPinned(key, store);

    if (pinned) {
      const answers = await getAnswers(store);
      delete answers[key];
      await saveAnswers(answers, store);
      return false;
    }

    if (!value) {
      notify.alert('Pin Jawaban', 'Pilih salah satu jawaban radio terlebih dahulu');
      return false;
    }

    const answers = await getAnswers(store);
    answers[key] = value;
    await saveAnswers(answers, store);
    return true;
  }

  /**
   * @param {boolean} enable - Toggle show or hide the radio markers.
   */
  async function showDebugInformation(enable) {
    if (!enable) {
      document.querySelectorAll(`.${DEBUG_MARKER_CLASS}`).forEach((marker) => marker.remove());
      return;
    }

    const storedAnswers = await getAnswers(store);
    const excluded = new Set(await getSkriningExcludes(store));
    const groups = groupRadios(document.querySelectorAll('input[type="radio"]'));

    for (const group of groups.values()) {
      const host = group.options[0].closest('ul')?.closest('.question');
      if (!host || host.querySelector(`.${DEBUG_MARKER_CLASS}`)) continue;

      const getValue = () => group.options.find((radio) => radio.checked)?.value ?? null;

      host.style.position ||= 'relative';
      host.appendChild(
        debugMarker(group.key, {
          excludeToggle: {
            initialExcluded: excluded.has(group.key),
            onToggle: (id) => toggleSkriningExclude(id, store),
          },
          pinToggle: {
            initialPinned: Object.hasOwn(storedAnswers, group.key),
            getValue,
            onToggle: (id, value) => togglePin(id, value),
          },
        }),
      );
    }
  }

  const manualTrigger = button(MANUAL_TRIGGER_ID);
  if (manualTrigger) {
    controlPanel.mount(manualTrigger, 1);
  }

  let isDebugEnabled = false;
  const debugToggle = debugButton();
  debugToggle.addEventListener('click', () => {
    isDebugEnabled = !isDebugEnabled;
    showDebugInformation(isDebugEnabled);
  });
  controlPanel.mount(debugToggle, 2);

  const { profiles, activeProfile } = await store.getFullConfig();
  const profileIndicator = createProfileComponent({
    profiles,
    activeProfile,
    onSwitch: async (pKey) => {
      const confirmed = await notify.confirm(
        'Ganti Profil',
        'Halaman akan dimuat ulang. Jawaban yang sudah diisi akan hilang.',
      );
      if (!confirmed) return false;

      await store.onProfileSwitch(pKey);
    },
  });

  if (manualTrigger) {
    let hideTimeout = null;
    const showProfile = () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      profileIndicator.setVisibility(true);
    };
    const hideProfile = () => {
      hideTimeout = setTimeout(() => profileIndicator.setVisibility(false), 300);
    };

    manualTrigger.addEventListener('mouseenter', showProfile);
    manualTrigger.addEventListener('mouseleave', hideProfile);
    profileIndicator.addEventListener('mouseenter', showProfile);
    profileIndicator.addEventListener('mouseleave', hideProfile);
  }

  controlPanel.mount(profileIndicator, 4);
}
