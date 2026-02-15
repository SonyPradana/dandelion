/**
 * KeyValueList Component
 *
 * A reusable component for managing key-value pairs with multi-line value support.
 * Key column is readonly after creation, value column is editable with textarea.
 * Data is stored directly as an object without textbox binding.
 *
 * @class
 * @example
 * // HTML structure required:
 * // <div id="kv-list-container"></div>
 *
 * const kvList = new KeyValueList(
 *   'kv-list-container',
 *   { "key1": "value1", "key2": "multi\nline" },
 *   (newData) => {
 *     console.log('Data changed:', newData);
 *     saveToStorage(newData);
 *   }
 * );
 */
export class KeyValueList {
  /**
   * Creates a new KeyValueList instance
   *
   * @param {string} containerId - ID of the container element
   * @param {Object.<string, string>} initialData - Initial key-value pairs object
   * @param {Function} onChangeCallback - Callback function called when data changes
   * @throws {Error} If container element is not found
   */
  constructor (containerId, initialData, onChangeCallback) {
    /** @type {HTMLElement} Container element for the key-value list */
    this.container = document.getElementById(containerId);

    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    /** @type {Object.<string, string>} Key-value pairs data */
    this.data = initialData || {};

    /** @type {Function} Callback function for data changes */
    this.onChange = onChangeCallback || (() => {});

    this.init();
  }

  /**
   * Initializes the component by rendering the UI
   *
   * @private
   * @returns {void}
   */
  init () {
    this.render();
  }

  /**
   * Gets the current data object
   *
   * @public
   * @returns {Object.<string, string>} Current key-value pairs
   */
  getData () {
    return { ...this.data };
  }

  /**
   * Sets new data and re-renders the component
   *
   * @public
   * @param {Object.<string, string>} newData - New key-value pairs object
   * @returns {void}
   */
  setData (newData) {
    this.data = newData || {};
    this.render();
  }

  /**
   * Adds a new key-value pair
   *
   * Validates that the key is non-empty and doesn't already exist.
   *
   * @public
   * @param {string} key - The key (must be unique and non-empty)
   * @param {string} value - The value (can be multi-line)
   * @returns {boolean} True if added successfully, false otherwise
   */
  addItem (key, value) {
    const trimmedKey = key.trim();

    if (!trimmedKey) {
      return false;
    }

    // Validate: key must be unique
    if (Object.prototype.hasOwnProperty.call(this.data, trimmedKey)) {
      alert('Key already exists!');
      return false;
    }

    this.data[trimmedKey] = value || '';
    this.render();
    this.notifyChange();
    return true;
  }

  /**
   * Removes a key-value pair by key
   *
   * @public
   * @param {string} key - The key to remove
   * @returns {void}
   */
  removeItem (key) {
    delete this.data[key];
    this.render();
    this.notifyChange();
  }

  /**
   * Updates the value for a specific key
   *
   * @public
   * @param {string} key - The key to update
   * @param {string} newValue - The new value
   * @returns {void}
   */
  updateValue (key, newValue) {
    if (Object.prototype.hasOwnProperty.call(this.data, key)) {
      this.data[key] = newValue;
      this.notifyChange();
    }
  }

  /**
   * Notifies that data has changed by calling the onChange callback
   *
   * @private
   * @returns {void}
   */
  notifyChange () {
    this.onChange(this.getData());
  }

  /**
   * Renders the key-value list to the DOM
   *
   * Creates a table-like structure with:
   * - Header row
   * - Data rows (key readonly, value editable textarea, delete button)
   * - Add row (key input, value textarea, add button)
   *
   * @private
   * @returns {void}
   */
  render () {
    this.container.innerHTML = '';

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'kv-list-wrapper';

    // Create header
    const header = document.createElement('div');
    header.className = 'kv-list-header';
    header.innerHTML = `
      <div class="kv-header-key">Key</div>
      <div class="kv-header-value">Value</div>
      <div class="kv-header-action"></div>
    `;
    wrapper.appendChild(header);

    // Create items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'kv-list-items';

    // Render existing items
    const keys = Object.keys(this.data);

    if (keys.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'kv-empty-state';
      emptyState.textContent = 'Belum ada data. Tambahkan key-value baru di bawah.';
      itemsContainer.appendChild(emptyState);
    } else {
      keys.forEach(key => {
        const item = this.createItemRow(key, this.data[key]);
        itemsContainer.appendChild(item);
      });
    }

    wrapper.appendChild(itemsContainer);

    // Create add row
    const addRow = this.createAddRow();
    wrapper.appendChild(addRow);

    this.container.appendChild(wrapper);
  }

