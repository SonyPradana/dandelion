import { getFullConfig, setConfig } from '../configuration.js';
import { isExcluded, toggleExcludeLogic } from '../utils/excludes.js';

const EXCLUDE_TOGGLE_CLASS = 'dandelion-exclude-toggle';

let stylesInitialized = false;

function initializeStyles() {
  if (stylesInitialized) return;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .${EXCLUDE_TOGGLE_CLASS} {
      cursor: pointer;
      font-size: 0.6875rem;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-weight: 500;
      line-height: 1.2;
      background-color: transparent;
      color: #525252;
      padding: 0 4px;
      border-radius: 3px;
      flex-shrink: 0;
      transition: opacity 0.2s ease;
    }
    .${EXCLUDE_TOGGLE_CLASS}:hover { background-color: rgba(0, 0, 0, 0.12); }
    .${EXCLUDE_TOGGLE_CLASS}:focus { outline: 2px solid #161616; outline-offset: 1px; }
    .${EXCLUDE_TOGGLE_CLASS}.loading { opacity: 0.5; pointer-events: none; }
  `;
  document.head.appendChild(styleSheet);
  stylesInitialized = true;
}

function updateToggleState(toggleElement, excluded) {
  toggleElement.textContent = excluded ? '❌' : '➕';
  toggleElement.setAttribute(
    'aria-label',
    excluded ? 'Include this question' : 'Exclude this question',
  );
}

async function handleToggle(toggleElement, identifier) {
  toggleElement.classList.add('loading');
  try {
    const fullConfig = await getFullConfig();
    const activeProfile = fullConfig.activeProfile;
    const currentExcludes = fullConfig.profiles[activeProfile].excludes || '';

    const { updatedExcludes, nowExcluded } = toggleExcludeLogic(identifier, currentExcludes);

    fullConfig.profiles[activeProfile].excludes = updatedExcludes;
    await setConfig(fullConfig);

    updateToggleState(toggleElement, nowExcluded);
  } catch (error) {
    console.error('Dandelion: Failed to toggle exclude:', error);
    toggleElement.textContent = '⚠️';
  } finally {
    toggleElement.classList.remove('loading');
  }
}

export function createExcludeToggle(identifier, profileConfig, initialIsExcluded) {
  initializeStyles();

  const excludeToggle = document.createElement('span');
  excludeToggle.className = EXCLUDE_TOGGLE_CLASS;
  excludeToggle.setAttribute('role', 'button');
  excludeToggle.setAttribute('tabindex', '0');

  if (initialIsExcluded !== undefined) {
    updateToggleState(excludeToggle, initialIsExcluded);
  } else {
    updateToggleState(excludeToggle, isExcluded(identifier, profileConfig));
  }

  excludeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggle(excludeToggle, identifier);
  });

  return excludeToggle;
}
