import { useEffect, useRef } from 'react';
import { useNetwork } from './hooks/useNetwork';
import { useGameState } from './hooks/useGameState';
import Lobby from './components/Lobby';
import Game from './components/Game';

export default function App() {
  const { conn, isHost, status, roomCode, createRoom, joinGame, onConnectedRef, onDataRef } =
    useNetwork();

  const {
    G,
    setG,
    view,
    setView,
    selIdx,
    mode,
    myPlayerId,
    isMyTurn,
    canIPlayTactic,
    onCardClick,
    onOppCardClick,
    onMyCardOnFlagClick,
    onSlotClick,
    onDrawClick,
    onClaimClick,
    onRedeployDiscard,
    initGame,
    processAction,
    setActionLock,
  } = useGameState(conn, isHost);

  // Track latest G for reconnection state resync
  const latestGRef = useRef(G);
  useEffect(() => {
    latestGRef.current = G;
  }, [G]);

  // Wire network callbacks to game state
  useEffect(() => {
    onConnectedRef.current = (c, amIHost, isReconnect) => {
      if (amIHost) {
        if (isReconnect && latestGRef.current) {
          // Resync: send current game state to reconnected guest
          c.send({ type: 'STATE', payload: latestGRef.current });
        } else {
          initGame(c);
        }
      }
    };
  }, [onConnectedRef, initGame]);

  useEffect(() => {
    onDataRef.current = (data) => {
      if (data.type === 'STATE') {
        setG(data.payload);
        setView('GAME');
        setActionLock(false);
      } else if (data.type === 'ACTION') {
        if (isHost) processAction(data.action.type, data.payload);
      }
    };
  }, [onDataRef, isHost, processAction, setG, setView, setActionLock]);

  if (view === 'LOBBY') {
    return (
      <Lobby
        onJoin={joinGame}
        onCreateRoom={createRoom}
        status={status}
        roomCode={roomCode}
      />
    );
  }

  return (
    <Game
      G={G}
      myPlayerId={myPlayerId}
      isMyTurn={isMyTurn}
      selIdx={selIdx}
      mode={mode}
      canIPlayTactic={canIPlayTactic}
      onCardClick={onCardClick}
      onSlotClick={onSlotClick}
      onOppCardClick={onOppCardClick}
      onMyCardOnFlagClick={onMyCardOnFlagClick}
      onDrawClick={onDrawClick}
      onClaimClick={onClaimClick}
      onRedeployDiscard={onRedeployDiscard}
    />
  );
}
