/**
 * KeywordList Component
 *
 * A reusable component for managing a list of keywords with drag-and-drop functionality
 * and two-way binding to a semicolon-separated string value in a textbox.
 *
 * @class
 * @example
 * // HTML structure required:
 * // <input type="text" id="keywords-input">
 * // <div class="keyword-list" id="keywords-list"></div>
 * // <input type="text" id="keywords-add-input">
 * // <button id="keywords-add">+</button>
 *
 * const keywordList = new KeywordList(
 *   'keywords-input',      // source textbox ID
 *   'keywords-list',       // list container ID
 *   'keywords-add-input',  // add input ID
 *   'keywords-add'         // add button ID
 * );
 */
export class KeywordList {
  /**
   * Creates a new KeywordList instance
   *
   * @param {string} sourceTextboxId - ID of the textbox that stores the semicolon-separated values
   * @param {string} listElementId - ID of the container element for the keyword list
   * @param {string} inputElementId - ID of the input field for adding new keywords
   * @param {string} addButtonId - ID of the button to add new keywords
   * @throws {Error} If any of the required DOM elements are not found
   */
  constructor (sourceTextboxId, listElementId, inputElementId, addButtonId) {
    /** @type {HTMLInputElement} */
    this.sourceTextbox = document.getElementById(sourceTextboxId);

    /** @type {HTMLElement} */
    this.listElement = document.getElementById(listElementId);

    /** @type {HTMLInputElement} */
    this.inputElement = document.getElementById(inputElementId);

    /** @type {HTMLButtonElement} */
    this.addButton = document.getElementById(addButtonId);

    /** @type {string[]} */
    this.items = [];

    /** @type {HTMLElement|null} */
    this.draggedItem = null;

    this.init();
  }

  /**
   * Initializes the component by setting up event listeners
   * @private
   * @returns {void}
   */
  init () {
    this.addButton.addEventListener('click', () => this.addItem());
    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addItem();
      }
    });

    this.sourceTextbox.addEventListener('input', () => {
      this.loadFromTextbox();
    });

    this.loadFromTextbox();
  }

  /**
   * Load items from source textbox and sync to the list
   * Parses the semicolon-separated string from the source textbox,
   * trims left whitespace from each item, filters empty items,
   * and updates the internal items array and UI.
   * @private
   * @returns {void}
   */
  loadFromTextbox () {
    const value = this.sourceTextbox.value;
    if (!value) {
      this.items = [];
    } else {
      this.items = value
        .split(';')
        .map(item => item.trimStart())
        .filter(item => item.length > 0);
    }
    this.render();
  }

  /**
   * Update source textbox with current items (list → textbox sync)
   * Joins the items array with semicolons and updates the source textbox value.
   * Also dispatches an 'input' event so other listeners can react to the change.
   * @private
   * @returns {void}
   */
  updateTextbox () {
    this.sourceTextbox.value = this.items.join(';');
    // Trigger input event so other listeners can react
    this.sourceTextbox.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Adds a new item to the list
   * Validates the input (must be non-empty and single-line),
   * adds it to the items array, clears the input field,
   * re-renders the list, and syncs to the source textbox.
   * Validation rules:
   * - Left whitespace is trimmed
   * - Empty values are rejected
   * - Multi-line values (containing \n) are rejected
   * @public
   * @returns {void}
   */
  addItem () {
    const value = this.inputElement.value.trimStart(); // trim left spaces

    if (!value || value.includes('\n')) {
      return;
    }

    this.items.push(value);
    this.inputElement.value = '';
    this.render();
    this.updateTextbox();
  }

  /**
   * Removes an item from the list by index
   * Removes the item at the specified index from the items array,
   * re-renders the list, and syncs to the source textbox.
   * @public
   * @param {number} index - Zero-based index of the item to remove
   * @returns {void}
   */
  removeItem (index) {
    this.items.splice(index, 1);
    this.render();
    this.updateTextbox();
  }

  /**
   * Renders the list items to the DOM
   * Clears the list container and creates DOM elements for each item.
   * Each item includes:
   * - Drag handle (three horizontal lines)
   * - Keyword text
   * - Remove button (×)
   * Also attaches all necessary event listeners for drag-and-drop functionality.
   * @private
   * @returns {void}
   */
  render () {
    this.listElement.innerHTML = '';

    this.items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'keyword-item';
      itemDiv.draggable = true;
      itemDiv.dataset.index = index;

      // Drag handle
      const dragHandle = document.createElement('div');
      dragHandle.className = 'drag-handle';
      dragHandle.innerHTML = '<span></span><span></span><span></span>';

      // Keyword text
      const textSpan = document.createElement('span');
      textSpan.className = 'keyword-text';
      textSpan.textContent = item;

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove';
      removeBtn.textContent = '×';
      removeBtn.type = 'button';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeItem(index);
      });

      itemDiv.appendChild(dragHandle);
      itemDiv.appendChild(textSpan);
      itemDiv.appendChild(removeBtn);

      // Drag events
      itemDiv.addEventListener('dragstart', (e) => this.handleDragStart(e));
      itemDiv.addEventListener('dragover', (e) => this.handleDragOver(e));
      itemDiv.addEventListener('drop', (e) => this.handleDrop(e));
      itemDiv.addEventListener('dragend', (e) => this.handleDragEnd(e));
      itemDiv.addEventListener('dragleave', (e) => this.handleDragLeave(e));

      this.listElement.appendChild(itemDiv);
    });
  }

  /**
   * Handles the dragstart event
   * @private
   * @param {DragEvent} e - The drag event
   * @returns {void}
   */
  handleDragStart (e) {
    this.draggedItem = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  }

  /**
   * Handles the dragover event
   * @private
   * @param {DragEvent} e
   * @returns {boolean} Always returns false to allow drop
   */
  handleDragOver (e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    const draggedOverItem = e.currentTarget;
    if (draggedOverItem !== this.draggedItem) {
      draggedOverItem.classList.add('drag-over');
    }

    return false;
  }

  /**
   * Handles the drop event
   * Reorders the items array based on drag source and drop target positions,
   * then re-renders the list and syncs to the source textbox.
   * @private
   * @param {DragEvent} e
   * @returns {boolean}
   */
  handleDrop (e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const draggedOverItem = e.currentTarget;

    if (this.draggedItem !== draggedOverItem) {
      const draggedIndex = parseInt(this.draggedItem.dataset.index);
      const targetIndex = parseInt(draggedOverItem.dataset.index);

      // Reorder items array
      const [movedItem] = this.items.splice(draggedIndex, 1);
      this.items.splice(targetIndex, 0, movedItem);

      this.render();
      this.updateTextbox();
    }

    return false;
  }

  /**
   * Handles the dragend event
   * Cleans up CSS classes added during drag operation.
   * @private
   * @param {DragEvent} e
   * @returns {void}
   */
  handleDragEnd (e) {
    e.currentTarget.classList.remove('dragging');

    // Remove all drag-over classes
    const allItems = this.listElement.querySelectorAll('.keyword-item');
    allItems.forEach(item => item.classList.remove('drag-over'));
  }

  /**
   * Handles the dragleave event
   * @private
   * @param {DragEvent} e - The drag event
   * @returns {void}
   */
  handleDragLeave (e) {
    e.currentTarget.classList.remove('drag-over');
  }
}
