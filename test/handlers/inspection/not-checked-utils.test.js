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

  it('skips rows with a disabled or non-clickable button and no status', () => {
    document.body.innerHTML = `
      <div class="grid">
        <div id="rowfrmabc000001">
          <button type="button" disabled>Input Data</button>
        </div>
        <div>Dalam Pemeriksaan</div>
      </div>
    `;
    expect(countUnresolvedRows()).toBe(0);
  });
});
