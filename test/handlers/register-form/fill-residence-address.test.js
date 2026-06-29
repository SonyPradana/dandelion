import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fillAlamatDomisili } from '../../../src/handlers/register-form/fill-residence-address.js';

const html = readFileSync(resolve('test/__fixtures__/register-form/address.html'), 'utf8');

function loadFixture() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  document.body.replaceChildren(...doc.body.children);
}

function makeModal(subtitle, buttons) {
  const modal = document.createElement('div');
  modal.className = 'modal-content';

  const sub = document.createElement('div');
  sub.textContent = subtitle;
  modal.appendChild(sub);

  for (const label of buttons) {
    const btn = document.createElement('button');
    btn.textContent = label;
    modal.appendChild(btn);
  }

  return modal;
}

describe('fillAlamatDomisili', () => {
  beforeEach(() => {
    loadFixture();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('success — all 4 levels', () => {
    it('should complete when modal content swaps sequentially', async () => {
      const l1 = makeModal('Daftar Provinsi', ['Jawa Tengah', 'Jawa Timur']);
      document.body.appendChild(l1);

      // On next tick after level 1 button click, swap to level 2
      setTimeout(() => {
        l1.replaceChildren(
          ...makeModal('Daftar Kabupaten/Kota', ['Kab. Semarang', 'Kab. Kendal']).childNodes,
        );
      }, 50);

      // Then level 3
      setTimeout(() => {
        l1.replaceChildren(
          ...makeModal('Daftar Kecamatan', ['Ungaran Barat', 'Ungaran Timur']).childNodes,
        );
      }, 150);

      // Then level 4
      setTimeout(() => {
        l1.replaceChildren(...makeModal('Daftar Kelurahan', ['Keji', 'Lerep']).childNodes);
      }, 250);

      const promise = fillAlamatDomisili('Jawa Tengah', 'Kab. Semarang', 'Ungaran Barat', 'Keji');
      await vi.advanceTimersByTimeAsync(500);
      expect(await promise).toBe(true);
    });

    it('should match via partial text', async () => {
      const l1 = makeModal('Daftar Provinsi', ['Jawa Tengah', 'Jawa Timur']);
      document.body.appendChild(l1);

      setTimeout(() => {
        l1.replaceChildren(...makeModal('Daftar Kabupaten/Kota', ['Kab. Semarang']).childNodes);
      }, 50);
      setTimeout(() => {
        l1.replaceChildren(...makeModal('Daftar Kecamatan', ['Ungaran Barat']).childNodes);
      }, 150);
      setTimeout(() => {
        l1.replaceChildren(...makeModal('Daftar Kelurahan', ['Keji']).childNodes);
      }, 250);

      // Use partial: "Tengah" should match "Jawa Tengah"
      const promise = fillAlamatDomisili('Tengah', 'Semarang', 'Ungaran', 'Keji');
      await vi.advanceTimersByTimeAsync(500);
      expect(await promise).toBe(true);
    });
  });

  describe('failure cases', () => {
    it('should return false when label not found', async () => {
      document.body.replaceChildren(document.createElement('div'));
      expect(
        await fillAlamatDomisili('Jawa Tengah', 'Kab. Semarang', 'Ungaran Barat', 'Keji'),
      ).toBe(false);
    });

    it('should return false when trigger not found', async () => {
      document.body.replaceChildren();
      const label = document.createElement('div');
      label.className = 'mb-1 font-semibold';
      label.textContent = 'Alamat Domisili *';
      document.body.appendChild(label);

      expect(
        await fillAlamatDomisili('Jawa Tengah', 'Kab. Semarang', 'Ungaran Barat', 'Keji'),
      ).toBe(false);
    });

    it('should return false when modal never appears', { timeout: 15_000 }, async () => {
      const promise = fillAlamatDomisili('Jawa Tengah', 'Kab. Semarang', 'Ungaran Barat', 'Keji');
      await vi.advanceTimersByTimeAsync(6000);
      expect(await promise).toBe(false);
    });

    it(
      'should return false when subtitle does not match in modal',
      { timeout: 15_000 },
      async () => {
        const modal = makeModal('Wrong Title', ['Jawa Tengah']);
        document.body.appendChild(modal);

        const promise = fillAlamatDomisili('Jawa Tengah', 'Kab. Semarang', 'Ungaran Barat', 'Keji');
        await vi.advanceTimersByTimeAsync(6000);
        expect(await promise).toBe(false);
      },
    );

    it('should return false when no button matches in modal', { timeout: 15_000 }, async () => {
      const modal = makeModal('Daftar Provinsi', ['Something Else']);
      document.body.appendChild(modal);

      const promise = fillAlamatDomisili('Jawa Tengah', 'Kab. Semarang', 'Ungaran Barat', 'Keji');
      await vi.advanceTimersByTimeAsync(6000);
      expect(await promise).toBe(false);
    });

    it(
      'should return false if level 2 fails after level 1 succeeds',
      { timeout: 15_000 },
      async () => {
        const modal = makeModal('Daftar Provinsi', ['Jawa Tengah']);
        document.body.appendChild(modal);

        // Level 1 succeeds (button is clicked), but level 2 starts
        // and modal has no matching subtitle → timeout
        const promise = fillAlamatDomisili('Jawa Tengah', 'Kab. Semarang', 'Ungaran Barat', 'Keji');
        // Level 1 verify: poll finds modal, clicks button
        await vi.advanceTimersByTimeAsync(6000);
        expect(await promise).toBe(false);
      },
    );
  });
});
