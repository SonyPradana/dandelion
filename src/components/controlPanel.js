const PANEL_ID = 'dandelion-control-panel';

/**
 * Singleton class to manage the floating control panel.
 */
class ControlPanel {
  constructor() {
    this.panel = null;
    this.slots = {};
  }

  /**
   * Initializes the control panel if it doesn't exist.
   */
  init() {
    if (document.getElementById(PANEL_ID)) {
      this.panel = document.getElementById(PANEL_ID);
      return;
    }

    this.panel = document.createElement('div');
    this.panel.id = PANEL_ID;
    this.panel.style.cssText = `
      position: fixed;
      top: 0.75rem;
      right: 0.75rem;
      z-index: 10000;
      display: grid;
      grid-template-columns: repeat(2, auto);
      grid-template-rows: repeat(3, auto);
      gap: 10px;
      pointer-events: none;
      border: 1px dashed rgba(0, 0, 0, 0.2); /* Dev debug border */
      justify-items: end;
      align-items: start;
    `;

    // Initialize Slots
    this.createSlot(1, '1 / 2 / 2 / 3'); // Main Button
    this.createSlot(2, '2 / 2 / 3 / 3'); // Debug / Zen / Skip
    this.createSlot(3, '3 / 1 / 4 / 3'); // Status Panel
    this.createSlot(4, '1 / 1 / 3 / 2'); // Profile / Empty

    document.body.appendChild(this.panel);
  }

  /**
   * Creates a grid slot.
   * @param {number|string} id 
   * @param {string} gridArea 
   */
  createSlot(id, gridArea) {
    const slot = document.createElement('div');
    slot.id = `${PANEL_ID}-slot-${id}`;
    
    let specificStyles = '';
    if (id === 2) {
      // Slot 2: Flex row-reverse, wrap after ~2 items (assuming buttons are ~40-50px wide)
      specificStyles = `
        flex-direction: row-reverse;
        flex-wrap: wrap;
        justify-content: flex-start;
        max-width: 120px; /* Fits roughly 2 small buttons + gap */
      `;
    } else {
      specificStyles = `
        flex-direction: column;
        align-items: flex-end;
      `;
    }

    slot.style.cssText = `
      grid-area: ${gridArea};
      pointer-events: auto;
      display: flex;
      gap: 8px;
      ${specificStyles}
    `;
    this.panel.appendChild(slot);
    this.slots[id] = slot;
  }

  /**
   * Mounts an element into a specific slot.
   * @param {HTMLElement} element 
   * @param {number} slotId 
   */
  mount(element, slotId) {
    this.init();
    const slot = this.slots[slotId];
    if (slot) {
      // Avoid duplicates
      if (slot.contains(element)) return;

      // Limit Slot 3 (Notifications) to 5 items
      if (slotId === 3 && slot.children.length >= 5) {
        slot.children[0].remove();
      }

      if (slotId === 2 && element.id === 'dandelion-debug-toggle') {
        // Debug button should be first in DOM (rightmost in row-reverse)
        slot.prepend(element);
      } else {
        slot.appendChild(element);
      }
    }
  }

  /**
   * Removes an element from the panel.
   * @param {HTMLElement|string} elementOrId 
   */
  remove(elementOrId) {
    const element = typeof elementOrId === 'string' 
      ? document.getElementById(elementOrId) 
      : elementOrId;
    
    if (element && element.parentElement && element.parentElement.id.startsWith(`${PANEL_ID}-slot-`)) {
      element.remove();
    }
  }
}

export const controlPanel = new ControlPanel();
