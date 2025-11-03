tambahTombol();

function tambahTombol () {
  const id = 'dandelion-auto-fill';
  if (document.querySelector(`#${id}`)) {
    return;
  }

  const tombol = document.createElement('button');
  tombol.id = id;
  tombol.innerHTML = '💩';
  tombol.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    padding: 10px 20px;
    background: #FDFF99;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  `;

  tombol.addEventListener('click', function () {
    fillTidakRadioButtons();
  });

  document.body.appendChild(tombol);
}

function fillTidakRadioButtons () {
  const allMatchingLabels = Array.from(document.querySelectorAll('span.sd-item__control-label')).filter(span => {
    const childViewerSpan = span.querySelector('span.sv-string-viewer');
    return childViewerSpan &&
    (childViewerSpan.textContent.trim() === 'Tidak' ||
    childViewerSpan.textContent.trim() === 'Tidak sama sekali' ||
    childViewerSpan.textContent.trim() === 'Belum');
  });

  allMatchingLabels.forEach(labelSpan => {
    const parentLabel = labelSpan.closest('label.sd-selectbase__label');
    if (parentLabel) {
      const fieldset = parentLabel.closest('fieldset.sd-selectbase');
      if (fieldset) {
        const anyChecked = fieldset.querySelector('input[type="radio"]:checked');
        if (!anyChecked) {
          const radioInput = parentLabel.querySelector('input[type="radio"]');
          if (radioInput && !radioInput.checked) {
            radioInput.click();
          }
        }
      }
    }
  });
}
