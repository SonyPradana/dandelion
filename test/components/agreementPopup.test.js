// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from '../../src/store';
import { MemoryBackend } from '../__support__/memory-backend';

import { showAgreementPopup } from '../../src/components/agreementPopup';

describe('agreementPopup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    store.init(new MemoryBackend());
    vi.clearAllMocks();
  });

  it('should create overlay with id dandelion-agreement-popup', () => {
    showAgreementPopup();
    const overlay = document.getElementById('dandelion-agreement-popup');
    expect(overlay).toBeTruthy();
  });

  it('should have checkbox and button in footer', () => {
    showAgreementPopup();
    const checkbox = document.querySelector('#dandelion-agreement-popup-checkbox');
    const btn = document.querySelector('#dandelion-agreement-popup-btn');
    expect(checkbox).toBeTruthy();
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it('should enable button when checkbox is checked', () => {
    showAgreementPopup();
    const checkbox = document.querySelector('#dandelion-agreement-popup-checkbox');
    const btn = document.querySelector('#dandelion-agreement-popup-btn');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(btn.disabled).toBe(false);
    expect(btn.classList.contains('enabled')).toBe(true);
  });

  it('should call store.setAgreement on button click', () => {
    const spy = vi.spyOn(store, 'setAgreement').mockResolvedValue();
    showAgreementPopup();
    const checkbox = document.querySelector('#dandelion-agreement-popup-checkbox');
    const btn = document.querySelector('#dandelion-agreement-popup-btn');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    btn.click();
    expect(spy).toHaveBeenCalledWith(true);
    spy.mockRestore();
  });

  it('should remove overlay after button click', async () => {
    vi.spyOn(store, 'setAgreement').mockResolvedValue();
    showAgreementPopup();
    const checkbox = document.querySelector('#dandelion-agreement-popup-checkbox');
    const btn = document.querySelector('#dandelion-agreement-popup-btn');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    btn.click();
    // wait for microtask
    await vi.waitFor(() => {
      const overlay = document.getElementById('dandelion-agreement-popup');
      expect(overlay).toBeNull();
    });
  });

  it('should return { promise, remove }', () => {
    const result = showAgreementPopup();
    expect(result.promise).toBeInstanceOf(Promise);
    expect(result.remove).toBeTypeOf('function');
  });

  it('remove should close the overlay and resolve promise', async () => {
    const { promise, remove } = showAgreementPopup();
    remove();
    const overlay = document.getElementById('dandelion-agreement-popup');
    expect(overlay).toBeNull();
    await expect(promise).resolves.toBeUndefined();
  });

  it('should remove existing popup before creating new one', () => {
    showAgreementPopup();
    showAgreementPopup();
    const overlays = document.querySelectorAll('#dandelion-agreement-popup');
    expect(overlays.length).toBe(1);
  });
});
