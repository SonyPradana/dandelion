const PANEL_ID = 'dandelion-control-panel';
const PANEL_GAP = 8; // px — single source of truth

/**
 * Singleton class to manage the floating control panel.
 */
class ControlPanel {
  panel = null;
  slots = {};

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
      grid-template-columns: 1fr;
      grid-template-rows: repeat(3, auto);
      gap: ${PANEL_GAP}px;
      pointer-events: none;
      justify-items: end;
      align-items: start;
    `;

    // Slot 1 — Main button (🙈) - Anchor for Slot 4
    this.createSlot(
      1,
      '1',
      `
      position: relative; 
      flex-direction: column;
      align-items: flex-end;
    `,
    );

    // Slot 2 — Debug / Zen / Skip
    this.createSlot(
      2,
      '2',
      `
      flex-direction: row-reverse;
      flex-wrap: nowrap;
      justify-content: flex-start;
      align-items: center;
    `,
    );

    // Slot 3 — Notifications (full width)
    this.createSlot(
      3,
      '3',
      `
      flex-direction: column;
      align-items: flex-end;
    `,
    );

    // Slot 4 — Profile switcher (Anchored to Slot 1)
    const slot4 = document.createElement('div');
    slot4.id = `${PANEL_ID}-slot-4`;
    slot4.style.cssText = `
      position: absolute;
      top: 0;
      right: calc(100% + ${PANEL_GAP}px);
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: ${PANEL_GAP}px;
    `;
    // Append Slot 4 to Slot 1 instead of Main Panel
    this.slots[1].appendChild(slot4);
    this.slots[4] = slot4;

    document.body.appendChild(this.panel);
  }

  /**
   * Creates a grid slot.
   * @param {number|string} id
   * @param {string} gridRow
   * @param {string} specificStyles
   */
  createSlot(id, gridRow, specificStyles) {
    const slot = document.createElement('div');
    slot.id = `${PANEL_ID}-slot-${id}`;

    slot.style.cssText = `
      grid-row: ${gridRow};
      pointer-events: none;
      display: flex;
      gap: ${PANEL_GAP}px;
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
      if (slot.contains(element)) return;

      if (slotId === 3 && slot.children.length >= 5) {
        slot.children[0].remove();
      }

      if (slotId === 2 && element.id === 'dandelion-debug-toggle') {
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
    const element =
      typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;

    if (
      element &&
      element.parentElement &&
      element.parentElement.id.startsWith(`${PANEL_ID}-slot-`)
    ) {
      element.remove();
    }
  }
}

export const controlPanel = new ControlPanel();
