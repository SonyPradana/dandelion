import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getActiveRowIds } from '../../../src/handlers/inspection/not-checked-utils';

const rowsHtml = readFileSync(resolve('test/__fixtures__/rows.html'), 'utf8');

describe('getActiveRowIds', () => {
  beforeEach(() => {
    document.body.innerHTML = rowsHtml;
  });

  it('returns only rows with a clickable button from the fixture', () => {
    expect(getActiveRowIds()).toEqual(['rowfrmabc000002']);
  });

  it('treats a skipped row without a button as inactive', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001"></div>
        <div>Tidak diperiksa</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual([]);
  });

  it('counts a skipped row with a clickable button as active', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001"><button type="button">Input Data</button></div>
        <div>Tidak diperiksa</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual(['rowfrmabc000001']);
  });

  it('treats a row with a non-gray success icon as done', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001">
          <button type="button">Input Data</button>
          <img src="icon-success.png" />
        </div>
        <div>Tidak diperiksa</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual([]);
  });

  it('treats a row with a gray success icon and clickable button as active', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001">
          <button type="button">Input Data</button>
          <img src="icon-success-gray.png" />
        </div>
        <div>Tidak diperiksa</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual(['rowfrmabc000001']);
  });

  it('returns empty when every row shows a done state', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001"><button type="button">Input Data</button></div>
        <div>Selesai diperiksa</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual([]);
  });

  it('treats a disabled-button row as inactive', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001">
          <button type="button" disabled>Input Data</button>
        </div>
        <div>Dalam Pemeriksaan</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual([]);
  });

  it('returns the row id for a pending row with a clickable button', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001"><button type="button">Input Data</button></div>
        <div>Dalam Pemeriksaan</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual(['rowfrmabc000001']);
  });

  describe('markup list aktual', () => {
    it('counts an unfilled mandiri row (gray icon, clickable button) as active', () => {
      document.body.innerHTML = `
        <div class="grid">
          <div id="rowfrmabc1001">
            <img src="/images/icons/icon-success-gray.svg" alt="" />
            <button type="button">Input Data</button>
          </div>
        </div>
      `;
      expect(getActiveRowIds()).toEqual(['rowfrmabc1001']);
    });

    it('treats a filled mandiri row (non-gray icon, clickable button) as done', () => {
      document.body.innerHTML = `
        <div class="grid">
          <div id="rowfrmabc1002">
            <img src="/images/icons/icon-success.svg" alt="" />
            <button type="button">Input Data</button>
          </div>
        </div>
      `;
      expect(getActiveRowIds()).toEqual([]);
    });

    it('treats a "Tidak diperiksa" row with a non-clickable div as inactive', () => {
      document.body.innerHTML = `
        <div class="grid">
          <div id="rowfrmabc1003">
            <span class="badge">Tidak diperiksa</span>
            <div class="cursor-not-allowed">Tidak Periksa</div>
          </div>
        </div>
      `;
      expect(getActiveRowIds()).toEqual([]);
    });

    it('counts a "Dalam Pemeriksaan" row with a clickable button as active', () => {
      document.body.innerHTML = `
        <div class="grid">
          <div id="rowfrmabc1004">
            <span class="badge">Dalam Pemeriksaan</span>
            <button type="button">Input Data</button>
          </div>
        </div>
      `;
      expect(getActiveRowIds()).toEqual(['rowfrmabc1004']);
    });

    it('treats a "Selesai diperiksa" row with a clickable button as done', () => {
      document.body.innerHTML = `
        <div class="grid">
          <div id="rowfrmabc1005">
            <span class="badge">Selesai diperiksa</span>
            <button type="button">Input Data</button>
          </div>
        </div>
      `;
      expect(getActiveRowIds()).toEqual([]);
    });

    it('scans a full list and returns only the still-active rows', () => {
      document.body.innerHTML = `
        <div id="tableLayanan">
          <div class="grid">
            <div id="rowfrmabc1001">
              <img src="/images/icons/icon-success-gray.svg" alt="" />
              <button type="button">Input Data</button>
            </div>
          </div>
          <div class="grid">
            <div id="rowfrmabc1002">
              <img src="/images/icons/icon-success.svg" alt="" />
              <button type="button">Input Data</button>
            </div>
          </div>
          <div class="grid">
            <div id="rowfrmabc1003">
              <span class="badge">Tidak diperiksa</span>
              <div class="cursor-not-allowed">Tidak Periksa</div>
            </div>
          </div>
          <div class="grid">
            <div id="rowfrmabc1004">
              <span class="badge">Dalam Pemeriksaan</span>
              <button type="button">Input Data</button>
            </div>
          </div>
          <div class="grid">
            <div id="rowfrmabc1005">
              <span class="badge">Selesai diperiksa</span>
              <button type="button">Input Data</button>
            </div>
          </div>
        </div>
      `;
      expect(getActiveRowIds()).toEqual(['rowfrmabc1001', 'rowfrmabc1004']);
    });
  });
});
