import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockNotify = vi.hoisted(() => ({
  alert: vi.fn(),
  confirm: vi.fn(),
  info: vi.fn(),
  countdown: vi.fn(),
}));

vi.mock('../../src/components/notification', () => ({
  notify: mockNotify,
}));

vi.mock('../../src/quota/verify.js', () => ({
  verifyLicense: vi.fn(),
}));

vi.mock('../../src/quota/quota-manager.js', () => ({
  applyShareToken: vi.fn(),
  getDeviceId: vi.fn(),
}));

import { controlPanel } from '../../src/components/controlPanel';
import { verifyLicense } from '../../src/quota/verify.js';
import { applyShareToken, getDeviceId } from '../../src/quota/quota-manager.js';
import { isShareTokenUrl, initializeShareToken } from '../../src/handlers/shareToken';

describe('isShareTokenUrl', () => {
  it('matches /s/<id>', () => {
    expect(isShareTokenUrl('https://dandelion.web.id/s/abc12345')).toBe(true);
  });

  it('matches /share/<id>', () => {
    expect(isShareTokenUrl('https://dandelion.web.id/share/abc12345')).toBe(true);
  });

  it('rejects other paths', () => {
    expect(isShareTokenUrl('https://dandelion.web.id/')).toBe(false);
    expect(isShareTokenUrl('https://dandelion.web.id/skrining/1')).toBe(false);
  });

  it('rejects missing id segment', () => {
    expect(isShareTokenUrl('https://dandelion.web.id/s/')).toBe(false);
    expect(isShareTokenUrl('https://dandelion.web.id/share/')).toBe(false);
  });

  it('enforces host when officialHost is set', () => {
    expect(isShareTokenUrl('https://evil.example.com/s/abc', 'dandelion.web.id')).toBe(false);
    expect(isShareTokenUrl('https://dandelion.web.id/s/abc', 'dandelion.web.id')).toBe(true);
  });

  it('skips host check for empty or localhost host (dev)', () => {
    expect(isShareTokenUrl('http://localhost:3000/s/abc', 'localhost')).toBe(true);
    expect(isShareTokenUrl('http://any.dev/share/abc', '')).toBe(true);
  });
});

describe('initializeShareToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    controlPanel.init();
  });

  it('keeps the button disabled when token is invalid', async () => {
    document.body.innerHTML = '<textarea id="jwtOutput">bad-token</textarea>';
    verifyLicense.mockResolvedValue(null);

    await initializeShareToken();

    const btn = document.getElementById('dandelion-share-token-apply');
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it('enables the button when token is valid and bound to this device', async () => {
    document.body.innerHTML = '<textarea id="jwtOutput">good-token</textarea>';
    verifyLicense.mockResolvedValue({ license_id: 'x' });
    getDeviceId.mockReturnValue('x');

    await initializeShareToken();

    const btn = document.getElementById('dandelion-share-token-apply');
    expect(btn.disabled).toBe(false);
  });

  it('keeps the button disabled when license_id does not match this device', async () => {
    document.body.innerHTML = '<textarea id="jwtOutput">good-token</textarea>';
    verifyLicense.mockResolvedValue({ license_id: 'other-device' });
    getDeviceId.mockReturnValue('x');

    await initializeShareToken();

    const btn = document.getElementById('dandelion-share-token-apply');
    expect(btn.disabled).toBe(true);
  });

  it('reads token from data-dandelion-token attribute as fallback', async () => {
    document.body.innerHTML = '<div data-dandelion-token="attr-token"></div>';
    verifyLicense.mockResolvedValue({ license_id: 'x' });
    getDeviceId.mockReturnValue('x');

    await initializeShareToken();

    expect(verifyLicense).toHaveBeenCalledWith('attr-token');
    const btn = document.getElementById('dandelion-share-token-apply');
    expect(btn.disabled).toBe(false);
  });

  it('applies the token and notifies on click after confirmation', async () => {
    document.body.innerHTML = '<textarea id="jwtOutput">good-token</textarea>';
    verifyLicense.mockResolvedValue({ license_id: 'x' });
    applyShareToken.mockResolvedValue({ license_id: 'x' });
    getDeviceId.mockReturnValue('x');
    mockNotify.confirm.mockResolvedValue(true);

    await initializeShareToken();

    const btn = document.getElementById('dandelion-share-token-apply');
    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockNotify.confirm).toHaveBeenCalledWith('Konfirmasi', expect.any(String));
    expect(applyShareToken).toHaveBeenCalledWith('good-token');
    expect(mockNotify.info).toHaveBeenCalledWith('Token Diterapkan', expect.any(String));
  });

  it('does not apply when the user cancels the confirmation', async () => {
    document.body.innerHTML = '<textarea id="jwtOutput">good-token</textarea>';
    verifyLicense.mockResolvedValue({ license_id: 'x' });
    getDeviceId.mockReturnValue('x');
    mockNotify.confirm.mockResolvedValue(false);

    await initializeShareToken();

    const btn = document.getElementById('dandelion-share-token-apply');
    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(applyShareToken).not.toHaveBeenCalled();
    expect(mockNotify.info).not.toHaveBeenCalled();
  });

  it('alerts when applying fails', async () => {
    document.body.innerHTML = '<textarea id="jwtOutput">good-token</textarea>';
    verifyLicense.mockResolvedValue({ license_id: 'x' });
    applyShareToken.mockRejectedValue(new Error('Token tidak valid atau sudah kadaluarsa'));
    getDeviceId.mockReturnValue('x');
    mockNotify.confirm.mockResolvedValue(true);

    await initializeShareToken();

    const btn = document.getElementById('dandelion-share-token-apply');
    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockNotify.alert).toHaveBeenCalledWith('Gagal', expect.any(String));
  });
});
