import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fillPekerjaan } from '../../../src/handlers/register-form/fill-occupation.js';

const html = readFileSync(resolve('test/__fixtures__/register-form/occupation.html'), 'utf8');

function loadFixture() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  document.body.replaceChildren(...doc.body.children);
}

describe('fillPekerjaan', () => {
  beforeEach(() => {
    loadFixture();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('success — exact match', () => {
    it('should match "Ibu Rumah Tangga"', async () => {
      expect(await fillPekerjaan('Ibu Rumah Tangga')).toBe(true);
    });

    it('should match "Karyawan Swasta"', async () => {
      expect(await fillPekerjaan('Karyawan Swasta')).toBe(true);
    });

    it('should match "Petani"', async () => {
      expect(await fillPekerjaan('Petani')).toBe(true);
    });
  });

  describe('success — partial match', () => {
    it('should match partial "Rumah" for "Ibu Rumah Tangga"', async () => {
      expect(await fillPekerjaan('Rumah')).toBe(true);
    });

    it('should match partial "PNS"', async () => {
      expect(await fillPekerjaan('PNS')).toBe(true);
    });

    it('should match partial "swasta" lowercase', async () => {
      expect(await fillPekerjaan('swasta')).toBe(true);
    });
  });

  describe('success flow', () => {
    it('should click trigger', async () => {
      const trigger = document.querySelector('[class*="cursor-pointer"]');
      const clickSpy = vi.spyOn(trigger, 'click');

      await fillPekerjaan('Ibu Rumah Tangga');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should click the correct modal button', async () => {
      const modalBtn = document.querySelector('.modal-content button');
      const clickSpy = vi.spyOn(modalBtn, 'click');

      await fillPekerjaan('Ibu Rumah Tangga');
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('failure cases', () => {
    it('should return false when wrapper not found', async () => {
      document.body.replaceChildren(document.createElement('div'));
      expect(await fillPekerjaan('Ibu Rumah Tangga')).toBe(false);
    });

    it('should return false when trigger not found', async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.className = 'w-full';
      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold';
      label.textContent = 'Pekerjaan *';
      wrapper.appendChild(label);
      document.body.appendChild(wrapper);

      expect(await fillPekerjaan('Ibu Rumah Tangga')).toBe(false);
    });

    it('should return false when modal never appears', { timeout: 15_000 }, async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.className = 'w-full';
      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold';
      label.textContent = 'Pekerjaan *';
      wrapper.appendChild(label);
      const trigger = document.createElement('div');
      trigger.className = 'cursor-pointer';
      trigger.textContent = 'Pilih';
      wrapper.appendChild(trigger);
      document.body.appendChild(wrapper);

      const promise = fillPekerjaan('Ibu Rumah Tangga');
      await vi.advanceTimersByTimeAsync(6000);
      expect(await promise).toBe(false);
    });

    it('should return false when no button matches in modal', { timeout: 15_000 }, async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.className = 'w-full';
      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold';
      label.textContent = 'Pekerjaan *';
      wrapper.appendChild(label);
      const trigger = document.createElement('div');
      trigger.className = 'cursor-pointer';
      trigger.textContent = 'Pilih';
      wrapper.appendChild(trigger);
      document.body.appendChild(wrapper);

      const modal = document.createElement('div');
      modal.className = 'modal-content';
      const btn = document.createElement('button');
      btn.textContent = 'Something Else';
      modal.appendChild(btn);
      document.body.appendChild(modal);

      const promise = fillPekerjaan('Ibu Rumah Tangga');
      await vi.advanceTimersByTimeAsync(6000);
      expect(await promise).toBe(false);
    });

    it('should return false when label does not match', async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.className = 'w-full';
      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold';
      label.textContent = 'Other Label *';
      wrapper.appendChild(label);
      document.body.appendChild(wrapper);

      expect(await fillPekerjaan('Ibu Rumah Tangga')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle mixed case input', async () => {
      expect(await fillPekerjaan('ibu rumah tangga')).toBe(true);
    });

    it('should handle extra whitespace', async () => {
      expect(await fillPekerjaan('  Ibu Rumah Tangga  ')).toBe(true);
    });
  });
});
