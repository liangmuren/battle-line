import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

export function useNetwork() {
  const [peer, setPeer] = useState(null);
  const [conn, setConn] = useState(null);
  const [myId, setMyId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState('');

  // Callbacks that the consumer can set to react to network events
  const onConnectedRef = useRef(null);   // (conn, isHost) => void
  const onDataRef = useRef(null);        // (data) => void

  const handleConnection = useCallback((c, amIHost) => {
    setConn(c);
    setIsHost(amIHost);
    setStatus('连接中...');

    c.on('open', () => {
      setStatus('已连接！');
      if (onConnectedRef.current) onConnectedRef.current(c, amIHost);
    });

    c.on('data', (data) => {
      if (onDataRef.current) onDataRef.current(data);
    });

    c.on('close', () => {
      alert('对方已断开');
      window.location.reload();
    });
  }, []);

  // Initialize PeerJS with STUN server
  useEffect(() => {
    const p = new Peer(null, {
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    });

    p.on('open', (id) => {
      setMyId(id);
      setPeer(p);
    });

    p.on('connection', (c) => {
      handleConnection(c, true);
    });

    p.on('error', (err) => {
      alert('连接错误: ' + err.type);
    });

    return () => p.destroy();
  }, [handleConnection]);

  const joinGame = useCallback((hostId) => {
    if (!peer) return;
    const c = peer.connect(hostId);
    handleConnection(c, false);
  }, [peer, handleConnection]);

  return {
    peer,
    conn,
    myId,
    isHost,
    status,
    joinGame,
    setConn,
    onConnectedRef,
    onDataRef,
  };
}
