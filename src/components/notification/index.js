import { h } from '../../utils/dom';
import { createBasePanel, createPanelButton } from './base';

/**
 * Custom Notification API
 */
export const notify = {
  _silenceInfo: false,

  setConfig(config) {
    this._silenceInfo = Boolean(config.silenceInfoNotification);
  },

  /**
   * Simple flash info notification
   */
  info(title, message, duration = 3000) {
    if (this._silenceInfo) return;

    const id = `dandelion-info-${Date.now()}`;
    const { contentArea, setHeader, remove } = createBasePanel(id);

    contentArea.append(
      setHeader(title, '#4ade80'),
      h('div', { style: 'font-size: 11px; line-height: 1.4; opacity: 0.9;' }, message),
    );

    if (duration > 0) {
      setTimeout(remove, duration);
    }
  },
  /**
   * Alert notification (Promise based)
   */
  alert(title, message) {
    const existing = document.querySelectorAll('[id^="dandelion-alert-"]');
    existing.forEach((el) => el.remove());

    return new Promise((resolve) => {
      const id = `dandelion-alert-${Date.now()}`;
      const { panel, setHeader, remove } = createBasePanel(id);

      panel.append(
        setHeader(title, '#ffd700'),
        h(
          'div',
          { style: 'font-size: 11px; line-height: 1.4; opacity: 0.9; margin-bottom: 5px;' },
          message,
        ),
      );

      const okBtn = createPanelButton('OK', 'success');
      okBtn.onclick = () => {
        remove();
        resolve();
      };
      panel.appendChild(okBtn);
    });
  },

  /**
   * Confirm notification (Promise based)
   */
  confirm(title, message) {
    const existing = document.querySelectorAll('[id^="dandelion-confirm-"]');
    existing.forEach((el) => el.remove());

    return new Promise((resolve) => {
      const id = `dandelion-confirm-${Date.now()}`;
      const { panel, setHeader, remove } = createBasePanel(id);

      panel.append(
        setHeader(title, '#60a5fa'),
        h(
          'div',
          { style: 'font-size: 11px; line-height: 1.4; opacity: 0.9; margin-bottom: 5px;' },
          message,
        ),
      );

      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '5px';

      const cancelBtn = createPanelButton('Batal');
      cancelBtn.onclick = () => {
        remove();
        resolve(false);
      };

      const confirmBtn = createPanelButton('Ya', 'success');
      confirmBtn.onclick = () => {
        remove();
        resolve(true);
      };

      btnContainer.appendChild(cancelBtn);
      btnContainer.appendChild(confirmBtn);
      panel.appendChild(btnContainer);
    });
  },

  /**
   * Custom Action panel
   */
  action(title, message, actions = [], { pinned } = {}) {
    document.querySelectorAll('[id^="dandelion-action-"]').forEach((el) => el.remove());
    const id = `dandelion-action-${Date.now()}`;
    const { panel, setHeader, remove } = createBasePanel(id, pinned);

    panel.append(
      setHeader(title, '#ff4d4d'),
      h(
        'div',
        { style: 'font-size: 11px; line-height: 1.4; opacity: 0.9; margin-bottom: 5px;' },
        message,
      ),
    );

    actions.forEach((action) => {
      const btn = createPanelButton(action.label, action.type || 'default');
      btn.onclick = () => {
        if (action.autoClose !== false) remove();
        if (action.onClick) action.onClick();
      };
      panel.appendChild(btn);
    });

    return { panel, remove };
  },

  /**
   * Countdown notification with progress bar and auto-OK on timeout.
   * Returns { promise, dismiss, close, restart } where promise resolves
   * true (OK/timeout) or false (dismiss).
   */
  countdown(title, message, duration = 5000, { keepOpenOnTimeout = false } = {}) {
    let resolved = false;
    let timer = null;
    let timeoutTimer = null;
    let _cleanup = null;
    let _resolve = null;
    let removePanel = null;
    let start = null;
    let currentDuration = duration;
    let lastLabel = '';
    let tick = null;
    let arm = null;

    const promise = new Promise((resolve) => {
      _resolve = resolve;

      const id = `dandelion-countdown-${Date.now()}`;
      const { panel, setHeader, remove } = createBasePanel(id);
      removePanel = remove;

      panel.append(setHeader(title, '#60a5fa'));

      let msgEl = null;
      if (message) {
        msgEl = document.createElement('div');
        msgEl.style.cssText = 'font-size: 11px; line-height: 1.4; opacity: 0.9;';
        msgEl.textContent = message;
        panel.appendChild(msgEl);
      }

      const progressContainer = document.createElement('div');
      progressContainer.style.cssText =
        'width: 100%; height: 3px; background: rgba(255,255,255,0.12); border-radius: 2px; margin: 6px 0; overflow: hidden;';

      const progressFill = document.createElement('div');
      progressFill.style.cssText =
        'width: 100%; height: 100%; background: #60a5fa; border-radius: 2px;';

      progressContainer.appendChild(progressFill);
      panel.appendChild(progressContainer);

      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '5px';

      const okBtn = createPanelButton('');
      okBtn.style.flex = '1';

      const dismissBtn = createPanelButton('Dismiss', 'default');
      dismissBtn.style.flex = '1';

      btnContainer.appendChild(okBtn);
      btnContainer.appendChild(dismissBtn);
      panel.appendChild(btnContainer);

      _cleanup = (keepOpen = false) => {
        if (resolved) return;
        resolved = true;
        clearInterval(timer);
        clearTimeout(timeoutTimer);
        if (!keepOpen) remove();
      };

      okBtn.onclick = () => {
        if (resolved) return;
        _cleanup(keepOpenOnTimeout);
        _resolve(true);
      };

      dismissBtn.onclick = () => {
        if (resolved) return;
        _cleanup();
        _resolve(false);
      };

      tick = () => {
        const remainingMs = Math.max(0, currentDuration - (Date.now() - start));
        const label = remainingMs > 0 ? `OK (${Math.ceil(remainingMs / 1000)}d)` : 'OK';

        if (label !== lastLabel) {
          lastLabel = label;
          okBtn.textContent = label;
        }

        const pct = currentDuration > 0 ? (remainingMs / currentDuration) * 100 : 0;
        progressFill.style.width = `${pct}%`;

        if (remainingMs <= 0 && !resolved) {
          _cleanup(keepOpenOnTimeout);
          _resolve(true);
        }
      };

      arm = (nextDuration, label) => {
        start = Date.now();
        currentDuration = nextDuration;
        lastLabel = '';
        if (label !== undefined && msgEl) msgEl.textContent = label;
        clearInterval(timer);
        clearTimeout(timeoutTimer);
        resolved = false;
        tick();
        timer = setInterval(tick, 200);
        timeoutTimer = setTimeout(() => {
          if (resolved) return;
          _cleanup(keepOpenOnTimeout);
          _resolve(true);
        }, currentDuration);
      };
      arm(duration);
    });

    return {
      promise,
      dismiss() {
        if (resolved) return;
        _cleanup();
        _resolve(false);
      },
      close() {
        removePanel();
      },
      restart(nextDuration, label) {
        if (arm) arm(nextDuration === undefined ? currentDuration : nextDuration, label);
      },
    };
  },
};
