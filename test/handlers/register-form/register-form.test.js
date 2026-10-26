import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectCurrentStep,
  isRecapPanelMounted,
  isRegisterFormResumable,
} from '../../../src/handlers/register-form.js';

function makeGreenStepper(count) {
  const stepper = document.createElement('div');
  stepper.className = 'stepper';
  for (let i = 0; i < count; i++) {
    const bar = document.createElement('div');
    bar.className = 'bg-[#16B3AC]';
    stepper.appendChild(bar);
  }
  document.body.appendChild(stepper);
}

function makeSuccessModal() {
  const modal = document.createElement('div');
  modal.className = 'rounded-lg bg-white p-4';
  const title = document.createElement('div');
  title.textContent = 'Berhasil Daftar';
  modal.appendChild(title);
  document.body.appendChild(modal);
  return modal;
}

describe('detectCurrentStep', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('should return unknown when nothing matches', () => {
    expect(detectCurrentStep()).toBe('unknown');
  });

  it('should return section-1 with one green bar', () => {
    makeGreenStepper(1);
    expect(detectCurrentStep()).toBe('section-1');
  });

  it('should return section-2 with two green bars', () => {
    makeGreenStepper(2);
    expect(detectCurrentStep()).toBe('section-2');
  });

  it('should return confirmation when the success modal is open', () => {
    makeGreenStepper(2);
    makeSuccessModal();
    expect(detectCurrentStep()).toBe('confirmation');
  });

  it('should ignore legacy attendance signals', () => {
    const input = document.createElement('input');
    input.id = 'searchNik';
    document.body.appendChild(input);
    expect(detectCurrentStep()).toBe('unknown');
  });
});

describe('isRegisterFormResumable', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('should be false on unknown state', () => {
    expect(isRegisterFormResumable()).toBe(false);
  });

  it('should be false on section-1', () => {
    makeGreenStepper(1);
    expect(isRegisterFormResumable()).toBe(false);
  });

  it('should be true on section-2', () => {
    makeGreenStepper(2);
    expect(isRegisterFormResumable()).toBe(true);
  });

  it('should be true on confirmation', () => {
    makeSuccessModal();
    expect(isRegisterFormResumable()).toBe(true);
  });
});

describe('isRecapPanelMounted', () => {
  it('checks the panel element on the notify handle', () => {
    const panel = document.createElement('div');
    document.body.appendChild(panel);

    expect(isRecapPanelMounted({ panel, remove: () => {} })).toBe(true);

    panel.remove();
    expect(isRecapPanelMounted({ panel, remove: () => {} })).toBe(false);
  });

  it('returns false when the handle is missing', () => {
    expect(isRecapPanelMounted(null)).toBe(false);
  });
});
