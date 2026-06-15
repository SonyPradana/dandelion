export class MemoryBackend {
  constructor() {
    this._data = new Map();
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
        for (const [k, v] of Object.entries(data)) this._data.set(k, v);
      },
      remove: async (key) => {
        if (Array.isArray(key)) {
          for (const k of key) this._data.delete(k);
        } else {
          this._data.delete(key);
        }
      },
    },
  };

  runtime = {
    getManifest: () => ({ version: '0.0.0-test' }),
  };

  reset() {
    this._data.clear();
  }

  dump() {
    return Object.fromEntries(this._data);
  }
}
