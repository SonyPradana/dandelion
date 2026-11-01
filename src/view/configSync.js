/**
 * Deep-copies a config so an editor can mutate its own copy without touching
 * the store cache.
 * @template T
 * @param {T} config
 * @returns {T}
 */
export function cloneConfig(config) {
  return structuredClone(config);
}

/**
 * Structural equality for plain config values.
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function configsEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null) return false;
  if (typeof b !== 'object' || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => Object.hasOwn(b, key) && configsEqual(a[key], b[key]));
}

/**
 * Decides what an editor should do with a config change from storage.
 *
 * - `apply`: nothing is being edited, so the fresh config can replace the
 *   editor state.
 * - `ignore`: the editor is dirty but storage still matches its copy (for
 *   example the echo of its own save), so there is nothing to resolve.
 * - `conflict`: the editor is dirty and storage moved, so the user has to
 *   choose between reloading and overwriting.
 * @param {{dirty: boolean, local: unknown, incoming: unknown}} state
 * @returns {'apply' | 'ignore' | 'conflict'}
 */
export function resolveConfigChange({ dirty, local, incoming }) {
  if (!dirty) return 'apply';
  if (configsEqual(local, incoming)) return 'ignore';
  return 'conflict';
}
