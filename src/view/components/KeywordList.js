import { html } from 'htm/preact';
import { useState, useRef, useCallback, useEffect } from 'preact/hooks';

export function KeywordList({ id, value = '', onChange, placeholder = 'Tambah kata kunci...' }) {
  const parse = useCallback((v) => {
    if (!v) return [];
    return v
      .split(';')
      .map((s) => s.trimStart())
      .filter(Boolean);
  }, []);

  const [items, setItems] = useState(() => parse(value));
  const [inputVal, setInputVal] = useState('');
  const dragIdx = useRef(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setItems(parse(value));
    }
  }, [value, parse]);

  const notify = useCallback(
    (newItems) => {
      const str = newItems.join(';');
      prevValue.current = str;
      if (onChange) onChange(str);
    },
    [onChange],
  );

  const addItem = () => {
    const v = inputVal.trimStart();
    if (!v || v.includes('\n')) return;
    const next = [...items, v];
    setItems(next);
    setInputVal('');
    notify(next);
  };

  const removeItem = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    notify(next);
  };

  return html`
    <div class="keyword-list-container">
      <input type="text" id="${id}-input" value=${items.join(';')} readonly style="display:none" />
      <div class="keyword-list" id="${id}-list">
        ${items.length === 0
          ? html`<div class="keyword-empty">Belum ada kata kunci.</div>`
          : items.map(
              (item, idx) => html`
                <div
                  class="keyword-item"
                  draggable="true"
                  onDragStart=${(e) => {
                    dragIdx.current = idx;
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver=${(e) => e.preventDefault()}
                  onDrop=${(e) => {
                    e.preventDefault();
                    if (dragIdx.current === null || dragIdx.current === idx) return;
                    const next = [...items];
                    const [moved] = next.splice(dragIdx.current, 1);
                    next.splice(idx, 0, moved);
                    setItems(next);
                    notify(next);
                    dragIdx.current = null;
                  }}
                  onDragEnd=${() => {
                    dragIdx.current = null;
                  }}
                >
                  <div class="drag-handle"><span></span><span></span><span></span></div>
                  <span class="keyword-text">${item}</span>
                  <button class="btn-remove" type="button" onClick=${() => removeItem(idx)}>
                    ×
                  </button>
                </div>
              `,
            )}
      </div>
      <div class="keyword-input-container">
        <input
          type="text"
          value=${inputVal}
          onInput=${(e) => setInputVal(e.target.value)}
          onKeyPress=${(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder=${placeholder}
        />
        <button type="button" class="btn-add" onClick=${addItem}>+</button>
      </div>
    </div>
  `;
}
