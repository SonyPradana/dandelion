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
 * Picks how an editor reacts to a config change from storage: `apply` when not
 * editing, `ignore` when storage matches the baseline, `conflict` otherwise.
 * @param {{dirty: boolean, baseline: unknown, incoming: unknown}} state
 * @returns {'apply' | 'ignore' | 'conflict'}
 */
export function resolveConfigChange({ dirty, baseline, incoming }) {
  if (!dirty) return 'apply';
  if (configsEqual(baseline, incoming)) return 'ignore';
  return 'conflict';
}