  /**
   * Creates a row element for displaying a key-value pair
   *
   * @private
   * @param {string} key - The key (readonly)
   * @param {string} value - The value (editable)
   * @returns {HTMLElement} The row element
   */
  createItemRow (key, value) {
    const row = document.createElement('div');
    row.className = 'kv-item-row';

    // Key column (readonly, clickable to expand)
    const keyDiv = document.createElement('div');
    keyDiv.className = 'kv-item-key';
    keyDiv.textContent = key;
    keyDiv.dataset.fullKey = key; // Store full key

    // Toggle expand/collapse on click
    keyDiv.addEventListener('click', (e) => {
      if (window.getSelection().toString()) {
        return;
      }
      keyDiv.classList.toggle('expanded');
    });

    // Value column (editable textarea)
    const valueDiv = document.createElement('div');
    valueDiv.className = 'kv-item-value';

    const textarea = document.createElement('textarea');
    textarea.className = 'kv-textarea';
    textarea.value = value;
    textarea.rows = 1;
    textarea.placeholder = 'Enter value...';

    // Auto-resize textarea based on content
    this.autoResizeTextarea(textarea);

    // Update value on change
    textarea.addEventListener('input', () => {
      this.autoResizeTextarea(textarea);
      this.updateValue(key, textarea.value);
    });

    valueDiv.appendChild(textarea);

    // Delete button
    const actionDiv = document.createElement('div');
    actionDiv.className = 'kv-item-action';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'kv-btn-remove';
    deleteBtn.textContent = '×';
    deleteBtn.type = 'button';
    deleteBtn.title = 'Remove this item';
    deleteBtn.addEventListener('click', () => {
      this.removeItem(key);
    });

    actionDiv.appendChild(deleteBtn);

    row.appendChild(keyDiv);
    row.appendChild(valueDiv);
    row.appendChild(actionDiv);

    return row;
  }

  /**
   * Creates the add row for inputting new key-value pairs
   *
   * @private
   * @returns {HTMLElement} The add row element
   */
  createAddRow () {
    const addRow = document.createElement('div');
    addRow.className = 'kv-add-row';

    // Key input
    const keyDiv = document.createElement('div');
    keyDiv.className = 'kv-add-key';

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'kv-input-key';
    keyInput.placeholder = 'Enter new key...';

    keyDiv.appendChild(keyInput);

    // Value textarea
    const valueDiv = document.createElement('div');
    valueDiv.className = 'kv-add-value';

    const valueTextarea = document.createElement('textarea');
    valueTextarea.className = 'kv-textarea';
    valueTextarea.rows = 1;
    valueTextarea.placeholder = 'Enter value...';

    // Auto-resize textarea
    this.autoResizeTextarea(valueTextarea);
    valueTextarea.addEventListener('input', () => {
      this.autoResizeTextarea(valueTextarea);
    });

    valueDiv.appendChild(valueTextarea);

    // Add button
    const actionDiv = document.createElement('div');
    actionDiv.className = 'kv-add-action';

    const addBtn = document.createElement('button');
    addBtn.className = 'kv-btn-add';
    addBtn.textContent = '+';
    addBtn.type = 'button';
    addBtn.title = 'Add new item';

    const handleAdd = () => {
      const key = keyInput.value;
      const value = valueTextarea.value;

      if (this.addItem(key, value)) {
        keyInput.value = '';
        valueTextarea.value = '';
        valueTextarea.rows = 1;
        keyInput.focus();
      }
    };

    addBtn.addEventListener('click', handleAdd);

    // Add on Enter in key input (if Ctrl/Cmd is pressed)
    keyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleAdd();
      }
    });

    actionDiv.appendChild(addBtn);

    addRow.appendChild(keyDiv);
    addRow.appendChild(valueDiv);
    addRow.appendChild(actionDiv);

    return addRow;
  }

  /**
   * Auto-resizes a textarea based on its content
   *
   * @private
   * @param {HTMLTextAreaElement} textarea - The textarea element to resize
   * @returns {void}
   */
  autoResizeTextarea (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
