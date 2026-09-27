import { connect } from 'node:net';

// Minimal Firefox Remote Debugging Protocol client: the same channel web-ext uses to load temporary add-ons.
export async function rdpConnect(port, attempts = 50) {
  for (let i = 0; ; i++) {
    try {
      return await open(port);
    } catch (e) {
      if (i >= attempts) throw e;
      await new Promise(ok => setTimeout(ok, 200));
    }
  }
}

function open(port) {
  return new Promise((ok, fail) => {
    const sock = connect(port, '127.0.0.1');
    let buf = Buffer.alloc(0);
    const waiting = new Map();
    const listeners = [];
    const deliver = message => {
      listeners.forEach(fn => fn(message));
      const queue = waiting.get(message.from);
      if (message.from === 'root' && message.applicationType) return ok(client);
      if (message.type && !queue?.length) return;
      queue?.shift()?.(message);
    };
    // Packets are "<byte length>:<json>"; lengths count bytes, so parse the raw buffer, not a string.
    sock.on('data', chunk => {
      buf = Buffer.concat([buf, chunk]);
      for (;;) {
        const colon = buf.indexOf(58);
        if (colon < 0) return;
        const size = Number(buf.subarray(0, colon).toString());
        if (buf.length < colon + 1 + size) return;
        const message = JSON.parse(buf.subarray(colon + 1, colon + 1 + size).toString('utf8'));
        buf = buf.subarray(colon + 1 + size);
        deliver(message);
      }
    });
    sock.on('error', fail);
    const client = {
      request(to, type, body = {}) {
        return new Promise((resolve, reject) => {
          if (!waiting.has(to)) waiting.set(to, []);
          waiting.get(to).push(reply => (reply.error ? reject(new Error(`${reply.error}: ${reply.message}`)) : resolve(reply)));
          const json = Buffer.from(JSON.stringify({ to, type, ...body }), 'utf8');
          sock.write(`${json.length}:`);
          sock.write(json);
        });
      },
      on: fn => listeners.push(fn),
      close: () => sock.end()
    };
  });
}

const wait = ms => new Promise(ok => setTimeout(ok, ms));

// Installs a temporary add-on; `evaluate(urlPart, code)` runs code in one of its documents and returns JSON-decoded output.
export async function installTemporaryAddon(port, addonPath) {
  const rdp = await rdpConnect(port);
  const root = await rdp.request('root', 'getRoot');
  const { addon } = await rdp.request(root.addonsActor, 'installTemporaryAddon', { addonPath, openDevTools: false });
  const { addons } = await rdp.request('root', 'listAddons');
  const descriptor = addons.find(a => a.id === addon.id);
  const watcher = await rdp.request(descriptor.actor, 'getWatcher');
  const frames = new Map();
  rdp.on(m => {
    if (m.type === 'target-available-form') frames.set(m.target.actor, m.target);
    if (m.type === 'target-destroyed-form') frames.delete(m.target.actor);
  });
  await rdp.request(watcher.actor, 'watchTargets', { targetType: 'frame' });
  const uuids = JSON.parse((await rdp.request(root.preferenceActor, 'getCharPref', { value: 'extensions.webextensions.uuids' })).value);
  // The result event can arrive in the same chunk as the request's reply, so results are parked by id.
  const results = new Map();
  const pending = new Map();
  rdp.on(m => {
    if (m.type !== 'evaluationResult') return;
    const settle = pending.get(m.resultID);
    if (settle) settle(m);
    else results.set(m.resultID, m);
  });
  // Documents start asynchronously (the event page right after install, tabs after navigation).
  const target = async urlPart => {
    for (let i = 0; i < 100; i++) {
      const found = [...frames.values()].reverse().find(t => t.url.startsWith('moz-extension://') && t.url.includes(urlPart));
      if (found) return found;
      await wait(100);
    }
    throw new Error(`no extension document matching ${urlPart}: ${[...frames.values()].map(t => t.url).join(', ')}`);
  };
  const evaluate = async (urlPart, code) => {
    const { consoleActor } = await target(urlPart);
    // Rejections of the evaluated promise do not surface over RDP, so errors travel inside the payload.
    const text = `(async () => { try { return JSON.stringify({ value: await (${code}) }); } catch (e) { return JSON.stringify({ error: String(e) }); } })()`;
    const { resultID } = await rdp.request(consoleActor, 'evaluateJSAsync', { text, mapped: { await: true } });
    const m = results.get(resultID) ?? await new Promise(ok => pending.set(resultID, ok));
    if (m.exceptionMessage) throw new Error(m.exceptionMessage);
    const out = JSON.parse(m.result);
    if (out.error) throw new Error(out.error);
    return out.value;
  };
  return { id: addon.id, uuid: uuids[addon.id], evaluate, close: () => rdp.close() };
}
