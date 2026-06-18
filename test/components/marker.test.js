import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fillPinnedFields from '../../src/handlers/skriningform/fill-pinned-fields';
import { debugMarker } from '../../src/components/marker';

describe('marker', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('should create a div with dandelion-debug-marker class', () => {
    const el = debugMarker('field1');
    expect(el.classList.contains('dandelion-debug-marker')).toBe(true);
  });

  it('should contain identifier text', () => {
    const el = debugMarker('field1');
    expect(el.textContent).toContain('field1');
  });

  it('should always add excludeToggle', () => {
    const el = debugMarker('field1');
    expect(el.querySelector('.dandelion-exclude-toggle')).toBeTruthy();
  });

  it('should NOT add pinToggle when detectFieldType returns null', () => {
    vi.spyOn(fillPinnedFields, 'detectFieldType').mockReturnValue(null);
    // Need a DOM element with data-name so the code path is exercised
    document.body.innerHTML = '<div data-name="some-field"><input type="text" /></div>';
    const el = debugMarker('some-field');
    expect(el.querySelector('.dandelion-pin-toggle')).toBeNull();
  });

  it('should add pinToggle when detectFieldType returns a field', () => {
    vi.spyOn(fillPinnedFields, 'detectFieldType').mockReturnValue({
      type: 'text',
      getValue: () => 'test-value',
    });
    document.body.innerHTML = '<div data-name="some-field"><input type="text" /></div>';
    const el = debugMarker('some-field');
    expect(el.querySelector('.dandelion-pin-toggle')).toBeTruthy();
  });

  // NOTE: skip style injection test due to module-level stylesInitialized flag
  // (same pattern as pinToggle/excludeToggle — tested there)

  it('should detect number input field from real DOM fixture', () => {
    vi.restoreAllMocks();

    document.body.innerHTML = `
      <div class="sd-question" data-name="abc000030|test000051|xyz00000248|number">
        <div class="sd-question__content">
          <input class="sd-input sd-text" type="number" step="any" />
        </div>
      </div>
    `;

    const el = debugMarker('abc000030|test000051|xyz00000248|number');
    const pinToggle = el.querySelector('.dandelion-pin-toggle');
    const excludeToggle = el.querySelector('.dandelion-exclude-toggle');

    expect(pinToggle).toBeTruthy();
    expect(excludeToggle).toBeTruthy();
    expect(el.textContent).toContain('abc000030|test000051|xyz00000248|number');
  });
});
