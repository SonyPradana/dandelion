import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { controlPanel } from '../../../src/components/controlPanel';

describe('notify', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    controlPanel.init();
  });

  describe('info', () => {
    it('should create info panel with header and message', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      notify.info('Test Title', 'Test message');
      const panel = document.querySelector('[id^="dandelion-info-"]');
      expect(panel).toBeTruthy();
      expect(panel.innerHTML).toContain('TEST TITLE');
      expect(panel.innerHTML).toContain('Test message');
    });

    it('should not create panel when silenced', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      notify.setConfig({ silenceInfoNotification: true });
      notify.info('Silent', 'Should not appear');
      const panels = document.querySelectorAll('[id^="dandelion-info-"]');
      expect(panels.length).toBe(0);
    });
  });

  describe('alert', () => {
    it('should create alert panel with OK button', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      notify.alert('Alert Title', 'Alert message');
      const panel = document.querySelector('[id^="dandelion-alert-"]');
      expect(panel).toBeTruthy();
      expect(panel.innerHTML).toContain('ALERT TITLE');
    });

    it('should resolve promise on OK click', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const promise = notify.alert('OK', 'Click OK');
      const okBtn = document.querySelector('[id^="dandelion-alert-"] button');
      okBtn.click();
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('confirm', () => {
    it('should create confirm panel with Ya and Batal buttons', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      notify.confirm('Confirm', 'Are you sure?');
      const panel = document.querySelector('[id^="dandelion-confirm-"]');
      expect(panel).toBeTruthy();
      expect(panel.textContent).toContain('Ya');
      expect(panel.textContent).toContain('Batal');
    });

    it('should resolve true on Ya click', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const promise = notify.confirm('Test', 'Msg');
      const buttons = document.querySelectorAll('[id^="dandelion-confirm-"] button');
      const yaBtn = buttons[1];
      yaBtn.click();
      await expect(promise).resolves.toBe(true);
    });

    it('should resolve false on Batal click', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const promise = notify.confirm('Test', 'Msg');
      const buttons = document.querySelectorAll('[id^="dandelion-confirm-"] button');
      const batalBtn = buttons[0];
      batalBtn.click();
      await expect(promise).resolves.toBe(false);
    });
  });

  describe('action', () => {
    it('should create panel with custom action buttons', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const onClick = vi.fn();
      notify.action('Action', 'Do something', [{ label: 'Go', onClick }]);
      const panel = document.querySelector('[id^="dandelion-action-"]');
      expect(panel).toBeTruthy();
      const btn = panel.querySelector('button');
      expect(btn.textContent).toBe('Go');
      btn.click();
      expect(onClick).toHaveBeenCalled();
    });

    it('should return { panel, remove }', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const result = notify.action('Test', 'Msg', []);
      expect(result.panel).toBeTruthy();
      expect(result.remove).toBeTypeOf('function');
    });
  });

  describe('countdown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create countdown panel with progress bar', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise, dismiss } = notify.countdown('Count', null, 5000);
      const panel = document.querySelector('[id^="dandelion-countdown-"]');
      expect(panel).toBeTruthy();
      expect(panel.innerHTML).toContain('COUNT');
      dismiss();
      await expect(promise).resolves.toBe(false);
    });

    it('should resolve false on dismiss click', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise, dismiss: _dismiss } = notify.countdown('Count', null, 5000);
      const buttons = document.querySelectorAll('[id^="dandelion-countdown-"] button');
      const dismissBtn = buttons[1];
      dismissBtn.click();
      await expect(promise).resolves.toBe(false);
    });

    it('should resolve true on OK click', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise, dismiss: _dismiss2 } = notify.countdown('Count', null, 5000);
      const buttons = document.querySelectorAll('[id^="dandelion-countdown-"] button');
      const okBtn = buttons[0];
      okBtn.click();
      await expect(promise).resolves.toBe(true);
    });

    it('should show initial countdown label based on duration', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise, dismiss } = notify.countdown('Count', null, 5000);
      const okBtn = document.querySelector('[id^="dandelion-countdown-"] button');
      expect(okBtn.textContent).toBe('OK (5d)');
      dismiss();
      await expect(promise).resolves.toBe(false);
    });

    it('should update countdown text based on elapsed ms', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise, dismiss } = notify.countdown('Count', null, 5000);
      const okBtn = document.querySelector('[id^="dandelion-countdown-"] button');

      expect(okBtn.textContent).toBe('OK (5d)');
      vi.advanceTimersByTime(1000);
      expect(okBtn.textContent).toBe('OK (4d)');
      vi.advanceTimersByTime(1000);
      expect(okBtn.textContent).toBe('OK (3d)');
      vi.advanceTimersByTime(2000);
      expect(okBtn.textContent).toBe('OK (1d)');

      dismiss();
      await expect(promise).resolves.toBe(false);
    });

    it('should resolve exactly when duration elapses even if not a multiple of 1000ms', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise } = notify.countdown('Count', null, 1500);
      const okBtn = document.querySelector('[id^="dandelion-countdown-"] button');

      expect(okBtn.textContent).toBe('OK (2d)');

      let outcome = 'pending';
      promise.then((v) => {
        outcome = `resolved:${v}`;
      });

      vi.advanceTimersByTime(1400);
      await Promise.resolve();
      expect(outcome).toBe('pending');
      expect(okBtn.textContent).toBe('OK (1d)');

      vi.advanceTimersByTime(100);
      await Promise.resolve();
      expect(outcome).toBe('resolved:true');
    });

    it('should shrink the progress bar in sync with elapsed ms', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise } = notify.countdown('Count', null, 5000);
      const fill = document.querySelector('[id^="dandelion-countdown-"] > div > div');

      expect(fill.style.width).toBe('100%');
      vi.advanceTimersByTime(1000);
      expect(fill.style.width).toBe('80%');
      vi.advanceTimersByTime(1000);
      expect(fill.style.width).toBe('60%');
      vi.advanceTimersByTime(1000);
      expect(fill.style.width).toBe('40%');
      vi.advanceTimersByTime(2000);
      expect(fill.style.width).toBe('0%');

      await expect(promise).resolves.toBe(true);
    });

    it('should keep the panel open when keepOpenOnTimeout is true', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise, close } = notify.countdown('Count', null, 1500, {
        keepOpenOnTimeout: true,
      });

      let outcome = 'pending';
      promise.then((v) => {
        outcome = `resolved:${v}`;
      });

      vi.advanceTimersByTime(1500);
      await Promise.resolve();
      expect(outcome).toBe('resolved:true');

      const panels = document.querySelectorAll('[id^="dandelion-countdown-"]');
      const panel = panels[panels.length - 1];
      expect(panel).toBeTruthy();
      expect(panel.classList.contains('dandelion-panel-hide')).toBe(false);
      close();
      expect(panel.classList.contains('dandelion-panel-hide')).toBe(true);
    });

    it('should restart the whole countdown and update the message via restart()', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise, restart } = notify.countdown('Count', 'menunggu...', 5000);
      const fills = document.querySelectorAll('[id^="dandelion-countdown-"] > div > div');
      const fill = fills[fills.length - 1];
      const panels = document.querySelectorAll('[id^="dandelion-countdown-"]');
      const panel = panels[panels.length - 1];
      const okBtn = panel.querySelector('button');
      const msgEl = [...panel.querySelectorAll('div')].find(
        (el) => el.textContent === 'menunggu...',
      );

      expect(okBtn.textContent).toBe('OK (5d)');
      expect(msgEl.textContent).toBe('menunggu...');

      restart(3000, 'menunggu... (1/3)');
      expect(fill.style.width).toBe('100%');
      expect(okBtn.textContent).toBe('OK (3d)');
      expect(msgEl.textContent).toBe('menunggu... (1/3)');

      restart(2000);
      expect(msgEl.textContent).toBe('menunggu... (1/3)');

      vi.advanceTimersByTime(1000);
      expect(okBtn.textContent).toBe('OK (1d)');

      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await expect(promise).resolves.toBe(true);
    });

    it('should close an already-resolved keepOpen countdown via close()', async () => {
      const { notify } = await import('../../../src/components/notification/index');
      const { promise, close } = notify.countdown('Count', null, 1500, {
        keepOpenOnTimeout: true,
      });

      vi.advanceTimersByTime(1500);
      await Promise.resolve();
      await expect(promise).resolves.toBe(true);

      const panels = document.querySelectorAll('[id^="dandelion-countdown-"]');
      const panel = panels[panels.length - 1];
      expect(panel).toBeTruthy();
      expect(panel.classList.contains('dandelion-panel-hide')).toBe(false);

      close();
      expect(panel.classList.contains('dandelion-panel-hide')).toBe(true);
    });
  });
});
