import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fillJenisKelamin } from '../../../src/handlers/register-form/fill-gender.js';

const html = readFileSync(resolve('test/__fixtures__/register-form/gender.html'), 'utf8');

function loadFixture() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  document.body.replaceChildren(...doc.body.children);
}

describe('fillJenisKelamin', () => {
  beforeEach(() => {
    loadFixture();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('alias normalization', () => {
    it('should match "laki-laki"', async () => {
      expect(await fillJenisKelamin('laki-laki')).toBe(true);
    });

    it('should match "perempuan"', async () => {
      expect(await fillJenisKelamin('perempuan')).toBe(true);
    });

    it('should match "pria" alias', async () => {
      expect(await fillJenisKelamin('pria')).toBe(true);
    });

    it('should match "wanita" alias', async () => {
      expect(await fillJenisKelamin('wanita')).toBe(true);
    });

    it('should match "l" shorthand', async () => {
      expect(await fillJenisKelamin('l')).toBe(true);
    });
  });

  describe('success flow', () => {
    it('should click trigger, find option, and click it', async () => {
      const wrapper = document.querySelector('[show-icon-reset="false"]');
      const trigger = wrapper.querySelector('[class*="cursor-pointer"]:not(.absolute *)');
      const clickSpy = vi.spyOn(trigger, 'click');

      await fillJenisKelamin('laki-laki');

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should click the correct option element', async () => {
      expect(await fillJenisKelamin('Perempuan')).toBe(true);
    });
  });

  describe('failure cases', () => {
    it('should return false for unrecognized value', async () => {
      expect(await fillJenisKelamin('unknown')).toBe(false);
    });

    it('should return false when wrapper not found', async () => {
      document.body.replaceChildren(document.createElement('div'));
      expect(await fillJenisKelamin('laki-laki')).toBe(false);
    });

    it('should return false when trigger not found', async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('show-icon-reset', 'false');
      wrapper.className = 'w-full';

      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold text-xs';
      label.textContent = 'Jenis Kelamin *';
      wrapper.appendChild(label);

      const container = document.createElement('div');
      container.className = 'relative';
      wrapper.appendChild(container);

      document.body.appendChild(wrapper);

      expect(await fillJenisKelamin('laki-laki')).toBe(false);
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
        label.className = 'mb-1 font-semibold text-xs';
        label.textContent = 'Jenis Kelamin *';
        wrapper.appendChild(label);

        const container = document.createElement('div');
        container.className = 'relative';
        const trigger = document.createElement('div');
        trigger.className = 'cursor-pointer';
        trigger.textContent = 'Pilih';
        container.appendChild(trigger);
        wrapper.appendChild(container);

        const option = document.createElement('div');
        option.className = 'py-2 px-4 cursor-pointer text-sm';
        option.textContent = 'Something Else';
        wrapper.appendChild(option);

        document.body.appendChild(wrapper);

        const promise = fillJenisKelamin('laki-laki');
        await vi.advanceTimersByTimeAsync(5000);
        expect(await promise).toBe(false);
      },
    );

    it('should return false when label text does not match', async () => {
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.setAttribute('show-icon-reset', 'false');
      wrapper.className = 'w-full';
      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold text-xs';
      label.textContent = 'Other Label *';
      wrapper.appendChild(label);
      document.body.appendChild(wrapper);

      expect(await fillJenisKelamin('laki-laki')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle value with extra whitespace', async () => {
      expect(await fillJenisKelamin('  Laki-Laki  ')).toBe(true);
    });

    it('should handle mixed case input', async () => {
      expect(await fillJenisKelamin('LAKI-LAKI')).toBe(true);
    });

    it('should ignore non-matching wrappers', async () => {
      loadFixture();
      expect(await fillJenisKelamin('perempuan')).toBe(true);
    });
  });
});
