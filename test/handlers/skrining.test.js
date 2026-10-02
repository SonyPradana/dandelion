import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { controlPanel } from '../../src/components/controlPanel';
import bus from '../../src/utils/hooks';

const MANIFEST = `
  <button id="nextGenBtn"></button>
  <div id="question8A" class="panel panel-default question">
    <ul id="slider8A" class="answers-list radio-list">
      <li><input class="radio" type="radio" name="8A" id="answer8AA" value="A"></li>
      <li><input class="radio" type="radio" name="8A" id="answer8AB" value="B"></li>
    </ul>
  </div>
`;

let listeners = [];

const trackFills = () => {
  const fills = [];
  bus.on('skrining:didFill', ({ radio }) => fills.push(radio));
  return fills;
};

const addRadio = (id) => {
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = '8A';
  radio.id = id;
  radio.value = id.slice(-1);
  document.getElementById('slider8A').appendChild(radio);
  return radio;
};

const click = (id) => document.getElementById(id).click();

async function mount() {
  const { initializeSkrining } = await import('../../src/handlers/skrining');
  initializeSkrining();
}

describe('skrining', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = MANIFEST;
    controlPanel.setPosition('top-right');
    listeners = [];

    const nativeAdd = document.addEventListener.bind(document);
    vi.spyOn(document, 'addEventListener').mockImplementation((type, cb, opts) => {
      if (type === 'click') listeners.push([type, cb, opts]);
      return nativeAdd(type, cb, opts);
    });
  });

  afterEach(() => {
    for (const [type, cb, opts] of listeners) document.removeEventListener(type, cb, opts);
    listeners = [];
    bus.off('skrining:didFill');
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should mount the manual trigger button into slot 1', async () => {
    await mount();

    const btn = document.getElementById('dandelion-skrining-manual');
    expect(btn).toBeTruthy();
    expect(controlPanel.slots[1].contains(btn)).toBe(true);
  });

  it('should disconnect the observer and fill once when clicked', async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const fills = trackFills();
    await mount();

    click('nextGenBtn');
    expect(disconnect).not.toHaveBeenCalled();

    click('dandelion-skrining-manual');

    expect(disconnect).toHaveBeenCalled();
    expect(fills).toEqual([2]);
    expect(document.getElementById('answer8AB').checked).toBe(true);
  });

  it('should cancel the pending throttle and stop watching the DOM after clicked', async () => {
    const fills = trackFills();
    await mount();

    click('nextGenBtn');
    click('dandelion-skrining-manual');
    const late = addRadio('answer8AC');
    await vi.advanceTimersByTimeAsync(300);

    expect(fills).toEqual([2]);
    expect(late.checked).toBe(false);
  });
});
