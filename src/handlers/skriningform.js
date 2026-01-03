import { button } from '../components/button';

/**
 * ⚠️ Legal / UX Notice:
 * This button only trigger local form filling.
 * The use must consciously press the button to perform the action.
 */
export function initializeSkriningForm () {
  const tombol = button('dandelion-auto-fill');

  if (tombol) {
    tombol.addEventListener('click', () => fillTidakRadioButtons());
    document.body.appendChild(tombol);
  }

  function fillTidakRadioButtons () {
    const allMatchingLabels = Array.from(document.querySelectorAll('span.sd-item__control-label')).filter(span => {
      const childViewerSpan = span.querySelector('span.sv-string-viewer');

      return childViewerSpan && (
        childViewerSpan.textContent.trim() === 'Menikah' ||
        childViewerSpan.textContent.trim() === 'Non disabilitas' ||
        childViewerSpan.textContent.trim() === 'Normal' ||
        childViewerSpan.textContent.trim() === 'Belum' ||
        childViewerSpan.textContent.trim() === 'Tidak' ||
        childViewerSpan.textContent.trim() === 'Tidak sama sekali' ||
        childViewerSpan.textContent.trim() === 'Belum'
      );
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
}
