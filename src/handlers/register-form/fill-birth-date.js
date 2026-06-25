const MONTH_MAP = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mei: 4,
  jun: 5,
  jul: 6,
  agt: 7,
  sep: 8,
  okt: 9,
  nov: 10,
  des: 11,
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function monthTextToIndex(text) {
  const key = text.trim().toLowerCase().slice(0, 3);
  return MONTH_MAP[key];
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fillTanggalLahir(value) {
  const [dd, mm, yyyy] = value.split('-').map(Number);
  const targetMonth = mm - 1;

  const wrapper = document.getElementById('Tanggal Lahir');
  if (!wrapper) return false;

  wrapper.querySelector('.mx-input-wrapper').click();
  await wait(400);

  const popup = () => document.querySelector('.mx-datepicker-popup');

  let attempts = 0;
  while (attempts < 100) {
    attempts++;

    const currentPopup = popup();
    if (!currentPopup) return false;

    const datePanel = currentPopup.querySelector('.mx-calendar-panel-date');
    if (datePanel) {
      const yearText = datePanel.querySelector('.mx-btn-current-year')?.textContent;
      const monthText = datePanel.querySelector('.mx-btn-current-month')?.textContent;
      if (!yearText || !monthText) return false;

      const currentYear = parseInt(yearText);
      const currentMonth = monthTextToIndex(monthText);

      if (currentYear === yyyy && currentMonth === targetMonth) {
        const selector = `td[title="${yyyy}-${pad(mm)}-${pad(dd)}"]`;
        const targetCell = datePanel.querySelector(selector);
        if (targetCell && !targetCell.classList.contains('disabled')) {
          targetCell.click();
          return true;
        }
        return false;
      }

      if (currentYear !== yyyy) {
        datePanel.querySelector('.mx-btn-current-year')?.click();
      } else if (currentMonth < targetMonth) {
        datePanel.querySelector('.mx-btn-icon-right')?.click();
      } else {
        datePanel.querySelector('.mx-btn-icon-left')?.click();
      }
    } else if (currentPopup.querySelector('.mx-calendar-panel-month')) {
      const monthPanel = currentPopup.querySelector('.mx-calendar-panel-month');
      const yearText = monthPanel.querySelector('.mx-btn-current-year')?.textContent;
      if (!yearText) return false;
      const currentYear = parseInt(yearText);

      if (currentYear === yyyy) {
        monthPanel.querySelector(`td[data-month="${targetMonth}"]`)?.click();
      } else if (currentYear < yyyy) {
        monthPanel.querySelector('.mx-btn-icon-double-right')?.click();
      } else {
        monthPanel.querySelector('.mx-btn-icon-double-left')?.click();
      }
    } else if (currentPopup.querySelector('.mx-calendar-panel-year')) {
      const yearPanel = currentPopup.querySelector('.mx-calendar-panel-year');
      const headerSpans = yearPanel.querySelectorAll(
        '.mx-calendar-header-label span:not(.mx-calendar-decade-separator)',
      );
      const decadeStart = parseInt(headerSpans[0]?.textContent);
      const decadeEnd = parseInt(headerSpans[1]?.textContent);

      if (decadeStart <= yyyy && yyyy <= decadeEnd) {
        yearPanel.querySelector(`td[data-year="${yyyy}"]`)?.click();
      } else if (yyyy < decadeStart) {
        yearPanel.querySelector('.mx-btn-icon-double-left')?.click();
      } else {
        yearPanel.querySelector('.mx-btn-icon-double-right')?.click();
      }
    }

    await wait(250);
  }

  return false;
}
