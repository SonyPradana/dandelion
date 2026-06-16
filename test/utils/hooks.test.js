import { describe, it, expect, vi } from 'vitest';
import { createHookBus } from '../../src/utils/hooks.js';

describe('createHookBus', () => {
  it('should return an object with on/emit/off', () => {
    const bus = createHookBus();
    expect(bus).toHaveProperty('on');
    expect(bus).toHaveProperty('emit');
    expect(bus).toHaveProperty('off');
  });

  it('should call listener when event is emitted', () => {
    const bus = createHookBus();
    let called = false;
    bus.on('test', () => {
      called = true;
    });
    bus.emit('test');
    expect(called).toBe(true);
  });

  it('should pass data to listener', () => {
    const bus = createHookBus();
    let received = null;
    bus.on('test', (data) => {
      received = data;
    });
    bus.emit('test', { foo: 'bar' });
    expect(received).toEqual({ foo: 'bar' });
  });

  it('should call multiple listeners for same event', () => {
    const bus = createHookBus();
    const calls = [];
    bus.on('test', () => calls.push('a'));
    bus.on('test', () => calls.push('b'));
    bus.emit('test');
    expect(calls).toEqual(['a', 'b']);
  });

  it('should remove listener with off(event, cb)', () => {
    const bus = createHookBus();
    let count = 0;
    const fn = () => {
      count++;
    };
    bus.on('test', fn);
    bus.emit('test');
    bus.off('test', fn);
    bus.emit('test');
    expect(count).toBe(1);
  });

  it('should remove all listeners with off(event)', () => {
    const bus = createHookBus();
    let count = 0;
    bus.on('test', () => {
      count++;
    });
    bus.on('test', () => {
      count++;
    });
    bus.off('test');
    bus.emit('test');
    expect(count).toBe(0);
  });

  it('should not throw when emitting event with no listeners', () => {
    const bus = createHookBus();
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });

  it('should return unsubscribe function from on()', () => {
    const bus = createHookBus();
    let count = 0;
    const unsub = bus.on('test', () => {
      count++;
    });
    bus.emit('test');
    unsub();
    bus.emit('test');
    expect(count).toBe(1);
  });

  // it('should not break other listeners when one throws', () => {
  //   const bus = createHookBus()
  //   const calls = []
  //   bus.on('test', () => { throw new Error('oops') })
  //   bus.on('test', () => calls.push('ok'))
  //   expect(() => bus.emit('test')).not.toThrow()
  //   expect(calls).toEqual(['ok'])
  // })

  describe('error handling', () => {
    it('off with non-existent listener should not error', () => {
      const bus = createHookBus();
      const fn = () => {};
      expect(() => bus.off('test', fn)).not.toThrow();
    });

    it('off with non-existent event should not error', () => {
      const bus = createHookBus();
      expect(() => bus.off('nonexistent')).not.toThrow();
    });

    it('on with null callback should handle gracefully', () => {
      const bus = createHookBus();
      expect(() => bus.on('test', null)).not.toThrow();
    });

    // it('multiple listeners throwing should all be caught', () => {
    //   const bus = createHookBus()
    //   const calls = []
    //   bus.on('test', () => { throw new Error('error1') })
    //   bus.on('test', () => calls.push('middle'))
    //   bus.on('test', () => { throw new Error('error2') })
    //   bus.on('test', () => calls.push('end'))
    //   expect(() => bus.emit('test')).not.toThrow()
    //   expect(calls).toEqual(['middle', 'end'])
    // })
  });

  describe('edge cases', () => {
    it('should handle event name as special characters', () => {
      const bus = createHookBus();
      let called = false;
      bus.on('event-@#$%', () => {
        called = true;
      });
      bus.emit('event-@#$%');
      expect(called).toBe(true);
    });

    it('should handle very long event names', () => {
      const bus = createHookBus();
      const longName = 'e'.repeat(1000);
      let called = false;
      bus.on(longName, () => {
        called = true;
      });
      bus.emit(longName);
      expect(called).toBe(true);
    });

    it('should handle single-item queue with rapid on/off', () => {
      const bus = createHookBus();
      const fn = vi.fn();
      const unsub = bus.on('test', fn);
      unsub();
      bus.emit('test');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should pass complex objects through event data', () => {
      const bus = createHookBus();
      const complexData = { nested: { deep: [1, 2, { value: 'test' }] } };
      let received = null;
      bus.on('test', (data) => {
        received = data;
      });
      bus.emit('test', complexData);
      expect(received).toEqual(complexData);
    });

    it('should handle emit with undefined data', () => {
      const bus = createHookBus();
      let received = 'initial';
      bus.on('test', (data) => {
        received = data;
      });
      bus.emit('test');
      expect(received).toBeUndefined();
    });

    it('should handle multiple unsubscribe calls', () => {
      const bus = createHookBus();
      let count = 0;
      const unsub = bus.on('test', () => {
        count++;
      });
      unsub();
      unsub();
      bus.emit('test');
      expect(count).toBe(0);
    });
  });
});
