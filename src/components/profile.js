import { getFullConfig, setActiveProfile } from '../configuration';
import { controlPanel } from './controlPanel';
import { notify } from './notification';

/**
 * Creates a Profile Switcher (Vertical Dropdown style) with light glassmorphism.
 * @returns {Promise<HTMLDivElement>}
 */
export async function createProfileComponent() {
  const config = await getFullConfig();
  const activeProfile = config.activeProfile;

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

  const profiles = Object.keys(config.profiles || {});

  profiles.forEach((pKey) => {
    const btn = document.createElement('div');
    const profileData = config.profiles[pKey];
    const displayName = profileData.name || pKey.replace('profile', 'Profile ');
    const isActive = activeProfile === pKey;

    btn.innerHTML = `
      <span style="font-size: 8px; opacity: ${isActive ? '1' : '0.2'}">${isActive ? '●' : '○'}</span>
      <span style="flex: 1;">${displayName}</span>
    `;

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

      notify.info('Switching', `Mengaktifkan ${displayName}...`, 1000);
      await setActiveProfile(pKey);

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
