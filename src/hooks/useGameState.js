import { useState, useRef, useCallback } from 'react';
import { createTroopDeck, createTacticsDeck, getRank, compare, canClaim, isWild } from '../gameLogic';
import { FLAG_TACTICS, ENV_TACTICS, MORALE_TACTICS } from '../constants';

const INITIAL_STATE = {
  board: Array(9).fill(null).map((_, i) => ({ id: i, p1: [], p2: [], owner: null, fog: false, mud: false })),
  p1Hand: [],
  p2Hand: [],
  troops: [],
  tactics: [],
  turn: 'p1',
  phase: 'PLAY',      // PLAY | DRAW | SCOUT_DRAW | SCOUT_RETURN | REDEPLOY_SRC | REDEPLOY_DEST
  log: '等待开战...',
  winner: null,
  discardPile: [],
  p1TacticsPlayed: 0,
  p2TacticsPlayed: 0,
  // Scout state
  scoutDrawsLeft: 0,
  scoutReturnsLeft: 0,
  // Redeploy state
  redeployCard: null,      // { slotIdx, cardIdx, card }
  redeploySourceSlot: null, // slot index the card was taken from
};

export function useGameState(conn, isHost) {
  const [G, setG] = useState(INITIAL_STATE);
  const [view, setView] = useState('LOBBY');
  const [selIdx, setSelIdx] = useState(null);
  const [mode, setMode] = useState('NORMAL');
  // NORMAL | TARGET_OPP | TARGET_SLOT | SCOUT_RETURN | REDEPLOY_SRC | REDEPLOY_DEST
  const [pendingTactic, setPendingTactic] = useState(null);
  const [targetCard, setTargetCard] = useState(null);
  const [actionLock, setActionLock] = useState(false);

  const stateRef = useRef(G);
  const connRef = useRef(conn);
  stateRef.current = G;
  connRef.current = conn;

  const updateState = useCallback((newState, connection) => {
    const c = connection || connRef.current;
    setG(newState);
    stateRef.current = newState;
    setView('GAME');
    setActionLock(false);
    if (c) c.send({ type: 'STATE', payload: newState });
  }, []);

  const initGame = useCallback((connection) => {
    const td = createTroopDeck();
    const tac = createTacticsDeck();
    const p1Hand = td.splice(0, 7);
    const p2Hand = td.splice(0, 7);

    const newState = {
      board: Array(9).fill(null).map((_, i) => ({ id: i, p1: [], p2: [], owner: null, fog: false, mud: false })),
      p1Hand,
      p2Hand,
      troops: td,
      tactics: tac,
      turn: 'p1',
      phase: 'PLAY',
      log: '战役开始！你先手。',
      winner: null,
      discardPile: [],
      p1TacticsPlayed: 0,
      p2TacticsPlayed: 0,
      scoutDrawsLeft: 0,
      scoutReturnsLeft: 0,
      redeployCard: null,
      redeploySourceSlot: null,
    };

    updateState(newState, connection);
  }, [updateState]);

  /** Check victory: 5 flags or 3 adjacent flags */
  const checkWinner = (board) => {
    const p1Flags = board.filter(b => b.owner === 'p1').length;
    const p2Flags = board.filter(b => b.owner === 'p2').length;
    if (p1Flags >= 5) return 'p1';
    if (p2Flags >= 5) return 'p2';
    // 3 adjacent flags
    for (let i = 0; i <= 6; i++) {
      if (board[i].owner === 'p1' && board[i + 1].owner === 'p1' && board[i + 2].owner === 'p1') return 'p1';
      if (board[i].owner === 'p2' && board[i + 1].owner === 'p2' && board[i + 2].owner === 'p2') return 'p2';
    }
    return null;
  };

  /** Auto-resolve a flag when both sides are full */
  const resolveFlag = (slot, activePlayer) => {
    if (slot.owner) return;
    const req = slot.mud ? 4 : 3;
    if (slot.p1.length >= req && slot.p2.length >= req) {
      const f1 = getRank(slot.p1, slot.fog, slot.mud);
      const f2 = getRank(slot.p2, slot.fog, slot.mud);
      const res = compare(f1, f2);
      if (res === 1) slot.owner = 'p1';
      else if (res === -1) slot.owner = 'p2';
      else slot.owner = activePlayer === 'p1' ? 'p2' : 'p1'; // tie → defender wins
    }
  };

  /** Get the max cards allowed on a flag */
  const flagLimit = (slot) => slot.mud ? 4 : 3;

  /** Check if player can play a tactic card (limit rule) */
  const canPlayTactic = (s, player) => {
    const my = player === 'p1' ? s.p1TacticsPlayed : s.p2TacticsPlayed;
    const opp = player === 'p1' ? s.p2TacticsPlayed : s.p1TacticsPlayed;
    return my <= opp; // can play if myPlayed <= oppPlayed + 1, i.e., before playing: myPlayed <= oppPlayed
  };

  /** Advance to DRAW or skip if both decks empty */
  const advanceToDraw = (s) => {
    if (s.troops.length === 0 && s.tactics.length === 0) {
      // Skip draw, go to next player
      s.turn = s.turn === 'p1' ? 'p2' : 'p1';
      s.phase = 'PLAY';
      s.log = s.turn === 'p1' ? '轮到 P1 行动' : '轮到 P2 行动';
      // Check if next player has empty hand — if so, skip their turn too
      const nextHand = s.turn === 'p1' ? s.p1Hand : s.p2Hand;
      if (nextHand.length === 0) {
        s.turn = s.turn === 'p1' ? 'p2' : 'p1';
        s.log = s.turn === 'p1' ? '轮到 P1 行动' : '轮到 P2 行动';
      }
    } else {
      s.phase = 'DRAW';
      s.log = '出牌完毕，请抽牌';
    }
  };

  const processAction = useCallback((type, payload) => {
    const s = JSON.parse(JSON.stringify(stateRef.current));
    const activePlayer = s.turn;
    const hand = activePlayer === 'p1' ? s.p1Hand : s.p2Hand;

    // ==================== PLAY ====================
    if (type === 'PLAY') {
      const { cardIdx, slotIdx } = payload;
      const card = hand[cardIdx];
      if (!card) return;
      const slot = s.board[slotIdx];
      if (slot.owner) return;

      // Tactic card limit check
      if (card.type === 'TACTIC' && !canPlayTactic(s, activePlayer)) return;

      // --- Environment tactics (Fog, Mud) — don't occupy card slot ---
      if (card.code === 'FOG') {
        slot.fog = true;
        if (activePlayer === 'p1') s.p1Hand.splice(cardIdx, 1);
        else s.p2Hand.splice(cardIdx, 1);
        if (activePlayer === 'p1') s.p1TacticsPlayed++;
        else s.p2TacticsPlayed++;
        // Fog stays on the flag (not discarded)
        resolveFlag(slot, activePlayer);
        s.winner = checkWinner(s.board);
        advanceToDraw(s);
        updateState(s);
        return;
      }

      if (card.code === 'MUD') {
        slot.mud = true;
        if (activePlayer === 'p1') s.p1Hand.splice(cardIdx, 1);
        else s.p2Hand.splice(cardIdx, 1);
        if (activePlayer === 'p1') s.p1TacticsPlayed++;
        else s.p2TacticsPlayed++;
        // Mud stays on the flag (not discarded)
        s.winner = checkWinner(s.board);
        advanceToDraw(s);
        updateState(s);
        return;
      }

      // --- Morale tactics (Traitor, Deserter, Scout, Redeploy) are handled by their own actions ---
      if (card.code === 'TRAITOR' || card.code === 'DESERTER' || card.code === 'SCOUT' || card.code === 'REDEPLOY') {
        return;
      }

      // --- Troop or flag tactic (Leader, Cavalry, Shield) — place on the flag ---
      if (slot[activePlayer].length >= flagLimit(slot)) return; // slot full
      slot[activePlayer].push(card);
      if (activePlayer === 'p1') s.p1Hand.splice(cardIdx, 1);
      else s.p2Hand.splice(cardIdx, 1);
      if (card.type === 'TACTIC') {
        if (activePlayer === 'p1') s.p1TacticsPlayed++;
        else s.p2TacticsPlayed++;
      }

      resolveFlag(slot, activePlayer);
      s.winner = checkWinner(s.board);
      advanceToDraw(s);
      updateState(s);
    }

    // ==================== DRAW ====================
    if (type === 'DRAW') {
      const { deckType } = payload;
      const deck = deckType === 'TROOP' ? s.troops : s.tactics;
      if (deck.length > 0) {
        const newCard = deck.shift();
        if (activePlayer === 'p1') s.p1Hand.push(newCard);
        else s.p2Hand.push(newCard);
      }
      s.turn = s.turn === 'p1' ? 'p2' : 'p1';
      s.phase = 'PLAY';
      s.log = s.turn === 'p1' ? '轮到 P1 行动' : '轮到 P2 行动';
      updateState(s);
    }

    // ==================== CLAIM ====================
    if (type === 'CLAIM') {
      const { slotIdx } = payload;
      const slot = s.board[slotIdx];
      if (slot.owner) return;

      if (canClaim(slot, activePlayer, s.board, s.discardPile)) {
        slot.owner = activePlayer;
        s.log = `${activePlayer === 'p1' ? 'P1' : 'P2'} 宣称了旗帜 ${slotIdx + 1}！`;
        s.winner = checkWinner(s.board);
        updateState(s);
      }
    }

    // ==================== TRAITOR ====================
    if (type === 'TRAITOR') {
      const { cardIdx: handIdx, srcSlotIdx, srcCardIdx, destSlotIdx } = payload;
      const srcSlot = s.board[srcSlotIdx];
      const destSlot = s.board[destSlotIdx];
      const oppSide = activePlayer === 'p1' ? 'p2' : 'p1';

      if (srcSlot.owner || destSlot.owner) return;
      if (!srcSlot[oppSide][srcCardIdx]) return;
      // Traitor can only steal troop cards
      if (srcSlot[oppSide][srcCardIdx].type !== 'TROOP') return;
      if (destSlot[activePlayer].length >= flagLimit(destSlot)) return;

      // Tactic limit check
      if (!canPlayTactic(s, activePlayer)) return;

      const [stolenCard] = srcSlot[oppSide].splice(srcCardIdx, 1);
      destSlot[activePlayer].push(stolenCard);

      const tacticCard = hand[handIdx];
      if (activePlayer === 'p1') s.p1Hand.splice(handIdx, 1);
      else s.p2Hand.splice(handIdx, 1);
      s.discardPile.push(tacticCard);
      if (activePlayer === 'p1') s.p1TacticsPlayed++;
      else s.p2TacticsPlayed++;

      resolveFlag(destSlot, activePlayer);
      s.winner = checkWinner(s.board);
      advanceToDraw(s);
      s.log = '叛变！偷取了对方的卡牌';
      updateState(s);
    }

    // ==================== DESERTER ====================
    if (type === 'DESERTER') {
      const { cardIdx: handIdx, srcSlotIdx, srcCardIdx } = payload;
      const srcSlot = s.board[srcSlotIdx];
      const oppSide = activePlayer === 'p1' ? 'p2' : 'p1';

      if (srcSlot.owner) return;
      if (!srcSlot[oppSide][srcCardIdx]) return;

      // Tactic limit check
      if (!canPlayTactic(s, activePlayer)) return;

      const [removedCard] = srcSlot[oppSide].splice(srcCardIdx, 1);
      s.discardPile.push(removedCard);

      const tacticCard = hand[handIdx];
      if (activePlayer === 'p1') s.p1Hand.splice(handIdx, 1);
      else s.p2Hand.splice(handIdx, 1);
      s.discardPile.push(tacticCard);
      if (activePlayer === 'p1') s.p1TacticsPlayed++;
      else s.p2TacticsPlayed++;

      advanceToDraw(s);
      s.log = '逃兵！移除了对方的卡牌';
      updateState(s);
    }

    // ==================== SCOUT ====================
    if (type === 'SCOUT') {
      const { cardIdx: handIdx } = payload;

      // Tactic limit check
      if (!canPlayTactic(s, activePlayer)) return;

      const tacticCard = hand[handIdx];
      if (activePlayer === 'p1') s.p1Hand.splice(handIdx, 1);
      else s.p2Hand.splice(handIdx, 1);
      s.discardPile.push(tacticCard);
      if (activePlayer === 'p1') s.p1TacticsPlayed++;
      else s.p2TacticsPlayed++;

      s.phase = 'SCOUT_DRAW';
      s.scoutDrawsLeft = 3;
      s.log = '侦察兵！选择牌堆抽取3张牌';
      updateState(s);
    }

    // ==================== SCOUT_DRAW (draw one card at a time, 3 times) ====================
    if (type === 'SCOUT_DRAW') {
      const { deckType } = payload;
      const deck = deckType === 'TROOP' ? s.troops : s.tactics;
      if (deck.length === 0) return;

      const newCard = deck.shift();
      if (activePlayer === 'p1') s.p1Hand.push(newCard);
      else s.p2Hand.push(newCard);

      s.scoutDrawsLeft--;
      if (s.scoutDrawsLeft <= 0 || (s.troops.length === 0 && s.tactics.length === 0)) {
        s.phase = 'SCOUT_RETURN';
        s.scoutReturnsLeft = 2;
        s.log = '选择2张手牌放回牌堆';
      } else {
        s.log = `再抽${s.scoutDrawsLeft}张牌`;
      }
      updateState(s);
    }

    // ==================== SCOUT_RETURN (return one card at a time, 2 times) ====================
    if (type === 'SCOUT_RETURN') {
      const { cardIdx: handIdx, deckType } = payload;
      const theHand = activePlayer === 'p1' ? s.p1Hand : s.p2Hand;
      if (!theHand[handIdx]) return;

      const [returnedCard] = theHand.splice(handIdx, 1);
      // Put on top of chosen deck
      if (deckType === 'TROOP') {
        s.troops.unshift(returnedCard);
      } else {
        s.tactics.unshift(returnedCard);
      }

      s.scoutReturnsLeft--;
      if (s.scoutReturnsLeft <= 0) {
        // Done with Scout, advance to next turn (Scout replaces both PLAY and DRAW)
        s.turn = s.turn === 'p1' ? 'p2' : 'p1';
        s.phase = 'PLAY';
        s.log = s.turn === 'p1' ? '轮到 P1 行动' : '轮到 P2 行动';
      } else {
        s.log = `再还${s.scoutReturnsLeft}张牌`;
      }
      updateState(s);
    }

    // ==================== REDEPLOY ====================
    if (type === 'REDEPLOY') {
      const { cardIdx: handIdx } = payload;

      // Tactic limit check
      if (!canPlayTactic(s, activePlayer)) return;

      const tacticCard = hand[handIdx];
      if (activePlayer === 'p1') s.p1Hand.splice(handIdx, 1);
      else s.p2Hand.splice(handIdx, 1);
      s.discardPile.push(tacticCard);
      if (activePlayer === 'p1') s.p1TacticsPlayed++;
      else s.p2TacticsPlayed++;

      s.phase = 'REDEPLOY_SRC';
      s.log = '调遣！选择己方旗帜上的一张卡';
      updateState(s);
    }

    // ==================== REDEPLOY_SRC (pick a card from own flag) ====================
    if (type === 'REDEPLOY_SRC') {
      const { slotIdx, cardIdx: cardIdxInSlot } = payload;
      const slot = s.board[slotIdx];
      if (slot.owner) return;
      const myCards = slot[activePlayer];
      if (!myCards[cardIdxInSlot]) return;

      const [card] = myCards.splice(cardIdxInSlot, 1);
      s.redeployCard = card;
      s.redeploySourceSlot = slotIdx;
      s.phase = 'REDEPLOY_DEST';
      s.log = '选择目标旗帜放置，或弃掉该卡';
      updateState(s);
    }

    // ==================== REDEPLOY_DEST (place or discard) ====================
    if (type === 'REDEPLOY_DEST') {
      const { slotIdx, discard } = payload;

      if (discard) {
        // Discard the card
        s.discardPile.push(s.redeployCard);
      } else {
        // Place on target flag
        const destSlot = s.board[slotIdx];
        if (destSlot.owner) return;
        if (destSlot[activePlayer].length >= flagLimit(destSlot)) return;
        destSlot[activePlayer].push(s.redeployCard);
        resolveFlag(destSlot, activePlayer);
      }

      s.redeployCard = null;
      s.redeploySourceSlot = null;
      s.winner = checkWinner(s.board);
      advanceToDraw(s);
      s.log = '调遣完成';
      updateState(s);
    }
  }, [updateState]);

  // --- Client interaction ---
  const myPlayerId = isHost ? 'p1' : 'p2';
  const isMyTurn = G.turn === myPlayerId;

  const sendAction = useCallback((action) => {
    setActionLock(true);
    if (isHost) {
      processAction(action.type, action.payload);
    } else if (connRef.current) {
      connRef.current.send({ type: 'ACTION', action, payload: action.payload });
    }
  }, [isHost, processAction]);

  /** Can I play tactic cards right now? */
  const canIPlayTactic = canPlayTactic(G, myPlayerId);

  const onCardClick = useCallback((idx) => {
    if (!isMyTurn) return;

    const hand = myPlayerId === 'p1' ? G.p1Hand : G.p2Hand;
    const card = hand[idx];
    if (!card) return;

    // --- Scout return phase: click hand cards to return them ---
    if (G.phase === 'SCOUT_RETURN') {
      setSelIdx(idx);
      setMode('SCOUT_RETURN');
      return;
    }

    if (G.phase !== 'PLAY') return;

    // --- Morale tactics: Traitor/Deserter need target mode ---
    if (card.code === 'TRAITOR' || card.code === 'DESERTER') {
      if (!canIPlayTactic) return; // dimmed
      if (selIdx === idx) {
        setSelIdx(null);
        setMode('NORMAL');
        setPendingTactic(null);
        return;
      }
      setSelIdx(idx);
      setMode('TARGET_OPP');
      setPendingTactic(card);
      return;
    }

    // --- Scout: immediately activate ---
    if (card.code === 'SCOUT') {
      if (!canIPlayTactic || actionLock) return;
      sendAction({ type: 'SCOUT', payload: { cardIdx: idx } });
      setSelIdx(null);
      setMode('NORMAL');
      return;
    }

    // --- Redeploy: immediately activate ---
    if (card.code === 'REDEPLOY') {
      if (!canIPlayTactic || actionLock) return;
      sendAction({ type: 'REDEPLOY', payload: { cardIdx: idx } });
      setSelIdx(null);
      setMode('REDEPLOY_SRC');
      return;
    }

    setMode('NORMAL');
    setPendingTactic(null);
    setTargetCard(null);
    setSelIdx(idx === selIdx ? null : idx);
  }, [isMyTurn, G.phase, G.p1Hand, G.p2Hand, myPlayerId, selIdx, canIPlayTactic, sendAction, actionLock]);

  /** Click on an opponent's card on a flag (for Traitor/Deserter) */
  const onOppCardClick = useCallback((slotIdx, cardIdx) => {
    if (!isMyTurn || actionLock) return;

    // Redeploy source: click own cards (handled in onMyCardOnFlagClick instead)
    if (mode === 'TARGET_OPP' && pendingTactic) {
      const slot = G.board[slotIdx];
      if (slot.owner) return;

      const oppSide = myPlayerId === 'p1' ? 'p2' : 'p1';
      const oppCards = slot[oppSide];
      if (!oppCards[cardIdx]) return;

      if (pendingTactic.code === 'DESERTER') {
        // Deserter: can target any card (troop or tactic)
        sendAction({
          type: 'DESERTER',
          payload: { cardIdx: selIdx, srcSlotIdx: slotIdx, srcCardIdx: cardIdx },
        });
        setSelIdx(null);
        setMode('NORMAL');
        setPendingTactic(null);
      } else if (pendingTactic.code === 'TRAITOR') {
        // Traitor: can only target troop cards
        if (oppCards[cardIdx].type !== 'TROOP') return;
        setTargetCard({ slotIdx, cardIdx });
        setMode('TARGET_SLOT');
      }
    }
  }, [isMyTurn, mode, pendingTactic, G.board, myPlayerId, selIdx, sendAction, actionLock]);

  /** Click on own card on a flag (for Redeploy source) */
  const onMyCardOnFlagClick = useCallback((slotIdx, cardIdx) => {
    if (!isMyTurn || actionLock) return;

    if (G.phase === 'REDEPLOY_SRC' || mode === 'REDEPLOY_SRC') {
      const slot = G.board[slotIdx];
      if (slot.owner) return;
      const myCards = slot[myPlayerId];
      if (!myCards[cardIdx]) return;

      sendAction({
        type: 'REDEPLOY_SRC',
        payload: { slotIdx, cardIdx },
      });
      setMode('REDEPLOY_DEST');
      return;
    }
  }, [isMyTurn, G.phase, G.board, myPlayerId, mode, sendAction, actionLock]);

  const onSlotClick = useCallback((slotIdx) => {
    if (!isMyTurn || actionLock) return;

    // Redeploy destination
    if (G.phase === 'REDEPLOY_DEST' || mode === 'REDEPLOY_DEST') {
      const destSlot = G.board[slotIdx];
      if (destSlot.owner) return;
      if (destSlot[myPlayerId].length >= flagLimit(destSlot)) return;
      sendAction({
        type: 'REDEPLOY_DEST',
        payload: { slotIdx, discard: false },
      });
      setMode('NORMAL');
      return;
    }

    if (G.phase !== 'PLAY') return;

    // Traitor destination selection
    if (mode === 'TARGET_SLOT' && pendingTactic?.code === 'TRAITOR' && targetCard) {
      const destSlot = G.board[slotIdx];
      if (destSlot.owner) return;
      if (destSlot[myPlayerId].length >= flagLimit(destSlot)) return;

      sendAction({
        type: 'TRAITOR',
        payload: {
          cardIdx: selIdx,
          srcSlotIdx: targetCard.slotIdx,
          srcCardIdx: targetCard.cardIdx,
          destSlotIdx: slotIdx,
        },
      });
      setSelIdx(null);
      setMode('NORMAL');
      setPendingTactic(null);
      setTargetCard(null);
      return;
    }

    // Normal card play
    if (selIdx === null || mode !== 'NORMAL') return;

    sendAction({
      type: 'PLAY',
      payload: { cardIdx: selIdx, slotIdx },
    });
    setSelIdx(null);
  }, [isMyTurn, G.phase, G.board, mode, pendingTactic, targetCard, myPlayerId, selIdx, sendAction, actionLock]);

  const onDrawClick = useCallback((deckType) => {
    if (!isMyTurn || actionLock) return;

    // Scout draw phase
    if (G.phase === 'SCOUT_DRAW') {
      sendAction({ type: 'SCOUT_DRAW', payload: { deckType } });
      return;
    }

    // Scout return phase: after selecting a card (selIdx), pick which deck to return to
    if (G.phase === 'SCOUT_RETURN' && mode === 'SCOUT_RETURN' && selIdx !== null) {
      sendAction({ type: 'SCOUT_RETURN', payload: { cardIdx: selIdx, deckType } });
      setSelIdx(null);
      setMode('NORMAL');
      return;
    }

    if (G.phase !== 'DRAW') return;
    sendAction({ type: 'DRAW', payload: { deckType } });
  }, [isMyTurn, G.phase, selIdx, mode, sendAction, actionLock]);

  const onClaimClick = useCallback((slotIdx) => {
    if (!isMyTurn || actionLock || G.phase !== 'PLAY') return;
    sendAction({ type: 'CLAIM', payload: { slotIdx } });
  }, [isMyTurn, G.phase, sendAction, actionLock]);

  const onRedeployDiscard = useCallback(() => {
    if (!isMyTurn || actionLock) return;
    if (G.phase !== 'REDEPLOY_DEST' && mode !== 'REDEPLOY_DEST') return;
    sendAction({ type: 'REDEPLOY_DEST', payload: { discard: true } });
    setMode('NORMAL');
  }, [isMyTurn, G.phase, mode, sendAction, actionLock]);

  return {
    G,
    setG,
    view,
    setView,
    selIdx,
    mode,
    pendingTactic,
    targetCard,
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
    updateState,
    setActionLock,
  };
}
