import { describe, it, expect, beforeEach } from 'vitest';
import { fillNikWali } from '../../../src/handlers/register-form/fill-nik-wali.js';

describe('fillNikWali', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('should find NIK wali entry and set input value via native setter', () => {
    const input = document.createElement('input');
    input.id = 'nik wali';
    document.body.appendChild(input);

    const entries = [['NIK Wali', '1234567890123456']];
    const result = fillNikWali(entries);

    expect(result).toBe(true);
    expect(input.value).toBe('1234567890123456');
  });

  it('should dispatch input event on the element', () => {
    const input = document.createElement('input');
    input.id = 'nik wali';
    document.body.appendChild(input);

    let dispatched = false;
    let bubbles = false;
    input.addEventListener('input', (e) => {
      dispatched = true;
      bubbles = e.bubbles;
    });

    fillNikWali([['NIK Wali', '1234567890123456']]);

    expect(dispatched).toBe(true);
    expect(bubbles).toBe(true);
  });

  it('should handle composed: true in dispatched event', () => {
    const input = document.createElement('input');
    input.id = 'nik wali';
    document.body.appendChild(input);

    let composed = false;
    input.addEventListener('input', (e) => {
      composed = e.composed;
    });

    fillNikWali([['NIK Wali', '1234567890123456']]);

    expect(composed).toBe(true);
  });

  it('should return false when no entry matches NIK wali', () => {
    const entries = [['Nama Lengkap Wali', 'Budi']];
    expect(fillNikWali(entries)).toBe(false);
  });

  it('should return false when entry key has "nik" but not ending with " wali"', () => {
    const entries = [['NIK', '1234567890123456']];
    expect(fillNikWali(entries)).toBe(false);
  });

  it('should return false when #nik wali element is not found', () => {
    const entries = [['NIK Wali', '1234567890123456']];
    expect(fillNikWali(entries)).toBe(false);
  });

  it('should handle different casing in entry key', () => {
    const input = document.createElement('input');
    input.id = 'nik wali';
    document.body.appendChild(input);

    const result = fillNikWali([['nik wali', '9876543210987654']]);
    expect(result).toBe(true);
    expect(input.value).toBe('9876543210987654');
  });

  it('should handle entry key with "nik" somewhere in the middle', () => {
    const input = document.createElement('input');
    input.id = 'nik wali';
    document.body.appendChild(input);

    const result = fillNikWali([['No NIK Wali', '1111111111111111']]);
    expect(result).toBe(true);
    expect(input.value).toBe('1111111111111111');
  });
});
