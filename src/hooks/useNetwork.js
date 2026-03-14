import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

function getPlayerId() {
  let id = sessionStorage.getItem('bl_playerId');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('bl_playerId', id);
  }
  return id;
}

export function useNetwork() {
  const [conn, setConn] = useState(null);
  const [myId] = useState(() => getPlayerId());
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const wsRef = useRef(null);
  const onConnectedRef = useRef(null);  // (conn, isHost, isReconnect) => void
  const onDataRef = useRef(null);       // (data) => void

  const isHostRef = useRef(false);
  const roomCodeRef = useRef('');
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const heartbeatRef = useRef(null);
  const intentionalCloseRef = useRef(false);
  const pendingActionRef = useRef(null); // { type: 'create' } or { type: 'join', roomCode }
  const hasConnectedPeerRef = useRef(false);

  // Build a conn shim that sends via WebSocket RELAY
  const makeConnShim = useCallback((ws) => {
    return {
      send: (data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'RELAY', payload: data }));
        }
      },
    };
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback((ws) => {
    clearHeartbeat();
    heartbeatRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25_000);
  }, [clearHeartbeat]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connectWs = useCallback((action) => {
    // action: { type: 'create' } or { type: 'join', roomCode: string }
    clearReconnectTimer();

    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
      wsRef.current.close();
    }

    pendingActionRef.current = action;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      startHeartbeat(ws);

      const act = pendingActionRef.current;
      if (!act) return;

      if (act.type === 'create') {
        ws.send(JSON.stringify({ type: 'CREATE_ROOM', playerId: myId }));
      } else if (act.type === 'join') {
        ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode: act.roomCode, playerId: myId }));
      }
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'ROOM_CREATED': {
          isHostRef.current = true;
          roomCodeRef.current = msg.roomCode;
          setIsHost(true);
          setRoomCode(msg.roomCode);
          setStatus('等待对方加入...');
          const shim = makeConnShim(ws);
          setConn(shim);
          break;
        }

        case 'ROOM_JOINED': {
          const role = msg.role || 'guest';
          const isReconnect = !!msg.reconnect;
          isHostRef.current = role === 'host';
          roomCodeRef.current = msg.roomCode;
          setIsHost(role === 'host');
          setRoomCode(msg.roomCode);
          setStatus(isReconnect ? '重连成功！' : '已加入房间');
          const shim = makeConnShim(ws);
          setConn(shim);

          // Save room code for reconnect
          sessionStorage.setItem('bl_roomCode', msg.roomCode);
          break;
        }

        case 'PEER_CONNECTED': {
          const isReconnect = hasConnectedPeerRef.current;
          hasConnectedPeerRef.current = true;
          setStatus('已连接！');

          // Save room code for reconnect
          sessionStorage.setItem('bl_roomCode', roomCodeRef.current);

          const shim = makeConnShim(ws);
          setConn(shim);
          if (onConnectedRef.current) {
            onConnectedRef.current(shim, isHostRef.current, isReconnect);
          }
          break;
        }

        case 'PEER_DISCONNECTED': {
          setStatus('对方断线，等待重连...');
          break;
        }

        case 'RELAY': {
          if (onDataRef.current && msg.payload) {
            onDataRef.current(msg.payload);
          }
          break;
        }

        case 'ERROR': {
          setStatus('错误: ' + msg.message);
          break;
        }

        case 'PONG':
          // heartbeat response, nothing to do
          break;

        default:
          break;
      }
    };

    ws.onclose = () => {
      clearHeartbeat();

      if (intentionalCloseRef.current) return;

      setStatus('连接断开，正在重连...');
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }, [myId, makeConnShim, startHeartbeat, clearHeartbeat, clearReconnectTimer]);

  const scheduleReconnect = useCallback(() => {
    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(1000 * Math.pow(2, attempt), 30_000);
    reconnectAttemptRef.current = attempt + 1;

    reconnectTimerRef.current = setTimeout(() => {
      // Reconnect: re-join room with same playerId
      const savedRoom = roomCodeRef.current || sessionStorage.getItem('bl_roomCode');
      if (savedRoom) {
        connectWs({ type: 'join', roomCode: savedRoom });
      }
    }, delay);
  }, [connectWs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      clearHeartbeat();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearReconnectTimer, clearHeartbeat]);

  const createRoom = useCallback(() => {
    hasConnectedPeerRef.current = false;
    setStatus('正在创建房间...');
    connectWs({ type: 'create' });
  }, [connectWs]);

  const joinGame = useCallback((code) => {
    if (!code) return;
    hasConnectedPeerRef.current = false;
    setStatus('正在加入房间...');
    connectWs({ type: 'join', roomCode: code.toUpperCase() });
  }, [connectWs]);

  return {
    conn,
    myId,
    isHost,
    status,
    roomCode,
    createRoom,
    joinGame,
    onConnectedRef,
    onDataRef,
  };
}
