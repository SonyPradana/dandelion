import { button } from '../components/button';

/**
 * ⚠️ Legal / UX Notice:
 * This button only trigger local form filling.
 * The use must consciously press the button to perform the action.
 */
export function initializeSkriningForm () {
  const tombol = button('dandelion-auto-fill');

  if (tombol) {
    tombol.addEventListener('click', () => {
      fillTidakRadioButtons();
      fillSpecificDropdownsByText();
    });
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

  function fillSpecificDropdownsByText () {
    const dropdownInputs = Array.from(document.querySelectorAll('.sd-dropdown[role="combobox"]'));

    dropdownInputs.forEach(dropdownInput => {
      dropdownInput.click();

      setTimeout(() => {
        const allOptions = Array.from(document.querySelectorAll('.sv-popup__container .sv-string-viewer'));

        const targetOptionElement = allOptions.find(span =>
          span.textContent.trim() === 'Mandiri' ||
          span.textContent.trim() === 'Tidak' ||
          span.textContent.trim() === 'Normal' ||
          span.textContent.trim() === 'SADANIS'
        );

        if (targetOptionElement) {
          targetOptionElement.closest('.sd-list__item').click();
        } else {
          dropdownInput.click(); // Close if no matching option was found
        }
      }, 100);
    });
  }
}
