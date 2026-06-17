// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { controlPanel } from '../../src/components/controlPanel';

describe('controlPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('init should create panel in document.body', () => {
    controlPanel.init();
    const panel = document.getElementById('dandelion-control-panel');
    expect(panel).toBeTruthy();
    expect(document.body.contains(panel)).toBe(true);
  });

  it('init should create 4 slots', () => {
    controlPanel.init();
    expect(controlPanel.slots[1]).toBeTruthy();
    expect(controlPanel.slots[2]).toBeTruthy();
    expect(controlPanel.slots[3]).toBeTruthy();
    expect(controlPanel.slots[4]).toBeTruthy();
  });

  it('init should be idempotent', () => {
    controlPanel.init();
    const panel1 = document.getElementById('dandelion-control-panel');
    controlPanel.init();
    const panel2 = document.getElementById('dandelion-control-panel');
    expect(panel1).toBe(panel2);
  });

  it('mount should add element to slot', () => {
    controlPanel.init();
    const el = document.createElement('div');
    el.id = 'test-el';
    controlPanel.mount(el, 1);
    expect(controlPanel.slots[1].contains(el)).toBe(true);
  });

  it('mount should auto-init if not yet initialized', () => {
    const el = document.createElement('div');
    el.id = 'auto-init-el';
    controlPanel.mount(el, 1);
    const panel = document.getElementById('dandelion-control-panel');
    expect(panel).toBeTruthy();
    expect(controlPanel.slots[1].contains(el)).toBe(true);
  });

  it('mount with slot 3 should remove oldest when >5 children', () => {
    controlPanel.init();
    const children = [];
    for (let i = 0; i < 6; i++) {
      const el = document.createElement('div');
      el.id = `child-${i}`;
      el.textContent = String(i);
      controlPanel.mount(el, 3);
      children.push(el);
    }
    expect(controlPanel.slots[3].children.length).toBe(5);
    expect(controlPanel.slots[3].querySelector('#child-0')).toBeNull();
    expect(controlPanel.slots[3].querySelector('#child-1')).toBeTruthy();
  });

  it('mount with debug-toggle id should prepend in slot 2', () => {
    controlPanel.init();
    const btn = document.createElement('button');
    btn.id = 'dandelion-debug-toggle';
    controlPanel.mount(btn, 2);
    expect(controlPanel.slots[2].firstChild).toBe(btn);
  });

  it('mount should not add duplicate element', () => {
    controlPanel.init();
    const el = document.createElement('div');
    el.id = 'dup-el';
    const slot1 = controlPanel.slots[1];
    slot1.appendChild(el);
    expect(slot1.children.length).toBe(2); // slot4 + el
    controlPanel.mount(el, 1);
    expect(slot1.children.length).toBe(2);
  });

  it('remove should detach element from slot', () => {
    controlPanel.init();
    const el = document.createElement('div');
    el.id = 'remove-el';
    controlPanel.mount(el, 2);
    controlPanel.remove(el);
    expect(controlPanel.slots[2].contains(el)).toBe(false);
  });

  it('remove should work with string id', () => {
    controlPanel.init();
    const el = document.createElement('div');
    el.id = 'string-rm';
    controlPanel.mount(el, 1);
    controlPanel.remove('string-rm');
    expect(controlPanel.slots[1].contains(el)).toBe(false);
  });

  it('remove should do nothing for non-slot element', () => {
    controlPanel.init();
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(() => controlPanel.remove(el)).not.toThrow();
  });

  it('setPosition should update panel position', () => {
    controlPanel.init();
    controlPanel.setPosition('bottom-left');
    expect(controlPanel.position).toBe('bottom-left');
    const panel = document.getElementById('dandelion-control-panel');
    expect(panel.style.bottom).toBe('0.75rem');
    expect(panel.style.left).toBe('0.75rem');
  });

  it('setPosition should throw for invalid position', () => {
    expect(() => controlPanel.setPosition('invalid')).toThrow('Invalid position');
  });

  it('init with non-default position should use position from earlier setPosition', () => {
    controlPanel.setPosition('top-left');
    controlPanel.init();
    const panel = document.getElementById('dandelion-control-panel');
    expect(panel.style.top).toBe('0.75rem');
    expect(panel.style.left).toBe('0.75rem');
  });
});
