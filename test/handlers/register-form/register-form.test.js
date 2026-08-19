import { describe, it, expect, beforeEach } from 'vitest';
import { detectCurrentStep, isRegisterFormResumable } from '../../../src/handlers/register-form.js';

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

function makeFormModal(buttonLabel) {
  const modal = document.createElement('div');
  modal.className =
    'fixed top-0 left-0 z-1000 w-full h-full flex justify-center items-center backdrop-blur-5';
  const header = document.createElement('div');
  header.textContent = 'Formulir Pendaftaran';
  modal.appendChild(header);
  if (buttonLabel) {
    const btn = document.createElement('button');
    btn.textContent = buttonLabel;
    modal.appendChild(btn);
  }
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

  it('should return section-3 with three green bars', () => {
    makeGreenStepper(3);
    expect(detectCurrentStep()).toBe('section-3');
  });

  it('should return section-3 from open modal with Daftarkan with NIK button', () => {
    makeFormModal('Daftarkan dengan NIK');
    expect(detectCurrentStep()).toBe('section-3');
  });

  it('should return section-3 from open modal with Pilih button', () => {
    makeFormModal('Pilih');
    expect(detectCurrentStep()).toBe('section-3');
  });

  it('should return unknown from open modal without submit button', () => {
    makeFormModal(null);
    expect(detectCurrentStep()).toBe('unknown');
  });

  it('should return unknown when searchNik exists but no stepper/modal', () => {
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

  it('should be true on section-3', () => {
    makeGreenStepper(3);
    expect(isRegisterFormResumable()).toBe(true);
  });

  it('should be false when searchNik exists (section-4 is not DOM-resumable)', () => {
    const input = document.createElement('input');
    input.id = 'searchNik';
    document.body.appendChild(input);
    expect(isRegisterFormResumable()).toBe(false);
  });
});
