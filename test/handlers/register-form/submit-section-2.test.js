import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { submitSection2 } from '../../../src/handlers/register-form/submit-section-2.js';

function makeSubmitButton() {
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn-fill-primary';
  btn.textContent = 'Selanjutnya';
  return btn;
}

describe('submitSection2', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('success', () => {
    it('should click the submit button and return true', async () => {
      const btn = makeSubmitButton();
      document.body.appendChild(btn);

      const spy = vi.spyOn(HTMLButtonElement.prototype, 'click');
      const promise = submitSection2();
      await vi.advanceTimersByTimeAsync(0);
      expect(await promise).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('should return true when button appears after a delay', async () => {
      setTimeout(() => {
        document.body.appendChild(makeSubmitButton());
      }, 500);

      const promise = submitSection2();
      await vi.advanceTimersByTimeAsync(1000);
      expect(await promise).toBe(true);
    });
  });

  describe('failure', () => {
    it('should return false when button never appears', async () => {
      const promise = submitSection2();
      await vi.advanceTimersByTimeAsync(11_000);
      expect(await promise).toBe(false);
    });
  });
});
