import { WebSocketServer } from 'ws';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Room: { host: ws|null, guest: ws|null, hostId, guestId, createdAt, lastActivity }
const rooms = new Map();
// playerId → roomCode (for reconnection lookup)
const playerIndex = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    if (!rooms.has(code)) return code;
  }
  return null;
}

function send(ws, msg) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  }
}

function getPartner(room, ws) {
  if (room.host === ws) return room.guest;
  if (room.guest === ws) return room.host;
  return null;
}

function handleCreate(ws, playerId) {
  // If player already in a room, remove old room
  cleanupPlayer(playerId);

  const code = generateRoomCode();
  if (!code) {
    send(ws, { type: 'ERROR', message: '房间创建失败，请重试' });
    return;
  }

  const room = {
    host: ws,
    guest: null,
    hostId: playerId,
    guestId: null,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  rooms.set(code, room);
  playerIndex.set(playerId, code);

  ws._roomCode = code;
  ws._playerId = playerId;
  ws._role = 'host';

  send(ws, { type: 'ROOM_CREATED', roomCode: code });
  console.log(`Room ${code} created by ${playerId}`);
}

function handleJoin(ws, roomCode, playerId) {
  const code = roomCode.toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    // Check if player was in a room before (reconnect by playerId)
    const oldCode = playerIndex.get(playerId);
    if (oldCode && rooms.has(oldCode)) {
      return handleRejoin(ws, oldCode, playerId);
    }
    send(ws, { type: 'ERROR', message: '房间不存在' });
    return;
  }

  room.lastActivity = Date.now();

  // Reconnect as host
  if (room.hostId === playerId) {
    return handleRejoin(ws, code, playerId);
  }

  // Reconnect as guest
  if (room.guestId === playerId) {
    return handleRejoin(ws, code, playerId);
  }

  // New guest joining
  if (room.guest !== null || room.guestId !== null) {
    send(ws, { type: 'ERROR', message: '房间已满' });
    return;
  }

  // Clean up any old room this player was in
  cleanupPlayer(playerId);

  room.guest = ws;
  room.guestId = playerId;
  playerIndex.set(playerId, code);

  ws._roomCode = code;
  ws._playerId = playerId;
  ws._role = 'guest';

  send(ws, { type: 'ROOM_JOINED', roomCode: code, role: 'guest' });
  send(room.host, { type: 'PEER_CONNECTED' });
  send(ws, { type: 'PEER_CONNECTED' });

  console.log(`Player ${playerId} joined room ${code} as guest`);
}

function handleRejoin(ws, code, playerId) {
  const room = rooms.get(code);
  if (!room) return;

  room.lastActivity = Date.now();
  let role;

  if (room.hostId === playerId) {
    // Close old socket if still around
    if (room.host && room.host !== ws && room.host.readyState === 1) {
      room.host.close();
    }
    room.host = ws;
    role = 'host';
  } else if (room.guestId === playerId) {
    if (room.guest && room.guest !== ws && room.guest.readyState === 1) {
      room.guest.close();
    }
    room.guest = ws;
    role = 'guest';
  } else {
    send(ws, { type: 'ERROR', message: '身份不匹配' });
    return;
  }

  ws._roomCode = code;
  ws._playerId = playerId;
  ws._role = role;
  playerIndex.set(playerId, code);

  send(ws, { type: 'ROOM_JOINED', roomCode: code, role, reconnect: true });

  // Notify partner
  const partner = getPartner(room, ws);
  if (partner) {
    send(partner, { type: 'PEER_CONNECTED' });
    send(ws, { type: 'PEER_CONNECTED' });
  }

  console.log(`Player ${playerId} reconnected to room ${code} as ${role}`);
}

function handleRelay(ws, payload) {
  const code = ws._roomCode;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  room.lastActivity = Date.now();
  const partner = getPartner(room, ws);
  send(partner, { type: 'RELAY', payload });
}

function handleDisconnect(ws) {
  const code = ws._roomCode;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  // Don't remove from room — keep slot for reconnect
  if (room.host === ws) room.host = null;
  if (room.guest === ws) room.guest = null;

  // Notify partner
  const partner = room.host || room.guest;
  if (partner) {
    send(partner, { type: 'PEER_DISCONNECTED' });
  }

  console.log(`Player ${ws._playerId} disconnected from room ${code}`);
}

function cleanupPlayer(playerId) {
  const oldCode = playerIndex.get(playerId);
  if (!oldCode) return;

  const oldRoom = rooms.get(oldCode);
  if (oldRoom) {
    if (oldRoom.hostId === playerId) {
      if (oldRoom.host && oldRoom.host.readyState === 1) oldRoom.host.close();
      oldRoom.host = null;
      oldRoom.hostId = null;
    }
    if (oldRoom.guestId === playerId) {
      if (oldRoom.guest && oldRoom.guest.readyState === 1) oldRoom.guest.close();
      oldRoom.guest = null;
      oldRoom.guestId = null;
    }
    // If room is empty, delete it
    if (!oldRoom.hostId && !oldRoom.guestId) {
      rooms.delete(oldCode);
    }
  }
  playerIndex.delete(playerId);
}

// --- Heartbeat ---
const HEARTBEAT_INTERVAL = 30_000;
const HEARTBEAT_TIMEOUT = 2;

function setupHeartbeat(wss) {
  setInterval(() => {
    for (const ws of wss.clients) {
      if (ws._missedPongs >= HEARTBEAT_TIMEOUT) {
        console.log(`Heartbeat timeout for ${ws._playerId}`);
        ws.terminate();
        continue;
      }
      ws._missedPongs = (ws._missedPongs || 0) + 1;
      send(ws, { type: 'PONG' }); // server-initiated ping via app-level message
    }
  }, HEARTBEAT_INTERVAL);
}

// --- Room cleanup: every 5 min, remove rooms inactive for 2 hours ---
const CLEANUP_INTERVAL = 5 * 60_000;
const ROOM_TTL = 2 * 60 * 60_000;

function setupCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (now - room.lastActivity > ROOM_TTL) {
        // Close any remaining connections
        if (room.host && room.host.readyState === 1) room.host.close();
        if (room.guest && room.guest.readyState === 1) room.guest.close();
        if (room.hostId) playerIndex.delete(room.hostId);
        if (room.guestId) playerIndex.delete(room.guestId);
        rooms.delete(code);
        console.log(`Room ${code} expired`);
      }
    }
  }, CLEANUP_INTERVAL);
}

// --- Start server ---
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  ws._missedPongs = 0;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // Reset heartbeat on any message
    ws._missedPongs = 0;

    switch (msg.type) {
      case 'CREATE_ROOM':
        handleCreate(ws, msg.playerId);
        break;
      case 'JOIN_ROOM':
        handleJoin(ws, msg.roomCode, msg.playerId);
        break;
      case 'RELAY':
        handleRelay(ws, msg.payload);
        break;
      case 'PING':
        send(ws, { type: 'PONG' });
        break;
      default:
        break;
    }
  });

  ws.on('close', () => handleDisconnect(ws));
  ws.on('error', () => handleDisconnect(ws));
});

setupHeartbeat(wss);
setupCleanup();

console.log(`Battle Line relay server running on port ${PORT}`);
console.log(`Rooms: 0 | Players: 0`);
