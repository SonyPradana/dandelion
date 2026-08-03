import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fillJenisKelaminWali } from '../../../src/handlers/register-form/fill-gender-wali.js';

const html = readFileSync(resolve('test/__fixtures__/register-form/gender-wali.html'), 'utf8');

function loadFixture() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  document.body.replaceChildren(...doc.body.children);
}

describe('fillJenisKelaminWali', () => {
  beforeEach(() => {
    loadFixture();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('alias normalization', () => {
    it('should match "laki-laki"', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('laki-laki', container)).toBe(true);
    });

    it('should match "perempuan"', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('perempuan', container)).toBe(true);
    });

    it('should match "pria" alias', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('pria', container)).toBe(true);
    });

    it('should match "wanita" alias', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('wanita', container)).toBe(true);
    });

    it('should match "l" shorthand', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('l', container)).toBe(true);
    });

    it('should match "lk"', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('lk', container)).toBe(true);
    });

    it('should match "pr"', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('pr', container)).toBe(true);
    });
  });

  describe('success flow — scoped within container', () => {
    it('should click trigger inside container, find option, and click it', async () => {
      const container = document.querySelector('.form-data-individu');
      const wrapper = container.querySelector('[show-icon-reset="false"]');
      const trigger = wrapper.querySelector('[class*="cursor-pointer"]:not(.absolute *)');
      const clickSpy = vi.spyOn(trigger, 'click');

      await fillJenisKelaminWali('laki-laki', container);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should click the correct option element', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('Perempuan', container)).toBe(true);
    });
  });

  describe('failure cases', () => {
    it('should return false for unrecognized value', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('unknown', container)).toBe(false);
    });

    it('should return false when container has no matching label', async () => {
      const empty = document.createElement('div');
      document.body.replaceChildren(empty);

      expect(await fillJenisKelaminWali('laki-laki', empty)).toBe(false);
    });

    it('should return false when container is null', async () => {
      expect(await fillJenisKelaminWali('laki-laki', null)).toBe(false);
    });

    it('should return false when trigger not found inside scoped wrapper', async () => {
      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.setAttribute('show-icon-reset', 'false');
      wrapper.className = 'w-full';

      const label = document.createElement('div');
      label.className = 'font-semibold text-xs';
      label.textContent = 'Jenis Kelamin *';
      wrapper.appendChild(label);

      const inner = document.createElement('div');
      inner.className = 'relative';
      wrapper.appendChild(inner);

      container.appendChild(wrapper);
      document.body.replaceChildren(container);

      expect(await fillJenisKelaminWali('laki-laki', container)).toBe(false);
    });

    it(
      'should return false when option not found within timeout',
      { timeout: 15_000 },
      async () => {
        const container = document.createElement('div');
        const wrapper = document.createElement('div');
        wrapper.setAttribute('show-icon-reset', 'false');
        wrapper.className = 'w-full';

        const label = document.createElement('div');
        label.className = 'font-semibold text-xs';
        label.textContent = 'Jenis Kelamin *';
        wrapper.appendChild(label);

        const inner = document.createElement('div');
        inner.className = 'relative';
        const trigger = document.createElement('div');
        trigger.className = 'cursor-pointer';
        trigger.textContent = 'Pilih';
        inner.appendChild(trigger);
        wrapper.appendChild(inner);

        const option = document.createElement('div');
        option.className = 'py-2 px-4 cursor-pointer text-sm';
        option.textContent = 'Something Else';
        wrapper.appendChild(option);

        container.appendChild(wrapper);
        document.body.replaceChildren(container);

        const promise = fillJenisKelaminWali('laki-laki', container);
        await vi.advanceTimersByTimeAsync(5000);
        expect(await promise).toBe(false);
      },
    );

    it('should return false when label text does not match', async () => {
      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.setAttribute('show-icon-reset', 'false');
      wrapper.className = 'w-full';
      const label = document.createElement('div');
      label.className = 'font-semibold text-xs';
      label.textContent = 'Other Label *';
      wrapper.appendChild(label);
      container.appendChild(wrapper);
      document.body.replaceChildren(container);

      expect(await fillJenisKelaminWali('laki-laki', container)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle value with extra whitespace', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('  Laki-Laki  ', container)).toBe(true);
    });

    it('should handle mixed case input', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('LAKI-LAKI', container)).toBe(true);
    });

    it('should ignore non-matching wrappers inside container', async () => {
      const container = document.querySelector('.form-data-individu');
      expect(await fillJenisKelaminWali('perempuan', container)).toBe(true);
    });
  });
});
