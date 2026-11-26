import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProfileComponent, createProfileSwitcher } from '../../src/components/profile';

describe('profile', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should create container with id dandelion-profile-switcher', () => {
    const el = createProfileComponent({ profiles: {}, activeProfile: '' });
    expect(el.id).toBe('dandelion-profile-switcher');
  });

  it('should create a button for each profile', () => {
    const profiles = { p1: { name: 'One' }, p2: { name: 'Two' } };
    const el = createProfileComponent({ profiles, activeProfile: 'p1' });
    expect(el.children.length).toBe(2);
    expect(el.children[0].textContent).toContain('One');
    expect(el.children[1].textContent).toContain('Two');
  });

  it('should mark active profile with filled circle', () => {
    const profiles = { p1: { name: 'One' }, p2: { name: 'Two' } };
    const el = createProfileComponent({ profiles, activeProfile: 'p1' });
    expect(el.children[0].innerHTML).toContain('●');
    expect(el.children[1].innerHTML).toContain('○');
  });

  it('should set active profile font-weight to 700', () => {
    const profiles = { p1: { name: 'One' } };
    const el = createProfileComponent({ profiles, activeProfile: 'p1' });
    expect(el.children[0].style.fontWeight).toBe('700');
  });

  it('should call onSwitch when clicking inactive profile', () => {
    const onSwitch = vi.fn();
    const profiles = { p1: { name: 'One' }, p2: { name: 'Two' } };
    const el = createProfileComponent({ profiles, activeProfile: 'p1', onSwitch });
    el.children[1].click();
    expect(onSwitch).toHaveBeenCalledWith('p2');
  });

  it('should not call onSwitch when clicking active profile', () => {
    const onSwitch = vi.fn();
    const profiles = { p1: { name: 'One' } };
    const el = createProfileComponent({ profiles, activeProfile: 'p1', onSwitch });
    el.children[0].click();
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it('should stay put when onSwitch resolves false', async () => {
    const onSwitch = vi.fn().mockResolvedValue(false);
    const profiles = { p1: { name: 'One' }, p2: { name: 'Two' } };
    const el = createProfileComponent({ profiles, activeProfile: 'p1', onSwitch });

    el.children[1].click();
    await vi.waitFor(() => expect(onSwitch).toHaveBeenCalled());
    await Promise.resolve();

    expect(el.style.opacity).not.toBe('0.5');
  });

  it('should proceed when onSwitch resolves undefined', async () => {
    const onSwitch = vi.fn().mockResolvedValue(undefined);
    const profiles = { p1: { name: 'One' }, p2: { name: 'Two' } };
    const el = createProfileComponent({ profiles, activeProfile: 'p1', onSwitch });

    el.children[1].click();
    await vi.waitFor(() => expect(el.style.opacity).toBe('0.5'));
  });

  it('should stay put when onSwitch rejects', async () => {
    const onSwitch = vi.fn().mockRejectedValue(new Error('cancelled'));
    const profiles = { p1: { name: 'One' }, p2: { name: 'Two' } };
    const el = createProfileComponent({ profiles, activeProfile: 'p1', onSwitch });

    el.children[1].click();
    await vi.waitFor(() => expect(onSwitch).toHaveBeenCalled());
    await Promise.resolve();

    expect(el.style.opacity).not.toBe('0.5');
  });

  it('setVisibility(true) should show the container', () => {
    const el = createProfileComponent({ profiles: {}, activeProfile: '' });
    el.setVisibility(true);
    expect(el.style.opacity).toBe('1');
    expect(el.style.pointerEvents).toBe('auto');
  });

  it('setVisibility(false) should hide the container', () => {
    const el = createProfileComponent({ profiles: {}, activeProfile: '' });
    el.setVisibility(true);
    el.setVisibility(false);
    expect(el.style.opacity).toBe('0');
    expect(el.style.pointerEvents).toBe('none');
  });

  it('should handle missing profiles gracefully', () => {
    const el = createProfileComponent();
    expect(el.children.length).toBe(0);
  });

  it('should handle empty profiles gracefully', () => {
    const el = createProfileComponent({ profiles: {}, activeProfile: 'p1' });
    expect(el.children.length).toBe(0);
  });
});

describe('createProfileSwitcher', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should show the active profile name with a dropdown icon', () => {
    const { trigger, dropdown } = createProfileSwitcher({
      profiles: { p1: { name: 'One' } },
      activeProfile: 'p1',
    });

    expect(trigger.id).toBe('dandelion-profile-toggle');
    expect(trigger.textContent).toBe('One⌄');
    expect(trigger.getAttribute('aria-label')).toBe('Ganti Profil: One');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(dropdown.id).toBe('dandelion-profile-switcher');
    expect(dropdown.style.opacity).toBe('0');
  });

  it('should open and close the dropdown when the trigger is clicked', () => {
    const { trigger, dropdown } = createProfileSwitcher({
      profiles: { p1: { name: 'One' } },
      activeProfile: 'p1',
    });
    document.body.append(trigger, dropdown);

    trigger.click();
    expect(dropdown.style.opacity).toBe('1');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    trigger.click();
    expect(dropdown.style.opacity).toBe('0');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('should close the dropdown when clicking outside', () => {
    const { trigger, dropdown } = createProfileSwitcher({
      profiles: { p1: { name: 'One' } },
      activeProfile: 'p1',
    });
    document.body.append(trigger, dropdown);

    trigger.click();
    document.body.click();

    expect(dropdown.style.opacity).toBe('0');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('should stay open when clicking inside the dropdown', () => {
    const { trigger, dropdown } = createProfileSwitcher({
      profiles: { p1: { name: 'One' } },
      activeProfile: 'p1',
    });
    document.body.append(trigger, dropdown);

    trigger.click();
    dropdown.click();

    expect(dropdown.style.opacity).toBe('1');
  });
});
