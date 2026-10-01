import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  getActiveRowIds,
  countUnresolvedRows,
  getQueueStats,
  TABLE_ID,
} from '../../../src/handlers/inspection/not-checked-utils';

const rowsHtml = readFileSync(resolve('test/__fixtures__/rows.html'), 'utf8');

describe('getActiveRowIds', () => {
  beforeEach(() => {
    document.body.innerHTML = rowsHtml;
  });

  it('returns only rows with a clickable button from the fixture', () => {
    expect(getActiveRowIds()).toEqual(['rowfrm000002', 'rowfrm000004']);
  });

  it('treats a "Selesai Pemeriksaan" row with a clickable button as done', () => {
    document.body.innerHTML = `
      <div class="grid grid-cols-5">
        <div id="rowfrm000001"><button type="button">Input Data</button></div>
        <div>Selesai Pemeriksaan</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual([]);
  });

  it('returns a "Belum Pemeriksaan" row with a clickable button as active', () => {
    document.body.innerHTML = `
      <div class="grid grid-cols-5">
        <div id="rowfrm000001"><button type="button">Input Data</button></div>
        <div>Belum Pemeriksaan</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual(['rowfrm000001']);
  });

  it('treats a row without a button as inactive', () => {
    document.body.innerHTML = `
      <div class="grid grid-cols-5">
        <div id="rowfrm000001"></div>
        <div>Belum Pemeriksaan</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual([]);
  });

  it('treats a disabled-button row as inactive', () => {
    document.body.innerHTML = `
      <div class="grid grid-cols-5">
        <div id="rowfrm000001">
          <button type="button" disabled>Input Data</button>
        </div>
        <div>Belum Pemeriksaan</div>
      </div>
    `;
    expect(getActiveRowIds()).toEqual([]);
  });

  describe('mandiri (table) rows', () => {
    it('treats a non-gray success icon row as done', () => {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr>
              <td><img src="/images/icons/icon-success.svg" alt="" /></td>
              <td><div id="rowfrm000002"><button type="button">Input Data</button></div></td>
            </tr>
          </tbody>
        </table>
      `;
      expect(getActiveRowIds()).toEqual([]);
    });

    it('counts a gray success icon row with a clickable button as active', () => {
      document.body.innerHTML = `
        <table>
          <tbody>
            <tr>
              <td><img src="/images/icons/icon-success-gray.svg" alt="" /></td>
              <td><div id="rowfrm000002"><button type="button">Input Data</button></div></td>
            </tr>
          </tbody>
        </table>
      `;
      expect(getActiveRowIds()).toEqual(['rowfrm000002']);
    });

    it('scans a mixed grid + table list and returns only active rows', () => {
      document.body.innerHTML = `
        <div id="${TABLE_ID}">
          <div class="grid grid-cols-5">
            <div id="rowfrm000001"><button type="button">Input Data</button></div>
            <div>Selesai Pemeriksaan</div>
          </div>
          <div class="grid grid-cols-5">
            <div id="rowfrm000002"><button type="button">Input Data</button></div>
            <div>Belum Pemeriksaan</div>
          </div>
          <table>
            <tbody>
              <tr>
                <td><img src="/images/icons/icon-success.svg" alt="" /></td>
                <td><div id="rowfrm000003"><button type="button">Input Data</button></div></td>
              </tr>
              <tr>
                <td><img src="/images/icons/icon-success-gray.svg" alt="" /></td>
                <td><div id="rowfrm000004"><button type="button">Input Data</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      expect(getActiveRowIds()).toEqual(['rowfrm000002', 'rowfrm000004']);
    });
  });
});

describe('countUnresolvedRows', () => {
  beforeEach(() => {
    document.body.innerHTML = rowsHtml;
  });

  it('ignores rows that show a done state', () => {
    document.body.innerHTML = `
      <div class="grid grid-cols-5">
        <div id="rowfrm000001"><button type="button">Input Data</button></div>
        <div>Selesai Pemeriksaan</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(0);
  });

  it('treats a non-gray success icon row as done', () => {
    document.body.innerHTML = `
      <table>
        <tbody>
          <tr>
            <td><img src="icon-success.svg" alt="" /></td>
            <td><div id="rowfrm000001"><button type="button">Input Data</button></div></td>
          </tr>
        </tbody>
      </table>
    `;
    expect(countUnresolvedRows()).toBe(0);
  });

  it('counts a disabled-button row without a done state as unresolved', () => {
    document.body.innerHTML = `
      <div class="grid grid-cols-5">
        <div id="rowfrm000001">
          <button type="button" disabled>Input Data</button>
        </div>
        <div>Belum Pemeriksaan</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(1);
  });

  it('counts a non-clickable row without a done state as unresolved', () => {
    document.body.innerHTML = `
      <div class="grid grid-cols-5">
        <div id="rowfrm000001">
          <div class="cursor-not-allowed">Input Data</div>
        </div>
        <div>Belum Pemeriksaan</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(1);
  });
});

describe('getQueueStats', () => {
  beforeEach(() => {
    document.body.innerHTML = rowsHtml;
  });

  it('splits master list ids into pending and done', () => {
    const stats = getQueueStats(['rowfrm000001', 'rowfrm000002', 'rowfrm000003', 'rowfrm000004']);

    expect(stats.foundIds).toEqual([
      'rowfrm000001',
      'rowfrm000002',
      'rowfrm000003',
      'rowfrm000004',
    ]);
    expect(stats.pendingIds).toEqual(['rowfrm000002', 'rowfrm000004']);
    expect(stats.doneIds).toEqual(['rowfrm000001', 'rowfrm000003']);
  });

  it('skips master list ids that are not present in the DOM', () => {
    const stats = getQueueStats(['rowfrm000002', 'rowfrm999999']);

    expect(stats.foundIds).toEqual(['rowfrm000002']);
    expect(stats.pendingIds).toEqual(['rowfrm000002']);
    expect(stats.doneIds).toEqual([]);
  });
});
