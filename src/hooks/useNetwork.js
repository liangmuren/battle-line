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

  const wireConnection = useCallback((c, amIHost) => {
    c.on('data', (data) => {
      if (onDataRef.current) onDataRef.current(data);
    });

    c.on('close', () => {
      alert('对方已断开');
      window.location.reload();
    });

    c.on('error', (err) => {
      console.error('Connection error:', err);
      setStatus('连接出错: ' + err.type);
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

    // Host: incoming connection from guest
    p.on('connection', (c) => {
      setConn(c);
      setIsHost(true);
      setStatus('对方已连接，正在初始化...');
      wireConnection(c, true);
      c.on('open', () => {
        setStatus('已连接！');
        if (onConnectedRef.current) onConnectedRef.current(c, true);
      });
    });

    p.on('error', (err) => {
      console.error('Peer error:', err);
      setStatus('连接错误: ' + err.type);
    });

    p.on('disconnected', () => {
      setStatus('信令服务器断开，尝试重连...');
      p.reconnect();
    });

    return () => p.destroy();
  }, [wireConnection]);

  const joinGame = useCallback((hostId) => {
    if (!peer) return;
    setStatus('连接中...');
    const c = peer.connect(hostId, { reliable: true });
    setConn(c);
    setIsHost(false);
    wireConnection(c, false);

    c.on('open', () => {
      setStatus('已连接，等待游戏数据...');
      if (onConnectedRef.current) onConnectedRef.current(c, false);
    });

    // Timeout: if not connected within 10s
    setTimeout(() => {
      if (!c.open) {
        setStatus('连接超时，请检查代码是否正确，或刷新重试');
      }
    }, 10000);
  }, [peer, wireConnection]);

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
