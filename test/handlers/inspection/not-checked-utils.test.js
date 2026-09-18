import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { countUnresolvedRows } from '../../../src/handlers/inspection/not-checked-utils';

const rowsHtml = readFileSync(resolve('test/__fixtures__/rows.html'), 'utf8');

describe('countUnresolvedRows', () => {
  beforeEach(() => {
    document.body.innerHTML = rowsHtml;
  });

  it('counts only unresolved rows from the fixture', () => {
    expect(countUnresolvedRows()).toBe(2);
  });

  it('counts a skipped row as unresolved', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001"></div>
        <div>Tidak diperiksa</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(1);
  });

  it('treats a skipped row with a non-gray success icon as done', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001">
          <img src="icon-success.png" />
        </div>
        <div>Tidak diperiksa</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(0);
  });

  it('treats a row with a gray success icon as unresolved', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001">
          <img src="icon-success-gray.png" />
        </div>
        <div>Tidak diperiksa</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(1);
  });

  it('returns 0 when every row shows a done state', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001"><button type="button">Input Data</button></div>
        <div>Selesai diperiksa</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(0);
  });

  it('counts an incomplete row as unresolved even without buttons', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001"></div>
        <div>Dalam Pemeriksaan</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(1);
  });

  it('counts a disabled-button row without a done state as unresolved', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001">
          <button type="button" disabled>Input Data</button>
        </div>
        <div>Dalam Pemeriksaan</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(1);
  });
});
