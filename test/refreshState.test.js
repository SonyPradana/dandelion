import { describe, it, expect, vi, beforeEach } from 'vitest';

async function freshRefreshState() {
  vi.resetModules();
  return await import('../src/refreshState.js');
}

describe('refreshState', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should run registered cleanups once on teardown', async () => {
    const { registerCleanup, teardown } = await freshRefreshState();
    const first = vi.fn();
    const second = vi.fn();
    registerCleanup(first);
    registerCleanup(second);
    teardown();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    teardown();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('should keep running remaining cleanups if one throws', async () => {
    const { registerCleanup, teardown } = await freshRefreshState();
    const failing = vi.fn(() => {
      throw new Error('boom');
    });
    const ok = vi.fn();
    registerCleanup(failing);
    registerCleanup(ok);
    expect(() => teardown()).not.toThrow();
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it('should remove the control panel and injected elements on teardown', async () => {
    const { teardown } = await freshRefreshState();

    const panel = document.createElement('div');
    panel.id = 'dandelion-control-panel';
    document.body.appendChild(panel);

    const flash = document.createElement('div');
    flash.id = 'dandelion-flash-data';
    document.body.appendChild(flash);

    const action = document.createElement('div');
    action.id = 'dandelion-action-123';
    document.body.appendChild(action);

    const debugMarker = document.createElement('div');
    debugMarker.className = 'dandelion-debug-marker';
    document.body.appendChild(debugMarker);

    const rowMarker = document.createElement('div');
    rowMarker.className = 'dandelion-row-marker';
    document.body.appendChild(rowMarker);

    teardown();

    expect(document.getElementById('dandelion-control-panel')).toBeNull();
    expect(document.getElementById('dandelion-flash-data')).toBeNull();
    expect(document.getElementById('dandelion-action-123')).toBeNull();
    expect(document.querySelector('.dandelion-debug-marker')).toBeNull();
    expect(document.querySelector('.dandelion-row-marker')).toBeNull();
  });

  it('should return not-ok when no reinit is registered', async () => {
    const { refreshState } = await freshRefreshState();
    const result = await refreshState();
    expect(result).toEqual({ ok: false, reason: 'no-reinit', url: window.location.href });
  });

  it('should tear down, re-run the guard, and return ok', async () => {
    const { registerCleanup, setReinit, refreshState } = await freshRefreshState();
    const cleanup = vi.fn();
    registerCleanup(cleanup);
    const reinit = vi.fn(async () => {});
    setReinit(reinit);

    const result = await refreshState();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(reinit).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, url: window.location.href });
  });

  it('should not run the guard again while a refresh is in progress', async () => {
    const { setReinit, refreshState } = await freshRefreshState();
    let inner = null;
    setReinit(async () => {
      inner = await refreshState();
    });

    const result = await refreshState();

    expect(inner).toEqual({ ok: false, refreshing: true, url: window.location.href });
    expect(result).toEqual({ ok: true, url: window.location.href });
  });

  it('should rebuild the control panel with the same position on next mount', async () => {
    vi.resetModules();
    const { teardown } = await import('../src/refreshState.js');
    const { controlPanel } = await import('../src/components/controlPanel.js');

    controlPanel.setPosition('bottom-left');
    const firstBtn = document.createElement('button');
    firstBtn.id = 'test-rebuild-btn';
    controlPanel.mount(firstBtn, 2);

    const firstPanel = document.getElementById('dandelion-control-panel');
    expect(firstPanel).toBeTruthy();
    expect(firstPanel.style.bottom).toBe('0.75rem');
    expect(firstPanel.style.left).toBe('0.75rem');

    teardown();
    expect(document.getElementById('dandelion-control-panel')).toBeNull();

    const secondBtn = document.createElement('button');
    secondBtn.id = 'test-rebuild-btn-2';
    controlPanel.mount(secondBtn, 2);

    const secondPanel = document.getElementById('dandelion-control-panel');
    expect(secondPanel).toBeTruthy();
    expect(secondPanel).not.toBe(firstPanel);
    expect(secondPanel.style.bottom).toBe('0.75rem');
    expect(secondPanel.style.left).toBe('0.75rem');
  });
});

describe('refreshState x skrining handler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.resetModules();
  });

  it('should not leak document click listeners across re-init', async () => {
    const { teardown } = await import('../src/refreshState.js');
    const { initializeSkrining } = await import('../src/handlers/skrining.js');

    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const clickAdds = () => addSpy.mock.calls.filter(([type]) => type === 'click').length;
    const clickRemoves = () => removeSpy.mock.calls.filter(([type]) => type === 'click').length;

    initializeSkrining();
    expect(clickAdds()).toBe(1);

    teardown();
    expect(clickRemoves()).toBe(1);

    initializeSkrining();
    expect(clickAdds()).toBe(2);

    teardown();
    expect(clickRemoves()).toBe(2);
  });

  it('should disconnect the skrining MutationObserver on teardown', async () => {
    const { teardown } = await import('../src/refreshState.js');
    const { initializeSkrining } = await import('../src/handlers/skrining.js');

    document.body.innerHTML =
      '<input type="radio" name="a" id="radio-a"><button id="nextGenBtn">Mulai</button>';

    const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect');

    initializeSkrining();
    document.getElementById('nextGenBtn').click();

    teardown();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
