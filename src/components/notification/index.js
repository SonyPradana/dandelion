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
   * Returns { promise, dismiss } where promise resolves true (OK/timeout) or false (dismiss).
   */
  countdown(title, message, duration = 5000) {
    let resolved = false;
    let timer = null;
    let _cleanup = null;
    let _resolve = null;

    const promise = new Promise((resolve) => {
      _resolve = resolve;

      const id = `dandelion-countdown-${Date.now()}`;
      const { panel, setHeader, remove } = createBasePanel(id);
      let remaining = Math.ceil(duration / 1000);

      panel.append(setHeader(title, '#60a5fa'));

      if (message) {
        const msgEl = document.createElement('div');
        msgEl.style.cssText = 'font-size: 11px; line-height: 1.4; opacity: 0.9;';
        msgEl.textContent = message;
        panel.appendChild(msgEl);
      }

      const progressContainer = document.createElement('div');
      progressContainer.style.cssText =
        'width: 100%; height: 3px; background: rgba(255,255,255,0.12); border-radius: 2px; margin: 6px 0; overflow: hidden;';

      const progressFill = document.createElement('div');
      progressFill.style.cssText =
        'width: 100%; height: 100%; background: #60a5fa; border-radius: 2px; transition: width ' +
        duration +
        'ms linear;';

      progressContainer.appendChild(progressFill);
      panel.appendChild(progressContainer);

      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '5px';

      const okBtn = createPanelButton(`OK (${remaining}s)`, 'success');
      okBtn.style.flex = '1';

      const dismissBtn = createPanelButton('Dismiss', 'default');
      dismissBtn.style.flex = '1';

      btnContainer.appendChild(okBtn);
      btnContainer.appendChild(dismissBtn);
      panel.appendChild(btnContainer);

      _cleanup = () => {
        if (resolved) return;
        resolved = true;
        clearInterval(timer);
        remove();
      };

      okBtn.onclick = () => {
        if (resolved) return;
        _cleanup();
        _resolve(true);
      };

      dismissBtn.onclick = () => {
        if (resolved) return;
        _cleanup();
        _resolve(false);
      };

      requestAnimationFrame(() => {
        progressFill.style.width = '0%';
      });

      timer = setInterval(() => {
        remaining--;
        okBtn.textContent = `OK (${remaining}s)`;
        if (remaining <= 0 && !resolved) {
          _cleanup();
          _resolve(true);
        }
      }, 1000);
    });

    return {
      promise,
      dismiss() {
        if (resolved) return;
        _cleanup();
        _resolve(false);
      },
    };
  },
};
