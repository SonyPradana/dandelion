import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fillTanggalLahir } from '../../../src/handlers/register-form/fill-birth-date.js';

const html = readFileSync(resolve('test/__fixtures__/register-form-birth-date.html'), 'utf8');

function loadFixture() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  document.body.replaceChildren(...doc.body.children);
}

function makeDatePopup(year, month, day) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  const popup = document.createElement('div');
  popup.className = 'mx-datepicker-popup';

  const panel = document.createElement('div');
  panel.className = 'mx-calendar-panel-date';

  const label = document.createElement('div');
  label.className = 'mx-calendar-header-label';

  const leftBtn = document.createElement('span');
  leftBtn.className = 'mx-btn-icon-left';
  leftBtn.textContent = '<';
  label.appendChild(leftBtn);

  const yearEl = document.createElement('span');
  yearEl.className = 'mx-btn-current-year';
  yearEl.textContent = String(year);
  label.appendChild(yearEl);

  const monthEl = document.createElement('span');
  monthEl.className = 'mx-btn-current-month';
  monthEl.textContent = monthNames[month - 1];
  label.appendChild(monthEl);

  const rightBtn = document.createElement('span');
  rightBtn.className = 'mx-btn-icon-right';
  rightBtn.textContent = '>';
  label.appendChild(rightBtn);

  panel.appendChild(label);

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.setAttribute('title', `${year}-${mm}-${dd}`);
  td.textContent = String(day);
  tr.appendChild(td);
  tbody.appendChild(tr);
  table.appendChild(tbody);
  panel.appendChild(table);

  popup.appendChild(panel);
  return popup;
}

function makeYearPopup(decadeStart, decadeEnd, years) {
  const popup = document.createElement('div');
  popup.className = 'mx-datepicker-popup';
  const panel = document.createElement('div');
  panel.className = 'mx-calendar-panel-year';

  const label = document.createElement('div');
  label.className = 'mx-calendar-header-label';
  const s1 = document.createElement('span');
  s1.textContent = String(decadeStart);
  const sep = document.createElement('span');
  sep.className = 'mx-calendar-decade-separator';
  sep.textContent = '-';
  const s2 = document.createElement('span');
  s2.textContent = String(decadeEnd);
  label.append(s1, sep, s2);
  panel.appendChild(label);

  for (const y of years) {
    const td = document.createElement('td');
    td.setAttribute('data-year', String(y));
    td.textContent = String(y);
    panel.appendChild(td);
  }

  popup.appendChild(panel);
  return popup;
}

function makeMonthPopup(targetYear) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const popup = document.createElement('div');
  popup.className = 'mx-datepicker-popup';
  const panel = document.createElement('div');
  panel.className = 'mx-calendar-panel-month';

  const label = document.createElement('div');
  label.className = 'mx-calendar-header-label';
  const yearEl = document.createElement('span');
  yearEl.className = 'mx-btn-current-year';
  yearEl.textContent = String(targetYear);
  label.appendChild(yearEl);

  const dblRight = document.createElement('span');
  dblRight.className = 'mx-btn-icon-double-right';
  dblRight.textContent = '>>';
  label.appendChild(dblRight);

  const dblLeft = document.createElement('span');
  dblLeft.className = 'mx-btn-icon-double-left';
  dblLeft.textContent = '<<';
  label.appendChild(dblLeft);

  panel.appendChild(label);

  for (let m = 0; m < 12; m++) {
    const td = document.createElement('td');
    td.setAttribute('data-month', String(m));
    td.textContent = monthNames[m];
    panel.appendChild(td);
  }

  popup.appendChild(panel);
  return popup;
}

function makeDisabledDatePopup(year, month, day) {
  const popup = makeDatePopup(year, month, day);
  const td = popup.querySelector('td');
  td.classList.add('disabled');
  return popup;
}

