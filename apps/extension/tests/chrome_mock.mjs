// Minimal chrome.* stand-in: supports both callback and promise styles used by the extension.
function area() {
  const data = new Map();
  const reply = (value, cb) => (cb ? cb(value) : Promise.resolve(value));
  return {
    data,
    get(keys, cb) {
      const list = Array.isArray(keys) ? keys : [keys];
      const out = {};
      list.forEach(k => { if (data.has(k)) out[k] = data.get(k); });
      return reply(out, cb);
    },
    set(values, cb) {
      Object.entries(values).forEach(([k, v]) => data.set(k, v));
      return reply(undefined, cb);
    },
    remove(keys, cb) {
      (Array.isArray(keys) ? keys : [keys]).forEach(k => data.delete(k));
      return reply(undefined, cb);
    },
    onChanged: { addListener() {} }
  };
}

export function installChromeMock() {
  const listeners = {};
  globalThis.chrome = {
    storage: { local: area(), session: area() },
    runtime: {
      id: 'bunker-test',
      onInstalled: { addListener() {} },
      onMessage: { addListener(fn) { listeners.message = fn; } }
    },
    alarms: { create() {}, onAlarm: { addListener() {} } }
  };
  return { chrome: globalThis.chrome, listeners };
}
