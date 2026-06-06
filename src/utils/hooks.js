function createHookBus() {
  const listeners = {};

  return {
    on(event, cb) {
      (listeners[event] ||= []).push(cb);
      return () => {
        listeners[event] = (listeners[event] || []).filter((l) => l !== cb);
      };
    },
    emit(event, data) {
      (listeners[event] || []).forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error('[Dandelion] hook error:', error);
        }
      });
    },
    off(event, cb) {
      if (cb) {
        listeners[event] = (listeners[event] || []).filter((l) => l !== cb);
      } else {
        delete listeners[event];
      }
    },
  };
}

const globalBus = createHookBus();
export default globalBus;
export { createHookBus };
