import Card from './Card';
import GameHeader from './GameHeader';
import GameOverlay from './GameOverlay';
import GameBoard from './GameBoard';
import DrawPanel from './DrawPanel';

export default function Game({
  G,
  myPlayerId,
  isMyTurn,
  selIdx,
  mode,
  canIPlayTactic,
  onCardClick,
  onSlotClick,
  onOppCardClick,
  onMyCardOnFlagClick,
  onDrawClick,
  onClaimClick,
  onRedeployDiscard,
}) {
  const myHand = myPlayerId === 'p1' ? G.p1Hand : G.p2Hand;
  const oppHandCount = myPlayerId === 'p1' ? G.p2Hand.length : G.p1Hand.length;

  // Determine mode indicator text
  let modeText = null;
  if (mode === 'TARGET_OPP') {
    modeText = '选择对方旗帜上的一张卡';
  } else if (mode === 'TARGET_SLOT') {
    modeText = '选择己方旗帜放置卡牌';
  } else if (G.phase === 'SCOUT_DRAW') {
    modeText = `侦察兵：选择牌堆抽牌（还需抽${G.scoutDrawsLeft}张）`;
  } else if (G.phase === 'SCOUT_RETURN') {
    if (selIdx !== null) {
      modeText = `选择放回哪个牌堆（还需还${G.scoutReturnsLeft}张）`;
    } else {
      modeText = `选择手牌放回牌堆（还需还${G.scoutReturnsLeft}张）`;
    }
  } else if (G.phase === 'REDEPLOY_SRC' || mode === 'REDEPLOY_SRC') {
    modeText = '调遣：选择己方旗帜上的一张卡';
  } else if (G.phase === 'REDEPLOY_DEST' || mode === 'REDEPLOY_DEST') {
    modeText = '调遣：选择目标旗帜，或点击弃牌';
  }

  const modeColor = mode === 'TARGET_OPP' ? 'bg-red-900/90'
    : mode === 'TARGET_SLOT' ? 'bg-blue-900/90'
    : 'bg-amber-800/90';

  return (
    <div className="min-h-screen flex flex-col parchment select-none relative">
      <GameHeader isMyTurn={isMyTurn} winner={G.winner} myPlayerId={myPlayerId} />

      <GameOverlay winner={G.winner} myPlayerId={myPlayerId} board={G.board} />

      {/* Mode indicator */}
      {modeText && isMyTurn && (
        <div className={`absolute top-14 left-1/2 -translate-x-1/2 z-30 ${modeColor} text-white px-4 py-1 rounded text-sm animate-pulse`}>
          {modeText}
        </div>
      )}

      {/* Opponent Hand (Hidden) */}
      <div className="h-16 flex justify-center -space-x-2 mt-2 opacity-80">
        {Array(oppHandCount).fill(0).map((_, i) => (
          <Card key={i} />
        ))}
      </div>

      {/* Board */}
      <GameBoard
        board={G.board}
        myPlayerId={myPlayerId}
        selIdx={selIdx}
        isMyTurn={isMyTurn}
        mode={mode}
        phase={G.phase}
        onSlotClick={onSlotClick}
        onOppCardClick={onOppCardClick}
        onMyCardOnFlagClick={onMyCardOnFlagClick}
        onClaimClick={onClaimClick}
        discardPile={G.discardPile}
      />

      {/* Draw Panel */}
      <DrawPanel
        G={G}
        isMyTurn={isMyTurn}
        onDrawClick={onDrawClick}
        phase={G.phase}
        mode={mode}
        selIdx={selIdx}
      />

      {/* Redeploy discard button */}
      {isMyTurn && (G.phase === 'REDEPLOY_DEST' || mode === 'REDEPLOY_DEST') && (
        <div className="absolute top-1/2 left-2 transform -translate-y-1/2 z-20">
          <button
            onClick={onRedeployDiscard}
            className="bg-red-800 border-2 border-red-500 px-3 py-2 rounded text-xs text-white shadow-lg hover:scale-110 transition"
          >
            弃掉此卡
          </button>
        </div>
      )}

      {/* My Hand */}
      <div className="h-24 sm:h-32 flex justify-center items-end -space-x-2 mb-2 px-4 overflow-x-visible">
        {myHand.map((c, i) => {
          // Dim tactic cards when tactic limit reached
          const isDimmed = c.type === 'TACTIC' && !canIPlayTactic && G.phase === 'PLAY';
          // Highlight cards during Scout return
          const isScoutReturn = G.phase === 'SCOUT_RETURN' && isMyTurn;

          return (
            <div
              key={c.id || i}
              className={`transition-transform duration-200 ${
                isMyTurn && (G.phase === 'PLAY' || isScoutReturn)
                  ? isDimmed ? 'opacity-40 grayscale' : 'hover:-translate-y-4 cursor-pointer'
                  : 'opacity-80'
              }`}
            >
              <Card
                c={c}
                onClick={() => onCardClick(i)}
                sel={selIdx === i}
                dim={isDimmed}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
