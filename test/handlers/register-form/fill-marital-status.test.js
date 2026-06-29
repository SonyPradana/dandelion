import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fillStatusPernikahan } from '../../../src/handlers/register-form/fill-marital-status.js';

const html = readFileSync(resolve('test/__fixtures__/register-form/marital-status.html'), 'utf8');

function loadFixture() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  document.body.replaceChildren(...doc.body.children);
}

describe('fillStatusPernikahan', () => {
  beforeEach(() => {
    loadFixture();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('success — exact match', () => {
    it('should match "menikah"', async () => {
      expect(await fillStatusPernikahan('Menikah')).toBe(true);
    });

    it('should match "belum menikah"', async () => {
      expect(await fillStatusPernikahan('Belum Menikah')).toBe(true);
    });

    it('should match "cerai hidup"', async () => {
      expect(await fillStatusPernikahan('Cerai Hidup')).toBe(true);
    });

    it('should match "cerai mati"', async () => {
      expect(await fillStatusPernikahan('Cerai Mati')).toBe(true);
    });
  });

  describe('success flow', () => {
    it('should click trigger then option', async () => {
      const wrapper = document.querySelector('[show-icon-reset="false"]');
      const trigger = wrapper.querySelector('[class*="cursor-pointer"]:not(.absolute *)');
      const clickSpy = vi.spyOn(trigger, 'click');

      await fillStatusPernikahan('Menikah');
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('failure cases', () => {
    it('should return false for unrecognized value', { timeout: 15_000 }, async () => {
      const promise = fillStatusPernikahan('Unknown');
      await vi.advanceTimersByTimeAsync(5000);
      expect(await promise).toBe(false);
    });

    it('should return false when wrapper not found', async () => {
      document.body.replaceChildren(document.createElement('div'));
      expect(await fillStatusPernikahan('Menikah')).toBe(false);
    });

    it('should return false when trigger not found', async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('show-icon-reset', 'false');
      wrapper.className = 'w-full';
      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold';
      label.textContent = 'Status Pernikahan *';
      wrapper.appendChild(label);
      const container = document.createElement('div');
      container.className = 'relative';
      wrapper.appendChild(container);
      document.body.appendChild(wrapper);

      expect(await fillStatusPernikahan('Menikah')).toBe(false);
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
        label.textContent = 'Status Pernikahan *';
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

        const promise = fillStatusPernikahan('Menikah');
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

      expect(await fillStatusPernikahan('Menikah')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle lowercase input', async () => {
      expect(await fillStatusPernikahan('menikah')).toBe(true);
    });

    it('should handle extra whitespace', async () => {
      expect(await fillStatusPernikahan('  Menikah  ')).toBe(true);
    });

    it('should handle mixed case', async () => {
      expect(await fillStatusPernikahan('BELUM MENIKAH')).toBe(true);
    });
  });
});
