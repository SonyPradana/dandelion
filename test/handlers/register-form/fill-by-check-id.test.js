import { describe, it, expect, beforeEach } from 'vitest';
import { fillByCheckId } from '../../../src/handlers/register-form/fill-by-check-id.js';

describe('fillByCheckId', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('should set value and dispatch input event on existing element', () => {
    const input = document.createElement('input');
    input.id = 'nik';
    document.body.appendChild(input);

    let dispatched = false;
    input.addEventListener('input', () => { dispatched = true; });

    const result = fillByCheckId('nik', '1234567890');

    expect(result).toBe(true);
    expect(input.value).toBe('1234567890');
    expect(dispatched).toBe(true);
  });

  it('should return false when element is not found', () => {
    const result = fillByCheckId('nonexistent', 'value');
    expect(result).toBe(false);
  });

  it('should work with textarea elements', () => {
    const textarea = document.createElement('textarea');
    textarea.id = 'alamat';
    document.body.appendChild(textarea);

    let dispatched = false;
    textarea.addEventListener('input', () => { dispatched = true; });

    const result = fillByCheckId('alamat', 'Jalan Merdeka No.1');

    expect(result).toBe(true);
    expect(textarea.value).toBe('Jalan Merdeka No.1');
    expect(dispatched).toBe(true);
  });

  it('should dispatch input event with bubbles: true', () => {
    const input = document.createElement('input');
    input.id = 'test';
    const parent = document.createElement('div');
    parent.appendChild(input);
    document.body.appendChild(parent);

    let capturedOnParent = false;
    parent.addEventListener('input', () => { capturedOnParent = true; });

    fillByCheckId('test', 'value');
    expect(capturedOnParent).toBe(true);
  });

  it('should handle falsy values like empty string', () => {
    const input = document.createElement('input');
    input.id = 'empty';
    document.body.appendChild(input);

    const result = fillByCheckId('empty', '');
    expect(result).toBe(true);
    expect(input.value).toBe('');
  });

  it('should handle numeric values converted to string', () => {
    const input = document.createElement('input');
    input.id = 'num';
    document.body.appendChild(input);

    const result = fillByCheckId('num', '0');
    expect(result).toBe(true);
    expect(input.value).toBe('0');
  });
});
