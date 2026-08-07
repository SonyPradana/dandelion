import bus from '../utils/hooks';
import { registerCleanup } from '../refreshState.js';
import { ensureReloadButton } from '../components/reloadButton.js';

export function initializeSkrining() {
  const radioClickedSet = new Set();
  let throttleTimeout = null;
  let observer = null;

  function manipulateRadioButtons() {
    const allRadioButtons = document.querySelectorAll('input[type="radio"]');
    let count = 0;

    allRadioButtons.forEach((radio) => {
      const radioKey = radio.id || `${radio.name}_${radio.value}`;

      if (!radio.checked && radioClickedSet.has(radioKey) === false) {
        radio.click();
        radioClickedSet.add(radioKey);
        count++;
      }
    });

    if (count > 0) {
      bus.emit('skrining:didFill', { radio: count });
    }

    // Jika semua radio sudah pernah diklik, disconnect observer
    if (allRadioButtons.length > 0 && radioClickedSet.size >= allRadioButtons.length) {
      stopObserver();
    }
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
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function handleClick(event) {
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
  }

  document.addEventListener('click', handleClick);
  registerCleanup(() => {
    document.removeEventListener('click', handleClick);
    stopObserver();
  });

  ensureReloadButton();
}
