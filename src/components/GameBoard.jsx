import { useState } from 'react';
import Card from './Card';
import { getRank, canClaim, isWild } from '../gameLogic';
import { COMPACT_COLOR_MAP } from '../constants';

/** Compact card row bar for display inside a flag */
function CompactCard({ card, onHover, onLeave, onClick, target }) {
  let bg, text, label;
  if (card.type === 'TACTIC') {
    bg = '#334155';
    text = '#fbbf24';
    label = card.name;
  } else {
    const cm = COMPACT_COLOR_MAP[card.color] || { bg: '#333', text: '#ccc', label: '?' };
    bg = cm.bg;
    text = cm.text;
    label = `${cm.label} ${card.value}`;
  }

  return (
    <div
      className={`card-compact w-full ${target ? 'glow-border cursor-crosshair' : ''}`}
      style={{ backgroundColor: bg, color: text }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {label}
    </div>
  );
}

export default function GameBoard({
  board,
  myPlayerId,
  selIdx,
  isMyTurn,
  mode,
  phase,
  onSlotClick,
  onOppCardClick,
  onMyCardOnFlagClick,
  onClaimClick,
  discardPile,
}) {
  const oppSide = myPlayerId === 'p1' ? 'p2' : 'p1';
  const mySide = myPlayerId;
  const [hoverCard, setHoverCard] = useState(null);

  return (
    <div className="flex-1 flex items-center justify-center overflow-x-auto px-2 relative">
      <div className="flex gap-1 sm:gap-1.5">
        {board.map((slot, i) => {
          const isTargetable =
            selIdx !== null && !slot.owner && isMyTurn && mode === 'NORMAL' && phase === 'PLAY';
          const isTraitorDest = mode === 'TARGET_SLOT' && !slot.owner && isMyTurn;
          const isRedeployDest = (mode === 'REDEPLOY_DEST' || phase === 'REDEPLOY_DEST') && !slot.owner && isMyTurn;
          const isRedeploySrc = (mode === 'REDEPLOY_SRC' || phase === 'REDEPLOY_SRC') && !slot.owner && isMyTurn;
          const flagReq = slot.mud ? 4 : 3;

          const myCards = slot[mySide];
          const canClaimFlag = isMyTurn && phase === 'PLAY' && !slot.owner
            && myCards.length >= flagReq
            && canClaim(slot, mySide, board, discardPile || []);

          // Flag border and background
          let borderCls = 'border-amber-900';
          let bgStyle = {};
          if (slot.owner === mySide) {
            borderCls = 'border-blue-600';
            bgStyle = { background: 'linear-gradient(180deg, rgba(26,21,16,0.5), rgba(23,37,84,0.65))' };
          } else if (slot.owner === oppSide) {
            borderCls = 'border-red-600';
            bgStyle = { background: 'linear-gradient(180deg, rgba(69,10,10,0.5), rgba(26,21,16,0.5))' };
          }

          const glowCls = (isTargetable || isTraitorDest || isRedeployDest)
            ? 'flag-glow-target cursor-pointer' : '';

          return (
            <div
              key={i}
              onClick={() => onSlotClick(i)}
              className={`w-[72px] sm:w-[84px] wood-texture rounded-lg border-2 relative flex flex-col justify-between py-1.5 px-1 transition-all ${
                slot.mud ? 'min-h-[310px] sm:min-h-[380px]' : 'min-h-[260px] sm:min-h-[320px]'
              } ${borderCls} ${glowCls}`}
              style={bgStyle}
            >
              {/* Environment indicators */}
              {(slot.fog || slot.mud) && (
                <div className="absolute top-1 right-1 z-10 flex gap-0.5">
                  {slot.fog && <span className="text-[10px]" title="迷雾">🌫</span>}
                  {slot.mud && <span className="text-[10px]" title="泥泞">💧</span>}
                </div>
              )}

              {/* Opponent label */}
              <div className="text-[8px] text-gray-500 text-center tracking-widest select-none">对 手</div>

              {/* Opponent's cards (top) */}
              <div className="flex flex-col gap-0.5 flex-1">
                {slot[oppSide].map((c, idx) => {
                  const canTarget = mode === 'TARGET_OPP' && !slot.owner;
                  return (
                    <CompactCard
                      key={idx}
                      card={c}
                      target={canTarget}
                      onHover={() => setHoverCard({ slotIdx: i, side: 'opp', cardIdx: idx, card: c })}
                      onLeave={() => setHoverCard(null)}
                      onClick={(e) => {
                        if (canTarget) {
                          e.stopPropagation();
                          onOppCardClick(i, idx);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {/* Flag number / owner indicator */}
              <div className="z-10 flex flex-col items-center gap-0.5 my-1">
                {slot.owner === mySide ? (
                  <div className="bg-blue-700 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    🔵 {i + 1}
                  </div>
                ) : slot.owner === oppSide ? (
                  <div className="bg-red-700 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    🔴 {i + 1}
                  </div>
                ) : (
                  <div className="bg-black/70 text-yellow-500 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-800 font-bold">
                    {i + 1}
                  </div>
                )}
                {canClaimFlag && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClaimClick(i);
                    }}
                    className="text-[9px] bg-yellow-600 text-black px-2 py-0.5 rounded font-bold hover:bg-yellow-500 animate-pulse-yellow"
                  >
                    宣称
                  </button>
                )}
              </div>

              {/* My cards (bottom) */}
              <div className="flex flex-col gap-0.5 flex-1 justify-end">
                {slot[mySide].map((c, idx) => {
                  const canPickForRedeploy = isRedeploySrc && !slot.owner;
                  return (
                    <CompactCard
                      key={idx}
                      card={c}
                      target={canPickForRedeploy}
                      onHover={() => setHoverCard({ slotIdx: i, side: 'my', cardIdx: idx, card: c })}
                      onLeave={() => setHoverCard(null)}
                      onClick={(e) => {
                        if (canPickForRedeploy) {
                          e.stopPropagation();
                          onMyCardOnFlagClick(i, idx);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {/* My side label */}
              <div className="text-[8px] text-gray-500 text-center tracking-widest select-none">
                我 方{slot.mud ? <span className="text-yellow-500 ml-0.5">×4</span> : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover popover — shows full card when hovering compact row */}
      {hoverCard && (
        <div
          className="card-popover"
          style={{
            left: `${hoverCard.slotIdx * 86 + 90}px`,
            top: hoverCard.side === 'opp' ? '20px' : 'auto',
            bottom: hoverCard.side === 'my' ? '20px' : 'auto',
          }}
        >
          <Card c={hoverCard.card} />
        </div>
      )}
    </div>
  );
}
