const agreeCheckbox = document.getElementById('agree-checkbox');
const continueBtn = document.getElementById('continue-btn');

browser.storage.local.get('termsAgreed').then((result) => {
  if (result.termsAgreed) {
    agreeCheckbox.checked = true;
    continueBtn.disabled = false;
  }
});

agreeCheckbox.addEventListener('change', () => {
  continueBtn.disabled = !agreeCheckbox.checked;
});

continueBtn.addEventListener('click', () => {
  if (agreeCheckbox.checked) {
    browser.storage.local.set({ termsAgreed: true }).then(() => {
      console.log('Terms have been agreed to and saved to browser.storage.local.');
      window.close();
    });
  }
});
