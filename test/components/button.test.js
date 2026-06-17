// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { button } from '../../src/components/button';

describe('button', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('should create a button with given id', () => {
    const btn = button('test-btn');
    expect(btn).toBeInstanceOf(HTMLButtonElement);
    expect(btn.id).toBe('test-btn');
  });

  it('should inject global styles on first call', () => {
    button('btn1');
    const style = document.getElementById('dandelion-component-states');
    expect(style).toBeTruthy();
    expect(style.textContent).toContain('.dandelion-running');
    expect(style.textContent).toContain('.dandelion-dimmed');
  });

  it('should not inject styles twice', () => {
    button('btn1');
    button('btn2');
    const styles = document.querySelectorAll('#dandelion-component-states');
    expect(styles.length).toBe(1);
  });

  it('should return undefined if button id already exists in DOM', () => {
    const btn = button('dup');
    document.body.appendChild(btn);
    const result = button('dup');
    expect(result).toBeUndefined();
  });

  it('setRunning should toggle dandelion-running class', () => {
    const btn = button('run');
    btn.setRunning(true);
    expect(btn.classList.contains('dandelion-running')).toBe(true);
    btn.setRunning(false);
    expect(btn.classList.contains('dandelion-running')).toBe(false);
  });

  it('setDimmed should toggle dandelion-dimmed class', () => {
    const btn = button('dim');
    btn.setDimmed(true);
    expect(btn.classList.contains('dandelion-dimmed')).toBe(true);
    btn.setDimmed(false);
    expect(btn.classList.contains('dandelion-dimmed')).toBe(false);
  });

  it('reset should remove both state classes', () => {
    const btn = button('rst');
    btn.setRunning(true);
    btn.setDimmed(true);
    btn.reset();
    expect(btn.classList.contains('dandelion-running')).toBe(false);
    expect(btn.classList.contains('dandelion-dimmed')).toBe(false);
  });

  it('mousedown should scale when not running/dimmed', () => {
    const btn = button('md');
    btn.dispatchEvent(new MouseEvent('mousedown'));
    expect(btn.style.transform).toBe('scale(0.95)');
  });

  it('mouseup should reset scale', () => {
    const btn = button('mu');
    btn.dispatchEvent(new MouseEvent('mousedown'));
    btn.dispatchEvent(new MouseEvent('mouseup'));
    expect(btn.style.transform).toBe('scale(1)');
  });

  it('mousedown should be ignored when running', () => {
    const btn = button('ign-run');
    btn.setRunning(true);
    btn.dispatchEvent(new MouseEvent('mousedown'));
    expect(btn.style.transform).not.toBe('scale(0.95)');
  });

  it('mousedown should be ignored when dimmed', () => {
    const btn = button('ign-dim');
    btn.setDimmed(true);
    btn.dispatchEvent(new MouseEvent('mousedown'));
    expect(btn.style.transform).not.toBe('scale(0.95)');
  });
});
