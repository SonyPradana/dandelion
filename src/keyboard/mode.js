const state = { active: false };

export function activate() {
  state.active = true;
}

export function deactivate() {
  state.active = false;
}

export function toggle() {
  state.active = !state.active;
  return state.active;
}

export function isActive() {
  return state.active;
}
