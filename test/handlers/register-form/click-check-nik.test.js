import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  clickCekNik,
  waitForCekNikResponse,
} from '../../../src/handlers/register-form/click-check-nik.js';

describe('clickCekNik', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.replaceChildren();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should click the Cek NIK button when found', async () => {
    const btn = document.createElement('button');
    btn.textContent = 'Cek NIK';
    document.body.appendChild(btn);

    const clickSpy = vi.spyOn(btn, 'click');

    const result = await clickCekNik();
    expect(result).toBe(true);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('should match button with surrounding whitespace', async () => {
    const btn = document.createElement('button');
    btn.textContent = '  Cek NIK  ';
    document.body.appendChild(btn);

    const clickSpy = vi.spyOn(btn, 'click');

    const result = await clickCekNik();
    expect(result).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should match button with nested elements', async () => {
    const btn = document.createElement('button');
    const inner = document.createElement('div');
    inner.textContent = 'Cek NIK';
    btn.appendChild(inner);
    document.body.appendChild(btn);

    const clickSpy = vi.spyOn(btn, 'click');

    const result = await clickCekNik();
    expect(result).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should not match disabled div (non-button)', async () => {
    const div = document.createElement('div');
    div.textContent = 'Cek NIK';
    div.className = 'cursor-not-allowed';
    document.body.appendChild(div);

    const promise = clickCekNik();
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;
    expect(result).toBe(false);
  });

  it('should return false when button never appears within timeout', async () => {
    const promise = clickCekNik();
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;
    expect(result).toBe(false);
  });

  it('should find button when it appears after some time', async () => {
    setTimeout(() => {
      const btn = document.createElement('button');
      btn.textContent = 'Cek NIK';
      document.body.appendChild(btn);
    }, 200);

    const promise = clickCekNik();
    await vi.advanceTimersByTimeAsync(300);
    const result = await promise;
    expect(result).toBe(true);
  });

  it('should not resolve before timeout when button never appears', async () => {
    let resolved = false;
    clickCekNik().then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(4000);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);
    expect(resolved).toBe(true);
  });
});

describe('waitForCekNikResponse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.replaceChildren();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return not-found when toast is visible', async () => {
    const toast = document.createElement('div');
    toast.id = 'toast--response-fetch';
    toast.className = 'show';
    document.body.appendChild(toast);

    const result = await waitForCekNikResponse();
    expect(result).toBe('not-found');
  });

  it('should return not-found regardless of toast position in DOM', async () => {
    const wrapper = document.createElement('div');
    const toast = document.createElement('div');
    toast.id = 'toast--response-fetch';
    toast.className = 'show';
    toast.textContent = 'Data Tidak Ditemukan';
    wrapper.appendChild(toast);
    document.body.appendChild(wrapper);

    const result = await waitForCekNikResponse();
    expect(result).toBe('not-found');
  });

  it('should return found when Data Peserta ditemukan text is present', async () => {
    const div = document.createElement('div');
    div.textContent = 'Data Peserta ditemukan';
    document.body.appendChild(div);

    const result = await waitForCekNikResponse();
    expect(result).toBe('found');
  });

  it('should return timeout when no response within 7s', async () => {
    const promise = waitForCekNikResponse();
    await vi.advanceTimersByTimeAsync(7000);
    const result = await promise;
    expect(result).toBe('timeout');
  });

  it('should detect toast that appears after delay', async () => {
    setTimeout(() => {
      const toast = document.createElement('div');
      toast.id = 'toast--response-fetch';
      toast.className = 'show';
      document.body.appendChild(toast);
    }, 1000);

    const promise = waitForCekNikResponse();
    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;
    expect(result).toBe('not-found');
  });

  it('should detect text that appears after delay', async () => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.textContent = 'Data Peserta ditemukan';
      document.body.appendChild(div);
    }, 500);

    const promise = waitForCekNikResponse();
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result).toBe('found');
  });

  it('should prioritize not-found over found when both present', async () => {
    const foundDiv = document.createElement('div');
    foundDiv.textContent = 'Data Peserta ditemukan';
    document.body.appendChild(foundDiv);

    const toast = document.createElement('div');
    toast.id = 'toast--response-fetch';
    toast.className = 'show';
    document.body.prepend(toast);

    const result = await waitForCekNikResponse();
    expect(result).toBe('not-found');
  });

  it('should not check for toast without .show class', async () => {
    const toast = document.createElement('div');
    toast.id = 'toast--response-fetch';
    toast.className = '';
    document.body.appendChild(toast);

    const promise = waitForCekNikResponse();
    await vi.advanceTimersByTimeAsync(7000);
    const result = await promise;
    expect(result).toBe('timeout');
  });
});
