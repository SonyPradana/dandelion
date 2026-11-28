const PANEL_ID = 'dandelion-control-panel';
const PANEL_GAP = 8;

const POSITIONS = {
  'top-right': {
    panelPos: 'top: 0.75rem; right: 0.75rem;',
    justifyItems: 'end',
    alignItems: 'start',
    gridRows: ['1', '2', '3'],
    slotAlign: 'flex-end',
    slot4Side: 'right',
    slot4Vertical: 'top',
    slot2Dir: 'row-reverse',
    refreshSide: 'right',
    refreshVertical: 'top',
  },
  'bottom-right': {
    panelPos: 'bottom: 0.75rem; right: 0.75rem;',
    justifyItems: 'end',
    alignItems: 'end',
    gridRows: ['3', '2', '1'],
    slotAlign: 'flex-end',
    slot4Side: 'right',
    slot4Vertical: 'bottom',
    slot2Dir: 'row-reverse',
    refreshSide: 'right',
    refreshVertical: 'bottom',
  },
  'top-left': {
    panelPos: 'top: 0.75rem; left: 0.75rem;',
    justifyItems: 'start',
    alignItems: 'start',
    gridRows: ['1', '2', '3'],
    slotAlign: 'flex-start',
    slot4Side: 'left',
    slot4Vertical: 'top',
    slot2Dir: 'row',
    refreshSide: 'left',
    refreshVertical: 'top',
  },
  'bottom-left': {
    panelPos: 'bottom: 0.75rem; left: 0.75rem;',
    justifyItems: 'start',
    alignItems: 'end',
    gridRows: ['3', '2', '1'],
    slotAlign: 'flex-start',
    slot4Side: 'left',
    slot4Vertical: 'bottom',
    slot2Dir: 'row',
    refreshSide: 'left',
    refreshVertical: 'bottom',
  },
};

class ControlPanel {
  panel = null;
  slots = {};
  position = 'top-right';

  constructor({ position = 'top-right' } = {}) {
    if (!POSITIONS[position]) {
      throw new Error(`Invalid position: "${position}". Use: ${Object.keys(POSITIONS).join(', ')}`);
    }
    this.position = position;
  }

  get posConfig() {
    return POSITIONS[this.position];
  }

  get isDockedLeft() {
    return this.position.endsWith('left');
  }

  setPosition(position) {
    if (!POSITIONS[position]) {
      throw new Error(`Invalid position: "${position}". Use: ${Object.keys(POSITIONS).join(', ')}`);
    }
    this.position = position;
    if (this.panel) {
      this.applyPosition();
    }
  }

  applyPosition() {
    const cfg = this.posConfig;

    this.panel.style.top = cfg.panelPos.includes('top') ? '0.75rem' : '';
    this.panel.style.bottom = cfg.panelPos.includes('bottom') ? '0.75rem' : '';
    this.panel.style.left = cfg.panelPos.includes('left') ? '0.75rem' : '';
    this.panel.style.right = cfg.panelPos.includes('right') ? '0.75rem' : '';
    this.panel.style.justifyItems = cfg.justifyItems;
    this.panel.style.alignItems = cfg.alignItems;

    if (this.slots[1]) {
      this.slots[1].style.gridRow = cfg.gridRows[0];
      this.slots[1].style.flexDirection = 'column';
      this.slots[1].style.alignItems = cfg.slotAlign;
    }
    if (this.slots[2]) {
      this.slots[2].style.gridRow = cfg.gridRows[1];
      this.slots[2].style.flexDirection = cfg.slot2Dir;
    }
    if (this.slots[3]) {
      this.slots[3].style.gridRow = cfg.gridRows[2];
      this.slots[3].style.alignItems = cfg.slotAlign;
    }
    if (this.slots[4]) {
      this.slots[4].style.top = cfg.slot4Vertical === 'top' ? '0' : '';
      this.slots[4].style.bottom = cfg.slot4Vertical === 'bottom' ? '0' : '';
      this.slots[4].style.right = cfg.slot4Side === 'right' ? `calc(100% + ${PANEL_GAP}px)` : '';
      this.slots[4].style.left = cfg.slot4Side === 'left' ? `calc(100% + ${PANEL_GAP}px)` : '';
      this.slots[4].style.flexDirection = cfg.slot4Vertical === 'top' ? 'column' : 'column-reverse';
    }

    const refresh = this.panel?.querySelector('#dandelion-refresh-handler');
    if (refresh) {
      refresh.style.top = cfg.refreshVertical === 'top' ? '-6px' : '';
      refresh.style.bottom = cfg.refreshVertical === 'bottom' ? '-6px' : '';
      refresh.style.right = cfg.refreshSide === 'right' ? '-6px' : '';
      refresh.style.left = cfg.refreshSide === 'left' ? '-6px' : '';
    }

    const zeroRow = document.getElementById('dandelion-zero-row');
    if (zeroRow) {
      zeroRow.style.flexDirection = this.isDockedLeft ? 'row-reverse' : 'row';
    }

    this.alignSlot4();
  }

