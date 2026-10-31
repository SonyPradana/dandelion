export class MemoryBackend {
  /**
   * @param {{ clone?: boolean }} [options] When `clone` is true, values are
   * deep-copied on get and set, so two store instances behave like separate
   * browser contexts instead of sharing object references.
   */
  constructor({ clone = false } = {}) {
    this._data = new Map();
    this._listeners = new Set();
    this._clone = clone;
  }

  _copy(value) {
    return this._clone ? structuredClone(value) : value;
  }

  storage = {
    local: {
      get: async (key) => {
        if (key === null) {
          const result = {};
          for (const [k, v] of this._data) result[k] = this._copy(v);
          return result;
        }
        if (Array.isArray(key)) {
          const result = {};
          for (const k of key) result[k] = this._copy(this._data.get(k) ?? null);
          return result;
        }
        return { [key]: this._copy(this._data.get(key) ?? null) };
      },
      set: async (data) => {
        const changes = {};
        for (const [k, v] of Object.entries(data)) {
          const stored = this._copy(v);
          changes[k] = { oldValue: this._copy(this._data.get(k) ?? null), newValue: stored };
          this._data.set(k, stored);
        }
        if (Object.keys(changes).length > 0) {
          this._emit('local', changes);
        }
      },
      remove: async (key) => {
        const keys = Array.isArray(key) ? key : [key];
        const changes = {};
        for (const k of keys) {
          if (this._data.has(k)) {
            changes[k] = { oldValue: this._copy(this._data.get(k)), newValue: null };
            this._data.delete(k);
          }
        }
        if (Object.keys(changes).length > 0) {
          this._emit('local', changes);
        }
      },
    },
    onChanged: {
      addListener: (listener) => this._listeners.add(listener),
      removeListener: (listener) => this._listeners.delete(listener),
    },
  };

  runtime = {
    getManifest: () => ({ version: '0.0.0-test' }),
  };

  _emit(area, changes) {
    queueMicrotask(() => {
      for (const listener of this._listeners) listener(changes, area);
    });
  }

  reset() {
    this._data.clear();
  }

  dump() {
    return Object.fromEntries([...this._data].map(([k, v]) => [k, this._copy(v)]));
  }
}
