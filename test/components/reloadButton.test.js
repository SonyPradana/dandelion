import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('reloadButton', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
  });

  it('should create a small round reload button visible by default', async () => {
    const { reloadButton } = await import('../../src/components/reloadButton.js');
    const btn = reloadButton();
    expect(btn).toBeInstanceOf(HTMLButtonElement);
    expect(btn.id).toBe('dandelion-reload-btn');
    expect(btn.textContent).toContain('↻');
    expect(btn.style.width).toBe('24px');
    expect(btn.style.height).toBe('24px');
    expect(btn.style.borderRadius).toBe('50%');
    expect(btn.style.opacity).not.toBe('0');
    expect(btn.style.pointerEvents).not.toBe('none');
    expect(btn.dataset.pinned).toBe('true');
  });

  it('should create the control panel and mount when no panel exists', async () => {
    const { ensureReloadButton } = await import('../../src/components/reloadButton.js');
    ensureReloadButton();
    expect(document.getElementById('dandelion-control-panel')).toBeTruthy();
    expect(document.getElementById('dandelion-reload-btn')).toBeTruthy();
  });

  it('should mount into the control panel', async () => {
    const { ensureReloadButton } = await import('../../src/components/reloadButton.js');
    const { controlPanel } = await import('../../src/components/controlPanel.js');
    controlPanel.init();
    ensureReloadButton();
    const panel = document.getElementById('dandelion-control-panel');
    expect(panel.querySelector('#dandelion-reload-btn')).toBeTruthy();
  });

  it('should mount into slot 3', async () => {
    const { ensureReloadButton } = await import('../../src/components/reloadButton.js');
    const { controlPanel } = await import('../../src/components/controlPanel.js');
    controlPanel.init();
    ensureReloadButton();
    expect(controlPanel.slots[3].contains(document.getElementById('dandelion-reload-btn'))).toBe(
      true,
    );
  });

  it('should be idempotent', async () => {
    const { ensureReloadButton } = await import('../../src/components/reloadButton.js');
    const { controlPanel } = await import('../../src/components/controlPanel.js');
    controlPanel.init();
    ensureReloadButton();
    ensureReloadButton();
    const panel = document.getElementById('dandelion-control-panel');
    expect(panel.querySelectorAll('#dandelion-reload-btn').length).toBe(1);
  });

  it('spin should add the spinning animation class', async () => {
    const { reloadButton } = await import('../../src/components/reloadButton.js');
    const btn = reloadButton();
    btn.spin();
    expect(btn.classList.contains('dandelion-reload-spinning')).toBe(true);
    btn.spin();
    expect(btn.classList.contains('dandelion-reload-spinning')).toBe(true);
  });

  it('stopSpin should remove the spinning class and settle at 360deg', async () => {
    const { reloadButton } = await import('../../src/components/reloadButton.js');
    const btn = reloadButton();
    btn.spin();
    btn.stopSpin();
    expect(btn.classList.contains('dandelion-reload-spinning')).toBe(false);
    expect(btn.style.transform).toBe('rotate(360deg)');
  });

  it('clicking should spin and trigger refreshState, then settle', async () => {
    const { reloadButton } = await import('../../src/components/reloadButton.js');
    const refresh = await import('../../src/refreshState.js');
    const spy = vi.spyOn(refresh, 'refreshState').mockResolvedValue({ ok: true, url: 'x' });

    const btn = reloadButton();
    btn.dispatchEvent(new MouseEvent('click'));

    expect(spy).toHaveBeenCalled();
    expect(btn.classList.contains('dandelion-reload-spinning')).toBe(true);

    await vi.waitFor(() => {
      expect(btn.classList.contains('dandelion-reload-spinning')).toBe(false);
      expect(btn.style.transform).toBe('rotate(360deg)');
    });
  });

  it('should remount the reload button after the panel is recreated', async () => {
    const { ensureReloadButton } = await import('../../src/components/reloadButton.js');
    const { controlPanel } = await import('../../src/components/controlPanel.js');
    const { teardown } = await import('../../src/refreshState.js');
    controlPanel.init();
    ensureReloadButton();
    expect(document.getElementById('dandelion-reload-btn')).toBeTruthy();

    teardown();
    expect(document.getElementById('dandelion-control-panel')).toBeNull();

    ensureReloadButton();
    expect(document.getElementById('dandelion-reload-btn')).toBeTruthy();
  });
});
