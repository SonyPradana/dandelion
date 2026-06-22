import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { isFieldFilled, isRadioFilled } from '../../../src/handlers/skriningform/respect-input';

const fixtureHtml = readFileSync(resolve('test/__fixtures__/respect-input.html'), 'utf8');

globalThis.CSS ??= { escape: (v) => v };

describe('isFieldFilled', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = fixtureHtml;
  });

  describe('radio', () => {
    it('returns false when no option selected', () => {
      const el = document.getElementById('q_radio_empty');
      expect(isFieldFilled(el)).toBe(false);
    });

    it('returns true when an option is selected', () => {
      const el = document.getElementById('q_radio_filled');
      expect(isFieldFilled(el)).toBe(true);
    });
  });

  describe('dropdown', () => {
    it('returns false when no value selected', () => {
      const el = document.getElementById('q_dropdown_empty');
      expect(isFieldFilled(el)).toBe(false);
    });

    it('returns true when a value is selected', () => {
      const el = document.getElementById('q_dropdown_filled');
      expect(isFieldFilled(el)).toBe(true);
    });
  });

  describe('text input', () => {
    it('returns false when empty', () => {
      const el = document.getElementById('q_text_empty');
      expect(isFieldFilled(el)).toBe(false);
    });

    it('returns true when filled', () => {
      const el = document.getElementById('q_text_filled');
      expect(isFieldFilled(el)).toBe(true);
    });
  });

  describe('number input', () => {
    it('returns false when empty', () => {
      const el = document.getElementById('q_number_empty');
      expect(isFieldFilled(el)).toBe(false);
    });

    it('returns true when filled', () => {
      const el = document.getElementById('q_number_filled');
      expect(isFieldFilled(el)).toBe(true);
    });
  });

  describe('textarea', () => {
    it('returns false when empty', () => {
      const el = document.getElementById('q_textarea_empty');
      expect(isFieldFilled(el)).toBe(false);
    });

    it('returns true when filled', () => {
      const el = document.getElementById('q_textarea_filled');
      expect(isFieldFilled(el)).toBe(true);
    });
  });

  it('returns false for unsupported element', () => {
    const el = document.createElement('div');
    el.textContent = 'plain div';
    expect(isFieldFilled(el)).toBe(false);
  });
});

describe('isRadioFilled', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = fixtureHtml;
  });

  it('returns false when no radio selected', () => {
    const el = document.getElementById('q_radio_empty');
    expect(isRadioFilled(el)).toBe(false);
  });

  it('returns true when a radio is selected', () => {
    const el = document.getElementById('q_radio_filled');
    expect(isRadioFilled(el)).toBe(true);
  });

  it('returns false for non-radio element', () => {
    const el = document.getElementById('q_text_empty');
    expect(isRadioFilled(el)).toBe(false);
  });
});
