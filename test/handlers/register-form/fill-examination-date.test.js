import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fillTanggalPemeriksaan } from '../../../src/handlers/register-form/fill-examination-date.js';

function buildCalendar() {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative p-3 pt-2 border rounded-md bg-white shadow-gmail';

  const daysGrid = document.createElement('div');
  daysGrid.className = 'grid grid-cols-7 gap-1 mt-2';

  const days = [1, 2, 15, 30];
  for (const d of days) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'relative h-auto text-[12px] border rounded pt-[6px]';
    const span = document.createElement('span');
    span.className = 'font-bold text-[18px]';
    span.textContent = String(d);
    btn.appendChild(span);
    daysGrid.appendChild(btn);
  }

  wrapper.appendChild(daysGrid);
  return wrapper;
}

describe('fillTanggalPemeriksaan', () => {
  beforeEach(() => {
    document.body.replaceChildren(buildCalendar());
  });

  describe('success', () => {
    it('should return true when day 15 exists in calendar', () => {
      expect(fillTanggalPemeriksaan('15-06-2026')).toBe(true);
    });

    it('should click a button when day is found', () => {
      const clickSpy = vi.spyOn(HTMLButtonElement.prototype, 'click');
      fillTanggalPemeriksaan('15-06-2026');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should return true for day 1', () => {
      expect(fillTanggalPemeriksaan('01-06-2026')).toBe(true);
    });

    it('should return true for day 30', () => {
      expect(fillTanggalPemeriksaan('30-06-2026')).toBe(true);
    });
  });

  describe('default to today', () => {
    it("should return true when today's day exists in calendar", () => {
      const today = new Date();
      const day = today.getDate();
      const validDays = [1, 2, 15, 30];
      expect(fillTanggalPemeriksaan()).toBe(validDays.includes(day));
    });
  });

  describe('failure cases', () => {
    it('should return false when day not in calendar (day 7)', () => {
      expect(fillTanggalPemeriksaan('07-06-2026')).toBe(false);
    });

    it('should return false when no calendar in DOM', () => {
      document.body.replaceChildren(document.createElement('div'));
      expect(fillTanggalPemeriksaan('15-06-2026')).toBe(false);
    });

    it('should return false when span has no parent button', () => {
      document.body.replaceChildren();
      const span = document.createElement('span');
      span.className = 'font-bold text-[18px]';
      span.textContent = '15';
      document.body.appendChild(span);
      expect(fillTanggalPemeriksaan('15-06-2026')).toBe(false);
    });
  });
});
