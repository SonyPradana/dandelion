// @vitest-environment jsdom
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
  });
});
