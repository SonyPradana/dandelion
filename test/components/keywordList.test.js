import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeywordList } from '../../src/view/components/KeywordList.js';

function mount(onChange) {
  document.body.innerHTML = `
    <input id="keywords-input">
    <div id="keywords-list"></div>
    <input id="keywords-add-input">
    <button id="keywords-add"></button>
  `;
  return new KeywordList(
    'keywords-input',
    'keywords-list',
    'keywords-add-input',
    'keywords-add',
    onChange,
  );
}

describe('KeywordList', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should call onChange with the new value after adding an item', () => {
    const onChange = vi.fn();
    const list = mount(onChange);

    list.inputElement.value = 'alpha';
    list.addButton.click();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('alpha');
  });

  it('should call onChange after removing an item', () => {
    const onChange = vi.fn();
    const list = mount(onChange);

    list.inputElement.value = 'alpha';
    list.addButton.click();
    list.removeItem(0);

    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('should not call onChange while initializing', () => {
    const onChange = vi.fn();
    document.body.innerHTML = `
      <input id="keywords-input" value="alpha;beta">
      <div id="keywords-list"></div>
      <input id="keywords-add-input">
      <button id="keywords-add"></button>
    `;

    const list = new KeywordList(
      'keywords-input',
      'keywords-list',
      'keywords-add-input',
      'keywords-add',
      onChange,
    );

    expect(list.items).toEqual(['alpha', 'beta']);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should work without an onChange callback', () => {
    const list = mount();

    expect(() => {
      list.inputElement.value = 'alpha';
      list.addButton.click();
    }).not.toThrow();

    expect(list.sourceTextbox.value).toBe('alpha');
  });
});
