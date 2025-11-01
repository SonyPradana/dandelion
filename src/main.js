console.log('Dandelion content script loaded!');

const radioClickedSet = new Set();
const observer = new MutationObserver(() => throttledManipulate());
let throttleTimeout = null;

function manipulateRadioButtons () {
  const allRadioButtons = document.querySelectorAll('input[type="radio"]');
  allRadioButtons.forEach(radio => {
    if (!radio.checked && radioClickedSet.has(radio.id) === false) {
      radio.click();
      radioClickedSet.add(radio.id);
    }
  });

  // Jika semua radio sudah pernah diklik, disconnect observer
  if (allRadioButtons.length > 0 && radioClickedSet.size >= allRadioButtons.length) {
    observer.disconnect();
    console.log('Dandelion: observer disconnected, semua radio sudah terisi.');
  }
}

// Throttle agar tidak terlalu sering dijalankan
function throttledManipulate () {
  if (throttleTimeout) return;
  throttleTimeout = setTimeout(() => {
    manipulateRadioButtons();
    throttleTimeout = null;
  }, 200);
}

document.addEventListener('click', (event) => {
  // stop and dump
  if (event.target && event.target.id === 'btnBacktoHome1') {
    console.log('Dandelion: Done we disconected observer server.');
    observer.disconnect();
  }

  // start
  if (event.target && event.target.id === 'nextGenBtn') {
    console.log('Dandelion: Done we disconected observer server.');
    observer.observe(document.body, { childList: true, subtree: true });
    throttledManipulate();
  }
});