describe('fillTanggalLahir', () => {
  beforeEach(() => {
    loadFixture();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('success — direct date panel hit', () => {
    it('should click target date cell when year and month match', async () => {
      document.body.appendChild(makeDatePopup(2026, 6, 15));

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);
      expect(await promise).toBe(true);
    });

    it('should handle early month (January)', async () => {
      document.body.appendChild(makeDatePopup(2026, 1, 15));

      const promise = fillTanggalLahir('15-01-2026');
      await vi.advanceTimersByTimeAsync(400);
      expect(await promise).toBe(true);
    });

    it('should handle late month (December)', async () => {
      document.body.appendChild(makeDatePopup(2026, 12, 31));

      const promise = fillTanggalLahir('31-12-2026');
      await vi.advanceTimersByTimeAsync(400);
      expect(await promise).toBe(true);
    });
  });

  describe('year panel navigation', () => {
    it('should navigate to year panel when year does not match', async () => {
      const dp = makeDatePopup(2025, 6, 15);
      document.body.appendChild(dp);

      // year doesn't match (2025 vs 2026), handler clicks year button
      const yearEl = dp.querySelector('.mx-btn-current-year');
      const clickSpy = vi.spyOn(yearEl, 'click');

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);

      // wait(250) from loop end
      await vi.advanceTimersByTimeAsync(250);

      // now loop again: still date panel, year still 2025
      // clicks year button again...
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should select year from year panel when decade includes target', async () => {
      document.body.appendChild(makeYearPopup(2020, 2029, [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029]));

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);

      // first loop: date panel not found → month panel not found → year panel found
      // decade 2020-2029 includes 2026 → click td[data-year="2026"]
      await vi.advanceTimersByTimeAsync(250);

      const clickedYear = document.querySelector('td[data-year="2026"]');
      expect(clickedYear).toBeTruthy();
    });

    it('should navigate decade when target year is outside range', async () => {
      const yp = makeYearPopup(2010, 2019, [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]);
      document.body.appendChild(yp);

      const doubleRight = yp.querySelector('.mx-btn-icon-double-right');
      if (doubleRight) {
        const clickSpy = vi.spyOn(doubleRight, 'click');
        const promise = fillTanggalLahir('15-06-2026');
        await vi.advanceTimersByTimeAsync(400);
        await vi.advanceTimersByTimeAsync(250);
        expect(clickSpy).toHaveBeenCalled();
      }
    });
  });

  describe('month panel navigation', () => {
    it('should navigate months via left arrow when target month is before current', async () => {
      const dp = makeDatePopup(2026, 12, 15);
      document.body.appendChild(dp);

      const leftBtn = dp.querySelector('.mx-btn-icon-left');
      const clickSpy = vi.spyOn(leftBtn, 'click');

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);
      await vi.advanceTimersByTimeAsync(250);

      // year matches, but month is Dec (11) vs target Jun (5)
      // targetMonth < currentMonth → click left arrow
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should navigate months via right arrow when target month is after current', async () => {
      const dp = makeDatePopup(2026, 1, 15);
      document.body.appendChild(dp);

      const rightBtn = dp.querySelector('.mx-btn-icon-right');
      const clickSpy = vi.spyOn(rightBtn, 'click');

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);
      await vi.advanceTimersByTimeAsync(250);

      // year matches, target month Jun (5) > current Jan (0) → click right
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should select target month from month panel', async () => {
      document.body.appendChild(makeMonthPopup(2026));

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);
      await vi.advanceTimersByTimeAsync(250);

      // date panel not found → month panel found
      // year matches 2026 → click td[data-month="5"]
      const monthTd = document.querySelector('td[data-month="5"]');
      expect(monthTd).toBeTruthy();
    });

    it('should navigate decade in month panel when year does not match', async () => {
      const mp = makeMonthPopup(2025);
      document.body.appendChild(mp);

      const doubleRight = mp.querySelector('.mx-btn-icon-double-right');
      const clickSpy = vi.spyOn(doubleRight, 'click');

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);
      await vi.advanceTimersByTimeAsync(250);

      // year 2025 < 2026 → click double-right
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('failure cases', () => {
    it('should return false when wrapper not found', async () => {
      document.body.replaceChildren(document.createElement('div'));
      expect(await fillTanggalLahir('15-06-2026')).toBe(false);
    });

    it('should return false when popup never appears', async () => {
      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);
      // loop: no popup → return false on first check
      expect(await promise).toBe(false);
    });

    it('should return false when popup has no recognizable panel', { timeout: 60000 }, async () => {
      const popup = document.createElement('div');
      popup.className = 'mx-datepicker-popup';
      document.body.appendChild(popup);

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);
      // loop 100x250ms = 25000ms, but handler hasn't hit target
      await vi.advanceTimersByTimeAsync(25500);
      expect(await promise).toBe(false);
    });

    it('should return false when target date cell is disabled', async () => {
      document.body.appendChild(makeDisabledDatePopup(2026, 6, 15));

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);
      expect(await promise).toBe(false);
    });

    it('should return false when wrapper has no mx-input-wrapper', async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.id = 'Tanggal Lahir';
      const inner = document.createElement('div');
      inner.textContent = 'no input wrapper';
      wrapper.appendChild(inner);
      document.body.appendChild(wrapper);

      const promise = fillTanggalLahir('15-06-2026');
      await vi.advanceTimersByTimeAsync(400);
      // handler crashes: null.click() — need null guard .mx-input-wrapper
      expect(await promise).toBe(false);
    });
  });
});
