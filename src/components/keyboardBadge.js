const BADGE_WRAPPER_CLASS = 'dandelion-kb-wrapper';

let stylesInitialized = false;

function initializeStyles() {
  if (stylesInitialized) return;

  const style = document.createElement('style');
  style.textContent = `
    .${BADGE_WRAPPER_CLASS} {
      position: relative;
      display: inline-block;
    }
    .${BADGE_WRAPPER_CLASS} .dandelion-kb-badge {
      position: absolute;
      top: -8px;
      left: -4px;
      background: rgba(253, 255, 153, 0.95);
      color: #171717;
      padding: 0 4px;
      font-size: 10px;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-weight: 600;
      line-height: 1.4;
      border-radius: 3px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      pointer-events: none;
      z-index: 1;
    }
  `;
  document.head.appendChild(style);
  stylesInitialized = true;
}

export function mountBadge(button, label) {
  initializeStyles();

  const wrapper = document.createElement('div');
  wrapper.className = BADGE_WRAPPER_CLASS;

  button.parentNode.insertBefore(wrapper, button);
  wrapper.appendChild(button);

  const badge = document.createElement('div');
  badge.className = 'dandelion-kb-badge';
  badge.textContent = label;
  wrapper.appendChild(badge);

  return wrapper;
}

export function removeBadges() {
  document.querySelectorAll(`.${BADGE_WRAPPER_CLASS}`).forEach((wrapper) => {
    const btn = wrapper.querySelector('button');
    if (btn) wrapper.parentNode.insertBefore(btn, wrapper);
    wrapper.remove();
  });
}
