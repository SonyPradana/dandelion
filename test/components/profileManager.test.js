import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileManager } from '../../src/view/components/ProfileManager.js';

const baseProfile = {
  formSkrining: { url: '', pinneds: {} },
  notChecked: {},
  skrining: { url: '' },
  zenMode: {},
};

function makeProfiles() {
  return {
    profile1: { name: 'Alpha', ...baseProfile },
    profile2: { name: 'Beta', ...baseProfile },
  };
}

describe('ProfileManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="pm-container"></div>';
  });

  it('setData should swap profiles and active profile, then re-render', () => {
    const host = new ProfileManager('pm-container', makeProfiles(), 'profile1', {});
    expect(host.container.textContent).toContain('Alpha');

    host.setData({ profile9: { name: 'Gamma', ...baseProfile } }, 'profile9');

    expect(host.profiles.profile1).toBeUndefined();
    expect(host.profiles.profile9).toBeDefined();
    expect(host.activeProfile).toBe('profile9');
    expect(host.container.textContent).toContain('Gamma');
    expect(host.container.textContent).not.toContain('Alpha');
  });

  it('setData should mark the new active profile card as active', () => {
    const profiles = makeProfiles();
    const host = new ProfileManager('pm-container', profiles, 'profile1', {});
    host.setData(profiles, 'profile2');

    const cards = host.container.querySelectorAll('.pm-card');
    expect(cards[0].classList.contains('active')).toBe(false);
    expect(cards[1].classList.contains('active')).toBe(true);
  });

  it('switchProfile should invoke onSwitch callback', () => {
    const onSwitch = vi.fn();
    const profiles = makeProfiles();
    const host = new ProfileManager('pm-container', profiles, 'profile1', { onSwitch });

    host.switchProfile('profile2');

    expect(onSwitch).toHaveBeenCalledWith('profile2');
    expect(host.activeProfile).toBe('profile2');
  });

  it('addProfile should render new profile and call onChange', () => {
    const onChange = vi.fn();
    const profiles = makeProfiles();
    const host = new ProfileManager('pm-container', profiles, 'profile1', { onChange });

    host.addProfile('Charlie');

    expect(host.profiles.profile3.name).toBe('Charlie');
    expect(onChange).toHaveBeenCalled();
    expect(host.container.textContent).toContain('Charlie');
  });

  it('removeProfile should delete the card and call onChange', () => {
    const onChange = vi.fn();
    const profiles = makeProfiles();
    const host = new ProfileManager('pm-container', profiles, 'profile1', { onChange });

    host.removeProfile('profile2');

    expect(host.profiles.profile2).toBeUndefined();
    expect(onChange).toHaveBeenCalled();
    expect(host.container.textContent).not.toContain('Beta');
  });
});
