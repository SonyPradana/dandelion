import { describe, it, expect, beforeEach } from 'vitest';
import { createBasePanel, createPanelButton } from '../../../src/components/notification/base';

describe('createBasePanel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('should create a panel with given id', () => {
    const result = createBasePanel('test-panel');
    expect(result.panel).toBeTruthy();
    expect(result.panel.id).toBe('test-panel');
    expect(document.body.contains(result.panel)).toBe(true);
  });

  it('should return contentArea, setHeader, remove', () => {
    const result = createBasePanel('test-api');
    expect(result.contentArea).toBeTruthy();
    expect(result.contentArea.classList.contains('dandelion-panel-content')).toBe(true);
    expect(result.setHeader).toBeTypeOf('function');
    expect(result.remove).toBeTypeOf('function');
  });

  it('should inject panel animations style', () => {
    createBasePanel('style-test');
    const style = document.getElementById('dandelion-panel-animations');
    expect(style).toBeTruthy();
    expect(style.textContent).toContain('@keyframes dandelion-slide-in');
    expect(style.textContent).toContain('@keyframes dandelion-fade-out');
  });

  it('should not inject styles twice', () => {
    createBasePanel('p1');
    createBasePanel('p2');
    const styles = document.querySelectorAll('#dandelion-panel-animations');
    expect(styles.length).toBe(1);
  });

  it('should have close button', () => {
    const { panel } = createBasePanel('close-test');
    const closeBtn = panel.querySelector('div');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.innerHTML).toBe('×');
  });

  it('setHeader should return a DOM element', () => {
    const { setHeader } = createBasePanel('header-test');
    const el = setHeader('Test Title', '#ff0000');
    expect(el.tagName).toBe('DIV');
    expect(el.className).toBe('dandelion-panel-header');
    expect(el.textContent).toBe('TEST TITLE');
    expect(el.style.color).toBe('#ff0000');
  });

  it('remove should add hide class and animate', () => {
    const { panel, remove } = createBasePanel('remove-test');
    remove();
    expect(panel.classList.contains('dandelion-panel-hide')).toBe(true);
    expect(panel.classList.contains('dandelion-panel-show')).toBe(false);
  });

  it('should reuse existing panel with same id', () => {
    createBasePanel('reuse-panel');
    const result2 = createBasePanel('reuse-panel');
    expect(result2.panel.id).toBe('reuse-panel');
  });
});

describe('createPanelButton', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should create a button with given text', () => {
    const btn = createPanelButton('Click Me');
    expect(btn).toBeInstanceOf(HTMLButtonElement);
    expect(btn.textContent).toBe('Click Me');
  });

  it('should use default type styles', () => {
    const btn = createPanelButton('Default');
    expect(btn.style.background).toContain('rgba(255, 255, 255, 0.1)');
    expect(btn.style.color).toBe('white');
  });

  it('should use danger type styles', () => {
    const btn = createPanelButton('Delete', 'danger');
    expect(btn.style.background).toContain('rgba(255, 77, 77, 0.15)');
    expect(btn.style.color).toBe('#ff4d4d');
  });

  it('should use success type styles', () => {
    const btn = createPanelButton('OK', 'success');
    expect(btn.style.background).toContain('rgba(34, 197, 94, 0.15)');
    expect(btn.style.color).toBe('#4ade80');
  });
});
