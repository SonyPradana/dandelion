import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fillPenyandangDisabilitas } from '../../../src/handlers/register-form/fill-disability.js';

const html = readFileSync(resolve('test/__fixtures__/register-form/disability.html'), 'utf8');

function loadFixture() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  document.body.replaceChildren(...doc.body.children);
}

describe('fillPenyandangDisabilitas', () => {
  beforeEach(() => {
    loadFixture();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('success — exact match', () => {
    it('should match "Tidak memiliki disabilitas"', async () => {
      expect(await fillPenyandangDisabilitas('Tidak memiliki disabilitas')).toBe(true);
    });

    it('should match "Disabilitas fisik"', async () => {
      expect(await fillPenyandangDisabilitas('Disabilitas fisik')).toBe(true);
    });

    it('should match "Disabilitas intelektual"', async () => {
      expect(await fillPenyandangDisabilitas('Disabilitas intelektual')).toBe(true);
    });

    it('should match "Disabilitas mental"', async () => {
      expect(await fillPenyandangDisabilitas('Disabilitas mental')).toBe(true);
    });

    it('should match "Disabilitas sensorik"', async () => {
      expect(await fillPenyandangDisabilitas('Disabilitas sensorik')).toBe(true);
    });
  });

  describe('success flow', () => {
    it('should click trigger then option', async () => {
      const wrapper = document.querySelector('[show-icon-reset="false"]');
      const trigger = wrapper.querySelector('[class*="cursor-pointer"]:not(.absolute *)');
      const clickSpy = vi.spyOn(trigger, 'click');

      await fillPenyandangDisabilitas('Tidak memiliki disabilitas');
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('failure cases', () => {
    it('should return false for unrecognized value', { timeout: 15_000 }, async () => {
      const promise = fillPenyandangDisabilitas('Unknown');
      await vi.advanceTimersByTimeAsync(5000);
      expect(await promise).toBe(false);
    });

    it('should return false when wrapper not found', async () => {
      document.body.replaceChildren(document.createElement('div'));
      expect(await fillPenyandangDisabilitas('Tidak memiliki disabilitas')).toBe(false);
    });

    it('should return false when trigger not found', async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('show-icon-reset', 'false');
      wrapper.className = 'w-full';
      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold';
      label.textContent = 'Penyandang disabilitas *';
      wrapper.appendChild(label);
      const container = document.createElement('div');
      container.className = 'relative';
      wrapper.appendChild(container);
      document.body.appendChild(wrapper);

      expect(await fillPenyandangDisabilitas('Tidak memiliki disabilitas')).toBe(false);
    });

    it(
      'should return false when option not found within timeout',
      { timeout: 15_000 },
      async () => {
        document.body.replaceChildren();
        const wrapper = document.createElement('div');
        wrapper.setAttribute('show-icon-reset', 'false');
        wrapper.className = 'w-full';
        const label = document.createElement('div');
        label.className = 'mb-1 font-semibold';
        label.textContent = 'Penyandang disabilitas *';
        wrapper.appendChild(label);
        const container = document.createElement('div');
        container.className = 'relative';
        const trigger = document.createElement('div');
        trigger.className = 'cursor-pointer';
        trigger.textContent = 'Pilih';
        container.appendChild(trigger);
        wrapper.appendChild(container);

        const opt = document.createElement('div');
        opt.className = 'py-2 px-4 cursor-pointer text-sm';
        opt.textContent = 'Something Else';
        wrapper.appendChild(opt);
        document.body.appendChild(wrapper);

        const promise = fillPenyandangDisabilitas('Tidak memiliki disabilitas');
        await vi.advanceTimersByTimeAsync(5000);
        expect(await promise).toBe(false);
      },
    );

    it('should return false when label does not match', async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('show-icon-reset', 'false');
      wrapper.className = 'w-full';
      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold';
      label.textContent = 'Other Label *';
      wrapper.appendChild(label);
      document.body.appendChild(wrapper);

      expect(await fillPenyandangDisabilitas('Tidak memiliki disabilitas')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle lowercase input', async () => {
      expect(await fillPenyandangDisabilitas('tidak memiliki disabilitas')).toBe(true);
    });

    it('should handle extra whitespace', async () => {
      expect(await fillPenyandangDisabilitas('  Tidak memiliki disabilitas  ')).toBe(true);
    });
  });
});
