import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockNotify = vi.hoisted(() => ({
  info: vi.fn(),
  alert: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('../../src/components/notification', () => ({ notify: mockNotify }));

import { controlPanel } from '../../src/components/controlPanel';
import bus from '../../src/utils/hooks';

const question = (num, idA, idB, extra = '') => `
  <div id="question${num}A" class="panel panel-default question${extra}">
    <ul id="slider${num}A" class="answers-list radio-list">
      <li><input class="radio" type="radio" name="${num}A" id="${idA}" value="A"></li>
      <li><input class="radio" type="radio" name="${num}A" id="${idB}" value="B"></li>
    </ul>
  </div>
`;

let listeners = [];

const click = (id) => document.getElementById(id).click();

function createStore(skrining = {}) {
  const fullConfig = {
    activeProfile: 'profile1',
    profiles: { profile1: { name: 'Satu', skrining }, profile2: { name: 'Dua' } },
  };

  return {
    getFullConfig: vi.fn().mockResolvedValue(fullConfig),
    getActiveConfig: vi.fn().mockResolvedValue(fullConfig.profiles.profile1),
    setConfig: vi.fn(),
    onProfileSwitch: vi.fn().mockResolvedValue(undefined),
  };
}

async function mount(config = {}) {
  const store = createStore(config);
  const { initializeSkrining } = await import('../../src/handlers/skrining');
  await initializeSkrining(config, store);
  return store;
}

describe('skrining', () => {
  beforeEach(() => {
    mockNotify.info.mockClear();
    mockNotify.alert.mockClear();
    mockNotify.confirm.mockClear();
    vi.useFakeTimers();
    document.body.innerHTML = `
      <button id="nextGenBtn"></button>
      <button id="btnBacktoHome1"></button>
      ${question(8, 'answer8AA', 'answer8AB')}
      ${question(9, 'answer9AA', 'answer9AB')}
      ${question(10, 'answer10AA', 'answer10AB', ' hidden')}
    `;
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

  describe('manual trigger', () => {
    it('should mount the manual trigger button into slot 1', async () => {
      await mount();

      const btn = document.getElementById('dandelion-skrining-manual');
      expect(btn).toBeTruthy();
      expect(controlPanel.slots[1].contains(btn)).toBe(true);
    });

    it('should disconnect the observer and fill once when clicked', async () => {
      const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
      const fills = [];
      bus.on('skrining:didFill', ({ radio }) => fills.push(radio));
      await mount();

      click('nextGenBtn');
      expect(disconnect).not.toHaveBeenCalled();

      click('dandelion-skrining-manual');

      expect(disconnect).toHaveBeenCalled();
      expect(fills).toEqual([6]);
      expect(document.getElementById('answer8AB').checked).toBe(true);
    });

    it('should cancel the pending throttle and stop watching the DOM after clicked', async () => {
      const fills = [];
      bus.on('skrining:didFill', ({ radio }) => fills.push(radio));
      await mount();

      click('nextGenBtn');
      click('dandelion-skrining-manual');
      document.getElementById('question8A').appendChild(document.createElement('span'));
      await vi.advanceTimersByTimeAsync(300);

      expect(fills).toEqual([6]);
    });
  });

  const toggleMarkers = async () => {
    click('dandelion-debug-toggle');
    await vi.waitFor(() => expect(document.querySelector('.dandelion-debug-marker')).toBeTruthy());
  };

  describe('debug markers', () => {
    it('should mount the bee toggle into slot 2', async () => {
      await mount();

      const bee = document.getElementById('dandelion-debug-toggle');
      expect(bee).toBeTruthy();
      expect(bee.textContent).toBe('🐞');
      expect(controlPanel.slots[2].contains(bee)).toBe(true);
    });

    it('should mark every radio question, including hidden ones', async () => {
      await mount();

      await toggleMarkers();

      expect(document.querySelectorAll('.dandelion-debug-marker')).toHaveLength(3);
    });

    it('should append the marker inside the question container', async () => {
      await mount();

      await toggleMarkers();

      const host = document.getElementById('question8A');
      expect(host.querySelector('.dandelion-debug-marker')).toBeTruthy();
      expect(host.style.position).toBe('relative');
    });

    it('should reflect the stored pin and exclude state', async () => {
      await mount({ answers: { answer8AA: 'A' }, excludes: 'answer9AA' });

      await toggleMarkers();

      const marker8 = document
        .getElementById('question8A')
        .querySelector('.dandelion-debug-marker');
      const marker9 = document
        .getElementById('question9A')
        .querySelector('.dandelion-debug-marker');
      expect(marker8.querySelector('.dandelion-pin-toggle').classList.contains('active')).toBe(
        true,
      );
      expect(marker9.querySelector('.dandelion-exclude-toggle').textContent).toBe('❌');
      expect(marker8.querySelector('.dandelion-exclude-toggle').textContent).toBe('➕');
    });

    it('should pin the currently selected radio when toggled', async () => {
      const store = await mount();
      click('dandelion-skrining-manual');
      await toggleMarkers();

      const pin = document.getElementById('question8A').querySelector('.dandelion-pin-toggle');
      pin.click();

      await vi.waitFor(() =>
        expect(store.setConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            profiles: expect.objectContaining({
              profile1: expect.objectContaining({
                skrining: { answers: { answer8AA: 'B' } },
              }),
            }),
          }),
        ),
      );
    });

    it('should not pin when no radio is selected', async () => {
      const store = await mount();
      await toggleMarkers();

      const pin = document.getElementById('question8A').querySelector('.dandelion-pin-toggle');
      pin.click();

      await vi.waitFor(() => expect(mockNotify.alert).toHaveBeenCalled());
      expect(store.setConfig).not.toHaveBeenCalled();
    });

    it('should unpin when already pinned', async () => {
      const store = await mount({ answers: { answer8AA: 'A' } });
      await toggleMarkers();

      const pin = document.getElementById('question8A').querySelector('.dandelion-pin-toggle');
      pin.click();

      await vi.waitFor(() =>
        expect(store.setConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            profiles: expect.objectContaining({
              profile1: expect.objectContaining({ skrining: { answers: {} } }),
            }),
          }),
        ),
      );
    });

    it('should toggle exclude when clicked', async () => {
      const store = await mount();
      await toggleMarkers();

      const exclude = document
        .getElementById('question8A')
        .querySelector('.dandelion-exclude-toggle');
      exclude.click();

      await vi.waitFor(() =>
        expect(store.setConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            profiles: expect.objectContaining({
              profile1: expect.objectContaining({ skrining: { excludes: 'answer8AA' } }),
            }),
          }),
        ),
      );
    });

    it('should remove all markers when toggled off', async () => {
      await mount();

      await toggleMarkers();
      click('dandelion-debug-toggle');

      expect(document.querySelectorAll('.dandelion-debug-marker')).toHaveLength(0);
    });
  });

  describe('profile indicator', () => {
    it('should mount the profile indicator into slot 4', async () => {
      await mount();

      const el = document.getElementById('dandelion-profile-switcher');
      expect(el).toBeTruthy();
      expect(controlPanel.slots[4].contains(el)).toBe(true);
    });

    it('should confirm before switching and abort when declined', async () => {
      mockNotify.confirm.mockResolvedValue(false);
      const store = await mount();

      document.querySelectorAll('#dandelion-profile-switcher > div')[1].click();
      await vi.waitFor(() => expect(mockNotify.confirm).toHaveBeenCalled());

      expect(mockNotify.confirm).toHaveBeenCalledWith(
        'Ganti Profil',
        'Halaman akan dimuat ulang. Jawaban yang sudah diisi akan hilang.',
      );
      expect(store.onProfileSwitch).not.toHaveBeenCalled();
    });

    it('should switch when confirmed', async () => {
      mockNotify.confirm.mockResolvedValue(true);
      const store = await mount();

      document.querySelectorAll('#dandelion-profile-switcher > div')[1].click();
      await vi.waitFor(() => expect(store.onProfileSwitch).toHaveBeenCalled());

      expect(store.onProfileSwitch).toHaveBeenCalledWith('profile2');
    });
  });

  describe('configured answers', () => {
    it('should honour the configured answer instead of the last option', async () => {
      await mount({ answers: { answer8AA: 'A' } });

      click('dandelion-skrining-manual');

      expect(document.getElementById('answer8AA').checked).toBe(true);
      expect(document.getElementById('answer8AB').checked).toBe(false);
    });

    it('should keep the old behaviour for questions without config', async () => {
      await mount({ answers: { answer8AA: 'A' } });

      click('dandelion-skrining-manual');

      expect(document.getElementById('answer9AB').checked).toBe(true);
    });

    it('should fall back to the old behaviour for an invalid value', async () => {
      await mount({ answers: { answer8AA: 'C' } });

      click('dandelion-skrining-manual');

      expect(document.getElementById('answer8AB').checked).toBe(true);
    });

    it('should fall back to the old behaviour for an empty value', async () => {
      await mount({ answers: { answer8AA: '' } });

      click('dandelion-skrining-manual');

      expect(document.getElementById('answer8AB').checked).toBe(true);
    });

    it('should not touch excluded questions at all', async () => {
      await mount({ answers: { answer8AA: 'A' }, excludes: 'answer9AA' });

      click('dandelion-skrining-manual');

      expect(document.getElementById('answer8AA').checked).toBe(true);
      expect(document.getElementById('answer9AA').checked).toBe(false);
      expect(document.getElementById('answer9AB').checked).toBe(false);
    });

    it('should let exclude win over a configured answer', async () => {
      await mount({ answers: { answer8AA: 'A' }, excludes: 'answer8AA' });

      click('dandelion-skrining-manual');

      expect(document.getElementById('answer8AA').checked).toBe(false);
      expect(document.getElementById('answer8AB').checked).toBe(false);
    });

    it('should report how many radios were filled', async () => {
      await mount();

      click('dandelion-skrining-manual');

      expect(mockNotify.info).toHaveBeenCalledWith('Isi Radio', 'Berhasil, 6 radio terisi.', 2500);
    });

    it('should report when there is nothing left to fill', async () => {
      await mount();

      click('dandelion-skrining-manual');
      click('dandelion-skrining-manual');

      expect(mockNotify.info).toHaveBeenLastCalledWith(
        'Isi Radio',
        'Tidak ada radio baru untuk diisi',
        2500,
      );
    });

    it('should not notify when the observer fills on its own', async () => {
      await mount();

      click('nextGenBtn');
      await vi.advanceTimersByTimeAsync(300);

      expect(mockNotify.info).not.toHaveBeenCalled();
    });

    it('should stop the observer once every fillable question is done', async () => {
      const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
      await mount({ answers: { answer8AA: 'A' }, excludes: 'answer9AA' });

      click('nextGenBtn');
      await vi.advanceTimersByTimeAsync(300);

      expect(disconnect).toHaveBeenCalled();
      expect(document.getElementById('answer8AA').checked).toBe(true);
      expect(document.getElementById('answer9AA').checked).toBe(false);
      expect(document.getElementById('answer9AB').checked).toBe(false);
    });

    it('should stop the observer when the configured answer is already selected', async () => {
      const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
      await mount({ answers: { answer8AA: 'A', answer9AA: 'B' } });
      document.getElementById('answer8AA').click();
      document.getElementById('answer9AB').click();

      click('nextGenBtn');
      await vi.advanceTimersByTimeAsync(300);

      expect(disconnect).toHaveBeenCalled();
    });
  });
});
