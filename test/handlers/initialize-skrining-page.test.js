import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initializeSkriningForm: vi.fn(),
  initializeSkriningSend: vi.fn(),
  initializeSkrining: vi.fn(),
  initializeNotChecked: vi.fn(),
  config: { value: {} },
  features: new Set(),
}));

vi.mock('../../src/handlers/skriningform.js', () => ({
  initializeSkriningForm: mocks.initializeSkriningForm,
}));
vi.mock('../../src/handlers/skrining-send.js', () => ({
  initializeSkriningSend: mocks.initializeSkriningSend,
}));
vi.mock('../../src/handlers/skrining.js', () => ({
  initializeSkrining: mocks.initializeSkrining,
}));
vi.mock('../../src/handlers/skrining-form-not-checked.js', () => ({
  initialize: mocks.initializeNotChecked,
}));
vi.mock('../../src/store.js', () => ({
  store: { getActiveConfig: vi.fn(async () => mocks.config.value) },
}));
vi.mock('../../src/quota/quota-manager.js', () => ({
  isFeatureEnabled: vi.fn((feature) => mocks.features.has(feature)),
}));

async function loadRouter() {
  vi.resetModules();
  return import('../../src/handlers/initialize-skrining-page.js');
}

describe('initializeSkriningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.features = new Set([
      'skriningform',
      'skrining-send',
      'zen-mode',
      'skrining-form-not-checked',
    ]);
    mocks.config.value = {};
  });

  it('mounts the skrining form without auto assist', async () => {
    window.history.replaceState({}, '', '/form-skrining');
    mocks.config.value = { formSkrining: { url: '/form-skrining' } };
    const { initializeSkriningPage } = await loadRouter();
    const flashData = { pinneds: { nik: '123' } };

    const page = await initializeSkriningPage(flashData, { autoAssist: false });

    expect(page).toBe('form-skrining');
    expect(mocks.initializeSkriningForm).toHaveBeenCalledWith(flashData, undefined, {
      autoAssist: false,
    });
    expect(mocks.initializeSkriningSend).toHaveBeenCalledOnce();
  });

  it('forces auto assist off for a register-form handoff', async () => {
    window.history.replaceState({}, '', '/form-skrining');
    mocks.config.value = { formSkrining: { url: '/form-skrining' } };
    const { initializeSkriningPage } = await loadRouter();
    const flashData = { _source: 'register-form', pinneds: { nik: '123' } };

    await initializeSkriningPage(flashData);

    expect(mocks.initializeSkriningForm).toHaveBeenCalledWith(flashData, undefined, {
      autoAssist: false,
    });
  });

  it('does not initialize the same URL twice', async () => {
    window.history.replaceState({}, '', '/form-skrining');
    mocks.config.value = { formSkrining: { url: '/form-skrining' } };
    const { initializeSkriningPage } = await loadRouter();

    await initializeSkriningPage();
    const second = await initializeSkriningPage();

    expect(second).toBe('already');
    expect(mocks.initializeSkriningForm).toHaveBeenCalledOnce();
  });

  it('mounts the not-checked panel on the list page', async () => {
    window.history.replaceState({}, '', '/pemeriksaan');
    mocks.config.value = { notChecked: { url: '/pemeriksaan' } };
    const { initializeSkriningPage } = await loadRouter();

    const page = await initializeSkriningPage();

    expect(page).toBe('not-checked');
    expect(mocks.initializeNotChecked).toHaveBeenCalledOnce();
  });

  it('returns null when the URL matches nothing', async () => {
    window.history.replaceState({}, '', '/lain');
    const { initializeSkriningPage } = await loadRouter();

    expect(await initializeSkriningPage()).toBeNull();
  });
});
