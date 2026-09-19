export class MemoryBackend {
  constructor() {
    this._data = new Map();
    this._listeners = new Set();
  }

  storage = {
    local: {
      get: async (key) => {
        if (key === null) {
          const result = {};
          for (const [k, v] of this._data) result[k] = v;
          return result;
        }
        if (Array.isArray(key)) {
          const result = {};
          for (const k of key) result[k] = this._data.get(k) ?? null;
          return result;
        }
        return { [key]: this._data.get(key) ?? null };
      },
      set: async (data) => {
        const changes = {};
        for (const [k, v] of Object.entries(data)) {
          changes[k] = { oldValue: this._data.get(k) ?? null, newValue: v };
          this._data.set(k, v);
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
            changes[k] = { oldValue: this._data.get(k), newValue: null };
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
    return Object.fromEntries(this._data);
  }
}
