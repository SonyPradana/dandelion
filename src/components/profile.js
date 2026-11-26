import { notify } from './notification';

/**
 * Creates a Profile Switcher (Vertical Dropdown style) with light glassmorphism.
 * @param {Object} options
 * @param {Object} options.profiles - Map of profile keys to profile data
 * @param {string} options.activeProfile - Currently active profile key
 * @param {(profileKey: string) => Promise<void|boolean>} [options.onSwitch] - Async callback when a
 *   profile is clicked. Resolving `false` aborts the switch and keeps the current page.
 * @returns {HTMLDivElement}
 */
export function createProfileComponent({ profiles, activeProfile, onSwitch } = {}) {
  const container = document.createElement('div');
  container.id = 'dandelion-profile-switcher';

  container.style.cssText = `
    display: flex;
    flex-direction: column;
    padding: 6px;
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 16px;
    backdrop-filter: blur(30px) saturate(180%);
    -webkit-backdrop-filter: blur(30px) saturate(180%);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    min-width: 140px;
    gap: 4px;
    z-index: 10001;
  `;

  const profileKeys = Object.keys(profiles || {});

  profileKeys.forEach((pKey) => {
    const btn = document.createElement('div');
    const profileData = profiles[pKey];
    const displayName = profileData.name || pKey.replace('profile', 'Profile ');
    const isActive = activeProfile === pKey;

    const indicatorSpan = document.createElement('span');
    indicatorSpan.style.cssText = `font-size: 8px; opacity: ${isActive ? '1' : '0.2'}`;
    indicatorSpan.textContent = isActive ? '\u25CF' : '\u25CB';
    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'flex: 1;';
    nameSpan.textContent = displayName;
    btn.append(indicatorSpan, nameSpan);

    btn.style.cssText = `
      padding: 8px 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      font-weight: ${isActive ? '700' : '500'};
      color: ${isActive ? '#171717' : 'rgba(23, 23, 23, 0.5)'};
      background: ${isActive ? 'rgba(0, 0, 0, 0.04)' : 'transparent'};
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
    `;

    btn.onmouseenter = () => {
      if (!isActive) {
        btn.style.background = 'rgba(0, 0, 0, 0.02)';
        btn.style.color = '#171717';
      }
    };
    btn.onmouseleave = () => {
      if (!isActive) {
        btn.style.background = 'transparent';
        btn.style.color = 'rgba(23, 23, 23, 0.5)';
      }
    };

    btn.onclick = async (e) => {
      e.stopPropagation();
      if (isActive) return;

      try {
        // Returning false means the switch was rejected, so keep the page as is
        if (onSwitch && (await onSwitch(pKey)) === false) return;
      } catch (error) {
        console.error('Failed to switch profile:', error);
        notify.alert('Error', 'Gagal mengganti profil. Coba lagi.');
        return;
      }

      notify.info('Switching', `Mengaktifkan ${displayName}...`, 1000);

      container.style.transform = 'scale(0.98)';
      container.style.opacity = '0.5';

      setTimeout(() => window.location.reload(), 600);
    };

    container.appendChild(btn);
  });

  container.setVisibility = (show) => {
    if (show) {
      container.style.opacity = '1';
      container.style.transform = 'translateY(0) scale(1)';
      container.style.pointerEvents = 'auto';
    } else {
      container.style.opacity = '0';
      container.style.transform = 'translateY(-10px) scale(0.95)';
      container.style.pointerEvents = 'none';
    }
  };

  return container;
}

/**
 * Creates a click-triggered profile switcher.
 * @param {Object} options - Same options as `createProfileComponent`.
 * @returns {{ trigger: HTMLButtonElement, dropdown: HTMLDivElement, open: () => void, close: () => void }}
 */
export function createProfileSwitcher(options = {}) {
  const dropdown = createProfileComponent(options);

  const profileName =
    options.profiles?.[options.activeProfile]?.name || options.activeProfile || 'Profil';

  const label = document.createElement('span');
  label.textContent = profileName;
  label.style.cssText = `
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;

  const chevron = document.createElement('span');
  chevron.textContent = '⌄';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.style.cssText = `
    display: inline-flex;
    align-items: center;
    line-height: 1;
    transform: translateY(-4px);
  `;

  const trigger = document.createElement('button');
  trigger.id = 'dandelion-profile-toggle';
  trigger.type = 'button';
  trigger.title = `Ganti Profil: ${profileName}`;
  trigger.setAttribute('aria-label', `Ganti Profil: ${profileName}`);
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.append(label, chevron);
  trigger.style.cssText = `
    padding: 0.3rem 0.25rem;
    background: transparent;
    color: #3f3f46;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85);
    border: 0;
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    max-width: 180px;
    pointer-events: auto;
    transition: color 0.2s ease-in-out;
  `;

  trigger.addEventListener('mouseenter', () => {
    trigger.style.color = '#171717';
  });
  trigger.addEventListener('mouseleave', () => {
    trigger.style.color = '#3f3f46';
  });

  let isOpen = false;

  function onOutsideClick(event) {
    if (dropdown.contains(event.target) || trigger.contains(event.target)) return;
    close();
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    dropdown.setVisibility(true);
    trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onOutsideClick);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    dropdown.setVisibility(false);
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onOutsideClick);
  }

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isOpen) close();
    else open();
  });

  return { trigger, dropdown, open, close };
}
