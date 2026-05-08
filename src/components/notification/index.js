import { createBasePanel, createPanelButton } from './base';

/**
 * Custom Notification API
 */
export const notify = {
  /**
   * Simple flash info notification
   */
  info(title, message, duration = 3000) {
    const id = `dandelion-info-${Date.now()}`;
    const { panel, setHeader, remove } = createBasePanel(id);

    panel.innerHTML += `
      ${setHeader(title, '#4ade80')}
      <div style="font-size: 11px; line-height: 1.4; opacity: 0.9;">${message}</div>
    `;

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

      panel.innerHTML = `
        ${setHeader(title, '#ffd700')}
        <div style="font-size: 11px; line-height: 1.4; opacity: 0.9; margin-bottom: 5px;">${message}</div>
      `;

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

      panel.innerHTML = `
        ${setHeader(title, '#60a5fa')}
        <div style="font-size: 11px; line-height: 1.4; opacity: 0.9; margin-bottom: 5px;">${message}</div>
      `;

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
  action(title, message, actions = []) {
    const id = `dandelion-action-${Date.now()}`;
    const { panel, setHeader, remove } = createBasePanel(id);

    panel.innerHTML = `
      ${setHeader(title, '#ff4d4d')}
      <div style="font-size: 11px; line-height: 1.4; opacity: 0.9; margin-bottom: 5px;">${message}</div>
    `;

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
};