  alignSlot4() {
    const slot1 = this.slots[1];
    const slot4 = this.slots[4];
    const trigger = slot4?.querySelector('#dandelion-profile-toggle');
    if (!slot1 || !slot4 || !trigger) return;

    trigger.style.marginTop = '';
    trigger.style.marginBottom = '';

    const offset = Math.max(0, (slot1.offsetHeight - trigger.offsetHeight) / 2);
    if (this.posConfig.slot4Vertical === 'top') {
      trigger.style.marginTop = `${offset}px`;
    } else {
      trigger.style.marginBottom = `${offset}px`;
    }
  }

  init() {
    if (document.getElementById(PANEL_ID)) {
      this.panel = document.getElementById(PANEL_ID);
      return;
    }

    const cfg = this.posConfig;

    this.panel = document.createElement('div');
    this.panel.id = PANEL_ID;
    this.panel.style.cssText = `
      position: fixed;
      ${cfg.panelPos}
      z-index: 10000;
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: repeat(3, auto);
      gap: ${PANEL_GAP}px;
      pointer-events: none;
      justify-items: ${cfg.justifyItems};
      align-items: ${cfg.alignItems};
    `;

    this.createSlot(
      1,
      cfg.gridRows[0],
      `
      position: relative;
      flex-direction: column;
      align-items: ${cfg.slotAlign};
    `,
    );

    this.createSlot(
      2,
      cfg.gridRows[1],
      `
      flex-direction: ${cfg.slot2Dir};
      flex-wrap: wrap;
      justify-content: flex-start;
      align-items: center;
      max-width: 120px;
    `,
    );

    this.createSlot(
      3,
      cfg.gridRows[2],
      `
      flex-direction: column;
      align-items: ${cfg.slotAlign};
    `,
    );

    const slot4 = document.createElement('div');
    slot4.id = `${PANEL_ID}-slot-4`;
    slot4.style.cssText = `
      position: absolute;
      ${cfg.slot4Vertical}: 0;
      ${cfg.slot4Side}: calc(100% + ${PANEL_GAP}px);
      pointer-events: none;
      display: flex;
      flex-direction: ${cfg.slot4Vertical === 'top' ? 'column' : 'column-reverse'};
      align-items: ${cfg.slotAlign};
      gap: ${PANEL_GAP}px;
    `;
    this.slots[1].appendChild(slot4);
    this.slots[4] = slot4;

    document.body.appendChild(this.panel);
  }

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

  mount(element, slotId) {
    this.init();
    const slot = this.slots[slotId];
    if (slot) {
      if (slot.contains(element)) return;

      if (slotId === 3) {
        const nonPinned = Array.from(slot.children).filter((c) => !c.dataset.pinned);
        if (nonPinned.length >= 5) {
          nonPinned[0].remove();
        }
      }

      if (slotId === 2 && element.id === 'dandelion-debug-toggle') {
        slot.prepend(element);
      } else if (element.dataset.pinned) {
        slot.prepend(element);
      } else {
        slot.appendChild(element);
      }

      if (slotId === 1 || slotId === 4) this.alignSlot4();
    }
  }

  /** Empties the handler slots while keeping the panel, slot 4, and overlays. */
  clear() {
    if (!this.panel) return;
    this.slots[4]?.replaceChildren();
    [1, 2, 3].forEach((id) => this.slots[id]?.replaceChildren());
    if (this.slots[1] && this.slots[4]) this.slots[1].appendChild(this.slots[4]);
  }

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
