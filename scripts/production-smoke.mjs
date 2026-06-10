import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const WebSocket = require(path.join(__dirname, '..', 'server', 'node_modules', 'ws'));

const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error('Usage: node scripts/production-smoke.mjs <https://your-domain>');
  process.exit(1);
}

const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
const wsUrl = normalizedBaseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

async function get(urlPath) {
  const res = await fetch(`${normalizedBaseUrl}${urlPath}`);
  const text = await res.text();
  return { status: res.status, text };
}

function connect() {
  const ws = new WebSocket(wsUrl);
  const messages = [];
  ws.on('message', (raw) => messages.push(JSON.parse(String(raw))));
  return new Promise((resolve, reject) => {
    ws.on('open', () => resolve({ ws, messages }));
    ws.on('error', reject);
    setTimeout(() => reject(new Error('websocket open timeout')), 5000);
  });
}

function send(ws, msg) {
  ws.send(JSON.stringify(msg));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(messages, predicate, label, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const found = messages.find(predicate);
    if (found) return found;
    await sleep(25);
  }
  throw new Error(`timed out waiting for ${label}: ${JSON.stringify(messages)}`);
}

const index = await get('/');
assert.equal(index.status, 200, 'index should return 200');
assert.match(index.text, /<div id="root"><\/div>/, 'index should contain React root');

const scriptPath = index.text.match(/<script[^>]+src="([^"]+)"/)?.[1];
assert.ok(scriptPath, 'expected bundled script in index.html');

const script = await get(scriptPath);
assert.equal(script.status, 200, 'bundled script should return 200');

const health = await get('/healthz');
assert.equal(health.status, 200, 'health check should return 200');
assert.deepEqual(JSON.parse(health.text), { ok: true }, 'health check payload should be ok');

const malformed = await connect();
send(malformed.ws, { type: 'JOIN_ROOM', playerId: `bad-${Date.now()}` });
await waitFor(malformed.messages, (m) => m.type === 'ERROR', 'malformed JOIN_ROOM ERROR');
malformed.ws.close();

const host = await connect();
send(host.ws, { type: 'CREATE_ROOM', playerId: `host-${Date.now()}` });
const created = await waitFor(host.messages, (m) => m.type === 'ROOM_CREATED', 'ROOM_CREATED');

const guest = await connect();
send(guest.ws, { type: 'JOIN_ROOM', roomCode: created.roomCode, playerId: `guest-${Date.now()}` });
await waitFor(host.messages, (m) => m.type === 'PEER_CONNECTED', 'host PEER_CONNECTED');
await waitFor(guest.messages, (m) => m.type === 'PEER_CONNECTED', 'guest PEER_CONNECTED');

host.ws.close();
guest.ws.close();

console.log(JSON.stringify({
  baseUrl: normalizedBaseUrl,
  wsUrl,
  indexStatus: index.status,
  scriptPath,
  scriptStatus: script.status,
  healthStatus: health.status,
  roomCode: created.roomCode,
  websocketConnected: true,
}, null, 2));
