import Card from './Card';
import { getRank, canClaim, isWild } from '../gameLogic';

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

  return (
    <div className="flex-1 flex items-center justify-center overflow-x-auto px-4">
      <div className="flex space-x-1">
        {board.map((slot, i) => {
          const isTargetable =
            selIdx !== null && !slot.owner && isMyTurn && mode === 'NORMAL' && phase === 'PLAY';
          const isTraitorDest = mode === 'TARGET_SLOT' && !slot.owner && isMyTurn;
          const isRedeployDest = (mode === 'REDEPLOY_DEST' || phase === 'REDEPLOY_DEST') && !slot.owner && isMyTurn;
          const isRedeploySrc = (mode === 'REDEPLOY_SRC' || phase === 'REDEPLOY_SRC') && !slot.owner && isMyTurn;
          const flagReq = slot.mud ? 4 : 3;

          // Check if this flag can be claimed by me
          const myCards = slot[mySide];
          const canClaimFlag = isMyTurn && phase === 'PLAY' && !slot.owner
            && myCards.length >= flagReq
            && canClaim(slot, mySide, board, discardPile || []);

          return (
            <div
              key={i}
              onClick={() => onSlotClick(i)}
              className={`w-12 sm:w-16 wood-texture rounded border-2 relative flex flex-col justify-between py-1 transition-all ${
                slot.mud ? 'h-72 sm:h-96' : 'h-64 sm:h-80'
              } ${
                isTargetable || isTraitorDest || isRedeployDest
                  ? 'border-yellow-400 cursor-pointer hover:brightness-110'
                  : 'border-black'
              }`}
            >
              {/* Fog indicator */}
              {slot.fog && (
                <div className="absolute inset-0 bg-white/20 z-0 pointer-events-none flex items-center justify-center text-2xl">
                  🌫️
                </div>
              )}

              {/* Mud indicator */}
              {slot.mud && (
                <div className="absolute top-0 right-0 z-10 text-xs bg-amber-800/80 rounded-bl px-1">
                  💧4
                </div>
              )}

              {/* Opponent's cards (top) */}
              <div className="flex flex-col space-y-[-1rem]">
                {slot[oppSide].map((c, idx) => {
                  const canTarget =
                    mode === 'TARGET_OPP' && !slot.owner;
                  return (
                    <div
                      key={idx}
                      className="scale-75 origin-top"
                      onClick={(e) => {
                        if (canTarget) {
                          e.stopPropagation();
                          onOppCardClick(i, idx);
                        }
                      }}
                    >
                      <Card c={c} target={canTarget} />
                    </div>
                  );
                })}
              </div>

              {/* Flag number / owner indicator */}
              <div className="z-10 flex flex-col items-center gap-0.5">
                <div className="bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs border border-yellow-600">
                  {slot.owner ? (slot.owner === myPlayerId ? '🔵' : '🔴') : i + 1}
                </div>
                {/* Claim button */}
                {canClaimFlag && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClaimClick(i);
                    }}
                    className="text-[8px] bg-yellow-600 text-black px-1 rounded font-bold hover:bg-yellow-500 animate-pulse-yellow"
                  >
                    宣称
                  </button>
                )}
              </div>

              {/* My cards (bottom) */}
              <div className="flex flex-col-reverse space-y-[-1rem] space-y-reverse">
                {slot[mySide].map((c, idx) => {
                  const canPickForRedeploy = isRedeploySrc && !slot.owner;
                  return (
                    <div
                      key={idx}
                      className="scale-75 origin-bottom"
                      onClick={(e) => {
                        if (canPickForRedeploy) {
                          e.stopPropagation();
                          onMyCardOnFlagClick(i, idx);
                        }
                      }}
                    >
                      <Card c={c} target={canPickForRedeploy} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
